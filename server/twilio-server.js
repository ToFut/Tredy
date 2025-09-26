#!/usr/bin/env node

/**
 * Twilio MCP Server - Nango Integration
 * Uses Nango for authentication and Twilio API for SMS operations
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');

class TwilioNangoMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'twilio-nango-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Get Nango configuration
    this.nangoSecretKey = process.env.NANGO_SECRET_KEY;
    this.nangoHost = process.env.NANGO_HOST || 'https://api.nango.dev';
    this.providerConfigKey = process.env.NANGO_PROVIDER_CONFIG_KEY || 'twilio';

    if (!this.nangoSecretKey) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    this.setupNango();
    this.setupHandlers();
  }

  setupNango() {
    try {
      const { Nango } = require('@nangohq/node');
      this.nango = new Nango({
        secretKey: this.nangoSecretKey,
        host: this.nangoHost,
      });
      console.error('[Twilio MCP] Nango initialized successfully');
    } catch (error) {
      console.error('[Twilio MCP] Failed to initialize Nango:', error);
      throw error;
    }
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'twilio_send_sms',
          description: 'Send SMS message via Twilio',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                type: 'string',
                description: 'Recipient phone number (E.164 format)',
              },
              from: {
                type: 'string',
                description: 'Sender phone number',
              },
              body: {
                type: 'string',
                description: 'Message content',
              },
              workspaceId: {
                type: 'string',
                description: 'Workspace ID for connection',
              },
            },
            required: ['to', 'from', 'body', 'workspaceId'],
          },
        },
        {
          name: 'twilio_get_messages',
          description: 'Retrieve SMS messages from Twilio',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceId: {
                type: 'string',
                description: 'Workspace ID for connection',
              },
              to: {
                type: 'string',
                description: 'Filter messages sent to this number',
              },
              from: {
                type: 'string',
                description: 'Filter messages sent from this number',
              },
              dateSent: {
                type: 'string',
                description: 'Filter messages sent on this date (YYYY-MM-DD)',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of messages to retrieve (default 20)',
                default: 20,
              },
            },
            required: ['workspaceId'],
          },
        },
        {
          name: 'twilio_get_message_details',
          description: 'Get details of a specific message',
          inputSchema: {
            type: 'object',
            properties: {
              messageSid: {
                type: 'string',
                description: 'Twilio message SID',
              },
              workspaceId: {
                type: 'string',
                description: 'Workspace ID for connection',
              },
            },
            required: ['messageSid', 'workspaceId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'twilio_send_sms':
            return await this.sendSMS(args);
          case 'twilio_get_messages':
            return await this.getMessages(args);
          case 'twilio_get_message_details':
            return await this.getMessageDetails(args);
          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
      }
    });
  }

  async sendSMS(args) {
    const { to, from, body, workspaceId } = args;
    const connectionId = `workspace_${workspaceId}`;

    try {
      const response = await this.nango.triggerAction(
        this.providerConfigKey,
        connectionId,
        'send-message',
        {
          to,
          from,
          body,
        }
      );

      const message = response;
      return {
        content: [
          {
            type: 'text',
            text: `SMS sent successfully!\n\nDetails:\n- SID: ${message.sid}\n- From: ${message.from}\n- To: ${message.to}\n- Status: ${message.status}\n- Date: ${message.date_created}`,
          },
        ],
      };
    } catch (error) {
      console.error('[Twilio MCP] Send SMS error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  async getMessages(args) {
    const { workspaceId, to, from, dateSent, limit = 20 } = args;
    const connectionId = `workspace_${workspaceId}`;

    try {
      const response = await this.nango.triggerAction(
        this.providerConfigKey,
        connectionId,
        'get-messages',
        {
          to,
          from,
          dateSent,
          limit,
        }
      );

      const messages = response || [];

      if (messages.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No messages found matching the criteria.',
            },
          ],
        };
      }

      const messagesList = messages.map(msg =>
        `• SID: ${msg.sid}\n  From: ${msg.from}\n  To: ${msg.to}\n  Body: ${msg.body || 'N/A'}\n  Status: ${msg.status}\n  Date: ${msg.date_created}`
      ).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${messages.length} messages:\n\n${messagesList}`,
          },
        ],
      };
    } catch (error) {
      console.error('[Twilio MCP] Get messages error:', error);
      throw new Error(`Failed to get messages: ${error.message}`);
    }
  }

  async getMessageDetails(args) {
    const { messageSid, workspaceId } = args;
    const connectionId = `workspace_${workspaceId}`;

    try {
      const response = await this.nango.triggerAction(
        this.providerConfigKey,
        connectionId,
        'get-message-details',
        {
          messageSid,
        }
      );

      const message = response;
      return {
        content: [
          {
            type: 'text',
            text: `Message Details:\n\n- SID: ${message.sid}\n- Account SID: ${message.account_sid}\n- From: ${message.from}\n- To: ${message.to}\n- Body: ${message.body || 'N/A'}\n- Status: ${message.status}\n- Direction: ${message.direction}\n- Date Created: ${message.date_created}\n- Date Sent: ${message.date_sent || 'N/A'}\n- Date Updated: ${message.date_updated}\n- Price: ${message.price || 'N/A'} ${message.price_unit || ''}\n- Error Code: ${message.error_code || 'N/A'}\n- Error Message: ${message.error_message || 'N/A'}`,
          },
        ],
      };
    } catch (error) {
      console.error('[Twilio MCP] Get message details error:', error);
      throw new Error(`Failed to get message details: ${error.message}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Twilio Nango MCP server running on stdio');
  }
}

const server = new TwilioNangoMCPServer();
server.run().catch(console.error);