/**
 * MCP Server Startup for Railway Production
 * This file initializes MCP servers when the main server starts
 * Required for Railway deployments since we're not using Docker
 */

const MCPCompatibilityLayer = require("./index");

async function startMCPServersForProduction() {
  console.log("[MCP Railway] Initializing MCP servers for production...");

  try {
    // Initialize MCP compatibility layer
    const mcp = new MCPCompatibilityLayer();

    // Boot all configured MCP servers
    await mcp.bootMCPServers();

    // Log active servers
    const activeServers = await mcp.activeMCPServers();

    if (activeServers.length > 0) {
      console.log(
        `[MCP Railway] Successfully started ${activeServers.length} MCP servers:`,
        activeServers
      );
    } else {
      console.log("[MCP Railway] No MCP servers configured or started");
    }

    // Log which servers are available based on environment variables
    if (process.env.NANGO_SECRET_KEY) {
      console.log(
        "[MCP Railway] Nango integration detected - Gmail/connectors should be available"
      );
    }

    if (process.env.GOOGLE_CLIENT_ID) {
      console.log(
        "[MCP Railway] Google OAuth detected - Calendar integration should be available"
      );
    }

    return true;
  } catch (error) {
    console.error("[MCP Railway] Failed to start MCP servers:", error);
    // Don't crash the server if MCP servers fail to start
    return false;
  }
}

module.exports = { startMCPServersForProduction };
