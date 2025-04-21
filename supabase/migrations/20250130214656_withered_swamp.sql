/*
  # Ajout des sous-catégories

  1. Modifications
    - Ajout de la table subcategories
    - Mise à jour de la table categories avec parent_id
    - Ajout des sous-catégories pour Bricolage, Loisirs, Mode et Véhicules

  2. Sécurité
    - Enable RLS sur la table subcategories
    - Policies pour la lecture publique
*/

-- Création de la table des sous-catégories
CREATE TABLE subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(category_id, slug)
);

-- Enable RLS
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Policy pour la lecture publique
CREATE POLICY "Subcategories are viewable by everyone"
  ON subcategories FOR SELECT
  USING (true);

-- Insertion des sous-catégories pour Bricolage
WITH bricolage AS (
  SELECT id FROM categories WHERE slug = 'bricolage'
)
INSERT INTO subcategories (name, slug, category_id) VALUES
  ('Intérieur', 'interieur', (SELECT id FROM bricolage)),
  ('Extérieur', 'exterieur', (SELECT id FROM bricolage));

-- Insertion des sous-catégories pour Loisirs
WITH loisirs AS (
  SELECT id FROM categories WHERE slug = 'loisirs'
)
INSERT INTO subcategories (name, slug, category_id) VALUES
  ('Intérieurs', 'interieurs', (SELECT id FROM loisirs)),
  ('Extérieurs', 'exterieurs', (SELECT id FROM loisirs));

-- Insertion des sous-catégories pour Mode
WITH mode AS (
  SELECT id FROM categories WHERE slug = 'mode'
)
INSERT INTO subcategories (name, slug, category_id, metadata) VALUES
  ('Homme', 'homme', (SELECT id FROM mode), '{"type": "adulte", "sizes": ["XS", "S", "M", "L", "XL", "XXL"], "categories": ["pantalons", "pulls", "t-shirts"]}'),
  ('Femme', 'femme', (SELECT id FROM mode), '{"type": "adulte", "sizes": ["34", "36", "38", "40", "42", "44", "46"], "categories": ["pantalons", "pulls", "t-shirts"]}'),
  ('Enfant', 'enfant', (SELECT id FROM mode), '{"type": "enfant", "ages": "2-14", "sizes": ["2ans", "4ans", "6ans", "8ans", "10ans", "12ans", "14ans"]}'),
  ('Bébé', 'bebe', (SELECT id FROM mode), '{"type": "bebe", "ages": "0-24m", "sizes": ["0-3m", "3-6m", "6-12m", "12-18m", "18-24m"]}'),
  ('Chaussures Homme', 'chaussures-homme', (SELECT id FROM mode), '{"type": "chaussures", "sizes": ["39", "40", "41", "42", "43", "44", "45", "46"]}'),
  ('Chaussures Femme', 'chaussures-femme', (SELECT id FROM mode), '{"type": "chaussures", "sizes": ["35", "36", "37", "38", "39", "40", "41"]}'),
  ('Chaussures Enfant', 'chaussures-enfant', (SELECT id FROM mode), '{"type": "chaussures", "sizes": ["28", "29", "30", "31", "32", "33", "34", "35"]}'),
  ('Chaussures Bébé', 'chaussures-bebe', (SELECT id FROM mode), '{"type": "chaussures", "sizes": ["16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27"]}');

-- Insertion des sous-catégories pour Véhicules
WITH vehicules AS (
  SELECT id FROM categories WHERE slug = 'vehicules'
)
INSERT INTO subcategories (name, slug, category_id) VALUES
  ('Voitures', 'voitures', (SELECT id FROM vehicules)),
  ('Motos', 'motos', (SELECT id FROM vehicules)),
  ('Remorques', 'remorques', (SELECT id FROM vehicules)),
  ('Accessoires', 'accessoires', (SELECT id FROM vehicules));

-- Ajout de la colonne subcategory_id à la table listings
ALTER TABLE listings
ADD COLUMN subcategory_id uuid REFERENCES subcategories(id);

-- Création d'un index pour améliorer les performances
CREATE INDEX listings_subcategory_id_idx ON listings(subcategory_id);