#!/usr/bin/env node

/**
 * Twilio MCP Server
 * Direct integration with Twilio API for SMS messaging
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} = require('@modelcontextprotocol/sdk/types.js');

class TwilioMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'twilio-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Get credentials from environment
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER;

    if (!this.accountSid || !this.authToken) {
      throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required');
    }

    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'send_sms',
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
                description: 'Sender phone number (optional, uses default if not provided)',
              },
              body: {
                type: 'string',
                description: 'Message content',
              },
            },
            required: ['to', 'body'],
          },
        },
        {
          name: 'get_messages',
          description: 'Retrieve SMS messages from Twilio',
          inputSchema: {
            type: 'object',
            properties: {
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
                description: 'Maximum number of messages to retrieve (default 50)',
                default: 50,
              },
            },
            required: [],
          },
        },
        {
          name: 'get_message_details',
          description: 'Get details of a specific message',
          inputSchema: {
            type: 'object',
            properties: {
              messageSid: {
                type: 'string',
                description: 'Twilio message SID',
              },
            },
            required: ['messageSid'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'send_sms':
            return await this.sendSMS(args);
          case 'get_messages':
            return await this.getMessages(args);
          case 'get_message_details':
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
    const { to, from, body } = args;
    const fromNumber = from || this.fromNumber;

    if (!fromNumber) {
      throw new Error('From number is required. Set TWILIO_FROM_NUMBER or provide from parameter.');
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    const formData = new URLSearchParams({
      To: to,
      From: fromNumber,
      Body: body,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio API error: ${error.message || error.detail || response.statusText}`);
    }

    const message = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: `SMS sent successfully!\n\nDetails:\n- SID: ${message.sid}\n- From: ${message.from}\n- To: ${message.to}\n- Status: ${message.status}\n- Date: ${message.date_created}`,
        },
      ],
    };
  }

  async getMessages(args = {}) {
    const { to, from, dateSent, limit = 50 } = args;

    let url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json?PageSize=${limit}`;

    if (to) url += `&To=${encodeURIComponent(to)}`;
    if (from) url += `&From=${encodeURIComponent(from)}`;
    if (dateSent) url += `&DateSent=${encodeURIComponent(dateSent)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio API error: ${error.message || error.detail || response.statusText}`);
    }

    const data = await response.json();
    const messages = data.messages || [];

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
  }

  async getMessageDetails(args) {
    const { messageSid } = args;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages/${messageSid}.json`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Twilio API error: ${error.message || error.detail || response.statusText}`);
    }

    const message = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: `Message Details:\n\n- SID: ${message.sid}\n- Account SID: ${message.account_sid}\n- From: ${message.from}\n- To: ${message.to}\n- Body: ${message.body || 'N/A'}\n- Status: ${message.status}\n- Direction: ${message.direction}\n- Date Created: ${message.date_created}\n- Date Sent: ${message.date_sent || 'N/A'}\n- Date Updated: ${message.date_updated}\n- Price: ${message.price || 'N/A'} ${message.price_unit || ''}\n- Error Code: ${message.error_code || 'N/A'}\n- Error Message: ${message.error_message || 'N/A'}`,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Twilio MCP server running on stdio');
  }
}

const server = new TwilioMCPServer();
server.run().catch(console.error);