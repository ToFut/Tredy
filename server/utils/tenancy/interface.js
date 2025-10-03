/**
 * BaseTenancyProvider - Interface for tenancy implementations
 *
 * Provides a swappable abstraction for single-tenant vs multi-tenant modes.
 * Follows AnythingLLM's provider pattern (like LLM providers, Vector DB providers).
 */
class BaseTenancyProvider {
  constructor() {
    if (this.constructor === BaseTenancyProvider) {
      throw new Error("BaseTenancyProvider is an abstract class and cannot be instantiated directly");
    }
  }

  /**
   * Check if a user can access a workspace
   * @param {Object} user - User object
   * @param {number} workspaceId - Workspace ID
   * @returns {Promise<boolean>} Whether user has access
   */
  async canUserAccessWorkspace(user, workspaceId) {
    throw new Error("canUserAccessWorkspace must be implemented by tenancy provider");
  }

  /**
   * Check if a user has purchased or has access to a marketplace item
   * @param {Object} user - User object
   * @param {string} hubId - Item hub ID
   * @param {string} itemType - Item type (agent-skill, system-prompt, slash-command)
   * @returns {Promise<boolean>} Whether user has access to item
   */
  async hasMarketplacePurchase(user, hubId, itemType) {
    throw new Error("hasMarketplacePurchase must be implemented by tenancy provider");
  }

  /**
   * Record a marketplace purchase
   * @param {Object} user - User who made purchase
   * @param {string} hubId - Item hub ID
   * @param {string} itemType - Item type
   * @param {Object} paymentData - Payment metadata (Stripe payment intent, amount, etc.)
   * @returns {Promise<Object>} Purchase record
   */
  async recordMarketplacePurchase(user, hubId, itemType, paymentData) {
    throw new Error("recordMarketplacePurchase must be implemented by tenancy provider");
  }

  /**
   * Get user's organization (if any)
   * @param {Object} user - User object
   * @returns {Promise<Object|null>} Organization or null
   */
  async getUserOrganization(user) {
    throw new Error("getUserOrganization must be implemented by tenancy provider");
  }

  /**
   * Check if user can manage other users
   * @param {Object} user - User object
   * @returns {Promise<boolean>} Whether user is an admin
   */
  async canManageUsers(user) {
    throw new Error("canManageUsers must be implemented by tenancy provider");
  }

  /**
   * Get all users in the user's scope
   * For single-tenant: returns empty array (no user management)
   * For multi-tenant admin: returns org users
   * For super-admin: returns all users
   * @param {Object} user - User object
   * @returns {Promise<Array>} Users in scope
   */
  async getUsersInScope(user) {
    throw new Error("getUsersInScope must be implemented by tenancy provider");
  }

  /**
   * Get analytics scope for user
   * For single-tenant: user's own workspaces
   * For multi-tenant admin: org workspaces
   * For super-admin: all workspaces
   * @param {Object} user - User object
   * @returns {Promise<Object>} Analytics scope filters
   */
  async getAnalyticsScope(user) {
    throw new Error("getAnalyticsScope must be implemented by tenancy provider");
  }

  /**
   * Get all workspaces in the user's scope
   * @param {Object} user - User object
   * @returns {Promise<Array>} Workspaces in scope
   */
  async getWorkspacesInScope(user) {
    throw new Error("getWorkspacesInScope must be implemented by tenancy provider");
  }

  /**
   * Get the tenancy mode name
   * @returns {string} Mode name (single, multi)
   */
  getMode() {
    throw new Error("getMode must be implemented by tenancy provider");
  }

  /**
   * Check if user is a super admin (Tredy team)
   * @param {Object} user - User object
   * @returns {boolean} Whether user is super admin
   */
  isSuperAdmin(user) {
    return user?.role === "super_admin";
  }

  /**
   * Check if user is an organization admin
   * @param {Object} user - User object
   * @returns {boolean} Whether user is org admin
   */
  isOrgAdmin(user) {
    return user?.role === "admin";
  }
}

module.exports = BaseTenancyProvider;
