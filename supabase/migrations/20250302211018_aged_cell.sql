-- Drop the reviews table if it exists
DROP TABLE IF EXISTS reviews;

-- Create the reviews table with all required columns
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
CREATE INDEX reviews_booking_id_idx ON reviews(booking_id);
CREATE INDEX reviews_listing_id_idx ON reviews(listing_id);
CREATE INDEX reviews_owner_id_idx ON reviews(owner_id);
CREATE INDEX reviews_reviewer_id_idx ON reviews(reviewer_id);

-- Create trigger for updating the updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

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