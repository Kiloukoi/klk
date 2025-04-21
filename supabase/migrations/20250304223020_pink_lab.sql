-- Drop trigger first to remove dependency
DROP TRIGGER IF EXISTS check_promotion_status ON promotions;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS is_listing_promoted(uuid);
DROP FUNCTION IF EXISTS get_promoted_listings(integer);
DROP FUNCTION IF EXISTS check_promotion_status(uuid);
DROP FUNCTION IF EXISTS update_promotion_status();

-- Function to check if a listing is promoted
CREATE OR REPLACE FUNCTION is_listing_promoted(p_listing_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM promotions 
    WHERE listing_id = p_listing_id
    AND status = 'active'
    AND now() BETWEEN start_date AND end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get promoted listings with full details
CREATE OR REPLACE FUNCTION get_promoted_listings(limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price_per_day numeric,
  location text,
  images text[],
  owner_id uuid,
  created_at timestamptz,
  category_id uuid,
  subcategory_id uuid,
  metadata jsonb,
  postal_code text,
  city text,
  is_promoted boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.*,
    true as is_promoted
  FROM listings l
  JOIN promotions p ON l.id = p.listing_id
  WHERE p.status = 'active'
  AND now() BETWEEN p.start_date AND p.end_date
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check promotion status
CREATE OR REPLACE FUNCTION check_promotion_status(p_listing_id uuid)
RETURNS TABLE (
  is_promoted boolean,
  start_date timestamptz,
  end_date timestamptz,
  days_remaining integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true as is_promoted,
    p.start_date,
    p.end_date,
    EXTRACT(DAY FROM (p.end_date - now()))::integer as days_remaining
  FROM promotions p
  WHERE p.listing_id = p_listing_id
  AND p.status = 'active'
  AND now() BETWEEN p.start_date AND p.end_date
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update promotion status
CREATE OR REPLACE FUNCTION update_promotion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update expired promotions
  IF NEW.status = 'active' AND NEW.end_date < now() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER check_promotion_status
  BEFORE INSERT OR UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_status();

-- Expose functions via the API REST
COMMENT ON FUNCTION is_listing_promoted IS 'Vérifie si une annonce est actuellement mise en avant';
COMMENT ON FUNCTION get_promoted_listings IS 'Récupère les annonces actuellement mises en avant';
COMMENT ON FUNCTION check_promotion_status IS 'Vérifie le statut de promotion d''une annonce';

GRANT EXECUTE ON FUNCTION is_listing_promoted TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_promoted_listings TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_promotion_status TO anon, authenticated, service_role;