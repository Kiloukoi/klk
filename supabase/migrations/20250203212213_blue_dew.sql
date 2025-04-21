DO $$ 
DECLARE
  mode_id uuid;
  bebe_id uuid;
BEGIN
  -- Get the Mode category ID and baby subcategory ID
  SELECT id INTO mode_id FROM categories WHERE slug = 'mode';
  SELECT id INTO bebe_id FROM subcategories WHERE category_id = mode_id AND slug = 'bebe';

  -- Update Bébé metadata with accessory types
  UPDATE subcategories
  SET metadata = jsonb_build_object(
    'type', 'categorie',
    'has_children', true,
    'subcategories', jsonb_build_array(
      jsonb_build_object(
        'name', 'Haut',
        'sizes', ARRAY['0-3m', '3-6m', '6-9m', '9-12m', '12-18m', '18-24m']
      ),
      jsonb_build_object(
        'name', 'Bas',
        'sizes', ARRAY['0-3m', '3-6m', '6-9m', '9-12m', '12-18m', '18-24m']
      ),
      jsonb_build_object(
        'name', 'Ensemble',
        'sizes', ARRAY['0-3m', '3-6m', '6-9m', '9-12m', '12-18m', '18-24m']
      ),
      jsonb_build_object(
        'name', 'Chaussures',
        'sizes', ARRAY['16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27']
      ),
      jsonb_build_object(
        'name', 'Accessoires',
        'types', ARRAY['Poussette', 'Développement', 'Jouets', 'Petits électroménagers']
      )
    )
  )
  WHERE id = bebe_id;

END $$;