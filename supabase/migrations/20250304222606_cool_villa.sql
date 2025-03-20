-- Update real estate metadata
DO $$ 
DECLARE
  immobilier_id uuid;
BEGIN
  -- Get the Immobilier category ID
  SELECT id INTO immobilier_id FROM categories WHERE slug = 'immobilier';
  
  IF immobilier_id IS NULL THEN
    RAISE EXCEPTION 'Immobilier category not found';
  END IF;

  -- Update Maisons subcategory with extended metadata
  UPDATE subcategories
  SET metadata = jsonb_build_object(
    'type', 'immobilier',
    'fields', jsonb_build_object(
      'surface', 'number',
      'chambres', 'number',
      'etages', 'number',
      'jardin', 'boolean',
      'garage', 'boolean',
      'cave', 'boolean',
      'piscine', 'boolean',
      'terrasse', 'boolean',
      'meuble', 'boolean',
      'annee_construction', 'number',
      'dpe', 'string'
    )
  )
  WHERE category_id = immobilier_id AND slug = 'maisons';

  -- Update Appartements subcategory with extended metadata
  UPDATE subcategories
  SET metadata = jsonb_build_object(
    'type', 'immobilier',
    'fields', jsonb_build_object(
      'surface', 'number',
      'chambres', 'number',
      'etage', 'number',
      'balcon', 'boolean',
      'garage', 'boolean',
      'cave', 'boolean',
      'ascenseur', 'boolean',
      'terrasse', 'boolean',
      'meuble', 'boolean',
      'annee_construction', 'number',
      'dpe', 'string'
    )
  )
  WHERE category_id = immobilier_id AND slug = 'appartements';

END $$;