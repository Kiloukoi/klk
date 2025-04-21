-- Drop existing message policies and triggers
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
DROP TRIGGER IF EXISTS trigger_booking_status_message ON bookings;
DROP FUNCTION IF EXISTS send_booking_status_message();

-- Create simplified message policies
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
  USING (auth.uid() = receiver_id)
  WITH CHECK (
    auth.uid() = receiver_id AND
    read_at IS NULL
  );

-- Safely handle indexes
DO $$ 
DECLARE
  v_index_exists boolean;
BEGIN
  -- Drop old indexes if they exist
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_sender_id_idx') THEN
    DROP INDEX messages_sender_id_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_receiver_id_idx') THEN
    DROP INDEX messages_receiver_id_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_listing_id_idx') THEN
    DROP INDEX messages_listing_id_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_created_at_idx') THEN
    DROP INDEX messages_created_at_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_read_at_idx') THEN
    DROP INDEX messages_read_at_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_conversation') THEN
    DROP INDEX idx_messages_conversation;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_messages_listing_participants') THEN
    DROP INDEX idx_messages_listing_participants;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_sender_receiver_idx') THEN
    DROP INDEX messages_sender_receiver_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_conversation_idx') THEN
    DROP INDEX messages_conversation_idx;
  END IF;

  -- Create new indexes only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_conversation_new_idx') THEN
    CREATE INDEX messages_conversation_new_idx 
    ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_listing_parts_new_idx') THEN
    CREATE INDEX messages_listing_parts_new_idx 
    ON messages(listing_id, sender_id, receiver_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_created_new_idx') THEN
    CREATE INDEX messages_created_new_idx 
    ON messages(created_at);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_unread_new_idx') THEN
    CREATE INDEX messages_unread_new_idx 
    ON messages(read_at) 
    WHERE read_at IS NULL;
  END IF;
END $$;

-- Add function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*)
  FROM messages
  WHERE receiver_id = user_id
  AND read_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');