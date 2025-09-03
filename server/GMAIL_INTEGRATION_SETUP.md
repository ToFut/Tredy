# Gmail Integration Setup Guide

Complete guide to set up Gmail integration with OAuth and sync capabilities.

## Prerequisites

1. **Nango Account**: Sign up at https://www.nango.dev
2. **Google Cloud Console**: Access to create Gmail API credentials
3. **AnythingLLM Server**: Running AnythingLLM instance

## Step 1: Google Cloud Console Setup

### 1.1 Create Project & Enable Gmail API
```bash
1. Go to Google Cloud Console (console.cloud.google.com)
2. Create new project or select existing one
3. Navigate to "APIs & Services" > "Library"
4. Search for "Gmail API" and click "Enable"
```

### 1.2 Create OAuth Credentials
```bash
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URI: https://api.nango.dev/oauth/callback
5. Save Client ID and Client Secret
```

### 1.3 Required OAuth Scopes
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send` 
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/userinfo.email`

## Step 2: Nango Configuration

### 2.1 Deploy Integration to Nango
```bash
# Copy integration files to your Nango project
cp -r nango-integrations/gmail/ /path/to/your/nango-integrations/

# Deploy to Nango
nango deploy

# Or use Nango Cloud dashboard to upload files
```

### 2.2 Configure Integration in Nango Dashboard
```bash
1. Login to Nango Dashboard
2. Go to "Integrations" > "Add Integration"
3. Select "Google" provider
4. Integration ID: "gmail-integration" 
5. Add your Google OAuth Client ID and Secret
6. Set scopes as listed above
7. Save configuration
```

## Step 3: AnythingLLM Setup

### 3.1 Environment Variables
Add to your `.env` file:
```bash
NANGO_SECRET_KEY=your-nango-secret-key
NANGO_HOST=https://api.nango.dev
NANGO_REDIRECT_URI=https://your-domain.com/auth/callback
```

### 3.2 Start Gmail MCP Server
```bash
# Make executable
chmod +x gmail-mcp-server.js

# Start server
node gmail-mcp-server.js

# Or run in background
nohup node gmail-mcp-server.js > gmail-mcp.log 2>&1 &
```

### 3.3 Register MCP Server in AnythingLLM
Add to your MCP configuration:
```json
{
  "name": "gmail-mcp",
  "command": "node",
  "args": ["/path/to/gmail-mcp-server.js"],
  "env": {
    "NANGO_SECRET_KEY": "your-nango-secret-key"
  }
}
```

## Step 4: User Workflow

### 4.1 Connect Gmail Account
```bash
User: "@agent connect Gmail"
Agent: [Shows OAuth URL and instructions]
User: [Clicks link, authorizes in browser]
Agent: "✅ Gmail connected successfully!"
```

### 4.2 Available Commands
```bash
# Send emails
"@agent send email to john@company.com about project update"

# Read emails  
"@agent check my unread emails"
"@agent show me emails from sarah@client.com"

# Search emails
"@agent find emails about 'invoice' from last week"

# Manage emails
"@agent mark recent emails as read"
"@agent delete spam emails"
```

## Step 5: Sync Configuration

### 5.1 Automatic Email Sync
The integration includes automatic sync every 15 minutes:
- Syncs inbox messages
- Extracts metadata (from, to, subject, date)
- Creates searchable content for vector search
- Stores in workspace vector database

### 5.2 Manual Sync Trigger
```bash
# Trigger manual sync
curl -X POST https://api.nango.dev/sync/trigger \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider_config_key": "gmail-integration",
    "sync_name": "gmail-emails", 
    "connection_id": "workspace_3"
  }'
```

## Step 6: Testing

### 6.1 Test OAuth Flow
```bash
1. User runs: "@agent connect Gmail"
2. Verify OAuth URL is generated
3. Complete OAuth flow in browser
4. Check Nango dashboard for successful connection
```

### 6.2 Test Email Functions
```bash
1. "@agent send test email to yourself@domain.com"
2. "@agent check recent emails" 
3. "@agent search for emails containing 'test'"
```

## Troubleshooting

### Common Issues

**OAuth Redirect Mismatch**
- Ensure redirect URI in Google Console matches Nango callback URL
- Check `NANGO_REDIRECT_URI` environment variable

**Insufficient Permissions**
- Verify all required scopes are added in Google Console
- Check OAuth consent screen configuration

**Nango Connection Failed**
- Verify `NANGO_SECRET_KEY` is correct
- Check integration ID matches dashboard configuration
- Ensure Gmail API is enabled in Google Console

### Logs & Debugging
```bash
# Check MCP server logs
tail -f gmail-mcp.log

# Check Nango logs in dashboard
# Navigate to "Connections" > Select connection > "Logs"

# Test connection health
curl "https://api.nango.dev/connection/workspace_3" \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Provider-Config-Key: gmail-integration"
```

## Production Considerations

1. **Rate Limiting**: Gmail API has quotas - implement proper rate limiting
2. **Error Handling**: Add retry logic for transient failures  
3. **Security**: Store sensitive data securely, use HTTPS
4. **Monitoring**: Set up alerts for sync failures
5. **Scaling**: Consider connection pooling for multiple users

## Support

- Nango Documentation: https://docs.nango.dev
- Gmail API Documentation: https://developers.google.com/gmail/api
- AnythingLLM Issues: https://github.com/Mintplex-Labs/anything-llm/issues