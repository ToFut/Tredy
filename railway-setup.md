# Railway Deployment Authentication Setup

## Current Issues Fixed:
1. ✅ Backend server now runs on port 8125 (matching frontend proxy)
2. ✅ Frontend Vite config proxies to correct port (8125)
3. ✅ Authentication system works in development mode
4. ✅ Supabase integration configured

## For Railway Deployment:

### Environment Variables to Set in Railway Dashboard:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
SERVER_PORT=3001

# Authentication (IMPORTANT - Change these!)
JWT_SECRET=your-secure-random-string-at-least-32-chars
SIG_KEY=your-secure-passphrase-at-least-32-chars
SIG_SALT=your-secure-salt-at-least-32-chars

# Supabase Authentication
SUPABASE_URL=https://xyprfcyluvmqtipjlopj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cHJmY3lsdXZtcXRpcGpsb3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTU0OTAsImV4cCI6MjA3MTkzMTQ5MH0.Eh4Oa4Aca6nzdHoC1Tpk0UcEuc6-a4SymRLzU9p4YAk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cHJmY3lsdXZtcXRpcGpsb3BqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM1NTQ5MCwiZXhwIjoyMDcxOTMxNDkwfQ.pkXna1G0_b0F01473YOz34VLJE1oFa46TesQFpyF84w

# LLM Provider
LLM_PROVIDER=togetherai
TOGETHER_AI_API_KEY=e9e5022a483835887a9a3bc18a7647aaaea5af2936efe5898b6cd0f7a350c282
TOGETHER_AI_MODEL_PREF=meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo

# Other settings
VECTOR_DB=lancedb
EMBEDDING_ENGINE=native
EMBEDDING_MODEL_PREF=Xenova/all-MiniLM-L6-v2
STORAGE_DIR=/app/server/storage
DISABLE_TELEMETRY=true
```

## Local Development:

### To run with authentication bypassed (easier for development):
```bash
# Backend (already running on port 8125)
cd server && SERVER_PORT=8125 yarn dev

# Frontend (already configured to proxy to 8125)
cd frontend && yarn dev
```

### To test with authentication enabled locally:
```bash
# Backend with auth required
cd server && SERVER_PORT=8125 REQUIRE_AUTH=true yarn dev

# Frontend
cd frontend && yarn dev
```

## Authentication Flow:

### Development Mode (current):
- Authentication is bypassed when `NODE_ENV=development` and `REQUIRE_AUTH` is not set
- `/api/system/check-token` returns success without validation
- Easier for local development

### Production Mode (Railway):
- Full authentication required
- Supabase integration validates users
- JWT tokens are properly validated
- Multi-user mode is enabled

## To Deploy to Railway:

1. Push code to GitHub
2. Railway will auto-deploy from your repository
3. Set all environment variables listed above in Railway dashboard
4. Railway will use the Dockerfile which already has PORT=3001 configured

## Testing Authentication:

### Local (bypassed):
```bash
curl http://localhost:8125/api/system/check-token
# Returns: {"online":true,"valid":true,"development":true}
```

### Production (requires token):
```bash
curl https://your-app.railway.app/api/system/check-token
# Returns: {"online":true,"valid":false} without token
```

## Important Security Notes:

1. **CHANGE THE DEFAULT SECRETS** - The JWT_SECRET, SIG_KEY, and SIG_SALT must be changed in production
2. **Use Strong Values** - Generate random strings using:
   ```bash
   openssl rand -hex 32
   ```
3. **Keep Supabase Keys Secure** - Never commit these to your repository

## User Management:

In production on Railway:
- Users will authenticate via Supabase
- First user to sign up becomes admin
- Additional users can be managed through the admin panel
- All users are synchronized between Supabase and local database