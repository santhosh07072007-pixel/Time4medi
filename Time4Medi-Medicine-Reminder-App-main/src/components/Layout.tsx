import React, { useState } from 'react';
import { Heart, Bell, Settings, LogOut, Users } from 'lucide-react';
import { SettingsModal } from './SettingsModal';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  onSwitchUser: () => void;
  allUsers: any[];
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onSwitchUser, allUsers }) => {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-green-100 relative overflow-hidden">
      {/* Medicine Pattern Background */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">💊</div>
        <div className="absolute top-32 right-20 text-4xl animate-bounce">🩺</div>
        <div className="absolute bottom-20 left-20 text-5xl animate-pulse">💉</div>
        <div className="absolute bottom-40 right-10 text-3xl animate-bounce">🧴</div>
        <div className="absolute top-1/2 left-1/3 text-4xl animate-pulse">⚕️</div>
        <div className="absolute top-1/4 right-1/3 text-5xl animate-bounce">💊</div>
        <div className="absolute bottom-1/3 left-1/2 text-3xl animate-pulse">🩺</div>
        <div className="absolute top-3/4 right-1/4 text-4xl animate-bounce">💉</div>
      </div>
      
      {/* Animated Pill */}
      <div className="fixed top-6 left-6 z-20">
        <div className="w-8 h-8 text-2xl animate-bounce">💊</div>
      </div>
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Time4Medi
                </h1>
                <p className="text-sm text-gray-600">Your health companion</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {allUsers.length > 1 && (
                <button 
                  onClick={onSwitchUser}
                  className="p-2 text-gray-600 hover:text-green-600 transition-colors rounded-lg hover:bg-green-50"
                  title="Switch User"
                >
                  <Users className="w-5 h-5" />
                </button>
              )}
              <button className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50">
                <Bell className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={onLogout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {user && (
            <div className="text-center py-2 border-t border-blue-100">
              <p className="text-sm text-gray-600">
                Welcome back, <span className="font-medium text-blue-600">{user.name}</span> (Age: {user.age})
                {allUsers.length > 1 && (
                  <span className="text-gray-400 ml-2">({allUsers.length} profiles)</span>
                )}
              </p>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-blue-100 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">© 2025 Time4Medi. Your health, our priority.</p>
            <p className="text-xs mt-1 text-blue-600 font-medium">Stay healthier, stay happier.</p>
          </div>
        </div>
      </footer>
      
      {/* Modals */}
      {showSettings && (
        <SettingsModal 
          user={user}
          onClose={() => setShowSettings(false)}
          onUserUpdate={() => window.location.reload()}
        />
      )}
    </div>
  );
};