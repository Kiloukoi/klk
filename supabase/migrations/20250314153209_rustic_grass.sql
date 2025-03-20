-- Drop the trigger and function for automatic messages
DROP TRIGGER IF EXISTS trigger_booking_status_message ON bookings;
DROP FUNCTION IF EXISTS send_booking_status_message();

-- Drop existing message policies
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

-- Recreate message policies without automatic message creation
CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    sender_id != receiver_id AND
    (
      -- Allow messages without a listing_id
      listing_id IS NULL
      OR
      -- Or allow messages with a listing_id if:
      EXISTS (
        SELECT 1 FROM listings l
        WHERE l.id = listing_id AND (
          -- User is the owner of the listing
          l.owner_id = auth.uid()
          OR
          -- User is messaging the owner of the listing
          (l.owner_id = receiver_id)
          OR
          -- User has a booking for this listing
          EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.listing_id = l.id
            AND b.status IN ('pending', 'confirmed', 'completed')
            AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid())
          )
          OR
          -- User has an existing conversation about this listing
          EXISTS (
            SELECT 1 FROM messages m
            WHERE m.listing_id = l.id
            AND (
              (m.sender_id = auth.uid() AND m.receiver_id = receiver_id)
              OR 
              (m.receiver_id = auth.uid() AND m.sender_id = receiver_id)
            )
          )
        )
      )
    )
  );

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id AND
    read_at IS NULL
  );

-- Add indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));

CREATE INDEX IF NOT EXISTS idx_messages_listing_participants 
  ON messages(listing_id, sender_id, receiver_id);

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');