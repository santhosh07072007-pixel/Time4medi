/// <reference lib="webworker" />

import { precacheAndRoute } from 'workbox-precaching';

// Service worker type augmentation
declare let self: ServiceWorkerGlobalScope & typeof globalThis;

declare const self: ServiceWorkerGlobalScope;

// Constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 60000; // 1 minute
const NOTIFICATION_STORE = 'notifications';

// Types
interface NotificationAction {
  action: string;
  title: string;
}

interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
  soundUrl?: string;
  scheduledTime: number;
  data?: Record<string, unknown>;
}

// State
const scheduledTimeouts = new Map<string, number>();
const retryAttempts = new Map<string, number>();

declare const self: ServiceWorkerGlobalScope & {
  registration: ServiceWorkerRegistration & {
    periodicSync?: {
      register(tag: string, options: { minInterval: number }): Promise<void>;
    };
  };
};

interface NotificationAction {
  action: string;
  title: string;
}

interface NotificationData {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: NotificationAction[];
  soundUrl?: string;
  scheduledTime: number;
  data?: {
    type?: string;
    medicineId?: string;
    [key: string]: unknown;
  };
}

precacheAndRoute(self.__WB_MANIFEST);

const scheduledTimeouts = new Map<string, number>();
const NOTIFICATION_STORE = 'scheduled-notifications';
const RETRY_DELAY = 60000; // 1 minute
const MAX_RETRIES = 3;

// Keep track of notification attempts
interface NotificationAttempt {
  retries: number;
  lastAttempt: number;
}
const notificationAttempts = new Map<string, NotificationAttempt>();

// Request wake lock
const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      console.log('Wake Lock is active');
      return wakeLock;
    }
  } catch (err) {
    console.log('Wake Lock error:', err);
  }
  return null;
};

interface AudioContextType {
  createBufferSource(): AudioBufferSourceNode;
  decodeAudioData(buffer: ArrayBuffer): Promise<AudioBuffer>;
  destination: AudioDestinationNode;
}

declare const AudioContext: {
  new(): AudioContextType;
} | undefined;

declare const webkitAudioContext: {
  new(): AudioContextType;
} | undefined;

const showNotificationWithSound = async (notificationData: ExtendedNotificationData) => {
  const { title, body, icon, badge, tag, requireInteraction, silent, actions, soundUrl } = notificationData;

  try {
    if (soundUrl && !silent) {
      try {
        const cachedSound = await caches.match(soundUrl);
        if (cachedSound) {
          const audioBlob = await cachedSound.blob();
          const audioUrl = URL.createObjectURL(audioBlob);

          const AudioContextImpl = AudioContext || webkitAudioContext;
          if (AudioContextImpl) {
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioContext = new AudioContextImpl();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            source.start(0);
            console.log('Service Worker: Playing cached notification sound');
          }
        }
      } catch (audioError) {
        console.error('Service Worker: Error playing sound:', audioError);
      }
    }

    await self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      requireInteraction,
      silent,
      vibrate,
      actions,
      data: { ...notificationData, timestamp: Date.now() }
    });
    console.log('Service Worker: Notification shown:', title);

  } catch (error) {
    console.error('Service Worker: Error showing notification:', error);
  }
};

interface RetryData {
  maxRetries: number;
  retryDelay: number;
  currentRetry: number;
}

interface ExtendedNotificationData extends NotificationData {
  retryData?: RetryData;
}

async function handleNotificationFailure(notificationData: ExtendedNotificationData) {
  const { retryData } = notificationData;
  if (!retryData || retryData.currentRetry >= retryData.maxRetries) {
    console.error('Max retries reached for notification:', notificationData.id);
    return;
  }

  retryData.currentRetry++;
  const retryDelay = retryData.retryDelay * Math.pow(2, retryData.currentRetry - 1);
  
  console.log(`Scheduling retry ${retryData.currentRetry} for notification ${notificationData.id} in ${retryDelay/1000}s`);
  
  const timeoutId = self.setTimeout(async () => {
    try {
      await showNotificationWithSound(notificationData);
      console.log(`Retry ${retryData.currentRetry} successful for notification ${notificationData.id}`);
    } catch (error) {
      console.error(`Retry ${retryData.currentRetry} failed for notification ${notificationData.id}:`, error);
      await handleNotificationFailure(notificationData);
    }
  }, retryDelay);
  
  scheduledTimeouts.set(`${notificationData.id}-retry-${retryData.currentRetry}`, timeoutId);
}

// Handle notification scheduling
const handleScheduleNotification = async (notificationData: ExtendedNotificationData) => {
  const now = Date.now();
  const timeUntilNotification = notificationData.scheduledTime - now;

  if (timeUntilNotification <= 0) {
    console.log('Service Worker: Notification time already passed, showing immediately');
    try {
      await showNotificationWithSound(notificationData);
    } catch (error) {
      console.error('Immediate notification failed:', error);
      await handleNotificationFailure(notificationData);
    }
  } else {
    const timeoutId = self.setTimeout(async () => {
      try {
        await showNotificationWithSound(notificationData);
        scheduledTimeouts.delete(notificationData.id);
      } catch (error) {
        console.error('Scheduled notification failed:', error);
        await handleNotificationFailure(notificationData);
      }
    }, timeUntilNotification) as unknown as number;
    
    scheduledTimeouts.set(notificationData.id, timeoutId);
    console.log(`Service Worker: Scheduled notification for ${notificationData.title} in ${timeUntilNotification}ms`);
  }
};

// Handle notification clearing
const handleClearNotification = (notificationId: string) => {
  if (scheduledTimeouts.has(notificationId)) {
    clearTimeout(scheduledTimeouts.get(notificationId));
    scheduledTimeouts.delete(notificationId);
    console.log(`Service Worker: Cleared scheduled notification for ID: ${notificationId}`);
  }
};

