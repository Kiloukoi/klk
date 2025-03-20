-- Drop and recreate the booking validation function with strict date comparison
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS boolean AS $$
DECLARE
  v_tomorrow date;
BEGIN
  -- Get tomorrow's date
  v_tomorrow := CURRENT_DATE + INTERVAL '1 day';

  -- Validate start date
  IF p_start_date IS NULL THEN
    RAISE EXCEPTION 'La date de début est requise';
  END IF;

  IF p_end_date IS NULL THEN
    RAISE EXCEPTION 'La date de fin est requise';
  END IF;

  -- Check if dates are valid
  IF p_start_date < v_tomorrow THEN
    RAISE EXCEPTION 'La date de début doit être à partir de demain';
  END IF;

  IF p_end_date < p_start_date THEN
    RAISE EXCEPTION 'La date de fin doit être égale ou postérieure à la date de début';
  END IF;

  -- Check if there are any overlapping bookings
  RETURN NOT EXISTS (
    SELECT 1 
    FROM bookings 
    WHERE listing_id = p_listing_id 
    AND status IN ('pending', 'confirmed')
    AND (
      (start_date <= p_end_date AND end_date >= p_start_date)
      OR (start_date <= p_start_date AND end_date >= p_end_date)
      OR (start_date >= p_start_date AND end_date <= p_end_date)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger function with strict date validation
CREATE OR REPLACE FUNCTION before_booking_insert()
RETURNS trigger AS $$
DECLARE
  v_tomorrow date;
  v_is_available boolean;
BEGIN
  -- Get tomorrow's date
  v_tomorrow := CURRENT_DATE + INTERVAL '1 day';

  -- Validate required fields
  IF NEW.listing_id IS NULL THEN
    RAISE EXCEPTION 'L''identifiant de l''annonce est requis';
  END IF;

  IF NEW.start_date IS NULL THEN
    RAISE EXCEPTION 'La date de début est requise';
  END IF;

  IF NEW.end_date IS NULL THEN
    RAISE EXCEPTION 'La date de fin est requise';
  END IF;

  -- Validate start date is tomorrow or later
  IF NEW.start_date < v_tomorrow THEN
    RAISE EXCEPTION 'La date de début doit être à partir de demain';
  END IF;

  -- Check availability
  v_is_available := check_booking_availability(NEW.listing_id, NEW.start_date, NEW.end_date);
  
  IF NOT v_is_available THEN
    RAISE EXCEPTION 'Ces dates ne sont pas disponibles';
  END IF;

  -- Calculate total price
  NEW.total_price := calculate_booking_price(NEW.listing_id, NEW.start_date, NEW.end_date);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '%', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS validate_booking ON bookings;
CREATE TRIGGER validate_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION before_booking_insert();