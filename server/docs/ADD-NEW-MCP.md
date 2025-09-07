# How to Add a New MCP Server to AnythingLLM

## Quick Steps:

### 1. Choose Your MCP Type

#### Option A: NPM Package (easiest)
```json
// Add to mcp-registry-enhanced.json
"your-service": {
  "type": "npm",
  "package": "your-mcp-package",
  "command": "npx",
  "args": ["-y", "your-mcp-package"],
  "auth": "none",  // or "api_key:YOUR_API_KEY"
  "description": "Your service description"
}
```

#### Option B: GitHub Repository
```json
"your-service": {
  "type": "github",
  "repository": "username/repo-name",
  "auth": "token:GITHUB_TOKEN",
  "description": "Your service description"
}
```

#### Option C: Custom Script
```json
"your-service": {
  "type": "custom",
  "command": "node",
  "args": ["/path/to/your/script.js"],
  "auth": "nango:oauth-provider",
  "description": "Your service description"
}
```

### 2. Set Up Authentication

#### For OAuth (via Nango):
1. Add provider to Nango dashboard
2. Use `"auth": "nango:provider-name"`
3. Connect via UI: Settings → Connectors → Your Service

#### For API Keys:
1. Set environment variable: `export YOUR_API_KEY=xxx`
2. Use `"auth": "api_key:YOUR_API_KEY"`

#### For Tokens:
1. Set environment variable: `export YOUR_TOKEN=xxx`
2. Use `"auth": "token:YOUR_TOKEN"`

### 3. Update Configuration
```bash
# Update the MCP servers config
node enhanced-mcp-loader.js update

# Or with workspace ID for workspace-specific
node enhanced-mcp-loader.js update 13
```

### 4. Test Your MCP Server
```bash
# Test if it works
node enhanced-mcp-loader.js test your-service

# Test with workspace auth
node enhanced-mcp-loader.js test your-service 13
```

### 5. Restart AnythingLLM Server
The MCP servers will auto-start when an agent is invoked.

## Real Examples:

### Adding Notion (when npm package exists):
```json
"notion": {
  "type": "npm",
  "package": "@modelcontextprotocol/server-notion",
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-notion"],
  "auth": "api_key:NOTION_API_KEY",
  "description": "Notion pages and databases"
}
```

### Adding from GitHub:
```json
"browser-automation": {
  "type": "github",
  "repository": "browsermcp/mcp",
  "auth": "none",
  "description": "Browser automation"
}
```

### Adding Custom OAuth Service:
```json
"salesforce": {
  "type": "custom",
  "command": "node",
  "args": ["/Users/you/anything-llm/server/salesforce-mcp.js"],
  "auth": "nango:salesforce",
  "description": "Salesforce CRM"
}
```

## Authentication Types:

- `"none"` - No auth required
- `"nango:provider"` - OAuth via Nango
- `"api_key:ENV_VAR"` - API key from environment
- `"token:ENV_VAR"` - Token from environment
- `"qr_code"` - QR code auth (WhatsApp)
- `"connection_string"` - Database connection
- `"local"` - Local system access

## Troubleshooting:

1. **Package not found**: Check if npm package actually exists
   ```bash
   npm view @your/package version
   ```

2. **Auth failing**: Check environment variables
   ```bash
   echo $YOUR_API_KEY
   ```

3. **MCP not starting**: Test manually
   ```bash
   node enhanced-mcp-loader.js test your-service
   ```

4. **Not showing in agent**: Restart server and check logs
   ```bash
   # Check if MCP is in config
   cat storage/plugins/anythingllm_mcp_servers.json | grep your-service
   ```

## Need OAuth?

For services requiring OAuth:
1. Set up provider in Nango dashboard
2. Use our bridge: `mcp-nango-bridge.js`
3. Connect via UI: Settings → Connectors
4. MCP auto-receives tokens from Nango

## Common Services to Add:

- Slack: `@modelcontextprotocol/server-slack` (npm)
- Discord: `discord-mcp` (npm)
- Telegram: `telegram-mcp` (npm)
- PostgreSQL: `@modelcontextprotocol/server-postgres` (npm)
- GitHub: `github/github-mcp-server` (GitHub repo)
- Custom APIs: Create your own MCP wrapper