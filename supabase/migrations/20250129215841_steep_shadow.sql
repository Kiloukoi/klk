-- Update the check_booking_availability function to enforce tomorrow as minimum start date
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS boolean AS $$
DECLARE
  v_exists boolean;
  v_tomorrow date;
BEGIN
  -- Get tomorrow's date
  v_tomorrow := CURRENT_DATE + 1;

  -- Check if dates are valid
  IF p_start_date < v_tomorrow THEN
    RAISE EXCEPTION 'La date de début doit être à partir de demain';
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