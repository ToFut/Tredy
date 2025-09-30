#!/usr/bin/env node

/**
 * Twilio WhatsApp MCP Tools
 * Comprehensive Twilio WhatsApp integration with Nango OAuth and workspace awareness
 */

//
// Load dotenv from multiple likely locations (non-throwing)
//
function loadEnvFiles() {
  if (process.env.NANGO_SECRET_KEY) return;
  let dotenv;
  try { dotenv = require('dotenv'); } catch (e) { /* dotenv not installed */ }

  if (!dotenv) return;

  const path = require('path');
  const fs = require('fs');

  const possibleEnvFiles = [
    './.env.development',
    './.env',
    './server/.env.development',
    './server/.env',
    '../.env.development',
    '../.env',
    '../../.env.development',
    '../../.env',
    path.join(__dirname, '.env'),
    path.join(__dirname, '.env.development'),
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.development')
  ];

  for (const envFile of possibleEnvFiles) {
    if (fs.existsSync(envFile)) {
      console.log(`[TwilioWhatsAppMCP] Loading environment from: ${envFile}`);
      dotenv.config({ path: envFile });
      break;
    }
  }
}

// Load environment variables
loadEnvFiles();

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');
const fs = require('fs');
const path = require('path');

function buildNangoError(error, operation) {
  console.error(`${operation} error:`, error.response?.data || error.message);
  const nangoError = error.response?.data?.error;
  let errorMessage;

  if (nangoError) {
    errorMessage = `Could not ${operation}. Nango error: ${nangoError.message} (code: ${nangoError.code})`;
  } else {
    errorMessage = `Could not ${operation}. Error: ${error.message || 'An unknown error occurred.'}`;
  }

  return {
    content: [{ type: 'text', text: errorMessage }],
    isError: true
  };
}

class TwilioWhatsAppMCPTools {
  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    // Get Twilio Account SID for URL construction
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    if (!this.twilioAccountSid) {
      throw new Error('TWILIO_ACCOUNT_SID environment variable is required');
    }

