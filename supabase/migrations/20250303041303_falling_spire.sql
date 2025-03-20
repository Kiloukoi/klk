-- Function to cancel expired pending bookings
CREATE OR REPLACE FUNCTION cancel_expired_pending_bookings()
RETURNS void AS $$
BEGIN
  UPDATE bookings
  SET status = 'cancelled'
  WHERE status = 'pending'
  AND start_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and cancel expired bookings on access
CREATE OR REPLACE FUNCTION check_booking_expiry()
RETURNS trigger AS $$
BEGIN
  -- Update status if the booking has expired
  IF NEW.status = 'pending' AND NEW.start_date < CURRENT_DATE THEN
    NEW.status := 'cancelled';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs before insert or update
DROP TRIGGER IF EXISTS check_booking_expiry_trigger ON bookings;
CREATE TRIGGER check_booking_expiry_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_expiry();

-- Expose the function via the API REST
COMMENT ON FUNCTION cancel_expired_pending_bookings IS 'Annule automatiquement les réservations en attente dont la date de début est dépassée';
GRANT EXECUTE ON FUNCTION cancel_expired_pending_bookings TO authenticated;

-- Run the function immediately to cancel any currently expired bookings
SELECT cancel_expired_pending_bookings();