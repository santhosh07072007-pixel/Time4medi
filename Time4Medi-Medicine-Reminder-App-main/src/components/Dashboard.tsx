import React, { useState, useEffect } from 'react';
import { Plus, Clock, Calendar, Star, TrendingUp, Zap } from 'lucide-react';
import { getMedicines } from '../utils/supabase';
import { MedicineList } from './MedicineList';
import { AddMedicineForm } from './AddMedicineForm';
import { NotificationBanner } from './NotificationBanner';

interface DashboardProps {
  user: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  
  const welcomeMessages = [
    `Welcome back, ${user?.name}!`,
    "Stay healthier, stay happier.",
    "Your health, our priority.",
    "Keep up the great work!",
    "Every dose counts.",
    "Your wellbeing matters."
  ];
  
  const [currentWelcome] = useState(
    welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
  );
  
  useEffect(() => {
    const loadMedicines = () => {
      if (user?.id) {
        getMedicines(user.id)
          .then(data => {
            setMedicines(data || []);
            setLoading(false);
          })
          .catch(error => {
            console.error('Error loading medicines:', error);
            setLoading(false);
          });
      }
    };
    
    loadMedicines();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  const handleAddMedicine = (medicine: any) => {
    const updatedMedicines = [...medicines, medicine];
    setMedicines(updatedMedicines);
    setShowAddForm(false);
    
    // Show success message
    const successMessage = `✅ ${medicine.name} added! You'll receive reminders at ${medicine.time}`;
    
    // Create a temporary success notification in the UI
    const successDiv = document.createElement('div');
    successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    successDiv.innerHTML = `
      <div class="flex items-center space-x-2">
        <span>✅</span>
        <span>${medicine.name} added! Reminders set for ${medicine.time}</span>
      </div>
    `;
    document.body.appendChild(successDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
      successDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(successDiv);
      }, 300);
    }, 5000);
  };
  
  const handleUpdateMedicine = (updatedMedicine: any) => {
    const updatedMedicines = medicines.map(med => 
      med.id === updatedMedicine.id ? updatedMedicine : med
    );
    setMedicines(updatedMedicines);
  };
  
  const handleDeleteMedicine = (medicineId: string) => {
    const updatedMedicines = medicines.filter(med => med.id !== medicineId);
    setMedicines(updatedMedicines);
  };
  
  const handleNotificationPermissionGranted = () => {
    setShowNotificationBanner(false);
  };
  
  const activeMedicines = medicines.filter(med => med.is_active);
  const todaysMedicines = activeMedicines.filter(med => {
    const now = new Date();
    const [timeStr, period] = med.time.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    let scheduledHours = hours;
    if (period === 'PM' && hours !== 12) scheduledHours += 12;
    if (period === 'AM' && hours === 12) scheduledHours = 0;
    
    const medicineTime = new Date();
    medicineTime.setHours(scheduledHours, minutes, 0, 0);
    return medicineTime >= now;
  });
  
  // Calculate streak (simplified - just count active medicines as streak days)
  const streakDays = activeMedicines.length > 0 ? Math.min(activeMedicines.length * 2, 30) : 0;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Notification Banner */}
      {showNotificationBanner && (
        <NotificationBanner onPermissionGranted={handleNotificationPermissionGranted} />
      )}
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-3xl font-bold mb-2">{currentWelcome}</h2>
              <p className="text-blue-100 text-lg">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            <div className="flex space-x-6 text-center">
              <div>
                <div className="text-2xl font-bold">{activeMedicines.length}</div>
                <div className="text-blue-100 text-sm">Active Medicines</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{todaysMedicines.length}</div>
                <div className="text-blue-100 text-sm">Remaining Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Next Medicine</p>
              <p className="text-2xl font-bold text-gray-800">
                {todaysMedicines.length > 0 ? todaysMedicines[0].time : 'None'}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">This Week</p>
              <p className="text-2xl font-bold text-gray-800">
                {activeMedicines.length * 7}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Streak</p>
              <p className="text-2xl font-bold text-gray-800">{streakDays} days</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Medicine Management */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-blue-100 overflow-hidden">
        <div className="p-6 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Medicines</h3>
              <p className="text-gray-600">Manage your daily medicine schedule</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 sm:mt-0 bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {medicines.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-blue-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">No medicines added yet</h4>
              <p className="text-gray-600 mb-6">Add your first medicine to get started with reminders</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-green-600 transition-all duration-200 flex items-center space-x-2 mx-auto shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Medicine</span>
              </button>
            </div>
          ) : (
            <MedicineList
              medicines={medicines}
              onUpdate={handleUpdateMedicine}
              onDelete={handleDeleteMedicine}
            />
          )}
        </div>
      </div>
      
      {/* Add Medicine Modal */}
      {showAddForm && (
        <AddMedicineForm
          userId={user.id}
          onAdd={handleAddMedicine}
          onClose={() => setShowAddForm(false)}
        />
      )}
      
      {/* Motivational Section */}
      <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl p-8 text-white text-center">
        <Star className="w-12 h-12 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Keep up the great work!</h3>
        <p className="text-purple-100">
          Every dose you take is a step towards better health. Stay consistent and take care of yourself.
        </p>
      </div>
    </div>
  );
};