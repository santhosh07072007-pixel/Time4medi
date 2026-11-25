import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { isOnline, syncOfflineData, getOfflineData } from '../utils/offline';

export const OfflineIndicator: React.FC = () => {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [offlineDataCount, setOfflineDataCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      handleSync();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    const updateOfflineDataCount = () => {
      const offlineData = getOfflineData().filter(item => !item.synced);
      setOfflineDataCount(offlineData.length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update offline data count periodically
    const interval = setInterval(updateOfflineDataCount, 5000);
    updateOfflineDataCount(); // Initial count

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleSync = async () => {
    if (!online || syncing) return;
    
    setSyncing(true);
    try {
      await syncOfflineData();
      setOfflineDataCount(0);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (online && offlineDataCount === 0) {
    return null; // Don't show indicator when online and no pending data
  }

  return (
    <div className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
      online 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      <div className="flex items-center space-x-2">
        {online ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        
        <span>
          {online ? 'Online' : 'Offline'}
        </span>
        
        {offlineDataCount > 0 && (
          <>
            <span className="text-xs opacity-75">
              ({offlineDataCount} pending)
            </span>
            {online && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
                title="Sync offline data"
              >
                <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </>
        )}
      </div>
      
      {!online && (
        <div className="text-xs opacity-75 mt-1">
          Changes will sync when online
        </div>
      )}
    </div>
  );
};