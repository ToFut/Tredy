# Deploy AnythingLLM to Railway with Docker

## Quick Deploy

### Option 1: Deploy from GitHub (Recommended)

1. **Fork or push this repository to GitHub**

2. **Go to Railway**
   - Visit [railway.app](https://railway.app)
   - Sign in with GitHub

3. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your AnythingLLM repository
   - Railway will detect the `railway.json` and Dockerfile automatically

4. **Configure Environment Variables**
   ```bash
   # Required
   AUTH_TOKEN=your-secure-password
   JWT_SECRET=your-jwt-secret-min-12-chars
   SIG_KEY=your-signature-key-min-32-chars
   SIG_SALT=your-signature-salt-min-32-chars
   STORAGE_DIR=/app/storage
   
   # LLM Provider (choose one)
   OPENAI_API_KEY=sk-...
   # OR
   ANTHROPIC_API_KEY=sk-ant-...
   # OR
   GROQ_API_KEY=gsk_...
   
   # For MCP/Connectors
   NANGO_SECRET_KEY=your-nango-key
   NANGO_HOST=https://api.nango.dev
   
   # Optional OAuth for connectors
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

5. **Deploy**
   - Railway will automatically build and deploy using the Dockerfile
   - Watch the build logs in Railway dashboard
   - Once deployed, click on the generated URL to access your app

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   # or
   curl -fsSL https://railway.app/install.sh | sh
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   # In your AnythingLLM directory
   railway init
   ```

4. **Link to Railway Project**
   ```bash
   railway link
   ```

5. **Deploy**
   ```bash
   railway up
   ```

6. **Set Environment Variables**
   ```bash
   railway variables set AUTH_TOKEN=your-password
   railway variables set JWT_SECRET=your-jwt-secret
   railway variables set SIG_KEY=your-sig-key
   railway variables set SIG_SALT=your-sig-salt
   railway variables set STORAGE_DIR=/app/storage
   # Add other variables as needed
   ```

7. **Redeploy with Variables**
   ```bash
   railway up
   ```

## Configuration Files Explained

### railway.json
- Tells Railway to use Docker for building
- Points to `docker/Dockerfile`
- Sets restart policy and health checks

### docker/Dockerfile
- Multi-stage build for ARM and AMD architectures
- Installs all dependencies including Node.js, Chrome, and MCP support
- Sets up the application structure

### docker/docker-entrypoint.sh
- Runs database migrations
- Starts the main server
- Starts the collector service
- Starts MCP servers (if configured)

## Post-Deployment Setup

1. **Access Your App**
   - Railway provides a URL like `https://your-app.up.railway.app`
   - First login requires the AUTH_TOKEN you set

2. **Configure LLM Provider**
   - Go to Settings > LLM Preference
   - Select and configure your provider

3. **Set Up Vector Database**
   - Default uses LanceDB (no config needed)
   - Can switch to Pinecone, Weaviate, etc.

4. **Enable Connectors (Optional)**
   - Ensure MCP environment variables are set
   - Configure OAuth apps for each service
   - Test connectors in workspace settings

## Persistent Storage

Railway provides persistent storage automatically. Your data in `/app/storage` will persist across deployments.

## Monitoring

- View logs: Railway Dashboard > Your Project > Logs
- Check metrics: Railway Dashboard > Your Project > Metrics
- Health check endpoint: `/api/health`

## Troubleshooting

### Build Fails
- Check Railway build logs
- Ensure Dockerfile path is correct in railway.json
- Verify all files are committed to git

### App Crashes
- Check you've set all required environment variables
- Review Railway runtime logs
- Ensure AUTH_TOKEN is set for production

### MCP/Connectors Not Working
- Verify NANGO_SECRET_KEY is set
- Check OAuth credentials are correct
- Look for "[MCP] Starting..." in logs

### Database Issues
- Railway handles SQLite persistence automatically
- For PostgreSQL, add DATABASE_URL variable

## Updating

1. Push changes to GitHub
2. Railway auto-deploys on push to main branch
3. Or manually trigger: Railway Dashboard > Deploy

## Custom Domain

1. Railway Dashboard > Your Project > Settings
2. Add custom domain
3. Configure DNS as instructed

## Scaling

- Adjust replicas in railway.json
- Increase resources in Railway Dashboard
- Consider PostgreSQL for production scale