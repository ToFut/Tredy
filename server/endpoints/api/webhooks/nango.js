const { NangoIntegration } = require("../../../utils/connectors/nango-integration");

/**
 * Webhook endpoint for Nango
 * Configure this URL in your Nango dashboard: https://your-domain.com/api/webhooks/nango
 */
function nangoWebhookEndpoints(app) {
  if (!app) return;

  const nango = new NangoIntegration();

  /**
   * POST /api/webhooks/nango
   * Receives webhooks from Nango for sync events, auth events, etc.
   */
  app.post("/api/webhooks/nango", async (request, response) => {
    try {
      console.log("[Webhook] Received Nango webhook:", request.body.type);

      // Handle the webhook
      const result = await nango.handleWebhook(request.headers, request.body);

      response.status(200).json(result);
    } catch (error) {
      console.error("[Webhook] Error processing Nango webhook:", error);
      response.status(400).json({ error: error.message });
    }
  });

  /**
   * GET /api/webhooks/nango/status
   * Health check endpoint for webhook
   */
  app.get("/api/webhooks/nango/status", (request, response) => {
    response.status(200).json({ 
      status: "ok",
      configured: !!process.env.NANGO_SECRET_KEY,
      timestamp: new Date().toISOString()
    });
  });
}

module.exports = { nangoWebhookEndpoints };