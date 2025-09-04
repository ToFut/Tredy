# AnythingLLM Production Deployment Guide

## Complete Production Setup with Railway

This guide covers deploying AnythingLLM with all components including Nango, MCPs, Vector Database, and Cron Jobs.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Railway                        │
├───────────────┬────────────┬────────────────────┤
│   Frontend    │   Server    │    Collector       │
│   (Vercel)    │   (API)     │  (Doc Processor)   │
├───────────────┴────────────┴────────────────────┤
│              External Services                    │
├────────┬──────────┬─────────┬──────────────────┤
│ Nango  │   MCPs   │ Vector  │   Cron Jobs      │
│  API   │ Servers  │   DB    │   (Railway)      │
└────────┴──────────┴─────────┴──────────────────┘
```

## 1. Core Services Deployment

### Railway Setup

1. **Create Railway Project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init
```

2. **Create railway.toml**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "cd server && npm run start:production"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[[services]]
name = "server"
port = 3001

[[services]]
name = "collector"
port = 8888
```

### Environment Variables (Production)

Create a `.env.production` file:

```env
# Core Configuration
NODE_ENV=production
SERVER_PORT=3001
JWT_SECRET=<generate-strong-32-char-string>
SIG_KEY=<generate-strong-32-char-passphrase>
SIG_SALT=<generate-strong-32-char-salt>

# Database
DATABASE_URL=postgresql://user:password@host:5432/anythingllm
# Or for SQLite (default)
# DATABASE_URL=file:./storage/anythingllm.db

# Storage
STORAGE_DIR=/app/storage

# LLM Provider (Example with OpenAI)
LLM_PROVIDER=openai
OPEN_AI_KEY=sk-xxxxxxxxxxxx
OPEN_MODEL_PREF=gpt-4o

# Vector Database
VECTOR_DB=lancedb  # or pinecone, weaviate, qdrant, chroma
# For Pinecone
PINECONE_API_KEY=xxxxxxxxxxxx
PINECONE_INDEX=anythingllm-prod
PINECONE_ENVIRONMENT=us-east1-gcp

# Embedding Engine
EMBEDDING_ENGINE=openai
EMBEDDING_MODEL_PREF=text-embedding-3-small

# Nango Integration (Production)
NANGO_SECRET_KEY=prod_xxxxxxxxxxxx
NANGO_PUBLIC_KEY=prod_xxxxxxxxxxxx
NANGO_HOST=https://api.nango.dev
NANGO_WEBHOOK_URL=https://your-app.railway.app/api/webhooks/nango
NANGO_WEBHOOK_SECRET=webhook_secret_xxxx

# OAuth Providers (via Nango)
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxx
LINKEDIN_CLIENT_ID=xxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxx
SHOPIFY_CLIENT_ID=xxxxxxxxxxxx
SHOPIFY_CLIENT_SECRET=xxxxxxxxxxxx

# MCP Configuration
MCP_ENABLED=true
MCP_SERVERS_PATH=/app/storage/plugins/mcp_servers.json

# Background Jobs
ENABLE_BACKGROUND_JOBS=true
REDIS_URL=redis://default:password@redis.railway.internal:6379

# Security
DISABLE_TELEMETRY=false
AUTH_TOKEN=optional-global-password
PASSWORDLESS=false

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.vercel.app

# Logging
LOG_LEVEL=info
```

## 2. Nango Integration Setup

### Configure Nango for Production

1. **Create Nango Account & Production Environment**
   - Sign up at [app.nango.dev](https://app.nango.dev)
   - Create a "Production" environment
   - Get your production keys

2. **Configure OAuth Providers in Nango Dashboard**

For each provider (Gmail, LinkedIn, Shopify):
- Go to Integrations → Create Integration
- Configure OAuth flow with proper scopes
- Set redirect URL: `https://your-app.railway.app/api/oauth/callback`

3. **Gmail OAuth Scopes Required**
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.modify
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events
```

## 3. MCP (Model Context Protocol) Setup

### Deploy MCP Servers

MCPs run as separate services that can be connected to your main application:

1. **Create MCP Configuration** (`storage/plugins/mcp_servers.json`):
```json
{
  "mcpServers": {
    "gmail": {
      "command": "node",
      "args": ["/app/server/mcp-servers/gmail-mcp.js"],
      "env": {
        "NANGO_SECRET_KEY": "${NANGO_SECRET_KEY}",
        "NANGO_HOST": "${NANGO_HOST}"
      }
    },
    "calendar": {
      "command": "node",
      "args": ["/app/server/mcp-servers/calendar-mcp.js"],
      "env": {
        "NANGO_SECRET_KEY": "${NANGO_SECRET_KEY}",
        "NANGO_HOST": "${NANGO_HOST}"
      }
    },
    "shopify": {
      "command": "node",
      "args": ["/app/server/mcp-servers/shopify-mcp.js"],
      "env": {
        "NANGO_SECRET_KEY": "${NANGO_SECRET_KEY}",
        "NANGO_HOST": "${NANGO_HOST}"
      }
    }
  }
}
```

2. **Deploy MCP Servers as Railway Services**

Each MCP can run as a separate Railway service:

```yaml
# railway.yml for MCP service
services:
  - name: mcp-gmail
    buildCommand: cd server && npm install
    startCommand: node server/mcp-servers/gmail-mcp.js
    envVars:
      - NANGO_SECRET_KEY
      - NANGO_HOST
