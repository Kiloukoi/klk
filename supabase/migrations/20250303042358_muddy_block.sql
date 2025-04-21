-- Drop and recreate the reviews table to ensure it has the correct structure
DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES profiles(id) NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES profiles(id) NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for the reviews table
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
      AND bookings.renter_id = reviewer_id
      AND bookings.status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Create indexes for better performance
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_booking_id_idx') THEN
    CREATE INDEX reviews_booking_id_idx ON reviews(booking_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_listing_id_idx') THEN
    CREATE INDEX reviews_listing_id_idx ON reviews(listing_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_owner_id_idx') THEN
    CREATE INDEX reviews_owner_id_idx ON reviews(owner_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'reviews_reviewer_id_idx') THEN
    CREATE INDEX reviews_reviewer_id_idx ON reviews(reviewer_id);
  END IF;
END $$;

-- Create trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Create function to get owner rating
CREATE OR REPLACE FUNCTION get_owner_rating(owner_id uuid)
RETURNS TABLE(
  average_rating numeric,
  review_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::numeric(10,1), 0) as average_rating,
    COUNT(*) as review_count
  FROM reviews
  WHERE reviews.owner_id = get_owner_rating.owner_id;
END;
$$ LANGUAGE plpgsql;

-- Expose the function via the API REST
COMMENT ON FUNCTION get_owner_rating IS 'Calcule la note moyenne et le nombre d''évaluations d''un propriétaire';
GRANT EXECUTE ON FUNCTION get_owner_rating TO anon, authenticated, service_role;

-- Create promotions table if it doesn't exist
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
$$ LANGUAGE plpgsql;

-- Expose the function via the API REST
COMMENT ON FUNCTION is_listing_promoted IS 'Vérifie si une annonce est actuellement mise en avant';
GRANT EXECUTE ON FUNCTION is_listing_promoted TO anon, authenticated, service_role;

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
DROP TRIGGER IF EXISTS check_booking_expiry_trigger ON bookings;
CREATE TRIGGER check_booking_expiry_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_expiry();

-- Function to delete all messages for a conversation
CREATE OR REPLACE FUNCTION delete_conversation(p_user_id uuid, p_other_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete all messages between the two users
  DELETE FROM messages
  WHERE (sender_id = p_user_id AND receiver_id = p_other_user_id)
     OR (sender_id = p_other_user_id AND receiver_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a specific message
CREATE OR REPLACE FUNCTION delete_message(p_message_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_message_exists boolean;
BEGIN
  -- Check if the message exists and belongs to the user
  SELECT EXISTS (
    SELECT 1 
    FROM messages 
    WHERE id = p_message_id
    AND (sender_id = p_user_id OR receiver_id = p_user_id)
  ) INTO v_message_exists;

  -- If the message exists and belongs to the user, delete it
  IF v_message_exists THEN
    DELETE FROM messages
    WHERE id = p_message_id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Delete all user data in the correct order to respect foreign key constraints
  
  -- 1. Delete all reviews by the user
  DELETE FROM reviews
  WHERE reviewer_id = p_user_id;
  
  -- 2. Delete all favorites
  DELETE FROM favorites
  WHERE user_id = p_user_id;
  
  -- 3. Delete all promotions
  DELETE FROM promotions
  WHERE user_id = p_user_id;
  
  -- 4. Delete all messages
  DELETE FROM messages
  WHERE sender_id = p_user_id OR receiver_id = p_user_id;
  
  -- 5. Cancel all bookings where the user is the renter
  UPDATE bookings
  SET status = 'cancelled'
  WHERE renter_id = p_user_id AND status IN ('pending', 'confirmed');
  
  -- 6. Delete all listings (this will cascade to delete related bookings)
  DELETE FROM listings
  WHERE owner_id = p_user_id;
  
  -- 7. Delete the user profile
  DELETE FROM profiles
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose functions via the API REST
COMMENT ON FUNCTION delete_conversation IS 'Supprime tous les messages d''une conversation entre deux utilisateurs';
COMMENT ON FUNCTION delete_message IS 'Supprime un message spécifique';
COMMENT ON FUNCTION delete_user_account IS 'Supprime un compte utilisateur et toutes les données associées';

GRANT EXECUTE ON FUNCTION delete_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION delete_message TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;

-- Refresh the schema cache to make sure the functions are available
SELECT pg_notify('pgrst', 'reload schema');