const prisma = require("../utils/prisma");

const MarketplacePurchase = {
  /**
   * Create a new marketplace purchase
   * @param {Object} data - Purchase data
   * @returns {Promise<Object>} Created purchase
   */
  create: async function (data) {
    try {
      const purchase = await prisma.marketplace_purchases.create({
        data: {
          userId: data.userId || null,
          organizationId: data.organizationId || null,
          hubId: data.hubId,
          itemType: data.itemType,
          stripePaymentIntentId: data.stripePaymentIntentId || null,
          amountPaidCents: data.amountPaidCents || null,
          purchasedBy: data.purchasedBy || null,
          status: data.status || "completed",
        },
      });
      return purchase;
    } catch (error) {
      console.error("Error creating marketplace purchase:", error);
      return null;
    }
  },

  /**
   * Get a purchase by criteria
   * @param {Object} where - Search criteria
   * @returns {Promise<Object|null>} Purchase or null
   */
  get: async function (where = {}) {
    try {
      const purchase = await prisma.marketplace_purchases.findFirst({
        where,
      });
      return purchase;
    } catch (error) {
      console.error("Error getting marketplace purchase:", error);
      return null;
    }
  },

  /**
   * Get all purchases matching criteria
   * @param {Object} where - Search criteria
   * @returns {Promise<Array>} Array of purchases
   */
  where: async function (where = {}) {
    try {
      const purchases = await prisma.marketplace_purchases.findMany({
        where,
        orderBy: { purchasedAt: "desc" },
      });
      return purchases;
    } catch (error) {
      console.error("Error finding marketplace purchases:", error);
      return [];
    }
  },

  /**
   * Update a purchase
   * @param {number} id - Purchase ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated purchase or null
   */
  update: async function (id, updates) {
    try {
      const purchase = await prisma.marketplace_purchases.update({
        where: { id },
        data: updates,
      });
      return purchase;
    } catch (error) {
      console.error("Error updating marketplace purchase:", error);
      return null;
    }
  },

  /**
   * Delete a purchase
   * @param {number} id - Purchase ID
   * @returns {Promise<boolean>} Success status
   */
  delete: async function (id) {
    try {
      await prisma.marketplace_purchases.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting marketplace purchase:", error);
      return false;
    }
  },

  /**
   * Check if a user or organization has purchased an item
   * @param {Object} params - Check parameters
   * @param {number} params.userId - User ID (for single mode)
   * @param {number} params.organizationId - Organization ID (for multi mode)
   * @param {string} params.hubId - Item hub ID
   * @param {string} params.itemType - Item type
   * @returns {Promise<boolean>} Whether purchase exists
   */
  hasPurchased: async function ({ userId, organizationId, hubId, itemType }) {
    const where = { hubId, itemType, status: "completed" };

    if (organizationId) {
      where.organizationId = organizationId;
    } else if (userId) {
      where.userId = userId;
    } else {
      return false;
    }

    const purchase = await this.get(where);
    return !!purchase;
  },

  /**
   * Get all purchases for a user (includes org purchases if user has org)
   * @param {Object} user - User object
   * @returns {Promise<Array>} Array of purchases
   */
  getUserPurchases: async function (user) {
    if (!user) return [];

    const where = [];

    // User's individual purchases (single mode or legacy)
    if (user.id) {
      where.push({ userId: user.id });
    }

    // Organization purchases (multi mode)
    if (user.organizationId) {
      where.push({ organizationId: user.organizationId });
    }

    if (where.length === 0) return [];

    try {
      const purchases = await prisma.marketplace_purchases.findMany({
        where: { OR: where, status: "completed" },
        orderBy: { purchasedAt: "desc" },
      });
      return purchases;
    } catch (error) {
      console.error("Error getting user purchases:", error);
      return [];
    }
  },
};

module.exports = { MarketplacePurchase };
