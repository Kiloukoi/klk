-- Create listing-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Users can upload listing images" ON storage.objects;
  DROP POLICY IF EXISTS "Anyone can view listing images" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own listing images" ON storage.objects;
END $$;

-- Create storage policies with proper checks
CREATE POLICY "Users can upload listing images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view listing images"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Function to delete listing images when a listing is deleted
CREATE OR REPLACE FUNCTION delete_listing_images()
RETURNS TRIGGER AS $$
DECLARE
  image_url text;
  file_name text;
BEGIN
  IF OLD.images IS NOT NULL THEN
    FOREACH image_url IN ARRAY OLD.images
    LOOP
      -- Extract filename from URL
      file_name := substring(image_url from '/listing-images/([^/]+)$');
      IF file_name IS NOT NULL THEN
        -- Delete object from bucket
        DELETE FROM storage.objects
        WHERE bucket_id = 'listing-images'
        AND name = file_name;
      END IF;
    END LOOP;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic image deletion
DROP TRIGGER IF EXISTS trigger_delete_listing_images ON listings;
CREATE TRIGGER trigger_delete_listing_images
  BEFORE DELETE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION delete_listing_images();

-- Ensure ON DELETE CASCADE for bookings
DO $$ 
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE bookings 
    DROP CONSTRAINT IF EXISTS bookings_listing_id_fkey;

  -- Add new constraint with CASCADE
  ALTER TABLE bookings
    ADD CONSTRAINT bookings_listing_id_fkey
    FOREIGN KEY (listing_id)
    REFERENCES listings(id)
    ON DELETE CASCADE;
END $$;