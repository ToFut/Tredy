/**
 * Dashboard WebSocket Endpoints
 * Provides real-time dashboard updates
 */

const DashboardDataBridge = require("../utils/dashboard/dataBridge");
const Workspace = require("../models/workspace");

function dashboardWebsocket(app) {
  if (!app) return;

  const dataBridge = new DashboardDataBridge();
  const connections = new Map(); // workspace_id -> Set of sockets

  /**
   * Register dashboard WebSocket connection
   */
  app.ws("/dashboard-updates/:workspaceSlug", async function (socket, request) {
    try {
      const { workspaceSlug } = request.params;
      const workspace = await Workspace.bySlug(workspaceSlug);

      if (!workspace) {
        socket.close();
        return;
      }

      // Register connection
      if (!connections.has(workspace.id)) {
        connections.set(workspace.id, new Set());
      }
      connections.get(workspace.id).add(socket);

      // Send initial data
      await sendDashboardData(workspace, socket);

      // Set up periodic updates
      const updateInterval = setInterval(async () => {
        await sendDashboardData(workspace, socket);
      }, 30000); // Update every 30 seconds

      socket.on("close", () => {
        clearInterval(updateInterval);
        const workspaceConnections = connections.get(workspace.id);
        if (workspaceConnections) {
          workspaceConnections.delete(socket);
          if (workspaceConnections.size === 0) {
            connections.delete(workspace.id);
          }
        }
      });

      socket.on("error", (error) => {
        console.error("Dashboard WebSocket error:", error);
        socket.close();
      });
    } catch (error) {
      console.error("Dashboard WebSocket setup error:", error);
      socket.close();
    }
  });

  /**
   * Send dashboard data to socket
   */
  async function sendDashboardData(workspace, socket) {
    try {
      const connectors = ["gmail", "google-calendar", "linkedin"];
      const metrics = {};

      for (const connector of connectors) {
        const data = await dataBridge.getConnectorMetrics(workspace, connector);
        if (data) {
          metrics[connector] = data;
        }
      }

      const dashboardData = {
        type: "dashboard_update",
        workspace: workspace.slug,
        metrics,
        timestamp: new Date().toISOString(),
      };

      socket.send(JSON.stringify(dashboardData));
    } catch (error) {
      console.error("Error sending dashboard data:", error);
    }
  }

  /**
   * Broadcast dashboard update to all connections for a workspace
   */
  async function broadcastDashboardUpdate(workspaceId) {
    const workspaceConnections = connections.get(workspaceId);
    if (!workspaceConnections) return;

    const workspace = await Workspace.get({ id: workspaceId });
    if (!workspace) return;

    for (const socket of workspaceConnections) {
      await sendDashboardData(workspace, socket);
    }
  }

  return {
    broadcastDashboardUpdate,
  };
}

module.exports = { dashboardWebsocket };
