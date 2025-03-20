-- Add function to generate random username
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS text AS $$
DECLARE
  v_username text;
  v_number int;
  v_exists boolean;
BEGIN
  -- Generate a random 4-digit number
  v_number := floor(random() * 9000 + 1000)::int;
  
  -- Create username
  v_username := 'Kilouwer#' || v_number::text;
  
  -- Check if username exists
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE username = v_username
  ) INTO v_exists;
  
  -- If exists, recursively try again
  IF v_exists THEN
    RETURN generate_random_username();
  END IF;
  
  RETURN v_username;
END;
$$ LANGUAGE plpgsql;

-- Add postal_code and city columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS city text;

-- Update handle_new_user function to set random username
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    full_name,
    avatar_url,
    postal_code,
    city
  )
  VALUES (
    new.id,
    generate_random_username(),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    NULL,
    NULL
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS profiles_postal_code_idx ON profiles(postal_code);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON profiles(city);