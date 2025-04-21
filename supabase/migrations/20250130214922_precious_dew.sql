/*
  # Ajout d'index pour les sous-catégories

  1. Modifications
    - Ajout d'index pour améliorer les performances des requêtes
    - Ajout de contraintes pour garantir l'intégrité des données

  2. Sécurité
    - Utilisation des policies existantes
*/

-- Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS subcategories_category_id_idx ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS subcategories_slug_idx ON subcategories(slug);

-- Ajout d'index sur le champ metadata pour les recherches JSONB
CREATE INDEX IF NOT EXISTS subcategories_metadata_gin_idx ON subcategories USING gin(metadata);

-- Ajout d'une contrainte pour s'assurer que le slug est unique par catégorie
ALTER TABLE subcategories 
DROP CONSTRAINT IF EXISTS unique_category_slug,
ADD CONSTRAINT unique_category_slug UNIQUE (category_id, slug);