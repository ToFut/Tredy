# Complete MCP Integration Guide
The definitive guide for adding new service integrations to AnythingLLM

## Overview
Every integration requires THREE components:
1. **OAuth Setup** in Nango (Authentication)
2. **MCP Server** (Tool Interface)  
3. **Registration** in AnythingLLM (Connection)

## Step-by-Step Integration Process

### Step 1: OAuth Configuration in Nango Dashboard ⚡ CRITICAL

#### Option A: Add to Existing OAuth Provider (Recommended if same provider)
```javascript
// Example: Adding Gmail to existing Google OAuth
1. Go to Nango Dashboard → Integrations
2. Find existing integration (e.g., "google-calendar-getting-started")
3. Click Edit → OAuth Scopes
4. ADD new scopes:
   - Gmail: 'https://www.googleapis.com/auth/gmail.send'
   - Slack: 'channels:read channels:write chat:write'
   - GitHub: 'repo user notifications'
5. Save changes
6. Re-authorize connection to get new permissions
```

#### Option B: Create New Integration
```javascript
1. Nango Dashboard → Create Integration
2. Choose Provider (Google, Slack, GitHub, etc.)
3. Set Integration ID: 'service-integration'
4. Add OAuth credentials from provider console
5. Configure scopes for needed permissions
6. Save and get connection ready
```

### Step 2: Create MCP Server Using Template

```bash
# Copy template
cp MCP_STANDARD_TEMPLATE.js simple-[service]-mcp.js

# Edit and replace:
# - [SERVICE_NAME] → gmail/slack/github
# - [RESOURCE] → email/message/issue
# - providerConfigKey → match Nango integration ID
```

#### Example for New Service:
```javascript
// simple-slack-mcp.js
class SimpleSlackMCP {
  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }
    // ... rest following template
  }

  async sendMessage(args) {
    const response = await nango.post({
      endpoint: '/chat.postMessage',
      connectionId: process.env.NANGO_CONNECTION_ID || 'workspace_3',
      providerConfigKey: 'slack-integration', // Must match Nango!
      data: {
        channel: args.channel,
        text: args.message
      }
    });
  }
}
```

### Step 3: Register MCP Server

```json
// ~/.anythingllm/plugins/anythingllm_mcp_servers.json
{
  "mcpServers": {
    "simple-gmail": {
      "command": "node",
      "args": ["/path/to/simple-gmail-mcp.js"],
      "env": {
        "NANGO_SECRET_KEY": "your-key",
        "NANGO_CONNECTION_ID": "workspace_3"
      }
    }
  }
}
```

### Step 4: Test OAuth Flow

```bash
# 1. Restart AnythingLLM
yarn dev:server

# 2. Test connection
@agent check [service] connection

# 3. If not connected, authorize
@agent connect [service]
# → Should show OAuth URL if properly configured

# 4. Complete OAuth in browser
# → Authorize all requested permissions

# 5. Test functionality
@agent [use service function]
```

## Integration Checklist

### For Gmail Integration
- [ ] **OAuth Setup**
  - [ ] Add Gmail scopes to Google OAuth in Nango
  - [ ] Scopes include: gmail.send, gmail.readonly, gmail.modify
  - [ ] Re-authorize to get new permissions
- [ ] **MCP Server**
  - [ ] Create simple-gmail-mcp.js from template
  - [ ] Use correct providerConfigKey
  - [ ] Only 2 tools: send_email, check_emails
- [ ] **Registration**
  - [ ] Add to anythingllm_mcp_servers.json
  - [ ] Include NANGO_SECRET_KEY in env
  - [ ] Restart AnythingLLM
- [ ] **Testing**
  - [ ] OAuth flow completes
  - [ ] Can send test email
  - [ ] Can check inbox

### For Slack Integration
- [ ] **OAuth Setup**
  - [ ] Create Slack App at api.slack.com
  - [ ] Add to Nango with OAuth credentials
  - [ ] Scopes: channels:read, chat:write, users:read
