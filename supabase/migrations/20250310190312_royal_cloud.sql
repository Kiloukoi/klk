/*
  # Add test promotions

  1. Changes
    - Add test promotions for some listings
    - Add test data to verify boosted listings display

  2. Test Data
    - Creates active promotions for testing
    - Sets up different promotion scenarios
*/

-- Insert test promotions
DO $$
DECLARE
  v_listing_id uuid;
  v_owner_id uuid;
BEGIN
  -- Get first listing and its owner
  SELECT id, owner_id INTO v_listing_id, v_owner_id
  FROM listings
  LIMIT 1;

  IF v_listing_id IS NOT NULL THEN
    -- Create an active promotion
    INSERT INTO promotions (
      listing_id,
      user_id,
      start_date,
      end_date,
      status,
      amount_paid,
      payment_id
    ) VALUES (
      v_listing_id,
      v_owner_id,
      CURRENT_TIMESTAMP - interval '1 day',
      CURRENT_TIMESTAMP + interval '6 days',
      'active',
      2.99,
      'test_payment_1'
    );

    -- Get second listing and its owner
    SELECT id, owner_id INTO v_listing_id, v_owner_id
    FROM listings
    WHERE id != v_listing_id
    LIMIT 1;

    IF v_listing_id IS NOT NULL THEN
      -- Create another active promotion
      INSERT INTO promotions (
        listing_id,
        user_id,
        start_date,
        end_date,
        status,
        amount_paid,
        payment_id
      ) VALUES (
        v_listing_id,
        v_owner_id,
        CURRENT_TIMESTAMP - interval '2 days',
        CURRENT_TIMESTAMP + interval '28 days',
        'active',
        9.99,
        'test_payment_2'
      );
    END IF;
  END IF;
END $$;