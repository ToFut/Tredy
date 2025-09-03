const { NangoIntegration } = require("../../../utils/connectors/nango-integration");
const { reqBody } = require("../../../utils/http");
const { validatedRequest } = require("../../../utils/middleware/validatedRequest");

function apiOAuthEndpoints(app) {
  if (!app) return;
  
  const nango = new NangoIntegration();

  app.post(
    "/api/oauth/init",
    [validatedRequest],
    async (request, response) => {
      try {
        const { provider } = reqBody(request);
        const { workspace_id } = request.params;
        
        if (!provider) {
          return response.status(400).json({ 
            error: "Provider is required" 
          });
        }

        // Get OAuth configuration for frontend
        const authConfig = await nango.getAuthConfig(
          provider, 
          workspace_id || request.user?.id || "default"
        );

        response.status(200).json({ 
          success: true,
          config: authConfig 
        });
      } catch (error) {
        console.error("OAuth init error:", error);
        response.status(500).json({ 
          error: error.message 
        });
      }
    }
  );

  app.post(
    "/api/oauth/verify",
    [validatedRequest],
    async (request, response) => {
      try {
        const { provider, connectionId } = reqBody(request);
        const { workspace_id } = request.params;
        
        if (!provider) {
          return response.status(400).json({ 
            error: "Provider is required" 
          });
        }

        // Verify and create connection after OAuth
        const result = await nango.createConnection(
          provider, 
          workspace_id || request.user?.id || "default",
          connectionId
        );

        response.status(200).json({ 
          success: true,
          connection: result.connection 
        });
      } catch (error) {
        console.error("OAuth verify error:", error);
        response.status(500).json({ 
          error: error.message 
        });
      }
    }
  );

  app.get(
    "/api/oauth/status/:provider",
    [validatedRequest],
    async (request, response) => {
      try {
        const { provider } = request.params;
        const { workspace_id } = request.query;
        
        if (!provider) {
          return response.status(400).json({ 
            error: "Provider is required" 
          });
        }

        // Check connection status
        const connection = await nango.getConnection(
          provider, 
          workspace_id || request.user?.id || "default"
        );

        response.status(200).json({ 
          success: true,
          connected: !!connection,
          connection 
        });
      } catch (error) {
        console.error("OAuth status error:", error);
        response.status(500).json({ 
          error: error.message 
        });
      }
    }
  );

  app.delete(
    "/api/oauth/disconnect/:provider",
    [validatedRequest],
    async (request, response) => {
      try {
        const { provider } = request.params;
        const { workspace_id } = request.query;
        
        if (!provider) {
          return response.status(400).json({ 
            error: "Provider is required" 
          });
        }

        // Delete connection
        const result = await nango.deleteConnection(
          provider, 
          workspace_id || request.user?.id || "default"
        );

        response.status(200).json({ 
          success: true,
          ...result 
        });
      } catch (error) {
        console.error("OAuth disconnect error:", error);
        response.status(500).json({ 
          error: error.message 
        });
      }
    }
  );

  // OAuth callback endpoint - handles post-OAuth completion
  app.post(
    "/api/oauth/callback",
    [validatedRequest],
    async (request, response) => {
      try {
        const { provider, connectionId } = reqBody(request);
        const { workspace_id } = request.params;
        
        if (!provider || !connectionId) {
          return response.status(400).json({ 
            error: "Provider and connectionId are required" 
          });
        }

        const workspaceId = workspace_id || request.user?.id || "default";

        // Use MCPNangoBridge for complete callback handling
        const { MCPNangoBridge } = require("../../../utils/connectors/mcp-nango-bridge");
        const bridge = new MCPNangoBridge();
        
        // Handle OAuth callback and setup MCP
        const result = await bridge.handleCallback(provider, workspaceId, connectionId);
        
        if (result.success) {
          // Test the connection
          await bridge.testConnection(provider, workspaceId);
          
          response.status(200).json({ 
            success: true,
            message: `${provider} integration completed successfully!`,
            connection: result.connection,
            mcp_configured: true
          });
        } else {
          response.status(400).json({ 
            error: result.error || "OAuth callback failed" 
          });
        }
      } catch (error) {
        console.error("OAuth callback error:", error);
        response.status(500).json({ 
          error: error.message 
        });
      }
    }
  );
}

module.exports = { apiOAuthEndpoints };