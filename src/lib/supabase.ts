import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Configure Supabase client with improved options
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: { 'x-application-name': 'kiloukoi' }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Error handling and retries
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 5000; // 5 seconds

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = (error: any): boolean => {
  // Network errors
  if (error.message?.includes('Failed to fetch')) return true;
  if (error.message?.includes('NetworkError')) return true;
  if (error.message?.includes('network')) return true;
  
  // Timeout errors
  if (error.message?.includes('timeout')) return true;
  
  // HTTP 5xx (server errors)
  if (error.status >= 500 && error.status < 600) return true;
  
  // JWT errors
  if (error.message?.includes('JWT')) return true;
  
  return false;
};

const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = INITIAL_RETRY_DELAY
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries === 0 || !isRetryableError(error)) {
      throw error;
    }

    // Exponential backoff with jitter
    const nextDelay = Math.min(delay * 2, MAX_RETRY_DELAY) * (0.8 + Math.random() * 0.4);
    
    console.warn(`Retrying operation, ${retries} attempts remaining. Next attempt in ${Math.round(nextDelay)}ms`);
    await wait(nextDelay);
    return withRetry(operation, retries - 1, nextDelay);
  }
};

// Enhanced Supabase client with retry and error handling
const supabaseWithRetry = {
  from: (table: string) => ({
    ...supabase.from(table),
    select: (...args: any[]) => 
      withRetry(() => supabase.from(table).select(...args))
        .catch(error => {
          console.error(`Error selecting from ${table}:`, error);
          toast.error(`Erreur lors de la récupération des données de ${table}`);
          throw error;
        }),
    insert: (...args: any[]) => 
      withRetry(() => supabase.from(table).insert(...args))
        .catch(error => {
          console.error(`Error inserting into ${table}:`, error);
          toast.error(`Erreur lors de l'insertion des données dans ${table}`);
          throw error;
        }),
    update: (...args: any[]) => 
      withRetry(() => supabase.from(table).update(...args))
        .catch(error => {
          console.error(`Error updating ${table}:`, error);
          toast.error(`Erreur lors de la mise à jour des données de ${table}`);
          throw error;
        }),
    delete: (...args: any[]) => 
      withRetry(() => supabase.from(table).delete(...args))
        .catch(error => {
          console.error(`Error deleting from ${table}:`, error);
          toast.error(`Erreur lors de la suppression des données de ${table}`);
          throw error;
        }),
    upsert: (...args: any[]) => 
      withRetry(() => supabase.from(table).upsert(...args))
        .catch(error => {
          console.error(`Error upserting into ${table}:`, error);
          toast.error(`Erreur lors de la mise à jour/insertion des données dans ${table}`);
          throw error;
        })
  }),
  auth: {
    ...supabase.auth,
    signInWithPassword: (...args: Parameters<typeof supabase.auth.signInWithPassword>) =>
      withRetry(() => supabase.auth.signInWithPassword(...args))
        .catch(error => {
          console.error('Error signing in:', error);
          toast.error('Erreur lors de la connexion');
          throw error;
        }),
    signUp: (...args: Parameters<typeof supabase.auth.signUp>) =>
      withRetry(() => supabase.auth.signUp(...args))
        .catch(error => {
          console.error('Error signing up:', error);
          toast.error('Erreur lors de l\'inscription');
          throw error;
        }),
    signOut: () =>
      withRetry(() => supabase.auth.signOut())
        .catch(error => {
          console.error('Error signing out:', error);
          toast.error('Erreur lors de la déconnexion');
          throw error;
        }),
    getSession: () =>
      withRetry(() => supabase.auth.getSession())
        .catch(error => {
          console.error('Error getting session:', error);
          throw error;
        }),
    onAuthStateChange: supabase.auth.onAuthStateChange,
    signInWithOAuth: (options: any) =>
      withRetry(() => supabase.auth.signInWithOAuth({
        ...options,
        options: {
          ...options.options,
          queryParams: {
            ...options.options?.queryParams,
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      }))
        .catch(error => {
          console.error('Error signing in with OAuth:', error);
          toast.error('Erreur lors de la connexion avec Google');
          throw error;
        })
  },
  storage: {
    ...supabase.storage,
    from: (bucket: string) => ({
      ...supabase.storage.from(bucket),
      upload: (...args: any[]) =>
        withRetry(() => supabase.storage.from(bucket).upload(...args))
          .catch(error => {
            console.error(`Error uploading to ${bucket}:`, error);
            toast.error('Erreur lors du téléchargement du fichier');
            throw error;
          }),
      remove: (...args: any[]) =>
        withRetry(() => supabase.storage.from(bucket).remove(...args))
          .catch(error => {
            console.error(`Error removing from ${bucket}:`, error);
            toast.error('Erreur lors de la suppression du fichier');
            throw error;
          }),
      list: (...args: any[]) =>
        withRetry(() => supabase.storage.from(bucket).list(...args))
          .catch(error => {
            console.error(`Error listing ${bucket}:`, error);
            toast.error('Erreur lors de la récupération de la liste des fichiers');
            throw error;
          }),
      getPublicUrl: (...args: any[]) =>
        supabase.storage.from(bucket).getPublicUrl(...args)
    })
  }
};

// Export both clients
export { supabase };
export default supabaseWithRetry;