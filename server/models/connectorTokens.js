const prisma = require("../utils/prisma");

/**
 * Connector Tokens model - follows the same pattern as SystemSettings
 * Manages OAuth connections via Nango for workspace data sources
 */
const ConnectorTokens = {
  /**
   * Create or update a connector connection (supports both workspace and user level)
   */
  upsert: async function ({ workspaceId, userId, provider, nangoConnectionId, status = "connected", metadata = {}, supabaseTokenRef = null }) {
    try {
      const scope = userId ? "user" : "workspace";
      const data = {
        provider,
        nangoConnectionId,
        status,
        metadata: JSON.stringify(metadata),
        scope,
        supabaseTokenRef,
      };

      // Add the appropriate ID based on scope
      if (scope === "user") {
        data.userId = Number(userId);
        data.workspaceId = null;
      } else {
        data.workspaceId = Number(workspaceId);
        data.userId = null;
      }

      const whereClause = scope === "user" 
        ? {
            userId_provider: {
              userId: Number(userId),
              provider,
            },
          }
        : {
            workspaceId_provider: {
              workspaceId: Number(workspaceId),
              provider,
            },
          };

      const connector = await prisma.connector_tokens.upsert({
        where: whereClause,
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
   * Get a specific connection (supports both workspace and user level)
   */
  get: async function ({ workspaceId, userId, provider }) {
    try {
      const whereClause = userId
        ? {
            userId_provider: {
              userId: Number(userId),
              provider,
            },
          }
        : {
            workspaceId_provider: {
              workspaceId: Number(workspaceId),
              provider,
            },
          };

      const connector = await prisma.connector_tokens.findUnique({
        where: whereClause,
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
   * Update last sync timestamp
   */
  updateLastSync: async function (workspaceId, provider) {
    try {
      const connector = await prisma.connector_tokens.update({
        where: {
          workspaceId_provider: {
            workspaceId: Number(workspaceId),
            provider,
          },
        },
        data: {
          lastSync: new Date(),
        },
      });
      return { connector, error: null };
    } catch (error) {
      console.error("Failed to update lastSync:", error);
      return { connector: null, error: error.message };
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
  updateSyncStatus: async function ({ workspaceId, userId, provider, status }) {
    try {
      const whereClause = userId
        ? {
            userId_provider: {
              userId: Number(userId),
              provider,
            },
          }
        : {
            workspaceId_provider: {
              workspaceId: Number(workspaceId),
              provider,
            },
          };

      await prisma.connector_tokens.update({
        where: whereClause,
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

  /**
   * List all connections for a user
   */
  forUser: async function (userId) {
    try {
      const connectors = await prisma.connector_tokens.findMany({
        where: { 
          userId: Number(userId),
          scope: "user"
        },
      });

      return connectors.map((conn) => ({
        ...conn,
        metadata: conn.metadata ? JSON.parse(conn.metadata) : {},
      }));
    } catch (error) {
      console.error("Failed to list user connectors:", error);
      return [];
    }
  },

  /**
   * Get all available connectors for a workspace (including inherited user connectors)
   */
  getAvailableForWorkspace: async function (workspaceId, userId = null) {
    try {
      const conditions = [
        { workspaceId: Number(workspaceId), scope: "workspace" }
      ];
      
      // If userId is provided, also get user-level connectors
      if (userId) {
        conditions.push({ userId: Number(userId), scope: "user" });
      }

      const connectors = await prisma.connector_tokens.findMany({
        where: {
          OR: conditions,
        },
      });

      return connectors.map((conn) => ({
        ...conn,
        metadata: conn.metadata ? JSON.parse(conn.metadata) : {},
      }));
    } catch (error) {
      console.error("Failed to get available connectors:", error);
      return [];
    }
  },

  /**
   * Delete a connection (supports both workspace and user level)
   */
  deleteConnector: async function ({ workspaceId, userId, provider }) {
    try {
      const whereClause = userId
        ? {
            userId_provider: {
              userId: Number(userId),
              provider,
            },
          }
        : {
            workspaceId_provider: {
              workspaceId: Number(workspaceId),
              provider,
            },
          };

      await prisma.connector_tokens.delete({
        where: whereClause,
      });
      return true;
    } catch (error) {
      console.error("Failed to delete connector:", error);
      return false;
    }
  },

  /**
   * Get all connectors (for single-user mode)
   */
  all: async function () {
    try {
      const connectors = await prisma.connector_tokens.findMany();

      return connectors.map((conn) => ({
        ...conn,
        metadata: conn.metadata ? JSON.parse(conn.metadata) : {},
      }));
    } catch (error) {
      console.error("Failed to list all connectors:", error);
      return [];
    }
  },

  /**
   * Get connector by provider only (for single-user mode)
   */
  getByProvider: async function (provider) {
    try {
      const connector = await prisma.connector_tokens.findFirst({
        where: { provider },
      });

      if (connector && connector.metadata) {
        connector.metadata = JSON.parse(connector.metadata);
      }

      return connector;
    } catch (error) {
      console.error("Failed to get connector by provider:", error);
      return null;
    }
  },

  /**
   * Delete connector by provider only (for single-user mode)
   */
  deleteByProvider: async function (provider) {
    try {
      await prisma.connector_tokens.deleteMany({
        where: { provider },
      });
      return true;
    } catch (error) {
      console.error("Failed to delete connector by provider:", error);
      return false;
    }
  },
};

module.exports = { ConnectorTokens };