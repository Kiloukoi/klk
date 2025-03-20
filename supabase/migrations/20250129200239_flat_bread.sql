/*
  # Fix Booking Validation

  1. Changes
    - Add date validation to ensure end_date is after start_date
    - Add owner_id to bookings table for better tracking
    - Update booking validation function
*/

-- Add owner_id to bookings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN owner_id uuid REFERENCES profiles(id) NOT NULL;
  END IF;
END $$;

-- Update booking validation function
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS boolean AS $$
DECLARE
  v_exists boolean;
BEGIN
  -- Check if dates are valid
  IF p_start_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'La date de début ne peut pas être dans le passé';
  END IF;

  IF p_end_date <= p_start_date THEN
    RAISE EXCEPTION 'La date de fin doit être postérieure à la date de début';
  END IF;

  -- Check if there are any overlapping bookings
  SELECT EXISTS (
    SELECT 1 
    FROM bookings 
    WHERE listing_id = p_listing_id 
    AND status = 'confirmed'
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
      OR (start_date <= p_start_date AND end_date >= p_end_date)
      OR (start_date >= p_start_date AND end_date <= p_end_date)
    )
  ) INTO v_exists;

  RETURN NOT v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;