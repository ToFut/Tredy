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
    // List available tools - dynamically generated based on provider capabilities
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.generateDynamicTools();
      return { tools };
    });

    // Handle tool calls
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
      // First try Nango records
      const response = await this.nango.listRecords({
        providerConfigKey: this.providerConfigKey,
        connectionId: process.env.NANGO_CONNECTION_ID,
        model,
        limit
      });

      if (response.records && response.records.length > 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(response.records, null, 2)
          }]
        };
      }
      
      // If no Nango records, try vector DB
      const { getVectorDbClass } = require('./utils/helpers');
      const VectorDb = getVectorDbClass();
      
      const vectorResults = await VectorDb.similaritySearch(
        `${this.provider}_${model.toLowerCase()}_${process.env.NANGO_CONNECTION_ID}`,
        args.query || '',
        { topK: limit }
      );
      
      if (vectorResults && vectorResults.length > 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(vectorResults, null, 2)
          }]
        };
      }
      
      // Fall back to proxy query
      return {
        content: [{
          type: 'text',
          text: `No synced data for model '${model}'. Use nango_query tool for real-time data.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching records: ${error.message}`
        }]
      };
    }
  }

  async generateDynamicTools() {
    // Generate tools based on provider capabilities
    const tools = [];
    
    // Check if sync is configured
    const hasSyncedData = await this.checkSyncStatus();
    
    if (hasSyncedData) {
      // Add vector search tool if data is synced
      tools.push({
        name: 'smart_search',
        description: `Smart search ${this.provider} data using AI-powered semantic search`,
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language search query'
            },
            resource: {
              type: 'string',
              description: 'Resource type to search (optional)'
            },
            limit: {
              type: 'number',
              description: 'Max results to return',
              default: 10
            }
          },
          required: ['query']
        }
      });
    }

    // Always add real-time query tool
    tools.push({
      name: 'realtime_query',
      description: `Query ${this.provider} API in real-time for latest data`,
      inputSchema: {
        type: 'object',
        properties: {
          endpoint: {
            type: 'string',
            description: 'API endpoint path'
          },
          method: {
            type: 'string',
            description: 'HTTP method',
            default: 'GET'
          },
          params: {
            type: 'object',
            description: 'Query parameters',
            additionalProperties: true
          },
          data: {
            type: 'object',
            description: 'Request body',
            additionalProperties: true
          }
        },
        required: ['endpoint']
      }
    });

    // Add CRUD operations based on provider
    const crudOps = await this.getProviderOperations();
    crudOps.forEach(op => {
      tools.push({
        name: `${op.resource}_${op.action}`,
        description: `${op.action} ${op.resource} in ${this.provider}`,
        inputSchema: op.schema
      });
    });

    // Add integration management tool
    tools.push({
      name: 'configure_sync',
      description: `Configure or update ${this.provider} data synchronization`,
      inputSchema: {
        type: 'object',
        properties: {
          resources: {
            type: 'array',
            items: { type: 'string' },
            description: 'Resources to sync'
          },
          frequency: {
            type: 'string',
            description: 'Sync frequency (e.g., 15m, 1h)',
            default: '15m'
          },
          vectorFields: {
            type: 'array',
            items: { type: 'string' },
            description: 'Fields to index for search'
          }
        }
      }
    });

    return tools;
  }

  async checkSyncStatus() {
    try {
      // Check if we have synced records
      const records = await this.nango.listRecords({
        providerConfigKey: this.providerConfigKey,
        connectionId: process.env.NANGO_CONNECTION_ID,
        model: 'Records',
        limit: 1
      });
      return records && records.records && records.records.length > 0;
    } catch {
      return false;
    }
  }

  async getProviderOperations() {
    // Provider-specific operations (can be extended with API discovery)
    const operations = {
      'google-calendar': [
        {
          resource: 'event',
          action: 'create',
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'string' },
              startTime: { type: 'string' },
              endTime: { type: 'string' },
              description: { type: 'string' },
              location: { type: 'string' }
            },
            required: ['summary', 'startTime', 'endTime']
          }
        }
      ],
      'slack': [
        {
          resource: 'message',
          action: 'send',
          schema: {
            type: 'object',
            properties: {
              channel: { type: 'string' },
              text: { type: 'string' }
            },
            required: ['channel', 'text']
          }
        }
      ],
      // Default operations for unknown providers
      default: [
        {
          resource: 'record',
          action: 'create',
          schema: {
            type: 'object',
            additionalProperties: true
          }
        }
      ]
    };
    
    return operations[this.provider] || operations.default;
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