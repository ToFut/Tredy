const { ConnectorTokens } = require("../../models/connectorTokens");
const { NangoIntegration } = require("./nango-integration");

/**
 * MCP-Nango Bridge
 * Dynamically creates MCP server configurations with OAuth tokens from Nango
 * This integrates with the existing MCPHypervisor system
 */
class MCPNangoBridge {
  constructor() {
    this.nango = new NangoIntegration();
  }

  /**
   * Generate OAuth config for frontend
   */
  async generateAuthUrl(provider, workspaceId) {
    // Use NangoIntegration's getAuthConfig for frontend embed
    const authConfig = await this.nango.getAuthConfig(provider, workspaceId);
    return authConfig;
  }

  /**
   * Get MCP server config with fresh tokens from Nango
   */
  async getMCPConfig(provider, workspaceId) {
    const connector = await ConnectorTokens.get({ workspaceId, provider });
    
    if (!connector || !connector.nangoConnectionId) {
      return null;
    }

    // Get connection details from Nango
    const connection = await this.nango.getConnection(provider, workspaceId);
    if (!connection) {
      return null;
    }
    
    const credentials = connection.credentials || {};

    // Return MCP server config based on provider
    const configs = {
      shopify: {
        command: "npx",
        args: ["-y", "@shopify/mcp-server"],
        env: {
          SHOPIFY_STORE_URL: connector.metadata?.shop || credentials.shop,
          SHOPIFY_ACCESS_TOKEN: credentials.access_token,
        },
      },
      google: {
        command: "npx",
        args: ["-y", "google-workspace-mcp"],
        env: {
          GOOGLE_ACCESS_TOKEN: credentials.access_token,
          GOOGLE_REFRESH_TOKEN: credentials.refresh_token,
        },
      },
      stripe: {
        // Stripe MCP server uses HTTP endpoint
        url: "https://mcp.stripe.com",
        headers: {
          Authorization: `Bearer ${credentials.access_token || credentials.secret_key}`,
        },
      },
      github: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        env: {
          GITHUB_PERSONAL_ACCESS_TOKEN: credentials.access_token,
        },
      },
      slack: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-slack"],
        env: {
          SLACK_BOT_TOKEN: credentials.access_token,
        },
      },
    };

    return configs[provider] || null;
  }

  /**
   * Update MCP servers configuration for a workspace
   * This integrates with the existing MCP system
   */
  async updateMCPServersForWorkspace(workspaceId) {
    const connectors = await ConnectorTokens.forWorkspace(workspaceId);
    const mcpConfigs = {};

    for (const connector of connectors) {
      if (connector.status !== "connected") continue;

      const config = await this.getMCPConfig(connector.provider, workspaceId);
      if (config) {
        // Use workspace-provider as the MCP server name
        mcpConfigs[`${connector.provider}_ws${workspaceId}`] = config;
      }
    }

    // Write to MCP servers config file (used by existing MCPHypervisor)
    const fs = require("fs");
    const path = require("path");
    const configPath =
      process.env.NODE_ENV === "development"
        ? path.resolve(__dirname, "../../storage/plugins/anythingllm_mcp_servers.json")
        : path.resolve(process.env.STORAGE_DIR, "plugins/anythingllm_mcp_servers.json");

    let existingConfig = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
      existingConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    }

    // Merge workspace configs
    Object.keys(existingConfig.mcpServers).forEach((key) => {
      // Remove old workspace configs
      if (!key.includes(`_ws${workspaceId}`)) {
        mcpConfigs[key] = existingConfig.mcpServers[key];
      }
    });

    fs.writeFileSync(
      configPath,
      JSON.stringify({ mcpServers: mcpConfigs }, null, 2),
      "utf8"
    );

    // Trigger MCP reload
    const MCPCompatibilityLayer = require("../MCP");
    const mcp = new MCPCompatibilityLayer();
    await mcp.reloadMCPServers();

    return mcpConfigs;
  }

  /**
   * Handle OAuth callback (called after frontend completes OAuth)
   */
  async handleCallback(provider, workspaceId, connectionId) {
    // Use NangoIntegration to verify and store connection
    const result = await this.nango.createConnection(provider, workspaceId, connectionId);

    // Update MCP servers
    await this.updateMCPServersForWorkspace(workspaceId);

    return result;
  }

  /**
   * Disconnect a service
   */
  async disconnect(provider, workspaceId) {
    // Use NangoIntegration to handle disconnection
    const result = await this.nango.deleteConnection(provider, workspaceId);
    
    // Update MCP servers
    await this.updateMCPServersForWorkspace(workspaceId);

    return result;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders() {
    return [
      {
        id: "shopify",
        name: "Shopify",
        description: "E-commerce platform",
        category: "ecommerce",
        authType: "oauth",
        logo: "/icons/shopify.svg",
      },
      {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Calendar and events",
        category: "productivity",
        authType: "oauth",
        logo: "/icons/google.svg",
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Payment processing",
        category: "payments",
        authType: "oauth",
        logo: "/icons/stripe.svg",
      },
      {
        id: "github",
        name: "GitHub",
        description: "Code repository",
        category: "development",
        authType: "oauth",
        logo: "/icons/github.svg",
      },
      {
        id: "slack",
        name: "Slack",
        description: "Team communication",
        category: "communication",
        authType: "oauth",
        logo: "/icons/slack.svg",
      },
    ];
  }
}

module.exports = { MCPNangoBridge };