/*
  # Correction des erreurs de schéma

  1. Corrections
    - Ajout de la colonne owner_id à la table reviews
    - Création de la fonction is_listing_promoted
    - Création de la table promotions si elle n'existe pas

  2. Détails
    Cette migration corrige les erreurs rencontrées lors de l'affichage des détails d'une annonce.
*/

-- Vérifier si la table reviews existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'reviews'
  ) THEN
    -- Vérifier si la colonne owner_id existe
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'reviews' AND column_name = 'owner_id'
    ) THEN
      -- Ajouter la colonne owner_id
      ALTER TABLE reviews ADD COLUMN owner_id uuid REFERENCES profiles(id);
      
      -- Mettre à jour les valeurs de owner_id pour les reviews existantes
      -- en utilisant l'owner_id des listings associés
      UPDATE reviews r
      SET owner_id = l.owner_id
      FROM listings l
      WHERE r.listing_id = l.id;
      
      -- Rendre la colonne NOT NULL après avoir mis à jour les données
      ALTER TABLE reviews ALTER COLUMN owner_id SET NOT NULL;
      
      -- Créer un index pour améliorer les performances
      CREATE INDEX IF NOT EXISTS reviews_owner_id_idx ON reviews(owner_id);
      
      RAISE NOTICE 'Colonne owner_id ajoutée à la table reviews et mise à jour avec succès';
    ELSE
      RAISE NOTICE 'La colonne owner_id existe déjà dans la table reviews';
    END IF;
  ELSE
    -- Créer la table reviews si elle n'existe pas
    CREATE TABLE reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
      reviewer_id uuid REFERENCES profiles(id) NOT NULL,
      listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
      owner_id uuid REFERENCES profiles(id) NOT NULL,
      rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Activation de RLS
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

    -- Politique pour la lecture publique des évaluations
    CREATE POLICY "Les évaluations sont visibles par tous"
      ON reviews FOR SELECT
      USING (true);

    -- Politique pour la création d'évaluations
    CREATE POLICY "Les utilisateurs peuvent créer des évaluations pour leurs réservations terminées"
      ON reviews FOR INSERT
      WITH CHECK (
        auth.uid() = reviewer_id AND
        EXISTS (
          SELECT 1 FROM bookings
          WHERE bookings.id = booking_id
          AND bookings.renter_id = reviewer_id
          AND bookings.status = 'completed'
        )
      );

    -- Politique pour la mise à jour des évaluations
    CREATE POLICY "Les utilisateurs peuvent modifier leurs propres évaluations"
      ON reviews FOR UPDATE
      USING (auth.uid() = reviewer_id);

    -- Politique pour la suppression des évaluations
    CREATE POLICY "Les utilisateurs peuvent supprimer leurs propres évaluations"
      ON reviews FOR DELETE
      USING (auth.uid() = reviewer_id);

    -- Ajout d'un index pour améliorer les performances
    CREATE INDEX reviews_listing_id_idx ON reviews(listing_id);
    CREATE INDEX reviews_owner_id_idx ON reviews(owner_id);
    CREATE INDEX reviews_reviewer_id_idx ON reviews(reviewer_id);
    CREATE INDEX reviews_booking_id_idx ON reviews(booking_id);
    
    RAISE NOTICE 'Table reviews créée avec succès';
  END IF;
END $$;

-- Ajout d'un trigger pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Suppression du trigger s'il existe déjà
DROP TRIGGER IF EXISTS set_reviews_updated_at ON reviews;

-- Création du trigger
CREATE TRIGGER set_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();

-- Fonction pour calculer la note moyenne d'un propriétaire
CREATE OR REPLACE FUNCTION get_owner_rating(owner_id uuid)
RETURNS TABLE(
  average_rating numeric,
  review_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating)::numeric(10,1), 0) as average_rating,
    COUNT(*) as review_count
  FROM reviews
  WHERE reviews.owner_id = get_owner_rating.owner_id;
END;
$$ LANGUAGE plpgsql;

-- Exposer la fonction via l'API REST
COMMENT ON FUNCTION get_owner_rating IS 'Calcule la note moyenne et le nombre d''évaluations d''un propriétaire';
GRANT EXECUTE ON FUNCTION get_owner_rating TO anon, authenticated, service_role;

-- Création de la table promotions si elle n'existe pas
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  amount_paid numeric NOT NULL,
  payment_id text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Enable Row Level Security
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS promotions_listing_id_idx ON promotions(listing_id);
CREATE INDEX IF NOT EXISTS promotions_user_id_idx ON promotions(user_id);
CREATE INDEX IF NOT EXISTS promotions_status_idx ON promotions(status);
CREATE INDEX IF NOT EXISTS promotions_end_date_idx ON promotions(end_date);

-- Create policies for the promotions table
DROP POLICY IF EXISTS "Users can view their own promotions" ON promotions;
CREATE POLICY "Users can view their own promotions"
  ON promotions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create promotions for their own listings" ON promotions;
CREATE POLICY "Users can create promotions for their own listings"
  ON promotions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own promotions" ON promotions;
CREATE POLICY "Users can update their own promotions"
  ON promotions FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to check if a listing is promoted
CREATE OR REPLACE FUNCTION is_listing_promoted(p_listing_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM promotions 
    WHERE listing_id = p_listing_id
    AND status = 'active'
    AND now() BETWEEN start_date AND end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Expose the function via the API REST
COMMENT ON FUNCTION is_listing_promoted IS 'Vérifie si une annonce est actuellement mise en avant';
GRANT EXECUTE ON FUNCTION is_listing_promoted TO anon, authenticated, service_role;