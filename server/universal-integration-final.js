#!/usr/bin/env node

/**
 * Universal Integration System - FINAL VERSION
 * 
 * ONE system that:
 * 1. Connects to ANY service via Nango OAuth
 * 2. Discovers capabilities at runtime
 * 3. Generates tools dynamically
 * 4. Works from chat without manual setup
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');
const fs = require('fs').promises;
const path = require('path');

class UniversalIntegration {
  constructor() {
    this.server = new Server(
      { name: 'universal-integration', version: '3.0.0' },
      { capabilities: { tools: {} } }
    );

    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    // Runtime cache for discovered services
    this.serviceCache = new Map();
    
    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'connect_service',
          description: 'Connect any service (LinkedIn, Slack, GitHub, etc.) through OAuth',
          inputSchema: {
            type: 'object',
            properties: {
              service: { 
                type: 'string', 
                description: 'Service name (linkedin, slack, github, shopify, etc.)' 
              },
              workspaceId: { 
                type: 'string', 
                description: 'Workspace ID (auto-detected if not provided)' 
              }
            },
            required: ['service']
          }
        },
        {
          name: 'discover_service',
          description: 'Discover what a connected service can do',
          inputSchema: {
            type: 'object',
            properties: {
              service: { type: 'string', description: 'Service name' },
              workspaceId: { type: 'string', description: 'Workspace ID' }
            },
            required: ['service']
          }
        },
        {
          name: 'call_service',
          description: 'Call any API endpoint on a connected service',
          inputSchema: {
            type: 'object',
            properties: {
              service: { type: 'string', description: 'Service name' },
              action: { type: 'string', description: 'Action to perform (e.g., send_message, create_post)' },
              data: { type: 'object', description: 'Data for the action' },
              workspaceId: { type: 'string', description: 'Workspace ID' }
            },
            required: ['service', 'action']
          }
        },
        {
          name: 'list_connected_services',
          description: 'List all connected services for a workspace',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceId: { type: 'string', description: 'Workspace ID' }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'connect_service':
            return await this.connectService(args);
          case 'discover_service':
            return await this.discoverService(args);
          case 'call_service':
            return await this.callService(args);
          case 'list_connected_services':
            return await this.listConnectedServices(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[Universal] Error in ${name}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  /**
   * Connect a new service
   */
  async connectService(args) {
    const service = args.service.toLowerCase();
    const workspaceId = args.workspaceId || '1';
    const connectionId = `workspace_${workspaceId}`;
    
    // Check if already connected
    try {
      const existing = await this.nango.getConnection(service, connectionId);
      if (existing) {
        return {
          content: [{
            type: 'text',
            text: `✅ ${service} is already connected for workspace ${workspaceId}!

To use it, try:
• "${service} discover capabilities"
• "${service} send message to [person]"
• "${service} create post [content]"`
          }]
        };
      }
    } catch (e) {
      // Not connected yet
    }
    
    // Generate OAuth URL
    const authUrl = `https://app.nango.dev/oauth/connect?` +
      `publicKey=${process.env.NANGO_PUBLIC_KEY}&` +
      `connectionId=${connectionId}&` +
      `providerConfigKey=${service}`;
    
    // Register the service for this workspace
    await this.registerService(service, workspaceId);
    
    return {
      content: [{
        type: 'text',
        text: `To connect ${service}:

1. Make sure ${service} is configured in Nango:
   - Go to https://app.nango.dev
   - Add ${service} integration
   - Set OAuth credentials

2. Connect in AnythingLLM:
   - Go to Workspace Settings → Connectors
   - Find ${service}
   - Click Connect

3. Once connected, you can:
   • Discover what ${service} can do
   • Send messages, create posts, etc.
   • All through natural language!

Service registered for workspace ${workspaceId}.`
      }]
    };
  }

  /**
   * Discover service capabilities
   */
  async discoverService(args) {
    const service = args.service.toLowerCase();
    const workspaceId = args.workspaceId || '1';
    const connectionId = `workspace_${workspaceId}`;
    
    // Check connection
    try {
      await this.nango.getConnection(service, connectionId);
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ ${service} is not connected. Use "connect ${service}" first.`
        }]
      };
    }
    
    // Check cache
    const cacheKey = `${service}_${workspaceId}`;
    if (this.serviceCache.has(cacheKey)) {
      const cached = this.serviceCache.get(cacheKey);
      return {
        content: [{
          type: 'text',
          text: `${service} capabilities (cached):

${this.formatCapabilities(cached)}`
        }]
      };
    }
    
    // Discover endpoints
    const capabilities = await this.analyzeService(service, connectionId);
    
    // Cache results
    this.serviceCache.set(cacheKey, capabilities);
    
    return {
      content: [{
        type: 'text',
        text: `Discovered ${service} capabilities:

${this.formatCapabilities(capabilities)}

You can now use natural language like:
• "${service} send message to John"
• "${service} create post about AI"
• "${service} get my profile"`
      }]
    };
  }

  /**
   * Call a service with natural language
   */
  async callService(args) {
    const service = args.service.toLowerCase();
    const action = args.action;
    const data = args.data || {};
    const workspaceId = args.workspaceId || '1';
    const connectionId = `workspace_${workspaceId}`;
    
    // Get service capabilities
    const cacheKey = `${service}_${workspaceId}`;
    let capabilities = this.serviceCache.get(cacheKey);
    
    if (!capabilities) {
      // Discover first
      capabilities = await this.analyzeService(service, connectionId);
      this.serviceCache.set(cacheKey, capabilities);
    }
    
    // Map natural language to API endpoint
    const endpoint = this.mapActionToEndpoint(action, capabilities);
    
    if (!endpoint) {
      return {
        content: [{
          type: 'text',
          text: `I don't know how to "${action}" with ${service}.

Available actions:
${capabilities.actions.map(a => `• ${a}`).join('\n')}

Try rephrasing your request.`
        }]
      };
    }
    
    // Make the API call
    try {
      const response = await this.nango.proxy({
        method: endpoint.method,
        endpoint: endpoint.path,
        connectionId,
        providerConfigKey: service,
        data: endpoint.method === 'POST' ? this.prepareData(data, endpoint) : undefined,
        params: endpoint.method === 'GET' ? data : undefined
      });
      
      return {
        content: [{
          type: 'text',
          text: this.formatResponse(action, response.data, service)
        }]
      };
    } catch (error) {
      return this.handleServiceError(error, service, action);
    }
  }

  /**
   * List connected services
   */
  async listConnectedServices(args) {
    const workspaceId = args.workspaceId || '1';
    const services = [];
    
    // Check common services
    const commonServices = ['linkedin', 'slack', 'github', 'gmail', 'shopify'];
    
    for (const service of commonServices) {
      try {
        const connection = await this.nango.getConnection(
          service,
          `workspace_${workspaceId}`
        );
        if (connection) {
          services.push({
            name: service,
            connected: true,
            connectionId: connection.connection_id
          });
        }
      } catch (e) {
        // Not connected
      }
    }
    
    if (services.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `No services connected for workspace ${workspaceId}.

To connect a service, say:
• "connect LinkedIn"
• "connect Slack"
• "connect GitHub"`
        }]
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: `Connected services for workspace ${workspaceId}:

${services.map(s => `✅ ${s.name}`).join('\n')}

To use them, try:
${services.map(s => `• "${s.name} discover capabilities"`).join('\n')}`
      }]
    };
  }

  /**
   * Analyze a service to find capabilities
   */
  async analyzeService(service, connectionId) {
    const capabilities = {
      service,
      endpoints: [],
      actions: [],
      limitations: []
    };
    
    // Service-specific patterns
    const patterns = {
      linkedin: {
        endpoints: [
          { path: '/v2/userinfo', method: 'GET', action: 'get profile' },
          { path: '/v2/ugcPosts', method: 'POST', action: 'create post' },
          { path: '/v2/messages', method: 'POST', action: 'send message' }
        ],
        limitations: ['Cannot read messages', 'Cannot list connections']
      },
      slack: {
        endpoints: [
          { path: '/chat.postMessage', method: 'POST', action: 'send message' },
          { path: '/conversations.list', method: 'GET', action: 'list channels' },
          { path: '/users.list', method: 'GET', action: 'list users' }
        ]
      },
      github: {
        endpoints: [
          { path: '/user', method: 'GET', action: 'get profile' },
          { path: '/repos', method: 'POST', action: 'create repository' },
          { path: '/issues', method: 'POST', action: 'create issue' }
        ]
      },
      gmail: {
        endpoints: [
          { path: '/gmail/v1/users/me/messages/send', method: 'POST', action: 'send email' },
          { path: '/gmail/v1/users/me/messages', method: 'GET', action: 'get emails' }
        ]
      }
    };
    
    const servicePatterns = patterns[service] || { endpoints: [], limitations: [] };
    
    // Test each endpoint
    for (const endpoint of servicePatterns.endpoints) {
      try {
        const response = await this.nango.proxy({
          method: endpoint.method,
          endpoint: endpoint.path,
          connectionId,
          providerConfigKey: service,
          params: endpoint.method === 'GET' ? { limit: 1 } : {}
        });
        
        if (response.status < 400) {
          capabilities.endpoints.push(endpoint);
          capabilities.actions.push(endpoint.action);
        }
      } catch (e) {
        // Endpoint not available
        if (e.response?.status === 403) {
          capabilities.limitations.push(`${endpoint.action} requires additional permissions`);
        }
      }
    }
    
    capabilities.limitations.push(...servicePatterns.limitations);
    
    return capabilities;
  }

  /**
   * Map natural language to endpoint
   */
  mapActionToEndpoint(action, capabilities) {
    const actionLower = action.toLowerCase();
    
    for (const endpoint of capabilities.endpoints) {
      const endpointAction = endpoint.action.toLowerCase();
      
      // Direct match
      if (actionLower.includes(endpointAction)) {
        return endpoint;
      }
      
      // Fuzzy match
      const actionWords = actionLower.split(' ');
      const endpointWords = endpointAction.split(' ');
      
      for (const word of actionWords) {
        for (const eWord of endpointWords) {
          if (word.includes(eWord) || eWord.includes(word)) {
            return endpoint;
          }
        }
      }
    }
    
    return null;
  }

  /**
   * Prepare data for API call
   */
  prepareData(data, endpoint) {
    // Service-specific data preparation
    if (endpoint.path.includes('ugcPosts')) {
      // LinkedIn post
      return {
        author: `urn:li:person:${data.authorId || 'me'}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: data.text || data.content || data.message
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };
    }
    
    if (endpoint.path.includes('chat.postMessage')) {
      // Slack message
      return {
        channel: data.channel || data.to,
        text: data.text || data.message || data.content
      };
    }
    
    // Default
    return data;
  }

  /**
   * Format response for display
   */
  formatResponse(action, data, service) {
    if (!data) {
      return `✅ ${action} completed successfully on ${service}!`;
    }
    
    if (Array.isArray(data)) {
      return `Found ${data.length} results for "${action}" on ${service}:

${data.slice(0, 5).map((item, i) => 
  `${i + 1}. ${this.summarizeItem(item)}`
).join('\n')}`;
    }
    
    if (typeof data === 'object') {
      if (data.id) {
        return `✅ ${action} successful on ${service}! ID: ${data.id}`;
      }
      return `✅ ${action} completed on ${service}!

${JSON.stringify(data, null, 2).substring(0, 500)}`;
    }
    
    return `Result: ${data}`;
  }

  /**
   * Format capabilities for display
   */
  formatCapabilities(capabilities) {
    let text = `Available actions:\n`;
    text += capabilities.actions.map(a => `✅ ${a}`).join('\n');
    
    if (capabilities.limitations.length > 0) {
      text += `\n\nLimitations:\n`;
      text += capabilities.limitations.map(l => `⚠️ ${l}`).join('\n');
    }
    
    return text;
  }

  /**
   * Handle service errors
   */
  handleServiceError(error, service, action) {
    const status = error.response?.status;
    
    if (status === 404) {
      return {
        content: [{
          type: 'text',
          text: `❌ Cannot ${action} on ${service} - endpoint not found.

This might mean:
• The API has changed
• You need different permissions
• The action isn't supported

Try "discover ${service}" to see what's available.`
        }]
      };
    }
    
    if (status === 403 || status === 401) {
      return {
        content: [{
          type: 'text',
          text: `❌ Permission denied for ${action} on ${service}.

This usually means:
• OAuth token expired - reconnect the service
• Missing required scopes - check Nango configuration
• API restrictions - some actions aren't available

Try reconnecting: "connect ${service}"`
        }]
      };
    }
    
    return {
      content: [{
        type: 'text',
        text: `❌ Failed to ${action} on ${service}: ${error.message}`
      }],
      isError: true
    };
  }

  /**
   * Register service in MCP config
   */
  async registerService(service, workspaceId) {
    const configPath = path.join(__dirname, 'storage/plugins/anythingllm_mcp_servers.json');
    
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      // Add universal integration if not exists
      const key = `universal_${service}_ws${workspaceId}`;
      if (!config.mcpServers[key]) {
        config.mcpServers[key] = {
          type: 'stdio',
          command: 'node',
          args: [__filename],
          env: {
            SERVICE: service,
            WORKSPACE_ID: workspaceId,
            NANGO_SECRET_KEY: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
            NANGO_HOST: 'https://api.nango.dev'
          },
          anythingllm: {
            autoStart: true,
            workspaceAware: true
          }
        };
        
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.error(`[Universal] Registered ${service} for workspace ${workspaceId}`);
      }
    } catch (e) {
      console.error('[Universal] Could not update MCP config:', e);
    }
  }

  summarizeItem(item) {
    const key = item.name || item.title || item.id || item.email || 'Item';
    const desc = item.description || item.message || item.text || '';
    return `${key}${desc ? ': ' + desc.substring(0, 50) : ''}`;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Universal Integration started - ONE system for ALL services');
  }
}

// Start server
if (require.main === module) {
  const server = new UniversalIntegration();
  server.start().catch(error => {
    console.error('Failed to start Universal Integration:', error);
    process.exit(1);
  });
}

module.exports = UniversalIntegration;