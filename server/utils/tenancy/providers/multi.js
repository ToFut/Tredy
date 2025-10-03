const BaseTenancyProvider = require("../interface");
const { WorkspaceUser } = require("../../../models/workspaceUsers");
const { Workspace } = require("../../../models/workspace");
const { User } = require("../../../models/user");

/**
 * MultiTenancy - Organization mode
 *
 * In this mode:
 * - Users belong to organizations
 * - Purchases are org-level (all org users inherit)
 * - Org admins are "mini super-admins" for their org
 * - Workspaces still belong to individual users (via workspace_users)
 * - Super admins manage all orgs
 */
class MultiTenancy extends BaseTenancyProvider {
  async canUserAccessWorkspace(user, workspaceId) {
    if (!user || !workspaceId) return false;

    // Super admin has access to everything
    if (this.isSuperAdmin(user)) return true;

    // Use existing workspace access control
    const workspace = await Workspace.get({ id: workspaceId });
    if (!workspace) return false;

    const access = await WorkspaceUser.get({
      userId: user.id,
      workspaceId: parseInt(workspaceId),
    });

    return !!access;
  }

  async hasMarketplacePurchase(user, hubId, itemType) {
    if (!user || !hubId) return false;

    const { MarketplacePurchase } = require("../../../models/marketplacePurchase");

    // Super admin has access to everything
    if (this.isSuperAdmin(user)) return true;

    // Check org-level purchases (if user has org)
    if (user.organizationId) {
      const orgPurchase = await MarketplacePurchase.get({
        organizationId: user.organizationId,
        hubId,
        itemType,
      });

      if (orgPurchase) return true;
    }

    // Fallback: Check individual user purchase (for migration compatibility)
    const userPurchase = await MarketplacePurchase.get({
      userId: user.id,
      hubId,
      itemType,
    });

    return !!userPurchase;
  }

  async recordMarketplacePurchase(user, hubId, itemType, paymentData = {}) {
    if (!user || !hubId || !itemType) {
      throw new Error("User, hubId, and itemType are required");
    }

    const { MarketplacePurchase } = require("../../../models/marketplacePurchase");

    // In multi-tenant mode, purchases are org-level
    if (!user.organizationId) {
      throw new Error("User must belong to an organization to make purchases in multi-tenant mode");
    }

    return await MarketplacePurchase.create({
      userId: null, // Multi mode - org-level purchase
      organizationId: user.organizationId,
      hubId,
      itemType,
      stripePaymentIntentId: paymentData.paymentIntentId || null,
      amountPaidCents: paymentData.amountCents || null,
      purchasedBy: user.id,
      status: paymentData.status || "completed",
    });
  }

  async getUserOrganization(user) {
    if (!user || !user.organizationId) return null;

    const { Organization } = require("../../../models/organization");
    return await Organization.get({ id: user.organizationId });
  }

  async canManageUsers(user) {
    if (!user) return false;

    // Super admin can manage all users
    if (this.isSuperAdmin(user)) return true;

    // Org admin can manage users in their org
    if (this.isOrgAdmin(user) && user.organizationId) return true;

    return false;
  }

  async getUsersInScope(user) {
    if (!user) return [];

    // Super admin sees all users
    if (this.isSuperAdmin(user)) {
      return await User.where({});
    }

    // Org admin sees users in their org
    if (this.isOrgAdmin(user) && user.organizationId) {
      return await User.where({ organizationId: user.organizationId });
    }

    return [];
  }

  async getAnalyticsScope(user) {
    if (!user) return { workspaceIds: [] };

    // Super admin sees all workspaces
    if (this.isSuperAdmin(user)) {
      const allWorkspaces = await Workspace.where({});
      return {
        workspaceIds: allWorkspaces.map((w) => w.id),
        isSuperAdmin: true,
      };
    }

    // Org admin sees all org users' workspaces
    if (this.isOrgAdmin(user) && user.organizationId) {
      const orgUsers = await User.where({ organizationId: user.organizationId });
      const orgUserIds = orgUsers.map((u) => u.id);

      // Get all workspaces for org users
      const workspaceAccess = await WorkspaceUser.where({
        userId: orgUserIds,
      });

      return {
        workspaceIds: [...new Set(workspaceAccess.map((wa) => wa.workspaceId))],
        organizationId: user.organizationId,
      };
    }

    // Regular user sees only their workspaces
    const workspaces = await Workspace.whereWithUser(user);
    return {
      workspaceIds: workspaces.map((w) => w.id),
      userId: user.id,
    };
  }

  async getWorkspacesInScope(user) {
    if (!user) return [];

    // Super admin sees all workspaces
    if (this.isSuperAdmin(user)) {
      return await Workspace.where({});
    }

    // Org admin sees all org users' workspaces
    if (this.isOrgAdmin(user) && user.organizationId) {
      const orgUsers = await User.where({ organizationId: user.organizationId });
      const orgUserIds = orgUsers.map((u) => u.id);

      // Get all workspaces for org users
      const workspaceAccess = await WorkspaceUser.where({
        userId: orgUserIds,
      });

      const workspaceIds = [...new Set(workspaceAccess.map((wa) => wa.workspaceId))];

      // Fetch workspace details
      const workspaces = [];
      for (const id of workspaceIds) {
        const workspace = await Workspace.get({ id });
        if (workspace) workspaces.push(workspace);
      }

      return workspaces;
    }

    // Regular user sees only their workspaces
    return await Workspace.whereWithUser(user);
  }

  getMode() {
    return "multi";
  }
}

module.exports = MultiTenancy;
