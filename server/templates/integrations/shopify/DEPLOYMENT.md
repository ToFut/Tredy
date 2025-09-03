# Shopify Integration Deployment Guide

## Overview
This directory contains a complete Nango-compatible Shopify integration with:
- **3 Syncs**: Products, Orders, Customers (incremental sync with timestamps)
- **2 Actions**: Create Product, Get Product
- **OAuth Flow**: Shopify app OAuth with proper scopes
- **Models**: TypeScript interfaces for all data types

## Files Structure
```
shopify/
├── nango.yaml           # Integration configuration
├── models.ts            # TypeScript type definitions
├── package.json         # Dependencies and scripts
├── config.json          # AnythingLLM integration config
├── syncs/
│   ├── products.ts      # Products sync (every 15 minutes)
│   ├── orders.ts        # Orders sync (every 30 minutes)
│   └── customers.ts     # Customers sync (every 1 hour)
└── actions/
    ├── create-product.ts # Create new products
    └── get-product.ts    # Retrieve product details
```

## Deployment Steps

### 1. Shopify App Setup
First, create a Shopify app in your Shopify Partner Dashboard:

1. Go to https://partners.shopify.com/
2. Create a new app
3. Set redirect URLs to your Nango instance:
   - `https://api.nango.dev/oauth/callback`
   - Add your custom domain if using one
4. Note your Client ID and Client Secret
5. Configure these scopes:
   - `read_products`
   - `write_products`
   - `read_orders`
   - `read_customers`
   - `write_webhooks`
   - `read_inventory`

### 2. Nango Dashboard Setup
1. Log into your Nango Dashboard
2. Go to Integrations → Create Integration
3. Select "Shopify" as the provider
4. Create integration key: `shopify-getting-started`
5. Enter your Shopify app credentials:
   - Client ID from Step 1
   - Client Secret from Step 1
6. Configure OAuth settings:
   - Scopes: `read_products,write_products,read_orders,read_customers,write_webhooks,read_inventory`
   - Custom parameters: Enable "shop" parameter for shop domain

### 3. Deploy Integration Code
From this directory, run:

```bash
# Install Nango CLI if not already installed
npm install -g nango

# Install dependencies
npm install

# Deploy to Nango
nango deploy
```

### 4. Test Integration
```bash
# Test individual sync
nango dry-run products

# Test action
nango dry-run create-product --input '{"title": "Test Product"}'
```

## Integration Features

### Syncs
- **Products**: Full product catalog with variants, pricing, and metadata
- **Orders**: Order history with customer info and fulfillment status  
- **Customers**: Customer profiles with order counts and spend totals

### Actions
- **create-product**: Create new products with variants
- **get-product**: Retrieve specific product details by ID

### OAuth Flow
The integration handles Shopify's shop-specific OAuth:
1. User provides their `myshopify.com` shop domain
2. OAuth redirects to `https://{shop}.myshopify.com/admin/oauth/authorize`
3. After approval, tokens are stored per shop domain
4. API calls use shop-specific base URLs

## AnythingLLM Integration

The integration automatically works with AnythingLLM's:
- **Universal MCP Server**: Provides AI tools for all Shopify operations
- **Vector Search**: Products and customers indexed for semantic search
- **Chat Integration**: OAuth directly from chat interface
- **Data Connectors**: Visual setup and management

### Available Tools
When connected, AI agents get access to:
- `shopify_get_products` - Search and retrieve products
- `shopify_get_orders` - Query order history  
- `shopify_get_customers` - Find customer information
- `shopify_create_product` - Create new products
- `shopify_update_inventory` - Manage inventory levels
- `smart_search_shopify` - AI-powered semantic search across all data

## Error Handling

The integration includes comprehensive error handling:
- **Rate Limiting**: Automatic retry with exponential backoff
- **API Errors**: Detailed error messages with context
- **Validation**: Input validation for all actions
- **Logging**: Detailed sync and action logging

## Monitoring

Track integration health via:
- Nango Dashboard sync status
- AnythingLLM connection health checks  
- Shopify app analytics
- Vector database sync metrics

## Troubleshooting

### Common Issues
1. **OAuth Fails**: Check shop domain format (no https://, include .myshopify.com)
2. **Sync Errors**: Verify API scopes match integration requirements
3. **Rate Limits**: Shopify allows 40 requests/app/shop/second
4. **Webhook Issues**: Ensure webhook URL is publicly accessible

### Debug Commands
```bash
# Check connection status
nango connection list shopify-getting-started

# View sync logs
nango logs products

# Test API connectivity
nango dry-run products --connection-id test-connection
```

## Security Notes
- Client secrets stored securely in Nango
- Access tokens encrypted at rest
- Shop domains validated against Shopify format
- API calls use HTTPS with proper headers