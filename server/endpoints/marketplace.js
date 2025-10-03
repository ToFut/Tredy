const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { reqBody } = require("../utils/http");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { MarketplacePurchase } = require("../models/marketplacePurchase");
const { MarketplaceInstallation } = require("../models/marketplaceInstallation");
const TredyMarketplace = require("../models/tredyMarketplace");
const { getTenancyProvider } = require("../utils/tenancy");
const { EventLogs } = require("../models/eventLogs");

/**
 * Marketplace endpoints for purchasing and installing paid items
 */
function marketplaceEndpoints(app) {
  if (!app) return;

  const stripe = process.env.STRIPE_SECRET_KEY
    ? require("stripe")(process.env.STRIPE_SECRET_KEY)
    : null;

  /**
   * POST /marketplace/purchase
   * Create a Stripe checkout session for purchasing an item
   */
  app.post(
    "/marketplace/purchase",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        if (!stripe) {
          return response.status(400).json({
            success: false,
            error: "Stripe not configured",
          });
        }

        const { hubId, itemType, successUrl, cancelUrl } = reqBody(request);
        const user = response.locals?.user;

        if (!user) {
          return response.status(401).json({
            success: false,
            error: "User not authenticated",
          });
        }

        // Get item details from Tredy Marketplace
        const marketplace = new TredyMarketplace();
        const { item, error: itemError } = await marketplace.getItem(hubId);

        if (itemError || !item) {
          return response.status(404).json({
            success: false,
            error: itemError || "Item not found",
          });
        }

        // Check if already purchased
        const tenancy = getTenancyProvider();
        const hasPurchased = await tenancy.hasMarketplacePurchase(
          user,
          hubId,
          itemType
        );

        if (hasPurchased) {
          return response.status(400).json({
            success: false,
            error: "Item already purchased",
          });
        }

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: item.name,
                  description: item.description,
                },
                unit_amount: item.price_cents,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            hubId,
            itemType,
            userId: user.id.toString(),
            organizationId: user.organizationId?.toString() || "",
          },
        });

        response.status(200).json({
          success: true,
          sessionUrl: session.url,
          sessionId: session.id,
        });
      } catch (error) {
        console.error("Purchase error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /marketplace/webhooks/stripe
   * Stripe webhook handler for payment events
   */
  app.post(
    "/marketplace/webhooks/stripe",
    async (request, response) => {
      if (!stripe) {
        return response.status(400).send("Stripe not configured");
      }

      const sig = request.headers["stripe-signature"];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("Stripe webhook secret not configured");
        return response.status(400).send("Webhook secret not configured");
      }

      let event;

      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          sig,
          webhookSecret
        );
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return response.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Extract metadata
        const { hubId, itemType, userId, organizationId } = session.metadata;

        try {
          // Record purchase
          const tenancy = getTenancyProvider();
          const { User } = require("../models/user");
          const user = await User.get({ id: parseInt(userId) });

          if (!user) {
            console.error(`User not found: ${userId}`);
            return response.status(404).send("User not found");
          }

          await tenancy.recordMarketplacePurchase(user, hubId, itemType, {
            paymentIntentId: session.payment_intent,
            amountCents: session.amount_total,
            status: "completed",
          });

          // Log event
          await EventLogs.logEvent(
            "marketplace_purchase",
            { hubId, itemType, amount: session.amount_total },
            parseInt(userId)
          );

          console.log(
            `Purchase recorded: ${itemType} ${hubId} by user ${userId}`
          );
        } catch (error) {
          console.error("Error recording purchase:", error);
          return response.status(500).send("Error recording purchase");
        }
      }

      response.json({ received: true });
    }
  );

  /**
   * POST /marketplace/install
   * Install a purchased item (free or paid)
   */
  app.post(
    "/marketplace/install",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const { hubId, itemType, workspaceId } = reqBody(request);
        const user = response.locals?.user;

        if (!user) {
          return response.status(401).json({
            success: false,
            error: "User not authenticated",
          });
        }

        // Get item details
        const marketplace = new TredyMarketplace();
        const { item, error: itemError } = await marketplace.getItem(hubId);

        if (itemError || !item) {
          return response.status(404).json({
            success: false,
            error: itemError || "Item not found",
          });
        }

        // Check if item is paid and if user has purchased
        if (item.price_cents > 0) {
          const tenancy = getTenancyProvider();
          const hasPurchased = await tenancy.hasMarketplacePurchase(
            user,
            hubId,
            itemType
          );

          if (!hasPurchased) {
            return response.status(403).json({
              success: false,
              error: "Item must be purchased before installation",
            });
          }
        }

        // Install the item
        const installation = await MarketplaceInstallation.install({
          hubId,
          itemType,
          workspaceId: workspaceId || null,
          userId: user.id,
          active: true,
        });

        if (!installation) {
          return response.status(500).json({
            success: false,
            error: "Failed to install item",
          });
        }

        // Log event
        await EventLogs.logEvent(
          "marketplace_install",
          { hubId, itemType, workspaceId },
          user.id
        );

        response.status(200).json({
          success: true,
          installation,
        });
      } catch (error) {
        console.error("Installation error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /marketplace/uninstall
   * Uninstall an item
   */
  app.post(
    "/marketplace/uninstall",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const { installationId } = reqBody(request);
        const user = response.locals?.user;

        if (!user) {
          return response.status(401).json({
            success: false,
            error: "User not authenticated",
          });
        }

        // Verify ownership
        const installation = await MarketplaceInstallation.get({
          id: installationId,
          userId: user.id,
        });

        if (!installation) {
          return response.status(404).json({
            success: false,
            error: "Installation not found",
          });
        }

        const success = await MarketplaceInstallation.uninstall(installationId);

        if (!success) {
          return response.status(500).json({
            success: false,
            error: "Failed to uninstall item",
          });
        }

        // Log event
        await EventLogs.logEvent(
          "marketplace_uninstall",
          { hubId: installation.hubId, itemType: installation.itemType },
          user.id
        );

        response.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Uninstallation error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /marketplace/installations
   * Get all installations for the current user
   */
  app.get(
    "/marketplace/installations",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const user = response.locals?.user;

        if (!user) {
          return response.status(401).json({
            success: false,
            error: "User not authenticated",
          });
        }

        const { workspaceId } = request.query;
        const installations = await MarketplaceInstallation.getUserInstallations(
          user.id,
          workspaceId ? parseInt(workspaceId) : null
        );

        response.status(200).json({
          success: true,
          installations,
        });
      } catch (error) {
        console.error("Get installations error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /marketplace/purchases
   * Get all purchases for the current user
   */
  app.get(
    "/marketplace/purchases",
    [validatedRequest, flexUserRoleValid([ROLES.all])],
    async (request, response) => {
      try {
        const user = response.locals?.user;

        if (!user) {
          return response.status(401).json({
            success: false,
            error: "User not authenticated",
          });
        }

        const purchases = await MarketplacePurchase.getUserPurchases(user);

        response.status(200).json({
          success: true,
          purchases,
        });
      } catch (error) {
        console.error("Get purchases error:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );
}

module.exports = { marketplaceEndpoints };