- [ ] **MCP Server**
  - [ ] Create simple-slack-mcp.js
  - [ ] Tools: send_message, list_channels
- [ ] **Registration & Test**
  - [ ] Add to config, restart, test

### For GitHub Integration
- [ ] **OAuth Setup**
  - [ ] Create GitHub OAuth App
  - [ ] Add to Nango with credentials
  - [ ] Scopes: repo, user, notifications
- [ ] **MCP Server**
  - [ ] Create simple-github-mcp.js
  - [ ] Tools: create_issue, list_repos
- [ ] **Registration & Test**
  - [ ] Add to config, restart, test

## Common Issues & Solutions

### "No function available"
**Cause**: MCP not registered or not loaded
**Fix**: Check registration, restart AnythingLLM

### "401 Unauthorized" 
**Cause**: OAuth not connected or expired
**Fix**: Re-authorize through Nango, check scopes

### "403 Forbidden"
**Cause**: Missing OAuth scopes
**Fix**: Add required scopes in Nango, re-authorize

### "Bad Request"
**Cause**: Wrong API endpoint or parameters
**Fix**: Check API docs, verify endpoint format

### Tools not showing
**Cause**: MCP server not starting
**Fix**: Check logs, verify file permissions

## Quick Setup Script

```bash
#!/bin/bash
# setup-mcp-integration.sh

SERVICE=$1
SCOPES=$2

echo "Setting up $SERVICE integration..."

# 1. Create MCP from template
cp MCP_STANDARD_TEMPLATE.js simple-$SERVICE-mcp.js
sed -i "s/\[SERVICE_NAME\]/$SERVICE/g" simple-$SERVICE-mcp.js

# 2. Add to MCP config
jq ".mcpServers[\"simple-$SERVICE\"] = {
  \"command\": \"node\",
  \"args\": [\"$(pwd)/simple-$SERVICE-mcp.js\"],
  \"env\": {
    \"NANGO_SECRET_KEY\": \"$NANGO_SECRET_KEY\"
  }
}" ~/.anythingllm/plugins/anythingllm_mcp_servers.json > tmp.json
mv tmp.json ~/.anythingllm/plugins/anythingllm_mcp_servers.json

echo "✅ MCP created and registered"
echo "⚠️  Don't forget to:"
echo "   1. Add OAuth scopes in Nango: $SCOPES"
echo "   2. Re-authorize the connection"
echo "   3. Restart AnythingLLM"
```

## Success Criteria

A properly integrated service will:
1. ✅ Show tools when typing `@agent`
2. ✅ Handle auth errors gracefully
3. ✅ Complete operations successfully
4. ✅ Provide clear feedback to user
5. ✅ Work with minimal parameters

## Key Principles

1. **OAuth First**: No MCP works without proper OAuth
2. **Keep It Simple**: 2-4 tools maximum per service
3. **Smart Defaults**: Everything should have defaults
4. **Clear Errors**: Users should know what went wrong
5. **Test Everything**: OAuth, tools, error cases

## Provider-Specific Notes

### Google Services (Gmail, Calendar, Drive)
- Can share same OAuth connection
- Use same providerConfigKey for all
- Just add scopes for each service

### Slack
- Requires workspace installation
- Bot tokens vs User tokens matter
- Channel IDs not channel names

### GitHub
- Personal tokens vs OAuth Apps
- Rate limits are strict
- Scope requirements vary by endpoint

## Final Reminders

⚠️ **CRITICAL**: Every new service needs OAuth setup in Nango FIRST
⚠️ **IMPORTANT**: MCP servers are just interfaces - they need valid tokens
⚠️ **REMEMBER**: Test OAuth flow before building complex features
⚠️ **NOTE**: Restart AnythingLLM after any configuration change

---

With this guide, adding any new integration should take < 30 minutes!