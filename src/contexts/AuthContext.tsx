import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authLoading: boolean; // New state for auth-specific loading
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false); // For auth operations
  const navigate = useNavigate();

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error('Error checking auth session:', error);
      setLoading(false);
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const previousUser = user;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      setAuthLoading(false); // End loading when auth state changes
      
      // If this is a new sign-up or sign-in (user was null before and now exists)
      if (!previousUser && currentUser) {
        // Redirect to home page for all authentications
        navigate('/');
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthLoading(true); // Start loading
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // Navigation is handled in the onAuthStateChange listener
    } catch (error: any) {
      setAuthLoading(false); // End loading on error
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Erreur lors de la connexion');
    }
  };

  const signUp = async (email: string, password: string) => {
    setAuthLoading(true); // Start loading
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      // Navigation is handled in the onAuthStateChange listener
    } catch (error: any) {
      setAuthLoading(false); // End loading on error
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const resetPassword = async (email: string) => {
    setAuthLoading(true); // Start loading
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
    } catch (error: any) {
      setAuthLoading(false); // End loading on error
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  };

  const updatePassword = async (password: string) => {
    setAuthLoading(true); // Start loading
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    } catch (error: any) {
      setAuthLoading(false); // End loading on error
      console.error('Update password error:', error);
      throw new Error(error.message || 'Erreur lors de la mise à jour du mot de passe');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      authLoading,
      signIn, 
      signUp, 
      signOut,
      resetPassword,
      updatePassword
    }}>
      {authLoading && <LoadingScreen />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}