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
   * List connected services for workspace (includes inherited user connectors)
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

        // Get workspace-specific connectors
        const workspaceConnectors = await ConnectorTokens.forWorkspace(workspace.id);
        
        // Get user-level connectors (if user exists)
        let availableConnectors = [...workspaceConnectors];
        if (response.locals.user?.id) {
          const userConnectors = await ConnectorTokens.getAvailableForWorkspace(workspace.id, response.locals.user.id);
          
          // Add user connectors that aren't overridden by workspace-level ones
          const workspaceProviders = new Set(workspaceConnectors.map(c => c.provider));
          const inheritedConnectors = userConnectors
            .filter(c => !workspaceProviders.has(c.provider))
            .map(c => ({
              ...c,
              inherited: true,
              scope: 'user'
            }));
          
          availableConnectors = [
            ...workspaceConnectors.map(c => ({ ...c, scope: 'workspace' })),
            ...inheritedConnectors
          ];
        }

        response.status(200).json({ 
          connectors: availableConnectors,
          inheritanceSupported: true 
        });
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
   * POST /api/workspace/:slug/connectors/:provider/override
   * Override a user-level connector with workspace-specific settings
   */
  app.post(
    "/v1/workspace/:slug/connectors/:provider/override",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug, provider } = request.params;
        const { settings } = reqBody(request);
        const workspace = await Workspace.get({ slug });
        
        if (!workspace) {
          return response.status(404).json({ error: "Workspace not found" });
        }

        // Check if user has this connector available
        if (response.locals.user?.id) {
          const userConnector = await ConnectorTokens.get({
            userId: response.locals.user.id,
            provider,
          });

          if (!userConnector) {
            return response.status(404).json({ 
              error: "User connector not found. You must connect this service at the user level first." 
            });
          }

          // Create workspace-level override
          const { connector, error } = await ConnectorTokens.upsert({
            workspaceId: workspace.id,
            provider,
            nangoConnectionId: userConnector.nangoConnectionId, // Inherit the connection
            metadata: {
              ...userConnector.metadata,
              ...settings, // Override with workspace-specific settings
              overrides: settings,
            },
            status: "connected",
            scope: "workspace",
          });

          if (error) {
            return response.status(500).json({ success: false, error });
          }

          response.status(200).json({
            success: true,
            connector,
            message: "Workspace override created successfully",
          });
        } else {
          return response.status(401).json({ 
            error: "User authentication required for connector overrides" 
          });
        }
      } catch (error) {
        console.error("Failed to create connector override:", error);
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