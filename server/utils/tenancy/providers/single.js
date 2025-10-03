const BaseTenancyProvider = require("../interface");
const { WorkspaceUser } = require("../../../models/workspaceUsers");
const { Workspace } = require("../../../models/workspace");

/**
 * SingleTenancy - Default mode (no organizations)
 *
 * In this mode:
 * - Each user operates independently
 * - Purchases are per-user
 * - No organization structure
 * - Workspace access uses existing workspace_users table
 */
class SingleTenancy extends BaseTenancyProvider {
  async canUserAccessWorkspace(user, workspaceId) {
    if (!user || !workspaceId) return false;

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
    const purchase = await MarketplacePurchase.get({
      userId: user.id,
      hubId,
      itemType,
    });

    return !!purchase;
  }

  async recordMarketplacePurchase(user, hubId, itemType, paymentData = {}) {
    if (!user || !hubId || !itemType) {
      throw new Error("User, hubId, and itemType are required");
    }

    const { MarketplacePurchase } = require("../../../models/marketplacePurchase");
    return await MarketplacePurchase.create({
      userId: user.id,
      organizationId: null, // Single mode - no org
      hubId,
      itemType,
      stripePaymentIntentId: paymentData.paymentIntentId || null,
      amountPaidCents: paymentData.amountCents || null,
      purchasedBy: user.id,
      status: paymentData.status || "completed",
    });
  }

  async getUserOrganization(user) {
    // Single mode - no organizations
    return null;
  }

  async canManageUsers(user) {
    // Single mode - no user management
    return false;
  }

  async getUsersInScope(user) {
    // Single mode - no user management
    return [];
  }

  async getAnalyticsScope(user) {
    if (!user) return { workspaceIds: [] };

    // Return only user's own workspaces
    const workspaces = await Workspace.whereWithUser(user);
    return {
      workspaceIds: workspaces.map((w) => w.id),
      userId: user.id,
    };
  }

  async getWorkspacesInScope(user) {
    if (!user) return [];

    // Return only user's own workspaces
    return await Workspace.whereWithUser(user);
  }

  getMode() {
    return "single";
  }
}

module.exports = SingleTenancy;
