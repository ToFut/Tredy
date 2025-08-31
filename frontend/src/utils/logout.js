import { AUTH_TIMESTAMP, AUTH_TOKEN, AUTH_USER } from "./constants";
import { userFromStorage } from "./request";
import paths from "./paths";
import { supabase } from "./supabase";

/**
 * Centralized logout function that handles both regular and Supabase users
 */
export const logout = async () => {
  console.log('[LOGOUT] Starting logout process...');
  
  try {
    const user = userFromStorage();
    console.log('[LOGOUT] Current user:', user);
    
    // If user has supabaseId, they're a Supabase user - sign out from Supabase
    if (user?.supabaseId) {
      console.log('[LOGOUT] Detected Supabase user, signing out from Supabase...');
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('[LOGOUT] Supabase signout error:', error);
        } else {
          console.log('[LOGOUT] Successfully signed out from Supabase');
        }
      } catch (supabaseError) {
        console.error('[LOGOUT] Supabase signout exception:', supabaseError);
      }
    }
    
    // Clear all authentication data from localStorage
    console.log('[LOGOUT] Clearing localStorage...');
    window.localStorage.removeItem(AUTH_USER);
    window.localStorage.removeItem(AUTH_TOKEN);
    window.localStorage.removeItem(AUTH_TIMESTAMP);
    window.localStorage.removeItem('anythingllm_supabase_token');
    
    console.log('[LOGOUT] Cleared local authentication data');
    console.log('[LOGOUT] Redirecting to login page...');
    
    // Immediate redirect without delay
    window.location.replace(paths.login());
    
  } catch (error) {
    console.error('[LOGOUT] Logout error:', error);
    
    // Fallback: force clear everything and redirect
    try {
      window.localStorage.clear();
      window.location.replace(paths.login());
    } catch (fallbackError) {
      console.error('[LOGOUT] Fallback logout failed:', fallbackError);
      // Last resort: just reload the page
      window.location.reload();
    }
  }
};

export default logout;