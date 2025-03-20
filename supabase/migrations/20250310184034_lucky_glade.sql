/*
  # Add Promotions System

  1. New Tables
    - `promotions`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `user_id` (uuid, references profiles)
      - `start_date` (timestamptz)
      - `end_date` (timestamptz)
      - `status` (text: pending, active, expired, cancelled)
      - `amount_paid` (numeric)
      - `payment_id` (text)
      - `created_at` (timestamptz)

  2. Functions
    - `check_promotion_expiry()`: Automatically updates promotion status based on dates
    - `is_listing_promoted()`: Checks if a listing is currently promoted
    - `get_promoted_listings()`: Returns all currently promoted listings
    - `handle_promotion_payment()`: Handles payment callback and creates promotion

  3. Security
    - Enable RLS on promotions table
    - Add policies for CRUD operations
    - Add trigger for automatic status updates
*/

-- Drop existing objects if they exist
DROP FUNCTION IF EXISTS handle_promotion_payment(uuid, uuid, text, numeric, integer);
DROP FUNCTION IF EXISTS get_promoted_listings();
DROP FUNCTION IF EXISTS is_listing_promoted(uuid);
DROP FUNCTION IF EXISTS check_promotion_expiry();
DROP TABLE IF EXISTS promotions;

-- Create promotions table
CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id),
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  amount_paid numeric NOT NULL CHECK (amount_paid >= 0),
  payment_id text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create indexes
CREATE INDEX promotions_listing_id_idx ON promotions(listing_id);
CREATE INDEX promotions_user_id_idx ON promotions(user_id);
CREATE INDEX promotions_status_idx ON promotions(status);
CREATE INDEX promotions_end_date_idx ON promotions(end_date);

-- Enable RLS
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Users can create promotions for their own listings" ON promotions;
DROP POLICY IF EXISTS "Users can update their own promotions" ON promotions;

-- Create RLS policies
CREATE POLICY "Users can view active promotions"
  ON promotions
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Users can create promotions for their own listings"
  ON promotions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM listings
      WHERE id = listing_id
      AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own promotions"
  ON promotions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to check promotion expiry
CREATE OR REPLACE FUNCTION check_promotion_expiry()
RETURNS trigger AS $$
BEGIN
  -- Set status based on dates
  IF NEW.start_date > CURRENT_TIMESTAMP THEN
    NEW.status := 'pending';
  ELSIF NEW.end_date < CURRENT_TIMESTAMP THEN
    NEW.status := 'expired';
  ELSE
    NEW.status := 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS check_promotion_expiry_trigger ON promotions;

-- Create trigger for automatic status updates
CREATE TRIGGER check_promotion_expiry_trigger
  BEFORE INSERT OR UPDATE ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION check_promotion_expiry();

-- Function to check if a listing is promoted
CREATE OR REPLACE FUNCTION is_listing_promoted(listing_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM promotions
    WHERE promotions.listing_id = $1
    AND status = 'active'
    AND start_date <= CURRENT_TIMESTAMP
    AND end_date > CURRENT_TIMESTAMP
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get all promoted listings
CREATE OR REPLACE FUNCTION get_promoted_listings()
RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT l.*
  FROM listings l
  INNER JOIN promotions p ON p.listing_id = l.id
  WHERE p.status = 'active'
  AND p.start_date <= CURRENT_TIMESTAMP
  AND p.end_date > CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Function to handle promotion payment callback
CREATE OR REPLACE FUNCTION handle_promotion_payment(
  p_listing_id uuid,
  p_user_id uuid,
  p_payment_id text,
  p_amount numeric,
  p_duration_days integer
)
RETURNS uuid AS $$
DECLARE
  v_promotion_id uuid;
BEGIN
  -- Insert new promotion
  INSERT INTO promotions (
    listing_id,
    user_id,
    start_date,
    end_date,
    status,
    amount_paid,
    payment_id
  ) VALUES (
    p_listing_id,
    p_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + (p_duration_days || ' days')::interval,
    'active',
    p_amount,
    p_payment_id
  )
  RETURNING id INTO v_promotion_id;

  RETURN v_promotion_id;
END;
$$ LANGUAGE plpgsql;