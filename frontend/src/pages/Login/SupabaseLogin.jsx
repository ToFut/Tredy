import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/utils/supabase";
import { CircleNotch } from "@phosphor-icons/react";
import paths from "@/utils/paths";

export default function SupabaseLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      console.log("[AUTH] Checking for existing session...");

      // First, let Supabase handle any OAuth redirect
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session) {
        console.log(
          "[AUTH] Found existing Supabase session:",
          session.user.email
        );
        await syncWithBackend(session);
      } else {
        console.log("[AUTH] No existing session found");
        setLoading(false);
      }
    } catch (err) {
      console.error("[AUTH] Error checking session:", err);
      setLoading(false);
    }
  };

  const syncWithBackend = async (session) => {
    try {
      console.log("[SYNC] Starting backend sync...");
      setMessage("Syncing with backend...");

      if (!session || !session.user) {
        throw new Error("Invalid session data");
      }

      // Simple test to verify backend is running by calling auth endpoint with invalid data
      const testResponse = await fetch("/api/auth/check-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "test" }),
      }).catch(() => null);

      if (!testResponse) {
        console.error("[SYNC] Backend not responding");
        setError("Backend server is not running. Please start the server.");
        setLoading(false);
        return;
      }

      console.log(
        "[SYNC] Calling /api/auth/supabase with user:",
        session.user.email
      );

      const authResponse = await fetch("/api/auth/supabase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabaseToken: session.access_token,
          email: session.user.email,
          id: session.user.id,
        }),
      });

      console.log("[SYNC] Response status:", authResponse.status);

      if (!authResponse.ok) {
        const errorText = await authResponse.text();
        console.error("[SYNC] Backend auth failed:", errorText);
        throw new Error("Backend authentication failed");
      }

      const authData = await authResponse.json();
      console.log("[SYNC] Auth successful:", authData);

      if (!authData.valid || !authData.token) {
        throw new Error("Invalid auth response from backend");
      }

      // Store the Tredy JWT token and update AuthContext
      window.localStorage.setItem("tredy_authToken", authData.token);
      window.localStorage.setItem("tredy_authTimestamp", String(Date.now()));

      if (authData.user) {
        window.localStorage.setItem(
          "tredy_user",
          JSON.stringify(authData.user)
        );
        // TODO: Update AuthContext when available
        // actions.updateUser(authData.user, authData.token);
      }

      console.log("[SYNC] Login complete, redirecting...");
      window.location.href = paths.home();
    } catch (err) {
      console.error("[SYNC] Sync failed:", err);
      setError(err.message || "Failed to complete login");
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });

        if (error) throw error;

        if (data?.user?.identities?.length === 0) {
          setError("This email is already registered. Please sign in instead.");
          setIsSignUp(false);
        } else {
          setMessage("Check your email for the confirmation link!");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.session) {
          await syncWithBackend(data.session);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (!message) setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    setMessage("Redirecting to Google...");

    try {
      const redirectUrl = `${window.location.origin}/login`;
      console.log("[OAuth] Using redirect URL:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
      console.log("[OAuth] Redirect initiated:", data);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLegacyLogin = () => {
    navigate("/login/password");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-theme-bg-container">
        <div className="text-center">
          <CircleNotch className="animate-spin h-8 w-8 mx-auto mb-4 text-white" />
          <p className="text-white">{message || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-theme-bg-container">
      <div className="w-full max-w-md p-8 space-y-6 bg-theme-bg-sidebar rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-sm text-theme-text-secondary">
            {isSignUp
              ? "Sign up to get started with Tredy"
              : "Sign in to your Tredy account"}
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-100 rounded-md dark:bg-red-900/20">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 text-sm text-green-500 bg-green-100 rounded-md dark:bg-green-900/20">
            {message}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-theme-text-primary"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-theme-bg-container border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-theme-text-primary"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 text-white bg-theme-bg-container border border-theme-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <CircleNotch className="animate-spin h-5 w-5" />
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-theme-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-theme-bg-sidebar text-theme-text-secondary">
              Or continue with
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-theme-bg-container border border-theme-border rounded-md hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </button>

          <button
            onClick={handleLegacyLogin}
            className="w-full px-4 py-2 text-theme-text-secondary bg-transparent border border-theme-border rounded-md hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Use Legacy Password Login
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-500 hover:text-blue-400"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
