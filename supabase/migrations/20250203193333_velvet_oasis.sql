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

  -- Insert subcategories for each main category
  -- HOMME
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Haut Homme', 'haut-homme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"T-shirts","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Chemises","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Pulls","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Sweatshirts","sizes":["XS","S","M","L","XL","XXL","3XL"]}]}', homme_id)::jsonb),
    ('Bas Homme', 'bas-homme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Pantalons","sizes":["36","38","40","42","44","46","48","50"]},{"name":"Jeans","sizes":["28","29","30","31","32","33","34","36","38","40"]},{"name":"Shorts","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Jogging","sizes":["XS","S","M","L","XL","XXL","3XL"]}]}', homme_id)::jsonb),
    ('Ensemble Homme', 'ensemble-homme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Costumes","sizes":["44","46","48","50","52","54","56"]},{"name":"Survêtements","sizes":["XS","S","M","L","XL","XXL","3XL"]},{"name":"Ensembles sport","sizes":["XS","S","M","L","XL","XXL","3XL"]}]}', homme_id)::jsonb),
    ('Chaussures Homme', 'chaussures-homme', mode_id, format('{"type":"chaussures","parent_id":"%s","subcategories":[{"name":"Baskets","sizes":["39","40","41","42","43","44","45","46","47"]},{"name":"Ville","sizes":["39","40","41","42","43","44","45","46","47"]},{"name":"Sport","sizes":["39","40","41","42","43","44","45","46","47"]}]}', homme_id)::jsonb),
    ('Accessoires Homme', 'accessoires-homme', mode_id, format('{"type":"accessoire","parent_id":"%s","subcategories":[{"name":"Ceintures","type":"accessoire"},{"name":"Montres","type":"accessoire"},{"name":"Casquettes","type":"accessoire"},{"name":"Sacs","type":"accessoire"}]}', homme_id)::jsonb);

  -- FEMME
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Haut Femme', 'haut-femme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"T-shirts","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Chemisiers","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Pulls","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Tops","sizes":["32","34","36","38","40","42","44","46"]}]}', femme_id)::jsonb),
    ('Bas Femme', 'bas-femme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Pantalons","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Jeans","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Jupes","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Leggings","sizes":["32","34","36","38","40","42","44","46"]}]}', femme_id)::jsonb),
    ('Ensemble Femme', 'ensemble-femme', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Tailleurs","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Robes","sizes":["32","34","36","38","40","42","44","46"]},{"name":"Combinaisons","sizes":["32","34","36","38","40","42","44","46"]}]}', femme_id)::jsonb),
    ('Chaussures Femme', 'chaussures-femme', mode_id, format('{"type":"chaussures","parent_id":"%s","subcategories":[{"name":"Baskets","sizes":["35","36","37","38","39","40","41","42"]},{"name":"Talons","sizes":["35","36","37","38","39","40","41","42"]},{"name":"Ballerines","sizes":["35","36","37","38","39","40","41","42"]}]}', femme_id)::jsonb),
    ('Accessoires Femme', 'accessoires-femme', mode_id, format('{"type":"accessoire","parent_id":"%s","subcategories":[{"name":"Sacs","type":"accessoire"},{"name":"Bijoux","type":"accessoire"},{"name":"Ceintures","type":"accessoire"},{"name":"Foulards","type":"accessoire"}]}', femme_id)::jsonb);

  -- ENFANT
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Haut Enfant', 'haut-enfant', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"T-shirts","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Pulls","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Sweatshirts","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]}]}', enfant_id)::jsonb),
    ('Bas Enfant', 'bas-enfant', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Pantalons","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Shorts","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Jupes","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]}]}', enfant_id)::jsonb),
    ('Ensemble Enfant', 'ensemble-enfant', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Survêtements","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Ensembles","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]},{"name":"Pyjamas","sizes":["2ans","3ans","4ans","5ans","6ans","8ans","10ans","12ans","14ans"]}]}', enfant_id)::jsonb),
    ('Chaussures Enfant', 'chaussures-enfant', mode_id, format('{"type":"chaussures","parent_id":"%s","subcategories":[{"name":"Baskets","sizes":["28","29","30","31","32","33","34","35"]},{"name":"Sandales","sizes":["28","29","30","31","32","33","34","35"]},{"name":"Bottes","sizes":["28","29","30","31","32","33","34","35"]}]}', enfant_id)::jsonb),
    ('Accessoires Enfant', 'accessoires-enfant', mode_id, format('{"type":"accessoire","parent_id":"%s","subcategories":[{"name":"Sacs scolaires","type":"accessoire"},{"name":"Casquettes","type":"accessoire"},{"name":"Bonnets","type":"accessoire"},{"name":"Ceintures","type":"accessoire"}]}', enfant_id)::jsonb);

  -- BÉBÉ
  INSERT INTO subcategories (name, slug, category_id, metadata)
  VALUES
    ('Haut Bébé', 'haut-bebe', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Bodies","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"T-shirts","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Pulls","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]}]}', bebe_id)::jsonb),
    ('Bas Bébé', 'bas-bebe', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Pantalons","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Shorts","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Leggings","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]}]}', bebe_id)::jsonb),
    ('Ensemble Bébé', 'ensemble-bebe', mode_id, format('{"type":"vetement","parent_id":"%s","subcategories":[{"name":"Pyjamas","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Grenouillères","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]},{"name":"Ensembles","sizes":["0-3m","3-6m","6-9m","9-12m","12-18m","18-24m"]}]}', bebe_id)::jsonb),
    ('Chaussures Bébé', 'chaussures-bebe', mode_id, format('{"type":"chaussures","parent_id":"%s","subcategories":[{"name":"Chaussons","sizes":["16","17","18","19","20","21"]},{"name":"Premiers pas","sizes":["18","19","20","21","22","23"]},{"name":"Baskets","sizes":["20","21","22","23","24","25","26","27"]}]}', bebe_id)::jsonb),
    ('Accessoires Bébé', 'accessoires-bebe', mode_id, format('{"type":"accessoire","parent_id":"%s","subcategories":[{"name":"Bavoirs","type":"accessoire"},{"name":"Bonnets","type":"accessoire"},{"name":"Chaussettes","type":"accessoire"},{"name":"Doudous","type":"accessoire"}]}', bebe_id)::jsonb);

END $$;