const { Nango } = require("@nangohq/node");
const { ConnectorTokens } = require("../../models/connectorTokens");

/**
 * Enhanced Nango Integration for AnythingLLM
 * Implements proper Nango API patterns with syncs and webhooks
 */
class NangoIntegration {
  constructor() {
    this.nango = null;
    this.initNango();
  }

  initNango() {
    // Load production config if available
    let nangoConfig;
    try {
      nangoConfig = require('../../config/nango.production.js');
    } catch (error) {
      console.log('[Nango] Production config not found, using development mode');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction && nangoConfig) {
      // Use production credentials
      this.nango = new Nango({
        secretKey: nangoConfig.NANGO_SECRET_KEY,
        host: nangoConfig.NANGO_HOST,
      });
      console.log("[Nango] Initialized in PRODUCTION mode");
    } else if (process.env.NANGO_SECRET_KEY) {
      // Use development credentials
      this.nango = new Nango({
        secretKey: process.env.NANGO_SECRET_KEY,
        host: process.env.NANGO_HOST || "https://api.nango.dev",
      });
      console.log("[Nango] Initialized in DEVELOPMENT mode");
    } else {
      console.warn("[Nango] No credentials found for any environment");
    }
  }

  /**
   * Get OAuth URL for frontend embed
   * Uses Nango's frontend auth flow
   */
  async getAuthConfig(provider, workspaceId) {
    if (!this.nango) throw new Error("Nango not configured");

    const connectionId = `workspace_${workspaceId}`;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Load production config if in production mode
    let nangoConfig;
    try {
      nangoConfig = isProduction ? require('../../config/nango.production.js') : null;
    } catch (error) {
      console.log('[Nango] Production config not found');
    }
    
    // Check what provider configs actually exist in Nango
    let providerConfigKey;
    try {
      const integrations = await this.nango.listIntegrations();
      console.log('[Nango] Raw integrations response:', integrations);
      
      // Handle different response formats
      let availableKeys = [];
      if (Array.isArray(integrations)) {
        availableKeys = integrations.map(i => i.unique_key || i.id || i.name).filter(Boolean);
      } else if (integrations && integrations.configs && Array.isArray(integrations.configs)) {
        availableKeys = integrations.configs.map(i => i.unique_key || i.id || i.name).filter(Boolean);
      } else if (integrations && integrations.integrations) {
        availableKeys = integrations.integrations.map(i => i.unique_key || i.id || i.name).filter(Boolean);
      } else if (integrations && typeof integrations === 'object' && !integrations.configs) {
        availableKeys = Object.keys(integrations);
      }
      
      console.log('[Nango] Available provider configs:', availableKeys);
      
      // Try production config first if available
      if (isProduction && nangoConfig && nangoConfig.providers[provider]) {
        providerConfigKey = nangoConfig.providers[provider].configKey;
        if (availableKeys.includes(providerConfigKey)) {
          console.log(`[Nango] Using production config key: ${providerConfigKey}`);
          // Found production config, use it
          const config = {
            publicKey: nangoConfig.NANGO_PUBLIC_KEY,
            host: nangoConfig.NANGO_HOST,
            connectionId,
            providerConfigKey,
            authUrl: `${nangoConfig.NANGO_HOST}/oauth/connect`,
          };
          
          console.log('[Nango] Production auth config generated:', {
            provider,
            providerConfigKey,
            connectionId,
            publicKey: config.publicKey ? config.publicKey.substring(0, 8) + '...' : 'MISSING'
          });
          
          return config;
        }
      }
      
      // Fall back to development config patterns
      const possibleKeys = [
        provider, // exact match
        `${provider}-getting-started`,
        `${provider}_getting_started`,
        // Special mappings based on your actual Nango configs
        provider === 'gmail' ? 'google-mail' : null,
        provider === 'gmail' ? 'google' : null,
        provider === 'google-calendar' ? 'google-calendar-getting-started' : null,
        provider === 'google-calendar' ? 'google' : null,
      ].filter(Boolean);
      
      // Find the first matching key
      providerConfigKey = possibleKeys.find(key => availableKeys.includes(key));
      
      if (!providerConfigKey) {
        console.warn(`[Nango] No matching provider config found for ${provider}. Available: ${availableKeys.join(', ')}`);
        throw new Error(`Provider ${provider} is not configured in Nango. Please add a provider config for ${provider} in your Nango dashboard. Available providers: ${availableKeys.join(', ')}`);
      }
      
    } catch (error) {
      console.error('[Nango] Failed to list integrations:', error);
      // Fall back to simple mapping
      const providerConfigKeyMap = {
        'gmail': isProduction ? 'google-mail-prod' : 'google',
        'google-calendar': isProduction ? 'google-calendar-prod' : 'google',  
        'linkedin': isProduction ? 'linkedin-prod' : 'linkedin',
        'shopify': isProduction ? 'shopify-prod' : 'shopify',
        'github': isProduction ? 'github-prod' : 'github',
        'stripe': isProduction ? 'stripe-prod' : 'stripe',
        'slack': isProduction ? 'slack-prod' : 'slack',
      };
      providerConfigKey = providerConfigKeyMap[provider] || (isProduction ? `${provider}-prod` : provider);
    }
    
    // Return config for frontend Nango.auth() method
    const config = {
      publicKey: isProduction ? nangoConfig?.NANGO_PUBLIC_KEY : process.env.NANGO_PUBLIC_KEY,
      host: isProduction ? nangoConfig?.NANGO_HOST : (process.env.NANGO_HOST || "https://api.nango.dev"),
      connectionId,
      providerConfigKey,
      authUrl: `${isProduction ? nangoConfig?.NANGO_HOST : (process.env.NANGO_HOST || "https://api.nango.dev")}/oauth/connect`,
    };
    
    console.log('[Nango] Auth config generated:', {
      provider,
      providerConfigKey,
      connectionId,
      publicKey: config.publicKey ? config.publicKey.substring(0, 8) + '...' : 'MISSING',
      environment: isProduction ? 'production' : 'development'
    });
    
    return config;
  }

