#!/usr/bin/env node

/**
 * Universal MCP Gateway
 * 
 * A single gateway that can dynamically load and proxy ANY MCP server
 * with automatic OAuth integration via Nango.
 * 
 * This eliminates the need to create individual wrappers for each service.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { spawn } = require('child_process');
const { Nango } = require('@nangohq/node');

class UniversalMCPGateway {
  constructor() {
    this.serviceName = process.env.MCP_SERVICE_NAME || this.detectServiceFromArgs();
    this.workspaceId = this.detectWorkspace();
    this.mcpConfig = this.loadMCPConfig();
    
    this.server = new Server(
      { 
        name: `universal-gateway-${this.serviceName}`,
        version: '1.0.0' 
      },
      { capabilities: { tools: {} } }
    );

    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    this.setupGateway();
  }

  /**
   * Load MCP configuration from registry
   */
  loadMCPConfig() {
    const registry = {
      // Social Media
      'whatsapp': {
        repo: 'lharries/whatsapp-mcp',
        command: 'npx',
        args: ['whatsapp-mcp'],
        needsOAuth: true,
        nangoProvider: 'whatsapp-business',
        envMapping: {
          'WHATSAPP_TOKEN': 'access_token'
        }
      },
      'instagram': {
        repo: 'jlbadano/ig-mcp',
        command: 'npx',
        args: ['ig-mcp'],
        needsOAuth: true,
        nangoProvider: 'instagram-business',
        envMapping: {
          'INSTAGRAM_ACCESS_TOKEN': 'access_token',
          'INSTAGRAM_PAGE_ID': 'page_id'
        }
      },
      'twitter': {
        repo: 'EasyLLM/twitter-mcp',
        command: 'npx',
        args: ['twitter-mcp'],
        needsOAuth: true,
        nangoProvider: 'twitter',
        envMapping: {
          'TWITTER_BEARER_TOKEN': 'bearer_token'
        }
      },
      'linkedin': {
        repo: 'modelcontextprotocol/linkedin-mcp',
        command: 'node',
        args: ['/app/server/linkedin-mcp.js'],
        needsOAuth: true,
        nangoProvider: 'linkedin',
        envMapping: {
          'LINKEDIN_ACCESS_TOKEN': 'access_token'
        }
      },
      
      // Communication
      'slack': {
        repo: 'modelcontextprotocol/servers/slack',
        command: 'npx',
        args: ['@modelcontextprotocol/server-slack'],
        needsOAuth: true,
        nangoProvider: 'slack',
        envMapping: {
          'SLACK_BOT_TOKEN': 'bot_token',
          'SLACK_TEAM_ID': 'team_id'
        }
      },
      'discord': {
        repo: 'SomeDiscordMCP/discord-mcp',
        command: 'npx',
        args: ['discord-mcp'],
        needsOAuth: true,
        nangoProvider: 'discord',
        envMapping: {
          'DISCORD_BOT_TOKEN': 'bot_token'
        }
      },
      'telegram': {
        repo: 'nelzomal/telegram-mcp',
        command: 'npx',
        args: ['telegram-mcp'],
        needsOAuth: false, // Uses bot token
        envMapping: {
          'TELEGRAM_BOT_TOKEN': 'bot_token'
        }
      },

      // Productivity
      'notion': {
        repo: 'modelcontextprotocol/servers/notion',
        command: 'npx',
        args: ['@modelcontextprotocol/server-notion'],
        needsOAuth: true,
        nangoProvider: 'notion',
        envMapping: {
          'NOTION_API_KEY': 'api_key'
        }
      },
      'airtable': {
        repo: 'felores/airtable-mcp',
        command: 'npx',
        args: ['airtable-mcp'],
        needsOAuth: true,
        nangoProvider: 'airtable',
        envMapping: {
          'AIRTABLE_API_KEY': 'api_key'
        }
      },
      'google-sheets': {
        repo: 'modelcontextprotocol/servers/google-sheets',
        command: 'npx',
        args: ['@modelcontextprotocol/server-google-sheets'],
        needsOAuth: true,
        nangoProvider: 'google-sheets',
        envMapping: {
          'GOOGLE_SHEETS_CREDENTIALS': 'credentials'
        }
      },

      // E-commerce
      'shopify': {
        repo: 'modelcontextprotocol/servers/shopify',
        command: 'npx',
        args: ['@modelcontextprotocol/server-shopify'],
        needsOAuth: true,
        nangoProvider: 'shopify',
        envMapping: {
          'SHOPIFY_ACCESS_TOKEN': 'access_token',
          'SHOPIFY_STORE_DOMAIN': 'store_domain'
        }
      },
      'stripe': {
        repo: 'modelcontextprotocol/servers/stripe',
        command: 'npx',
        args: ['@modelcontextprotocol/server-stripe'],
        needsOAuth: false, // API key based
        envMapping: {
          'STRIPE_API_KEY': 'api_key'
        }
      },

      // Development
      'github': {
        repo: 'modelcontextprotocol/servers/github',
        command: 'npx',
        args: ['@modelcontextprotocol/server-github'],
        needsOAuth: true,
        nangoProvider: 'github',
        envMapping: {
          'GITHUB_TOKEN': 'access_token'
        }
      },
      'gitlab': {
        repo: 'modelcontextprotocol/servers/gitlab',
        command: 'npx',
        args: ['@modelcontextprotocol/server-gitlab'],
        needsOAuth: true,
        nangoProvider: 'gitlab',
        envMapping: {
          'GITLAB_TOKEN': 'access_token'
        }
      },
      'jira': {
        repo: 'brest-cv/jira-mcp',
        command: 'npx',
        args: ['jira-mcp'],
        needsOAuth: true,
        nangoProvider: 'jira',
        envMapping: {
          'JIRA_API_TOKEN': 'api_token',
          'JIRA_EMAIL': 'email',
          'JIRA_DOMAIN': 'domain'
        }
      },

      // CRM
      'hubspot': {
        repo: 'modelcontextprotocol/servers/hubspot',
        command: 'npx',
        args: ['@modelcontextprotocol/server-hubspot'],
        needsOAuth: true,
        nangoProvider: 'hubspot',
        envMapping: {
          'HUBSPOT_ACCESS_TOKEN': 'access_token'
        }
      },
      'salesforce': {
        repo: 'modelcontextprotocol/servers/salesforce',
        command: 'npx',
        args: ['@modelcontextprotocol/server-salesforce'],
        needsOAuth: true,
        nangoProvider: 'salesforce',
        envMapping: {
          'SALESFORCE_ACCESS_TOKEN': 'access_token',
          'SALESFORCE_INSTANCE_URL': 'instance_url'
        }
      },

      // Cloud Platforms
      'aws': {
        repo: 'modelcontextprotocol/servers/aws',
        command: 'npx',
        args: ['@modelcontextprotocol/server-aws'],
        needsOAuth: false, // Uses AWS credentials
        envMapping: {
          'AWS_ACCESS_KEY_ID': 'access_key_id',
          'AWS_SECRET_ACCESS_KEY': 'secret_access_key'
        }
      },
      'kubernetes': {
        repo: 'Flux159/kubernetes-mcp',
        command: 'npx',
        args: ['kubernetes-mcp'],
        needsOAuth: false, // Uses kubeconfig
        envMapping: {
          'KUBECONFIG': 'kubeconfig_path'
        }
      },

      // Databases
      'postgres': {
        repo: 'modelcontextprotocol/servers/postgres',
        command: 'npx',
        args: ['@modelcontextprotocol/server-postgres'],
        needsOAuth: false,
        envMapping: {
          'POSTGRES_CONNECTION_STRING': 'connection_string'
        }
      },
      'mongodb': {
        repo: 'kiliczsh/mongo-mcp',
        command: 'npx',
        args: ['mongo-mcp'],
        needsOAuth: false,
        envMapping: {
          'MONGODB_URI': 'connection_string'
        }
      },

      // AI/ML Platforms
      'openai': {
        repo: 'modelcontextprotocol/servers/openai',
        command: 'npx',
        args: ['@modelcontextprotocol/server-openai'],
        needsOAuth: false,
        envMapping: {
          'OPENAI_API_KEY': 'api_key'
        }
      },
      'anthropic': {
        repo: 'modelcontextprotocol/servers/anthropic',
        command: 'npx',
        args: ['@modelcontextprotocol/server-anthropic'],
        needsOAuth: false,
        envMapping: {
          'ANTHROPIC_API_KEY': 'api_key'
        }
      }
    };

    return registry[this.serviceName] || null;
  }

  /**
   * Detect workspace from various sources
   */
  detectWorkspace() {
    // Priority order:
    // 1. Command line argument
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--workspace' && args[i + 1]) {
        return args[i + 1];
      }
    }

    // 2. Environment variable from MCP server name
    if (process.env.MCP_SERVER_NAME) {
      const match = process.env.MCP_SERVER_NAME.match(/_ws(\d+)$/);
      if (match) return match[1];
    }

    // 3. NANGO_CONNECTION_ID
    if (process.env.NANGO_CONNECTION_ID) {
      const match = process.env.NANGO_CONNECTION_ID.match(/workspace_(\d+)/);
      if (match) return match[1];
    }

    console.error('[Universal Gateway] No workspace detected');
    return null;
  }

  /**
   * Detect service name from command line args
   */
  detectServiceFromArgs() {
    const args = process.argv.slice(2);
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--service' && args[i + 1]) {
        return args[i + 1];
      }
    }
    return null;
  }

  /**
   * Setup the gateway and proxy to the actual MCP server
   */
  async setupGateway() {
    if (!this.mcpConfig) {
      throw new Error(`Unknown MCP service: ${this.serviceName}`);
    }

    // Get OAuth credentials if needed
    let credentials = {};
    if (this.mcpConfig.needsOAuth && this.workspaceId) {
      try {
        const connection = await this.nango.getConnection({
          connectionId: `workspace_${this.workspaceId}`,
          providerConfigKey: this.mcpConfig.nangoProvider
        });
        credentials = connection.credentials;
      } catch (error) {
        console.error(`[Universal Gateway] Failed to get OAuth credentials: ${error.message}`);
      }
    }

    // Build environment variables for the child process
    const childEnv = { ...process.env };
    for (const [envKey, credKey] of Object.entries(this.mcpConfig.envMapping || {})) {
      if (credentials[credKey]) {
        childEnv[envKey] = credentials[credKey];
      }
    }

    // Spawn the actual MCP server
    this.childProcess = spawn(this.mcpConfig.command, this.mcpConfig.args, {
      env: childEnv,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Proxy stdout/stderr
    this.childProcess.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    this.childProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    // Proxy stdin
    process.stdin.on('data', (data) => {
      this.childProcess.stdin.write(data);
    });

    // Handle child process exit
    this.childProcess.on('exit', (code) => {
      console.error(`[Universal Gateway] Child MCP server exited with code ${code}`);
      process.exit(code);
    });

    console.error(`[Universal Gateway] Started ${this.serviceName} MCP server for workspace ${this.workspaceId}`);
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`[Universal Gateway] Gateway running for ${this.serviceName}`);
  }
}

// Start the gateway
if (require.main === module) {
  const gateway = new UniversalMCPGateway();
  gateway.start().catch(error => {
    console.error('[Universal Gateway] Failed to start:', error);
    process.exit(1);
  });
}

module.exports = UniversalMCPGateway;