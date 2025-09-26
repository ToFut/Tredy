#!/usr/bin/env node

/**
 * LinkedIn MCP Server
 * Provides LinkedIn API access through Model Context Protocol
 * Uses Nango for OAuth and API calls
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Nango } from '@nangohq/node';

class LinkedInMCPServer {
  constructor() {
    this.server = new Server({
      name: 'linkedin-mcp-server',
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
      },
    });

    this.nango = null;
    this.workspaceId = process.env.NANGO_CONNECTION_ID?.replace('workspace_', '') || null;
    this.setupNango();
    this.setupHandlers();
  }

  setupNango() {
    const secretKey = process.env.NANGO_SECRET_KEY;
    const host = process.env.NANGO_HOST || 'https://api.nango.dev';
    
    if (secretKey) {
      this.nango = new Nango({ secretKey, host });
      console.error('[LinkedIn MCP] Nango initialized');
    } else {
      console.error('[LinkedIn MCP] NANGO_SECRET_KEY not provided');
    }
  }

  // Check if LinkedIn is connected
  async checkConnection(workspaceId = null) {
    if (!this.nango) return false;
    
    const connectionId = workspaceId ? `workspace_${workspaceId}` : process.env.NANGO_CONNECTION_ID;
    if (!connectionId) return false;
    
    try {
      const provider = process.env.NANGO_PROVIDER || 'linkedin';
      await this.nango.getConnection(provider, connectionId);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Generate connection button for chat
  generateConnectButton() {
    return `🔗 **LinkedIn Not Connected**

To access LinkedIn features, please connect your account:

[connect:linkedin]

Or run: \`@agent integrate linkedin\` to set up the connection.`;
  }

  // Handle LinkedIn connection directly from chat
  async handleConnection(action = 'initiate') {
    if (action === 'status') {
      const isConnected = await this.checkConnection();
      return {
        content: [{
          type: 'text',
          text: isConnected 
            ? '✅ **LinkedIn Connected** - You can now use all LinkedIn features!'
            : '❌ **LinkedIn Not Connected** - Use the connect button below to get started.'
        }]
      };
    }

    if (action === 'initiate') {
      const isConnected = await this.checkConnection();
      if (isConnected) {
        return {
          content: [{
            type: 'text',
            text: '✅ **Already Connected to LinkedIn**\n\nYour LinkedIn account is connected and ready to use!'
          }]
        };
      }

      // Use existing Universal Integration to start OAuth flow
      try {
        // Leverage the universal integrator
        return {
          content: [{
            type: 'text',
            text: `🚀 **Connect LinkedIn Account**

Connect your LinkedIn account to access messaging, profile, and networking features:

[connect:linkedin]

**Alternative:** Run \`@agent integrate linkedin\` for full setup with sync capabilities.

Once connected, I'll be able to:
• ✉️ Help with LinkedIn messaging (with limitations)
• 👤 Access your profile information  
• 📝 Create LinkedIn posts
• 🔍 Search your network
• 📊 Get connection insights

Would you like me to start the integration now?`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ **Connection Setup Error**

${error.message}

Please try connecting manually:
1. Go to Workspace Settings → Data Connectors
2. Find LinkedIn and click Connect
3. Complete the OAuth flow

Or run: \`@agent integrate linkedin\``
          }]
        };
      }
    }

    return {
      content: [{
        type: 'text',
        text: 'Invalid action. Use "initiate" to start connection or "status" to check current status.'
      }]
    };
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'linkedin_get_profile',
          description: 'Get LinkedIn user profile information',
          inputSchema: {
            type: 'object',
            properties: {
              fields: {
                type: 'array',
                items: { type: 'string' },
                description: 'Profile fields to retrieve (default: all)',
                default: ['id', 'firstName', 'lastName', 'emailAddress']
              }
            }
          }
        },
        {
          name: 'linkedin_search_posts',
          description: 'Search LinkedIn posts and content',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for posts'
              },
              limit: {
                type: 'number',
                description: 'Number of posts to return',
                default: 10,
                maximum: 50
              }
            },
            required: ['query']
          }
        },
        {
          name: 'linkedin_create_post',
          description: 'Create a LinkedIn post',
          inputSchema: {
            type: 'object',
            properties: {
              text: {
                type: 'string',
                description: 'Post content text'
              },
              visibility: {
                type: 'string',
                enum: ['PUBLIC', 'CONNECTIONS', 'LOGGED_IN'],
                description: 'Post visibility',
                default: 'CONNECTIONS'
              }
            },
            required: ['text']
          }
        },
        {
          name: 'linkedin_send_message',
          description: 'Send a message to LinkedIn connections. Will guide through connection if not connected.',
          inputSchema: {
            type: 'object',
            properties: {
              recipientName: {
                type: 'string',
                description: 'Name of the recipient (e.g., "Guy Tal")'
              },
              message: {
                type: 'string',
                description: 'Message content to send'
              }
            },
            required: ['recipientName', 'message']
          }
        },
        {
          name: 'linkedin_get_connections',
          description: 'Get LinkedIn connections list',
          inputSchema: {
            type: 'object',
            properties: {
              limit: {
                type: 'number',
                description: 'Number of connections to return',
                default: 50,
                maximum: 500
              }
            }
          }
        },
        {
          name: 'linkedin_connect',
          description: 'Connect LinkedIn account directly from chat',
          inputSchema: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: ['initiate', 'status'],
                description: 'Action to perform: initiate connection or check status',
                default: 'initiate'
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.nango) {
        throw new Error('Nango not configured. Please set NANGO_SECRET_KEY environment variable.');
      }

      // Get workspace ID from args to determine the connection
      const workspaceId = args.workspaceId;
      const connectionId = workspaceId ? `workspace_${workspaceId}` : process.env.NANGO_CONNECTION_ID;
      
      if (!connectionId) {
        throw new Error('No workspace ID provided and no default connection configured');
      }
      
      console.error(`[LinkedIn MCP] Using connectionId: ${connectionId}`);
      const provider = process.env.NANGO_PROVIDER || 'linkedin-getting-started';

      try {
        switch (name) {
          case 'linkedin_get_profile':
            return await this.getProfile(provider, connectionId, args.fields);

          case 'linkedin_search_posts':
            return await this.searchPosts(provider, connectionId, args.query, args.limit);

          case 'linkedin_create_post':
            return await this.createPost(provider, connectionId, args.text, args.visibility);

          case 'linkedin_send_message':
            return await this.sendMessage(provider, connectionId, args.recipientName, args.message);

          case 'linkedin_get_connections':
            return await this.getConnections(provider, connectionId, args.limit);

          case 'linkedin_connect':
            return await this.handleConnection(args.action || 'initiate');

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[LinkedIn MCP] Error in ${name}:`, error);
        throw error;
      }
    });
  }

  async getProfile(provider, connectionId, fields = []) {
    try {
      // Check connection first
      const workspaceId = connectionId ? connectionId.replace('workspace_', '') : null;
      const isConnected = await this.checkConnection(workspaceId);
      if (!isConnected) {
        return {
          content: [{
            type: 'text',
            text: this.generateConnectButton()
          }]
        };
      }

      const response = await this.nango.get({
        endpoint: '/v2/userinfo',
        connectionId,
        providerConfigKey: provider,
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401'
        }
      });

      const profile = response.data || {};
      
      return {
        content: [{
          type: 'text',
          text: `✅ **Your LinkedIn Profile**

👤 **Name:** ${profile.name || 'Not available'}
📧 **Email:** ${profile.email || 'Not available'}
🆔 **ID:** ${profile.sub || 'Not available'}
🌍 **Locale:** ${JSON.stringify(profile.locale) || 'Not available'}
✉️ **Email Verified:** ${profile.email_verified ? '✅' : '❌'}

Connected successfully! You can now use LinkedIn features.`
        }]
      };
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          content: [{
            type: 'text',
            text: this.generateConnectButton()
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: `❌ **Error getting LinkedIn profile**

${error.message}

This might be due to:
• LinkedIn API limitations
• Missing permissions
• Network issues

Try reconnecting your LinkedIn account.`
        }]
      };
    }
  }

  async searchPosts(provider, connectionId, query, limit = 10) {
    try {
      // LinkedIn doesn't have a direct search API, so we'll get recent posts
      const response = await this.nango.get({
        endpoint: '/v2/ugcPosts',
        connectionId,
        providerConfigKey: provider,
        params: {
          q: 'authors',
          authors: 'urn:li:person:' + connectionId,
          count: limit
        },
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401'
        }
      });

      const posts = response.data.elements || [];
      const filteredPosts = posts.filter(post => {
        const text = post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '';
        return text.toLowerCase().includes(query.toLowerCase());
      });

      return {
        content: [{
          type: 'text',
          text: `Found ${filteredPosts.length} LinkedIn posts matching "${query}":\n${JSON.stringify(filteredPosts, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to search LinkedIn posts: ${error.message}`);
    }
  }

  async createPost(provider, connectionId, text, visibility = 'CONNECTIONS') {
    try {
      const postData = {
        author: `urn:li:person:${connectionId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': visibility
        }
      };

      const response = await this.nango.post({
        endpoint: '/v2/ugcPosts',
        data: postData,
        connectionId,
        providerConfigKey: provider,
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401',
          'Content-Type': 'application/json'
        }
      });

      return {
        content: [{
          type: 'text',
          text: `LinkedIn post created successfully! Post ID: ${response.data.id}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to create LinkedIn post: ${error.message}`);
    }
  }

  async sendMessage(provider, connectionId, recipientName, message) {
    try {
      // Check connection first
      const workspaceId = connectionId ? connectionId.replace('workspace_', '') : null;
      const isConnected = await this.checkConnection(workspaceId);
      if (!isConnected) {
        return {
          content: [{
            type: 'text',
            text: this.generateConnectButton()
          }]
        };
      }

      // First, search for the person by name
      const searchResponse = await this.nango.get({
        endpoint: '/v2/people',
        connectionId,
        providerConfigKey: provider,
        params: {
          q: 'members',
          keywords: recipientName,
          start: 0,
          count: 10
        },
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401'
        }
      });

      const people = searchResponse.data?.elements || [];
      if (people.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `❌ Could not find "${recipientName}" in your LinkedIn connections.

💡 **Tips:**
• Make sure you're connected to this person on LinkedIn
• Try using their exact LinkedIn name
• Check spelling of the name

Would you like me to search for them differently?`
          }]
        };
      }

      // Use the first match
      const recipient = people[0];
      const recipientId = recipient.id;

      // Note: LinkedIn messaging API is heavily restricted
      return {
        content: [{
          type: 'text',
          text: `🔒 **LinkedIn Messaging Limitations**

Found "${recipientName}" in your network, but LinkedIn's messaging API requires special partner permissions that are very difficult to obtain.

**Alternative Options:**
1. **Manual Message**: Copy this message and send it directly on LinkedIn:
   📝 "${message}"

2. **LinkedIn Web**: [Open LinkedIn Messages](https://www.linkedin.com/messaging/) and search for "${recipientName}"

3. **Connection Request**: If not connected, I could help you find their profile to send a connection request first.

**Why This Limitation Exists:**
LinkedIn heavily restricts programmatic messaging to prevent spam. Only select enterprise partners have this access.`
        }]
      };

    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return {
          content: [{
            type: 'text',
            text: this.generateConnectButton()
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: `❌ **LinkedIn API Error**

${error.message}

This is likely due to LinkedIn's strict API limitations. LinkedIn messaging requires special enterprise permissions.

**Quick Solution:** 
1. Go to [LinkedIn Messages](https://www.linkedin.com/messaging/)
2. Search for "${recipientName}" 
3. Send: "${message}"`
        }]
      };
    }
  }

  async getConnections(provider, connectionId, limit = 50) {
    try {
      // Note: LinkedIn connections API is restricted and requires special permissions
      const response = await this.nango.get({
        endpoint: '/v2/people/~connections',
        connectionId,
        providerConfigKey: provider,
        params: { count: limit },
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401'
        }
      });

      return {
        content: [{
          type: 'text',
          text: `LinkedIn Connections (${response.data.elements?.length || 0} found):\n${JSON.stringify(response.data, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`Failed to get LinkedIn connections: ${error.message}. Note: Connections API requires special LinkedIn partnership.`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[LinkedIn MCP] Server running on stdio');
  }
}

// Run the server
const server = new LinkedInMCPServer();
server.run().catch(console.error);