// Enhanced notification system for PWA with immediate and background notifications
import { Medicine } from '../types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined' && typeof navigator !== 'undefined';

// Check if we're on a mobile device
const isMobile = () => {
  if (!isBrowser) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && 'ontouchstart' in window);
};

// Check if iOS
const isIOS = () => {
  if (!isBrowser) return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Check if Android
const isAndroid = () => {
  if (!isBrowser) return false;
  return /Android/i.test(navigator.userAgent);
};

export const requestNotificationPermission = async () => {
  try {
    // Check if notifications are supported
    if (!isBrowser || !('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }
    
    // Special handling for mobile devices
    if (isMobile()) {
      // iOS requires user interaction for notifications
      if (isIOS() && !document.hasFocus()) {
        console.log('iOS requires user interaction for notifications');
        return null;
      }
      console.log('Mobile device detected, requesting notification permission');
    }
    
    // Request permission
    let permission;
    if (typeof Notification.requestPermission === 'function') {
      permission = await Notification.requestPermission();
    } else {
      // Fallback for older browsers
      permission = Notification.permission;
    }
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return permission;
    } else {
      console.log('Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Send immediate notification when medicine is added
export const sendMedicineAddedNotification = async (medicine: Medicine, soundUrl?: string) => {
  try {
    if (!isBrowser) return;
    
    const defaultSoundUrl = soundUrl || 'https://freesound.org/data/previews/403/403007_5121236-lq.mp3';
    
    // Play sound first (with mobile-specific handling)
    try {
      const audio = new Audio(defaultSoundUrl);
      audio.volume = 0.8; // Slightly lower volume for mobile
      audio.preload = 'auto';
      
      // Mobile devices often require user interaction for audio
      if (isMobile()) {
        // For iOS, audio might not play without user interaction
        if (isIOS()) {
          console.log('iOS detected - audio may not play without user interaction');
        }
        // Try to play with timeout
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.log('Mobile audio play failed (expected):', e));
        }
      } else {
        try {
          await audio.play();
        } catch (e) {
          console.log('Audio play failed:', e);
        }
      }
    } catch (audioError) {
      console.log('Audio playback failed:', audioError);
    }
    
    // Show notification
    if (Notification.permission === 'granted') {
      const notification = new Notification(`Medicine Added: ${medicine.name}`, {
        body: `Reminder set for ${medicine.time}. You'll be notified to take ${medicine.dosage}.`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `medicine-added-${medicine.id}`,
        requireInteraction: true,
        silent: isMobile() ? true : false, // Mobile handles sound differently
        vibrate: isMobile() ? [200, 100, 200, 100, 200] : undefined,
        data: { medicineId: medicine.id, type: 'medicine_added' },
        actions: [
          {
            action: 'ok',
            title: 'Got it!'
          }
        ]
      });
      
      notification.onclick = () => {
        if (isBrowser) {
          window.focus();
          // For mobile, try to bring app to foreground
          if (isMobile() && 'serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
              if (registration.active) {
                registration.active.postMessage({ type: 'FOCUS_APP' });
              }
            });
          }
        }
        notification.close();
      };
      
      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  } catch (error) {
    console.error('Error sending medicine added notification:', error);
  }
};

// Store for in-memory notification scheduling (fallback when no service worker)
const scheduledNotifications = new Map<string, NodeJS.Timeout>();

// Schedule notification with service worker or fallback to setTimeout
// Calculate next occurrence of a time accounting for timezone and DST
const getNextOccurrence = (timeStr: string) => {
  const now = new Date();
  const [rawTime, period] = timeStr.split(' ');
  let [hours, minutes] = rawTime.split(':').map(Number);

  // Convert to 24 hour format
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  // Create target time for today
  const targetTime = new Date();
  targetTime.setHours(hours, minutes, 0, 0);

  // If time already passed today, schedule for tomorrow
  if (targetTime <= now) {
    targetTime.setDate(targetTime.getDate() + 1);
  }

  // Account for timezone changes and DST
  const timeUntilTarget = targetTime.getTime() - now.getTime();
  const userTimezoneOffset = targetTime.getTimezoneOffset() * 60 * 1000;
  const adjustedTime = targetTime.getTime() - userTimezoneOffset;

  return {
    scheduledTime: adjustedTime,
    timeUntil: timeUntilTarget
  };
};

// Maximum number of retries for failed notifications
const MAX_RETRIES = 3;
const RETRY_DELAY = 60000; // 1 minute

export const scheduleNotification = async (medicine: Medicine, soundUrl: string) => {
  if (!isBrowser) return;

  const { scheduledTime: nextTime, timeUntil } = getNextOccurrence(medicine.time);
  const notificationId = `medicine-${medicine.id}`;

  // Save notification data for retry tracking
  const storedNotification: StoredNotification = {
    id: notificationId,
    scheduledTime: nextTime,
    medicine,
    soundUrl,
    retryCount: 0,
    lastAttempt: 0
  };
  
  saveScheduledNotificationToStorage(storedNotification);

  // Enhanced notification data
  const notificationData = {
    id: notificationId,
    title: `Time to take medicine`,
    body: `${medicine.name} - ${medicine.dosage}`,
    scheduledTime: nextTime,
    soundUrl: soundUrl,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: notificationId,
    requireInteraction: true,
    silent: isMobile() ? true : false,
    vibrate: isMobile() ? [200, 100, 200, 100, 200] : undefined,
    actions: [
      { action: 'taken', title: 'Taken ✓' },
      { action: 'snooze', title: 'Snooze 5min' }
    ],
    medicine: medicine
  };

  // Enhanced service worker scheduling with retry mechanism
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        // Send notification data to service worker with retry info
        registration.active.postMessage({
          type: 'SCHEDULE_NOTIFICATION',
          data: {
            ...notificationData,
            retryData: {
              maxRetries: MAX_RETRIES,
              retryDelay: RETRY_DELAY,
              currentRetry: 0
            }
          }
        });

        // Set up periodic check for missed notifications
        await registration.periodicSync.register('check-notifications', {
          minInterval: 60 * 60 * 1000 // Check every hour
        }).catch(() => {
          console.log('Periodic sync not available, will use fallback');
        });

        console.log(`Notification scheduled for ${medicine.name} at ${medicine.time} via Service Worker with retry support.`);
      }
    } catch (error) {
      console.warn('Service Worker scheduling failed, using fallback:', error);
      scheduleFallbackNotification(storedNotification);
    }
  } else {
    // Enhanced fallback system with retry support
    console.log('Service Workers not supported, using enhanced fallback notification system');
    scheduleFallbackNotification(notificationId, timeUntilNotification, medicine, soundUrl);
  }

  // Also save to localStorage for persistence across page reloads
  saveScheduledNotificationToStorage(notificationData);
};

