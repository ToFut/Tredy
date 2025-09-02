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

        // Generate OAuth URL via Nango
        if (process.env.NANGO_SECRET_KEY) {
          const authUrl = await bridge.generateAuthUrl(provider, workspace.id);
          return response.status(200).json({
            success: true,
            authUrl,
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
   * GET /api/workspace/connectors/callback
   * OAuth callback handler (Nango redirects here)
   */
  app.get(
    "/api/workspace/connectors/callback",
    async (request, response) => {
      try {
        const { provider, connectionId } = request.query;
        
        if (!provider || !connectionId) {
          return response.redirect(
            `${process.env.FRONTEND_URL || "http://localhost:3000"}/workspace?error=invalid_callback`
          );
        }

        const result = await bridge.handleCallback(provider, connectionId);
        
        // Redirect to workspace settings
        const workspace = await Workspace.get({ id: result.workspaceId });
        response.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:3000"}/workspace/${workspace.slug}/settings/connectors?success=true`
        );
      } catch (error) {
        console.error("OAuth callback failed:", error);
        response.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:3000"}/workspace?error=${error.message}`
        );
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
        const workspace = await Workspace.getBySlug(slug);
        
        if (!workspace) {
          return response.status(404).json({ error: "Workspace not found" });
        }

        // Update sync status
        await ConnectorTokens.updateSyncStatus({
          workspaceId: workspace.id,
          provider,
          status: "syncing",
        });

        // In production, this would trigger a background job
        // For now, just update MCP servers
        await bridge.updateMCPServersForWorkspace(workspace.id);

        await ConnectorTokens.updateSyncStatus({
          workspaceId: workspace.id,
          provider,
          status: "connected",
        });

        response.status(200).json({
          success: true,
          message: "Sync completed",
        });
      } catch (error) {
        console.error("Failed to sync connector:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );
}

module.exports = { apiWorkspaceConnectorEndpoints };