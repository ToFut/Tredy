const prisma = require("../utils/prisma");

const MarketplaceInstallation = {
  /**
   * Create or update an installation
   * @param {Object} data - Installation data
   * @returns {Promise<Object>} Created/updated installation
   */
  install: async function (data) {
    try {
      const installation = await prisma.marketplace_installations.upsert({
        where: {
          hubId_userId_workspaceId: {
            hubId: data.hubId,
            userId: data.userId,
            workspaceId: data.workspaceId || null,
          },
        },
        update: {
          active: data.active !== undefined ? data.active : true,
        },
        create: {
          hubId: data.hubId,
          itemType: data.itemType,
          workspaceId: data.workspaceId || null,
          userId: data.userId,
          active: data.active !== undefined ? data.active : true,
        },
      });
      return installation;
    } catch (error) {
      console.error("Error installing marketplace item:", error);
      return null;
    }
  },

  /**
   * Get an installation by criteria
   * @param {Object} where - Search criteria
   * @returns {Promise<Object|null>} Installation or null
   */
  get: async function (where = {}) {
    try {
      const installation = await prisma.marketplace_installations.findFirst({
        where,
      });
      return installation;
    } catch (error) {
      console.error("Error getting marketplace installation:", error);
      return null;
    }
  },

  /**
   * Get all installations matching criteria
   * @param {Object} where - Search criteria
   * @returns {Promise<Array>} Array of installations
   */
  where: async function (where = {}) {
    try {
      const installations = await prisma.marketplace_installations.findMany({
        where,
        orderBy: { installedAt: "desc" },
      });
      return installations;
    } catch (error) {
      console.error("Error finding marketplace installations:", error);
      return [];
    }
  },

  /**
   * Toggle installation active status
   * @param {number} id - Installation ID
   * @param {boolean} active - Active status
   * @returns {Promise<Object|null>} Updated installation or null
   */
  toggle: async function (id, active) {
    try {
      const installation = await prisma.marketplace_installations.update({
        where: { id },
        data: { active },
      });
      return installation;
    } catch (error) {
      console.error("Error toggling marketplace installation:", error);
      return null;
    }
  },

  /**
   * Uninstall an item
   * @param {number} id - Installation ID
   * @returns {Promise<boolean>} Success status
   */
  uninstall: async function (id) {
    try {
      await prisma.marketplace_installations.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error uninstalling marketplace item:", error);
      return false;
    }
  },

  /**
   * Check if user has installed an item
   * @param {Object} params - Check parameters
   * @param {string} params.hubId - Item hub ID
   * @param {number} params.userId - User ID
   * @param {number} params.workspaceId - Optional workspace ID
   * @returns {Promise<boolean>} Whether item is installed
   */
  isInstalled: async function ({ hubId, userId, workspaceId = null }) {
    const installation = await this.get({
      hubId,
      userId,
      workspaceId,
      active: true,
    });
    return !!installation;
  },

  /**
   * Get all active installations for a user
   * @param {number} userId - User ID
   * @param {number} workspaceId - Optional workspace ID filter
   * @returns {Promise<Array>} Array of installations
   */
  getUserInstallations: async function (userId, workspaceId = null) {
    const where = { userId, active: true };
    if (workspaceId) {
      where.workspaceId = workspaceId;
    }
    return await this.where(where);
  },

  /**
   * Get all installed items of a specific type for a user
   * @param {number} userId - User ID
   * @param {string} itemType - Item type (agent-skill, system-prompt, slash-command)
   * @returns {Promise<Array>} Array of installations
   */
  getUserInstallationsByType: async function (userId, itemType) {
    return await this.where({
      userId,
      itemType,
      active: true,
    });
  },
};

module.exports = { MarketplaceInstallation };
