// Authentication configuration for development and production
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined;

const authConfig = {
  // Allow bypassing auth in development for easier testing
  requireAuth: isProduction || process.env.REQUIRE_AUTH === 'true',
  
  // Supabase configuration
  supabase: {
    enabled: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  
  // Multi-user mode configuration
  multiUserMode: {
    enabled: isProduction || process.env.ENABLE_MULTI_USER_MODE === 'true',
    autoEnable: isRailway, // Auto-enable on Railway
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
    expiry: process.env.JWT_EXPIRY || '30d',
  },
  
  // Development bypass user (for local testing)
  devUser: isDevelopment ? {
    id: 1,
    username: 'developer',
    email: 'dev@localhost',
    role: 'admin',
    supabaseId: 'dev-supabase-id',
  } : null,
};

module.exports = { authConfig };