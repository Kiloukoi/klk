/*
  # Initial Schema Setup for Rental Marketplace

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - username (text)
      - full_name (text)
      - avatar_url (text)
      - created_at (timestamp)
    
    - listings
      - id (uuid)
      - title (text)
      - description (text)
      - price_per_day (numeric)
      - location (text)
      - owner_id (uuid, references profiles)
      - category (text)
      - created_at (timestamp)
      - images (text[])
      
    - bookings
      - id (uuid)
      - listing_id (uuid, references listings)
      - renter_id (uuid, references profiles)
      - start_date (date)
      - end_date (date)
      - status (text)
      - total_price (numeric)
      - created_at (timestamp)
      
    - reviews
      - id (uuid)
      - booking_id (uuid, references bookings)
      - rating (integer)
      - comment (text)
      - created_at (timestamp)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create listings table
CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price_per_day numeric NOT NULL CHECK (price_per_day >= 0),
  location text NOT NULL,
  owner_id uuid REFERENCES profiles NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  images text[] DEFAULT '{}'::text[]
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

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

-- Create bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings NOT NULL,
  renter_id uuid REFERENCES profiles NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now(),
  CHECK (end_date >= start_date)
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

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

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT renter_id FROM bookings 
      WHERE id = booking_id AND status = 'completed'
    )
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();