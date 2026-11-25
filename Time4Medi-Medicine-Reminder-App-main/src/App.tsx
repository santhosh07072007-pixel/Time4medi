import React, { useState, useEffect } from 'react';
import { Database, AlertCircle } from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { UserSelector } from './components/UserSelector';
import { Dashboard } from './components/Dashboard';
import { Layout } from './components/Layout';
import { OfflineIndicator } from './components/OfflineIndicator';
import { requestNotificationPermission, initializeBackgroundNotifications, rescheduleAllNotifications } from './utils/fcm';
import { setupOfflineListeners, cacheEssentialData, loadCachedData } from './utils/offline';

type AppState = 'loading' | 'userSelection' | 'login' | 'dashboard' | 'editProfile' | 'databaseError';

function App() {
  const [user, setUser] = useState<any>(null);
  const [appState, setAppState] = useState<AppState>('loading');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768 && 'ontouchstart' in window);
      setIsMobile(isMobileDevice);

      // Add mobile class to body for CSS targeting
      if (isMobileDevice) {
        document.body.classList.add('mobile-device');
      } else {
        document.body.classList.remove('mobile-device');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const initializeApp = async () => {
      try {
        // Setup offline functionality
        setupOfflineListeners();
        loadCachedData();

        // Add small delay for mobile devices to ensure proper loading
        if (isMobile) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Load users from localStorage only (device-specific)
        const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
        setAllUsers(localUsers);
        
        // Check if there's a current user in localStorage
        const currentUserId = localStorage.getItem('current_user_id');
        const currentUser = localUsers.find(u => u.id === currentUserId);
        
        if (currentUser) {
          setUser(currentUser);
          setAppState('dashboard');
        } else if (localUsers.length > 0) {
          setAppState('userSelection');
        } else {
          setAppState('login');
        }
        
        // Request notification permission (with mobile-specific handling)
        try {
          await requestNotificationPermission();
        } catch (notificationError) {
          console.warn('Notification permission failed:', notificationError);
          // Don't block app initialization for notification failures
        }

        // Initialize background notifications (with error handling)
        try {
          initializeBackgroundNotifications();
        } catch (bgError) {
          console.warn('Background notifications failed:', bgError);
        }

        // Reschedule all active notifications (with error handling)
        try {
          rescheduleAllNotifications();
        } catch (rescheduleError) {
          console.warn('Rescheduling notifications failed:', rescheduleError);
        }
        
        // Cache essential data for offline use
        cacheEssentialData();
      } catch (error) {
        console.error('Error initializing app:', error);

        // For mobile, show a simpler error message
        if (isMobile) {
          setError('App failed to load. Please refresh the page or try a different browser.');
        } else {
          // Check if it's a database table missing error
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
            setError('Database tables are not set up yet. Please connect to Supabase and run the migrations.');
          } else {
            setError('Failed to connect to database. Please check your Supabase configuration.');
          }
        }
        setAppState('databaseError');
      }
    };
    
    initializeApp();
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);
  
  const handleRetry = () => {
    setError('');
    setAppState('loading');
    // Trigger re-initialization
    window.location.reload();
  };

  const handleSelectUser = (selectedUser: any) => {
    localStorage.setItem('current_user_id', selectedUser.id);
    setUser(selectedUser);
    setAppState('dashboard');
  };
  
  const handleAddNewUser = () => {
    setAppState('login');
  };
  
  const handleSwitchUser = () => {
    localStorage.removeItem('current_user_id');
    setUser(null);
    if (allUsers.length > 1) {
      setAppState('userSelection');
    } else {
      setAppState('login');
    }
  };

  const handleLogin = (userData: any) => {
    localStorage.setItem('current_user_id', userData.id);
    setUser(userData);
    
    // Save user to local storage only (device-specific)
    const updatedUsers = [...allUsers, userData];
    setAllUsers(updatedUsers);
    localStorage.setItem('local_users', JSON.stringify(updatedUsers));
    
    setAppState('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('current_user_id');
    setUser(null);
    if (allUsers.length > 0) {
      setAppState('userSelection');
    } else {
      setAppState('login');
    }
  };

  if (appState === 'loading') {
    return (
      <div className={`min-h-screen ${isMobile ? 'min-h-[100dvh] min-h-[100vh]' : ''} bg-gradient-to-br from-blue-100 via-purple-50 to-green-100 flex items-center justify-center p-4`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading Time4Medi...</p>
          {isMobile && (
            <p className="text-gray-500 text-xs mt-2">Please wait while we load your medicine reminders</p>
          )}
        </div>
      </div>
    );
  }

  if (appState === 'databaseError') {
    return (
      <div className={`min-h-screen ${isMobile ? 'min-h-[100dvh] min-h-[100vh]' : ''} bg-gradient-to-br from-blue-100 via-purple-50 to-green-100 flex items-center justify-center p-4`}>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Database Setup Required</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Setup Instructions:
              </h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Click "Connect to Supabase" button (top right)</li>
                <li>2. Set up your Supabase project</li>
                <li>3. The database tables will be created automatically</li>
                <li>4. Refresh this page</li>
              </ol>
            </div>
            
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] text-base touch-manipulation"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (appState === 'userSelection') {
    return (
      <UserSelector
        users={allUsers}
        onSelectUser={handleSelectUser}
        onAddNewUser={handleAddNewUser}
      />
    );
  }
  
  if (appState === 'login') {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className={`${isMobile ? 'mobile-keyboard-fix' : ''} ${isMobile ? 'touch-manipulation' : ''}`}>
      <OfflineIndicator />
      <Layout 
        user={user}
        onLogout={handleLogout} 
        onSwitchUser={handleSwitchUser}
        allUsers={allUsers}
      >
        <Dashboard user={user} />
      </Layout>
    </div>
  );
}

export default App;