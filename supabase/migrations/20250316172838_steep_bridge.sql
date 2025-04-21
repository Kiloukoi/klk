/*
  # Add promoted listings functionality

  1. Changes
    - Add is_promoted column to listings table
    - Add function to check if a listing is promoted
    - Add function to update promotion status
    - Add trigger for automatic updates
*/

-- Add is_promoted column to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS is_promoted boolean DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS listings_is_promoted_idx ON listings(is_promoted);

-- Drop existing functions and triggers first
DROP TRIGGER IF EXISTS trigger_update_listing_promotion ON promotions;
DROP FUNCTION IF EXISTS update_listing_promotion_status() CASCADE;
DROP FUNCTION IF EXISTS update_all_listings_promotion_status() CASCADE;
DROP FUNCTION IF EXISTS is_listing_promoted(uuid) CASCADE;

-- Function to check if a listing is promoted
CREATE OR REPLACE FUNCTION is_listing_promoted(p_id uuid)
RETURNS boolean AS $$
DECLARE
  v_is_promoted boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM promotions 
    WHERE listing_id = p_id
    AND status = 'active'
    AND now() BETWEEN start_date AND end_date
  ) INTO v_is_promoted;

  -- Update the listing's is_promoted flag
  UPDATE listings
  SET is_promoted = v_is_promoted
  WHERE id = p_id;

  RETURN v_is_promoted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update all listings' promotion status
CREATE OR REPLACE FUNCTION update_all_listings_promotion_status()
RETURNS void AS $$
BEGIN
  -- Reset all listings to not promoted
  UPDATE listings SET is_promoted = false;
  
  -- Update listings that have active promotions
  UPDATE listings
  SET is_promoted = true
  WHERE id IN (
    SELECT listing_id
    FROM promotions
    WHERE status = 'active'
    AND now() BETWEEN start_date AND end_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update listing promotion status
CREATE OR REPLACE FUNCTION update_listing_promotion_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the listing's is_promoted status
  UPDATE listings
  SET is_promoted = (
    SELECT EXISTS (
      SELECT 1 
      FROM promotions 
      WHERE listing_id = NEW.listing_id
      AND status = 'active'
      AND now() BETWEEN start_date AND end_date
    )
  )
  WHERE id = NEW.listing_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for promotion changes
CREATE TRIGGER trigger_update_listing_promotion
  AFTER INSERT OR UPDATE OF status, start_date, end_date ON promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_promotion_status();

-- Run initial update
SELECT update_all_listings_promotion_status();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_listing_promoted(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_all_listings_promotion_status() TO authenticated;