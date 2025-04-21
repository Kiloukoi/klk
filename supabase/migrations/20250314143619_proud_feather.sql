-- Drop and recreate the booking validation function to allow same-day bookings until 6 PM
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS boolean AS $$
DECLARE
  v_today date;
  v_now timestamp;
  v_cutoff_time timestamp;
BEGIN
  -- Get current date and time in UTC
  v_today := CURRENT_DATE;
  v_now := CURRENT_TIMESTAMP;
  -- Set cutoff time to 6 PM (18:00) UTC for same-day bookings
  v_cutoff_time := v_today + INTERVAL '18 hours';

  -- Validate dates
  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'La date de début est requise';
  END IF;

  IF p_end_date IS NULL THEN
    RAISE EXCEPTION 'La date de fin est requise';
  END IF;

  -- Check if dates are valid
  IF p_start_date < v_today THEN
    RAISE EXCEPTION 'La date de début ne peut pas être dans le passé';
  END IF;

  -- For same-day bookings, check if it's before 6 PM
  IF p_start_date = v_today AND v_now > v_cutoff_time THEN
    RAISE EXCEPTION 'Les réservations pour aujourd''hui ne sont plus possibles après 18h';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'La date de fin doit être égale ou postérieure à la date de début';
  END IF;

  -- Check if there are any overlapping bookings
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

-- Update the trigger function
CREATE OR REPLACE FUNCTION before_booking_insert()
RETURNS trigger AS $$
DECLARE
  v_today date;
  v_now timestamp;
  v_cutoff_time timestamp;
BEGIN
  -- Get current date and time in UTC
  v_today := CURRENT_DATE;
  v_now := CURRENT_TIMESTAMP;
  -- Set cutoff time to 6 PM (18:00) UTC for same-day bookings
  v_cutoff_time := v_today + INTERVAL '18 hours';

  -- Validate start date
  IF NEW.start_date < v_today THEN
    RAISE EXCEPTION 'La date de début ne peut pas être dans le passé';
  END IF;

  -- For same-day bookings, check if it's before 6 PM
  IF NEW.start_date = v_today AND v_now > v_cutoff_time THEN
    RAISE EXCEPTION 'Les réservations pour aujourd''hui ne sont plus possibles après 18h';
  END IF;

  -- Check availability
  PERFORM check_booking_availability(NEW.listing_id, NEW.start_date, NEW.end_date);

  -- Calculate total price
  NEW.total_price := calculate_booking_price(NEW.listing_id, NEW.start_date, NEW.end_date);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS validate_booking ON bookings;
CREATE TRIGGER validate_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION before_booking_insert();