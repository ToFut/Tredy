const prisma = require("../utils/prisma");
const path = require("path");
const fs = require("fs");

/**
 * TredyMarketplace - Local database integration for paid marketplace items
 *
 * Stores marketplace items in local filesystem instead of Supabase
 * Uses existing marketplace_purchases table for purchase tracking
 */
class TredyMarketplace {
  constructor() {
    this.storageDir = process.env.STORAGE_DIR || path.join(__dirname, "../storage");
    this.marketplaceDir = path.join(this.storageDir, "marketplace-items");

    // Create marketplace directory if it doesn't exist
    if (!fs.existsSync(this.marketplaceDir)) {
      fs.mkdirSync(this.marketplaceDir, { recursive: true });
    }

    this.enabled = true;
  }

  /**
   * Check if marketplace is enabled
   * @returns {boolean} Whether marketplace is configured
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get marketplace item file path
   */
  _getItemFilePath(itemId) {
    return path.join(this.marketplaceDir, `${itemId}.json`);
  }

  /**
   * Read item from filesystem
   */
  _readItem(itemId) {
    try {
      const filePath = this._getItemFilePath(itemId);
      if (!fs.existsSync(filePath)) return null;
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error reading item:", error);
      return null;
    }
  }

  /**
   * Write item to filesystem
   */
  _writeItem(itemId, data) {
    try {
      const filePath = this._getItemFilePath(itemId);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error("Error writing item:", error);
      return false;
    }
  }

