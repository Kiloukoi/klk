/*
  # Add listing pause functionality

  1. Changes
    - Add is_paused column to listings table
    - Add paused_at column to listings table
    - Update RLS policies to handle paused listings
    - Add function to toggle listing pause status
*/

-- Add new columns to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS is_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paused_at timestamptz;

-- Create function to toggle listing pause status
CREATE OR REPLACE FUNCTION toggle_listing_pause(p_listing_id uuid)
RETURNS boolean AS $$
DECLARE
  v_current_status boolean;
BEGIN
  -- Get current pause status
  SELECT is_paused INTO v_current_status
  FROM listings
  WHERE id = p_listing_id
  AND owner_id = auth.uid();

  -- Toggle status
  UPDATE listings
  SET 
    is_paused = NOT COALESCE(v_current_status, false),
    paused_at = CASE 
      WHEN NOT COALESCE(v_current_status, false) THEN now()
      ELSE NULL
    END
  WHERE id = p_listing_id
  AND owner_id = auth.uid()
  RETURNING is_paused INTO v_current_status;

  RETURN v_current_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION toggle_listing_pause TO authenticated;

-- Update listing select policy to filter out paused listings for non-owners
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON listings;
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  USING (
    NOT is_paused OR -- Show if not paused
    owner_id = auth.uid() -- Or if user is the owner
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS listings_is_paused_idx ON listings(is_paused);