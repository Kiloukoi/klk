DO $$ 
DECLARE
  mode_id uuid;
  homme_id uuid;
  femme_id uuid;
  enfant_id uuid;
  bebe_id uuid;
BEGIN
  -- Get the Mode category ID
  SELECT id INTO mode_id FROM categories WHERE slug = 'mode';
  
  IF mode_id IS NULL THEN
    RAISE EXCEPTION 'Mode category not found';
  END IF;

  -- First, update listings to remove references to the old subcategories
  UPDATE listings
  SET subcategory_id = NULL
  WHERE subcategory_id IN (
    SELECT id FROM subcategories
    WHERE category_id = mode_id
  );

  -- Now we can safely delete existing subcategories for Mode
  DELETE FROM subcategories
  WHERE category_id = mode_id;

  -- Insert only the main categories first
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES 
    ('Homme', 'homme', mode_id, jsonb_build_object(
      'type', 'categorie',
      'has_children', true,
      'subcategories', jsonb_build_array(
        'Haut',
        'Bas',
        'Ensemble',
        'Chaussures',
        'Accessoires'
      )
    ))
    RETURNING id INTO homme_id;

  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES 
    ('Femme', 'femme', mode_id, jsonb_build_object(
      'type', 'categorie',
      'has_children', true,
      'subcategories', jsonb_build_array(
        'Haut',
        'Bas',
        'Ensemble',
        'Chaussures',
        'Accessoires'
      )
    ))
    RETURNING id INTO femme_id;

  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES 
    ('Enfant', 'enfant', mode_id, jsonb_build_object(
      'type', 'categorie',
      'has_children', true,
      'subcategories', jsonb_build_array(
        'Haut',
        'Bas',
        'Ensemble',
        'Chaussures',
        'Accessoires'
      )
    ))
    RETURNING id INTO enfant_id;

  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES 
    ('Bébé', 'bebe', mode_id, jsonb_build_object(
      'type', 'categorie',
      'has_children', true,
      'subcategories', jsonb_build_array(
        'Haut',
        'Bas',
        'Ensemble',
        'Chaussures',
        'Accessoires'
      )
    ))
    RETURNING id INTO bebe_id;

END $$;