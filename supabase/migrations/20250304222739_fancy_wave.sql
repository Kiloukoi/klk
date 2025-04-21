-- Function to delete all messages for a conversation
CREATE OR REPLACE FUNCTION delete_conversation(p_user_id uuid, p_other_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete all messages between the two users
  DELETE FROM messages
  WHERE (sender_id = p_user_id AND receiver_id = p_other_user_id)
     OR (sender_id = p_other_user_id AND receiver_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a specific message
CREATE OR REPLACE FUNCTION delete_message(p_message_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_message_exists boolean;
BEGIN
  -- Check if the message exists and belongs to the user
  SELECT EXISTS (
    SELECT 1 
    FROM messages 
    WHERE id = p_message_id
    AND (sender_id = p_user_id OR receiver_id = p_user_id)
  ) INTO v_message_exists;

  -- If the message exists and belongs to the user, delete it
  IF v_message_exists THEN
    DELETE FROM messages
    WHERE id = p_message_id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel a booking
CREATE OR REPLACE FUNCTION cancel_booking(p_booking_id uuid, p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_booking_exists boolean;
  v_is_owner boolean;
  v_is_renter boolean;
  v_owner_id uuid;
  v_renter_id uuid;
  v_listing_id uuid;
  v_listing_title text;
BEGIN
  -- Check if the booking exists and the user is either the owner or renter
  SELECT 
    EXISTS(SELECT 1 FROM bookings WHERE id = p_booking_id) as booking_exists,
    (SELECT owner_id FROM bookings WHERE id = p_booking_id) = p_user_id as is_owner,
    (SELECT renter_id FROM bookings WHERE id = p_booking_id) = p_user_id as is_renter,
    (SELECT owner_id FROM bookings WHERE id = p_booking_id) as owner_id,
    (SELECT renter_id FROM bookings WHERE id = p_booking_id) as renter_id,
    (SELECT listing_id FROM bookings WHERE id = p_booking_id) as listing_id,
    (SELECT title FROM listings WHERE id = (SELECT listing_id FROM bookings WHERE id = p_booking_id)) as listing_title
  INTO v_booking_exists, v_is_owner, v_is_renter, v_owner_id, v_renter_id, v_listing_id, v_listing_title;

  -- If the booking exists and the user is either the owner or renter
  IF v_booking_exists AND (v_is_owner OR v_is_renter) THEN
    -- Update the booking status to cancelled
    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = p_booking_id;
    
    -- Send a notification message
    IF v_is_owner THEN
      -- Owner cancelled the booking, notify the renter
      INSERT INTO messages (
        content, 
        sender_id, 
        receiver_id, 
        listing_id
      ) VALUES (
        'Votre réservation pour "' || v_listing_title || '" a été annulée par le propriétaire.',
        v_owner_id,
        v_renter_id,
        v_listing_id
      );
    ELSE
      -- Renter cancelled the booking, notify the owner
      INSERT INTO messages (
        content, 
        sender_id, 
        receiver_id, 
        listing_id
      ) VALUES (
        'La réservation pour "' || v_listing_title || '" a été annulée par le locataire.',
        v_renter_id,
        v_owner_id,
        v_listing_id
      );
    END IF;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a user account and all associated data
CREATE OR REPLACE FUNCTION delete_user_account(p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Delete all user data in the correct order to respect foreign key constraints
  
  -- 1. Delete all reviews by the user
  DELETE FROM reviews
  WHERE reviewer_id = p_user_id;
  
  -- 2. Delete all favorites
  DELETE FROM favorites
  WHERE user_id = p_user_id;
  
  -- 3. Delete all promotions
  DELETE FROM promotions
  WHERE user_id = p_user_id;
  
  -- 4. Delete all messages
  DELETE FROM messages
  WHERE sender_id = p_user_id OR receiver_id = p_user_id;
  
  -- 5. Cancel all bookings where the user is the renter
  UPDATE bookings
  SET status = 'cancelled'
  WHERE renter_id = p_user_id AND status IN ('pending', 'confirmed');
  
  -- 6. Delete all listings (this will cascade to delete related bookings)
  DELETE FROM listings
  WHERE owner_id = p_user_id;
  
  -- 7. Delete the user profile
  DELETE FROM profiles
  WHERE id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can delete messages" ON messages;
DROP POLICY IF EXISTS "Users can delete conversations" ON messages;

-- Create policies for message deletion
CREATE POLICY "Users can delete messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Expose functions via the API REST
COMMENT ON FUNCTION delete_conversation IS 'Supprime tous les messages d''une conversation entre deux utilisateurs';
COMMENT ON FUNCTION delete_message IS 'Supprime un message spécifique';
COMMENT ON FUNCTION cancel_booking IS 'Annule une réservation';
COMMENT ON FUNCTION delete_user_account IS 'Supprime un compte utilisateur et toutes les données associées';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION delete_message TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_booking TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');