  /**
   * Get the correct provider config key for Nango
   */
  async getProviderConfigKey(provider) {
    try {
      const integrations = await this.nango.listIntegrations();
      
      // Handle different response formats
      let availableKeys = [];
      if (Array.isArray(integrations)) {
        availableKeys = integrations.map(i => i.unique_key || i.id || i.name).filter(Boolean);
      } else if (integrations && integrations.configs && Array.isArray(integrations.configs)) {
        // This is the correct format: {configs: [...]}
        availableKeys = integrations.configs.map(i => i.unique_key || i.id || i.name).filter(Boolean);
      } else if (integrations && integrations.integrations) {
        availableKeys = integrations.integrations.map(i => i.unique_key || i.id || i.name).filter(Boolean);
      } else if (integrations && typeof integrations === 'object' && !integrations.configs) {
        // Only use Object.keys as last resort and not when there's a 'configs' property
        availableKeys = Object.keys(integrations);
      }
      
      const possibleKeys = [
        provider,
        `${provider}-getting-started`,
        `${provider}_getting_started`,
        provider === 'gmail' ? 'google' : null,
        provider === 'gmail' ? 'google-mail' : null,
        provider === 'google-calendar' ? 'google' : null,
      ].filter(Boolean);
      
      const providerConfigKey = possibleKeys.find(key => availableKeys.includes(key));
      return providerConfigKey || availableKeys[0] || provider;
    } catch (error) {
      console.error('[Nango] Failed to get provider config key:', error);
      return provider;
    }
  }

  /**
   * Create or verify connection after OAuth
   */
  async createConnection(provider, workspaceId, connectionId) {
    if (!this.nango) throw new Error("Nango not configured");

    const providerConfigKey = await this.getProviderConfigKey(provider);

    try {
      // Get connection to verify it exists
      const connection = await this.nango.getConnection(
        providerConfigKey,
        connectionId || `workspace_${workspaceId}`
      );

      // Store in database with current sync time
      await ConnectorTokens.upsert({
        workspaceId,
        provider,
        nangoConnectionId: connection.connection_id,
        status: "connected",
        metadata: {
          provider_config_key: provider,
          created_at: connection.created_at,
          lastSync: new Date().toISOString(),
        },
      });

      return { success: true, connection };
    } catch (error) {
      console.error("[Nango] Failed to verify connection:", error);
      throw error;
    }
  }

