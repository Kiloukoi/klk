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

  -- Insert main categories and store their IDs
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES ('Homme', 'homme', mode_id, '{"type": "categorie"}'::jsonb)
  RETURNING id INTO homme_id;

  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES ('Femme', 'femme', mode_id, '{"type": "categorie"}'::jsonb)
  RETURNING id INTO femme_id;

  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES ('Enfant', 'enfant', mode_id, '{"type": "categorie"}'::jsonb)
  RETURNING id INTO enfant_id;

  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES ('Bébé', 'bebe', mode_id, '{"type": "categorie"}'::jsonb)
  RETURNING id INTO bebe_id;

  -- Insert subcategories for Homme
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Hauts Homme', 'hauts-homme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"T-shirts","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Chemises","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Pulls","sizes":["XS","S","M","L","XL","XXL","3XL"]}]}', homme_id)::jsonb),
    ('Bas Homme', 'bas-homme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Pantalons","sizes":["36","38","40","42","44","46","48","50"]},{"name":"Jeans","sizes":["28","29","30","31","32","33","34","36","38","40"]},{"name":"Shorts","sizes":["XS","S","M","L","XL","XXL","3XL"]}]}', homme_id)::jsonb),
    ('Vestes Homme', 'vestes-homme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Vestes légères","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Manteaux","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Blazers","sizes":["XS","S","M","L","XL","XXL","3XL"]}]}', homme_id)::jsonb),
    ('Chaussures Homme', 'chaussures-homme', mode_id, format('{"type":"chaussures","parent_id":"%s","subcategories":[{"name":"Baskets","sizes":["39","40","41","42","43","44","45","46","47"]},{"name":"Ville","sizes":["39","40","41","42","43","44","45","46","47"]},{"name":"Sport","sizes":["39","40","41","42","43","44","45","46","47"]}]}', homme_id)::jsonb);

  -- Insert subcategories for Femme
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Hauts Femme', 'hauts-femme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"T-shirts","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Chemisiers","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Pulls","sizes":["32","34","36","38","40","42","44","46"]}]}', femme_id)::jsonb),
    ('Bas Femme', 'bas-femme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Pantalons","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Jeans","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Jupes","sizes":["32","34","36","38","40","42","44","46"]}]}', femme_id)::jsonb),
    ('Robes', 'robes', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Robes courtes","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Robes longues","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Robes de soirée","sizes":["32","34","36","38","40","42","44","46"]}]}', femme_id)::jsonb),
    ('Chaussures Femme', 'chaussures-femme', mode_id, format('{"type":"chaussures","parent_id":"%s","subcategories":[{"name":"Baskets","sizes":["35","36","37","38","39","40","41","42"]},{"name":"Talons","sizes":["35","36","37","38","39","40","41","42"]},{"name":"Ballerines","sizes":["35","36","37","38","39","40","41","42"]}]}', femme_id)::jsonb);

  -- Insert subcategories for Enfant
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Hauts Enfant', 'hauts-enfant', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"T-shirts","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Pulls","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Sweatshirts","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]}]}', enfant_id)::jsonb),
    ('Bas Enfant', 'bas-enfant', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Pantalons","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Shorts","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Jupes","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]}]}', enfant_id)::jsonb),
    ('Chaussures Enfant', 'chaussures-enfant', mode_id, format('{"type":"chaussures","parent_id":"%s","subcategories":[{"name":"Baskets","sizes":["28","29","30","31","32","33","34","35"]},{"name":"Sandales","sizes":["28","29","30","31","32","33","34","35"]},{"name":"Bottes","sizes":["28","29","30","31","32","33","34","35"]}]}', enfant_id)::jsonb);

  -- Insert subcategories for Bébé
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Bodies et Pyjamas', 'bodies-pyjamas', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Bodies","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Pyjamas","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Grenouillères","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]}]}', bebe_id)::jsonb),
    ('Vêtements Bébé', 'vetements-bebe', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Hauts","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Pantalons","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Robes","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]}]}', bebe_id)::jsonb),
    ('Chaussures Bébé', 'chaussures-bebe', mode_id, format('{"type":"chaussures","parent_id":"%s","subcategories":[{"name":"Chaussons","sizes":["16","17","18","19","20","21"]},{"name":"Premiers pas","sizes":["18","19","20","21","22","23"]},{"name":"Baskets","sizes":["20","21","22","23","24","25","26","27"]}]}', bebe_id)::jsonb),
    ('Accessoires Bébé', 'accessoires-bebe', mode_id, format('{"type":"accessoire","parent_id":"%s","subcategories":[{"name":"Poussette","type":"accessoire"},{"name":"Trotteur","type":"accessoire"},{"name":"Table à langer","type":"accessoire"},{"name":"Baignoire","type":"accessoire"},{"name":"Jouet","type":"accessoire"},{"name":"Electroménager","type":"accessoire"}]}', bebe_id)::jsonb);

END $$;