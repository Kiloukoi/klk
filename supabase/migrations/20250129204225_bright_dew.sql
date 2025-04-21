/*
  # Add location column to profiles table

  1. Changes
    - Add location column to profiles table
    - Add index for location column for better search performance

  2. Security
    - Maintain existing RLS policies
*/

DO $$ 
BEGIN
  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'location'
  ) THEN
    ALTER TABLE profiles ADD COLUMN location text;
  END IF;

  -- Create index for location if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'profiles' AND indexname = 'profiles_location_idx'
  ) THEN
    CREATE INDEX profiles_location_idx ON profiles(location);
  END IF;
END $$;