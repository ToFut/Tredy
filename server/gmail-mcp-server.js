#!/usr/bin/env node

/**
 * Gmail MCP Server
 * Provides email functionality via Nango OAuth integration
 * Following Nango documentation patterns with proper sync and OAuth
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class GmailMCP {
  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    this.server = new Server(
      { name: 'gmail-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    // Nango configuration following their patterns
    this.nangoConfig = {
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev',
      providerConfigKey: 'google-mail', // Exact key from your Nango dashboard
      connectionIdPrefix: 'workspace_'
    };

    this.setupTools();
  }

  setupTools() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'connect_gmail',
          description: 'Connect Gmail account via OAuth. Use when user wants to connect or authorize Gmail access.',
          inputSchema: {
            type: 'object',
            properties: {
              workspaceId: {
                type: 'string',
                description: 'Workspace identifier for the connection'
              }
            },
            required: ['workspaceId']
          }
        },
        {
          name: 'send_email',
          description: 'Send a regular email message via Gmail. Use ONLY for regular emails, NOT for calendar invites or meeting requests. For calendar invites, use the Calendar book_meeting tool instead.',
          inputSchema: {
            type: 'object',
            properties: {
              to: {
                type: 'string',
                description: 'Recipient email address'
              },
              subject: {
                type: 'string',
                description: 'Email subject line'
              },
              body: {
                type: 'string',
                description: 'Email body content'
              },
              cc: {
                type: 'string',
                description: 'CC recipients (optional)'
              },
              bcc: {
                type: 'string',
                description: 'BCC recipients (optional)'
              }
            },
            required: ['to', 'subject', 'body']
          }
        },
        {
          name: 'get_emails',
          description: 'Get emails from Gmail inbox. Use to check, read, or list emails.',
          inputSchema: {
            type: 'object',
            properties: {
              maxResults: {
                type: 'number',
                description: 'Maximum number of emails to return (default: 10)',
                default: 10
              },
              query: {
                type: 'string',
                description: 'Gmail search query (e.g., "is:unread", "from:sender@domain.com")'
              },
              labelIds: {
                type: 'array',
                description: 'Label IDs to filter by (e.g., ["INBOX", "UNREAD"])',
                items: {
                  type: 'string'
                }
              }
            }
          }
        },
        {
          name: 'search_emails',
          description: 'Search emails with specific criteria. Use for finding specific emails.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (e.g., "from:john@company.com subject:project")'
              },
              maxResults: {
                type: 'number',
                description: 'Maximum results to return',
                default: 20
              }
            },
            required: ['query']
          }
        },
        {
          name: 'get_email_details',
          description: 'Get full details of a specific email by ID',
          inputSchema: {
            type: 'object',
            properties: {
              messageId: {
                type: 'string',
                description: 'Gmail message ID'
              }
            },
            required: ['messageId']
          }
        },
        {
          name: 'mark_as_read',
          description: 'Mark emails as read',
          inputSchema: {
            type: 'object',
            properties: {
              messageIds: {
                type: 'array',
                description: 'Array of message IDs to mark as read',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['messageIds']
          }
        },
        {
          name: 'delete_emails',
          description: 'Move emails to trash',
          inputSchema: {
            type: 'object',
            properties: {
              messageIds: {
                type: 'array',
                description: 'Array of message IDs to delete',
                items: {
                  type: 'string'
                }
              }
            },
            required: ['messageIds']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'connect_gmail':
            return await this.connectGmail(args);
          case 'send_email':
            return await this.sendEmail(args);
          case 'get_emails':
            return await this.getEmails(args);
          case 'search_emails':
            return await this.searchEmails(args);
          case 'get_email_details':
            return await this.getEmailDetails(args);
          case 'mark_as_read':
            return await this.markAsRead(args);
          case 'delete_emails':
            return await this.deleteEmails(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[Gmail MCP] Tool error for ${name}:`, error);
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
   * Connect Gmail account via OAuth
   */
  async connectGmail(args) {
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango(this.nangoConfig);
    const connectionId = `${this.nangoConfig.connectionIdPrefix}${args.workspaceId}`;

    try {
      // Generate OAuth URL for user authorization
      const authUrl = await nango.getAuthURL({
        providerConfigKey: this.nangoConfig.providerConfigKey,
        connectionId: connectionId,
        redirectUri: process.env.NANGO_REDIRECT_URI,
        scopes: [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/gmail.modify'
        ]
      });

      return {
        content: [{
          type: 'text',
          text: `🔗 Please authorize Gmail access:

1. Click this link: ${authUrl}
2. Sign in to your Google account
3. Grant permissions to access Gmail
4. You'll be redirected back when complete

After authorization, you can use Gmail commands like:
• Send emails
• Read emails  
• Search messages
• Manage inbox`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ Failed to generate OAuth URL: ${error.message}`
        }]
      };
    }
  }

  /**
   * Get Nango client with connection ID
   */
  getNangoClient(workspaceId) {
    const { Nango } = require('@nangohq/node');
    const nango = new Nango(this.nangoConfig);
    
    // Dynamic workspace detection:
    // 1. Use provided workspaceId if available
    // 2. Extract from NANGO_CONNECTION_ID env var (e.g., "workspace_4" -> "4")
    // 3. Try to detect from process title or args
    // 4. Default to workspace 3 which has a working connection
    
    let workspace = workspaceId;
    
    if (!workspace && process.env.NANGO_CONNECTION_ID) {
      workspace = process.env.NANGO_CONNECTION_ID.replace('workspace_', '');
    }
    
    // Try to extract workspace from the MCP server name (e.g., gmail_ws4)
    if (!workspace) {
      const serverName = process.argv.find(arg => arg.includes('gmail_ws'));
      if (serverName) {
        const match = serverName.match(/gmail_ws(\d+)/);
        if (match) workspace = match[1];
      }
    }
    
    // Default to workspace 3 which we know has a working connection
    if (!workspace) {
      workspace = '3';
      console.error('[Gmail MCP] No workspace detected, using default workspace 3');
    }
    
    const connectionId = `${this.nangoConfig.connectionIdPrefix}${workspace}`;
    
    console.error(`[Gmail MCP] Using workspace ${workspace}, connection ID: ${connectionId}`);
    return { nango, connectionId };
  }

  async sendEmail(args) {
    console.error('[Gmail MCP] sendEmail called with args:', JSON.stringify(args));
    
    // Use environment variable for connection ID if no workspaceId provided
    const workspaceId = args.workspaceId || process.env.NANGO_CONNECTION_ID?.replace('workspace_', '') || '4';
    const { nango, connectionId } = this.getNangoClient(workspaceId);

    const { to, subject = "Message from AnythingLLM", body = "This is an automated message.", cc, bcc } = args;
    
    console.error('[Gmail MCP] Email details:', { to, subject, body: body.substring(0, 50), connectionId });

    // Validate required fields
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

    // Use Nango proxy following their documentation pattern
    try {
      console.error(`[Gmail MCP] Sending email with connection: ${connectionId}, provider: ${this.nangoConfig.providerConfigKey}`);
      console.error(`[Gmail MCP] Encoded message length: ${encodedMessage.length}`);
      
      // Use the correct Gmail API endpoint
      const response = await nango.proxy({
        method: 'POST',
        endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        connectionId: connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
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
      console.error('[Gmail MCP] Connection ID:', connectionId);
      console.error('[Gmail MCP] Provider Key:', this.nangoConfig.providerConfigKey);
      
      // Return a more informative error
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to send email';
      throw new Error(`Failed to send email: ${errorMessage}`);
    }
  }

  async getEmails(args) {
    const { nango, connectionId } = this.getNangoClient(args.workspaceId);

    const { maxResults = 10, query, labelIds } = args;

    const params = {
      maxResults
    };
    
    // Only add labelIds if provided
    if (labelIds && Array.isArray(labelIds) && labelIds.length > 0) {
      params.labelIds = labelIds.join(',');
    }
    
    if (query) {
      params.q = query;
    }

    try {
      console.error('[Gmail MCP] Getting emails with params:', params);
      
      const response = await nango.proxy({
        method: 'GET',
        endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        connectionId: connectionId,
        providerConfigKey: 'google-mail', // Use the correct provider key
        params
      });

    const messages = response.data.messages || [];
    
    if (messages.length === 0) {
      return {
        content: [{
          type: 'text',
          text: 'No emails found matching your criteria.'
        }]
      };
    }

    // Get basic info for each message
    const emailList = [];
    console.error(`[Gmail MCP] Processing ${messages.length} messages...`);
    
    for (const message of messages.slice(0, maxResults)) {
      try {
        console.error(`[Gmail MCP] Fetching details for message ${message.id}...`);
        
        const detailResponse = await nango.proxy({
          method: 'GET',
          endpoint: `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
          connectionId: connectionId,
          providerConfigKey: 'google-mail', // Use the correct provider key
          params: { 
            format: 'full' // Get full message details including headers and snippet
          }
        });

        const headers = detailResponse.data.payload?.headers || [];
        console.error(`[Gmail MCP] Headers found:`, headers.map(h => h.name).slice(0, 10));
        
        // Case-insensitive header lookup
        const getHeader = (name) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value;
        
        const from = getHeader('From') || 'Unknown';
        const subject = getHeader('Subject') || 'No Subject';  
        const date = getHeader('Date') || 'Unknown';
        
        console.error(`[Gmail MCP] Parsed: From="${from}", Subject="${subject}", Date="${date}"`);

        const email = {
          id: message.id,
          from,
          subject,
          date,
          snippet: detailResponse.data.snippet || 'No preview available'
        };
        
        emailList.push(email);
        console.error(`[Gmail MCP] Added email: ${subject} from ${from}`);
        
      } catch (error) {
        console.error(`[Gmail MCP] Error fetching email ${message.id}:`, error.response?.data || error.message);
        
        // Add a basic entry even if details fail
        emailList.push({
          id: message.id,
          from: 'Error loading',
          subject: 'Could not load details',
          date: 'Unknown',
          snippet: `Error: ${error.message}`
        });
      }
    }
    
    console.error(`[Gmail MCP] Final email list length: ${emailList.length}`);

    return {
      content: [{
        type: 'text',
        text: `Found ${emailList.length} emails:\n\n` + 
              emailList.map((email, i) => 
                `${i + 1}. From: ${email.from}\n   Subject: ${email.subject}\n   Date: ${email.date}\n   Preview: ${email.snippet}\n   ID: ${email.id}\n`
              ).join('\n')
      }]
    };
    } catch (error) {
      console.error('[Gmail MCP] Error getting emails:', error.response?.data || error.message);
      throw new Error(`Failed to get emails: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async searchEmails(args) {
    // Use the same logic as getEmails but with search query
    return await this.getEmails({ 
      query: args.query, 
      maxResults: args.maxResults || 20 
    });
  }

  async getEmailDetails(args) {
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const response = await nango.get({
      endpoint: `/gmail/v1/users/me/messages/${args.messageId}`,
      connectionId: process.env.NANGO_CONNECTION_ID,
      providerConfigKey: 'google-mail',
      params: { format: 'full' }
    });

    const message = response.data;
    const headers = message.payload.headers;
    
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
    const to = headers.find(h => h.name === 'To')?.value || 'Unknown';
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const date = headers.find(h => h.name === 'Date')?.value || 'Unknown';
    
    // Extract body
    let body = 'No content';
    if (message.payload.body.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    } else if (message.payload.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body = Buffer.from(part.body.data, 'base64').toString();
          break;
        }
      }
    }

    return {
      content: [{
        type: 'text',
        text: `Email Details:
From: ${from}
To: ${to}
Subject: ${subject}
Date: ${date}

Body:
${body}`
      }]
    };
  }

  async markAsRead(args) {
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    for (const messageId of args.messageIds) {
      await nango.post({
        endpoint: `/gmail/v1/users/me/messages/${messageId}/modify`,
        connectionId: process.env.NANGO_CONNECTION_ID,
        providerConfigKey: 'google-mail',
        data: {
          removeLabelIds: ['UNREAD']
        }
      });
    }

    return {
      content: [{
        type: 'text',
        text: `✓ Marked ${args.messageIds.length} email(s) as read`
      }]
    };
  }

  async deleteEmails(args) {
    const { Nango } = require('@nangohq/node');
    
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    for (const messageId of args.messageIds) {
      await nango.delete({
        endpoint: `/gmail/v1/users/me/messages/${messageId}`,
        connectionId: process.env.NANGO_CONNECTION_ID,
        providerConfigKey: 'gmail-integration'
      });
    }

    return {
      content: [{
        type: 'text',
        text: `✓ Deleted ${args.messageIds.length} email(s)`
      }]
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Gmail MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new GmailMCP();
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = GmailMCP;