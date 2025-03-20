-- Drop existing policies
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

-- Create updated policies for messages
CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    sender_id != receiver_id AND
    (
      -- Allow messages for listings where the user is either owner or has a booking
      EXISTS (
        SELECT 1 FROM listings 
        WHERE id = listing_id 
        AND (
          owner_id = auth.uid() OR 
          owner_id = receiver_id OR
          EXISTS (
            SELECT 1 FROM bookings 
            WHERE listing_id = messages.listing_id 
            AND (renter_id = auth.uid() OR renter_id = receiver_id)
          )
        )
      )
      -- Or allow messages without a listing_id (general messages)
      OR listing_id IS NULL
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (
    auth.uid() = receiver_id AND
    read_at IS NULL
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS messages_listing_id_idx ON messages(listing_id);

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');