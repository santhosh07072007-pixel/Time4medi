import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, User, Calendar, Volume2, Trash2, Upload } from 'lucide-react';
import { updateUser, deleteUser } from '../utils/supabase';

interface SettingsModalProps {
  user: any;
  onClose: () => void;
  onUserUpdate: () => void;
}

interface FormData {
  name: string;
  age: number;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ user, onClose, onUserUpdate }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: user.name,
      age: user.age
    }
  });
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [customSound, setCustomSound] = useState<File | null>(null);
  
  const handleSoundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setCustomSound(file);
    } else {
      alert('Please select a valid audio file');
    }
  };
  
  const onSubmit = async (data: FormData) => {
    setIsUpdating(true);
    try {
      await updateUser(user.id, { name: data.name, age: data.age });
      onUserUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete your profile? This will also delete all your medicine data.`)) {
      setIsDeleting(true);
      try {
        await deleteUser(user.id);
        
        // Remove from current session
        localStorage.removeItem('current_user_id');
        
        onUserUpdate();
        onClose();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting profile. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4 min-h-fit">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Settings</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto p-6 space-y-6">
          {/* Profile Settings */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-4">Profile Information</h4>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2 text-blue-500" />
                  Name
                </label>
                <input
                  {...register('name', { required: 'Name is required' })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800 caret-blue-500"
                  placeholder="Enter your name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  Age
                </label>
                <input
                  {...register('age', { 
                    required: 'Age is required',
                    min: { value: 1, message: 'Age must be at least 1' },
                    max: { value: 120, message: 'Age must be less than 120' }
                  })}
                  type="number"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800 caret-blue-500"
                  placeholder="Enter your age"
                />
                {errors.age && (
                  <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isUpdating}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-h-[44px]"
              >
                {isUpdating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Profile</span>
                )}
              </button>
            </form>
          </div>
          
          {/* Notification Sound */}
          <div>
            <h4 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Volume2 className="w-5 h-5 mr-2 text-blue-500" />
              Notification Sound
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Default notification sound</p>
                <audio controls className="w-full">
                  <source src="https://freesound.org/data/previews/403/403007_5121236-lq.mp3" type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleSoundUpload}
                  className="hidden"
                  id="sound-upload"
                />
                <label htmlFor="sound-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Upload custom sound</p>
                  <p className="text-xs text-gray-500 mt-1">MP3, WAV, or other audio formats</p>
                </label>
                {customSound && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                    Selected: {customSound.name}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-red-800 mb-4">Danger Zone</h4>
            <p className="text-sm text-red-600 mb-4">
              Permanently delete your profile and all associated medicine data.
            </p>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-medium hover:bg-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 min-h-[44px]"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};