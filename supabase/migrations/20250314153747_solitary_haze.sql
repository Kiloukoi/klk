-- Drop existing message policies and triggers
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

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
  -- Check and create conversation index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'messages_conversation_idx'
  ) THEN
    CREATE INDEX messages_conversation_idx 
    ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));
  END IF;

  -- Check and create listing participants index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'messages_listing_participants_idx'
  ) THEN
    CREATE INDEX messages_listing_participants_idx 
    ON messages(listing_id, sender_id, receiver_id);
  END IF;

  -- Check and create read_at index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'messages_read_at_idx'
  ) THEN
    CREATE INDEX messages_read_at_idx 
    ON messages(read_at) 
    WHERE read_at IS NULL;
  END IF;

  -- Check and create created_at index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'messages_created_at_idx'
  ) THEN
    CREATE INDEX messages_created_at_idx 
    ON messages(created_at);
  END IF;
END $$;

-- Function to get sender username for a message
CREATE OR REPLACE FUNCTION get_message_sender_username(message_id uuid)
RETURNS text AS $$
  SELECT username
  FROM profiles
  WHERE id = (
    SELECT sender_id
    FROM messages
    WHERE id = message_id
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_message_count(user_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*)
  FROM messages
  WHERE receiver_id = user_id
  AND read_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_message_sender_username TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_message_count TO authenticated;

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');