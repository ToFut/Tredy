#!/usr/bin/env node

/**
 * OAuth Injector - Automatically configure OAuth for any service
 * Just like adding agent skills, but for OAuth!
 */

const { Nango } = require('@nangohq/node');
const fs = require('fs').promises;
const path = require('path');

class OAuthInjector {
  constructor() {
    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
    
    // Pre-built OAuth configurations for common services
    this.oauthConfigs = {
      gmail: {
        provider: 'google',
        integrationId: 'gmail-integration',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify',
          'https://www.googleapis.com/auth/userinfo.email'
        ],
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      },
      
      'google-calendar': {
        provider: 'google',
        integrationId: 'google-calendar-integration',
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      },
      
      slack: {
        provider: 'slack',
        integrationId: 'slack-integration',
        authorizationUrl: 'https://slack.com/oauth/v2/authorize',
        tokenUrl: 'https://slack.com/api/oauth.v2.access',
        scopes: [
          'channels:read',
          'channels:write',
          'chat:write',
          'users:read',
          'team:read'
        ],
        clientId: process.env.SLACK_CLIENT_ID,
        clientSecret: process.env.SLACK_CLIENT_SECRET
      },
      
      github: {
        provider: 'github',
        integrationId: 'github-integration',
        authorizationUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scopes: [
          'repo',
          'user',
          'notifications',
          'gist',
          'workflow'
        ],
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET
      },
      
      notion: {
        provider: 'notion',
        integrationId: 'notion-integration',
        authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
        tokenUrl: 'https://api.notion.com/v1/oauth/token',
        scopes: [], // Notion doesn't use scopes
        clientId: process.env.NOTION_CLIENT_ID,
        clientSecret: process.env.NOTION_CLIENT_SECRET
      },
      
      discord: {
        provider: 'discord',
        integrationId: 'discord-integration',
        authorizationUrl: 'https://discord.com/api/oauth2/authorize',
        tokenUrl: 'https://discord.com/api/oauth2/token',
        scopes: [
          'identify',
          'guilds',
          'messages.read',
          'messages.write'
        ],
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET
      }
    };
  }

  /**
   * Inject OAuth configuration for a service
   */
  async injectOAuth(serviceName, options = {}) {
    console.log(`\n🔧 Injecting OAuth for ${serviceName}...`);
    
    // Get pre-built config or use custom
    const config = this.oauthConfigs[serviceName] || options;
    
    if (!config.integrationId) {
      config.integrationId = `${serviceName}-integration`;
    }
    
    try {
      // Step 1: Create integration in Nango
      console.log('1️⃣ Creating Nango integration...');
      await this.createNangoIntegration(config);
      
      // Step 2: Generate MCP server from template
      console.log('2️⃣ Generating MCP server...');
      await this.generateMCPServer(serviceName, config);
      
      // Step 3: Register MCP in AnythingLLM
      console.log('3️⃣ Registering MCP server...');
      await this.registerMCPServer(serviceName);
      
      // Step 4: Generate OAuth URL
      console.log('4️⃣ Generating OAuth URL...');
      const authUrl = await this.generateAuthUrl(config);
      
      console.log(`\n✅ OAuth injection complete for ${serviceName}!`);
      console.log('\n📋 Next steps:');
      console.log(`1. Authorize: ${authUrl}`);
      console.log('2. Restart AnythingLLM server');
      console.log(`3. Test: @agent use ${serviceName}`);
      
      return {
        success: true,
        service: serviceName,
        integrationId: config.integrationId,
        authUrl
      };
      
    } catch (error) {
      console.error(`❌ Failed to inject OAuth: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Nango integration via API
   */
  async createNangoIntegration(config) {
    // In production, this would use Nango Admin API
    // For now, we'll create the config file
    const nangoConfig = {
      integrations: {
        [config.integrationId]: {
          provider: config.provider,
          auth_mode: 'OAUTH2',
          authorization_url: config.authorizationUrl,
          token_url: config.tokenUrl,
          scope_separator: ' ',
          default_scopes: config.scopes,
          credentials: {
            client_id: config.clientId,
            client_secret: config.clientSecret
          }
        }
      }
    };
    
    // Save Nango configuration
    const configPath = path.join(__dirname, 'nango-integrations', config.integrationId, 'nango.yaml');
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(nangoConfig, null, 2));
    
    console.log(`   ✓ Nango config saved to ${configPath}`);
  }

  /**
   * Generate MCP server from template
   */
  async generateMCPServer(serviceName, config) {
    const template = await fs.readFile(path.join(__dirname, 'MCP_STANDARD_TEMPLATE.js'), 'utf8');
    
    // Replace placeholders
    let mcpCode = template
      .replace(/\[SERVICE_NAME\]/g, serviceName)
      .replace(/\[RESOURCE\]/g, this.getResourceName(serviceName))
      .replace(/\[service\]/g, serviceName.toLowerCase())
      .replace(/\[resources\]/g, this.getResourcePlural(serviceName))
      .replace(/'gmail-integration'/g, `'${config.integrationId}'`);
    
    // Save MCP server
    const mcpPath = path.join(__dirname, `simple-${serviceName}-mcp.js`);
    await fs.writeFile(mcpPath, mcpCode);
    await fs.chmod(mcpPath, 0o755); // Make executable
    
    console.log(`   ✓ MCP server created at ${mcpPath}`);
  }

  /**
   * Register MCP server in AnythingLLM
   */
  async registerMCPServer(serviceName) {
    const configPath = '/Users/segevbin/.anythingllm/plugins/anythingllm_mcp_servers.json';
    
    // Read current config
    let config = { mcpServers: {} };
    try {
      const content = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(content);
    } catch (e) {
      // File doesn't exist, use default
    }
    
    // Add new MCP server
    config.mcpServers[`simple-${serviceName}`] = {
      command: 'node',
      args: [path.join(__dirname, `simple-${serviceName}-mcp.js`)],
      env: {
        NANGO_SECRET_KEY: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
        NANGO_HOST: 'https://api.nango.dev',
        NANGO_CONNECTION_ID: 'workspace_3'
      }
    };
    
    // Save updated config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`   ✓ MCP registered in AnythingLLM`);
  }

  /**
   * Generate OAuth URL for authorization
   */
  async generateAuthUrl(config) {
    try {
      // This would use Nango API in production
      const params = new URLSearchParams({
        client_id: config.clientId || 'YOUR_CLIENT_ID',
        redirect_uri: 'https://api.nango.dev/oauth/callback',
        response_type: 'code',
        scope: config.scopes.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        state: `${config.integrationId}:workspace_3`
      });
      
      return `${config.authorizationUrl}?${params.toString()}`;
    } catch (error) {
      return 'Please configure OAuth in Nango Dashboard';
    }
  }

  /**
   * Helper: Get resource name for service
   */
  getResourceName(service) {
    const resourceMap = {
      gmail: 'email',
      slack: 'message',
      github: 'issue',
      notion: 'page',
      discord: 'message',
      'google-calendar': 'event'
    };
    return resourceMap[service] || 'item';
  }

  /**
   * Helper: Get resource plural
   */
  getResourcePlural(service) {
    const resourceMap = {
      gmail: 'emails',
      slack: 'messages',
      github: 'issues',
      notion: 'pages',
      discord: 'messages',
      'google-calendar': 'events'
    };
    return resourceMap[service] || 'items';
  }

  /**
   * List available OAuth configs
   */
  listAvailable() {
    console.log('\n📋 Available OAuth Configurations:\n');
    Object.keys(this.oauthConfigs).forEach(service => {
      console.log(`  • ${service}`);
    });
    console.log('\nUsage: oauth-injector.js <service>');
    console.log('Example: oauth-injector.js gmail');
  }
}

// CLI Interface
async function main() {
  const injector = new OAuthInjector();
  const service = process.argv[2];
  
  if (!service) {
    injector.listAvailable();
    return;
  }
  
  if (service === 'all') {
    // Inject all services
    for (const serviceName of Object.keys(injector.oauthConfigs)) {
      await injector.injectOAuth(serviceName);
      console.log('---');
    }
  } else {
    // Inject specific service
    await injector.injectOAuth(service);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = OAuthInjector;