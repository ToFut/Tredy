const { validatedRequest } = require("../../utils/middleware/validatedRequest");
const { ConnectorTokens } = require("../../models/connectorTokens");
const { MCPNangoBridge } = require("../../utils/connectors/mcp-nango-bridge");
const { reqBody } = require("../../utils/http");

/**
 * User-level connector management endpoints
 * Similar to agent skills, these connectors are available across all user's workspaces
 */
function userConnectorEndpoints(app) {
  if (!app) return;

  const bridge = new MCPNangoBridge();

  // Get all user connectors
  app.get("/user/connectors", [validatedRequest], async (request, response) => {
    try {
      // In multi-user mode, get user-specific connectors
      // In single-user mode, treat as system-wide connectors
      let connectors = [];
      
      if (response.locals.user?.id) {
        connectors = await ConnectorTokens.forUser(response.locals.user.id);
      } else {
        // Single-user mode: get all connectors regardless of user
        connectors = await ConnectorTokens.all();
      }
      
      response.status(200).json({
        success: true,
        connectors: connectors,
      });
    } catch (error) {
      console.error("Failed to get user connectors:", error);
      response.status(500).json({
        success: false,
        error: "Failed to fetch user connectors",
      });
    }
  });

  // Get available connector types
  app.get("/user/connectors/available", [validatedRequest], async (request, response) => {
    try {
      const providers = bridge.getAvailableProviders();
      response.status(200).json({ success: true, connectors: providers });
    } catch (error) {
      console.error("Failed to get available connectors:", error);
      response.status(500).json({
        success: false,
        error: "Failed to fetch available connectors",
      });
    }
  });

  // Create or update a user connector
  app.post("/user/connectors/connect", [validatedRequest], async (request, response) => {
    try {
      const { provider } = reqBody(request);

      if (!provider) {
        return response.status(400).json({
          success: false,
          error: "Provider is required",
        });
      }

      // Check if already connected
      const existingConnector = response.locals.user?.id 
        ? await ConnectorTokens.get({ userId: response.locals.user.id, provider })
        : await ConnectorTokens.getByProvider(provider);
        
      if (existingConnector) {
        return response.status(400).json({
          success: false,
          error: "Provider already connected",
        });
      }

      // Initiate OAuth flow via Nango bridge
      const connectionId = response.locals.user?.id 
        ? `user_${response.locals.user.id}`
        : `system`;
        
      const authConfig = await bridge.generateAuthUrl(provider, connectionId);
      
      response.status(200).json({
        success: true,
        authUrl: authConfig.authUrl || `${authConfig.host}/oauth/connect?provider_config_key=${authConfig.providerConfigKey}&connection_id=${authConfig.connectionId}&public_key=${authConfig.publicKey}`,
        connectionId: authConfig.connectionId,
      });

    } catch (error) {
      console.error("Failed to initiate connector:", error);
      response.status(500).json({
        success: false,
        error: "Failed to initiate connector",
      });
    }
  });

  // Delete a user connector
  app.delete("/user/connectors/:provider", [validatedRequest], async (request, response) => {
    try {
      const { provider } = request.params;

      // Get connector to clean up
      const connector = response.locals.user?.id 
        ? await ConnectorTokens.get({ userId: response.locals.user.id, provider })
        : await ConnectorTokens.getByProvider(provider);

      if (!connector) {
        return response.status(404).json({
          success: false,
          error: "Connector not found",
        });
      }

      // Disconnect from Nango/MCP bridge
      if (connector.nangoConnectionId) {
        await bridge.disconnect(connector.nangoConnectionId);
      }

      // Delete the connector record
      const success = response.locals.user?.id 
        ? await ConnectorTokens.deleteConnector({ userId: response.locals.user.id, provider })
        : await ConnectorTokens.deleteByProvider(provider);

      response.status(200).json({
        success,
        message: success ? "Connector deleted successfully" : "Failed to delete connector",
      });
    } catch (error) {
      console.error("Failed to delete user connector:", error);
      response.status(500).json({
        success: false,
        error: "Failed to delete user connector",
      });
    }
  });

  // Sync a user connector
  app.post("/user/connectors/:provider/sync", [validatedRequest], async (request, response) => {
    try {
      const { provider } = request.params;

      const connector = response.locals.user?.id 
        ? await ConnectorTokens.get({ userId: response.locals.user.id, provider })
        : await ConnectorTokens.getByProvider(provider);

      if (!connector) {
        return response.status(404).json({
          success: false,
          error: "Connector not found",
        });
      }

      // Trigger sync via bridge
      if (connector.nangoConnectionId) {
        const syncResult = await bridge.triggerSync(connector.nangoConnectionId, provider);
        
        return response.status(200).json({
          success: syncResult.success,
          message: syncResult.success 
            ? "Sync initiated successfully" 
            : "Failed to initiate sync",
        });
      }

      response.status(200).json({
        success: false,
        message: "Manual sync not available for this connector",
      });
    } catch (error) {
      console.error("Failed to sync user connector:", error);
      response.status(500).json({
        success: false,
        error: "Failed to sync user connector",
      });
    }
  });
}

module.exports = { userConnectorEndpoints };