self.addEventListener('message', (event) => {
  if (event.data?.type) {
    switch (event.data.type) {
      case 'SCHEDULE_NOTIFICATION': {
        const { data } = event.data as { data: ExtendedNotificationData };
        void handleScheduleNotification(data);
        break;
      }
      case 'CLEAR_NOTIFICATION': {
        const { id } = event.data as { id: string };
        handleClearNotification(id);
        break;
      }

        if (scheduledTimeouts.has(notificationData.id)) {
          clearTimeout(scheduledTimeouts.get(notificationData.id));
        }

        if (timeUntilNotification <= 0) {
          console.log('Service Worker: Notification time already passed, showing immediately');
          await attemptNotification(notificationData);
        } else {
          // Schedule with retry mechanism
          const timeoutId = self.setTimeout(async () => {
            await attemptNotification(notificationData);
            scheduledTimeouts.delete(notificationData.id);
          }, timeUntilNotification) as unknown as number;
          
          scheduledTimeouts.set(notificationData.id, timeoutId);
          
          // Store notification data for recovery
          await saveNotificationToStore(notificationData);
          
          // Set up periodic check for missed notifications
          setUpPeriodicSync();
          
          console.log(`Service Worker: Scheduled notification for ${notificationData.title} in ${timeUntilNotification}ms`);
        }

async function attemptNotification(notificationData: NotificationData) {
  const attempt = notificationAttempts.get(notificationData.id) || { retries: 0, lastAttempt: 0 };
  
  try {
    await showNotificationWithSound(notificationData);
    notificationAttempts.delete(notificationData.id);
    await removeNotificationFromStore(notificationData.id);
  } catch (error) {
    console.error('Failed to show notification:', error);
    
    if (attempt.retries < MAX_RETRIES) {
      attempt.retries++;
      attempt.lastAttempt = Date.now();
      notificationAttempts.set(notificationData.id, attempt);
      
      // Schedule retry
      self.setTimeout(() => {
        attemptNotification(notificationData);
      }, RETRY_DELAY * Math.pow(2, attempt.retries - 1)); // Exponential backoff
    }
  }
}

async function saveNotificationToStore(notificationData: NotificationData) {
  const db = await openDb();
  const tx = db.transaction(NOTIFICATION_STORE, 'readwrite');
  const store = tx.objectStore(NOTIFICATION_STORE);
  await store.put(notificationData);
}

async function removeNotificationFromStore(notificationId: string) {
  const db = await openDb();
  const tx = db.transaction(NOTIFICATION_STORE, 'readwrite');
  const store = tx.objectStore(NOTIFICATION_STORE);
  await store.delete(notificationId);
}

async function openDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('notifications-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(NOTIFICATION_STORE)) {
        db.createObjectStore(NOTIFICATION_STORE, { keyPath: 'id' });
      }
    };
  });
}

// Set up periodic sync for reliability
async function setUpPeriodicSync() {
  try {
    if ('periodicSync' in self.registration) {
      const status = await (navigator as any).permissions.query({
        name: 'periodic-background-sync',
      });
      
      if (status.state === 'granted') {
        await self.registration.periodicSync.register('check-notifications', {
          minInterval: 60 * 60 * 1000, // 1 hour
        });
      }
    }
  } catch (error) {
    console.log('Periodic sync could not be registered:', error);
  }
}
        break;

      case 'CLEAR_NOTIFICATION':
        const { id: notificationIdToClear } = event.data;
        if (scheduledTimeouts.has(notificationIdToClear)) {
          clearTimeout(scheduledTimeouts.get(notificationIdToClear));
          scheduledTimeouts.delete(notificationIdToClear);
          console.log(`Service Worker: Cleared scheduled notification for ID: ${notificationIdToClear}`);
        }
        break;

      case 'KEEP_ALIVE':
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ status: 'alive', timestamp: Date.now() });
        }
        break;

      case 'CACHE_SOUND':
        const { soundUrl } = event.data;
        if (soundUrl) {
          caches.open('notification-sounds-v1').then(cache => {
            cache.add(soundUrl).catch(error => {
              console.error('Failed to cache sound:', error);
            });
          });
        }
        break;

      default:
        console.log('Service Worker: Unknown message type:', event.data.type);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked:', event.notification.tag);
  event.notification.close();

  if (event.action === 'taken') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if (client.url && client.url.includes(self.location.origin)) {
            client.postMessage({
              type: 'MEDICINE_TAKEN',
              data: event.notification.data
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/?action=medicine-taken');
        }
      })
    );
  } else if (event.action === 'snooze') {
    const snoozeTime = 5 * 60 * 1000;
    const newNotificationData = {
      ...event.notification.data,
      scheduledTime: Date.now() + snoozeTime,
      title: `${event.notification.data.title} (Snoozed)`,
      body: `Reminder: ${event.notification.data.body}`
    };

    self.setTimeout(() => {
      showNotificationWithSound(newNotificationData);
    }, snoozeTime);
  } else {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (const client of clientList) {
          if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');

  if (event.data) {
    try {
      const pushData = event.data.json();
      event.waitUntil(
        showNotificationWithSound({
          id: pushData.id || 'push-notification',
          title: pushData.title || 'Time4Medi',
          body: pushData.body || 'You have a new notification',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: pushData.tag || 'push-notification',
          requireInteraction: true,
          actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
          ],
          soundUrl: pushData.soundUrl || 'https://freesound.org/data/previews/403/403007_5121236-lq.mp3'
        })
      );
    } catch (error) {
      console.error('Error handling push event:', error);
    }
  }
});
