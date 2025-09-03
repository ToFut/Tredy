#!/usr/bin/env node

/**
 * STANDARDIZED MCP SERVER TEMPLATE
 * Based on successful Google Calendar MCP implementation
 * 
 * To create a new MCP server:
 * 1. Copy this template
 * 2. Replace gmail with your service (e.g., gmail, slack, github)
 * 3. Define 2-4 core tools maximum
 * 4. Keep it simple and focused
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class gmailMCP {
  constructor() {
    // Always require Nango for OAuth
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    this.server = new Server(
      { name: 'gmail-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupTools();
  }

  setupTools() {
    // Define 2-4 core tools maximum - keep it focused!
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_email',
          description: 'Get [resource] from gmail. Use when user wants to view, check, or list emails.',
          inputSchema: {
            type: 'object',
            properties: {
              // Keep parameters simple with good defaults
              limit: {
                type: 'number',
                description: 'Maximum number to return (default: 10)',
                default: 10
              },
              filter: {
                type: 'string',
                description: 'Optional filter/search query'
              }
            }
          }
        },
        {
          name: 'create_email',
          description: 'Create new [resource] in gmail. Use when user wants to add, create, or make new [resource].',
          inputSchema: {
            type: 'object',
            properties: {
              // Only required fields, everything else optional
              title: {
                type: 'string',
                description: 'Title or name of [resource]'
              },
              content: {
                type: 'string',
                description: 'Main content or body'
              }
            },
            required: ['title'] // Minimal required fields
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_email':
            return await this.get[Resource](args);
          case 'create_email':
            return await this.create[Resource](args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        // Always return user-friendly error messages
        console.error(`gmail Error:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message || 'Something went wrong. Please try again.'}`
          }],
          isError: true
        };
      }
    });
  }

  async get[Resource](args) {
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    // Smart defaults
    const { limit = 10, filter } = args;

    try {
      // Simple Nango proxy call
      const response = await nango.get({
        endpoint: '/gmail/v1/emails',
        connectionId: process.env.NANGO_CONNECTION_ID || 'workspace_3',
        providerConfigKey: 'gmail-integration',
        params: {
          limit,
          ...(filter && { q: filter })
        }
      });

      const items = response.data?.items || response.data || [];
      
      if (items.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No emails found.'
          }]
        };
      }

      // Format response clearly
      const formatted = items.map((item, i) => 
        `${i + 1}. ${item.title || item.name}\n   ${item.description || item.content || ''}`
      ).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${items.length} emails:\n\n${formatted}`
        }]
      };
    } catch (error) {
      // Handle API errors gracefully
      console.error('API Error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Could not fetch emails. Please check your connection and try again.`
        }],
        isError: true
      };
    }
  }

  async create[Resource](args) {
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const { title, content } = args;

    try {
      const response = await nango.post({
        endpoint: '/gmail/v1/emails',
        connectionId: process.env.NANGO_CONNECTION_ID || 'workspace_3',
        providerConfigKey: 'gmail-integration',
        data: {
          title,
          ...(content && { content })
        }
      });

      return {
        content: [{
          type: 'text',
          text: `✓ [Resource] created successfully: "${title}" (ID: ${response.data.id})`
        }]
      };
    } catch (error) {
      console.error('Create Error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Could not create [resource]. Please check your input and try again.`
        }],
        isError: true
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('gmail MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new gmailMCP();
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = gmailMCP;

/* 
IMPLEMENTATION CHECKLIST:
□ Replace all gmail with your service (e.g., Gmail)
□ Replace all email with your resource (e.g., Email, Message, Issue)
□ Define 2-4 core tools maximum
□ Keep parameter lists simple with defaults
□ Use clear, action-oriented tool descriptions
□ Test error handling with bad inputs
□ Verify Nango OAuth flow works
□ Add to MCP configuration file
□ Restart AnythingLLM to load

SUCCESS PRINCIPLES:
1. SIMPLICITY: Start with 2 tools, add more only if essential
2. DEFAULTS: Make everything work with minimal parameters
3. CLARITY: Tool descriptions should be crystal clear
4. RELIABILITY: Always handle errors gracefully
5. FOCUS: Each MCP does ONE thing well

COMMON PATTERNS:
- GET/LIST: View, check, show, list, find
- CREATE: Add, create, make, send, post
- UPDATE: Edit, modify, change (only if essential)
- DELETE: Remove, delete (only if essential)

AVOID:
✗ Complex nested parameters
✗ Too many tools (>4)
✗ Unclear tool names
✗ Missing error handling
✗ No default values
✗ Over-engineering
*/