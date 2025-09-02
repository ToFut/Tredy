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
    if (process.env.NANGO_SECRET_KEY) {
      this.nango = new Nango({
        secretKey: process.env.NANGO_SECRET_KEY,
        host: process.env.NANGO_HOST || "https://api.nango.dev",
      });
      console.log("[Nango] Initialized with cloud service");
    }
  }

  /**
   * Get OAuth URL for frontend embed
   * Uses Nango's frontend auth flow
   */
  async getAuthConfig(provider, workspaceId) {
    if (!this.nango) throw new Error("Nango not configured");

    const connectionId = `workspace_${workspaceId}`;
    
    // Return config for frontend Nango.auth() method
    return {
      publicKey: process.env.NANGO_PUBLIC_KEY,
      host: process.env.NANGO_HOST || "https://api.nango.dev",
      connectionId,
      providerConfigKey: provider,
      // These will be used by frontend
      authUrl: `https://api.nango.dev/oauth/connect`,
    };
  }

  /**
   * Create or verify connection after OAuth
   */
  async createConnection(provider, workspaceId, connectionId) {
    if (!this.nango) throw new Error("Nango not configured");

    try {
      // Get connection to verify it exists
      const connection = await this.nango.getConnection(
        provider,
        connectionId || `workspace_${workspaceId}`
      );

      // Store in database
      await ConnectorTokens.upsert({
        workspaceId,
        provider,
        nangoConnectionId: connection.connection_id,
        status: "connected",
        metadata: {
          provider_config_key: provider,
          created_at: connection.created_at,
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

    const connectionId = `workspace_${workspaceId}`;

    try {
      await this.nango.deleteConnection(provider, connectionId);
      await ConnectorTokens.delete({ workspaceId, provider });
      return { success: true };
    } catch (error) {
      console.error(`[Nango] Failed to delete connection:`, error);
      throw error;
    }
  }

  /**
   * Get connection details
   */
  async getConnection(provider, workspaceId) {
    if (!this.nango) throw new Error("Nango not configured");

    const connectionId = `workspace_${workspaceId}`;

    try {
      const connection = await this.nango.getConnection(provider, connectionId);
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