-- Drop trigger first to remove dependency
DROP TRIGGER IF EXISTS check_promotion_status ON promotions;

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS is_listing_promoted(uuid);
DROP FUNCTION IF EXISTS get_promoted_listings(integer);
DROP FUNCTION IF EXISTS check_promotion_status(uuid);
DROP FUNCTION IF EXISTS update_promotion_status();

-- Drop and recreate promotions table if it exists
DROP TABLE IF EXISTS promotions CASCADE;

CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  amount_paid numeric NOT NULL,
  payment_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Enable Row Level Security
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'promotions_listing_id_idx') THEN
    CREATE INDEX promotions_listing_id_idx ON promotions(listing_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'promotions_user_id_idx') THEN
    CREATE INDEX promotions_user_id_idx ON promotions(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'promotions_status_idx') THEN
    CREATE INDEX promotions_status_idx ON promotions(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'promotions_end_date_idx') THEN
    CREATE INDEX promotions_end_date_idx ON promotions(end_date);
  END IF;
END $$;

-- Create policies for the promotions table
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (status = 'active');

DROP POLICY IF EXISTS "Users can view all their promotions" ON promotions;
CREATE POLICY "Users can view all their promotions"
  ON promotions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create promotions for their own listings" ON promotions;
CREATE POLICY "Users can create promotions for their own listings"
  ON promotions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own promotions" ON promotions;
CREATE POLICY "Users can update their own promotions"
  ON promotions FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check if a listing is promoted
CREATE FUNCTION is_listing_promoted(p_listing_id uuid)
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
CREATE FUNCTION get_promoted_listings(limit_count integer DEFAULT 10)
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
CREATE FUNCTION check_promotion_status(p_listing_id uuid)
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
CREATE FUNCTION update_promotion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update expired promotions
  IF NEW.status = 'active' AND NEW.end_date < now() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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