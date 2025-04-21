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
      -- Allow messages between users who have interacted through listings
      EXISTS (
        SELECT 1 FROM listings 
        WHERE id = listing_id 
        AND (
          -- Owner can message renters
          (owner_id = auth.uid() AND receiver_id IN (
            SELECT renter_id FROM bookings 
            WHERE listing_id = messages.listing_id
          ))
          OR 
          -- Renters can message owners
          (owner_id = receiver_id AND auth.uid() IN (
            SELECT renter_id FROM bookings 
            WHERE listing_id = messages.listing_id
          ))
          OR
          -- Allow messages for active bookings
          EXISTS (
            SELECT 1 FROM bookings 
            WHERE listing_id = messages.listing_id 
            AND status IN ('pending', 'confirmed')
            AND (
              (renter_id = auth.uid() AND owner_id = receiver_id)
              OR 
              (owner_id = auth.uid() AND renter_id = receiver_id)
            )
          )
        )
      )
      -- Or allow messages without a listing_id between users with existing conversations
      OR (
        listing_id IS NULL AND
        EXISTS (
          SELECT 1 FROM messages m
          WHERE (
            (m.sender_id = auth.uid() AND m.receiver_id = messages.receiver_id)
            OR 
            (m.receiver_id = auth.uid() AND m.sender_id = messages.receiver_id)
          )
        )
      )
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (
    auth.uid() = receiver_id AND
    read_at IS NULL
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS messages_sender_receiver_idx ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS messages_listing_id_idx ON messages(listing_id);
CREATE INDEX IF NOT EXISTS messages_read_at_idx ON messages(read_at) WHERE read_at IS NULL;

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');