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
    sender_id != receiver_id AND
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

-- Add function to send a message when a booking status changes
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
DROP TRIGGER IF EXISTS trigger_booking_status_message ON bookings;
CREATE TRIGGER trigger_booking_status_message
  AFTER UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_status_message();

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');