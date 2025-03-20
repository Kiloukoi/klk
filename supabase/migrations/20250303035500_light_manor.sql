-- Check if columns already exist before adding them
DO $$ 
BEGIN
  -- Add postal_code column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE listings ADD COLUMN postal_code text;
  END IF;

  -- Add city column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'city'
  ) THEN
    ALTER TABLE listings ADD COLUMN city text;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS listings_postal_code_idx ON listings(postal_code);
CREATE INDEX IF NOT EXISTS listings_city_idx ON listings(city);
CREATE INDEX IF NOT EXISTS listings_location_idx ON listings(location);

-- Drop existing search function if it exists
DROP FUNCTION IF EXISTS search_listings(text);

-- Create new search function
CREATE OR REPLACE FUNCTION search_listings(search_term text)
RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM listings
  WHERE 
    title ILIKE '%' || search_term || '%'
    OR description ILIKE '%' || search_term || '%'
    OR location ILIKE '%' || search_term || '%'
    OR postal_code ILIKE '%' || search_term || '%'
    OR city ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;