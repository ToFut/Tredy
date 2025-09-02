# 🚀 Data Connectors Setup Guide

## Quick Start (5 Minutes)

### 1. Run Database Migration
```bash
cd server
npx prisma migrate dev
```

### 2. Install Dependencies
```bash
# Install Nango SDK (for OAuth)
npm install @nangohq/node

# Optional: Install MCP servers globally
npm install -g @shopify/mcp-server
npm install -g google-workspace-mcp
npm install -g @modelcontextprotocol/server-github
```

### 3. Setup Nango (for OAuth)

#### Option A: Self-hosted (Recommended)
```bash
# Run Nango locally
docker run -d -p 3003:3003 --name nango nangohq/nango

# Open Nango dashboard
open http://localhost:3003
```

#### Option B: Nango Cloud
1. Sign up at https://www.nango.dev
2. Get your secret key from dashboard
3. Add to .env file

### 4. Configure Environment
```bash
# Copy connector environment template
cp .env.connector.example .env.connector

# Edit and add your keys
nano .env.connector

# Key variables to set:
NANGO_SECRET_KEY=your-key-here
NANGO_HOST=http://localhost:3003  # or https://api.nango.dev for cloud
```

### 5. Configure OAuth Providers in Nango

Open Nango dashboard (http://localhost:3003) and add providers:

#### Shopify
```yaml
Provider: shopify
Client ID: Your Shopify App Client ID
Client Secret: Your Shopify App Client Secret
Scopes: read_products,read_orders,read_customers
```

#### Google
```yaml
Provider: google
Client ID: Your Google OAuth Client ID  
Client Secret: Your Google OAuth Client Secret
Scopes: calendar,gmail.readonly,drive.readonly
```

#### GitHub
```yaml
Provider: github
Client ID: Your GitHub OAuth App Client ID
Client Secret: Your GitHub OAuth App Client Secret
Scopes: repo,read:org
```

### 6. Start AnythingLLM
```bash
# Start backend
cd server && npm run dev

# Start frontend (new terminal)
cd frontend && npm run dev
```

### 7. Connect Your First Service

1. Go to any workspace
2. Click Settings → Connectors tab
3. Click on any provider (e.g., Shopify)
4. Complete OAuth flow
5. Service is now connected!

---

## Testing Without OAuth (API Keys)

If you don't want to setup OAuth, you can use direct API keys:

### 1. Don't install Nango
Skip the Nango setup steps

### 2. Use Direct Credentials
When connecting a service, you'll be prompted for API keys instead of OAuth

### 3. Example API Keys

#### Shopify
1. Create private app in Shopify admin
2. Get access token
3. Enter when prompted

#### Stripe
1. Get secret key from Stripe dashboard
2. Enter when prompted

---

## How It Works

### Architecture
```
User clicks "Connect" in UI
    ↓
Creates OAuth URL via Nango
    ↓
User authorizes on provider site
    ↓
Nango stores tokens (encrypted)
    ↓
MCP-Nango Bridge gets tokens
    ↓
MCP Server starts with credentials
    ↓
Agent can now use provider tools!
```

### Available Tools (Examples)

Once connected, agents automatically get tools like:

**Shopify:**
- `shopify_ws1-list-products` - List products
- `shopify_ws1-get-order` - Get order details
- `shopify_ws1-update-inventory` - Update stock

**Google:**
- `google_ws1-create-event` - Create calendar event
- `google_ws1-search-email` - Search Gmail
- `google_ws1-list-files` - List Drive files

**GitHub:**
- `github_ws1-list-repos` - List repositories
- `github_ws1-create-issue` - Create issue
- `github_ws1-get-pr` - Get pull request

---

## Troubleshooting

### Nango Connection Issues
```bash
# Check if Nango is running
docker ps | grep nango

# View Nango logs
docker logs nango

# Restart Nango
docker restart nango
```

### MCP Server Not Found
```bash
# Install MCP servers globally
npm install -g @shopify/mcp-server
npm install -g google-workspace-mcp

# Or use npx (slower but no install needed)
# The system will use npx automatically
```

### OAuth Redirect Issues
Make sure your redirect URLs are configured:
- Nango: `http://localhost:3003/oauth/callback`
- AnythingLLM: `http://localhost:3001/api/workspace/connectors/callback`

### Database Migration Issues
```bash
# Reset and recreate
cd server
npx prisma migrate reset
npx prisma migrate dev
```

---

## Adding New Providers

### 1. Add to Nango Dashboard
Configure OAuth for the new provider in Nango

### 2. Add MCP Config
Edit `server/utils/connectors/mcp-nango-bridge.js`:
```javascript
newprovider: {
  command: "npx",
  args: ["-y", "newprovider-mcp-server"],
  env: {
    TOKEN: credentials.access_token,
  },
}
```

### 3. Add to UI
Edit `server/utils/connectors/mcp-nango-bridge.js`:
```javascript
{
  id: "newprovider",
  name: "New Provider",
  category: "category",
  // ...
}
```

---

## Production Deployment

### 1. Use Nango Cloud
Instead of self-hosted, use Nango's cloud service for reliability

### 2. Environment Variables
```bash
NODE_ENV=production
NANGO_SECRET_KEY=prod-key
NANGO_HOST=https://api.nango.dev
```

### 3. Security
- Always use HTTPS in production
- Rotate Nango secret keys regularly
- Monitor OAuth token usage

---

## Support

- **Nango Docs**: https://docs.nango.dev
- **MCP Docs**: https://modelcontextprotocol.io
- **AnythingLLM Discord**: https://discord.gg/anythingllm