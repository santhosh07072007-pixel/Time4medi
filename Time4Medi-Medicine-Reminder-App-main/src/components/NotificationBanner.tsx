import React, { useState, useEffect } from 'react';
import { Bell, X, AlertCircle, Volume2 } from 'lucide-react';
import { requestNotificationPermission, sendTestNotification } from '../utils/fcm';

interface NotificationBannerProps {
  onPermissionGranted: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ onPermissionGranted }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  
  useEffect(() => {
    const checkPermission = async () => {
      const permission = Notification.permission;
      if (permission !== 'granted') {
        setIsVisible(true);
      }
    };
    
    checkPermission();
  }, []);
  
  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Send test notification with sound
        const soundUrl = 'https://freesound.org/data/previews/403/403007_5121236-lq.mp3';
        await sendTestNotification(soundUrl);
        
        setIsVisible(false);
        onPermissionGranted();
      } else {
        alert('Please enable notifications in your browser settings to receive medicine reminders.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setIsRequesting(false);
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-6 rounded-2xl shadow-lg mb-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      <div className="relative z-10">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Enable Notifications for Medicine Reminders
            </h3>
            <p className="text-white/90 mb-4 leading-relaxed">
              Enable notifications to receive "Time to take medicine" reminders with sound, even when your screen is off. 
              You'll get an immediate confirmation when you add a medicine, then scheduled reminders at the right times.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleEnableNotifications}
                disabled={isRequesting}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isRequesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Requesting...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Enable Notifications & Test
                  </>
                )}
              </button>
              
              <div className="text-white/80 text-sm flex items-center justify-center sm:justify-start">
                <AlertCircle className="w-4 h-4 mr-1" />
                Install app for notifications when screen is off
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};