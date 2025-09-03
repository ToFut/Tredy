# MCP Server Registration Guide

**IMPORTANT**: Every MCP server must be registered in AnythingLLM's configuration to be accessible by agents.

## Registration Methods

### Method 1: Via MCP Configuration File (Recommended)

1. **Find your MCP configuration file**:
   ```bash
   # Usually located at:
   ~/.anythingllm/mcp/servers.json
   # or
   /Users/[username]/.anythingllm/mcp/servers.json
   ```

2. **Add your MCP server to the configuration**:
   ```json
   {
     "servers": {
       "gmail-mcp": {
         "command": "node",
         "args": ["/Users/segevbin/anything-llm/server/gmail-mcp-server.js"],
         "env": {
           "NANGO_SECRET_KEY": "7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91",
           "NANGO_HOST": "https://api.nango.dev",
           "NANGO_CONNECTION_ID": "workspace_3"
         }
       },
       "slack-mcp": {
         "command": "node",
         "args": ["/Users/segevbin/anything-llm/server/slack-mcp-server.js"],
         "env": {
           "NANGO_SECRET_KEY": "7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91"
         }
       },
       "github-mcp": {
         "command": "node", 
         "args": ["/Users/segevbin/anything-llm/server/github-mcp-server.js"],
         "env": {
           "NANGO_SECRET_KEY": "7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91"
         }
       }
     }
   }
   ```

3. **Restart AnythingLLM server**:
   ```bash
   # Stop current server (Ctrl+C or kill process)
   # Then restart:
   cd /Users/segevbin/anything-llm/server
   yarn dev:server
   ```

### Method 2: Via Admin UI (If Available)

1. Go to AnythingLLM Admin Panel
2. Navigate to **Settings** → **Agent Configuration** → **MCP Servers**
3. Click **"Add MCP Server"**
4. Fill in:
   - **Name**: `gmail-mcp`
   - **Command**: `node`
   - **Args**: `/path/to/gmail-mcp-server.js`
   - **Environment Variables**: Add NANGO keys
5. Click **Save** and **Restart**

### Method 3: Via Database (Direct)

```sql
-- Add to MCP configuration in database
INSERT INTO system_settings (label, value) VALUES 
('mcp_servers', JSON_OBJECT(
  'gmail-mcp', JSON_OBJECT(
    'command', 'node',
    'args', JSON_ARRAY('/path/to/gmail-mcp-server.js'),
    'env', JSON_OBJECT('NANGO_SECRET_KEY', 'your-key')
  )
));
```

### Method 4: Via Environment Variable

Add to `.env` file:
```bash
MCP_SERVERS='{"gmail-mcp":{"command":"node","args":["/path/to/gmail-mcp-server.js"]}}'
```

## Verification Steps

After registration, verify the MCP server is available:

1. **Check MCP server status**:
   ```bash
   # In AnythingLLM chat:
   @agent list available tools
   
   # Should show:
   # - gmail-mcp:send_email
   # - gmail-mcp:get_emails
   # - gmail-mcp:connect_gmail
   # etc.
   ```

2. **Check server logs**:
   ```bash
   # Check if MCP server started
   ps aux | grep gmail-mcp
   
   # Check logs
   tail -f ~/.anythingllm/logs/mcp.log
   ```

3. **Test functionality**:
   ```bash
   @agent test gmail connection
   @agent send test email to myself@domain.com
   ```

## Common Issues & Solutions

### Issue: "No function available to send emails"
**Solution**: MCP server not registered. Follow registration steps above.

### Issue: MCP server not starting
**Solution**: Check file permissions and paths:
```bash
chmod +x /path/to/gmail-mcp-server.js
ls -la /path/to/gmail-mcp-server.js
```

### Issue: Tools not showing after registration
**Solution**: Restart AnythingLLM server completely:
```bash
# Kill all node processes
pkill -f "node.*anything-llm"
# Restart
yarn dev:server
```

### Issue: Permission denied
**Solution**: Ensure MCP server has execution permissions:
```bash
chmod 755 gmail-mcp-server.js
```

## Registration Template for New MCP Servers

When creating any new MCP server, use this template:

```json
{
  "service-name-mcp": {
    "command": "node",
    "args": ["/absolute/path/to/service-mcp-server.js"],
    "env": {
      "NANGO_SECRET_KEY": "${NANGO_SECRET_KEY}",
      "NANGO_HOST": "https://api.nango.dev",
      "NANGO_CONNECTION_ID": "workspace_${WORKSPACE_ID}",
      "CUSTOM_ENV_VAR": "value"
    }
  }
}
```

## Quick Registration Script

Create a script to auto-register MCP servers:

```bash
#!/bin/bash
# register-mcp.sh

MCP_CONFIG="$HOME/.anythingllm/mcp/servers.json"
SERVER_NAME=$1
SERVER_PATH=$2

# Add to config
jq --arg name "$SERVER_NAME" --arg path "$SERVER_PATH" \
  '.servers[$name] = {"command": "node", "args": [$path]}' \
  "$MCP_CONFIG" > tmp.json && mv tmp.json "$MCP_CONFIG"

echo "✅ Registered $SERVER_NAME"
echo "⚠️  Restart AnythingLLM to load new MCP server"
```

Usage:
```bash
./register-mcp.sh gmail-mcp /path/to/gmail-mcp-server.js
```

## Important Notes

1. **Always use absolute paths** for the server file location
2. **Environment variables** in the config override system environment
3. **Server names** must be unique and lowercase with hyphens
4. **Restart is required** after any configuration change
5. **Check logs** if tools don't appear after registration

## MCP Server Lifecycle

1. **Registration** → Added to configuration
2. **Startup** → AnythingLLM starts MCP server process
3. **Discovery** → Agent discovers available tools
4. **Usage** → Tools available in chat via @agent
5. **Shutdown** → Cleaned up when AnythingLLM stops