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
    -- Basic checks
    auth.uid() = sender_id AND 
    sender_id != receiver_id AND
    (
      -- Allow direct messages without listing context
      listing_id IS NULL 
      OR 
      -- Allow messages about listings with valid context
      EXISTS (
        SELECT 1 FROM listings l
        WHERE l.id = listing_id AND (
          -- Allow if user is listing owner
          l.owner_id = auth.uid()
          OR
          -- Allow if user is messaging listing owner
          l.owner_id = receiver_id
          OR
          -- Allow if user has active/completed booking
          EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.listing_id = l.id
            AND b.status IN ('pending', 'confirmed', 'completed')
            AND (b.renter_id = auth.uid() OR b.owner_id = auth.uid())
          )
          OR
          -- Allow if there's an existing conversation
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
  USING (auth.uid() = receiver_id AND read_at IS NULL)
  WITH CHECK (
    auth.uid() = receiver_id AND
    read_at IS NULL
  );

-- Drop old indexes to avoid conflicts
DO $$ 
BEGIN
  -- Drop old indexes if they exist
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_conversation_new_idx') THEN
    DROP INDEX messages_conversation_new_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_listing_parts_new_idx') THEN
    DROP INDEX messages_listing_parts_new_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_created_new_idx') THEN
    DROP INDEX messages_created_new_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_unread_new_idx') THEN
    DROP INDEX messages_unread_new_idx;
  END IF;
END $$;

-- Create new optimized indexes
CREATE INDEX messages_conversation_idx ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));
CREATE INDEX messages_listing_parts_idx ON messages(listing_id, sender_id, receiver_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);
CREATE INDEX messages_unread_idx ON messages(read_at) WHERE read_at IS NULL;

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');