import React, { useState } from 'react';
import { Edit2, Trash2, Clock, AlertCircle, CheckCircle, Pill } from 'lucide-react';
import { Medicine } from '../types';
import { EditMedicineForm } from './EditMedicineForm';

interface MedicineListProps {
  medicines: Medicine[];
  onUpdate: (medicine: Medicine) => void;
  onDelete: (medicineId: string) => void;
}

export const MedicineList: React.FC<MedicineListProps> = ({ medicines, onUpdate, onDelete }) => {
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  
  const getMealTimingColor = (timing: string) => {
    switch (timing) {
      case 'before': return 'bg-blue-100 text-blue-800';
      case 'after': return 'bg-green-100 text-green-800';
      case 'with': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getMealTimingText = (timing: string) => {
    switch (timing) {
      case 'before': return 'Before meals';
      case 'after': return 'After meals';
      case 'with': return 'With meals';
      default: return 'Anytime';
    }
  };
  
  const isUpcoming = (time: string) => {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    const medicineTime = new Date();
    medicineTime.setHours(hours, minutes, 0, 0);
    
    // If the time has passed today, it's for tomorrow
    if (medicineTime <= now) {
      medicineTime.setDate(medicineTime.getDate() + 1);
    }
    
    return medicineTime > now;
  };
  
  const handleDelete = (medicineId: string, medicineName: string) => {
    if (window.confirm(`Are you sure you want to delete ${medicineName}?`)) {
      onDelete(medicineId);
    }
  };
  
  return (
    <>
      <div className="space-y-4">
        {medicines.map((medicine) => (
          <div
            key={medicine.id}
            className={`bg-white rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
              medicine.is_active 
                ? 'border-green-200 hover:border-green-300' 
                : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  medicine.is_active ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Pill className={`w-6 h-6 ${
                    medicine.is_active ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-800">{medicine.name}</h4>
                    {medicine.is_active && isUpcoming(medicine.time) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </span>
                    )}
                    {!medicine.is_active && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">{medicine.time}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">Quantity:</span>
                      <span>{medicine.dosage}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTimingColor(medicine.meal_timing)}`}>
                      {getMealTimingText(medicine.meal_timing)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingMedicine(medicine)}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  title="Edit medicine"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(medicine.id, medicine.name)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  title="Delete medicine"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Edit Medicine Modal */}
      {editingMedicine && (
        <EditMedicineForm
          medicine={editingMedicine}
          onUpdate={(updatedMedicine) => {
            onUpdate(updatedMedicine);
            setEditingMedicine(null);
          }}
          onClose={() => setEditingMedicine(null)}
        />
      )}
    </>
  );
};