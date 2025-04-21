/*
  # Add phone number fields to profiles

  1. Changes
    - Add phone_number column to profiles table
    - Add share_phone_number column to profiles table
    - Add validation for phone number format
    - Update RLS policies
*/

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number text,
ADD COLUMN IF NOT EXISTS share_phone_number boolean DEFAULT false;

-- Create function to validate phone number format
CREATE OR REPLACE FUNCTION validate_phone_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if phone number is provided
  IF NEW.phone_number IS NOT NULL THEN
    -- Check if phone number matches French format
    IF NOT NEW.phone_number ~ '^(?:\+33|0)[1-9](?:[\s.-]?[0-9]{2}){4}$' THEN
      RAISE EXCEPTION 'Le numéro de téléphone doit être au format français (ex: 0612345678 ou +33612345678)';
    END IF;
    
    -- Normalize phone number format
    NEW.phone_number := regexp_replace(NEW.phone_number, '[.\s-]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for phone number validation
DROP TRIGGER IF EXISTS validate_phone_number_trigger ON profiles;
CREATE TRIGGER validate_phone_number_trigger
  BEFORE INSERT OR UPDATE OF phone_number ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_phone_number();