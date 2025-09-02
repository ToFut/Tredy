# 🚀 Nango Connector Setup for AnythingLLM

## Overview
We've fully implemented a data connector system that allows users to connect external services (Shopify, Google Calendar, GitHub, etc.) to AnythingLLM. The system uses:
- **Nango** for OAuth management (250+ providers)
- **MCP** for tool integration
- **Agent Plugins** for querying connected services

## ✅ What's Been Implemented

### 1. Database Schema
- Added `connector_tokens` table to store OAuth connections
- Proper relations with workspaces

### 2. Backend Integration
- `/server/utils/connectors/nango-integration.js` - Full Nango API implementation
- `/server/utils/connectors/mcp-nango-bridge.js` - Bridge between Nango and MCP
- `/server/endpoints/api/webhooks/nango.js` - Webhook handler for real-time updates
- `/server/models/connectorTokens.js` - Database model

### 3. Agent Capabilities
- `/server/utils/agents/aibitat/plugins/nango-connector.js` - Agent plugin with functions:
  - List connected services
  - Query Google Calendar (list/create events)
  - Query Shopify (products/orders/customers)
  - GitHub operations (repos/issues)
  - Generic API requests through Nango proxy

### 4. API Endpoints
- `GET /api/workspace/:slug/connectors` - List connections
- `POST /api/workspace/:slug/connectors/connect` - Start OAuth flow
- `POST /api/workspace/:slug/connectors/callback` - Complete OAuth
- `DELETE /api/workspace/:slug/connectors/:provider` - Disconnect
- `POST /api/workspace/:slug/connectors/:provider/sync` - Trigger sync
- `POST /api/webhooks/nango` - Webhook receiver

## 🔧 Setup Instructions

### Step 1: Install Dependencies
```bash
cd server
npm install @nangohq/node --legacy-peer-deps
```

### Step 2: Run Database Migration
```bash
cd server
npx prisma generate
npx prisma migrate dev --name add_connectors
```

### Step 3: Configure Nango

#### Option A: Use Nango Cloud (Recommended - FREE)
1. Sign up at https://app.nango.dev (free tier available)
2. Get your keys from the dashboard
3. Add to `.env`:
```bash
NANGO_SECRET_KEY=your-secret-key
NANGO_PUBLIC_KEY=your-public-key
NANGO_HOST=https://api.nango.dev
```

#### Option B: Run Nango Locally
```bash
docker run -p 3003:3003 nangohq/nango
# Then use NANGO_HOST=http://localhost:3003
```

### Step 4: Configure OAuth Providers in Nango

1. Go to https://app.nango.dev/integrations
2. Add providers you want to use:
   - **Google Calendar**: 
     - Provider: `google-calendar`
     - Scopes: `https://www.googleapis.com/auth/calendar`
   - **Shopify**:
     - Provider: `shopify`
     - Scopes: `read_products,read_orders,read_customers`
   - **GitHub**:
     - Provider: `github`
     - Scopes: `repo,user`

3. For each provider, add OAuth credentials from their developer consoles

### Step 5: Configure Webhook (Production)
In Nango dashboard, set webhook URL to:
```
https://your-domain.com/api/webhooks/nango
```

### Step 6: Start AnythingLLM
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd frontend && npm run dev
```

## 🎯 Testing the Integration

### 1. Connect a Service
1. Open any workspace
2. Go to Settings → Connectors (new tab!)
3. Click on a provider (e.g., Google Calendar)
4. Complete OAuth flow
5. Service should show as "Connected"

### 2. Test with Agent
In the workspace chat:
```
"List my connected services"
"Show my upcoming Google Calendar events"
"List my Shopify products"
"Create a GitHub issue in owner/repo"
```

### 3. Test API Directly
```bash
# List available providers
curl http://localhost:3001/api/workspace/your-slug/connectors/available

# List connections
curl http://localhost:3001/api/workspace/your-slug/connectors
```

## 📝 How It Works

### OAuth Flow
1. User clicks "Connect" in UI
2. Frontend receives Nango auth config
3. Frontend uses Nango.auth() to open OAuth popup
4. User completes OAuth with provider
5. Nango stores tokens and calls our webhook
6. We update database and configure MCP servers

### Agent Queries
1. User asks about connected data
2. Agent uses nango-connector plugin
3. Plugin makes authenticated API calls via Nango proxy
4. Nango handles token refresh automatically
5. Data returned to user

### Background Syncs
1. Nango runs syncs in background (if configured)
2. Webhooks notify us of new data
3. We can store synced data in vector DB for RAG

## 🚨 Troubleshooting

### "Nango not configured"
- Check that `NANGO_SECRET_KEY` is set in `.env`
- Verify Nango is reachable at the configured host

### "Provider not found"
- Ensure provider is configured in Nango dashboard
- Provider key must match exactly (e.g., `google-calendar`)

### OAuth popup blocked
- Allow popups from localhost:3000
- Check browser console for errors

### Connection not working
- Verify OAuth credentials in provider's developer console
- Check redirect URL matches Nango configuration
- Look at server logs for detailed errors

## 🎉 What You Can Now Do

Users can:
- ✅ Connect any of 250+ services via OAuth
- ✅ Ask agents to query their connected data
- ✅ Get real-time updates via webhooks
- ✅ Run automated syncs in background
- ✅ Use connected services as MCP tools

Examples:
- "What meetings do I have tomorrow?"
- "Show me this month's Shopify revenue"
- "Create a GitHub issue for the bug we discussed"
- "List my recent Stripe transactions"
- "Post this update to Slack"

## 🔮 Next Steps

1. **Add More Providers**: Configure additional services in Nango
2. **Create Sync Scripts**: Define what data to sync and how often
3. **Build Custom Actions**: Add more agent functions for specific use cases
4. **Vector Storage**: Store synced data in vector DB for semantic search
5. **Automation Rules**: Trigger actions based on data changes

## 📚 Resources

- Nango Docs: https://docs.nango.dev
- MCP Protocol: https://modelcontextprotocol.io
- AnythingLLM Agent Docs: https://docs.anythingllm.com/agent