```

## 4. Vector Database Setup

### Option A: LanceDB (Default, Embedded)
- No additional setup needed
- Data stored in `STORAGE_DIR/lancedb`

### Option B: Pinecone (Recommended for Scale)
1. Create account at [pinecone.io](https://pinecone.io)
2. Create index with dimension 1536 (for OpenAI embeddings)
3. Add credentials to environment variables

### Option C: Weaviate Cloud
```env
VECTOR_DB=weaviate
WEAVIATE_ENDPOINT=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=xxxxxxxxxxxx
```

## 5. Cron Jobs & Background Tasks

### Using Railway Cron Jobs

1. **Create cron.yaml in project root**:
```yaml
jobs:
  - name: document-processor
    schedule: "*/5 * * * *"  # Every 5 minutes
    command: "cd server && node utils/jobs/processDocuments.js"
    
  - name: cleanup-old-sessions
    schedule: "0 0 * * *"  # Daily at midnight
    command: "cd server && node utils/jobs/cleanupSessions.js"
    
  - name: vector-index-optimization
    schedule: "0 3 * * 0"  # Weekly Sunday at 3 AM
    command: "cd server && node utils/jobs/optimizeVectorIndex.js"
```

2. **Alternative: Use Bree Scheduler (Built-in)**

The application includes Bree for job scheduling:
```javascript
// server/utils/jobs/scheduler.js
const Bree = require('bree');
const path = require('path');

const bree = new Bree({
  jobs: [
    {
      name: 'process-documents',
      interval: '5m',
      path: path.join(__dirname, 'processDocuments.js')
    },
    {
      name: 'cleanup-sessions',
      cron: '0 0 * * *',
      path: path.join(__dirname, 'cleanupSessions.js')
    }
  ]
});

if (process.env.ENABLE_BACKGROUND_JOBS === 'true') {
  bree.start();
}
```

## 6. Railway Deployment Commands

```bash
# Deploy all services
railway up

# Deploy with specific environment
railway up -e production

# View logs
railway logs

# Connect to database
railway connect postgres

# Run migrations
railway run --service=server npm run prisma:migrate

# Scale services
railway scale server --replicas 3
```

## 7. Production Checklist

### Security
- [ ] Strong JWT_SECRET (32+ chars)
- [ ] Strong SIG_KEY and SIG_SALT
- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

### Database
- [ ] PostgreSQL in production (not SQLite)
- [ ] Database backups configured
- [ ] Connection pooling enabled
- [ ] Migrations up to date

### Monitoring
- [ ] Error tracking (Sentry/Rollbar)
- [ ] APM monitoring (New Relic/DataDog)
- [ ] Logging aggregation (LogDNA/Papertrail)
- [ ] Uptime monitoring (Pingdom/UptimeRobot)

### Performance
- [ ] CDN for static assets
- [ ] Redis for caching/sessions
- [ ] Image optimization
- [ ] Code splitting enabled

### Integrations
- [ ] Nango webhooks verified
- [ ] OAuth redirect URLs updated
- [ ] MCP servers deployed
- [ ] Vector database indexed

## 8. Deployment Script

Create `deploy.sh`:
```bash
#!/bin/bash

# Build and deploy to Railway
echo "🚀 Starting deployment..."

# Run tests
npm test

# Build frontend
cd frontend && npm run build
cd ..

# Run migrations
cd server && npx prisma migrate deploy
cd ..

# Deploy to Railway
railway up -e production

# Verify deployment
curl https://your-app.railway.app/api/health

echo "✅ Deployment complete!"
```

## 9. Monitoring & Maintenance

### Health Check Endpoint
```javascript
// server/endpoints/api/system/health.js
app.get('/api/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: await checkDatabase(),
    vectorDb: await checkVectorDb(),
    nango: await checkNango(),
    redis: await checkRedis()
  };
  
  const allHealthy = Object.values(checks).every(v => v === 'ok');
  res.status(allHealthy ? 200 : 503).json(checks);
});
```

### Backup Strategy
```bash
# Daily database backup
0 2 * * * pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Weekly vector database export
0 3 * * 0 node scripts/exportVectorDb.js
```

## 10. Troubleshooting

### Common Issues

1. **Nango Connection Failed**
   - Verify API keys in environment
   - Check webhook URL is accessible
   - Ensure OAuth redirect URLs match

2. **Vector Database Timeout**
   - Check index exists and is healthy
   - Verify API keys and endpoint
   - Monitor embedding rate limits

3. **MCP Not Responding**
   - Check MCP server logs
   - Verify Nango integration active
   - Test with MCP debug mode

4. **High Memory Usage**
   - Implement connection pooling
   - Add Redis caching
   - Optimize vector queries

## Support Resources

- [Railway Documentation](https://docs.railway.app)
- [Nango Documentation](https://docs.nango.dev)
- [AnythingLLM Docs](https://docs.anythingllm.com)
- [MCP Protocol Spec](https://modelcontextprotocol.io)

## Next Steps

1. Set up monitoring and alerting
2. Configure auto-scaling rules
3. Implement blue-green deployments
4. Add comprehensive logging
5. Set up staging environment