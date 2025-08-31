const prisma = require("../utils/prisma");

const ThreadParticipants = {
  ROLES: {
    OWNER: "owner",
    CONTRIBUTOR: "contributor",
    VIEWER: "viewer",
  },

  /**
   * Add a participant to a thread
   */
  add: async function ({
    threadId,
    userId,
    role = this.ROLES.VIEWER,
    canEdit = false,
    canDelete = false,
  }) {
    try {
      const participant = await prisma.thread_participants.create({
        data: {
          thread_id: Number(threadId),
          user_id: Number(userId),
          role,
          can_edit: canEdit,
          can_delete: canDelete,
        },
      });
      return { participant, error: null };
    } catch (error) {
      console.error("Failed to add thread participant:", error.message);
      return { participant: null, error: error.message };
    }
  },

  /**
   * Remove a participant from a thread
   */
  remove: async function (threadId, userId) {
    try {
      await prisma.thread_participants.delete({
        where: {
          thread_id_user_id: {
            thread_id: Number(threadId),
            user_id: Number(userId),
          },
        },
      });
      return { success: true, error: null };
    } catch (error) {
      console.error("Failed to remove thread participant:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Update participant permissions
   */
  updatePermissions: async function ({
    threadId,
    userId,
    role,
    canEdit,
    canDelete,
  }) {
    try {
      const data = {};
      if (role !== undefined) data.role = role;
      if (canEdit !== undefined) data.can_edit = canEdit;
      if (canDelete !== undefined) data.can_delete = canDelete;

      const participant = await prisma.thread_participants.update({
        where: {
          thread_id_user_id: {
            thread_id: Number(threadId),
            user_id: Number(userId),
          },
        },
        data,
      });
      return { participant, error: null };
    } catch (error) {
      console.error("Failed to update participant permissions:", error.message);
      return { participant: null, error: error.message };
    }
  },

  /**
   * Get all participants for a thread
   */
  getThreadParticipants: async function (threadId, includeUserDetails = false) {
    try {
      const participants = await prisma.thread_participants.findMany({
        where: {
          thread_id: Number(threadId),
        },
        ...(includeUserDetails && {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                pfpFilename: true,
                role: true,
              },
            },
          },
        }),
        orderBy: {
          joined_at: "asc",
        },
      });
      return participants;
    } catch (error) {
      console.error("Failed to get thread participants:", error.message);
      return [];
    }
  },

  /**
   * Get all threads a user participates in
   */
  getUserThreads: async function (userId, workspaceId = null) {
    try {
      const where = {
        user_id: Number(userId),
      };

      if (workspaceId) {
        where.thread = {
          workspace_id: Number(workspaceId),
        };
      }

      const participants = await prisma.thread_participants.findMany({
        where,
        include: {
          thread: {
            select: {
              id: true,
              name: true,
              slug: true,
              workspace_id: true,
              createdAt: true,
              lastUpdatedAt: true,
            },
          },
        },
        orderBy: {
          last_seen_at: "desc",
        },
      });

      return participants.map((p) => ({
        ...p.thread,
        role: p.role,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
        joined_at: p.joined_at,
        last_seen_at: p.last_seen_at,
      }));
    } catch (error) {
      console.error("Failed to get user threads:", error.message);
      return [];
    }
  },

  /**
   * Check if a user has access to a thread
   */
  hasAccess: async function (threadId, userId) {
    try {
      const participant = await prisma.thread_participants.findUnique({
        where: {
          thread_id_user_id: {
            thread_id: Number(threadId),
            user_id: Number(userId),
          },
        },
      });
      return !!participant;
    } catch (error) {
      console.error("Failed to check thread access:", error.message);
      return false;
    }
  },

  /**
   * Check if a user can edit a thread
   */
  canEdit: async function (threadId, userId) {
    try {
      const participant = await prisma.thread_participants.findUnique({
        where: {
          thread_id_user_id: {
            thread_id: Number(threadId),
            user_id: Number(userId),
          },
        },
      });
      return participant?.can_edit || false;
    } catch (error) {
      console.error("Failed to check edit permission:", error.message);
      return false;
    }
  },

  /**
   * Check if a user can delete a thread
   */
  canDelete: async function (threadId, userId) {
    try {
      const participant = await prisma.thread_participants.findUnique({
        where: {
          thread_id_user_id: {
            thread_id: Number(threadId),
            user_id: Number(userId),
          },
        },
      });
      return participant?.can_delete || false;
    } catch (error) {
      console.error("Failed to check delete permission:", error.message);
      return false;
    }
  },

  /**
   * Update last seen timestamp
   */
  updateLastSeen: async function (threadId, userId) {
    try {
      await prisma.thread_participants.update({
        where: {
          thread_id_user_id: {
            thread_id: Number(threadId),
            user_id: Number(userId),
          },
        },
        data: {
          last_seen_at: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error("Failed to update last seen:", error.message);
      return false;
    }
  },

  /**
   * Bulk add participants to a thread
   */
  bulkAdd: async function (threadId, participants = []) {
    try {
      const data = participants.map((p) => ({
        thread_id: Number(threadId),
        user_id: Number(p.userId),
        role: p.role || this.ROLES.VIEWER,
        can_edit: p.canEdit || false,
        can_delete: p.canDelete || false,
      }));

      const created = await prisma.thread_participants.createMany({
        data,
        skipDuplicates: true,
      });

      return { count: created.count, error: null };
    } catch (error) {
      console.error("Failed to bulk add participants:", error.message);
      return { count: 0, error: error.message };
    }
  },
};

module.exports = { ThreadParticipants };