// Enhanced fallback notification system with retry support
const scheduleFallbackNotification = async (notification: StoredNotification) => {
  // Clear any existing timeout
  if (scheduledNotifications.has(notification.id)) {
    clearTimeout(scheduledNotifications.get(notification.id)!);
  }

  const now = Date.now();
  const timeUntilNext = notification.scheduledTime - now;

  if (timeUntilNext > 0) {
    const timeoutId = setTimeout(async () => {
      try {
        await showNotificationNow(notification.medicine, notification.soundUrl);
        scheduledNotifications.delete(notification.id);
        
        // Clear retry count on success
        notification.retryCount = 0;
        notification.lastAttempt = Date.now();
        saveScheduledNotificationToStorage(notification);
      } catch (error) {
        console.error('Fallback notification failed:', error);
        
        // Implement retry logic
        if (notification.retryCount < MAX_RETRIES) {
          notification.retryCount++;
          notification.lastAttempt = Date.now();
          saveScheduledNotificationToStorage(notification);
          
          // Schedule retry with exponential backoff
          const retryDelay = RETRY_DELAY * Math.pow(2, notification.retryCount - 1);
          setTimeout(() => {
            scheduleFallbackNotification(notification);
          }, retryDelay);
        }
      }
    }, timeUntilNext);

    scheduledNotifications.set(notification.id, timeoutId);
    console.log(`Enhanced fallback notification scheduled for ${notification.medicine.name} in ${Math.round(timeUntilNext / 1000 / 60)} minutes`);
  }
};

