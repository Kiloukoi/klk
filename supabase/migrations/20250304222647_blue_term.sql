-- Create or replace the function to check if a listing is promoted
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

-- Expose the function via the API REST
COMMENT ON FUNCTION is_listing_promoted IS 'Vérifie si une annonce est actuellement mise en avant';
GRANT EXECUTE ON FUNCTION is_listing_promoted TO anon, authenticated, service_role;

-- Create promotions table if it doesn't exist
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
CREATE INDEX IF NOT EXISTS promotions_listing_id_idx ON promotions(listing_id);
CREATE INDEX IF NOT EXISTS promotions_user_id_idx ON promotions(user_id);
CREATE INDEX IF NOT EXISTS promotions_status_idx ON promotions(status);
CREATE INDEX IF NOT EXISTS promotions_end_date_idx ON promotions(end_date);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own promotions" ON promotions;
DROP POLICY IF EXISTS "Users can create promotions for their own listings" ON promotions;
DROP POLICY IF EXISTS "Users can update their own promotions" ON promotions;
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;

-- Create policies for the promotions table
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (status = 'active');

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