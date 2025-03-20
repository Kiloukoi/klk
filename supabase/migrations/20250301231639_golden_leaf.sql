-- Mise à jour de la table des évaluations pour corriger les problèmes de relations
DO $$ 
BEGIN
  -- Vérifier si la table reviews existe déjà
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
    -- Si elle existe, ne rien faire
    RAISE NOTICE 'La table reviews existe déjà, aucune modification nécessaire';
  ELSE
    -- Créer la table reviews
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

-- Fonction pour marquer une réservation comme terminée
CREATE OR REPLACE FUNCTION complete_booking(booking_id uuid)
RETURNS boolean AS $$
DECLARE
  v_booking_exists boolean;
BEGIN
  -- Vérifier si la réservation existe et peut être marquée comme terminée
  SELECT EXISTS (
    SELECT 1 
    FROM bookings 
    WHERE id = booking_id
    AND status = 'confirmed'
    AND end_date < CURRENT_DATE
  ) INTO v_booking_exists;

  -- Si la réservation existe et peut être terminée
  IF v_booking_exists THEN
    -- Mettre à jour le statut
    UPDATE bookings
    SET status = 'completed'
    WHERE id = booking_id;
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;