#!/usr/bin/env node

/**
 * Generate MCP Server Configuration for Nango Templates
 * 
 * Creates MCP server configurations that use the Nango Template MCP Wrapper
 * for all 125+ Nango integration templates
 */

const fs = require('fs');
const path = require('path');

class NangoMCPConfigGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, 'storage', 'nango-mcp-configs');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Priority integrations to implement first
   */
  getPriorityIntegrations() {
    return [
      'slack',
      'github', 
      'notion',
      'google-mail',
      'google-calendar',
      'google-drive',
      'salesforce',
      'hubspot',
      'jira',
      'asana',
      'linear',
      'confluence',
      'dropbox',
      'zoom',
      'microsoft-teams',
      'stripe-app',
      'shopify',
      'zendesk',
      'intercom',
      'pipedrive',
      'airtable',
      'trello',
      'figma',
      'canva',
      'typeform',
      'mailchimp',
      'sendgrid',
      'twilio',
      'stripe',
      'paypal'
    ];
  }

  /**
   * All available Nango integrations
   */
  getAllIntegrations() {
    return [
      'aircall', 'airtable', 'airtable-pat', 'algolia', 'anrok', 'asana', 'ashby', 'attio',
      'avalara', 'avalara-sandbox', 'aws-iam', 'bamboo', 'bamboohr-basic', 'basecamp',
      'bill', 'bill-sandbox', 'bitdefender', 'box', 'brightcrowd', 'cal-com-v2', 'calendly',
      'checkr-partner', 'checkr-partner-staging', 'clari-copilot', 'clicksend', 'confluence',
      'databricks-workspace', 'datadog', 'dialpad', 'dialpad-sandbox', 'discourse',
      'docusign', 'docusign-sandbox', 'dropbox', 'evaluagent', 'exact-online', 'expensify',
      'fireflies', 'freshdesk', 'front', 'gem', 'github', 'github-app', 'github-app-oauth',
      'gong', 'gong-oauth', 'google', 'google-calendar', 'google-docs', 'google-drive',
      'google-mail', 'google-sheet', 'gorgias', 'gorgias-basic', 'grammarly', 'greenhouse',
      'greenhouse-basic', 'gusto', 'gusto-demo', 'hackerrank-work', 'harvest',
      'hibob-service-user', 'hubspot', 'index.ts', 'instantly', 'intercom', 'jira',
      'jira-basic', 'keeper-scim', 'kustomer', 'lastpass', 'lattice', 'lattice-scim',
      'lever', 'lever-basic', 'lever-basic-sandbox', 'lever-sandbox', 'linear', 'linkedin',
      'luma', 'metabase', 'microsoft-teams', 'netsuite-tba', 'next-cloud-ocs', 'notion',
      'okta', 'okta-preview', 'one-drive', 'oracle-hcm', 'outlook', 'package-lock.json',
      'package.json', 'paylocity', 'pennylane', 'perimeter81', 'pipedrive', 'quickbooks',
      'quickbooks-sandbox', 'ramp', 'ramp-sandbox', 'recharge', 'recruiterflow',
      'ring-central', 'ring-central-sandbox', 'sage-intacct-oauth', 'salesforce',
      'salesforce-sandbox', 'sap-success-factors', 'sharepoint-online', 'shopify',
      'slack', 'smartsheet', 'stripe-app', 'stripe-app-sandbox', 'teamtailor', 'unanet',
      'wildix-pbx', 'woocommerce', 'workable', 'workday', 'xero', 'zendesk', 'zoho-crm',
      'zoho-mail', 'zoom'
    ].filter(name => !name.includes('.') && !name.includes('json') && !name.includes('ts'));
  }

  /**
   * Generate MCP server configuration for a single integration
   */
  generateIntegrationConfig(integrationName, isPriority = false) {
    const serverName = integrationName.replace(/-/g, '_');
    
    return {
      type: "stdio",
      command: "node",
      args: [
        "/Users/segevbin/anything-llm/server/nango-template-mcp-wrapper.js",
        integrationName
      ],
      env: {
        NANGO_SECRET_KEY: "${NANGO_SECRET_KEY}",
        NANGO_HOST: "${NANGO_HOST}",
        NANGO_PROVIDER_CONFIG_KEY: `${integrationName}-getting-started`,
        MCP_SERVICE_NAME: integrationName,
        WORKSPACE_ID: "${WORKSPACE_ID}"
      },
      anythingllm: {
        autoStart: isPriority,
        workspaceAware: true,
        description: `${integrationName} integration via Nango templates`,
        toolPrefix: integrationName,
        priority: isPriority ? 'high' : 'normal',
        category: this.getIntegrationCategory(integrationName),
        capabilities: {
          oauth: true,
          api: true,
          realtime: this.hasRealtimeCapability(integrationName),
          webhooks: this.hasWebhookCapability(integrationName)
        }
      }
    };
  }

  /**
   * Get integration category
   */
  getIntegrationCategory(integrationName) {
    const categories = {
      'communication': ['slack', 'microsoft-teams', 'discord', 'telegram', 'zoom', 'ring-central'],
      'productivity': ['notion', 'asana', 'trello', 'linear', 'jira', 'confluence', 'airtable'],
      'email': ['google-mail', 'outlook', 'mailchimp', 'sendgrid', 'zoho-mail'],
      'crm': ['salesforce', 'hubspot', 'pipedrive', 'zoho-crm', 'attio'],
      'development': ['github', 'gitlab', 'bitbucket', 'jira', 'linear'],
      'design': ['figma', 'canva', 'adobe'],
      'analytics': ['google-analytics', 'mixpanel', 'amplitude'],
      'ecommerce': ['shopify', 'woocommerce', 'stripe', 'paypal'],
      'storage': ['google-drive', 'dropbox', 'box', 'one-drive'],
      'calendar': ['google-calendar', 'calendly', 'cal-com'],
      'support': ['zendesk', 'intercom', 'freshdesk', 'gorgias'],
      'hr': ['bamboohr-basic', 'workday', 'hibob-service-user', 'lattice'],
      'finance': ['quickbooks', 'xero', 'stripe', 'paypal', 'bill'],
      'marketing': ['mailchimp', 'sendgrid', 'hubspot', 'intercom']
    };

    for (const [category, services] of Object.entries(categories)) {
      if (services.includes(integrationName)) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Check if integration has realtime capabilities
   */
  hasRealtimeCapability(integrationName) {
    const realtimeServices = ['slack', 'microsoft-teams', 'discord', 'telegram', 'zoom'];
    return realtimeServices.includes(integrationName);
  }

  /**
   * Check if integration has webhook capabilities
   */
  hasWebhookCapability(integrationName) {
    const webhookServices = ['github', 'slack', 'salesforce', 'hubspot', 'stripe', 'shopify'];
    return webhookServices.includes(integrationName);
  }

  /**
   * Generate priority integrations configuration
   */
  generatePriorityConfig() {
    const priorityIntegrations = this.getPriorityIntegrations();
    const mcpServers = {};

    priorityIntegrations.forEach(integration => {
      const serverName = integration.replace(/-/g, '_');
      mcpServers[serverName] = this.generateIntegrationConfig(integration, true);
    });

    return { mcpServers };
  }

  /**
   * Generate all integrations configuration
   */
  generateAllConfig() {
    const allIntegrations = this.getAllIntegrations();
    const priorityIntegrations = this.getPriorityIntegrations();
    const mcpServers = {};

    allIntegrations.forEach(integration => {
      const serverName = integration.replace(/-/g, '_');
      const isPriority = priorityIntegrations.includes(integration);
      mcpServers[serverName] = this.generateIntegrationConfig(integration, isPriority);
    });

    return { mcpServers };
  }

  /**
   * Generate category-specific configurations
   */
  generateCategoryConfigs() {
    const categories = {
      'communication': ['slack', 'microsoft-teams', 'discord', 'telegram', 'zoom'],
      'productivity': ['notion', 'asana', 'trello', 'linear', 'jira', 'confluence'],
      'crm': ['salesforce', 'hubspot', 'pipedrive', 'zoho-crm'],
      'development': ['github', 'gitlab', 'jira', 'linear'],
      'ecommerce': ['shopify', 'woocommerce', 'stripe', 'paypal']
    };

    const configs = {};
    
    Object.entries(categories).forEach(([category, services]) => {
      const mcpServers = {};
      services.forEach(service => {
        const serverName = service.replace(/-/g, '_');
        mcpServers[serverName] = this.generateIntegrationConfig(service, true);
      });
      configs[category] = { mcpServers };
    });

    return configs;
  }

  /**
   * Save configuration to file
   */
  saveConfig(config, filename) {
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(config, null, 2));
    console.log(`💾 Saved ${filename} to ${filepath}`);
  }

  /**
   * Generate all configurations
   */
  async generateAllConfigurations() {
    console.log('🚀 Generating Nango MCP Server Configurations...\n');

    // Priority integrations (top 30)
    const priorityConfig = this.generatePriorityConfig();
    this.saveConfig(priorityConfig, 'nango-mcp-priority.json');
    console.log(`⭐ Priority integrations: ${Object.keys(priorityConfig.mcpServers).length}`);

    // All integrations (125+)
    const allConfig = this.generateAllConfig();
    this.saveConfig(allConfig, 'nango-mcp-all.json');
    console.log(`📦 All integrations: ${Object.keys(allConfig.mcpServers).length}`);

    // Category-specific configurations
    const categoryConfigs = this.generateCategoryConfigs();
    Object.entries(categoryConfigs).forEach(([category, config]) => {
      this.saveConfig(config, `nango-mcp-${category}.json`);
      console.log(`📂 ${category} integrations: ${Object.keys(config.mcpServers).length}`);
    });

    // Generate integration list for reference
    const integrationList = {
      priority: this.getPriorityIntegrations(),
      all: this.getAllIntegrations(),
      categories: this.generateCategoryConfigs()
    };
    this.saveConfig(integrationList, 'nango-integration-list.json');

    console.log('\n✅ Configuration generation complete!');
    console.log(`📁 Output directory: ${this.outputDir}`);
    console.log(`📊 Total configurations generated: ${Object.keys(categoryConfigs).length + 3}`);
  }

  /**
   * Generate deployment script
   */
  generateDeploymentScript() {
    const script = `#!/bin/bash

# Nango MCP Server Deployment Script
# Deploys all Nango integration templates as MCP servers

echo "🚀 Deploying Nango MCP Servers..."

# Copy priority configurations to production
cp storage/nango-mcp-configs/nango-mcp-priority.json storage/plugins/anythingllm_mcp_servers_production.json

# Restart MCP servers
echo "🔄 Restarting MCP servers..."
# Add your restart command here

echo "✅ Deployment complete!"
echo "📊 Priority integrations deployed: $(jq '.mcpServers | keys | length' storage/nango-mcp-configs/nango-mcp-priority.json)"
`;

    const scriptPath = path.join(this.outputDir, 'deploy-nango-mcp.sh');
    fs.writeFileSync(scriptPath, script);
    fs.chmodSync(scriptPath, '755');
    console.log(`📜 Generated deployment script: ${scriptPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new NangoMCPConfigGenerator();
  generator.generateAllConfigurations()
    .then(() => generator.generateDeploymentScript())
    .catch(error => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = NangoMCPConfigGenerator;