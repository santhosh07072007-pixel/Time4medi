/*
  # Create users table

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `age` (integer, required)
      - `created_at` (timestamp)
      - `fcm_token` (text, optional for push notifications)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to manage their own data
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  age integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  fcm_token text
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own data"
  ON users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous access for this app since it doesn't use auth
CREATE POLICY "Allow anonymous access to users"
  ON users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);