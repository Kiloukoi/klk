/*
  # Ajout de la contrainte CASCADE pour les messages

  1. Modifications
    - Ajout de la colonne listing_id à la table messages
    - Ajout de la contrainte ON DELETE CASCADE pour listing_id
  
  2. Sécurité
    - Maintien des politiques RLS existantes
*/

-- Ajout de la colonne listing_id si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'listing_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN listing_id uuid REFERENCES listings(id);
  END IF;
END $$;

-- Suppression de la contrainte existante si elle existe
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_listing_id_fkey;

-- Ajout de la nouvelle contrainte avec CASCADE
ALTER TABLE messages
ADD CONSTRAINT messages_listing_id_fkey
FOREIGN KEY (listing_id)
REFERENCES listings(id)
ON DELETE CASCADE;

-- Création d'un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS messages_listing_id_idx ON messages(listing_id);