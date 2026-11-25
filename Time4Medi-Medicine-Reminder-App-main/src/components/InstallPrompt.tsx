import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

interface InstallPromptProps {
  onClose: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  
  useEffect(() => {
    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);
    
    // Check if app can be installed
    setCanInstall(!standalone && (!!deferredPrompt || iOS));
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        onClose();
      }
    }
  };
  
  if (isStandalone) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">App Already Installed</h3>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600 mb-4">Time4Medi is already installed on your device!</p>
            <p className="text-sm text-green-600">You'll receive notifications even when the app is closed.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Install Time4Medi</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-blue-600" />
          </div>
          <p className="text-gray-600 mb-2">
            Install Time4Medi as an app for reliable notifications!
          </p>
          <p className="text-sm text-blue-600 font-medium">
            Get notifications even when your screen is off
          </p>
        </div>
        
        {isIOS ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Smartphone className="w-6 h-6 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Install on iOS:</p>
                <p className="text-blue-600">1. Tap Share button (bottom)</p>
                <p className="text-blue-600">2. Tap "Add to Home Screen"</p>
                <p className="text-blue-600">3. Tap "Add" to install</p>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ After installation, you'll get medicine reminders even when your phone is locked!
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              Got it!
            </button>
          </div>
        ) : deferredPrompt ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Monitor className="w-6 h-6 text-green-600" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Ready to install!</p>
                <p className="text-green-600">Get background notifications</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                ✅ Works offline and sends notifications even when browser is closed
              </p>
            </div>
            <button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Install App</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Monitor className="w-6 h-6 text-yellow-600" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">For best experience:</p>
                <p className="text-yellow-600">Use Chrome, Edge, or Safari for installation</p>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                💡 Installing as an app enables background notifications
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-gray-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};