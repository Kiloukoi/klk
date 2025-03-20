-- Drop and recreate message deletion functions with named parameters
CREATE OR REPLACE FUNCTION delete_conversation(
  p_user_id uuid,
  p_other_user_id uuid
)
RETURNS void AS $$
BEGIN
  DELETE FROM messages
  WHERE (sender_id = p_user_id AND receiver_id = p_other_user_id)
     OR (sender_id = p_other_user_id AND receiver_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a specific message
CREATE OR REPLACE FUNCTION delete_message(
  p_message_id uuid,
  p_user_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_message_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM messages 
    WHERE id = p_message_id
    AND (sender_id = p_user_id OR receiver_id = p_user_id)
  ) INTO v_message_exists;

  IF v_message_exists THEN
    DELETE FROM messages
    WHERE id = p_message_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old policies and recreate them with proper parameter names
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can delete messages" ON messages;
  DROP POLICY IF EXISTS "Users can delete conversations" ON messages;

  -- Create new policies
  CREATE POLICY "Users can delete messages"
    ON messages FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
END $$;

-- Expose functions via the API REST with proper parameter names
COMMENT ON FUNCTION delete_conversation(p_user_id uuid, p_other_user_id uuid) 
IS 'Supprime tous les messages d''une conversation entre deux utilisateurs';

COMMENT ON FUNCTION delete_message(p_message_id uuid, p_user_id uuid) 
IS 'Supprime un message spécifique';

-- Grant execute permissions with proper parameter names
GRANT EXECUTE ON FUNCTION delete_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_message(uuid, uuid) TO authenticated;

-- Refresh the schema cache
SELECT pg_notify('pgrst', 'reload schema');