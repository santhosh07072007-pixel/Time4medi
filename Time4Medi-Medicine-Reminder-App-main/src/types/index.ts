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

export interface NotificationSettings {
  enabled: boolean;
  soundUrl: string;
  customSoundName?: string;
}