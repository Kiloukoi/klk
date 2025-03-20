-- Function to activate a promotion after successful payment
CREATE OR REPLACE FUNCTION activate_promotion(
  p_listing_id uuid,
  p_payment_id text,
  p_duration_days integer
)
RETURNS uuid AS $$
DECLARE
  v_promotion_id uuid;
BEGIN
  -- Insert new promotion with active status
  INSERT INTO promotions (
    listing_id,
    user_id,
    start_date,
    end_date,
    status,
    amount_paid,
    payment_id
  )
  VALUES (
    p_listing_id,
    auth.uid(),
    now(),
    now() + (p_duration_days || ' days')::interval,
    'active',
    CASE 
      WHEN p_duration_days = 7 THEN 2.99
      WHEN p_duration_days = 30 THEN 9.99
      ELSE 0
    END,
    p_payment_id
  )
  RETURNING id INTO v_promotion_id;

  RETURN v_promotion_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose the function via the API REST
COMMENT ON FUNCTION activate_promotion IS 'Active une promotion après un paiement réussi';
GRANT EXECUTE ON FUNCTION activate_promotion TO authenticated;