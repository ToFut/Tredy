# 🔧 Quick Fix for Connector Setup Issues

## 1. ✅ Fix Prisma Migration

```bash
# Already fixed! Now run:
cd server
npx prisma generate
npx prisma migrate dev --name add_connectors
```

## 2. ✅ Fix NPM Dependency

```bash
# Install with legacy peer deps
cd server
npm install @nangohq/node --legacy-peer-deps

# Or add to package.json manually:
# "dependencies": {
#   "@nangohq/node": "^0.40.0"
# }
```

## 3. ✅ Docker Alternative - Run Nango Without Docker

### Option A: Use Nango Cloud (FREE - Easiest!)
```bash
# No Docker needed! 
# 1. Sign up at https://www.nango.dev (free tier available)
# 2. Get your secret key from dashboard
# 3. Add to .env:

NANGO_SECRET_KEY=your-nango-cloud-key
NANGO_HOST=https://api.nango.dev
```

### Option B: Run Nango Locally with Node
```bash
# Clone and run Nango without Docker
git clone https://github.com/NangoHQ/nango.git /tmp/nango
cd /tmp/nango
npm install
npm run start:dev

# Nango will be available at http://localhost:3003
```

### Option C: Use Direct API Keys (No OAuth)
```bash
# Skip Nango entirely! Just use API keys
# Don't set NANGO_SECRET_KEY in .env
# The system will prompt for API keys instead of OAuth
```

## 4. 🚀 Simplified Setup (Without Docker)

### Step 1: Install Dependencies
```bash
cd server
npm install @nangohq/node --legacy-peer-deps
```

### Step 2: Run Migration
```bash
npx prisma generate
npx prisma migrate dev --name add_connectors
```

### Step 3: Choose Auth Method

#### Option A: Nango Cloud (Recommended)
```bash
# Add to server/.env
NANGO_SECRET_KEY=prod_abc123...  # From https://app.nango.dev
NANGO_HOST=https://api.nango.dev
```

#### Option B: Direct API Keys
```bash
# Don't add NANGO variables to .env
# System will use direct API key mode
```

### Step 4: Start AnythingLLM
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

### Step 5: Test Connection
1. Go to http://localhost:3000
2. Open any workspace
3. Settings → Connectors
4. Try connecting with API key first

## 5. 📝 Test with API Keys (No OAuth Needed)

### Shopify Test
```javascript
// When prompted for credentials, use:
{
  "shop": "your-store.myshopify.com",
  "accessToken": "shppa_xxxxx"  // From Shopify Admin
}
```

### OpenAI Test (Simple)
```javascript
{
  "apiKey": "sk-xxxxx"  // Your OpenAI API key
}
```

## 6. 🎯 Minimal Test Setup

Just to verify everything works:

### 1. Add a Simple Test Provider
Edit `server/utils/connectors/mcp-nango-bridge.js`:

```javascript
// Add to getAvailableProviders():
{
  id: "test",
  name: "Test Provider",
  description: "Test connection",
  category: "other",
  authType: "apikey",
  logo: "/icons/test.svg",
}

// Add to getMCPConfig():
test: {
  command: "echo",
  args: ["Test MCP Server"],
  env: {}
}
```

### 2. Connect via UI
- Go to Connectors tab
- Click "Test Provider"
- Enter any dummy API key
- Should show as connected!

## 7. 🐛 Troubleshooting

### If Prisma Migration Fails
```bash
# Reset database and try again
cd server
rm -f ../storage/anythingllm.db
npx prisma migrate dev --name init
npx prisma migrate dev --name add_connectors
```

### If NPM Install Fails
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm install @nangohq/node --legacy-peer-deps
```

### If Frontend Can't Find Connectors Tab
```bash
# Make sure you're on the latest code
cd frontend
npm run build
npm run dev
```

## 8. ✅ Success Checklist

- [ ] Prisma migration successful
- [ ] @nangohq/node installed
- [ ] Server starts without errors
- [ ] Connectors tab visible in UI
- [ ] Can see available providers
- [ ] Can connect with API key

## 9. 🚀 Next Steps

Once basic setup works:

1. **Setup Nango Cloud** for OAuth (free tier)
2. **Install MCP servers** for real providers
3. **Configure real API credentials**
4. **Test with agent queries**

---

## Need Help?

The simplest path:
1. Use Nango Cloud (no Docker needed)
2. Use API keys instead of OAuth
3. Start with one simple provider (like OpenAI)

Everything else can be added incrementally!