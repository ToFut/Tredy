const { handleNangoWebhook } = require("../nango/webhooks");

function nangoWebhookEndpoints(app) {
  if (!app) return;

  app.post("/api/webhooks/nango", async (req, res) => {
    await handleNangoWebhook(req, res);
  });
}

module.exports = { nangoWebhookEndpoints };
