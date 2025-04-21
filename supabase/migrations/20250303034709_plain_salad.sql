-- Add location columns if they don't exist
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

-- Create or replace indexes for better search performance
DROP INDEX IF EXISTS listings_postal_code_idx;
CREATE INDEX listings_postal_code_idx ON listings(postal_code);

DROP INDEX IF EXISTS listings_city_idx;
CREATE INDEX listings_city_idx ON listings(city);

DROP INDEX IF EXISTS listings_location_idx;
CREATE INDEX listings_location_idx ON listings(location);

-- Create or replace the search function
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the search function
COMMENT ON FUNCTION search_listings IS 'Search listings by title, description, location, postal code or city';
GRANT EXECUTE ON FUNCTION search_listings TO authenticated;