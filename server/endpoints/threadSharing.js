const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { WorkspaceThread } = require("../models/workspaceThread");
const { ThreadParticipants } = require("../models/threadParticipants");
const { User } = require("../models/user");
const { Workspace } = require("../models/workspace");
const { multiUserMode, userFromSession } = require("../utils/http");

function threadSharingEndpoints(app) {
  if (!app) return;

  // Share a thread with users
  app.post(
    "/workspace/:slug/thread/:threadSlug/share",
    [validatedRequest],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        if (!user) {
          return response.status(401).json({
            success: false,
            error: "Unauthorized",
          });
        }

        const { slug, threadSlug } = request.params;
        const { participants = [] } = request.body;

        const workspace = await Workspace.getBySlug(slug);
        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        const thread = await WorkspaceThread.get({
          slug: threadSlug,
          workspace_id: workspace.id,
        });

        if (!thread) {
          return response.status(404).json({
            success: false,
            error: "Thread not found",
          });
        }

        // Validate and prepare participants
        const validParticipants = [];
        for (const participant of participants) {
          const targetUser = await User.get({ id: participant.userId });
          if (!targetUser) continue;

          // Check if user has access to workspace
          const hasWorkspaceAccess = await Workspace.userHasAccess(
            workspace.id,
            targetUser.id
          );
          if (!hasWorkspaceAccess) continue;

          validParticipants.push({
            userId: targetUser.id,
            role: participant.role || ThreadParticipants.ROLES.VIEWER,
            canEdit: participant.canEdit || false,
            canDelete: participant.canDelete || false,
          });
        }

        const result = await WorkspaceThread.shareThread(
          thread.id,
          user.id,
          validParticipants
        );

        return response.json(result);
      } catch (error) {
        console.error("Error sharing thread:", error);
        return response.status(500).json({
          success: false,
          error: "Failed to share thread",
        });
      }
    }
  );

  // Remove a participant from a thread
  app.delete(
    "/workspace/:slug/thread/:threadSlug/share/:userId",
    [validatedRequest],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        if (!user) {
          return response.status(401).json({
            success: false,
            error: "Unauthorized",
          });
        }

        const { slug, threadSlug, userId } = request.params;

        const workspace = await Workspace.getBySlug(slug);
        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        const thread = await WorkspaceThread.get({
          slug: threadSlug,
          workspace_id: workspace.id,
        });

        if (!thread) {
          return response.status(404).json({
            success: false,
            error: "Thread not found",
          });
        }

        const result = await WorkspaceThread.unshareThread(
          thread.id,
          user.id,
          userId
        );

        return response.json(result);
      } catch (error) {
        console.error("Error removing participant:", error);
        return response.status(500).json({
          success: false,
          error: "Failed to remove participant",
        });
      }
    }
  );

  // Get thread participants
  app.get(
    "/workspace/:slug/thread/:threadSlug/participants",
    [validatedRequest],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        if (!user) {
          return response.status(401).json({
            success: false,
            error: "Unauthorized",
          });
        }

        const { slug, threadSlug } = request.params;

        const workspace = await Workspace.getBySlug(slug);
        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        const thread = await WorkspaceThread.get({
          slug: threadSlug,
          workspace_id: workspace.id,
        });

        if (!thread) {
          return response.status(404).json({
            success: false,
            error: "Thread not found",
          });
        }

        // Check if user has access to this thread
        const hasAccess = await WorkspaceThread.userHasAccess(
          thread.id,
          user.id
        );

        if (!hasAccess) {
          return response.status(403).json({
            success: false,
            error: "You don't have access to this thread",
          });
        }

        const participants = await ThreadParticipants.getThreadParticipants(
          thread.id,
          true // include user details
        );

        return response.json({
          success: true,
          participants,
        });
      } catch (error) {
        console.error("Error getting participants:", error);
        return response.status(500).json({
          success: false,
          error: "Failed to get participants",
        });
      }
    }
  );

  // Get user's shared threads in a workspace
  app.get(
    "/workspace/:slug/threads/shared",
    [validatedRequest],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        if (!user) {
          return response.status(401).json({
            success: false,
            error: "Unauthorized",
          });
        }

        const { slug } = request.params;

        const workspace = await Workspace.getBySlug(slug);
        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        const sharedThreads = await WorkspaceThread.getSharedThreads(
          user.id,
          workspace.id
        );

        return response.json({
          success: true,
          threads: sharedThreads,
        });
      } catch (error) {
        console.error("Error getting shared threads:", error);
        return response.status(500).json({
          success: false,
          error: "Failed to get shared threads",
        });
      }
    }
  );

  // Update participant permissions
  app.put(
    "/workspace/:slug/thread/:threadSlug/participant/:userId",
    [validatedRequest],
    async (request, response) => {
      try {
        const user = await userFromSession(request, response);
        if (!user) {
          return response.status(401).json({
            success: false,
            error: "Unauthorized",
          });
        }

        const { slug, threadSlug, userId } = request.params;
        const { role, canEdit, canDelete } = request.body;

        const workspace = await Workspace.getBySlug(slug);
        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        const thread = await WorkspaceThread.get({
          slug: threadSlug,
          workspace_id: workspace.id,
        });

        if (!thread) {
          return response.status(404).json({
            success: false,
            error: "Thread not found",
          });
        }

        // Check if user has permission to update participants
        const isOwner = thread.user_id === user.id;
        const canManage =
          isOwner || (await ThreadParticipants.canDelete(thread.id, user.id));

        if (!canManage) {
          return response.status(403).json({
            success: false,
            error: "You don't have permission to update participants",
          });
        }

        const result = await ThreadParticipants.updatePermissions({
          threadId: thread.id,
          userId: Number(userId),
          role,
          canEdit,
          canDelete,
        });

        return response.json({
          success: !!result.participant,
          participant: result.participant,
          error: result.error,
        });
      } catch (error) {
        console.error("Error updating participant:", error);
        return response.status(500).json({
          success: false,
          error: "Failed to update participant",
        });
      }
    }
  );
}

module.exports = { threadSharingEndpoints };
