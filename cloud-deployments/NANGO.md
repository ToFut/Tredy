⏺ 📝 Simple Steps to Add ANY New Provider

  Now with this modular system, here's how easy it is to add any new provider:

  Step 1: Nango Dashboard (2 minutes)

  1. Go to https://app.nango.dev/integrations
  2. Click "Add Integration" → Choose provider (e.g., Notion, Linear, Discord)
  3. Set OAuth scopes
  4. Save the provider-config-key (e.g., notion-database-access)

  Step 2: Add to Available Providers (30 seconds)

  Add one entry to /server/utils/connectors/mcp-nango-bridge.js:
  {
    id: "notion",  // Must match Nango provider name
    name: "Notion",
    description: "Workspace and notes",
    category: "productivity",
    authType: "oauth",
    logo: "/icons/notion.svg"
  }