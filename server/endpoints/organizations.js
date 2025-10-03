const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { reqBody } = require("../utils/http");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { Organization } = require("../models/organization");
const { User } = require("../models/user");
const { getTenancyProvider, isMultiTenant } = require("../utils/tenancy");
const { EventLogs } = require("../models/eventLogs");

/**
 * Organization management endpoints (only active in multi-tenant mode)
 */
function organizationEndpoints(app) {
  if (!app) return;

  /**
   * GET /organizations
   * Get all organizations (super_admin only)
   */
  app.get(
    "/organizations",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (_, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const organizations = await Organization.where({});

        response.status(200).json({
          success: true,
          organizations,
        });
      } catch (error) {
        console.error("Get organizations error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /organizations/:id
   * Get a single organization
   */
  app.get(
    "/organizations/:id",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin, ROLES.admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id } = request.params;
        const user = response.locals?.user;

        // Admins can only view their own org
        if (user?.role === ROLES.admin) {
          if (user.organizationId !== parseInt(id)) {
            return response.status(403).json({
              success: false,
              error: "Access denied",
            });
          }
        }

        const organization = await Organization.getWithStats(parseInt(id));

        if (!organization) {
          return response.status(404).json({
            success: false,
            error: "Organization not found",
          });
        }

        response.status(200).json({
          success: true,
          organization,
        });
      } catch (error) {
        console.error("Get organization error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /organizations
   * Create a new organization (super_admin only)
   */
  app.post(
    "/organizations",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const data = reqBody(request);
        const user = response.locals?.user;

        const organization = await Organization.create({
          name: data.name,
          slug: data.slug,
          tier: data.tier || "internal",
          stripeCustomerId: data.stripeCustomerId,
          subscriptionTier: data.subscriptionTier || "free",
          customDomain: data.customDomain,
          logoFilename: data.logoFilename,
          settings: data.settings,
        });

        if (!organization) {
          return response.status(500).json({
            success: false,
            error: "Failed to create organization",
          });
        }

        // Log event
        await EventLogs.logEvent(
          "organization_created",
          { organizationId: organization.id, name: organization.name },
          user?.id
        );

        response.status(200).json({
          success: true,
          organization,
        });
      } catch (error) {
        console.error("Create organization error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * PUT /organizations/:id
   * Update an organization
   */
  app.put(
    "/organizations/:id",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin, ROLES.admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id } = request.params;
        const data = reqBody(request);
        const user = response.locals?.user;

        // Admins can only update their own org
        if (user?.role === ROLES.admin) {
          if (user.organizationId !== parseInt(id)) {
            return response.status(403).json({
              success: false,
              error: "Access denied",
            });
          }
        }

        const organization = await Organization.update(parseInt(id), {
          name: data.name,
          tier: data.tier,
          stripeCustomerId: data.stripeCustomerId,
          subscriptionTier: data.subscriptionTier,
          customDomain: data.customDomain,
          logoFilename: data.logoFilename,
          settings: data.settings,
        });

        if (!organization) {
          return response.status(500).json({
            success: false,
            error: "Failed to update organization",
          });
        }

        // Log event
        await EventLogs.logEvent(
          "organization_updated",
          { organizationId: organization.id },
          user?.id
        );

        response.status(200).json({
          success: true,
          organization,
        });
      } catch (error) {
        console.error("Update organization error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * DELETE /organizations/:id
   * Delete an organization (super_admin only)
   */
  app.delete(
    "/organizations/:id",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id } = request.params;
        const user = response.locals?.user;

        const success = await Organization.delete(parseInt(id));

        if (!success) {
          return response.status(500).json({
            success: false,
            error: "Failed to delete organization",
          });
        }

        // Log event
        await EventLogs.logEvent(
          "organization_deleted",
          { organizationId: parseInt(id) },
          user?.id
        );

        response.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Delete organization error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /organizations/:id/users
   * Get all users in an organization
   */
  app.get(
    "/organizations/:id/users",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin, ROLES.admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id } = request.params;
        const user = response.locals?.user;

        // Admins can only view their own org users
        if (user?.role === ROLES.admin) {
          if (user.organizationId !== parseInt(id)) {
            return response.status(403).json({
              success: false,
              error: "Access denied",
            });
          }
        }

        const users = await User.where({ organizationId: parseInt(id) });

        response.status(200).json({
          success: true,
          users,
        });
      } catch (error) {
        console.error("Get organization users error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /organizations/:id/users
   * Add a user to an organization
   */
  app.post(
    "/organizations/:id/users",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin, ROLES.admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id } = request.params;
        const { userId } = reqBody(request);
        const currentUser = response.locals?.user;

        // Admins can only add users to their own org
        if (currentUser?.role === ROLES.admin) {
          if (currentUser.organizationId !== parseInt(id)) {
            return response.status(403).json({
              success: false,
              error: "Access denied",
            });
          }
        }

        const updatedUser = await Organization.addUser(parseInt(id), userId);

        if (!updatedUser) {
          return response.status(500).json({
            success: false,
            error: "Failed to add user to organization",
          });
        }

        // Log event
        await EventLogs.logEvent(
          "user_added_to_organization",
          { organizationId: parseInt(id), userId },
          currentUser?.id
        );

        response.status(200).json({
          success: true,
          user: updatedUser,
        });
      } catch (error) {
        console.error("Add user to organization error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * DELETE /organizations/:id/users/:userId
   * Remove a user from an organization
   */
  app.delete(
    "/organizations/:id/users/:userId",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin, ROLES.admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id, userId } = request.params;
        const currentUser = response.locals?.user;

        // Admins can only remove users from their own org
        if (currentUser?.role === ROLES.admin) {
          if (currentUser.organizationId !== parseInt(id)) {
            return response.status(403).json({
              success: false,
              error: "Access denied",
            });
          }
        }

        const updatedUser = await Organization.removeUser(parseInt(userId));

        if (!updatedUser) {
          return response.status(500).json({
            success: false,
            error: "Failed to remove user from organization",
          });
        }

        // Log event
        await EventLogs.logEvent(
          "user_removed_from_organization",
          { organizationId: parseInt(id), userId: parseInt(userId) },
          currentUser?.id
        );

        response.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Remove user from organization error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /organizations/:id/purchases
   * Get all purchases for an organization
   */
  app.get(
    "/organizations/:id/purchases",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin, ROLES.admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id } = request.params;
        const user = response.locals?.user;

        // Admins can only view their own org purchases
        if (user?.role === ROLES.admin) {
          if (user.organizationId !== parseInt(id)) {
            return response.status(403).json({
              success: false,
              error: "Access denied",
            });
          }
        }

        const { MarketplacePurchase } = require("../models/marketplacePurchase");
        const purchases = await MarketplacePurchase.where({
          organizationId: parseInt(id),
        });

        response.status(200).json({
          success: true,
          purchases,
        });
      } catch (error) {
        console.error("Get organization purchases error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /organizations/:id/assign-skills
   * Assign marketplace skills to organization (creates purchases)
   */
  app.post(
    "/organizations/:id/assign-skills",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id } = request.params;
        const { skillIds } = reqBody(request);
        const user = response.locals?.user;

        if (!skillIds || !Array.isArray(skillIds)) {
          return response.status(400).json({
            success: false,
            error: "skillIds must be an array",
          });
        }

        const { MarketplacePurchase } = require("../models/marketplacePurchase");

        // Create purchase records for each skill (amount 0 for assigned skills)
        const purchases = [];
        for (const skillId of skillIds) {
          const purchase = await MarketplacePurchase.create({
            hubId: skillId,
            userId: null, // Organization-level assignment
            organizationId: parseInt(id),
            itemType: "agent-skill",
            amountPaidCents: 0, // Free assignment
            status: "completed",
          });

          if (purchase) purchases.push(purchase);
        }

        // Log event
        await EventLogs.logEvent(
          "organization_skills_assigned",
          { organizationId: parseInt(id), skillCount: purchases.length },
          user?.id
        );

        response.status(200).json({
          success: true,
          purchases,
        });
      } catch (error) {
        console.error("Assign skills error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /organizations/:id/skills
   * Get all assigned skills for an organization
   */
  app.get(
    "/organizations/:id/skills",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin, ROLES.admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id } = request.params;
        const user = response.locals?.user;

        // Admins can only view their own org skills
        if (user?.role === ROLES.admin) {
          if (user.organizationId !== parseInt(id)) {
            return response.status(403).json({
              success: false,
              error: "Access denied",
            });
          }
        }

        const { MarketplacePurchase } = require("../models/marketplacePurchase");
        const purchases = await MarketplacePurchase.where({
          organizationId: parseInt(id),
          itemType: "agent-skill",
          status: "completed",
        });

        response.status(200).json({
          success: true,
          skills: purchases,
        });
      } catch (error) {
        console.error("Get organization skills error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * DELETE /organizations/:id/skills/:skillId
   * Remove a skill from an organization
   */
  app.delete(
    "/organizations/:id/skills/:skillId",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        if (!isMultiTenant()) {
          return response.status(400).json({
            success: false,
            error: "Organizations not enabled (TENANCY_MODE=single)",
          });
        }

        const { id, skillId } = request.params;
        const user = response.locals?.user;

        const { MarketplacePurchase } = require("../models/marketplacePurchase");

        // Find and delete the purchase
        const purchase = await MarketplacePurchase.get({
          hubId: skillId,
          organizationId: parseInt(id),
          itemType: "agent-skill",
        });

        if (!purchase) {
          return response.status(404).json({
            success: false,
            error: "Skill assignment not found",
          });
        }

        await MarketplacePurchase.delete(purchase.id);

        // Log event
        await EventLogs.logEvent(
          "organization_skill_removed",
          { organizationId: parseInt(id), skillId },
          user?.id
        );

        response.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Remove skill error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );
}

module.exports = { organizationEndpoints };
