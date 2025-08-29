const { reqBody, userFromSession, multiUserMode } = require("../utils/http");
const { User } = require("../models/user");
const { Workspace } = require("../models/workspace");
const { WorkspaceUser } = require("../models/workspaceUsers");
const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { 
  flexUserRoleValid,
  strictMultiUserRoleValid,
  ROLES 
} = require("../utils/middleware/multiUserProtected");
const { 
  supabaseAdmin,
  listSupabaseUsers,
  getSupabaseUser,
  updateUserMetadata
} = require("../utils/supabase");
const { EventLogs } = require("../models/eventLogs");

function supabaseIntegrationEndpoints(app) {
  if (!app) return;

  // List all Supabase users with local sync status
  app.get(
    "/admin/supabase/users",
    [validatedRequest, strictMultiUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        if (!multiUserMode(response)) {
          return response
            .status(401)
            .send("Instance is not in Multi-User mode. Permission denied.");
        }

        const { users: supabaseUsers, error } = await listSupabaseUsers();
        if (error) {
          return response.status(500).json({ error });
        }

        // Get sync status for each Supabase user
        const usersWithSyncStatus = await Promise.all(
          supabaseUsers.map(async (supabaseUser) => {
            const localUser = await User.getBySupabaseId(supabaseUser.id);
            return {
              id: supabaseUser.id,
              email: supabaseUser.email,
              role: supabaseUser.app_metadata?.role || 'default',
              created_at: supabaseUser.created_at,
              last_sign_in_at: supabaseUser.last_sign_in_at,
              synced: !!localUser,
              local_user_id: localUser?.id || null,
              local_username: localUser?.username || null
            };
          })
        );

        response.status(200).json({ users: usersWithSyncStatus });
      } catch (e) {
        console.error("Error listing Supabase users:", e.message);
        response.sendStatus(500).end();
      }
    }
  );

  // Sync a specific Supabase user to local database
  app.post(
    "/admin/supabase/users/:supabaseId/sync",
    [validatedRequest, strictMultiUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { supabaseId } = request.params;
        const adminUser = await userFromSession(request, response);
        
        // Get Supabase user data
        const { user: supabaseUser, error } = await getSupabaseUser(supabaseId);
        if (error || !supabaseUser) {
          return response.status(404).json({ 
            success: false, 
            error: error || "Supabase user not found" 
          });
        }

        // Create or sync local user
        const { user: localUser, error: syncError } = await User.createFromSupabase(supabaseUser);
        if (syncError) {
          return response.status(500).json({ 
            success: false, 
            error: syncError 
          });
        }

        await EventLogs.logEvent(
          "supabase_user_synced",
          {
            supabase_id: supabaseId,
            local_user_id: localUser.id,
            synced_by: adminUser?.username || "Unknown admin"
          },
          adminUser?.id
        );

        response.status(200).json({ 
          success: true, 
          user: localUser,
          message: "User synced successfully" 
        });
      } catch (e) {
        console.error("Error syncing Supabase user:", e.message);
        response.status(500).json({ 
          success: false, 
          error: "Failed to sync user" 
        });
      }
    }
  );

  // Bulk sync multiple Supabase users
  app.post(
    "/admin/supabase/users/bulk-sync",
    [validatedRequest, strictMultiUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { supabaseUserIds } = reqBody(request);
        const adminUser = await userFromSession(request, response);
        
        if (!Array.isArray(supabaseUserIds)) {
          return response.status(400).json({ 
            success: false, 
            error: "supabaseUserIds must be an array" 
          });
        }

        const results = [];
        for (const supabaseId of supabaseUserIds) {
          const { user: supabaseUser, error } = await getSupabaseUser(supabaseId);
          if (error || !supabaseUser) {
            results.push({ supabaseId, success: false, error: error || "User not found" });
            continue;
          }

          const { user: localUser, error: syncError } = await User.createFromSupabase(supabaseUser);
          if (syncError) {
            results.push({ supabaseId, success: false, error: syncError });
            continue;
          }

          results.push({ 
            supabaseId, 
            success: true, 
            localUserId: localUser.id,
            username: localUser.username 
          });
        }

        await EventLogs.logEvent(
          "supabase_bulk_sync",
          {
            total_users: supabaseUserIds.length,
            successful_syncs: results.filter(r => r.success).length,
            synced_by: adminUser?.username || "Unknown admin"
          },
          adminUser?.id
        );

        response.status(200).json({ 
          success: true, 
          results,
          summary: {
            total: supabaseUserIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
          }
        });
      } catch (e) {
        console.error("Error bulk syncing Supabase users:", e.message);
        response.status(500).json({ 
          success: false, 
          error: "Failed to bulk sync users" 
        });
      }
    }
  );

  // Assign Supabase users to workspace
  app.post(
    "/admin/workspaces/:workspaceId/add-supabase-users",
    [validatedRequest, strictMultiUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { workspaceId } = request.params;
        const { supabaseUserIds } = reqBody(request);
        const adminUser = await userFromSession(request, response);
        
        if (!Array.isArray(supabaseUserIds)) {
          return response.status(400).json({ 
            success: false, 
            error: "supabaseUserIds must be an array" 
          });
        }

        // First, sync all Supabase users to local database
        const localUserIds = [];
        for (const supabaseId of supabaseUserIds) {
          const { user: supabaseUser, error } = await getSupabaseUser(supabaseId);
          if (error || !supabaseUser) {
            continue; // Skip invalid users
          }

          const { user: localUser } = await User.createFromSupabase(supabaseUser);
          if (localUser) {
            localUserIds.push(localUser.id);
          }
        }

        if (localUserIds.length === 0) {
          return response.status(400).json({ 
            success: false, 
            error: "No valid Supabase users found" 
          });
        }

        // Add users to workspace using existing logic
        await WorkspaceUser.createManyUsers(localUserIds, workspaceId);

        await EventLogs.logEvent(
          "supabase_users_added_to_workspace",
          {
            workspace_id: workspaceId,
            supabase_user_ids: supabaseUserIds,
            local_user_ids: localUserIds,
            added_by: adminUser?.username || "Unknown admin"
          },
          adminUser?.id
        );

        response.status(200).json({ 
          success: true,
          message: `Successfully added ${localUserIds.length} users to workspace`,
          added_users: localUserIds.length
        });
      } catch (e) {
        console.error("Error adding Supabase users to workspace:", e.message);
        response.status(500).json({ 
          success: false, 
          error: "Failed to add users to workspace" 
        });
      }
    }
  );

  // Update Supabase user role
  app.put(
    "/admin/supabase/users/:supabaseId/role",
    [validatedRequest, strictMultiUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const { supabaseId } = request.params;
        const { role } = reqBody(request);
        const adminUser = await userFromSession(request, response);
        
        if (!['admin', 'manager', 'default'].includes(role)) {
          return response.status(400).json({ 
            success: false, 
            error: "Invalid role. Must be 'admin', 'manager', or 'default'" 
          });
        }

        // Update Supabase user metadata
        const { user, error } = await updateUserMetadata(supabaseId, { role });
        if (error) {
          return response.status(500).json({ success: false, error });
        }

        // Sync to local database if user exists locally
        const localUser = await User.getBySupabaseId(supabaseId);
        if (localUser) {
          await User.update(localUser.id, { role });
        }

        await EventLogs.logEvent(
          "supabase_user_role_updated",
          {
            supabase_id: supabaseId,
            new_role: role,
            updated_by: adminUser?.username || "Unknown admin"
          },
          adminUser?.id
        );

        response.status(200).json({ 
          success: true,
          message: "User role updated successfully"
        });
      } catch (e) {
        console.error("Error updating Supabase user role:", e.message);
        response.status(500).json({ 
          success: false, 
          error: "Failed to update user role" 
        });
      }
    }
  );
}

module.exports = { supabaseIntegrationEndpoints };