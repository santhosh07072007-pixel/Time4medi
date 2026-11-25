import { createClient } from '@supabase/supabase-js';
import { storeOfflineData, isOnline } from './offline';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  name: string;
  age: number;
  created_at: string;
  fcm_token?: string;
}

export interface Medicine {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  time: string;
  meal_timing: 'before' | 'after' | 'with' | 'anytime';
  frequency: 'daily' | 'weekly';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// User operations
export const createUser = async (name: string, age: number) => {
  // Create user with a local UUID instead of using Supabase
  const user = {
    id: crypto.randomUUID(),
    name,
    age,
    created_at: new Date().toISOString(),
    fcm_token: null
  };
  
  return user;
};

export const createUserInSupabase = async (name: string, age: number) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, age }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, updates: Partial<User>) => {
  // Update user in localStorage
  const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
  const userIndex = localUsers.findIndex((u: User) => u.id === id);
  
  if (userIndex !== -1) {
    localUsers[userIndex] = { ...localUsers[userIndex], ...updates };
    localStorage.setItem('local_users', JSON.stringify(localUsers));
    
    // Store for offline sync if needed
    if (!isOnline()) {
      storeOfflineData('update', { id, updates, type: 'user' });
    }
    
    return localUsers[userIndex];
  }
  
  throw new Error('User not found');
};

export const updateUserInSupabase = async (id: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteUser = async (id: string) => {
  // Delete user from localStorage
  const localUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
  const filteredUsers = localUsers.filter((u: User) => u.id !== id);
  localStorage.setItem('local_users', JSON.stringify(filteredUsers));
  
  // Also delete user's medicines
  localStorage.removeItem(`time4medi_user_medicines_${id}`);
};

export const deleteUserFromSupabase = async (id: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Medicine operations
export const createMedicine = async (medicine: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) => {
  // Create medicine in localStorage
  const newMedicine = {
    ...medicine,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const existingMedicines = JSON.parse(localStorage.getItem(`time4medi_user_medicines_${medicine.user_id}`) || '[]');
  const updatedMedicines = [...existingMedicines, newMedicine];
  localStorage.setItem(`time4medi_user_medicines_${medicine.user_id}`, JSON.stringify(updatedMedicines));
  
  // Store for offline sync if needed
  if (!isOnline()) {
    storeOfflineData('medicine', newMedicine);
  }
  
  return newMedicine;
};

export const createMedicineInSupabase = async (medicine: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('medicines')
    .insert([medicine])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getMedicines = async (userId: string) => {
  // Get medicines from localStorage only
  const medicines = JSON.parse(localStorage.getItem(`time4medi_user_medicines_${userId}`) || '[]');
  return medicines;
};

export const getMedicinesFromSupabase = async (userId: string) => {
  const { data, error } = await supabase
    .from('medicines')
    .select('*')
    .eq('user_id', userId)
    .order('time', { ascending: true });
  
  if (error) throw error;
  return data;
};

export const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
  // Update medicine in localStorage
  const allLocalUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
  
  for (const user of allLocalUsers) {
    const medicines = JSON.parse(localStorage.getItem(`time4medi_user_medicines_${user.id}`) || '[]');
    const medicineIndex = medicines.findIndex((m: Medicine) => m.id === id);
    
    if (medicineIndex !== -1) {
      // Update the medicine
      medicines[medicineIndex] = { 
        ...medicines[medicineIndex], 
        ...updates, 
        updated_at: new Date().toISOString() 
      };
      
      // Save back to localStorage
      localStorage.setItem(`time4medi_user_medicines_${user.id}`, JSON.stringify(medicines));
      
      // Store for offline sync if needed
      if (!isOnline()) {
        storeOfflineData('update', { id, updates, type: 'medicine' });
      }
      
      // Return the updated medicine
      return medicines[medicineIndex];
    }
  }
  
  throw new Error('Medicine not found');
};

export const updateMedicineInSupabase = async (id: string, updates: Partial<Medicine>) => {
  const { data, error } = await supabase
    .from('medicines')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteMedicine = async (id: string) => {
  // Delete medicine from localStorage
  const allLocalUsers = JSON.parse(localStorage.getItem('local_users') || '[]');
  for (const user of allLocalUsers) {
    const medicines = JSON.parse(localStorage.getItem(`time4medi_user_medicines_${user.id}`) || '[]');
    const filteredMedicines = medicines.filter((m: Medicine) => m.id !== id);
    if (filteredMedicines.length !== medicines.length) {
      localStorage.setItem(`time4medi_user_medicines_${user.id}`, JSON.stringify(filteredMedicines));
      return;
    }
  }
};

export const deleteMedicineFromSupabase = async (id: string) => {
  const { error } = await supabase
    .from('medicines')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};