DO $$ 
DECLARE
  maison_id uuid;
  sport_id uuid;
BEGIN
  -- Get the category IDs
  SELECT id INTO maison_id FROM categories WHERE slug = 'maison';
  SELECT id INTO sport_id FROM categories WHERE slug = 'sports';
  
  -- Update existing subcategories for Maison
  UPDATE subcategories
  SET metadata = jsonb_build_object(
    'type', 'categorie',
    'has_children', true,
    'subcategories', ARRAY[
      'Décoration',
      'Meuble',
      'Electroménager',
      'Itech'
    ]
  )
  WHERE category_id = maison_id;

  -- Update existing subcategories for Sport
  UPDATE subcategories
  SET metadata = jsonb_build_object(
    'type', 'categorie',
    'has_children', true,
    'subcategories', ARRAY[
      'Aquatique',
      'Intérieur',
      'Extérieur'
    ]
  )
  WHERE category_id = sport_id;

END $$;