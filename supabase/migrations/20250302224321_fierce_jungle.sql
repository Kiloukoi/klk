/*
  # Listing Promotions System

  1. New Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `user_id` (uuid, references profiles)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `status` (text: active, expired, cancelled)
      - `amount_paid` (numeric)
      - `payment_id` (text)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `promotions` table
    - Add policies for authenticated users
*/

-- Create promotions table
CREATE TABLE IF NOT EXISTS promotions (
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
CREATE POLICY "Users can view their own promotions"
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
$$ LANGUAGE plpgsql;

-- Function to get promoted listings
CREATE OR REPLACE FUNCTION get_promoted_listings(limit_count integer DEFAULT 10)
RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT l.*
  FROM listings l
  JOIN promotions p ON l.id = p.listing_id
  WHERE p.status = 'active'
  AND now() BETWEEN p.start_date AND p.end_date
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Expose functions via the API REST
COMMENT ON FUNCTION is_listing_promoted IS 'Vérifie si une annonce est actuellement mise en avant';
COMMENT ON FUNCTION get_promoted_listings IS 'Récupère les annonces actuellement mises en avant';
GRANT EXECUTE ON FUNCTION is_listing_promoted TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_promoted_listings TO anon, authenticated, service_role;

-- Function to expire promotions
CREATE OR REPLACE FUNCTION expire_promotions()
RETURNS void AS $$
BEGIN
  UPDATE promotions
  SET status = 'expired'
  WHERE status = 'active'
  AND end_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically expire promotions
CREATE OR REPLACE FUNCTION check_promotion_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the promotion has expired
  IF NEW.status = 'active' AND NEW.end_date < now() THEN
    NEW.status := 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_promotion_expiry_trigger
  BEFORE INSERT OR UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION check_promotion_expiry();