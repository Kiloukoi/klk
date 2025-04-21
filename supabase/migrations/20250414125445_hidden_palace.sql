-- Add gender column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS profiles_gender_idx ON profiles(gender);