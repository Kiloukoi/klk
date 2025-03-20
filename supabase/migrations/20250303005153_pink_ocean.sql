-- Get the Multimedia category ID
DO $$ 
DECLARE
  multimedia_id uuid;
BEGIN
  -- Get the Multimedia category ID
  SELECT id INTO multimedia_id FROM categories WHERE slug = 'multimedia';
  
  IF multimedia_id IS NULL THEN
    -- If the category doesn't exist, create it
    INSERT INTO categories (name, slug)
    VALUES ('Multimédia', 'multimedia')
    RETURNING id INTO multimedia_id;
  END IF;

  -- Delete any existing subcategories for Multimedia to avoid duplicates
  DELETE FROM subcategories
  WHERE category_id = multimedia_id;

  -- Insert main Multimedia subcategories
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES 
    ('Téléviseurs', 'televiseurs', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'TV LED',
        'TV OLED',
        'TV QLED',
        'Vidéoprojecteurs',
        'Accessoires TV'
      )
    )),
    
    ('Ordinateurs', 'ordinateurs', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Ordinateurs portables',
        'Ordinateurs de bureau',
        'Tablettes',
        'Accessoires informatiques',
        'Écrans'
      )
    )),
    
    ('Téléphones', 'telephones', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Smartphones',
        'Téléphones fixes',
        'Accessoires téléphonie'
      )
    )),
    
    ('Audio', 'audio', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Enceintes',
        'Casques audio',
        'Home cinéma',
        'Barres de son',
        'Platines vinyle'
      )
    )),
    
    ('Photo & Vidéo', 'photo-video', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Appareils photo',
        'Caméras',
        'Objectifs',
        'Accessoires photo',
        'Drones'
      )
    )),
    
    ('Consoles & Jeux', 'consoles-jeux', multimedia_id, jsonb_build_object(
      'type', 'multimedia',
      'subcategories', jsonb_build_array(
        'Consoles',
        'Manettes',
        'Jeux vidéo',
        'Accessoires gaming'
      )
    ));

END $$;