// Show notification immediately
const showNotificationNow = async (medicine: Medicine, soundUrl: string) => {
  try {
    // Play sound
    if (soundUrl) {
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      audio.play().catch(err => console.warn('Could not play sound:', err));
    }

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`Time to take medicine`, {
        body: `${medicine.name} - ${medicine.dosage}`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `medicine-${medicine.id}`,
        requireInteraction: true,
        vibrate: isMobile() ? [200, 100, 200, 100, 200] : undefined,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } else {
      // Fallback: show in-page alert
      alert(`Time to take your medicine!\n\n${medicine.name} - ${medicine.dosage}`);
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

interface StoredNotification {
  id: string;
  scheduledTime: number;
  medicine: Medicine;
  soundUrl: string;
  retryCount: number;
  lastAttempt: number;
}

// Save scheduled notification to localStorage with retry tracking
const saveScheduledNotificationToStorage = (notificationData: StoredNotification) => {
  try {
    const scheduled = JSON.parse(localStorage.getItem('scheduled_notifications') || '[]') as StoredNotification[];
    const existing = scheduled.findIndex((n) => n.id === notificationData.id);

    if (existing >= 0) {
      scheduled[existing] = notificationData;
    } else {
      scheduled.push(notificationData);
    }

    localStorage.setItem('scheduled_notifications', JSON.stringify(scheduled));
  } catch (error) {
    console.error('Error saving notification to storage:', error);
  }
};

// Send test notification
export const sendTestNotification = async (soundUrl?: string) => {
  try {
    if (!isBrowser) return;
    
    const defaultSoundUrl = soundUrl || 'https://freesound.org/data/previews/403/403007_5121236-lq.mp3';
    
    // Play test sound (with mobile handling)
    try {
      const audio = new Audio(defaultSoundUrl);
      audio.volume = 0.8;
      audio.preload = 'auto';
      
      if (isMobile()) {
        // Add user interaction check for mobile
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.log('Mobile test sound failed (expected):', e));
        }
      } else {
        try {
          await audio.play();
        } catch (e) {
          console.log('Test audio play failed:', e);
        }
      }
    } catch (audioError) {
      console.log('Test audio playback failed:', audioError);
    }
    
    // Show test notification
    if (Notification.permission === 'granted') {
      const notification = new Notification('Time4Medi Test Notification', {
        body: 'Notifications are working! You will receive medicine reminders even when the app is closed.',
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'test-notification',
        requireInteraction: true,
        silent: isMobile() ? true : false,
        vibrate: isMobile() ? [200, 100, 200, 100, 200] : undefined,
        data: { type: 'test_notification' },
        actions: [
          {
            action: 'ok',
            title: 'Got it!'
          }
        ]
      });
      
      notification.onclick = () => {
        if (isBrowser) {
          window.focus();
          if (isMobile()) {
            // Try to focus the app on mobile
            try {
              if (window.parent && window.parent !== window) {
                window.parent.focus();
              }
            } catch (e) {
              console.log('Could not focus parent window:', e);
            }
          }
        }
        notification.close();
      };
      setTimeout(() => notification.close(), 10000);
    }
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};

// Initialize background notification system
export const initializeBackgroundNotifications = () => {
  if (!isBrowser) return;

  if ('serviceWorker' in navigator) {
    // VitePWA plugin handles service worker registration
    navigator.serviceWorker.ready.then(registration => {
      console.log('Service Worker ready - using service worker for notifications');

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.type === 'NOTIFICATION_CLICKED') {
          // Handle notification click
        }
        if (event.data.type === 'MEDICINE_TAKEN') {
          // Handle medicine taken action
          console.log('Medicine marked as taken:', event.data.data);
        }
      });

      // Send periodic keep-alive messages to maintain service worker
      setInterval(() => {
        if (registration.active) {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            if (event.data.status === 'alive') {
              // Service worker is alive
            }
          };
          registration.active.postMessage(
            { type: 'KEEP_ALIVE' },
            [channel.port2]
          );
        }
      }, 30000); // Every 30 seconds
    }).catch(error => {
      console.log('Service Worker not available, using fallback notification system');
      console.log('This is normal for environments like StackBlitz');
    });
  } else {
    console.log('Service Workers not supported - using fallback notification system');
    console.log('Notifications will work while the tab is open');
  }
};

// Clear scheduled notifications for a medicine
export const clearScheduledNotification = (medicineId: string) => {
  if (!isBrowser) return;

  const notificationId = `medicine-${medicineId}`;

  // Clear in-memory timeout (fallback system)
  if (scheduledNotifications.has(notificationId)) {
    clearTimeout(scheduledNotifications.get(notificationId)!);
    scheduledNotifications.delete(notificationId);
    console.log(`Cleared in-memory timeout for: ${notificationId}`);
  }

  // Inform service worker to clear its scheduled timeout
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_NOTIFICATION',
      id: notificationId
    });
    console.log(`Requested Service Worker to clear notification for ID: ${notificationId}`);
  }

  // Clear from localStorage
  const existingNotifications = JSON.parse(localStorage.getItem('scheduled_notifications') || '[]');
  const updatedNotifications = existingNotifications.filter((n: any) => n.id !== notificationId);
  localStorage.setItem('scheduled_notifications', JSON.stringify(updatedNotifications));
};

// Reschedule all active notifications (call this when app starts)
export const rescheduleAllNotifications = () => {
  if (!isBrowser) return;
  
  const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
  const defaultSoundUrl = 'https://freesound.org/data/previews/403/403007_5121236-lq.mp3';
  localUsers.forEach((user: any) => {
    const medicines = JSON.parse(localStorage.getItem(`time4medi_user_medicines_${user.id}`) || '[]');
    medicines.forEach((medicine: Medicine) => {
      if (medicine.is_active) {
        scheduleNotification(medicine, defaultSoundUrl);
      }
    });
  });
};