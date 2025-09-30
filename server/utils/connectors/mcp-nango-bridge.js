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

    // Use specific MCP servers for each provider
    const mcpServerMap = {
      gmail: "/Users/segevbin/anything-llm/server/gmail-mcp-server.js",
      "google-calendar":
        "/Users/segevbin/anything-llm/server/simple-google-calendar-mcp.js",
      "google-drive":
        "/Users/segevbin/anything-llm/server/google-drive-generated-mcp.js",
      linkedin: "/Users/segevbin/anything-llm/server/linkedin-mcp.js",
      supabase: "/mnt/c/MyProjects/Tredy/server/supabase-mcp-server.js",
      // Add other providers as needed
      default: "/Users/segevbin/anything-llm/server/universal-nango-mcp.js",
    };

    const mcpServer = mcpServerMap[provider] || mcpServerMap["default"];

    return {
      type: "stdio",
      command: "node",
      args: [mcpServer],
      env: {
        NANGO_PROVIDER: provider,
        NANGO_PROVIDER_CONFIG_KEY:
          connector.nangoProviderConfigKey || `${provider}-getting-started`,
        NANGO_SECRET_KEY:
          process.env.NANGO_SECRET_KEY ||
          "7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91",
        NANGO_HOST: process.env.NANGO_HOST || "https://api.nango.dev",
        NANGO_CONNECTION_ID: `workspace_${workspaceId}`,
      },
      anythingllm: {
        autoStart: true,
      },
    };
  }

  /**
   * Update MCP servers configuration for a workspace
   * This integrates with the existing MCP system
   */
  async updateMCPServersForWorkspace(workspaceId) {
    // Validate workspaceId - skip if invalid or test data
    if (!workspaceId || workspaceId.toString().includes("test-")) {
      console.log(
        `[MCPBridge] Skipping MCP update for test/invalid workspace: ${workspaceId}`
      );
      return {};
    }

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
        ? path.resolve(
            __dirname,
            "../../storage/plugins/anythingllm_mcp_servers.json"
          )
        : path.resolve(
            process.env.STORAGE_DIR || path.resolve(__dirname, "../../storage"),
            "plugins/anythingllm_mcp_servers.json"
          );

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
    const result = await this.nango.createConnection(
      provider,
      workspaceId,
      connectionId
    );

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
   * Configure MCP server for a provider (called during integration)
   */
  async configureMCPServer(provider, workspaceId) {
    // This is called during integration to prepare MCP config
    // Actual MCP server starts when OAuth completes
    console.log(
      `[MCPBridge] MCP server configured for ${provider} in workspace ${workspaceId}`
    );
    return { success: true };
  }

  /**
   * Test connection by making a simple API call
   */
  async testConnection(provider, workspaceId) {
    try {
      const connection = await this.nango.getConnection(provider, workspaceId);
      if (!connection) {
        throw new Error("No connection found");
      }

      // Make a simple test API call based on provider
      let testEndpoint;
      switch (provider) {
        case "linkedin":
        case "linkedin-getting-started":
          testEndpoint = "/v2/userinfo";
          break;
        case "google-mail-getting-started":
        case "gmail":
          testEndpoint = "/gmail/v1/users/me/profile";
          break;
        case "google-calendar-getting-started":
          testEndpoint = "/calendar/v3/users/me/calendarList";
          break;
        default:
          // Skip test for unknown providers
          return {
            success: true,
            message: "Connection configured (test skipped)",
          };
      }

      const testResponse = await this.nango.get({
        endpoint: testEndpoint,
        connectionId: `workspace_${workspaceId}`,
        providerConfigKey: provider,
      });

      console.log(`[MCPBridge] Connection test successful for ${provider}`);
      return { success: true, data: testResponse.data };
    } catch (error) {
      console.error(
        `[MCPBridge] Connection test failed for ${provider}:`,
        error
      );
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  /**
   * Get category for a provider based on its ID
   */
  getCategory(providerId) {
    const categoryMap = {
      gmail: "communication",
      "google-calendar": "productivity",
      "google-drive": "productivity",
      "google-sheets": "productivity",
      linkedin: "communication",
      facebook: "communication",
      whatsapp: "communication",
      instagram: "communication",
      twitter: "communication",
      slack: "communication",
      discord: "communication",
      telegram: "communication",
      github: "development",
      stripe: "payments",
      shopify: "ecommerce",
      airtable: "productivity",
      notion: "productivity",
      hubspot: "crm",
      salesforce: "crm",
      zendesk: "support",
      jira: "development",
      "meta-ads": "marketing",
      reddit: "communication",
      youtube: "media",
      postgres: "database",
      mongodb: "database",
      docker: "infrastructure",
      kubernetes: "infrastructure",
      aws: "infrastructure",
      azure: "infrastructure",
      twilio: "communication",
      sendgrid: "email",
      mailchimp: "email",
      supabase: "database"
    };

    return categoryMap[providerId] || "other";
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders() {
    // Load from MCP registry
    const registry = require("../../mcp-registry.json");
    const providers = [];

    for (const [id, config] of Object.entries(registry.mcpServers)) {
      // Only show OAuth/API key providers (not local ones)
      if (
        config.auth.startsWith("nango:") ||
        config.auth.startsWith("api_key:")
      ) {
        providers.push({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " "),
          description: config.description,
          category: this.getCategory(id),
          authType: config.auth.startsWith("nango:") ? "oauth" : "api_key",
          logo: `/icons/${id}.svg`,
          requiresMetadata:
            config.auth.includes("instagram") || config.auth.includes("meta"),
        });
      }
    }

    // Keep existing providers for compatibility
    providers.push(
      {
        id: "google-drive",
        name: "Google Drive",
        description: "Cloud storage and document collaboration",
        category: "productivity",
        authType: "oauth",
        logo: "/icons/google-drive.svg",
        requiresMetadata: true,
        metadataFields: {
          folders: "Folder IDs to sync (use 'root' for all)",
          files: "Specific file IDs to sync (optional)",
        },
      },
      {
        id: "facebook",
        name: "Facebook",
        description: "Social media platform and messaging",
        category: "communication",
        authType: "oauth",
        logo: "/icons/facebook.svg",
      },
      {
        id: "airtable",
        name: "Airtable",
        description: "Database and spreadsheet platform",
        category: "productivity",
        authType: "oauth",
        logo: "/icons/airtable.svg",
      },
      {
        id: "shopify",
        name: "Shopify",
        description: "E-commerce platform",
        category: "ecommerce",
        authType: "oauth",
        logo: "/icons/shopify.svg",
      },
      {
        id: "gmail",
        name: "Gmail",
        description: "Email and communication",
        category: "communication",
        authType: "oauth",
        logo: "/icons/gmail.svg",
        nangoProviderConfigKey: "google-mail-urgd",
      },
      {
        id: "google-calendar",
        name: "Google Calendar",
        description: "Calendar and events",
        category: "productivity",
        authType: "oauth",
        logo: "/icons/google.svg",
        nangoProviderConfigKey: "google-calendar-getting-started",
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        description: "Professional networking and messaging",
        category: "communication",
        authType: "oauth",
        logo: "/icons/linkedin.svg",
        nangoProviderConfigKey: "linkedin",
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
      {
        id: "supabase",
        name: "Supabase",
        description: "Backend as a service with database and storage",
        category: "database",
        authType: "oauth",
        logo: "/icons/gmail.svg",
      }
    );

    return providers;
  }
}

module.exports = { MCPNangoBridge };
