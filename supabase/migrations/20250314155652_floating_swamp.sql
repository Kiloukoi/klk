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

-- Drop existing indexes to avoid conflicts
DO $$ 
BEGIN
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

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'messages_listing_participants_idx') THEN
    DROP INDEX messages_listing_participants_idx;
  END IF;
END $$;

-- Create new optimized indexes
CREATE INDEX messages_conversation_new_idx ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));
CREATE INDEX messages_listing_parts_new_idx ON messages(listing_id, sender_id, receiver_id);
CREATE INDEX messages_created_new_idx ON messages(created_at);
CREATE INDEX messages_unread_new_idx ON messages(read_at) WHERE read_at IS NULL;

-- Function to handle booking status changes and send notifications
CREATE OR REPLACE FUNCTION send_booking_status_message()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_title text;
  v_sender_username text;
  v_message text;
  v_start_date text;
  v_end_date text;
  v_total_price text;
BEGIN
  -- Get the listing title and sender username
  SELECT 
    l.title,
    p.username 
  INTO 
    v_listing_title,
    v_sender_username
  FROM listings l
  JOIN profiles p ON p.id = NEW.owner_id
  WHERE l.id = NEW.listing_id;

  -- Format dates
  v_start_date := to_char(NEW.start_date, 'DD/MM/YYYY');
  v_end_date := to_char(NEW.end_date, 'DD/MM/YYYY');
  v_total_price := NEW.total_price::text;

  -- Only send message if status has changed and it's a confirmation or cancellation
  IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status IN ('confirmed', 'cancelled') THEN
    -- Construct message based on status
    IF NEW.status = 'confirmed' THEN
      v_message := format(
        '%s : Votre réservation pour "%s" a été acceptée ! 🎉

Dates : du %s au %s
Montant total : %s€

Je vous souhaite une excellente location ! N''hésitez pas si vous avez des questions.',
        v_sender_username,
        v_listing_title,
        v_start_date,
        v_end_date,
        v_total_price
      );
    ELSE -- cancelled
      v_message := format(
        '%s : Votre réservation pour "%s" a été refusée.

Dates demandées : du %s au %s

N''hésitez pas à consulter d''autres annonces similaires ou à me contacter pour plus d''informations.',
        v_sender_username,
        v_listing_title,
        v_start_date,
        v_end_date
      );
    END IF;

    -- Insert the message
    INSERT INTO messages (
      content,
      sender_id,
      receiver_id,
      listing_id
    ) VALUES (
      v_message,
      NEW.owner_id,
      NEW.renter_id,
      NEW.listing_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking status changes
CREATE TRIGGER trigger_booking_status_message
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_status_message();

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');