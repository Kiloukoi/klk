-- Drop and recreate message deletion functions with correct parameter order
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

-- Expose functions via the API REST
COMMENT ON FUNCTION delete_conversation(uuid, uuid) IS 'Supprime tous les messages d''une conversation entre deux utilisateurs';
COMMENT ON FUNCTION delete_message(uuid, uuid) IS 'Supprime un message spécifique';

GRANT EXECUTE ON FUNCTION delete_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_message(uuid, uuid) TO authenticated;

-- Refresh the schema cache to make sure the functions are available
SELECT pg_notify('pgrst', 'reload schema');