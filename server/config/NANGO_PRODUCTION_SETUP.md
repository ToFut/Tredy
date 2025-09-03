# Nango Production Setup Guide

This guide explains how to set up Nango in production mode for AnythingLLM.

## 1. Create Production Environment

1. Log in to your [Nango Dashboard](https://app.nango.dev)
2. Create a new "Production" environment
3. Note down your production API keys:
   - Secret Key
   - Public Key

## 2. Configure Environment Variables

Copy the template from `server/config/nango.env.template` and set the following variables:

```env
# Nango Production Credentials
NANGO_PROD_SECRET_KEY=your_production_secret_key
NANGO_PROD_PUBLIC_KEY=your_production_public_key
NANGO_PROD_HOST=https://api.nango.dev
NANGO_PROD_WEBHOOK_SECRET=your_production_webhook_secret
NANGO_PROD_WEBHOOK_URL=https://your-domain.com/api/webhooks/nango

# OAuth Provider Credentials
SHOPIFY_PROD_CLIENT_ID=your_shopify_production_client_id
SHOPIFY_PROD_CLIENT_SECRET=your_shopify_production_client_secret
LINKEDIN_PROD_CLIENT_ID=your_linkedin_production_client_id
LINKEDIN_PROD_CLIENT_SECRET=your_linkedin_production_client_secret
GMAIL_PROD_CLIENT_ID=your_gmail_production_client_id
GMAIL_PROD_CLIENT_SECRET=your_gmail_production_client_secret
```

## 3. Configure OAuth Providers

1. Set up production OAuth apps for each provider:
   - Shopify Partner Dashboard
   - LinkedIn Developer Portal
   - Google Cloud Console

2. Update redirect URIs in each provider's dashboard to point to your production domain:
   ```
   https://your-domain.com/api/oauth/callback/[provider]
   ```

3. Copy the production client IDs and secrets to your environment variables

## 4. Deploy Configuration

1. Copy the OAuth configuration files to your Nango production environment:
   - `server/config/oauth/shopify.production.yaml`
   - `server/config/oauth/linkedin.production.yaml`
   - `server/config/oauth/gmail.production.yaml`

2. In your Nango dashboard, create new provider configurations using these files

## 5. Enable Production Mode

Set `NODE_ENV=production` in your deployment environment to enable production mode.

## 6. Verify Setup

1. Test each OAuth provider in production:
   ```javascript
   const result = await nangoService.connect('shopify-prod', 'workspace_123');
   console.log(result);
   ```

2. Monitor the logs for any configuration issues

## Security Notes

1. Never commit production credentials to version control
2. Use secure environment variable management in production
3. Enable webhook signature verification
4. Monitor Nango audit logs for suspicious activity

## Troubleshooting

If you encounter issues:

1. Check environment variables are correctly set
2. Verify OAuth configurations in provider dashboards
3. Check Nango dashboard for integration status
4. Review application logs for detailed error messages

For more help, see the [Nango Documentation](https://docs.nango.dev/)
