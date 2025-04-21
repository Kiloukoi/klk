/*
  # Add messages system

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `content` (text, message content)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `created_at` (timestamp)
      - `read_at` (timestamp, nullable)

  2. Security
    - Enable RLS on messages table
    - Add policies for:
      - Users can read messages they sent or received
      - Users can create messages
      - Users can mark messages as read
*/

-- Create messages table
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  receiver_id uuid REFERENCES profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT different_users CHECK (sender_id != receiver_id)
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages they sent or received
CREATE POLICY "Users can read their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can create new messages
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Users can mark messages as read when they are the receiver
CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  USING (
    auth.uid() = receiver_id AND
    read_at IS NULL
  );

-- Create indexes for better performance
CREATE INDEX messages_sender_id_idx ON messages(sender_id);
CREATE INDEX messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX messages_created_at_idx ON messages(created_at);