-- Drop existing message policies and triggers
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can create messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
DROP TRIGGER IF EXISTS trigger_booking_status_message ON bookings;
DROP FUNCTION IF EXISTS send_booking_status_message();

-- Create message policies
CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND 
    sender_id != receiver_id AND
    (
      listing_id IS NULL OR
      EXISTS (
        SELECT 1 FROM listings l
        WHERE l.id = listing_id AND (
          l.owner_id = auth.uid()
          OR l.owner_id = receiver_id
          OR EXISTS (
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
  WITH CHECK (auth.uid() = receiver_id AND read_at IS NULL);

-- Create message status function with improved username handling
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
    COALESCE(p.username, 'Utilisateur') -- Fallback if username is null
  INTO 
    v_listing_title,
    v_sender_username
  FROM listings l
  JOIN profiles p ON p.id = NEW.owner_id
  WHERE l.id = NEW.listing_id;

  v_start_date := to_char(NEW.start_date, 'DD/MM/YYYY');
  v_end_date := to_char(NEW.end_date, 'DD/MM/YYYY');
  v_total_price := NEW.total_price::text;

  IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status IN ('confirmed', 'cancelled') THEN
    IF NEW.status = 'confirmed' THEN
      v_message := format(
        '%s : Votre réservation pour "%s" a été acceptée ! 🎉\n\nDates : du %s au %s\nMontant total : %s€\n\nJe vous souhaite une excellente location ! N''hésitez pas si vous avez des questions.',
        v_sender_username, v_listing_title, v_start_date, v_end_date, v_total_price
      );
    ELSE
      v_message := format(
        '%s : Votre réservation pour "%s" a été refusée.\n\nDates demandées : du %s au %s\n\nN''hésitez pas à consulter d''autres annonces similaires ou à me contacter pour plus d''informations.',
        v_sender_username, v_listing_title, v_start_date, v_end_date
      );
    END IF;

    INSERT INTO messages (content, sender_id, receiver_id, listing_id)
    VALUES (v_message, NEW.owner_id, NEW.renter_id, NEW.listing_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_booking_status_message
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_status_message();

-- Drop existing indexes to avoid conflicts
DROP INDEX IF EXISTS messages_conversation_idx;
DROP INDEX IF EXISTS messages_listing_participants_idx;
DROP INDEX IF EXISTS messages_read_at_idx;
DROP INDEX IF EXISTS messages_created_at_idx;
DROP INDEX IF EXISTS messages_conversation_new_idx;
DROP INDEX IF EXISTS messages_listing_parts_new_idx;
DROP INDEX IF EXISTS messages_created_new_idx;
DROP INDEX IF EXISTS messages_unread_new_idx;
DROP INDEX IF EXISTS messages_conv_idx_2025;
DROP INDEX IF EXISTS messages_parts_idx_2025;
DROP INDEX IF EXISTS messages_date_idx_2025;
DROP INDEX IF EXISTS messages_unread_idx_2025;

-- Create new indexes
CREATE INDEX messages_conv_idx_2025 ON messages(LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id));
CREATE INDEX messages_parts_idx_2025 ON messages(listing_id, sender_id, receiver_id);
CREATE INDEX messages_date_idx_2025 ON messages(created_at DESC);
CREATE INDEX messages_unread_idx_2025 ON messages(read_at) WHERE read_at IS NULL;

-- Function to get sender username
CREATE OR REPLACE FUNCTION get_message_sender_name(message_id uuid)
RETURNS text AS $$
  SELECT COALESCE(p.username, 'Utilisateur')
  FROM messages m
  JOIN profiles p ON p.id = m.sender_id
  WHERE m.id = message_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_message_sender_name TO authenticated;

-- Refresh schema cache
SELECT pg_notify('pgrst', 'reload schema');