-- Drop existing policies first
DO $$ 
BEGIN
  -- Drop policies for profiles
  DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
  DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

  -- Drop policies for categories
  DROP POLICY IF EXISTS "Categories are viewable by everyone" ON categories;

  -- Drop policies for subcategories
  DROP POLICY IF EXISTS "Subcategories are viewable by everyone" ON subcategories;

  -- Drop policies for listings
  DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
  DROP POLICY IF EXISTS "Users can create their own listings" ON listings;
  DROP POLICY IF EXISTS "Users can update their own listings" ON listings;
  DROP POLICY IF EXISTS "Users can delete their own listings" ON listings;

  -- Drop policies for bookings
  DROP POLICY IF EXISTS "Users can view their own bookings and bookings for their listings" ON bookings;
  DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
  DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;

  -- Drop policies for reviews
  DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
  DROP POLICY IF EXISTS "Users can create reviews for their completed bookings" ON reviews;
  DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

  -- Drop policies for favorites
  DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
  DROP POLICY IF EXISTS "Users can add favorites" ON favorites;
  DROP POLICY IF EXISTS "Users can remove their own favorites" ON favorites;

  -- Drop policies for messages
  DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
  DROP POLICY IF EXISTS "Users can create messages" ON messages;
  DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

  -- Drop policies for promotions
  DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
  DROP POLICY IF EXISTS "Users can view all their promotions" ON promotions;
  DROP POLICY IF EXISTS "Users can create promotions for their own listings" ON promotions;
  DROP POLICY IF EXISTS "Users can update their own promotions" ON promotions;
END $$;

-- Create policies for each table
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Subcategories are viewable by everyone"
  ON subcategories FOR SELECT
  USING (true);

CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own listings"
  ON listings FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own listings"
  ON listings FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own listings"
  ON listings FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own bookings and bookings for their listings"
  ON bookings FOR SELECT
  USING (
    auth.uid() = renter_id OR 
    auth.uid() IN (
      SELECT owner_id FROM listings WHERE id = listing_id
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Users can update their own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = renter_id);

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

CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (
    auth.uid() = receiver_id AND
    read_at IS NULL
  );

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

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;

-- Create triggers
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();