/*
  # Ajout de la table des catégories et mise à jour des annonces

  1. Nouvelles Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `slug` (text, unique)
      - `created_at` (timestamp)

  2. Modifications
    - Modification de la table `listings` pour lier aux catégories
    - Ajout des catégories par défaut

  3. Sécurité
    - Enable RLS sur la table categories
    - Policies pour la lecture publique des catégories
*/

-- Création de la table des catégories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy pour la lecture publique
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Insertion des catégories par défaut
INSERT INTO categories (name, slug) VALUES
  ('Immobilier', 'immobilier'),
  ('Véhicules', 'vehicules'),
  ('Multimédia', 'multimedia'),
  ('Loisirs', 'loisirs'),
  ('Mode', 'mode'),
  ('Maison', 'maison'),
  ('Bricolage', 'bricolage'),
  ('Sports', 'sports'),
  ('Vacances', 'vacances');

-- Modification de la table listings
ALTER TABLE listings
  DROP COLUMN category,
  ADD COLUMN category_id uuid REFERENCES categories(id) NOT NULL;