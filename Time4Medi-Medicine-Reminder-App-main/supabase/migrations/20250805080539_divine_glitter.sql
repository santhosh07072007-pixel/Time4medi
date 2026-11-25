/*
  # Create medicines table

  1. New Tables
    - `medicines`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, medicine name)
      - `dosage` (text, dosage information)
      - `time` (text, time to take medicine)
      - `meal_timing` (text, before/after/with/anytime)
      - `frequency` (text, daily/weekly)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `medicines` table
    - Add policies for medicine management

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on time for reminder queries
*/

CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  dosage text NOT NULL,
  time text NOT NULL,
  meal_timing text NOT NULL CHECK (meal_timing IN ('before', 'after', 'with', 'anytime')),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS medicines_user_id_idx ON medicines(user_id);
CREATE INDEX IF NOT EXISTS medicines_time_idx ON medicines(time);
CREATE INDEX IF NOT EXISTS medicines_is_active_idx ON medicines(is_active);

-- Policies for medicine management
CREATE POLICY "Users can manage medicines for any user"
  ON medicines
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous access for this app since it doesn't use auth
CREATE POLICY "Allow anonymous access to medicines"
  ON medicines
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at when medicines are modified
CREATE TRIGGER update_medicines_updated_at
    BEFORE UPDATE ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();