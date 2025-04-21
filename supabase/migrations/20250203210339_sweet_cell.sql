DO $$ 
DECLARE
  mode_id uuid;
  homme_id uuid;
  femme_id uuid;
  enfant_id uuid;
  bebe_id uuid;
BEGIN
  -- Get the Mode category ID and subcategory IDs
  SELECT id INTO mode_id FROM categories WHERE slug = 'mode';
  SELECT id INTO homme_id FROM subcategories WHERE category_id = mode_id AND slug = 'homme';
  SELECT id INTO femme_id FROM subcategories WHERE category_id = mode_id AND slug = 'femme';
  SELECT id INTO enfant_id FROM subcategories WHERE category_id = mode_id AND slug = 'enfant';
  SELECT id INTO bebe_id FROM subcategories WHERE category_id = mode_id AND slug = 'bebe';

  -- Update Homme metadata with extended sizes and shoe sizes
  UPDATE subcategories
  SET metadata = jsonb_build_object(
    'type', 'categorie',
    'has_children', true,
    'subcategories', jsonb_build_array(
      jsonb_build_object(
        'name', 'Haut',
        'sizes', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']
      ),
      jsonb_build_object(
        'name', 'Bas',
        'sizes', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']
      ),
      jsonb_build_object(
        'name', 'Ensemble',
        'sizes', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']
      ),
      jsonb_build_object(
        'name', 'Chaussures',
        'sizes', ARRAY['39', '40', '41', '42', '43', '44', '45', '46', '47']
      ),
      'Accessoires'
    )
  )
  WHERE id = homme_id;

  -- Update Femme metadata with extended sizes and shoe sizes
  UPDATE subcategories
  SET metadata = jsonb_build_object(
    'type', 'categorie',
    'has_children', true,
    'subcategories', jsonb_build_array(
      jsonb_build_object(
        'name', 'Haut',
        'sizes', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']
      ),
      jsonb_build_object(
        'name', 'Bas',
        'sizes', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']
      ),
      jsonb_build_object(
        'name', 'Ensemble',
        'sizes', ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL']
      ),
      jsonb_build_object(
        'name', 'Chaussures',
        'sizes', ARRAY['35', '36', '37', '38', '39', '40', '41', '42']
      ),
      'Accessoires'
    )
  )
  WHERE id = femme_id;

  -- Update Enfant metadata with shoe sizes
  UPDATE subcategories
  SET metadata = jsonb_build_object(
    'type', 'categorie',
    'has_children', true,
    'subcategories', jsonb_build_array(
      jsonb_build_object(
        'name', 'Haut',
        'sizes', ARRAY['2ans', '3ans', '4ans', '5ans', '6ans', '8ans', '10ans', '12ans', '14ans']
      ),
      jsonb_build_object(
        'name', 'Bas',
        'sizes', ARRAY['2ans', '3ans', '4ans', '5ans', '6ans', '8ans', '10ans', '12ans', '14ans']
      ),
      jsonb_build_object(
        'name', 'Ensemble',
        'sizes', ARRAY['2ans', '3ans', '4ans', '5ans', '6ans', '8ans', '10ans', '12ans', '14ans']
      ),
      jsonb_build_object(
        'name', 'Chaussures',
        'sizes', ARRAY['28', '29', '30', '31', '32', '33', '34', '35']
      ),
      'Accessoires'
    )
  )
  WHERE id = enfant_id;

  -- Update Bébé metadata with shoe sizes
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
      'Accessoires'
    )
  )
  WHERE id = bebe_id;

END $$;