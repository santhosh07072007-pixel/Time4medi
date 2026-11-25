import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Clock, Pill, Volume2, Upload } from 'lucide-react';
import { updateMedicine } from '../utils/supabase';
import { Medicine } from '../types';

interface EditMedicineFormProps {
  medicine: Medicine;
  onUpdate: (medicine: Medicine) => void;
  onClose: () => void;
}

interface FormData {
  name: string;
  dosage: string;
  time: string;
  meal_timing: 'before' | 'after' | 'with' | 'anytime';
  frequency: 'daily' | 'weekly';
  is_active: boolean;
}

export const EditMedicineForm: React.FC<EditMedicineFormProps> = ({ medicine, onUpdate, onClose }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: medicine.name,
      dosage: medicine.dosage,
      time: convertTo24Hour(medicine.time),
      meal_timing: medicine.meal_timing,
      frequency: medicine.frequency,
      is_active: medicine.is_active
    }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customSound, setCustomSound] = useState<File | null>(null);
  
  function convertTo24Hour(time12h: string) {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  
  const handleSoundUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setCustomSound(file);
    } else {
      alert('Please select a valid audio file');
    }
  };
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Handle custom sound upload
      let soundUrl = 'https://freesound.org/data/previews/403/403007_5121236-lq.mp3';
      
      if (customSound) {
        soundUrl = URL.createObjectURL(customSound);
      }
      
      // Convert 24-hour to 12-hour format
      const [hours, minutes] = data.time.split(':');
      const hour12 = parseInt(hours);
      const ampm = hour12 >= 12 ? 'PM' : 'AM';
      const displayHour = hour12 % 12 || 12;
      const time12 = `${displayHour}:${minutes} ${ampm}`;
      
      const medicineData = {
        name: data.name,
        dosage: data.dosage,
        time: time12,
        meal_timing: data.meal_timing,
        frequency: data.frequency,
        is_active: data.is_active
      };
      
      const updatedMedicine = await updateMedicine(medicine.id, medicineData);
      
      // If the medicine is active and time changed, reschedule notification
      if (data.is_active) {
        const { scheduleNotification, clearScheduledNotification } = await import('../utils/fcm');
        
        // Clear old notification
        clearScheduledNotification(medicine.id);
        
        // Schedule new notification
        scheduleNotification(updatedMedicine, soundUrl);
      }
      
      // Play success sound
      const successAudio = new Audio('https://freesound.org/data/previews/403/403007_5121236-lq.mp3');
      successAudio.play().catch(e => console.log('Could not play success sound:', e));
      
      onUpdate(updatedMedicine);
    } catch (error) {
      console.error('Error updating medicine:', error);
      alert('Error updating medicine. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-4 min-h-fit">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-800">Edit Medicine</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Pill className="w-4 h-4 mr-2 text-blue-500" />
              Medicine Name
            </label>
            <input
              {...register('name', { required: 'Medicine name is required' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., Aspirin, Vitamin D"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dosage
            </label>
            <input
              {...register('dosage', { required: 'Dosage is required' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g., 1 tablet, 2 capsules, 5ml"
            />
            {errors.dosage && (
              <p className="text-red-500 text-sm mt-1">{errors.dosage.message}</p>
            )}
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 mr-2 text-blue-500" />
              Time
            </label>
            <input
              type="time"
              {...register('time', { required: 'Time is required' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            {errors.time && (
              <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              When to take
            </label>
            <select
              {...register('meal_timing', { required: 'Meal timing is required' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select meal timing</option>
              <option value="before">Before meals</option>
              <option value="after">After meals</option>
              <option value="with">With meals</option>
              <option value="anytime">Anytime</option>
            </select>
            {errors.meal_timing && (
              <p className="text-red-500 text-sm mt-1">{errors.meal_timing.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              {...register('frequency', { required: 'Frequency is required' })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select frequency</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            {errors.frequency && (
              <p className="text-red-500 text-sm mt-1">{errors.frequency.message}</p>
            )}
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('is_active')}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Volume2 className="w-4 h-4 mr-2 text-blue-500" />
              Notification Sound (Optional)
            </label>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Default notification sound will be used</p>
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
                  <p className="text-sm text-gray-600">
                    Click to upload custom sound
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    MP3, WAV, or other audio formats
                  </p>
                </label>
                {customSound && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-sm text-green-700">
                    Selected: {customSound.name}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4 sticky bottom-0 bg-white border-t border-gray-100 p-6 -mx-6 -mb-6 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors duration-200 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Pill className="w-4 h-4" />
                  <span>Update Medicine</span>
                </>
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};