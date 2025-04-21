/*
  # Ajout de la colonne metadata

  1. Nouvelles colonnes
    - `metadata` (jsonb) : Stockage des caractéristiques spécifiques à chaque type d'annonce

  2. Index
    - Création d'un index GIN pour les recherches dans le JSON
*/

-- Ajout de la colonne metadata
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Création d'un index GIN pour les recherches dans le JSON
CREATE INDEX IF NOT EXISTS listings_metadata_gin_idx ON listings USING gin(metadata);

-- Mise à jour de la fonction de recherche pour inclure les métadonnées
CREATE OR REPLACE FUNCTION search_listings(search_term text)
RETURNS SETOF listings AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM listings
  WHERE 
    title ILIKE '%' || search_term || '%'
    OR description ILIKE '%' || search_term || '%'
    OR location ILIKE '%' || search_term || '%'
    OR postal_code ILIKE '%' || search_term || '%'
    OR city ILIKE '%' || search_term || '%'
    OR metadata::text ILIKE '%' || search_term || '%';
END;
$$ LANGUAGE plpgsql;