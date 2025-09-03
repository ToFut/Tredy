#!/usr/bin/env node

/**
 * Universal Nango MCP Server
 * Works with ANY Nango-connected service automatically
 * No code changes needed for new providers!
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');

class UniversalNangoMCP {
  constructor() {
    // Get provider from environment
    this.provider = process.env.NANGO_PROVIDER || 'unknown';
    this.providerConfigKey = process.env.NANGO_PROVIDER_CONFIG_KEY || `${this.provider}-getting-started`;
    
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    this.server = new Server(
      { name: `nango-${this.provider}`, version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupTools();
  }

  setupTools() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'nango_query',
          description: `Query ${this.provider} API through Nango proxy`,
          inputSchema: {
            type: 'object',
            properties: {
              endpoint: {
                type: 'string',
                description: 'API endpoint path (e.g., /users, /messages, /events)'
              },
              method: {
                type: 'string',
                description: 'HTTP method (GET, POST, PUT, DELETE)',
                default: 'GET'
              },
              params: {
                type: 'object',
                description: 'Query parameters',
                additionalProperties: true
              },
              data: {
                type: 'object',
                description: 'Request body for POST/PUT',
                additionalProperties: true
              }
            },
            required: ['endpoint']
          }
        },
        {
          name: 'nango_sync_status',
          description: `Check sync status for ${this.provider}`,
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'nango_get_records',
          description: `Get synced records from ${this.provider}`,
          inputSchema: {
            type: 'object',
            properties: {
              model: {
                type: 'string',
                description: 'Model name (e.g., Events, Messages, Users)'
              },
              limit: {
                type: 'number',
                description: 'Number of records to retrieve',
                default: 50
              }
            },
            required: ['model']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'nango_query':
            return await this.makeQuery(args);
          case 'nango_sync_status':
            return await this.getSyncStatus();
          case 'nango_get_records':
            return await this.getRecords(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
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

  async makeQuery(args) {
    const { endpoint, method = 'GET', params, data } = args;
    
    // Build URL with params
    let fullEndpoint = endpoint;
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      fullEndpoint = `${endpoint}?${queryString}`;
    }

    try {
      let response;
      const requestOptions = {
        endpoint: fullEndpoint,
        connectionId: process.env.NANGO_CONNECTION_ID,
        providerConfigKey: this.providerConfigKey
      };

      if (method === 'GET') {
        response = await this.nango.get(requestOptions);
      } else if (method === 'POST') {
        response = await this.nango.post({
          ...requestOptions,
          data: data || {}
        });
      } else if (method === 'PUT') {
        response = await this.nango.put({
          ...requestOptions,
          data: data || {}
        });
      } else if (method === 'DELETE') {
        response = await this.nango.delete(requestOptions);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.data, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Query failed: ${error.message}`);
    }
  }

  async getSyncStatus() {
    try {
      const connection = await this.nango.getConnection(
        this.providerConfigKey,
        process.env.NANGO_CONNECTION_ID
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            connected: true,
            provider: this.provider,
            lastSynced: connection.last_fetched_at,
            connectionId: connection.connection_id
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get sync status: ${error.message}`);
    }
  }

  async getRecords(args) {
    const { model, limit = 50 } = args;
    
    try {
      const response = await this.nango.listRecords({
        providerConfigKey: this.providerConfigKey,
        connectionId: process.env.NANGO_CONNECTION_ID,
        model,
        limit
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response.records, null, 2)
        }]
      };
    } catch (error) {
      // If no sync configured, fall back to proxy query
      return {
        content: [{
          type: 'text',
          text: `No sync configured for model '${model}'. Use nango_query tool for real-time data.`
        }]
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Universal Nango MCP Server started for ${this.provider}`);
  }
}

// Start the server
if (require.main === module) {
  const server = new UniversalNangoMCP();
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = UniversalNangoMCP;