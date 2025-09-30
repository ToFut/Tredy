#!/usr/bin/env node

/**
 * Universal Gmail MCP Server
 * Dynamically handles ANY workspace without hardcoding
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');

class UniversalGmailMCP {
  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    this.server = new Server(
      { name: 'universal-gmail-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.nangoConfig = {
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    };

    this.setupTools();
  }

  /**
   * Get provider config key with secure fallback
   */
  getProviderConfigKey() {
    // Priority order for provider config detection:
    // 1. From constructor nangoConfig (primary)
    // 2. From environment variable (override)
    // 3. Secure fallback to known working config
    
    if (this.nangoConfig?.providerConfigKey) {
      console.error(`[Gmail MCP] Using provider config from nangoConfig: ${this.nangoConfig.providerConfigKey}`);
      return this.nangoConfig.providerConfigKey;
    }
    
    if (process.env.NANGO_PROVIDER_CONFIG_KEY) {
      console.error(`[Gmail MCP] Using provider config from env: ${process.env.NANGO_PROVIDER_CONFIG_KEY}`);
      return process.env.NANGO_PROVIDER_CONFIG_KEY;
    }
    
    // Secure fallback - use known working provider config
    const fallbackConfig = 'google-mail-urgd';
    console.error(`[Gmail MCP] No provider config found, using secure fallback: ${fallbackConfig}`);
    return fallbackConfig;
  }

  /**
   * Dynamically get workspace ID from the request context
   */
  getWorkspaceId(args) {
    // Priority order for workspace detection:
    // 1. Explicit workspaceId in args (passed from agent)
    // 2. From environment variable
    // 3. From MCP server name (legacy support)
    
    if (args?.workspaceId) {
      console.error(`[Gmail MCP] Using workspace ID from args: ${args.workspaceId}`);
      return args.workspaceId;
    }
    
    // Extract from NANGO_CONNECTION_ID if set
    if (process.env.NANGO_CONNECTION_ID) {
      const id = process.env.NANGO_CONNECTION_ID.replace('workspace_', '');
      console.error(`[Gmail MCP] Using workspace ID from NANGO_CONNECTION_ID: ${id}`);
      return id;
    }
    
    // Extract from server instance name if available (legacy)
    if (process.env.MCP_SERVER_NAME) {
      const match = process.env.MCP_SERVER_NAME.match(/_ws(\d+)$/);
      if (match) {
        console.error(`[Gmail MCP] Using workspace ID from server name: ${match[1]}`);
        return match[1];
      }
    }
    
    // Default fallback - should rarely happen now
    console.error('[Gmail MCP] Warning: No workspace ID found, using default workspace 1');
    return '1'; // Default to workspace 1
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'send_email',
          description: 'Send an email via Gmail',
          inputSchema: {
            type: 'object',
            properties: {
              to: { type: 'string', description: 'Recipient email address' },
              subject: { type: 'string', description: 'Email subject' },
              body: { type: 'string', description: 'Email body' },
              cc: { type: 'string', description: 'CC recipients (optional)' },
              bcc: { type: 'string', description: 'BCC recipients (optional)' },
              workspaceId: { type: 'string', description: 'Workspace ID (auto-detected if not provided)' }
            },
            required: ['to']
          }
        },
        {
          name: 'get_emails',
          description: 'Get emails from Gmail inbox',
          inputSchema: {
            type: 'object',
            properties: {
              maxResults: { type: 'number', description: 'Maximum emails to return', default: 10 },
              query: { type: 'string', description: 'Gmail search query' },
              labelIds: { type: 'array', items: { type: 'string' }, description: 'Label IDs to filter' },
              workspaceId: { type: 'string', description: 'Workspace ID (auto-detected if not provided)' }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      // Dynamically determine workspace for this request
      const workspaceId = this.getWorkspaceId(args);
      console.error(`[Gmail MCP] Processing ${name} for workspace ${workspaceId}`);
      
      // Inject workspace into args
      const enhancedArgs = { ...args, workspaceId };

      try {
        switch (name) {
          case 'send_email':
            return await this.sendEmail(enhancedArgs);
          case 'get_emails':
            return await this.getEmails(enhancedArgs);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[Gmail MCP] Error in ${name}:`, error);
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

  async sendEmail(args) {
    const workspaceId = args.workspaceId;
    const connectionId = `workspace_${workspaceId}`;
    
    // Create fresh Nango instance for each request (pattern from working gmail-mcp-server.js)
    const { Nango } = require('@nangohq/node');
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    // Get provider config key with secure fallback
    const providerConfigKey = this.getProviderConfigKey();
    
    const { to, subject = "Message from AnythingLLM", body = "This is an automated message.", cc, bcc } = args;

    if (!to) {
      throw new Error('Recipient email address is required');
    }

    // Create email message in RFC 2822 format
    let message = `To: ${to}\r\n`;
    if (cc) message += `Cc: ${cc}\r\n`;
    if (bcc) message += `Bcc: ${bcc}\r\n`;
    message += `Subject: ${subject}\r\n`;
    message += `\r\n${body}`;

    // Encode message in base64
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      console.error(`[Gmail MCP] Attempting to send email with connectionId: ${connectionId}, providerConfigKey: ${providerConfigKey}`);
      
      const response = await nango.proxy({
        method: 'POST',
        endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        connectionId: connectionId,
        providerConfigKey: providerConfigKey,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {
          raw: encodedMessage
        }
      });

      return {
        content: [{
          type: 'text',
          text: `✓ Email sent successfully to ${to}! Message ID: ${response.data.id}`
        }]
      };
    } catch (error) {
      console.error('[Gmail MCP] Send email error:', error.response?.data || error.message);
      throw new Error(`Failed to send email: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getEmails(args) {
    const workspaceId = args.workspaceId;
    const connectionId = `workspace_${workspaceId}`;
    
    const nango = new Nango(this.nangoConfig);
    
    const { maxResults = 10, query, labelIds } = args;

    const params = {
      maxResults
    };
    
    if (labelIds && Array.isArray(labelIds) && labelIds.length > 0) {
      params.labelIds = labelIds.join(',');
    }
    
    if (query) {
      params.q = query;
    }

    try {
      console.error(`[Gmail MCP] Getting emails for ${connectionId} with params:`, params);
      
      const response = await nango.proxy({
        method: 'GET',
        endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        connectionId: connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params
      });

      const messages = response.data.messages || [];
      
      if (messages.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No emails found.'
          }]
        };
      }

      // Get details for each message
      const emailList = [];
      for (const message of messages.slice(0, maxResults)) {
        try {
          const detailResponse = await nango.proxy({
            method: 'GET',
            endpoint: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
            connectionId: connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { format: 'full' }
          });

          const headers = detailResponse.data.payload?.headers || [];
          const getHeader = (name) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value;
          
          emailList.push({
            id: message.id,
            from: getHeader('From') || 'Unknown',
            subject: getHeader('Subject') || 'No Subject',
            date: getHeader('Date') || 'Unknown',
            snippet: detailResponse.data.snippet || 'No preview'
          });
        } catch (error) {
          console.error(`[Gmail MCP] Error fetching message ${message.id}:`, error.message);
        }
      }

      return {
        content: [{
          type: 'text',
          text: `Found ${emailList.length} emails:\n\n` + 
                emailList.map((email, i) => 
                  `${i + 1}. From: ${email.from}\n   Subject: ${email.subject}\n   Date: ${email.date}\n   Preview: ${email.snippet}\n`
                ).join('\n')
        }]
      };
    } catch (error) {
      console.error('[Gmail MCP] Error getting emails:', error.response?.data || error.message);
      throw new Error(`Failed to get emails: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Universal Gmail MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new UniversalGmailMCP();
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = UniversalGmailMCP;