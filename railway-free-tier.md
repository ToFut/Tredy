# Railway Free Tier Deployment Guide

Since Railway volumes require a paid plan, here's how to deploy Tredy on Railway's free tier with external services:

## Quick Setup (Minimal - Works immediately)

The app is already configured to work without persistent storage. It will:
- Use SQLite in memory (resets on restart)
- Use LanceDB locally (resets on restart)
- Store documents temporarily (lost on restart)

This is fine for testing and development.

## Production Setup with External Services (Free)

### 1. Database: Railway PostgreSQL (Free)
In Railway dashboard:
1. Click "New" → "Database" → "PostgreSQL"
2. Railway will create a free PostgreSQL instance
3. Copy the connection string
4. Add to your service variables:
   ```
   DATABASE_CONNECTION_STRING=postgresql://...
   ```

### 2. Vector Database Options (Choose one):

#### Pinecone (Free tier: 100k vectors)
1. Sign up at https://www.pinecone.io
2. Create an index
3. Add to Railway variables:
   ```
   VECTOR_DB=pinecone
   PINECONE_API_KEY=your-key
   PINECONE_INDEX=your-index-name
   ```

#### Qdrant Cloud (Free tier: 1GB)
1. Sign up at https://cloud.qdrant.io
2. Create a cluster
3. Add to Railway variables:
   ```
   VECTOR_DB=qdrant
   QDRANT_ENDPOINT=https://your-cluster.qdrant.io
   QDRANT_API_KEY=your-key
   ```

#### Supabase Vector (Free tier: 500MB)
1. Use your existing Supabase project
2. Enable pgvector extension
3. Add to Railway variables:
   ```
   VECTOR_DB=supabase
   SUPABASE_URL=your-url
   SUPABASE_SERVICE_ROLE_KEY=your-key
   ```

### 3. Document Storage Options:

#### Supabase Storage (Free: 1GB)
1. In Supabase dashboard, go to Storage
2. Create a bucket called "documents"
3. Documents will be stored there via API

#### Cloudinary (Free: 25GB)
1. Sign up at https://cloudinary.com
2. Can be integrated for document storage

### 4. Required Railway Environment Variables

Add these in Railway dashboard → Your Service → Variables:

```bash
# Core (Required)
AUTH_TOKEN=your-password-here
JWT_SECRET=generate-random-32-char-string
SIG_KEY=generate-random-32-char-string
SIG_SALT=generate-random-32-char-string

# Database (Use Railway PostgreSQL)
DATABASE_CONNECTION_STRING=postgresql://...

# Vector DB (Choose from above)
VECTOR_DB=pinecone
PINECONE_API_KEY=...
PINECONE_INDEX=...

# AI Provider (You already have this)
LLM_PROVIDER=togetherai
TOGETHER_AI_API_KEY=e9e5022a483835887a9a3bc18a7647aaaea5af2936efe5898b6cd0f7a350c282

# Optional but recommended
DISABLE_TELEMETRY=true
CUSTOM_APP_NAME=Tredy
```

## Alternative: Deploy to Render.com (Better free tier)

Render.com offers:
- Free PostgreSQL with 90-day retention
- Persistent disk storage (1GB free)
- Better for production use

To deploy on Render:
1. Push code to GitHub
2. Connect GitHub to Render
3. Create new Web Service
4. Use Dockerfile for deployment
5. Add environment variables
6. Deploy

## Alternative: Deploy to Fly.io

Fly.io offers:
- Free tier with 3GB persistent volumes
- Global deployment
- Better performance

To deploy on Fly.io:
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

## Current Status

Your app is currently deployed on Railway at your URL. It will work but:
- ❌ Documents won't persist between deployments
- ❌ User accounts reset on restart
- ❌ Vector indexes rebuild each time
- ✅ Together AI works
- ✅ Basic chat functionality works
- ✅ Can test all features

For production use, either:
1. Upgrade Railway to Hobby plan ($5/month) for volumes
2. Configure external services (free but more complex)
3. Use alternative platforms like Render or Fly.io