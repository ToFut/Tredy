# Fix: Supabase as Default Login in Production

## Problem
When AUTH_TOKEN is set in Railway production environment, the application was forcing password-only login and preventing Supabase authentication from working.

## Root Cause
The login component was checking if `requiresAuth` (which is true when AUTH_TOKEN is set) and defaulting to password login, blocking Supabase authentication.

## Solution
Modified `/frontend/src/pages/Login/index.jsx` to:
1. Make Supabase the default login method
2. Allow password login via `/login/password` route
3. Enable both authentication methods to coexist

## Changes Made

### frontend/src/pages/Login/index.jsx
- Removed the logic that forced password login when AUTH_TOKEN is set
- Made Supabase the default login page at `/login`
- Password login still accessible at `/login/password`

## How It Works Now

### Default Login Flow (/)
1. User visits https://tredy-production.up.railway.app/login
2. Supabase login page is shown by default
3. Users can authenticate via:
   - Email/password through Supabase
   - OAuth providers (Google, GitHub, etc.)

### Password Login Flow (Alternative)
1. User visits https://tredy-production.up.railway.app/login/password
2. Traditional password modal is shown
3. Users authenticate with AUTH_TOKEN password

## Deployment Steps

1. **Commit and Push**
```bash
git add .
git commit -m "Fix: Make Supabase default login method in production"
git push origin master
```

2. **Railway Auto-Deploy**
- Railway will automatically rebuild and deploy
- No environment variable changes needed

## Environment Variables (Keep As Is)
```bash
# Keep AUTH_TOKEN for password login fallback
AUTH_TOKEN=your-secure-password

# Supabase configuration
SUPABASE_URL=https://xyprfcyluvmqtipjlopj.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Benefits
- ✅ Supabase login works by default in production
- ✅ Password login still available as fallback
- ✅ No breaking changes for existing users
- ✅ Both authentication methods can coexist

## Testing After Deployment
1. Visit https://tredy-production.up.railway.app/login
   - Should show Supabase login
2. Visit https://tredy-production.up.railway.app/login/password  
   - Should show password login modal
3. Test both login methods work correctly