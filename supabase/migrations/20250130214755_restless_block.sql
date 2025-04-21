/*
  # Ajout de sous-catégories supplémentaires

  1. Modifications
    - Ajout de sous-catégories détaillées pour Mode
    - Ajout de sous-catégories pour Véhicules
    - Mise à jour des métadonnées

  2. Sécurité
    - Utilisation des policies existantes
*/

-- Mode - Vêtements Homme
WITH mode AS (
  SELECT id FROM categories WHERE slug = 'mode'
)
INSERT INTO subcategories (name, slug, category_id, metadata) VALUES
  -- Homme
  ('Pantalons Homme', 'pantalons-homme', (SELECT id FROM mode), 
   '{"type": "vetement", "gender": "homme", "sizes": ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"], "length": ["court", "regular", "long"]}'),
  ('Jeans Homme', 'jeans-homme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "homme", "sizes": ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"], "style": ["slim", "regular", "large"]}'),
  ('T-shirts Homme', 'tshirts-homme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "homme", "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]}'),
  ('Pulls Homme', 'pulls-homme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "homme", "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]}'),
  ('Vestes Homme', 'vestes-homme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "homme", "sizes": ["XS", "S", "M", "L", "XL", "XXL", "3XL"]}'),
  ('Costumes Homme', 'costumes-homme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "homme", "sizes": ["44", "46", "48", "50", "52", "54", "56", "58"]}'),

  -- Femme
  ('Robes', 'robes', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "femme", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]}'),
  ('Jupes', 'jupes', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "femme", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]}'),
  ('Pantalons Femme', 'pantalons-femme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "femme", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]}'),
  ('T-shirts Femme', 'tshirts-femme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "femme", "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}'),
  ('Pulls Femme', 'pulls-femme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "femme", "sizes": ["XS", "S", "M", "L", "XL", "XXL"]}'),
  ('Vestes Femme', 'vestes-femme', (SELECT id FROM mode),
   '{"type": "vetement", "gender": "femme", "sizes": ["32", "34", "36", "38", "40", "42", "44", "46"]}'),

  -- Enfant
  ('Hauts Enfant', 'hauts-enfant', (SELECT id FROM mode),
   '{"type": "vetement", "category": "enfant", "ages": "2-14", "sizes": ["2ans", "4ans", "6ans", "8ans", "10ans", "12ans", "14ans"]}'),
  ('Bas Enfant', 'bas-enfant', (SELECT id FROM mode),
   '{"type": "vetement", "category": "enfant", "ages": "2-14", "sizes": ["2ans", "4ans", "6ans", "8ans", "10ans", "12ans", "14ans"]}'),
  ('Vestes Enfant', 'vestes-enfant', (SELECT id FROM mode),
   '{"type": "vetement", "category": "enfant", "ages": "2-14", "sizes": ["2ans", "4ans", "6ans", "8ans", "10ans", "12ans", "14ans"]}'),

  -- Bébé
  ('Bodies Bébé', 'bodies-bebe', (SELECT id FROM mode),
   '{"type": "vetement", "category": "bebe", "ages": "0-24m", "sizes": ["0-3m", "3-6m", "6-12m", "12-18m", "18-24m"]}'),
  ('Pyjamas Bébé', 'pyjamas-bebe', (SELECT id FROM mode),
   '{"type": "vetement", "category": "bebe", "ages": "0-24m", "sizes": ["0-3m", "3-6m", "6-12m", "12-18m", "18-24m"]}'),
  ('Ensembles Bébé', 'ensembles-bebe', (SELECT id FROM mode),
   '{"type": "vetement", "category": "bebe", "ages": "0-24m", "sizes": ["0-3m", "3-6m", "6-12m", "12-18m", "18-24m"]}');

-- Véhicules - Sous-catégories détaillées
WITH vehicules AS (
  SELECT id FROM categories WHERE slug = 'vehicules'
)
INSERT INTO subcategories (name, slug, category_id, metadata) VALUES
  -- Voitures
  ('Citadines', 'citadines', (SELECT id FROM vehicules),
   '{"type": "voiture", "category": "citadine"}'),
  ('Berlines', 'berlines', (SELECT id FROM vehicules),
   '{"type": "voiture", "category": "berline"}'),
  ('SUV', 'suv', (SELECT id FROM vehicules),
   '{"type": "voiture", "category": "suv"}'),
  ('Utilitaires', 'utilitaires', (SELECT id FROM vehicules),
   '{"type": "voiture", "category": "utilitaire"}'),
  ('Cabriolets', 'cabriolets', (SELECT id FROM vehicules),
   '{"type": "voiture", "category": "cabriolet"}'),

  -- Motos
  ('Motos Sportives', 'motos-sportives', (SELECT id FROM vehicules),
   '{"type": "moto", "category": "sportive"}'),
  ('Motos Routières', 'motos-routieres', (SELECT id FROM vehicules),
   '{"type": "moto", "category": "routiere"}'),
  ('Scooters', 'scooters', (SELECT id FROM vehicules),
   '{"type": "moto", "category": "scooter"}'),
  ('Motos Custom', 'motos-custom', (SELECT id FROM vehicules),
   '{"type": "moto", "category": "custom"}'),

  -- Remorques
  ('Remorques Bagagères', 'remorques-bagageres', (SELECT id FROM vehicules),
   '{"type": "remorque", "category": "bagagere"}'),
  ('Remorques Porte-Voiture', 'remorques-porte-voiture', (SELECT id FROM vehicules),
   '{"type": "remorque", "category": "porte-voiture"}'),
  ('Remorques Benne', 'remorques-benne', (SELECT id FROM vehicules),
   '{"type": "remorque", "category": "benne"}'),

  -- Accessoires
  ('Accessoires Auto', 'accessoires-auto', (SELECT id FROM vehicules),
   '{"type": "accessoire", "category": "auto"}'),
  ('Accessoires Moto', 'accessoires-moto', (SELECT id FROM vehicules),
   '{"type": "accessoire", "category": "moto"}'),
  ('Pièces Détachées', 'pieces-detachees', (SELECT id FROM vehicules),
   '{"type": "accessoire", "category": "pieces"}'),
  ('Équipements Sécurité', 'equipements-securite', (SELECT id FROM vehicules),
   '{"type": "accessoire", "category": "securite"}');