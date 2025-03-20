-- Get the Multimedia category ID
DO $$ 
DECLARE
  multimedia_id uuid;
BEGIN
  -- Get or create the Multimedia category
  SELECT id INTO multimedia_id FROM categories WHERE slug = 'multimedia';
  
  IF multimedia_id IS NULL THEN
    INSERT INTO categories (name, slug)
    VALUES ('Multimédia', 'multimedia')
    RETURNING id INTO multimedia_id;
  END IF;

  -- Delete any existing subcategories for Multimedia to avoid duplicates
  DELETE FROM subcategories
  WHERE category_id = multimedia_id;

  -- Insert main Multimedia subcategories
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES 
    ('Téléviseurs', 'televiseurs', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'TV LED',
        'TV OLED',
        'TV QLED',
        'Vidéoprojecteurs',
        'Accessoires TV'
      )
    )),
    
    ('Ordinateurs', 'ordinateurs', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Ordinateurs portables',
        'Ordinateurs de bureau',
        'Tablettes',
        'Accessoires informatiques',
        'Écrans'
      )
    )),
    
    ('Téléphones', 'telephones', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Smartphones',
        'Téléphones fixes',
        'Accessoires téléphonie'
      )
    )),
    
    ('Audio', 'audio', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Enceintes',
        'Casques audio',
        'Home cinéma',
        'Barres de son',
        'Platines vinyle'
      )
    )),
    
    ('Photo & Vidéo', 'photo-video', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Appareils photo',
        'Caméras',
        'Objectifs',
        'Accessoires photo',
        'Drones'
      )
    )),
    
    ('Consoles & Jeux', 'consoles-jeux', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Consoles',
        'Manettes',
        'Jeux vidéo',
        'Accessoires gaming'
      )
    ));

END $$;

-- Drop trigger first to remove dependency
DROP TRIGGER IF EXISTS check_booking_expiry_trigger ON bookings;

-- Then drop functions
DROP FUNCTION IF EXISTS cancel_expired_pending_bookings() CASCADE;
DROP FUNCTION IF EXISTS check_booking_expiry() CASCADE;

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
CREATE TRIGGER check_booking_expiry_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_expiry();

-- Expose the function via the API REST
COMMENT ON FUNCTION cancel_expired_pending_bookings IS 'Annule automatiquement les réservations en attente dont la date de début est dépassée';
GRANT EXECUTE ON FUNCTION cancel_expired_pending_bookings TO authenticated;

-- Run the function immediately to cancel any currently expired bookings
SELECT cancel_expired_pending_bookings();