-- Drop existing message policies
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
    (
      -- Allow messages for listings where the user is either owner or has a booking
      listing_id IS NULL OR
      EXISTS (
        SELECT 1 FROM listings l
        WHERE l.id = listing_id AND (
          -- User is the owner
          l.owner_id = auth.uid()
          OR
          -- User is messaging the owner
          (l.owner_id = receiver_id)
          OR
          -- User has a booking for this listing
          EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.listing_id = l.id
            AND b.status IN ('pending', 'confirmed', 'completed')
            AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid())
          )
        )
      )
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    -- Only allow updating read_at field
    auth.uid() = receiver_id AND
    read_at IS NULL
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));

CREATE INDEX IF NOT EXISTS idx_messages_listing_participants 
  ON messages(listing_id, sender_id, receiver_id);

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');