/*
  # Add User Follow System

  1. New Table
    - `follows`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, references profiles)
      - `following_id` (uuid, references profiles)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for follows table
    - Add indexes for better performance
*/

-- Create follows table
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Prevent self-following and duplicate follows
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_following_id_idx ON follows(following_id);

-- Create policies
CREATE POLICY "Users can view their own follows"
  ON follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE following_id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*)
  FROM follows
  WHERE follower_id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is following another user
CREATE OR REPLACE FUNCTION is_following(follower_id uuid, following_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
    FROM follows
    WHERE follower_id = $1
    AND following_id = $2
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_follower_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_following_count TO authenticated;
GRANT EXECUTE ON FUNCTION is_following TO authenticated;