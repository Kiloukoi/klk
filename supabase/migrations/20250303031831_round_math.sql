-- Drop existing objects if they exist
DROP TABLE IF EXISTS promotions CASCADE;
DROP FUNCTION IF EXISTS is_listing_promoted CASCADE;
DROP FUNCTION IF EXISTS get_promoted_listings CASCADE;
DROP FUNCTION IF EXISTS check_promotion_status CASCADE;
DROP FUNCTION IF EXISTS activate_promotion CASCADE;

-- Create promotions table
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
CREATE INDEX promotions_listing_id_idx ON promotions(listing_id);
CREATE INDEX promotions_user_id_idx ON promotions(user_id);
CREATE INDEX promotions_status_idx ON promotions(status);
CREATE INDEX promotions_end_date_idx ON promotions(end_date);

-- Create policies for the promotions table
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can view all their promotions"
  ON promotions FOR SELECT
  USING (auth.uid() = user_id);

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

CREATE POLICY "Users can update their own promotions"
  ON promotions FOR UPDATE
  USING (auth.uid() = user_id);

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

-- Function to activate a promotion after successful payment
CREATE OR REPLACE FUNCTION activate_promotion(
  p_listing_id uuid,
  p_payment_id text,
  p_duration_days integer
)
RETURNS uuid AS $$
DECLARE
  v_promotion_id uuid;
BEGIN
  -- Insert new promotion with active status
  INSERT INTO promotions (
    listing_id,
    user_id,
    start_date,
    end_date,
    status,
    amount_paid,
    payment_id
  )
  VALUES (
    p_listing_id,
    auth.uid(),
    now(),
    now() + (p_duration_days || ' days')::interval,
    'active',
    CASE 
      WHEN p_duration_days = 7 THEN 2.99
      WHEN p_duration_days = 30 THEN 9.99
      ELSE 0
    END,
    p_payment_id
  )
  RETURNING id INTO v_promotion_id;

  RETURN v_promotion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update promotion status
CREATE OR REPLACE FUNCTION update_promotion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update expired promotions
  UPDATE promotions
  SET status = 'expired'
  WHERE id = NEW.id
  AND status = 'active'
  AND end_date < now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_promotion_status ON promotions;
CREATE TRIGGER check_promotion_status
  AFTER INSERT OR UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_promotion_status();

-- Expose functions via the API REST
COMMENT ON FUNCTION is_listing_promoted IS 'Vérifie si une annonce est actuellement mise en avant';
COMMENT ON FUNCTION get_promoted_listings IS 'Récupère les annonces actuellement mises en avant';
COMMENT ON FUNCTION check_promotion_status IS 'Vérifie le statut de promotion d''une annonce';
COMMENT ON FUNCTION activate_promotion IS 'Active une promotion après un paiement réussi';

GRANT EXECUTE ON FUNCTION is_listing_promoted TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_promoted_listings TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_promotion_status TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION activate_promotion TO authenticated;