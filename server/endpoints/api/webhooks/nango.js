const { handleNangoWebhook } = require("../nango/webhooks");

function nangoWebhookEndpoints(app) {
  if (!app) return;

  // Match your Nango webhook URLs
  app.post("/webhooks-from-nango", async (req, res) => {
    await handleNangoWebhook(req, res);
  });
  
  // Keep legacy endpoint for backwards compatibility
  app.post("/api/webhooks/nango", async (req, res) => {
    await handleNangoWebhook(req, res);
  });
}

module.exports = { nangoWebhookEndpoints };
