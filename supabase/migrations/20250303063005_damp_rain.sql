-- Drop and recreate the booking validation function to allow same-day bookings
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS boolean AS $$
DECLARE
  v_today date;
BEGIN
  -- Get today's date at midnight in UTC
  v_today := CURRENT_DATE;

  -- Validate dates
  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'La date de début est requise';
  END IF;

  IF p_end_date IS NULL THEN
    RAISE EXCEPTION 'La date de fin est requise';
  END IF;

  -- Ensure start date is today or later
  IF p_start_date < v_today THEN
    RAISE EXCEPTION 'La date de début doit être à partir d''aujourd''hui';
  END IF;

  -- Ensure end date is not before start date
  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'La date de fin doit être égale ou postérieure à la date de début';
  END IF;

  -- Check for overlapping bookings
  IF EXISTS (
    SELECT 1 
    FROM bookings 
    WHERE listing_id = p_listing_id 
    AND status IN ('pending', 'confirmed')
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
      OR (start_date <= p_start_date AND end_date >= p_end_date)
      OR (start_date >= p_start_date AND end_date <= p_end_date)
    )
  ) THEN
    RAISE EXCEPTION 'Ces dates ne sont pas disponibles';
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;