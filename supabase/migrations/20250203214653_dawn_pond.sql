DO $$ 
DECLARE
  maison_id uuid;
  sport_id uuid;
BEGIN
  -- Get the category IDs
  SELECT id INTO maison_id FROM categories WHERE slug = 'maison';
  SELECT id INTO sport_id FROM categories WHERE slug = 'sports';
  
  -- First, update listings to remove references to the old subcategories
  UPDATE listings
  SET subcategory_id = NULL
  WHERE subcategory_id IN (
    SELECT id FROM subcategories
    WHERE category_id IN (maison_id, sport_id)
  );

  -- Delete existing subcategories for both categories
  DELETE FROM subcategories
  WHERE category_id IN (maison_id, sport_id);

  -- Insert new subcategories for Maison
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Décoration', 'decoration', maison_id, jsonb_build_object(
      'type', 'maison',
      'subcategories', jsonb_build_array(
        'Luminaires',
        'Tapis',
        'Miroirs',
        'Cadres',
        'Vases',
        'Coussins'
      )
    )),
    ('Meuble', 'meuble', maison_id, jsonb_build_object(
      'type', 'maison',
      'subcategories', jsonb_build_array(
        'Tables',
        'Chaises',
        'Canapés',
        'Armoires',
        'Lits',
        'Bureaux'
      )
    )),
    ('Electroménager', 'electromenager', maison_id, jsonb_build_object(
      'type', 'maison',
      'subcategories', jsonb_build_array(
        'Cuisine',
        'Lavage',
        'Aspirateurs',
        'Petit électroménager',
        'Climatisation'
      )
    )),
    ('Itech', 'itech', maison_id, jsonb_build_object(
      'type', 'maison',
      'subcategories', jsonb_build_array(
        'TV',
        'Audio',
        'Consoles',
        'Ordinateurs',
        'Tablettes'
      )
    ));

  -- Insert new subcategories for Sport
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Aquatique', 'aquatique', sport_id, jsonb_build_object(
      'type', 'sport',
      'subcategories', jsonb_build_array(
        'Natation',
        'Plongée',
        'Surf',
        'Paddle',
        'Kayak'
      )
    )),
    ('Intérieur', 'interieur', sport_id, jsonb_build_object(
      'type', 'sport',
      'subcategories', jsonb_build_array(
        'Musculation',
        'Yoga',
        'Fitness',
        'Danse',
        'Boxe'
      )
    )),
    ('Extérieur', 'exterieur', sport_id, jsonb_build_object(
      'type', 'sport',
      'subcategories', jsonb_build_array(
        'Running',
        'Vélo',
        'Randonnée',
        'Tennis',
        'Football'
      )
    ));

END $$;