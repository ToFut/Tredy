import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://xyprfcyluvmqtipjlopj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cHJmY3lsdXZtcXRpcGpsb3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTU0OTAsImV4cCI6MjA3MTkzMTQ5MH0.Eh4Oa4Aca6nzdHoC1Tpk0UcEuc6-a4SymRLzU9p4YAk';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  }
});

// Helper function to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    return false;
  }
  // Clear local storage
  localStorage.removeItem('tredy_user');
  window.location.href = '/login';
  return true;
};

// Set up auth state change listener
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Store the JWT token for Tredy API calls
      localStorage.setItem('tredy_supabase_token', session.access_token);
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem('tredy_supabase_token');
    }
    callback(event, session);
  });
};