  /**
   * Make API calls through Nango Proxy
   * This handles auth refresh automatically
   */
  async proxyRequest({ provider, workspaceId, method, endpoint, data }) {
    if (!this.nango) throw new Error("Nango not configured");

    const connectionId = `workspace_${workspaceId}`;

    try {
      // Use Nango's proxy for authenticated requests
      const response = await this.nango[method.toLowerCase()]({
        endpoint,
        connectionId,
        providerConfigKey: provider,
        data,
      });

      return response;
    } catch (error) {
      console.error(`[Nango] Proxy request failed for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get data from Nango Sync
   * Syncs run in background and store data
   */
  async getSyncedData(provider, workspaceId, syncName) {
    if (!this.nango) throw new Error("Nango not configured");

    const connectionId = `workspace_${workspaceId}`;

    try {
      // Get records from a sync
      const records = await this.nango.listRecords({
        providerConfigKey: provider,
        connectionId,
        model: syncName,
      });

      return records;
    } catch (error) {
      console.error(`[Nango] Failed to get synced data:`, error);
      return [];
    }
  }

  /**
   * Trigger a sync manually
   */
  async triggerSync(provider, workspaceId, syncName) {
    if (!this.nango) throw new Error("Nango not configured");

    const connectionId = `workspace_${workspaceId}`;

    try {
      const result = await this.nango.triggerSync(
        provider,
        [syncName],
        connectionId
      );

      return result;
    } catch (error) {
      console.error(`[Nango] Failed to trigger sync:`, error);
      throw error;
    }
  }

  /**
   * Delete connection
   */
  async deleteConnection(provider, workspaceId) {
    if (!this.nango) throw new Error("Nango not configured");

    const providerConfigKey = await this.getProviderConfigKey(provider);
    const connectionId = `workspace_${workspaceId}`;

    try {
      console.log(`[Nango] Deleting connection: provider=${providerConfigKey}, connectionId=${connectionId}`);
      await this.nango.deleteConnection(providerConfigKey, connectionId);
      await ConnectorTokens.delete({ workspaceId, provider });
      console.log(`[Nango] Successfully deleted connection for ${provider}`);
      return { success: true };
    } catch (error) {
      console.error(`[Nango] Failed to delete connection:`, error.response?.data || error.message);
      // Even if Nango fails, clean up local database
      await ConnectorTokens.delete({ workspaceId, provider });
      return { success: true };
    }
  }

  /**
   * Get connection details
   */
  async getConnection(provider, workspaceId) {
    if (!this.nango) throw new Error("Nango not configured");

    const providerConfigKey = await this.getProviderConfigKey(provider);
    const connectionId = `workspace_${workspaceId}`;

    try {
      const connection = await this.nango.getConnection(providerConfigKey, connectionId);
      return connection;
    } catch (error) {
      // Connection doesn't exist
      return null;
    }
  }

  /**
   * List all connections for a workspace
   */
  async listConnections(workspaceId) {
    if (!this.nango) throw new Error("Nango not configured");

    try {
      // Get all connections and filter by workspace
      const allConnections = await this.nango.listConnections();
      
      const workspaceConnections = allConnections.filter(conn => 
        conn.connection_id?.startsWith(`workspace_${workspaceId}`)
      );

      return workspaceConnections;
    } catch (error) {
      console.error(`[Nango] Failed to list connections:`, error);
      return [];
    }
  }

  /**
   * Register webhook endpoint for real-time updates
   */
  async registerWebhook(url) {
    if (!this.nango) throw new Error("Nango not configured");

    try {
      // This would be configured in Nango dashboard
      // Webhooks are sent to: your-domain.com/api/webhooks/nango
      console.log(`[Nango] Webhook endpoint: ${url}`);
      return { success: true, url };
    } catch (error) {
      console.error(`[Nango] Failed to register webhook:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming webhook from Nango
   */
  async handleWebhook(headers, body) {
    // Verify webhook signature
    const signature = headers["x-nango-signature"];
    
    if (!this.verifyWebhookSignature(body, signature)) {
      throw new Error("Invalid webhook signature");
    }

    const { type, connectionId, providerConfigKey, data } = body;

    // Extract workspace ID from connection ID
    const workspaceId = connectionId.replace("workspace_", "");

    switch (type) {
      case "sync:success":
        console.log(`[Nango] Sync completed for ${providerConfigKey} in workspace ${workspaceId}`);
        await this.handleSyncSuccess(providerConfigKey, workspaceId, data);
        break;

      case "sync:error":
        console.error(`[Nango] Sync failed for ${providerConfigKey} in workspace ${workspaceId}`);
        await this.handleSyncError(providerConfigKey, workspaceId, data);
        break;

      case "auth:revoked":
        console.log(`[Nango] Auth revoked for ${providerConfigKey} in workspace ${workspaceId}`);
        await ConnectorTokens.updateSyncStatus({
          workspaceId,
          provider: providerConfigKey,
          status: "disconnected",
        });
        break;

      default:
        console.log(`[Nango] Received webhook: ${type}`);
    }

    return { success: true };
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    // TODO: Implement signature verification
    // See: https://docs.nango.dev/guides/webhooks
    return true;
  }

  /**
   * Handle successful sync
   */
  async handleSyncSuccess(provider, workspaceId, data) {
    await ConnectorTokens.updateSyncStatus({
      workspaceId,
      provider,
      status: "connected",
    });

    // TODO: Process synced data into vector DB
    console.log(`[Nango] Processing ${data.added_count} new records from ${provider}`);
  }

  /**
   * Handle sync error
   */
  async handleSyncError(provider, workspaceId, error) {
    await ConnectorTokens.updateSyncStatus({
      workspaceId,
      provider,
      status: "error",
    });

    console.error(`[Nango] Sync error for ${provider}:`, error);
  }

  /**
   * Get available integrations from Nango
   */
  async getAvailableIntegrations() {
    if (!this.nango) throw new Error("Nango not configured");

    try {
      // Get list of configured integrations
      const integrations = await this.nango.listIntegrations();
      
      return integrations.map(integration => ({
        id: integration.unique_key,
        name: integration.provider,
        authType: integration.auth_mode,
        configured: true,
      }));
    } catch (error) {
      console.error("[Nango] Failed to list integrations:", error);
      return [];
    }
  }
}

module.exports = { NangoIntegration };