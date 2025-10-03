const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { reqBody } = require("../utils/http");
const multer = require("multer");
const AdmZip = require("adm-zip");
const crypto = require("crypto");
const TredyMarketplace = require("../models/tredyMarketplace");

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/zip" || file.mimetype === "application/x-zip-compressed") {
      cb(null, true);
    } else {
      cb(new Error("Only ZIP files are allowed"));
    }
  },
});

/**
 * Tredy Admin endpoints for marketplace management
 * Only accessible by super_admin role
 */
function tredyAdminEndpoints(app) {
  if (!app) return;

  /**
   * GET /tredy-admin/marketplace/items
   * List all marketplace items (admin view)
   */
  app.get(
    "/tredy-admin/marketplace/items",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();

        if (!marketplace.isEnabled()) {
          return response.status(400).json({
            success: false,
            error: "Tredy Marketplace not configured. Please set TREDY_SUPABASE_URL and TREDY_SUPABASE_ANON_KEY in .env",
          });
        }

        const { limit = 100, offset = 0, itemType = null } = request.query;

        const result = await marketplace.fetchItems({
          limit: parseInt(limit),
          offset: parseInt(offset),
          itemType,
          visibility: null, // Admin sees all visibilities
        });

        if (result.error) {
          return response.status(500).json({
            success: false,
            error: result.error,
          });
        }

        response.status(200).json({
          success: true,
          items: result.items,
          total: result.total,
        });
      } catch (error) {
        console.error("List items error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /tredy-admin/marketplace/create-skill
   * Create a new agent skill with ZIP upload
   */
  app.post(
    "/tredy-admin/marketplace/create-skill",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.super_admin]),
      upload.single("skillZip"),
    ],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();

        if (!marketplace.isEnabled()) {
          return response.status(400).json({
            success: false,
            error: "Tredy Marketplace not configured",
          });
        }

        const { name, description, category, tags, priceCents, visibility } = request.body;
        const zipFile = request.file;

        if (!zipFile) {
          return response.status(400).json({
            success: false,
            error: "No ZIP file uploaded",
          });
        }

        // Validate ZIP structure
        const zip = new AdmZip(zipFile.buffer);
        const entries = zip.getEntries();
        const hasPluginJson = entries.some((e) => e.entryName === "plugin.json");
        const hasHandler = entries.some((e) => e.entryName === "handler.js");

        if (!hasPluginJson || !hasHandler) {
          return response.status(400).json({
            success: false,
            error: "ZIP must contain plugin.json and handler.js",
          });
        }

        // Parse plugin.json
        const pluginJsonEntry = zip.getEntry("plugin.json");
        const pluginJson = JSON.parse(pluginJsonEntry.getData().toString());

        // Create Stripe product/price if paid (optional - only if Stripe is configured)
        let stripePriceId = null;
        let stripeProductId = null;

        if (parseInt(priceCents) > 0 && process.env.STRIPE_SECRET_KEY) {
          const stripeResult = await marketplace.createStripeProduct({
            name,
            description,
            priceCents: parseInt(priceCents),
            itemType: "agent-skill",
          });

          if (stripeResult.error) {
            console.warn("Stripe not configured, skipping payment integration:", stripeResult.error);
            // Don't fail - just log warning and continue without Stripe
          } else {
            stripeProductId = stripeResult.productId;
            stripePriceId = stripeResult.priceId;
          }
        }

        // Upload to Supabase Storage
        const fileHash = crypto.createHash("sha256").update(zipFile.buffer).digest("hex");
        const storagePath = `skills/${fileHash}.zip`;

        const uploadResult = await marketplace.uploadFile(
          "marketplace-files",
          storagePath,
          zipFile.buffer
        );

        if (uploadResult.error) {
          return response.status(500).json({
            success: false,
            error: `Upload error: ${uploadResult.error}`,
          });
        }

        // Create marketplace item
        const itemResult = await marketplace.createItem({
          name,
          description,
          itemType: "agent-skill",
          priceCents: parseInt(priceCents) || 0,
          visibility: visibility || "public",
          author: "Tredy",
          version: pluginJson.version || "1.0.0",
          filePath: storagePath,
          metadata: {
            category: category || "General",
            tags: tags ? tags.split(",").map((t) => t.trim()) : [],
            stripe_product_id: stripeProductId,
            stripe_price_id: stripePriceId,
            file_size: zipFile.size,
            checksum: fileHash,
          },
        });

        if (itemResult.error) {
          return response.status(500).json({
            success: false,
            error: `Database error: ${itemResult.error}`,
          });
        }

        response.status(200).json({
          success: true,
          item: itemResult.item,
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
   * POST /tredy-admin/marketplace/create-item
   * Create system prompt or slash command
   */
  app.post(
    "/tredy-admin/marketplace/create-item",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();

        if (!marketplace.isEnabled()) {
          return response.status(400).json({
            success: false,
            error: "Tredy Marketplace not configured",
          });
        }

        const {
          name,
          description,
          itemType,
          category,
          tags,
          priceCents,
          visibility,
          content,
        } = reqBody(request);

        if (!["system-prompt", "slash-command", "agent-flow", "agent-skill"].includes(itemType)) {
          return response.status(400).json({
            success: false,
            error: "Invalid item type. Must be system-prompt, slash-command, agent-flow, or agent-skill",
          });
        }

        // Create Stripe product/price if paid (optional - only if Stripe is configured)
        let stripePriceId = null;
        let stripeProductId = null;

        if (parseInt(priceCents) > 0 && process.env.STRIPE_SECRET_KEY) {
          const stripeResult = await marketplace.createStripeProduct({
            name,
            description,
            priceCents: parseInt(priceCents),
            itemType,
          });

          if (stripeResult.error) {
            console.warn("Stripe not configured, skipping payment integration:", stripeResult.error);
            // Don't fail - just log warning and continue without Stripe
          } else {
            stripeProductId = stripeResult.productId;
            stripePriceId = stripeResult.priceId;
          }
        }

        // Create marketplace item
        const itemResult = await marketplace.createItem({
          name,
          description,
          itemType,
          priceCents: parseInt(priceCents) || 0,
          visibility: visibility || "public",
          author: "Tredy",
          version: "1.0.0",
          content,
          metadata: {
            category: category || "General",
            tags: tags ? tags.split(",").map((t) => t.trim()) : [],
            stripe_product_id: stripeProductId,
            stripe_price_id: stripePriceId,
          },
        });

        if (itemResult.error) {
          return response.status(500).json({
            success: false,
            error: `Database error: ${itemResult.error}`,
          });
        }

        response.status(200).json({
          success: true,
          item: itemResult.item,
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
   * PATCH /tredy-admin/marketplace/items/:id
   * Update marketplace item
   */
  app.patch(
    "/tredy-admin/marketplace/items/:id",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();
        const { id } = request.params;
        const updates = reqBody(request);

        const result = await marketplace.updateItem(id, updates);

        if (result.error) {
          return response.status(500).json({
            success: false,
            error: result.error,
          });
        }

        response.status(200).json({
          success: true,
          item: result.item,
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
   * DELETE /tredy-admin/marketplace/items/:id
   * Delete marketplace item
   */
  app.delete(
    "/tredy-admin/marketplace/items/:id",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const marketplace = new TredyMarketplace();
        const { id } = request.params;

        const result = await marketplace.deleteItem(id);

        if (!result.success) {
          return response.status(500).json({
            success: false,
            error: result.error,
          });
        }

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
   * GET /tredy-admin/analytics
   * Get marketplace analytics
   */
  app.get(
    "/tredy-admin/analytics",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const { MarketplacePurchase } = require("../models/marketplacePurchase");
        const { MarketplaceInstallation } = require("../models/marketplaceInstallation");

        const purchases = await MarketplacePurchase.where({ status: "completed" });
        const installations = await MarketplaceInstallation.where({ active: true });

        const totalRevenue = purchases.reduce(
          (sum, p) => sum + (p.amountPaidCents || 0),
          0
        );

        const byItemType = {};
        purchases.forEach((p) => {
          const type = p.itemType || "unknown";
          if (!byItemType[type]) {
            byItemType[type] = { count: 0, revenue: 0 };
          }
          byItemType[type].count++;
          byItemType[type].revenue += p.amountPaidCents || 0;
        });

        response.status(200).json({
          success: true,
          analytics: {
            totalPurchases: purchases.length,
            totalRevenue: totalRevenue / 100, // Convert to dollars
            totalInstallations: installations.length,
            byItemType,
            recentPurchases: purchases.slice(0, 10),
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
   * GET /tredy-admin/existing-workflows
   * List all existing agent workflows from storage
   */
  app.get(
    "/tredy-admin/existing-workflows",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const fs = require("fs");
        const path = require("path");
        const storageDir = process.env.STORAGE_DIR || path.join(__dirname, "../storage");
        const flowsDir = path.join(storageDir, "plugins/agent-flows");

        if (!fs.existsSync(flowsDir)) {
          return response.status(200).json({
            success: true,
            workflows: [],
          });
        }

        const files = fs.readdirSync(flowsDir);
        const workflows = [];

        for (const file of files) {
          if (file.endsWith(".json")) {
            const filePath = path.join(flowsDir, file);
            const content = fs.readFileSync(filePath, "utf-8");
            const workflow = JSON.parse(content);
            workflows.push({
              id: workflow.workflowUuid || file.replace(".json", ""),
              name: workflow.name,
              description: workflow.description,
              active: workflow.active,
              created_at: workflow.created_at,
              steps: workflow.steps?.length || 0,
            });
          }
        }

        response.status(200).json({
          success: true,
          workflows,
        });
      } catch (error) {
        console.error("List workflows error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /tredy-admin/existing-agent-skills
   * List all existing agent skills from storage
   */
  app.get(
    "/tredy-admin/existing-agent-skills",
    [validatedRequest, flexUserRoleValid([ROLES.super_admin])],
    async (request, response) => {
      try {
        const fs = require("fs");
        const path = require("path");
        const storageDir = process.env.STORAGE_DIR || path.join(__dirname, "../storage");
        const skillsDir = path.join(storageDir, "plugins/agent-skills");

        if (!fs.existsSync(skillsDir)) {
          return response.status(200).json({
            success: true,
            skills: [],
          });
        }

        const skillFolders = fs.readdirSync(skillsDir);
        const skills = [];

        for (const folder of skillFolders) {
          const pluginPath = path.join(skillsDir, folder, "plugin.json");
          if (fs.existsSync(pluginPath)) {
            const content = fs.readFileSync(pluginPath, "utf-8");
            const plugin = JSON.parse(content);
            skills.push({
              id: plugin.hubId || folder,
              name: plugin.name,
              description: plugin.description,
              version: plugin.version,
              author: plugin.author,
              active: plugin.active !== false,
              folder: folder,
            });
          }
        }

        response.status(200).json({
          success: true,
          skills,
        });
      } catch (error) {
        console.error("List agent skills error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );
}

module.exports = { tredyAdminEndpoints };
