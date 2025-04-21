/*
  # Add updated_at column and trigger to profiles table

  1. Changes
    - Add updated_at column to profiles table
    - Create trigger function for automatic timestamp updates
    - Create trigger to maintain updated_at column

  2. Security
    - No changes to existing RLS policies
*/

-- Add updated_at column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;

-- Create the trigger
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();