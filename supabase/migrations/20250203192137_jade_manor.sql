/*
  # Update Mode category structure
  
  1. Changes
    - Update existing listings to remove references to old subcategories
    - Delete existing Mode subcategories
    - Insert new hierarchical structure for Mode category
*/

DO $$ 
DECLARE
  mode_id uuid;
BEGIN
  -- Get the Mode category ID
  SELECT id INTO mode_id FROM categories WHERE slug = 'mode';

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

  -- Insert new subcategories
  INSERT INTO subcategories (name, slug, category_id, metadata) VALUES
    -- Homme
    ('Homme', 'homme', mode_id, '{
      "type": "categorie",
      "subcategories": [
        {"name": "T-shirts", "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]},
        {"name": "Chemises", "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]},
        {"name": "Pulls", "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]},
        {"name": "Pantalons", "sizes": ["36", "38", "40", "42", "44", "46", "48", "50"]},
        {"name": "Jeans", "sizes": ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"]},
        {"name": "Shorts", "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]},
        {"name": "Vestes", "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]}
      ]
    }'),

    -- Femme
    ('Femme', 'femme', mode_id, '{
      "type": "categorie",
      "subcategories": [
        {"name": "T-shirts", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]},
        {"name": "Chemisiers", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]},
        {"name": "Pulls", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]},
        {"name": "Pantalons", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]},
        {"name": "Jeans", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]},
        {"name": "Robes", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]},
        {"name": "Jupes", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]},
        {"name": "Vestes", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]}
      ]
    }'),

    -- Enfant
    ('Enfant', 'enfant', mode_id, '{
      "type": "categorie",
      "subcategories": [
        {"name": "T-shirts", "sizes": ["2ans", "3ans", "4ans", "5ans", "6ans", "8ans", "10ans", "12ans", "14ans"]},
        {"name": "Pulls", "sizes": ["2ans", "3ans", "4ans", "5ans", "6ans", "8ans", "10ans", "12ans", "14ans"]},
        {"name": "Pantalons", "sizes": ["2ans", "3ans", "4ans", "5ans", "6ans", "8ans", "10ans", "12ans", "14ans"]},
        {"name": "Shorts", "sizes": ["2ans", "3ans", "4ans", "5ans", "6ans", "8ans", "10ans", "12ans", "14ans"]},
        {"name": "Robes", "sizes": ["2ans", "3ans", "4ans", "5ans", "6ans", "8ans", "10ans", "12ans", "14ans"]},
        {"name": "Vestes", "sizes": ["2ans", "3ans", "4ans", "5ans", "6ans", "8ans", "10ans", "12ans", "14ans"]}
      ]
    }'),

    -- Bébé
    ('Bébé', 'bebe', mode_id, '{
      "type": "categorie",
      "subcategories": [
        {"name": "Bodies", "sizes": ["0-3m", "3-6m", "6-9m", "9-12m", "12-18m", "18-24m"]},
        {"name": "Pyjamas", "sizes": ["0-3m", "3-6m", "6-9m", "9-12m", "12-18m", "18-24m"]},
        {"name": "Pulls", "sizes": ["0-3m", "3-6m", "6-9m", "9-12m", "12-18m", "18-24m"]},
        {"name": "Pantalons", "sizes": ["0-3m", "3-6m", "6-9m", "9-12m", "12-18m", "18-24m"]},
        {"name": "Robes", "sizes": ["0-3m", "3-6m", "6-9m", "9-12m", "12-18m", "18-24m"]},
        {"name": "Ensembles", "sizes": ["0-3m", "3-6m", "6-9m", "9-12m", "12-18m", "18-24m"]}
      ]
    }'),

    -- Chaussures
    ('Chaussures', 'chaussures', mode_id, '{
      "type": "categorie",
      "subcategories": [
        {"name": "Homme", "sizes": ["39", "40", "41", "42", "43", "44", "45", "46", "47"]},
        {"name": "Femme", "sizes": ["35", "36", "37", "38", "39", "40", "41", "42"]},
        {"name": "Enfant", "sizes": ["28", "29", "30", "31", "32", "33", "34", "35"]},
        {"name": "Bébé", "sizes": ["16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27"]}
      ]
    }'),

    -- Accessoires
    ('Accessoires', 'accessoires', mode_id, '{
      "type": "categorie",
      "subcategories": [
        {"name": "Poussette", "type": "accessoire"},
        {"name": "Trotteur", "type": "accessoire"},
        {"name": "Table à langer", "type": "accessoire"},
        {"name": "Baignoire", "type": "accessoire"},
        {"name": "Jouet", "type": "accessoire"},
        {"name": "Electroménager", "type": "accessoire"}
      ]
    }');
END $$;