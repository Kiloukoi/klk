/*
  # Ajout des sous-catégories immobilier

  1. Nouvelles sous-catégories
    - Maisons
    - Appartements
    - Bureaux
    - Locaux commerciaux
    - Parkings / Garages

  2. Chaque sous-catégorie a ses propres champs spécifiques dans le metadata
    - Surface
    - Nombre de pièces
    - Caractéristiques spécifiques (garage, jardin, ascenseur, etc.)
*/

-- Immobilier - Sous-catégories détaillées
WITH immobilier AS (
  SELECT id FROM categories WHERE slug = 'immobilier'
)
INSERT INTO subcategories (name, slug, category_id, metadata)
SELECT
  name, slug, (SELECT id FROM immobilier), metadata::jsonb
FROM (
  VALUES
    ('Maisons', 'maisons', '{
      "type": "maison",
      "fields": {
        "surface_habitable": "number",
        "surface_terrain": "number",
        "pieces": "number",
        "chambres": "number",
        "etages": "number",
        "garage": "boolean",
        "jardin": "boolean",
        "piscine": "boolean",
        "meuble": "boolean"
      }
    }'),
    
    ('Appartements', 'appartements', '{
      "type": "appartement",
      "fields": {
        "surface": "number",
        "pieces": "number",
        "chambres": "number",
        "etage": "number",
        "ascenseur": "boolean",
        "balcon": "boolean",
        "parking": "boolean",
        "cave": "boolean",
        "meuble": "boolean"
      }
    }'),
    
    ('Bureaux', 'bureaux', '{
      "type": "bureau",
      "fields": {
        "surface": "number",
        "open_space": "boolean",
        "salles_reunion": "number",
        "parking": "boolean",
        "climatisation": "boolean"
      }
    }'),
    
    ('Locaux commerciaux', 'locaux-commerciaux', '{
      "type": "commerce",
      "fields": {
        "surface": "number",
        "vitrine": "boolean",
        "reserve": "boolean",
        "parking": "boolean"
      }
    }'),
    
    ('Parkings / Garages', 'parkings-garages', '{
      "type": "parking",
      "fields": {
        "type_place": ["couverte", "exterieure", "box"],
        "surface": "number",
        "securise": "boolean",
        "camera": "boolean"
      }
    }')
) AS v(name, slug, metadata)
WHERE NOT EXISTS (
  SELECT 1 FROM subcategories s
  WHERE s.category_id = (SELECT id FROM immobilier)
  AND s.slug = v.slug
);