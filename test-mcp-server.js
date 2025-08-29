#!/usr/bin/env node

/**
 * Simple test MCP server that provides basic tools
 * for testing AnythingLLM's MCP integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'test-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'echo',
        description: 'Echo back the input text',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to echo back',
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'get_time',
        description: 'Get current time',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'calculate',
        description: 'Perform basic math calculations',
        inputSchema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Math expression to evaluate (e.g., "2 + 3 * 4")',
            },
          },
          required: ['expression'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'echo':
      return {
        content: [
          {
            type: 'text',
            text: `Echo: ${args.text}`,
          },
        ],
      };

    case 'get_time':
      return {
        content: [
          {
            type: 'text',
            text: `Current time: ${new Date().toISOString()}`,
          },
        ],
      };

    case 'calculate':
      try {
        // Simple math evaluation (be careful with eval in production!)
        const result = Function(`"use strict"; return (${args.expression})`)();
        return {
          content: [
            {
              type: 'text',
              text: `${args.expression} = ${result}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error calculating "${args.expression}": ${error.message}`,
            },
          ],
        };
      }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Test MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server failed:', error);
  process.exit(1);
});