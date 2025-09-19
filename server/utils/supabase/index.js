process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

// Only initialize Supabase if credentials are provided
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabaseAdmin = null;
let supabase = null;

if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  // Server-side Supabase client with service role key for admin operations
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  // Client-side Supabase client for user operations
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Validate a Supabase JWT token and return user data
 * @param {string} token - JWT token from Authorization header
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
async function validateSupabaseJWT(token) {
  if (!supabaseAdmin) {
    return { user: null, error: "Supabase is not configured" };
  }
  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error) {
      console.log("Supabase JWT validation error:", error.message);
      return { user: null, error: error.message };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Failed to validate Supabase JWT:", error.message);
    return { user: null, error: error.message };
  }
}

/**
 * Get Supabase user by ID using admin client
 * @param {string} userId - Supabase user ID
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
async function getSupabaseUser(userId) {
  if (!supabaseAdmin) {
    return { user: null, error: "Supabase is not configured" };
  }
  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error) {
      return { user: null, error: error.message };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Failed to get Supabase user:", error.message);
    return { user: null, error: error.message };
  }
}

/**
 * List all Supabase users (admin only)
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Users per page (default: 1000)
 * @returns {Promise<{users: array, error: string|null}>}
 */
async function listSupabaseUsers(page = 1, perPage = 1000) {
  if (!supabaseAdmin) {
    return { users: [], error: "Supabase is not configured" };
  }
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      return { users: [], error: error.message };
    }

    return { users: data.users || [], error: null };
  } catch (error) {
    console.error("Failed to list Supabase users:", error.message);
    return { users: [], error: error.message };
  }
}

/**
 * Update user metadata (admin only)
 * @param {string} userId - Supabase user ID
 * @param {object} metadata - User metadata to update
 * @returns {Promise<{user: object|null, error: string|null}>}
 */
async function updateUserMetadata(userId, metadata) {
  if (!supabaseAdmin) {
    return { user: null, error: "Supabase is not configured" };
  }
  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: metadata,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user, error: null };
  } catch (error) {
    console.error("Failed to update user metadata:", error.message);
    return { user: null, error: error.message };
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  validateSupabaseJWT,
  getSupabaseUser,
  listSupabaseUsers,
  updateUserMetadata,
};
