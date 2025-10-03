const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { reqBody } = require("../utils/http");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const TredyMarketplace = require("../models/tredyMarketplace");
const { EventLogs } = require("../models/eventLogs");
const { User } = require("../models/user");
const { Workspace } = require("../models/workspace");
const { MarketplacePurchase } = require("../models/marketplacePurchase");
const { getTenancyProvider } = require("../utils/tenancy");
const multer = require("multer");
const fs = require("fs").promises;
const path = require("path");

// Configure multer for file uploads
const upload = multer({
  dest: "/tmp/marketplace-uploads",
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

/**
 * Super admin endpoints for marketplace catalog management and platform analytics
 */
function superAdminEndpoints(app) {
  if (!app) return;

  /**
   * GET /super-admin/analytics
   * Get platform-wide analytics (super_admin only)
   */
  app.get(
    "/super-admin/analytics",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (_, response) => {
      try {
        const tenancy = getTenancyProvider();

        // Get counts
        const [users, workspaces, purchases, organizations] = await Promise.all([
          User.where({}),
          Workspace.where({}),
          MarketplacePurchase.where({ status: "completed" }),
          tenancy.getMode() === "multi"
            ? require("../models/organization").Organization.where({})
            : Promise.resolve([]),
        ]);

        // Calculate revenue
        const totalRevenueCents = purchases.reduce(
          (sum, p) => sum + (p.amountPaidCents || 0),
          0
        );

        // Get recent activity
        const recentEvents = await EventLogs.where({})
          .then((events) => events.slice(0, 50));

        response.status(200).json({
          success: true,
          analytics: {
            totalUsers: users.length,
            totalWorkspaces: workspaces.length,
            totalPurchases: purchases.length,
            totalOrganizations: organizations.length,
            totalRevenueCents,
            recentActivity: recentEvents,
          },
        });
      } catch (error) {
        console.error("Analytics error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /super-admin/marketplace/items
   * Get all marketplace items (including private/unlisted)
   */
  app.get(
    "/super-admin/marketplace/items",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();

        if (!marketplace.isEnabled()) {
          return response.status(400).json({
            success: false,
            error: "Marketplace not configured",
          });
        }

        const { limit = 100, offset = 0, itemType, visibility } = request.query;

        const { items, total, error } = await marketplace.fetchItems({
          limit: parseInt(limit),
          offset: parseInt(offset),
          itemType,
          visibility: visibility || undefined, // Fetch all visibilities
        });

        if (error) {
          return response.status(500).json({
            success: false,
            error,
          });
        }

        response.status(200).json({
          success: true,
          items,
          total,
        });
      } catch (error) {
        console.error("Get marketplace items error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /super-admin/marketplace/create-skill
   * Upload and create a new agent skill (ZIP file)
   */
  app.post(
    "/super-admin/marketplace/create-skill",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin]), upload.single("file")],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();

        if (!marketplace.isEnabled()) {
          return response.status(400).json({
            success: false,
            error: "Marketplace not configured",
          });
        }

        const file = request.file;
        const data = reqBody(request);
        const user = response.locals?.user;

        if (!file) {
          return response.status(400).json({
            success: false,
            error: "File is required",
          });
        }

        // Read file buffer
        const fileBuffer = await fs.readFile(file.path);

        // Upload to Supabase Storage
        const filePath = `agent-skills/${Date.now()}-${file.originalname}`;
        const { url, error: uploadError } = await marketplace.uploadFile(
          "marketplace-items",
          filePath,
          fileBuffer
        );

        // Clean up temp file
        await fs.unlink(file.path);

        if (uploadError) {
          return response.status(500).json({
            success: false,
            error: `Upload failed: ${uploadError}`,
          });
        }

        // Create marketplace item
        const { item, error: createError } = await marketplace.createItem({
          name: data.name,
          description: data.description,
          itemType: "agent-skill",
          priceCents: parseInt(data.priceCents) || 0,
          visibility: data.visibility || "public",
          author: data.author || "Tredy",
          version: data.version || "1.0.0",
          filePath,
          metadata: {
            fileUrl: url,
            fileName: file.originalname,
            fileSize: file.size,
          },
        });

        if (createError) {
          return response.status(500).json({
            success: false,
            error: `Item creation failed: ${createError}`,
          });
        }

        // Log event
        await EventLogs.logEvent(
          "marketplace_item_created",
          { itemId: item.id, itemType: "agent-skill", name: data.name },
          user?.id
        );

        response.status(200).json({
          success: true,
          item,
        });
      } catch (error) {
        console.error("Create skill error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /super-admin/marketplace/create-item
   * Create a system prompt or slash command (text-based, no upload)
   */
  app.post(
    "/super-admin/marketplace/create-item",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();

        if (!marketplace.isEnabled()) {
          return response.status(400).json({
            success: false,
            error: "Marketplace not configured",
          });
        }

        const data = reqBody(request);
        const user = response.locals?.user;

        if (!["system-prompt", "slash-command"].includes(data.itemType)) {
          return response.status(400).json({
            success: false,
            error: "Invalid item type. Use create-skill for agent skills.",
          });
        }

        const { item, error: createError } = await marketplace.createItem({
          name: data.name,
          description: data.description,
          itemType: data.itemType,
          priceCents: parseInt(data.priceCents) || 0,
          visibility: data.visibility || "public",
          author: data.author || "Tredy",
          version: data.version || "1.0.0",
          content: data.content, // Prompt text or slash command config
          metadata: data.metadata || {},
        });

        if (createError) {
          return response.status(500).json({
            success: false,
            error: `Item creation failed: ${createError}`,
          });
        }

        // Log event
        await EventLogs.logEvent(
          "marketplace_item_created",
          { itemId: item.id, itemType: data.itemType, name: data.name },
          user?.id
        );

        response.status(200).json({
          success: true,
          item,
        });
      } catch (error) {
        console.error("Create item error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * PUT /super-admin/marketplace/items/:hubId
   * Update a marketplace item
   */
  app.put(
    "/super-admin/marketplace/items/:hubId",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();

        if (!marketplace.isEnabled()) {
          return response.status(400).json({
            success: false,
            error: "Marketplace not configured",
          });
        }

        const { hubId } = request.params;
        const data = reqBody(request);
        const user = response.locals?.user;

        const { item, error: updateError } = await marketplace.updateItem(hubId, {
          name: data.name,
          description: data.description,
          price_cents: data.priceCents ? parseInt(data.priceCents) : undefined,
          visibility: data.visibility,
          version: data.version,
          content: data.content,
          metadata: data.metadata,
        });

        if (updateError) {
          return response.status(500).json({
            success: false,
            error: `Update failed: ${updateError}`,
          });
        }

        // Log event
        await EventLogs.logEvent(
          "marketplace_item_updated",
          { itemId: hubId },
          user?.id
        );

        response.status(200).json({
          success: true,
          item,
        });
      } catch (error) {
        console.error("Update item error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * DELETE /super-admin/marketplace/items/:hubId
   * Delete a marketplace item
   */
  app.delete(
    "/super-admin/marketplace/items/:hubId",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();

        if (!marketplace.isEnabled()) {
          return response.status(400).json({
            success: false,
            error: "Marketplace not configured",
          });
        }

        const { hubId } = request.params;
        const user = response.locals?.user;

        const { success, error: deleteError } = await marketplace.deleteItem(hubId);

        if (deleteError || !success) {
          return response.status(500).json({
            success: false,
            error: `Delete failed: ${deleteError}`,
          });
        }

        // Log event
        await EventLogs.logEvent(
          "marketplace_item_deleted",
          { itemId: hubId },
          user?.id
        );

        response.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Delete item error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /super-admin/users
   * Get all users with filtering
   */
  app.get(
    "/super-admin/users",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { organizationId } = request.query;

        const where = {};
        if (organizationId) {
          where.organizationId = parseInt(organizationId);
        }

        const users = await User.where(where);

        response.status(200).json({
          success: true,
          users,
        });
      } catch (error) {
        console.error("Get users error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /super-admin/users/:userId/role
   * Update a user's role (promote to admin, super_admin, etc.)
   */
  app.post(
    "/super-admin/users/:userId/role",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { userId } = request.params;
        const { role } = reqBody(request);
        const currentUser = response.locals?.user;

        const validRoles = ["default", "manager", "admin", "super_admin"];
        if (!validRoles.includes(role)) {
          return response.status(400).json({
            success: false,
            error: "Invalid role",
          });
        }

        const user = await User.update(parseInt(userId), { role });

        if (!user) {
          return response.status(500).json({
            success: false,
            error: "Failed to update user role",
          });
        }

        // Log event
        await EventLogs.logEvent(
          "user_role_updated",
          { userId: parseInt(userId), newRole: role },
          currentUser?.id
        );

        response.status(200).json({
          success: true,
          user,
        });
      } catch (error) {
        console.error("Update user role error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );
}

module.exports = { superAdminEndpoints };
