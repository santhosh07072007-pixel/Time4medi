import React, { useState } from 'react';
import { Users, Plus, ArrowRight, User as UserIcon, Calendar, Pill } from 'lucide-react';
import { User } from '../types';

interface UserSelectorProps {
  users: User[];
  onSelectUser: (user: User) => void;
  onAddNewUser: () => void;
}

export const UserSelector: React.FC<UserSelectorProps> = ({ users, onSelectUser, onAddNewUser }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  
  const handleUserSelect = () => {
    const selectedUser = users.find(user => user.id === selectedUserId);
    if (selectedUser) {
      onSelectUser(selectedUser);
    }
  };
  
  const getUserMedicineCount = (userId: string) => {
    try {
      const medicines = JSON.parse(localStorage.getItem(`time4medi_user_medicines_${userId}`) || '[]');
      return medicines.filter((med: any) => med.is_active).length;
    } catch (error) {
      console.error('Error getting medicine count:', error);
      return 0;
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Welcome to Time4Medi
          </h1>
          <p className="text-gray-600">Select your profile or create a new one</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8">
          {users.length > 0 && (
            <>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <UserIcon className="w-5 h-5 mr-2 text-blue-500" />
                  Existing Profiles
                </h2>
                
                <div className="space-y-3 mb-6">
                  {users.map((user) => {
                    const medicineCount = getUserMedicineCount(user.id);
                    
                    return (
                      <label
                        key={user.id}
                        className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                          selectedUserId === user.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="user"
                          value={user.id}
                          checked={selectedUserId === user.id}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="sr-only"
                        />
                        
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-green-400 rounded-full flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-lg">
                            {user.name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('')}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-600">Age: {user.age}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Pill className="w-3 h-3 mr-1" />
                              {medicineCount} active medicines
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Joined {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        {selectedUserId === user.id && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                
                {selectedUserId && (
                  <button
                    onClick={handleUserSelect}
                    className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mb-6"
                  >
                    <span>Continue as {users.find(u => u.id === selectedUserId)?.name.split(' ')[0]}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>
              </div>
            </>
          )}
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {users.length > 0 ? 'Create New Profile' : 'Get Started'}
            </h3>
            <p className="text-gray-600 mb-6">
              {users.length > 0 
                ? 'Add another family member or create a separate profile'
                : 'Create your first profile to start managing your medicines'
              }
            </p>
            <button
              onClick={onAddNewUser}
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center space-x-2 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>{users.length > 0 ? 'Add New Profile' : 'Create Profile'}</span>
            </button>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Each profile maintains separate medicine schedules and settings
          </p>
        </div>
      </div>
    </div>
  );
};