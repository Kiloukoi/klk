# Kiloukoi - Plateforme de location entre particuliers

## Configuration du projet

### Prérequis
- Node.js 18+
- Compte Supabase

### Installation
1. Cloner le dépôt
2. Installer les dépendances : `npm install`
3. Configurer les variables d'environnement dans un fichier `.env` :
   ```
   VITE_SUPABASE_URL=votre_url_supabase
   VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
   ```

### Développement
- Démarrer le serveur de développement : `npm run dev`

### Migrations de base de données
Pour que les migrations fonctionnent correctement, vous devez d'abord créer manuellement la fonction `exec_sql` dans votre base de données Supabase.

1. Allez dans le dashboard Supabase
2. Naviguez vers l'éditeur SQL
3. Exécutez le code suivant :

```sql
-- Create function to execute SQL (for migrations)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the exec_sql function
CREATE OR REPLACE FUNCTION create_exec_sql_function()
RETURNS void AS $$
BEGIN
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION create_exec_sql_function TO authenticated;
```

4. Ensuite, vous pouvez exécuter les migrations avec : `npm run migration:apply`

### Création d'une nouvelle migration
- Créer une nouvelle migration : `npm run migration:new`

## Fonctionnalités
- Location d'objets entre particuliers
- Système de réservation
- Messagerie intégrée
- Évaluations et avis
- Mise en avant d'annonces