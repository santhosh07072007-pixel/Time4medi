// Offline functionality utilities for Time4Medi mobile app

export interface OfflineData {
  id: string;
  type: 'medicine' | 'user' | 'update';
  data: any;
  timestamp: number;
  synced: boolean;
}

// Check if the app is online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Store data for offline sync
export const storeOfflineData = (type: string, data: any): void => {
  try {
    const offlineData: OfflineData = {
      id: crypto.randomUUID(),
      type: type as 'medicine' | 'user' | 'update',
      data,
      timestamp: Date.now(),
      synced: false
    };

    const existingData = JSON.parse(localStorage.getItem('offline_data') || '[]');
    existingData.push(offlineData);
    localStorage.setItem('offline_data', JSON.stringify(existingData));
    
    console.log('Stored offline data:', offlineData);
  } catch (error) {
    console.error('Error storing offline data:', error);
  }
};

// Get all offline data
export const getOfflineData = (): OfflineData[] => {
  try {
    return JSON.parse(localStorage.getItem('offline_data') || '[]');
  } catch (error) {
    console.error('Error getting offline data:', error);
    return [];
  }
};

// Mark data as synced
export const markDataAsSynced = (id: string): void => {
  try {
    const offlineData = getOfflineData();
    const updatedData = offlineData.map(item => 
      item.id === id ? { ...item, synced: true } : item
    );
    localStorage.setItem('offline_data', JSON.stringify(updatedData));
  } catch (error) {
    console.error('Error marking data as synced:', error);
  }
};

// Clear synced data
export const clearSyncedData = (): void => {
  try {
    const offlineData = getOfflineData();
    const unsyncedData = offlineData.filter(item => !item.synced);
    localStorage.setItem('offline_data', JSON.stringify(unsyncedData));
  } catch (error) {
    console.error('Error clearing synced data:', error);
  }
};

// Sync offline data when connection is restored
export const syncOfflineData = async (): Promise<void> => {
  if (!isOnline()) {
    console.log('Cannot sync - device is offline');
    return;
  }

  const offlineData = getOfflineData().filter(item => !item.synced);
  
  if (offlineData.length === 0) {
    console.log('No offline data to sync');
    return;
  }

  console.log(`Syncing ${offlineData.length} offline items`);

  for (const item of offlineData) {
    try {
      // Process different types of offline data
      switch (item.type) {
        case 'medicine':
          await syncMedicineData(item);
          break;
        case 'user':
          await syncUserData(item);
          break;
        case 'update':
          await syncUpdateData(item);
          break;
        default:
          console.warn('Unknown offline data type:', item.type);
      }
      
      markDataAsSynced(item.id);
    } catch (error) {
      console.error('Error syncing item:', item.id, error);
    }
  }

  // Clean up synced data
  clearSyncedData();
};

// Sync medicine data
const syncMedicineData = async (item: OfflineData): Promise<void> => {
  // Since we're using localStorage, just ensure data consistency
  console.log('Syncing medicine data:', item.data.name);
  // In a real app, this would sync with a server
};

// Sync user data
const syncUserData = async (item: OfflineData): Promise<void> => {
  console.log('Syncing user data:', item.data.name);
  // In a real app, this would sync with a server
};

// Sync update data
const syncUpdateData = async (item: OfflineData): Promise<void> => {
  console.log('Syncing update data:', item.id);
  // In a real app, this would sync with a server
};

// Listen for online/offline events
export const setupOfflineListeners = (): void => {
  window.addEventListener('online', () => {
    console.log('Device came online - syncing data');
    syncOfflineData();
    
    // Show online notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Time4Medi - Back Online', {
        body: 'Your device is back online. Syncing your data...',
        icon: '/pwa-192x192.png',
        tag: 'online-status'
      });
    }
  });

  window.addEventListener('offline', () => {
    console.log('Device went offline - enabling offline mode');
    
    // Show offline notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Time4Medi - Offline Mode', {
        body: 'You\'re now offline. Your data will be saved and synced when you\'re back online.',
        icon: '/pwa-192x192.png',
        tag: 'offline-status'
      });
    }
  });
};

// Cache important data for offline use
export const cacheEssentialData = (): void => {
  try {
    // Cache user data
    const users = JSON.parse(localStorage.getItem('local_users') || '[]');
    if (users.length > 0) {
      localStorage.setItem('cached_users', JSON.stringify(users));
    }

    // Cache medicine data for all users
    users.forEach((user: any) => {
      const medicines = JSON.parse(localStorage.getItem(`time4medi_user_medicines_${user.id}`) || '[]');
      if (medicines.length > 0) {
        localStorage.setItem(`cached_medicines_${user.id}`, JSON.stringify(medicines));
      }
    });

    console.log('Essential data cached for offline use');
  } catch (error) {
    console.error('Error caching essential data:', error);
  }
};

// Load cached data when offline
export const loadCachedData = (): void => {
  if (isOnline()) {
    return; // Use live data when online
  }

  try {
    // Load cached users
    const cachedUsers = localStorage.getItem('cached_users');
    if (cachedUsers && !localStorage.getItem('local_users')) {
      localStorage.setItem('local_users', cachedUsers);
    }

    // Load cached medicines
    const users = JSON.parse(localStorage.getItem('local_users') || '[]');
    users.forEach((user: any) => {
      const cachedMedicines = localStorage.getItem(`cached_medicines_${user.id}`);
      if (cachedMedicines && !localStorage.getItem(`time4medi_user_medicines_${user.id}`)) {
        localStorage.setItem(`time4medi_user_medicines_${user.id}`, cachedMedicines);
      }
    });

    console.log('Loaded cached data for offline use');
  } catch (error) {
    console.error('Error loading cached data:', error);
  }
};