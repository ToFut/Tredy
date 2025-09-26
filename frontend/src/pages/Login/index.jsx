import React, { useEffect } from "react";
import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { FullScreenLoader } from "@/components/Preloader";
import { Navigate, useNavigate } from "react-router-dom";
import paths from "@/utils/paths";
import useQuery from "@/hooks/useQuery";
import useSimpleSSO from "@/hooks/useSimpleSSO";
import SupabaseLogin from "./SupabaseLogin";

/**
 * Login page that handles both single and multi-user login.
 *
 * If Simple SSO is enabled and no login is allowed, the user will be redirected to the SSO login page
 * which may not have a token so the login will fail.
 *
 * @returns {JSX.Element}
 */
export default function Login() {
  const query = useQuery();
  const navigate = useNavigate();
  const { loading: ssoLoading, ssoConfig } = useSimpleSSO();
  const { loading, requiresAuth, mode } = usePasswordModal(!!query.get("nt"));

  // Check if user wants legacy login
  const useLegacy = window.location.pathname.includes('/login/password');
  
  // Check if we're in an OAuth callback flow
  const isOAuthCallback = query.get('oauth') || 
                          window.location.hash.includes('access_token') ||
                          window.location.hash.includes('error') ||
                          window.location.hash.includes('type');
  
  console.log('Login component - pathname:', window.location.pathname, 'useLegacy:', useLegacy, 'requiresAuth:', requiresAuth, 'isOAuthCallback:', isOAuthCallback);

  // Removed auto-redirect to prevent loops

  if (loading || ssoLoading) return <FullScreenLoader />;
  // If simple SSO is enabled and no login is allowed, redirect to the SSO login page.
  if (ssoConfig.enabled && ssoConfig.noLogin) {
    // If a noLoginRedirect is provided and no token is provided, redirect to that webpage.
    if (!!ssoConfig.noLoginRedirect && !query.has("token"))
      return window.location.replace(ssoConfig.noLoginRedirect);
    // Otherwise, redirect to the SSO login page.
    else return <Navigate to={paths.sso.login()} />;
  }

  if (requiresAuth === false) return <Navigate to={paths.home()} />;

  // Determine which login method to use based on the URL path
  // Always default to Supabase login unless explicitly requesting password login
  if (useLegacy) {
    console.log('[Login] Rendering PasswordModal for password authentication');
    return <PasswordModal mode={mode} />;
  }

  // Default to Supabase login for production - FORCE REBUILD
  // Users can still access password login via /login/password if needed
  console.log('[Login] DEFAULT: Rendering SupabaseLogin component');
  return <SupabaseLogin />;
}
