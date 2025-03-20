-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_booking_status_change ON bookings;

-- Create function to validate booking status changes
CREATE OR REPLACE FUNCTION validate_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow specific status transitions
  IF OLD.status = 'pending' AND NEW.status NOT IN ('confirmed', 'cancelled') THEN
    RAISE EXCEPTION 'Une réservation en attente ne peut être que confirmée ou annulée';
  END IF;

  IF OLD.status = 'confirmed' AND NEW.status NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Une réservation confirmée ne peut être que terminée ou annulée';
  END IF;

  IF OLD.status IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'Le statut d''une réservation % ne peut plus être modifié', OLD.status;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking status changes
CREATE TRIGGER validate_booking_status_change
  BEFORE UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION validate_booking_status_change();

-- Update existing bookings policies
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;

-- Policy for owners to confirm/cancel bookings
CREATE POLICY "Owners can manage bookings"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id
      AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id
      AND owner_id = auth.uid()
    )
    AND status IN ('confirmed', 'cancelled')
  );

-- Policy for renters to cancel their bookings
CREATE POLICY "Renters can cancel their bookings"
  ON bookings FOR UPDATE
  USING (
    renter_id = auth.uid()
  )
  WITH CHECK (
    renter_id = auth.uid()
    AND status = 'cancelled'
  );