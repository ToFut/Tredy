const prisma = require("../utils/prisma");
const slugifyModule = require("slugify");
const { v4: uuidv4 } = require("uuid");

const { ThreadParticipants } = require("./threadParticipants");

const WorkspaceThread = {
  defaultName: "Thread",
  writable: ["name"],

  /**
   * The default Slugify module requires some additional mapping to prevent downstream issues
   * if the user is able to define a slug externally. We have to block non-escapable URL chars
   * so that is the slug is rendered it doesn't break the URL or UI when visited.
   * @param  {...any} args - slugify args for npm package.
   * @returns {string}
   */
  slugify: function (...args) {
    slugifyModule.extend({
      "+": " plus ",
      "!": " bang ",
      "@": " at ",
      "*": " splat ",
      ".": " dot ",
      ":": "",
      "~": "",
      "(": "",
      ")": "",
      "'": "",
      '"': "",
      "|": "",
    });
    return slugifyModule(...args);
  },

  new: async function (workspace, userId = null, data = {}) {
    try {
      const thread = await prisma.workspace_threads.create({
        data: {
          name: data.name ? String(data.name) : this.defaultName,
          slug: data.slug
            ? this.slugify(data.slug, { lowercase: true })
            : uuidv4(),
          user_id: userId ? Number(userId) : null,
          workspace_id: workspace.id,
        },
      });

      return { thread, message: null };
    } catch (error) {
      console.error(error.message);
      return { thread: null, message: error.message };
    }
  },

  update: async function (prevThread = null, data = {}) {
    if (!prevThread) throw new Error("No thread id provided for update");

    const validData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (!this.writable.includes(key)) return;
      validData[key] = value;
    });

    if (Object.keys(validData).length === 0)
      return { thread: prevThread, message: "No valid fields to update!" };

    try {
      const thread = await prisma.workspace_threads.update({
        where: { id: prevThread.id },
        data: validData,
      });
      return { thread, message: null };
    } catch (error) {
      console.error(error.message);
      return { thread: null, message: error.message };
    }
  },

  get: async function (clause = {}) {
    try {
      const thread = await prisma.workspace_threads.findFirst({
        where: clause,
      });

      return thread || null;
    } catch (error) {
      console.error(error.message);
      return null;
    }
  },

  delete: async function (clause = {}) {
    try {
      await prisma.workspace_threads.deleteMany({
        where: clause,
      });
      return true;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  },

  where: async function (
    clause = {},
    limit = null,
    orderBy = null,
    include = null
  ) {
    try {
      const results = await prisma.workspace_threads.findMany({
        where: clause,
        ...(limit !== null ? { take: limit } : {}),
        ...(orderBy !== null ? { orderBy } : {}),
        ...(include !== null ? { include } : {}),
      });
      return results;
    } catch (error) {
      console.error(error.message);
      return [];
    }
  },

  // Will fire on first message (included or not) for a thread and rename the thread with the newName prop.
  autoRenameThread: async function ({
    workspace = null,
    thread = null,
    user = null,
    newName = null,
    onRename = null,
  }) {
    if (!workspace || !thread || !newName) return false;
    if (thread.name !== this.defaultName) return false; // don't rename if already named.

    const { WorkspaceChats } = require("./workspaceChats");
    const chatCount = await WorkspaceChats.count({
      workspaceId: workspace.id,
      user_id: user?.id || null,
      thread_id: thread.id,
    });
    if (chatCount !== 1) return { renamed: false, thread };
    const { thread: updatedThread } = await this.update(thread, {
      name: newName,
    });

    onRename?.(updatedThread);
    return true;
  },

  /**
   * Share a thread with users
   */
  shareThread: async function (threadId, userId, participants = []) {
    try {
      // Verify the user owns the thread or has permission to share
      const thread = await this.get({ id: Number(threadId) });
      if (!thread) {
        return { success: false, error: "Thread not found" };
      }

      // Check if user is the thread owner or has permission
      const isOwner = thread.user_id === Number(userId);
      const canShare = isOwner || (await ThreadParticipants.canEdit(threadId, userId));

      if (!canShare) {
        return { success: false, error: "You don't have permission to share this thread" };
      }

      // Add the owner as a participant if not already
      if (isOwner) {
        await ThreadParticipants.add({
          threadId,
          userId,
          role: ThreadParticipants.ROLES.OWNER,
          canEdit: true,
          canDelete: true,
        });
      }

      // Add new participants
      const { count, error } = await ThreadParticipants.bulkAdd(threadId, participants);

      if (error) {
        return { success: false, error };
      }

      return { success: true, count };
    } catch (error) {
      console.error("Failed to share thread:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Unshare a thread with a user
   */
  unshareThread: async function (threadId, requestingUserId, targetUserId) {
    try {
      // Check if requesting user has permission to unshare
      const canDelete = await ThreadParticipants.canDelete(threadId, requestingUserId);
      const thread = await this.get({ id: Number(threadId) });
      const isOwner = thread?.user_id === Number(requestingUserId);

      if (!canDelete && !isOwner) {
        return { success: false, error: "You don't have permission to remove participants" };
      }

      // Don't allow removing the owner
      if (Number(targetUserId) === thread.user_id) {
        return { success: false, error: "Cannot remove the thread owner" };
      }

      const { success, error } = await ThreadParticipants.remove(threadId, targetUserId);
      return { success, error };
    } catch (error) {
      console.error("Failed to unshare thread:", error.message);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get all shared threads for a user in a workspace
   */
  getSharedThreads: async function (userId, workspaceId) {
    try {
      const sharedThreads = await ThreadParticipants.getUserThreads(userId, workspaceId);
      return sharedThreads;
    } catch (error) {
      console.error("Failed to get shared threads:", error.message);
      return [];
    }
  },

  /**
   * Check if a user has access to a thread
   */
  userHasAccess: async function (threadId, userId) {
    try {
      const thread = await this.get({ id: Number(threadId) });
      if (!thread) return false;

      // Check if user is the owner
      if (thread.user_id === Number(userId)) return true;

      // Check if user is a participant
      return await ThreadParticipants.hasAccess(threadId, userId);
    } catch (error) {
      console.error("Failed to check thread access:", error.message);
      return false;
    }
  },

  /**
   * Get thread with participants
   */
  getWithParticipants: async function (threadId) {
    try {
      const thread = await prisma.workspace_threads.findFirst({
        where: { id: Number(threadId) },
        include: {
          thread_participants: {
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
          },
        },
      });
      return thread;
    } catch (error) {
      console.error("Failed to get thread with participants:", error.message);
      return null;
    }
  },
};

module.exports = { WorkspaceThread };
