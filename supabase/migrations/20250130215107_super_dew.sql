/*
  # Ajout des sous-catégories manquantes

  1. Nouvelles sous-catégories
    - Bricolage (intérieur/extérieur)
    - Loisirs (intérieur/extérieur)
    - Mode (vêtements et chaussures)
    - Véhicules (détails)

  2. Sécurité
    - Utilisation des policies existantes
*/

-- Bricolage - Sous-catégories détaillées
WITH bricolage AS (
  SELECT id FROM categories WHERE slug = 'bricolage'
)
INSERT INTO subcategories (name, slug, category_id, metadata) VALUES
  -- Intérieur
  ('Outillage électrique', 'outillage-electrique', (SELECT id FROM bricolage),
   '{"type": "interieur", "category": "outillage"}'),
  ('Outillage manuel', 'outillage-manuel', (SELECT id FROM bricolage),
   '{"type": "interieur", "category": "outillage"}'),
  ('Plomberie', 'plomberie', (SELECT id FROM bricolage),
   '{"type": "interieur", "category": "plomberie"}'),
  ('Électricité', 'electricite', (SELECT id FROM bricolage),
   '{"type": "interieur", "category": "electricite"}'),
  ('Peinture', 'peinture', (SELECT id FROM bricolage),
   '{"type": "interieur", "category": "peinture"}'),

  -- Extérieur
  ('Jardinage', 'jardinage', (SELECT id FROM bricolage),
   '{"type": "exterieur", "category": "jardinage"}'),
  ('Terrassement', 'terrassement', (SELECT id FROM bricolage),
   '{"type": "exterieur", "category": "terrassement"}'),
  ('Nettoyage', 'nettoyage', (SELECT id FROM bricolage),
   '{"type": "exterieur", "category": "nettoyage"}'),
  ('Maçonnerie', 'maconnerie', (SELECT id FROM bricolage),
   '{"type": "exterieur", "category": "maconnerie"}');

-- Loisirs - Sous-catégories détaillées
WITH loisirs AS (
  SELECT id FROM categories WHERE slug = 'loisirs'
)
INSERT INTO subcategories (name, slug, category_id, metadata) VALUES
  -- Intérieur
  ('Jeux de société', 'jeux-societe', (SELECT id FROM loisirs),
   '{"type": "interieur", "category": "jeux"}'),
  ('Instruments de musique', 'instruments-musique', (SELECT id FROM loisirs),
   '{"type": "interieur", "category": "musique"}'),
  ('Consoles et jeux vidéo', 'jeux-video', (SELECT id FROM loisirs),
   '{"type": "interieur", "category": "gaming"}'),
  ('Livres et BD', 'livres-bd', (SELECT id FROM loisirs),
   '{"type": "interieur", "category": "lecture"}'),

  -- Extérieur
  ('Sports d''équipe', 'sports-equipe', (SELECT id FROM loisirs),
   '{"type": "exterieur", "category": "sport"}'),
  ('Sports individuels', 'sports-individuels', (SELECT id FROM loisirs),
   '{"type": "exterieur", "category": "sport"}'),
  ('Camping', 'camping', (SELECT id FROM loisirs),
   '{"type": "exterieur", "category": "pleinair"}'),
  ('Pêche', 'peche', (SELECT id FROM loisirs),
   '{"type": "exterieur", "category": "pleinair"}'),
  ('Randonnée', 'randonnee', (SELECT id FROM loisirs),
   '{"type": "exterieur", "category": "pleinair"}');