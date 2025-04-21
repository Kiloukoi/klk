-- Drop and recreate the get_owner_rating function
CREATE OR REPLACE FUNCTION get_owner_rating(owner_id uuid)
RETURNS TABLE(
  average_rating numeric,
  review_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::numeric(10,1), 0) as average_rating,
    COUNT(*) as review_count
  FROM reviews
  WHERE reviews.owner_id = get_owner_rating.owner_id;
END;
$$ LANGUAGE plpgsql;

-- Expose the function via the API REST
COMMENT ON FUNCTION get_owner_rating IS 'Calcule la note moyenne et le nombre d''évaluations d''un propriétaire';
GRANT EXECUTE ON FUNCTION get_owner_rating TO anon, authenticated, service_role;