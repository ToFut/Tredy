const prisma = require("../utils/prisma");
const { v4: uuidv4 } = require("uuid");

const Organization = {
  /**
   * Create a new organization
   * @param {Object} data - Organization data
   * @returns {Promise<Object>} Created organization
   */
  create: async function (data) {
    try {
      // Generate slug if not provided
      const slug = data.slug || this.generateSlug(data.name);

      const organization = await prisma.organizations.create({
        data: {
          name: data.name,
          slug,
          tier: data.tier || "internal",
          stripeCustomerId: data.stripeCustomerId || null,
          subscriptionTier: data.subscriptionTier || "free",
          customDomain: data.customDomain || null,
          logoFilename: data.logoFilename || null,
          settings: data.settings ? JSON.stringify(data.settings) : null,
        },
      });
      return organization;
    } catch (error) {
      console.error("Error creating organization:", error);
      return null;
    }
  },

  /**
   * Get an organization by criteria
   * @param {Object} where - Search criteria
   * @returns {Promise<Object|null>} Organization or null
   */
  get: async function (where = {}) {
    try {
      const organization = await prisma.organizations.findFirst({
        where,
        include: {
          users: true,
          marketplace_purchases: true,
        },
      });

      if (organization && organization.settings) {
        organization.settings = JSON.parse(organization.settings);
      }

      return organization;
    } catch (error) {
      console.error("Error getting organization:", error);
      return null;
    }
  },

  /**
   * Get organization without relations (lighter query)
   * @param {Object} where - Search criteria
   * @returns {Promise<Object|null>} Organization or null
   */
  getSimple: async function (where = {}) {
    try {
      const organization = await prisma.organizations.findFirst({
        where,
      });

      if (organization && organization.settings) {
        organization.settings = JSON.parse(organization.settings);
      }

      return organization;
    } catch (error) {
      console.error("Error getting organization:", error);
      return null;
    }
  },

  /**
   * Get all organizations matching criteria
   * @param {Object} where - Search criteria
   * @returns {Promise<Array>} Array of organizations
   */
  where: async function (where = {}) {
    try {
      const organizations = await prisma.organizations.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              marketplace_purchases: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Parse settings JSON
      return organizations.map((org) => ({
        ...org,
        settings: org.settings ? JSON.parse(org.settings) : null,
      }));
    } catch (error) {
      console.error("Error finding organizations:", error);
      return [];
    }
  },

  /**
   * Update an organization
   * @param {number} id - Organization ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object|null>} Updated organization or null
   */
  update: async function (id, updates) {
    try {
      // Stringify settings if provided
      if (updates.settings && typeof updates.settings === "object") {
        updates.settings = JSON.stringify(updates.settings);
      }

      const organization = await prisma.organizations.update({
        where: { id },
        data: updates,
      });

      if (organization.settings) {
        organization.settings = JSON.parse(organization.settings);
      }

      return organization;
    } catch (error) {
      console.error("Error updating organization:", error);
      return null;
    }
  },

  /**
   * Delete an organization
   * @param {number} id - Organization ID
   * @returns {Promise<boolean>} Success status
   */
  delete: async function (id) {
    try {
      await prisma.organizations.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting organization:", error);
      return false;
    }
  },

  /**
   * Generate a URL-safe slug from organization name
   * @param {string} name - Organization name
   * @returns {string} URL-safe slug
   */
  generateSlug: function (name) {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Add random suffix to ensure uniqueness
    const suffix = uuidv4().split("-")[0];
    return `${baseSlug}-${suffix}`;
  },

  /**
   * Get organization with user count and purchase count
   * @param {number} id - Organization ID
   * @returns {Promise<Object|null>} Organization with stats
   */
  getWithStats: async function (id) {
    try {
      const organization = await prisma.organizations.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              users: true,
              marketplace_purchases: true,
            },
          },
        },
      });

      if (organization && organization.settings) {
        organization.settings = JSON.parse(organization.settings);
      }

      return organization;
    } catch (error) {
      console.error("Error getting organization with stats:", error);
      return null;
    }
  },

  /**
   * Add a user to an organization
   * @param {number} organizationId - Organization ID
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Updated user
   */
  addUser: async function (organizationId, userId) {
    try {
      const { User } = require("./user");
      return await User.update(userId, { organizationId });
    } catch (error) {
      console.error("Error adding user to organization:", error);
      return null;
    }
  },

  /**
   * Remove a user from an organization
   * @param {number} userId - User ID
   * @returns {Promise<Object|null>} Updated user
   */
  removeUser: async function (userId) {
    try {
      const { User } = require("./user");
      return await User.update(userId, { organizationId: null });
    } catch (error) {
      console.error("Error removing user from organization:", error);
      return null;
    }
  },
};

module.exports = { Organization };
