import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, onAuthStateChange } from '@/utils/supabase';

const SupabaseAuthContext = createContext({});

export const useSupabaseAuth = () => useContext(SupabaseAuthContext);

export const SupabaseAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        localStorage.setItem('tredy_supabase_token', session.access_token);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in via Supabase');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        window.location.href = '/login';
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
        if (session) {
          localStorage.setItem('tredy_supabase_token', session.access_token);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    return { data, error };
  };

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      localStorage.removeItem('tredy_supabase_token');
      localStorage.removeItem('tredy_user');
    }
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    signOut,
  };

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};