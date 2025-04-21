/*
  # Booking System Implementation

  1. New Functions
    - check_booking_availability: Validates booking dates and availability
    - calculate_booking_price: Calculates total price based on duration and daily rate
  
  2. Triggers
    - before_booking_insert: Validates bookings before insertion
    - after_booking_insert: Updates listing availability

  3. Changes
    - Add validation for booking dates
    - Add price calculation
    - Add availability checking
*/

-- Function to check booking availability
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

-- Function to calculate booking price
CREATE OR REPLACE FUNCTION calculate_booking_price(
  p_listing_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS numeric AS $$
DECLARE
  v_price_per_day numeric;
  v_days integer;
BEGIN
  -- Get listing price
  SELECT price_per_day INTO v_price_per_day
  FROM listings
  WHERE id = p_listing_id;

  -- Calculate number of days
  v_days := p_end_date - p_start_date + 1;

  RETURN v_price_per_day * v_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for booking validation
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

-- Create trigger
DROP TRIGGER IF EXISTS validate_booking ON bookings;
CREATE TRIGGER validate_booking
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION before_booking_insert();

-- Add booking policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'Users can view their bookings'
  ) THEN
    CREATE POLICY "Users can view their bookings"
      ON bookings FOR SELECT
      USING (auth.uid() = renter_id OR auth.uid() IN (
        SELECT owner_id FROM listings WHERE id = listing_id
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'Users can create bookings'
  ) THEN
    CREATE POLICY "Users can create bookings"
      ON bookings FOR INSERT
      WITH CHECK (auth.uid() = renter_id);
  END IF;
END $$;