-- Function to send a message when a booking status changes
CREATE OR REPLACE FUNCTION send_booking_status_message()
RETURNS TRIGGER AS $$
DECLARE
  v_listing_title text;
  v_message text;
  v_start_date text;
  v_end_date text;
  v_total_price text;
BEGIN
  -- Get the listing title
  SELECT title INTO v_listing_title
  FROM listings
  WHERE id = NEW.listing_id;

  -- Format dates
  v_start_date := to_char(NEW.start_date, 'DD/MM/YYYY');
  v_end_date := to_char(NEW.end_date, 'DD/MM/YYYY');
  v_total_price := NEW.total_price::text;

  -- Only send message if status has changed and it's a confirmation or cancellation
  IF (OLD.status IS DISTINCT FROM NEW.status) AND NEW.status IN ('confirmed', 'cancelled') THEN
    -- Construct message based on status
    IF NEW.status = 'confirmed' THEN
      v_message := format(
        'Votre réservation pour "%s" a été acceptée ! 🎉

Dates : du %s au %s
Montant total : %s€

Je vous souhaite une excellente location ! N''hésitez pas si vous avez des questions.',
        v_listing_title,
        v_start_date,
        v_end_date,
        v_total_price
      );
    ELSE -- cancelled
      v_message := format(
        'Votre réservation pour "%s" a été refusée.

Dates demandées : du %s au %s

N''hésitez pas à consulter d''autres annonces similaires ou à me contacter pour plus d''informations.',
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