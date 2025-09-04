/**
 * Production configuration for Nango integrations
 */
module.exports = {
  // Nango production environment - use same env vars as dev for simplicity
  NANGO_SECRET_KEY: process.env.NANGO_PROD_SECRET_KEY || process.env.NANGO_SECRET_KEY,
  NANGO_PUBLIC_KEY: process.env.NANGO_PROD_PUBLIC_KEY || process.env.NANGO_PUBLIC_KEY,
  NANGO_HOST: process.env.NANGO_PROD_HOST || process.env.NANGO_HOST || "https://api.nango.dev",

  // OAuth provider configurations
  providers: {
    // Shopify production config
    shopify: {
      configKey: "shopify-prod",
      clientId: process.env.SHOPIFY_PROD_CLIENT_ID,
      clientSecret: process.env.SHOPIFY_PROD_CLIENT_SECRET,
      scopes: [
        "read_products",
        "write_products",
        "read_orders",
        "read_customers"
      ]
    },

    // LinkedIn production config  
    linkedin: {
      configKey: "linkedin-prod",
      clientId: process.env.LINKEDIN_PROD_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_PROD_CLIENT_SECRET,
      scopes: [
        "r_liteprofile",
        "r_emailaddress",
        "w_member_social"
      ]
    },

    // Gmail production config
    gmail: {
      configKey: "google-mail-prod",
      clientId: process.env.GMAIL_PROD_CLIENT_ID,
      clientSecret: process.env.GMAIL_PROD_CLIENT_SECRET,
      scopes: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send"
      ]
    }
  },

  // Webhook configuration
  webhook: {
    secret: process.env.NANGO_PROD_WEBHOOK_SECRET,
    endpoint: process.env.NANGO_PROD_WEBHOOK_URL || "/api/webhooks/nango"
  }
};
