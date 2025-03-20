-- Mise à jour de la fonction de validation des réservations
CREATE OR REPLACE FUNCTION check_booking_availability(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS boolean AS $$
DECLARE
  v_exists boolean;
  v_today date;
BEGIN
  -- Get today's date
  v_today := CURRENT_DATE;

  -- Check if dates are valid
  IF p_start_date < v_today THEN
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

-- Mise à jour du trigger de validation des réservations
CREATE OR REPLACE FUNCTION before_booking_insert()
RETURNS trigger AS $$
BEGIN
  -- Check availability
  IF NOT check_booking_availability(NEW.listing_id, NEW.start_date, NEW.end_date) THEN
    RAISE EXCEPTION 'Ces dates ne sont pas disponibles';
  END IF;

  -- Calculate total price
  NEW.total_price := calculate_booking_price(NEW.listing_id, NEW.start_date, NEW.end_date);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréation du trigger
DROP TRIGGER IF EXISTS validate_booking ON bookings;
CREATE TRIGGER validate_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION before_booking_insert();