# Supabase Redirect URL Configuration

## Problem
After login, users are being redirected to `localhost:3000` instead of the production URL.

## Solution
You need to configure the redirect URLs in your Supabase dashboard.

### Steps to Fix:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `xyprfcyluvmqtipjlopj`

2. **Navigate to Authentication Settings**
   - Go to: Authentication → URL Configuration

3. **Add Redirect URLs**
   Add these URLs to the "Redirect URLs" section:
   
   **For Production (Railway):**
   ```
   https://tredy-production.up.railway.app
   https://tredy-production.up.railway.app/login
   https://tredy-production.up.railway.app/login/callback
   ```
   
   **For Local Development:**
   ```
   http://localhost:8123
   http://localhost:8123/login
   http://localhost:8123/login/callback
   http://localhost:3000
   http://localhost:3000/login
   http://localhost:3000/login/callback
   ```

4. **Update Site URL**
   - Set Site URL to: `https://tredy-production.up.railway.app`
   - This is the default URL users will be redirected to

5. **Save Changes**
   - Click "Save" at the bottom of the page

## Alternative: Environment-Based Configuration

If you want the app to automatically use the correct redirect URL based on environment, the code already uses `window.location.origin` which should work correctly. The issue is that Supabase needs to whitelist the URLs.

## What Changed in the Code:

### 1. User Role Assignment (Fixed)
- **Before**: New users were created with `default` role
- **Now**: All new users are created with `admin` role
- **First User**: Automatically becomes admin
- **Subsequent Users**: Also get admin role by default

### 2. Authentication on Railway (Fixed)
- **Before**: No authentication required on Railway
- **Now**: Authentication is automatically enabled when deployed to Railway
- If `AUTH_TOKEN` is not set, it uses default: `changeThisPasswordInRailway`

## Testing the Fix:

1. **Deploy to Railway**
   ```bash
   git add .
   git commit -m "Fix authentication and user roles"
   git push
   ```

2. **Set Environment Variable in Railway**
   ```
   AUTH_TOKEN=your-secure-password
   ```

3. **Configure Supabase Redirect URLs** (as described above)

4. **Test Login Flow**
   - Go to: https://tredy-production.up.railway.app
   - You should see a login screen
   - After login, you should stay on the production domain
   - New users should have admin role

## Important Notes:

- The redirect URL issue requires configuration in Supabase dashboard
- The code uses `window.location.origin` which correctly detects the current domain
- Supabase needs to whitelist each domain you want to redirect to
- Make sure to add both HTTP and HTTPS versions if needed