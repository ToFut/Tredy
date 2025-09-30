const prisma = require("../utils/prisma");

/**
 * Sync Cursors Model
 * Tracks sync cursors for incremental sync across providers
 */
const SyncCursors = {
  writable: ["cursor", "lastSyncAt", "recordCount", "status", "error"],

  /**
   * Get the last sync cursor for a provider/model combination
   */
  get: async function ({ workspaceId, provider, model }) {
    try {
      const cursor = await prisma.sync_cursors.findFirst({
        where: { workspaceId, provider, model },
      });
      return cursor;
    } catch (error) {
      console.error("[SyncCursors] Failed to get cursor:", error);
      return null;
    }
  },

  /**
   * Update or create a sync cursor
   */
  upsert: async function ({
    workspaceId,
    provider,
    model,
    cursor,
    recordCount = 0,
    status = "success",
    error = null,
  }) {
    try {
      const result = await prisma.sync_cursors.upsert({
        where: {
          workspaceId_provider_model: {
            workspaceId,
            provider,
            model,
          },
        },
        create: {
          workspaceId,
          provider,
          model,
          cursor,
          lastSyncAt: new Date(),
          recordCount,
          status,
          error,
        },
        update: {
          cursor,
          lastSyncAt: new Date(),
          recordCount,
          status,
          error,
        },
      });
      return result;
    } catch (error) {
      console.error("[SyncCursors] Failed to upsert cursor:", error);
      return null;
    }
  },

  /**
   * Get all cursors for a workspace
   */
  getForWorkspace: async function (workspaceId) {
    try {
      const cursors = await prisma.sync_cursors.findMany({
        where: { workspaceId },
        orderBy: { lastSyncAt: "desc" },
      });
      return cursors;
    } catch (error) {
      console.error("[SyncCursors] Failed to get workspace cursors:", error);
      return [];
    }
  },

  /**
   * Get all cursors for a provider across workspaces
   */
  getForProvider: async function (provider) {
    try {
      const cursors = await prisma.sync_cursors.findMany({
        where: { provider },
        orderBy: { lastSyncAt: "desc" },
      });
      return cursors;
    } catch (error) {
      console.error("[SyncCursors] Failed to get provider cursors:", error);
      return [];
    }
  },

  /**
   * Delete cursors (when connection is removed)
   */
  delete: async function ({ workspaceId, provider, model = null }) {
    try {
      const whereClause = { workspaceId, provider };
      if (model) {
        whereClause.model = model;
      }

      await prisma.sync_cursors.deleteMany({
        where: whereClause,
      });
      return true;
    } catch (error) {
      console.error("[SyncCursors] Failed to delete cursors:", error);
      return false;
    }
  },

  /**
   * Get sync statistics for reporting
   */
  getStats: async function (workspaceId) {
    try {
      const stats = await prisma.sync_cursors.groupBy({
        by: ["provider", "status"],
        where: { workspaceId },
        _count: {
          id: true,
        },
        _sum: {
          recordCount: true,
        },
        _max: {
          lastSyncAt: true,
        },
      });

      // Transform to easier format
      const result = {};
      stats.forEach((stat) => {
        if (!result[stat.provider]) {
          result[stat.provider] = {
            total: 0,
            totalRecords: 0,
            lastSync: null,
            byStatus: {},
          };
        }

        result[stat.provider].byStatus[stat.status] = stat._count.id;
        result[stat.provider].total += stat._count.id;
        result[stat.provider].totalRecords += stat._sum.recordCount || 0;

        if (
          !result[stat.provider].lastSync ||
          (stat._max.lastSyncAt &&
            stat._max.lastSyncAt > result[stat.provider].lastSync)
        ) {
          result[stat.provider].lastSync = stat._max.lastSyncAt;
        }
      });

      return result;
    } catch (error) {
      console.error("[SyncCursors] Failed to get stats:", error);
      return {};
    }
  },
};

module.exports = { SyncCursors };
