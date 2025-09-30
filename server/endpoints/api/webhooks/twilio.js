const { handleTwilioWebhook } = require("../twilio/webhooks");

function twilioWebhookEndpoints(app) {
  if (!app) return;

  // Main Twilio WhatsApp webhook endpoint
  app.post("/api/webhooks/twilio/whatsapp", async (req, res) => {
    await handleTwilioWebhook(req, res);
  });

  // Alternative endpoint for backwards compatibility
  app.post("/webhooks/twilio/whatsapp", async (req, res) => {
    await handleTwilioWebhook(req, res);
  });
}

module.exports = { twilioWebhookEndpoints };