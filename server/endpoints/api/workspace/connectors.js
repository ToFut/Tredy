const { Workspace } = require("../../../models/workspace");
const { ConnectorTokens } = require("../../../models/connectorTokens");
const { MCPNangoBridge } = require("../../../utils/connectors/mcp-nango-bridge");
const { validatedRequest } = require("../../../utils/http");
const { reqBody } = require("../../../utils/http");

function apiWorkspaceConnectorEndpoints(app) {
  if (!app) return;

  const bridge = new MCPNangoBridge();

  /**
   * GET /api/workspace/:slug/connectors/available
   * List available connector providers
   */
  app.get(
    "/v1/workspace/:slug/connectors/available",
    [validatedRequest],
    async (request, response) => {
      try {
        const providers = bridge.getAvailableProviders();
        response.status(200).json({ providers });
      } catch (error) {
        console.error("Failed to get available connectors:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * GET /api/workspace/:slug/connectors
   * List connected services for workspace
   */
  app.get(
    "/v1/workspace/:slug/connectors",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const workspace = await Workspace.get({ slug });
        
        if (!workspace) {
          return response.status(404).json({ error: "Workspace not found" });
        }

        const connectors = await ConnectorTokens.forWorkspace(workspace.id);
        response.status(200).json({ connectors });
      } catch (error) {
        console.error("Failed to list connectors:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/workspace/:slug/connectors/connect
   * Initiate connection to a service (returns OAuth URL if using Nango)
   */
  app.post(
    "/v1/workspace/:slug/connectors/connect",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { provider } = reqBody(request);
        
        const workspace = await Workspace.get({ slug });
        if (!workspace) {
          return response.status(404).json({ error: "Workspace not found" });
        }

        // Check if already connected
        const existing = await ConnectorTokens.get({
          workspaceId: workspace.id,
          provider,
        });
        
        if (existing && existing.status === "connected") {
          return response.status(200).json({
            success: true,
            message: "Already connected",
            connector: existing,
          });
        }

        // Check if Nango is configured
        if (!process.env.NANGO_SECRET_KEY || !process.env.NANGO_PUBLIC_KEY) {
          return response.status(400).json({
            error: "Nango integration not configured. Please set NANGO_SECRET_KEY and NANGO_PUBLIC_KEY environment variables.",
          });
        }

        // Generate OAuth config via Nango
        try {
          const authConfig = await bridge.generateAuthUrl(provider, workspace.id);
          return response.status(200).json({
            success: true,
            authConfig, // Frontend will use Nango.auth() with this config
            message: "Please complete authentication",
          });
        } catch (error) {
          console.error("Nango auth config error:", error);
          return response.status(500).json({
            error: `Failed to generate authentication config: ${error.message}`,
          });
        }
      } catch (error) {
        console.error("Failed to connect service:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/workspace/:slug/connectors/callback
   * OAuth callback handler (called after frontend completes OAuth)
   */
  app.post(
    "/v1/workspace/:slug/connectors/callback",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { provider, connectionId } = reqBody(request);
        
        const workspace = await Workspace.get({ slug });
        if (!workspace) {
          return response.status(404).json({ error: "Workspace not found" });
        }

        const result = await bridge.handleCallback(provider, workspace.id, connectionId);
        
        response.status(200).json({
          success: true,
          message: "Connected successfully",
          ...result
        });
      } catch (error) {
        console.error("OAuth callback failed:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * DELETE /api/workspace/:slug/connectors/:provider
   * Disconnect a service
   */
  app.delete(
    "/v1/workspace/:slug/connectors/:provider",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug, provider } = request.params;
        const workspace = await Workspace.get({ slug });
        
        if (!workspace) {
          return response.status(404).json({ error: "Workspace not found" });
        }

        await bridge.disconnect(provider, workspace.id);
        
        response.status(200).json({
          success: true,
          message: "Disconnected successfully",
        });
      } catch (error) {
        console.error("Failed to disconnect service:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );

  /**
   * POST /api/workspace/:slug/connectors/:provider/sync
   * Trigger manual sync for a connector
   */
  app.post(
    "/v1/workspace/:slug/connectors/:provider/sync",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug, provider } = request.params;
        const { syncName } = reqBody(request);
        const workspace = await Workspace.get({ slug });
        
        if (!workspace) {
          return response.status(404).json({ error: "Workspace not found" });
        }

        // Update lastSync timestamp
        await ConnectorTokens.updateLastSync(workspace.id, provider);
        
        // Trigger sync via Nango if configured
        if (process.env.NANGO_SECRET_KEY && syncName) {
          const { NangoIntegration } = require("../../../utils/connectors/nango-integration");
          const nango = new NangoIntegration();
          
          await nango.triggerSync(provider, workspace.id, syncName);
          
          response.status(200).json({
            success: true,
            message: "Sync triggered",
          });
        } else {
          // Just update MCP servers
          await bridge.updateMCPServersForWorkspace(workspace.id);
          
          response.status(200).json({
            success: true,
            message: "MCP servers updated",
          });
        }
      } catch (error) {
        console.error("Failed to sync connector:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );
}

module.exports = { apiWorkspaceConnectorEndpoints };