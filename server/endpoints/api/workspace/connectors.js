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
    "/api/workspace/:slug/connectors/available",
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
    "/api/workspace/:slug/connectors",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const workspace = await Workspace.getBySlug(slug);
        
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
    "/api/workspace/:slug/connectors/connect",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { provider } = reqBody(request);
        
        const workspace = await Workspace.getBySlug(slug);
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

        // Generate OAuth config via Nango
        if (process.env.NANGO_SECRET_KEY) {
          const authConfig = await bridge.generateAuthUrl(provider, workspace.id);
          return response.status(200).json({
            success: true,
            authConfig, // Frontend will use Nango.auth() with this config
            message: "Please complete authentication",
          });
        } else {
          // Direct API key mode - expect credentials in request
          const { credentials } = reqBody(request);
          if (!credentials) {
            return response.status(400).json({
              error: "Credentials required when not using OAuth",
            });
          }

          await ConnectorTokens.upsert({
            workspaceId: workspace.id,
            provider,
            status: "connected",
            metadata: credentials,
          });

          await bridge.updateMCPServersForWorkspace(workspace.id);

          return response.status(200).json({
            success: true,
            message: "Connected successfully",
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
    "/api/workspace/:slug/connectors/callback",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { provider, connectionId } = reqBody(request);
        
        const workspace = await Workspace.getBySlug(slug);
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
    "/api/workspace/:slug/connectors/:provider",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug, provider } = request.params;
        const workspace = await Workspace.getBySlug(slug);
        
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
    "/api/workspace/:slug/connectors/:provider/sync",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug, provider } = request.params;
        const { syncName } = reqBody(request);
        const workspace = await Workspace.getBySlug(slug);
        
        if (!workspace) {
          return response.status(404).json({ error: "Workspace not found" });
        }

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