  /**
   * Delete item from filesystem
   */
  _deleteItem(itemId) {
    try {
      const filePath = this._getItemFilePath(itemId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      return false;
    }
  }

  /**
   * List all items from filesystem
   */
  _listAllItems() {
    try {
      const files = fs.readdirSync(this.marketplaceDir);
      const items = [];

      for (const file of files) {
        if (file.endsWith(".json")) {
          const itemId = file.replace(".json", "");
          const item = this._readItem(itemId);
          if (item) items.push(item);
        }
      }

      return items;
    } catch (error) {
      console.error("Error listing items:", error);
      return [];
    }
  }

  /**
   * Fetch all marketplace items
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Max items to return
   * @param {number} params.offset - Pagination offset
   * @param {string} params.itemType - Filter by type (agent-skill, system-prompt, slash-command)
   * @param {string} params.visibility - Filter by visibility (public, private, unlisted)
   * @returns {Promise<Object>} { items, total, error }
   */
  async fetchItems({ limit = 50, offset = 0, itemType = null, visibility = null } = {}) {
    try {
      let items = this._listAllItems();

      // Filter by item type
      if (itemType) {
        items = items.filter((item) => item.item_type === itemType);
      }

      // Filter by visibility (if specified)
      if (visibility) {
        items = items.filter((item) => item.visibility === visibility);
      }

      // Sort by created_at (newest first)
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const total = items.length;

      // Paginate
      const paginatedItems = items.slice(offset, offset + limit);

      return { items: paginatedItems, total, error: null };
    } catch (error) {
      console.error("Error fetching marketplace items:", error);
      return { items: [], total: 0, error: error.message };
    }
  }

  /**
   * Get a single item by ID
   * @param {string} hubId - Item UUID
   * @returns {Promise<Object>} { item, error }
   */
  async getItem(hubId) {
    try {
      const item = this._readItem(hubId);

      if (!item) {
        return { item: null, error: "Item not found" };
      }

      return { item, error: null };
    } catch (error) {
      console.error("Error fetching marketplace item:", error);
      return { item: null, error: error.message };
    }
  }

  /**
   * Create a new marketplace item (admin only)
   * @param {Object} itemData - Item metadata
   * @returns {Promise<Object>} { item, error }
   */
  async createItem(itemData) {
    try {
      const crypto = require("crypto");
      const itemId = crypto.randomUUID();

      const item = {
        id: itemId,
        name: itemData.name,
        description: itemData.description,
        item_type: itemData.itemType,
        price_cents: itemData.priceCents || 0,
        visibility: itemData.visibility || "public",
        author: itemData.author || "Tredy",
        version: itemData.version || "1.0.0",
        file_path: itemData.filePath || null,
        metadata: itemData.metadata || {},
        content: itemData.content || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const success = this._writeItem(itemId, item);

      if (!success) {
        return { item: null, error: "Failed to save item" };
      }

      return { item, error: null };
    } catch (error) {
      console.error("Error creating marketplace item:", error);
      return { item: null, error: error.message };
    }
  }

  /**
   * Update a marketplace item (admin only)
   * @param {string} hubId - Item UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} { item, error }
   */
  async updateItem(hubId, updates) {
    try {
      const item = this._readItem(hubId);

      if (!item) {
        return { item: null, error: "Item not found" };
      }

      const updatedItem = {
        ...item,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const success = this._writeItem(hubId, updatedItem);

      if (!success) {
        return { item: null, error: "Failed to update item" };
      }

      return { item: updatedItem, error: null };
    } catch (error) {
      console.error("Error updating marketplace item:", error);
      return { item: null, error: error.message };
    }
  }

  /**
   * Delete a marketplace item (admin only)
   * @param {string} hubId - Item UUID
   * @returns {Promise<Object>} { success, error }
   */
  async deleteItem(hubId) {
    try {
      const success = this._deleteItem(hubId);

      if (!success) {
        return { success: false, error: "Failed to delete item" };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Error deleting marketplace item:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Upload a file to local storage
   * @param {string} bucketName - Storage bucket name (ignored, using local storage)
   * @param {string} filePath - File path within bucket
   * @param {Buffer} fileBuffer - File contents
   * @returns {Promise<Object>} { url, error }
   */
  async uploadFile(bucketName, filePath, fileBuffer) {
    try {
      const uploadsDir = path.join(this.marketplaceDir, "uploads");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fullPath = path.join(uploadsDir, filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, fileBuffer);

      // Return local path
      return { url: fullPath, error: null };
    } catch (error) {
      console.error("Error uploading file:", error);
      return { url: null, error: error.message };
    }
  }

  /**
   * Get a file path for download
   * @param {string} bucketName - Storage bucket name (ignored)
   * @param {string} filePath - File path within bucket
   * @param {number} expiresIn - Expiration time (ignored for local files)
   * @returns {Promise<Object>} { url, error }
   */
  async getSignedUrl(bucketName, filePath, expiresIn = 3600) {
    try {
      const fullPath = path.join(this.marketplaceDir, "uploads", filePath);

      if (!fs.existsSync(fullPath)) {
        return { url: null, error: "File not found" };
      }

      return { url: fullPath, error: null };
    } catch (error) {
      console.error("Error getting file path:", error);
      return { url: null, error: error.message };
    }
  }

  /**
   * Check if user has purchased an item
   * @param {string} itemId - Item UUID
   * @param {number} userId - Local user ID (from AnythingLLM users table)
   * @returns {Promise<boolean>} Whether the user has purchased the item
   */
  async hasPurchased(itemId, userId) {
    if (!this.enabled) return false;

    try {
      const { MarketplacePurchase } = require("./marketplacePurchase");
      const purchase = await MarketplacePurchase.get({
        hubId: itemId,
        userId: userId,
        status: "completed",
      });

      return !!purchase;
    } catch (error) {
      console.error("Error checking purchase:", error);
      return false;
    }
  }

  /**
   * Record a purchase in the local database
   * @param {Object} purchaseData - Purchase data
   * @param {string} purchaseData.itemId - Item UUID
   * @param {number} purchaseData.userId - User ID
   * @param {number} purchaseData.organizationId - Organization ID (optional)
   * @param {string} purchaseData.stripePaymentIntentId - Stripe payment intent ID
   * @param {string} purchaseData.stripeCheckoutSessionId - Stripe checkout session ID
   * @param {number} purchaseData.amountCents - Amount paid in cents
   * @returns {Promise<Object>} { purchase, error }
   */
  async recordPurchase(purchaseData) {
    try {
      const { MarketplacePurchase } = require("./marketplacePurchase");

      const purchase = await MarketplacePurchase.create({
        hubId: purchaseData.itemId,
        userId: purchaseData.userId,
        organizationId: purchaseData.organizationId || null,
        itemType: purchaseData.itemType,
        amountPaidCents: purchaseData.amountCents,
        stripePaymentIntentId: purchaseData.stripePaymentIntentId,
        stripeCheckoutSessionId: purchaseData.stripeCheckoutSessionId,
        status: "completed",
      });

      if (!purchase) {
        return { purchase: null, error: "Failed to record purchase" };
      }

      return { purchase, error: null };
    } catch (error) {
      console.error("Error recording purchase:", error);
      return { purchase: null, error: error.message };
    }
  }

  /**
   * Get user's purchases
   * @param {number} userId - User ID
   * @param {number} organizationId - Organization ID (optional)
   * @returns {Promise<Object>} { purchases, error }
   */
  async getUserPurchases(userId, organizationId = null) {
    try {
      const { MarketplacePurchase } = require("./marketplacePurchase");

      const whereClause = organizationId
        ? { organizationId, status: "completed" }
        : { userId, status: "completed" };

      const purchases = await MarketplacePurchase.where(whereClause);

      return { purchases, error: null };
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      return { purchases: [], error: error.message };
    }
  }

  /**
   * Create Stripe product and price for an item
   * @param {Object} itemData - Item data
   * @param {string} itemData.name - Item name
   * @param {string} itemData.description - Item description
   * @param {number} itemData.priceCents - Price in cents
   * @param {string} itemData.itemType - Item type
   * @returns {Promise<Object>} { productId, priceId, error }
   */
  async createStripeProduct(itemData) {
    try {
      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

      if (!process.env.STRIPE_SECRET_KEY) {
        return { productId: null, priceId: null, error: "Stripe not configured" };
      }

      const product = await stripe.products.create({
        name: itemData.name,
        description: itemData.description,
        metadata: {
          item_type: itemData.itemType,
          source: "tredy_marketplace",
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: itemData.priceCents,
        currency: "usd",
      });

      return { productId: product.id, priceId: price.id, error: null };
    } catch (error) {
      console.error("Error creating Stripe product:", error);
      return { productId: null, priceId: null, error: error.message };
    }
  }
}

module.exports = TredyMarketplace;