    this.server = new Server(
      { name: 'twilio-whatsapp-mcp-tools', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.nangoConfig = {
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev',
      providerConfigKey: process.env.NANGO_PROVIDER_CONFIG_KEY || 'twilio'
    };

    this.nango = new Nango(this.nangoConfig);
    this.setupTools();
  }

  getWorkspaceId(args) {
    if (args?.workspaceId) return args.workspaceId;
    if (process.env.NANGO_CONNECTION_ID) {
      return process.env.NANGO_CONNECTION_ID.replace('workspace_', '');
    }
    return '1';
  }

  getConnectionId(workspaceId) {
    // Use your specific connection ID
    return process.env.NANGO_CONNECTION_ID || 'workspace_144';
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'send_whatsapp_message',
          description: 'Send a WhatsApp message via Twilio. Use when user wants to send WhatsApp messages or communicate via WhatsApp.',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Recipient WhatsApp number in E.164 format (e.g., +1234567890)' },
              body: { type: 'string', description: 'Message content to send' },
              mediaUrl: { type: 'string', description: 'Optional: URL of media to send (image, video, audio, document)' },
              from: { type: 'string', description: 'Optional: Sender WhatsApp number (uses default Twilio WhatsApp number if not provided)' }
            },
            required: ['to', 'body']
          }
        },
        {
          name: 'get_whatsapp_messages',
          description: 'Retrieve WhatsApp messages from Twilio. Use to view message history, check message status, or get incoming messages.',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Filter messages sent to this WhatsApp number' },
              from: { type: 'string', description: 'Filter messages sent from this WhatsApp number' },
              dateSent: { type: 'string', description: 'Filter messages sent on this date (YYYY-MM-DD format)' },
              status: { type: 'string', description: 'Filter by message status (queued, sending, sent, failed, delivered, undelivered, received, read)' },
              limit: { type: 'number', description: 'Maximum number of messages to retrieve (default: 50, max: 1000)', default: 50 }
            }
          }
        },
        {
          name: 'get_whatsapp_message_details',
          description: 'Get detailed information about a specific WhatsApp message including delivery status, timestamps, and error details.',
          inputSchema: {
            type: 'object',
            properties: {
              messageSid: { type: 'string', description: 'Twilio message SID to get details for' }
            },
            required: ['messageSid']
          }
        },
        {
          name: 'send_whatsapp_template',
          description: 'Send a pre-approved WhatsApp template message via Twilio. Use for business notifications or automated messages.',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Recipient WhatsApp number in E.164 format' },
              templateSid: { type: 'string', description: 'Twilio template SID for the approved WhatsApp template' },
              templateParams: { type: 'object', description: 'Template parameters as key-value pairs' },
              from: { type: 'string', description: 'Optional: Sender WhatsApp number (uses default if not provided)' }
            },
            required: ['to', 'templateSid']
          }
        },
        {
          name: 'get_whatsapp_templates',
          description: 'List available WhatsApp message templates that have been approved for use with Twilio.',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Maximum number of templates to retrieve (default: 50)', default: 50 }
            }
          }
        },
        {
          name: 'update_whatsapp_message_status',
          description: 'Update the status of a WhatsApp message (for webhook processing or status updates).',
          inputSchema: {
            type: 'object',
            properties: {
              messageSid: { type: 'string', description: 'Twilio message SID to update' },
              status: { type: 'string', description: 'New status (delivered, read, failed, etc.)' }
            },
            required: ['messageSid', 'status']
          }
        },
        {
          name: 'get_whatsapp_conversation_history',
          description: 'Get the conversation history between two WhatsApp numbers, organized chronologically.',
          inputSchema: {
            type: 'object',
            properties: {
              participantA: { type: 'string', description: 'First participant WhatsApp number' },
              participantB: { type: 'string', description: 'Second participant WhatsApp number' },
              startDate: { type: 'string', description: 'Start date for conversation history (YYYY-MM-DD)' },
              endDate: { type: 'string', description: 'End date for conversation history (YYYY-MM-DD)' },
              limit: { type: 'number', description: 'Maximum number of messages (default: 100)', default: 100 }
            },
            required: ['participantA', 'participantB']
          }
        },
        {
          name: 'send_whatsapp_media',
          description: 'Send media files (images, videos, audio, documents) via WhatsApp using Twilio.',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Recipient WhatsApp number in E.164 format' },
              mediaUrl: { type: 'string', description: 'Direct URL to the media file to send' },
              caption: { type: 'string', description: 'Optional caption for the media' },
              filename: { type: 'string', description: 'Optional filename for documents' },
              from: { type: 'string', description: 'Optional: Sender WhatsApp number' }
            },
            required: ['to', 'mediaUrl']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const workspaceId = this.getWorkspaceId(args);
      console.error(`[twilio-whatsapp-mcp-tools] Processing ${name} for workspace ${workspaceId}`);

      try {
        switch (name) {
          case 'send_whatsapp_message': return await this.sendWhatsAppMessage(args, workspaceId);
          case 'get_whatsapp_messages': return await this.getWhatsAppMessages(args, workspaceId);
          case 'get_whatsapp_message_details': return await this.getWhatsAppMessageDetails(args, workspaceId);
          case 'send_whatsapp_template': return await this.sendWhatsAppTemplate(args, workspaceId);
          case 'get_whatsapp_templates': return await this.getWhatsAppTemplates(args, workspaceId);
          case 'update_whatsapp_message_status': return await this.updateWhatsAppMessageStatus(args, workspaceId);
          case 'get_whatsapp_conversation_history': return await this.getWhatsAppConversationHistory(args, workspaceId);
          case 'send_whatsapp_media': return await this.sendWhatsAppMedia(args, workspaceId);
          default: throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return buildNangoError(error, `execute tool ${name}`);
      }
    });
  }

  // =========== Public Tool Methods ===========

  async sendWhatsAppMessage(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { to, body, mediaUrl, from } = args;

    try {
      const messageData = {
        To: `whatsapp:${to}`,
        Body: body
      };

      // Set default From number to Twilio WhatsApp number if not provided
      if (from) {
        messageData.From = `whatsapp:${from}`;
      } else {
        // Use environment variable or default Twilio sandbox number
        const defaultWhatsAppNumber = process.env.TWILIO_NUMBER || '+14155238886';
        messageData.From = `whatsapp:${defaultWhatsAppNumber}`;
      }

      if (mediaUrl) {
        messageData.MediaUrl = mediaUrl;
      }

      const response = await this.nango.post({
        endpoint: `/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        data: messageData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const message = response.data;

      return {
        content: [{
          type: 'text',
          text: `✅ WhatsApp message sent successfully!

📱 Message Details:
• SID: ${message.sid}
• From: ${message.from}
• To: ${message.to}
• Status: ${message.status}
• Direction: ${message.direction}
• Date Created: ${message.date_created}
• Price: ${message.price || 'N/A'} ${message.price_unit || ''}

📝 Content:
${message.body}

${mediaUrl ? `📎 Media: ${mediaUrl}` : ''}

💡 Use get_whatsapp_message_details to check delivery status later.`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'send WhatsApp message');
    }
  }

  async getWhatsAppMessages(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { to, from, dateSent, status, limit = 50 } = args;

    try {
      const params = {
        PageSize: Math.min(limit, 1000)
      };

      if (to) params.To = `whatsapp:${to}`;
      if (from) params.From = `whatsapp:${from}`;
      if (dateSent) params.DateSent = dateSent;

      const response = await this.nango.get({
        endpoint: `/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params
      });

      let messages = response.data?.messages || [];

      // Filter WhatsApp messages only
      messages = messages.filter(msg =>
        (msg.from && msg.from.startsWith('whatsapp:')) ||
        (msg.to && msg.to.startsWith('whatsapp:'))
      );

      // Additional status filtering if provided
      if (status) {
        messages = messages.filter(msg => msg.status === status);
      }

      if (messages.length === 0) {
        const filters = [];
        if (to) filters.push(`to: ${to}`);
        if (from) filters.push(`from: ${from}`);
        if (dateSent) filters.push(`date: ${dateSent}`);
        if (status) filters.push(`status: ${status}`);

        return {
          content: [{
            type: 'text',
            text: `📭 No WhatsApp messages found${filters.length ? ` with filters: ${filters.join(', ')}` : ''}.

💡 Tips:
• Check that phone numbers are in E.164 format (+1234567890)
• Verify the date format is YYYY-MM-DD
• Try removing some filters to broaden the search`
          }]
        };
      }

      // Sort messages by date (newest first)
      messages.sort((a, b) => new Date(b.date_created) - new Date(a.date_created));

      const messagesList = messages.map((msg, index) => {
        const direction = msg.direction === 'inbound' ? '📥' : '📤';
        const statusIcon = this.getStatusIcon(msg.status);

        return `${index + 1}. ${direction} ${statusIcon} ${msg.status.toUpperCase()}
   SID: ${msg.sid}
   From: ${msg.from} → To: ${msg.to}
   Date: ${new Date(msg.date_created).toLocaleString()}
   Body: ${msg.body || 'N/A'}
   ${msg.price ? `Price: ${msg.price} ${msg.price_unit || ''}` : ''}
   ${msg.error_code ? `Error: ${msg.error_code} - ${msg.error_message}` : ''}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `📱 Found ${messages.length} WhatsApp message(s):

${messagesList}

💡 Use get_whatsapp_message_details with a specific SID for more detailed information.`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'get WhatsApp messages');
    }
  }

  async getWhatsAppMessageDetails(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { messageSid } = args;

    try {
      const response = await this.nango.get({
        endpoint: `/2010-04-01/Accounts/${this.twilioAccountSid}/Messages/${messageSid}.json`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey
      });

      const message = response.data;
      const statusIcon = this.getStatusIcon(message.status);
      const direction = message.direction === 'inbound' ? '📥 Received' : '📤 Sent';

      return {
        content: [{
          type: 'text',
          text: `📱 WhatsApp Message Details:

🆔 Message ID: ${message.sid}
📊 Status: ${statusIcon} ${message.status.toUpperCase()}
🔄 Direction: ${direction}

👤 Participants:
• From: ${message.from}
• To: ${message.to}

📝 Content:
${message.body || 'No text content'}

${message.media_url ? `📎 Media URL: ${message.media_url}` : ''}

⏰ Timestamps:
• Created: ${new Date(message.date_created).toLocaleString()}
• Sent: ${message.date_sent ? new Date(message.date_sent).toLocaleString() : 'Not sent yet'}
• Updated: ${new Date(message.date_updated).toLocaleString()}

💰 Pricing:
• Price: ${message.price || 'N/A'} ${message.price_unit || ''}
• Price Unit: ${message.price_unit || 'N/A'}

🔧 Technical Details:
• Account SID: ${message.account_sid}
• Messaging Service SID: ${message.messaging_service_sid || 'N/A'}
• Number of Segments: ${message.num_segments || '1'}
• Number of Media: ${message.num_media || '0'}

${message.error_code ? `❌ Error Details:
• Error Code: ${message.error_code}
• Error Message: ${message.error_message}` : '✅ No errors reported'}`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'get WhatsApp message details');
    }
  }

  async sendWhatsAppTemplate(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { to, templateSid, templateParams, from } = args;

    try {
      const messageData = {
        To: `whatsapp:${to}`,
        ContentSid: templateSid
      };

      if (from) {
        messageData.From = `whatsapp:${from}`;
      }

      if (templateParams) {
        messageData.ContentVariables = JSON.stringify(templateParams);
      }

      const response = await this.nango.post({
        endpoint: `/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        data: messageData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const message = response.data;

      return {
        content: [{
          type: 'text',
          text: `✅ WhatsApp template message sent successfully!

📱 Template Message Details:
• SID: ${message.sid}
• Template SID: ${templateSid}
• From: ${message.from}
• To: ${message.to}
• Status: ${message.status}
• Date Created: ${message.date_created}

${templateParams ? `📝 Template Parameters:
${Object.entries(templateParams).map(([key, value]) => `• ${key}: ${value}`).join('\n')}` : ''}

💡 Use get_whatsapp_message_details to check delivery status.`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'send WhatsApp template message');
    }
  }

  async getWhatsAppTemplates(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { limit = 50 } = args;

    try {
      const response = await this.nango.get({
        endpoint: `/2010-04-01/Accounts/${this.twilioAccountSid}/Content.json`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: {
          PageSize: limit
        }
      });

      const contents = response.data?.contents || [];

      if (contents.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `📝 No WhatsApp templates found.

💡 To use WhatsApp templates:
1. Create templates in your Twilio Console
2. Submit them for WhatsApp approval
3. Once approved, they will appear here

Note: WhatsApp requires pre-approved templates for business messaging.`
          }]
        };
      }

      const templatesList = contents.map((template, index) => {
        const status = template.approval_requests?.[0]?.status || 'unknown';
        const statusIcon = status === 'approved' ? '✅' : status === 'pending' ? '⏳' : '❌';

        return `${index + 1}. ${statusIcon} ${template.friendly_name}
   SID: ${template.sid}
   Status: ${status}
   Language: ${template.language || 'N/A'}
   Variables: ${template.variables ? Object.keys(template.variables).join(', ') : 'None'}
   Created: ${new Date(template.date_created).toLocaleDateString()}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `📝 Found ${contents.length} WhatsApp template(s):

${templatesList}

💡 Only approved templates (✅) can be used with send_whatsapp_template.
Use the SID when sending template messages.`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'get WhatsApp templates');
    }
  }

  async updateWhatsAppMessageStatus(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { messageSid, status } = args;

    try {
      // Note: This is typically used for webhook processing
      // Direct status updates may not be supported by Twilio API
      // This is more of a placeholder for webhook-driven status updates

      return {
        content: [{
          type: 'text',
          text: `ℹ️ Message status update requested:

• Message SID: ${messageSid}
• New Status: ${status}

⚠️ Note: Direct status updates are typically handled by Twilio webhooks.
For real-time status updates, configure webhooks in your Twilio Console.

Use get_whatsapp_message_details to check current status.`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'update WhatsApp message status');
    }
  }

  async getWhatsAppConversationHistory(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { participantA, participantB, startDate, endDate, limit = 100 } = args;

    try {
      // Get messages in both directions
      const params = {
        PageSize: limit
      };

      if (startDate) params.DateSentAfter = startDate;
      if (endDate) params.DateSentBefore = endDate;

      const response = await this.nango.get({
        endpoint: `/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params
      });

      let messages = response.data?.messages || [];

      // Filter for conversation between the two participants
      const whatsappA = `whatsapp:${participantA}`;
      const whatsappB = `whatsapp:${participantB}`;

      messages = messages.filter(msg =>
        (msg.from === whatsappA && msg.to === whatsappB) ||
        (msg.from === whatsappB && msg.to === whatsappA)
      );

      if (messages.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `💬 No conversation found between ${participantA} and ${participantB}.

${startDate || endDate ? `Date range: ${startDate || 'beginning'} to ${endDate || 'now'}` : ''}

💡 Tips:
• Ensure phone numbers are in E.164 format
• Check if messages exist in the specified date range
• Verify both participants have exchanged WhatsApp messages`
          }]
        };
      }

      // Sort chronologically (oldest first for conversation flow)
      messages.sort((a, b) => new Date(a.date_created) - new Date(b.date_created));

      const conversationHistory = messages.map((msg, index) => {
        const isFromA = msg.from === whatsappA;
        const sender = isFromA ? participantA : participantB;
        const direction = isFromA ? '→' : '←';
        const statusIcon = this.getStatusIcon(msg.status);

        return `${index + 1}. [${new Date(msg.date_created).toLocaleString()}]
   ${sender} ${direction} ${statusIcon} ${msg.status}
   ${msg.body || '📎 Media message'}
   ${msg.error_code ? `❌ Error: ${msg.error_message}` : ''}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `💬 Conversation History: ${participantA} ↔ ${participantB}

📊 Found ${messages.length} message(s)
${startDate || endDate ? `📅 Date range: ${startDate || 'beginning'} to ${endDate || 'now'}` : ''}

${conversationHistory}

💡 Legend:
→ Sent by ${participantA}
← Sent by ${participantB}
Status icons: ✅ delivered, 📤 sent, ⏳ pending, ❌ failed`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'get WhatsApp conversation history');
    }
  }

  async sendWhatsAppMedia(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { to, mediaUrl, caption, filename, from } = args;

    try {
      const messageData = {
        To: `whatsapp:${to}`,
        MediaUrl: mediaUrl
      };

      if (from) {
        messageData.From = `whatsapp:${from}`;
      }

      if (caption) {
        messageData.Body = caption;
      }

      if (filename) {
        messageData.Filename = filename;
      }

      const response = await this.nango.post({
        endpoint: `/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        data: messageData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const message = response.data;

      return {
        content: [{
          type: 'text',
          text: `📎 WhatsApp media sent successfully!

📱 Media Message Details:
• SID: ${message.sid}
• From: ${message.from}
• To: ${message.to}
• Status: ${message.status}
• Date Created: ${message.date_created}

📎 Media Details:
• URL: ${mediaUrl}
${filename ? `• Filename: ${filename}` : ''}
${caption ? `• Caption: ${caption}` : ''}

💡 Supported media types:
• Images: JPG, JPEG, PNG (max 5MB)
• Videos: MP4, 3GPP (max 16MB)
• Audio: AAC, AMR, MP3, OGG (max 16MB)
• Documents: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX (max 100MB)`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'send WhatsApp media');
    }
  }

  // =========== Helper Methods ===========

  getStatusIcon(status) {
    const statusIcons = {
      'queued': '⏳',
      'sending': '📤',
      'sent': '📤',
      'delivered': '✅',
      'undelivered': '❌',
      'failed': '❌',
      'received': '📥',
      'read': '👁️',
      'accepted': '✅',
      'scheduled': '⏰'
    };
    return statusIcons[status] || '❓';
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Twilio WhatsApp MCP Tools Server started');
  }
}

if (require.main === module) {
  const server = new TwilioWhatsAppMCPTools();
  server.start().catch(error => {
    console.error('Failed to start Twilio WhatsApp MCP Tools server:', error);
    process.exit(1);
  });
}

module.exports = TwilioWhatsAppMCPTools;