const prisma = require("../utils/prisma");

/**
 * Connector Tokens model - follows the same pattern as SystemSettings
 * Manages OAuth connections via Nango for workspace data sources
 */
const ConnectorTokens = {
  /**
   * Create or update a connector connection
   */
  upsert: async function ({ workspaceId, provider, nangoConnectionId, status = "connected", metadata = {} }) {
    try {
      const data = {
        workspaceId: Number(workspaceId),
        provider,
        nangoConnectionId,
        status,
        metadata: JSON.stringify(metadata),
      };

      const connector = await prisma.connector_tokens.upsert({
        where: {
          workspaceId_provider: {
            workspaceId: Number(workspaceId),
            provider,
          },
        },
        update: data,
        create: data,
      });

      return { connector, error: null };
    } catch (error) {
      console.error("Failed to upsert connector token:", error);
      return { connector: null, error: error.message };
    }
  },

  /**
   * Get a specific connection
   */
  get: async function ({ workspaceId, provider }) {
    try {
      const connector = await prisma.connector_tokens.findUnique({
        where: {
          workspaceId_provider: {
            workspaceId: Number(workspaceId),
            provider,
          },
        },
      });

      if (connector && connector.metadata) {
        connector.metadata = JSON.parse(connector.metadata);
      }

      return connector;
    } catch (error) {
      console.error("Failed to get connector:", error);
      return null;
    }
  },

  /**
   * List all connections for a workspace
   */
  forWorkspace: async function (workspaceId) {
    try {
      const connectors = await prisma.connector_tokens.findMany({
        where: { workspaceId: Number(workspaceId) },
      });

      return connectors.map((conn) => ({
        ...conn,
        metadata: conn.metadata ? JSON.parse(conn.metadata) : {},
      }));
    } catch (error) {
      console.error("Failed to list connectors:", error);
      return [];
    }
  },

  /**
   * Delete a connection
   */
  delete: async function ({ workspaceId, provider }) {
    try {
      await prisma.connector_tokens.delete({
        where: {
          workspaceId_provider: {
            workspaceId: Number(workspaceId),
            provider,
          },
        },
      });
      return true;
    } catch (error) {
      console.error("Failed to delete connector:", error);
      return false;
    }
  },

  /**
   * Update sync status
   */
  updateSyncStatus: async function ({ workspaceId, provider, status }) {
    try {
      await prisma.connector_tokens.update({
        where: {
          workspaceId_provider: {
            workspaceId: Number(workspaceId),
            provider,
          },
        },
        data: {
          status,
          lastSync: status === "connected" ? new Date() : undefined,
        },
      });
      return true;
    } catch (error) {
      console.error("Failed to update sync status:", error);
      return false;
    }
  },
};

module.exports = { ConnectorTokens };