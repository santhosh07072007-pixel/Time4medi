import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Heart, User, Calendar } from 'lucide-react';
import { createUser } from '../utils/supabase';
import { User as UserType } from '../types';

interface LoginFormProps {
  onLogin: (user: UserType) => void;
}

interface FormData {
  name: string;
  age: number;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const motivationalMessages = [
    "Every dose counts.",
    "Your wellbeing matters.",
    "Taking care of yourself is the first step to wellness.",
    "Consistency is key to better health."
  ];
  
  const [currentMessage] = useState(
    motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)]
  );
  
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const user = await createUser(data.name, data.age);
      onLogin(user);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-green-100 relative overflow-hidden flex items-center justify-center px-4">
      {/* Medicine Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 text-6xl">💊</div>
        <div className="absolute top-32 right-20 text-4xl">🩺</div>
        <div className="absolute bottom-20 left-20 text-5xl">💉</div>
        <div className="absolute bottom-40 right-10 text-3xl">🧴</div>
        <div className="absolute top-1/2 left-1/3 text-4xl">⚕️</div>
        <div className="absolute top-1/4 right-1/3 text-5xl">💊</div>
        <div className="absolute bottom-1/3 left-1/2 text-3xl">🩺</div>
      </div>
      
      {/* Animated Pill */}
      <div className="fixed top-6 left-6 z-10">
        <div className="w-8 h-8 text-2xl animate-bounce">💊</div>
      </div>
      
      <div className="max-w-md w-full relative z-10">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Welcome to Time4Medi
          </h1>
          <p className="text-gray-600 mb-4">{currentMessage}</p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Create Your Profile</h2>
              <p className="text-gray-600 text-sm">Just your name and age to get started</p>
            </div>
            
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-2 text-blue-500" />
                Full Name
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800 caret-blue-500"
                placeholder="Enter your full name"
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
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Profile...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  <span>Get Started</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            By continuing, you agree to keep your health as our top priority
          </p>
        </div>
      </div>
    </div>
  );
};