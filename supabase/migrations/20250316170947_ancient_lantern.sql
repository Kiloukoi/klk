-- Drop and recreate the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username text;
BEGIN
  -- Generate username with retry logic
  FOR i IN 1..5 LOOP -- Try up to 5 times
    v_username := 'Kilouwer#' || floor(random() * 9000 + 1000)::text;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM profiles WHERE username = v_username
    );
  END LOOP;

  -- If we couldn't generate a unique username after 5 tries, use timestamp
  IF EXISTS (SELECT 1 FROM profiles WHERE username = v_username) THEN
    v_username := 'Kilouwer#' || floor(extract(epoch from now()))::text;
  END IF;

  -- Insert new profile with error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      username,
      full_name,
      avatar_url,
      created_at,
      updated_at
    )
    VALUES (
      new.id,
      v_username,
      COALESCE(new.raw_user_meta_data->>'full_name', NULL),
      COALESCE(new.raw_user_meta_data->>'avatar_url', NULL),
      now(),
      now()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- If username is taken, try with timestamp
      INSERT INTO public.profiles (
        id,
        username,
        full_name,
        avatar_url,
        created_at,
        updated_at
      )
      VALUES (
        new.id,
        'Kilouwer#' || floor(extract(epoch from now()))::text,
        COALESCE(new.raw_user_meta_data->>'full_name', NULL),
        COALESCE(new.raw_user_meta_data->>'avatar_url', NULL),
        now(),
        now()
      );
  END;

  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error details to help with debugging
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();