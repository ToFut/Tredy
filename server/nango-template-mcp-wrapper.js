#!/usr/bin/env node

/**
 * Nango Template MCP Wrapper
 * 
 * Converts Nango integration templates into MCP-compatible servers
 * Leverages Nango's standardized OAuth flows and action patterns
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');
const https = require('https');
const fs = require('fs');
const path = require('path');

class NangoTemplateMCP {
  constructor(templateName, options = {}) {
    this.templateName = templateName;
    this.workspaceId = options.workspaceId || this.detectWorkspace();
    this.serviceName = options.serviceName || templateName;
    
    this.server = new Server(
      { 
        name: `nango-${templateName}-mcp`,
        version: '1.0.0' 
      },
      { capabilities: { tools: {} } }
    );

    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    this.templateConfig = this.getTemplateConfig();
    this.tools = [];
    
    this.setupServer();
  }

  /**
   * Get template configuration from Nango templates registry
   */
  getTemplateConfig() {
    const templates = {
      'slack': {
        nangoProvider: 'slack',
        actions: ['send-message', 'list-channels', 'get-user-info', 'create-channel'],
        scopes: ['chat:write', 'channels:read', 'users:read'],
        baseUrl: 'https://slack.com/api'
      },
      'github': {
        nangoProvider: 'github',
        actions: ['list-repos', 'create-issue', 'get-file', 'write-file', 'list-issues'],
        scopes: ['repo', 'user'],
        baseUrl: 'https://api.github.com'
      },
      'notion': {
        nangoProvider: 'notion',
        actions: ['create-page', 'get-database', 'query-database', 'update-page'],
        scopes: ['read', 'write'],
        baseUrl: 'https://api.notion.com/v1'
      },
      'google-mail': {
        nangoProvider: 'google-mail',
        actions: ['send-email', 'get-emails', 'create-draft', 'get-labels'],
        scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
        baseUrl: 'https://gmail.googleapis.com/gmail/v1'
      },
      'salesforce': {
        nangoProvider: 'salesforce',
        actions: ['create-lead', 'get-accounts', 'update-contact', 'query-soql'],
        scopes: ['api', 'refresh_token'],
        baseUrl: 'https://your-instance.salesforce.com/services/data/v58.0'
      },
      'hubspot': {
        nangoProvider: 'hubspot',
        actions: ['create-contact', 'get-contacts', 'update-deal', 'get-companies'],
        scopes: ['contacts', 'deals'],
        baseUrl: 'https://api.hubapi.com'
      },
      'jira': {
        nangoProvider: 'jira',
        actions: ['create-issue', 'get-issues', 'update-issue', 'search-jql'],
        scopes: ['read:jira-work', 'write:jira-work'],
        baseUrl: 'https://your-domain.atlassian.net/rest/api/3'
      },
      'asana': {
        nangoProvider: 'asana',
        actions: ['create-task', 'get-tasks', 'update-task', 'get-projects'],
        scopes: ['default'],
        baseUrl: 'https://app.asana.com/api/1.0'
      },
      'linear': {
        nangoProvider: 'linear',
        actions: ['create-issue', 'get-issues', 'update-issue', 'get-teams'],
        scopes: ['read', 'write'],
        baseUrl: 'https://api.linear.app/graphql'
      },
      'confluence': {
        nangoProvider: 'confluence',
        actions: ['create-page', 'get-page', 'update-page', 'search-content'],
        scopes: ['read:confluence-content.all', 'write:confluence-content.all'],
        baseUrl: 'https://your-domain.atlassian.net/wiki/rest/api'
      },
      'dropbox': {
        nangoProvider: 'dropbox',
        actions: ['upload-file', 'download-file', 'list-files', 'create-folder'],
        scopes: ['files.metadata.read', 'files.content.write'],
        baseUrl: 'https://api.dropboxapi.com/2'
      },
      'zoom': {
        nangoProvider: 'zoom',
        actions: ['create-meeting', 'get-meetings', 'update-meeting', 'get-users'],
        scopes: ['meeting:write', 'user:read'],
        baseUrl: 'https://api.zoom.us/v2'
      },
      'microsoft-teams': {
        nangoProvider: 'microsoft-teams',
        actions: ['send-message', 'get-channels', 'create-channel', 'get-messages'],
        scopes: ['https://graph.microsoft.com/Channel.ReadBasic.All', 'https://graph.microsoft.com/Chat.ReadWrite'],
        baseUrl: 'https://graph.microsoft.com/v1.0'
      }
    };

    return templates[this.templateName] || {
      nangoProvider: this.templateName,
      actions: ['generic-action'],
      scopes: ['default'],
      baseUrl: 'https://api.example.com'
    };
  }

  /**
   * Detect workspace ID from environment or arguments
   */
  detectWorkspace() {
    // Try to get from environment first
    if (process.env.WORKSPACE_ID) {
      return process.env.WORKSPACE_ID;
    }
    
    // Try to get from Nango connection ID
    if (process.env.NANGO_CONNECTION_ID) {
      const match = process.env.NANGO_CONNECTION_ID.match(/workspace_(\d+)/);
      if (match) {
        return match[1];
      }
    }
    
    // Default to workspace 1
    return '1';
  }

  /**
   * Setup the MCP server with tools
   */
  async setupServer() {
    await this.loadOAuthCredentials();
    await this.generateTools();
    this.registerTools();
    this.startServer();
  }

  /**
   * Load OAuth credentials from Nango
   */
  async loadOAuthCredentials() {
    try {
      const connection = await this.nango.getConnection({
        connectionId: `workspace_${this.workspaceId}`,
        providerConfigKey: this.templateConfig.nangoProvider
      });
      
      this.credentials = connection.credentials;
      console.log(`[Nango MCP] Loaded credentials for ${this.templateName}`);
    } catch (error) {
      console.error(`[Nango MCP] Failed to load credentials for ${this.templateName}: ${error.message}`);
      this.credentials = {};
    }
  }

  /**
   * Generate MCP tools from Nango template actions
   */
  async generateTools() {
    this.tools = this.templateConfig.actions.map(actionName => {
      const toolName = `${this.templateName}-${actionName}`;
      
      return {
        name: toolName,
        description: this.getActionDescription(actionName),
        inputSchema: this.getActionSchema(actionName),
        handler: async (args) => {
          return await this.executeAction(actionName, args);
        }
      };
    });
  }

  /**
   * Get action description based on action name
   */
  getActionDescription(actionName) {
    const descriptions = {
      'send-message': 'Send a message to a channel or user',
      'list-channels': 'List all available channels',
      'get-user-info': 'Get information about a user',
      'create-channel': 'Create a new channel',
      'list-repos': 'List repositories',
      'create-issue': 'Create a new issue',
      'get-file': 'Get file content',
      'write-file': 'Write content to a file',
      'list-issues': 'List issues',
      'create-page': 'Create a new page',
      'get-database': 'Get database information',
      'query-database': 'Query database records',
      'update-page': 'Update an existing page',
      'send-email': 'Send an email',
      'get-emails': 'Get email messages',
      'create-draft': 'Create a draft email',
      'get-labels': 'Get email labels',
      'create-lead': 'Create a new lead',
      'get-accounts': 'Get account information',
      'update-contact': 'Update contact information',
      'query-soql': 'Execute SOQL query',
      'create-contact': 'Create a new contact',
      'get-contacts': 'Get contact information',
      'update-deal': 'Update deal information',
      'get-companies': 'Get company information',
      'update-issue': 'Update an existing issue',
      'search-jql': 'Search using JQL',
      'create-task': 'Create a new task',
      'get-tasks': 'Get task information',
      'update-task': 'Update an existing task',
      'get-projects': 'Get project information',
      'get-teams': 'Get team information',
      'get-page': 'Get page content',
      'search-content': 'Search content',
      'upload-file': 'Upload a file',
      'download-file': 'Download a file',
      'list-files': 'List files',
      'create-folder': 'Create a new folder',
      'create-meeting': 'Create a new meeting',
      'get-meetings': 'Get meeting information',
      'update-meeting': 'Update an existing meeting',
      'get-users': 'Get user information',
      'get-messages': 'Get message history'
    };

    return descriptions[actionName] || `Execute ${actionName} action`;
  }

  /**
   * Get action schema based on action name
   */
  getActionSchema(actionName) {
    const schemas = {
      'send-message': {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID or name' },
          text: { type: 'string', description: 'Message text' },
          blocks: { type: 'array', description: 'Message blocks (optional)' }
        },
        required: ['channel', 'text']
      },
      'list-channels': {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of channels to return' },
          cursor: { type: 'string', description: 'Pagination cursor' }
        }
      },
      'create-channel': {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Channel name' },
          is_private: { type: 'boolean', description: 'Whether channel is private' }
        },
        required: ['name']
      },
      'list-repos': {
        type: 'object',
        properties: {
          per_page: { type: 'number', description: 'Number of repos per page' },
          page: { type: 'number', description: 'Page number' },
          sort: { type: 'string', description: 'Sort order' }
        },
        required: []
      },
      'create-issue': {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Issue title' },
          body: { type: 'string', description: 'Issue description' },
          labels: { type: 'array', description: 'Issue labels' },
          assignees: { type: 'array', description: 'Issue assignees' }
        },
        required: ['title']
      },
      'send-email': {
        type: 'object',
        properties: {
          to: { type: 'string', description: 'Recipient email address' },
          subject: { type: 'string', description: 'Email subject' },
          body: { type: 'string', description: 'Email body' },
          cc: { type: 'string', description: 'CC recipients' },
          bcc: { type: 'string', description: 'BCC recipients' }
        },
        required: ['to', 'subject', 'body']
      }
    };

    return schemas[actionName] || {
      type: 'object',
      properties: {
        data: { type: 'object', description: 'Action data' }
      }
    };
  }

  /**
   * Execute a Nango action
   */
  async executeAction(actionName, args) {
    try {
      console.log(`[Nango MCP] Executing ${actionName} with args:`, args);
      
      // Make API call based on action
      const result = await this.makeAPICall(actionName, args);
      
      console.log(`[Nango MCP] ${actionName} completed successfully`);
      return typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      
    } catch (error) {
      console.error(`[Nango MCP] ${actionName} failed:`, error.message);
      return `Error executing ${actionName}: ${error.message}`;
    }
  }

  /**
   * Make API call to the service
   */
  async makeAPICall(actionName, args) {
    const endpoint = this.getActionEndpoint(actionName);
    const method = this.getActionMethod(actionName);
    
    const url = `${this.templateConfig.baseUrl}${endpoint}`;
    const headers = this.buildHeaders();
    const body = this.buildRequestBody(actionName, args);
    
    return await this.httpRequest(method, url, headers, body);
  }

  /**
   * Get API endpoint for action
   */
  getActionEndpoint(actionName) {
    const endpoints = {
      'send-message': '/chat.postMessage',
      'list-channels': '/conversations.list',
      'get-user-info': '/users.info',
      'create-channel': '/conversations.create',
      'list-repos': '/user/repos',
      'create-issue': '/repos/{owner}/{repo}/issues',
      'get-file': '/repos/{owner}/{repo}/contents/{path}',
      'write-file': '/repos/{owner}/{repo}/contents/{path}',
      'list-issues': '/repos/{owner}/{repo}/issues',
      'create-page': '/pages',
      'get-database': '/databases/{database_id}',
      'query-database': '/databases/{database_id}/query',
      'update-page': '/pages/{page_id}',
      'send-email': '/users/me/messages/send',
      'get-emails': '/users/me/messages',
      'create-draft': '/users/me/drafts',
      'get-labels': '/users/me/labels',
      'create-lead': '/sobjects/Lead',
      'get-accounts': '/sobjects/Account',
      'update-contact': '/sobjects/Contact/{id}',
      'query-soql': '/query',
      'create-contact': '/crm/v3/objects/contacts',
      'get-contacts': '/crm/v3/objects/contacts',
      'update-deal': '/crm/v3/objects/deals/{dealId}',
      'get-companies': '/crm/v3/objects/companies',
      'create-issue': '/repos/{owner}/{repo}/issues',
      'get-issues': '/repos/{owner}/{repo}/issues',
      'update-issue': '/repos/{owner}/{repo}/issues/{issueId}',
      'search-jql': '/search',
      'create-task': '/tasks',
      'get-tasks': '/tasks',
      'update-task': '/tasks/{taskId}',
      'get-projects': '/projects',
      'get-teams': '/teams',
      'create-page': '/pages',
      'get-page': '/pages/{pageId}',
      'search-content': '/content/search',
      'upload-file': '/files/upload',
      'download-file': '/files/download',
      'list-files': '/files/list_folder',
      'create-folder': '/files/create_folder',
      'create-meeting': '/users/{userId}/meetings',
      'get-meetings': '/users/{userId}/meetings',
      'update-meeting': '/meetings/{meetingId}',
      'get-users': '/users',
      'get-messages': '/teams/{teamId}/channels/{channelId}/messages'
    };

    return endpoints[actionName] || '/api/action';
  }

  /**
   * Get HTTP method for action
   */
  getActionMethod(actionName) {
    const methods = {
      'send-message': 'POST',
      'list-channels': 'GET',
      'get-user-info': 'GET',
      'create-channel': 'POST',
      'list-repos': 'GET',
      'create-issue': 'POST',
      'get-file': 'GET',
      'write-file': 'PUT',
      'list-issues': 'GET',
      'create-page': 'POST',
      'get-database': 'GET',
      'query-database': 'POST',
      'update-page': 'PATCH',
      'send-email': 'POST',
      'get-emails': 'GET',
      'create-draft': 'POST',
      'get-labels': 'GET',
      'create-lead': 'POST',
      'get-accounts': 'GET',
      'update-contact': 'PATCH',
      'query-soql': 'GET',
      'create-contact': 'POST',
      'get-contacts': 'GET',
      'update-deal': 'PATCH',
      'get-companies': 'GET',
      'update-issue': 'PATCH',
      'search-jql': 'GET',
      'create-task': 'POST',
      'get-tasks': 'GET',
      'update-task': 'PUT',
      'get-projects': 'GET',
      'get-teams': 'GET',
      'get-page': 'GET',
      'search-content': 'GET',
      'upload-file': 'POST',
      'download-file': 'POST',
      'list-files': 'POST',
      'create-folder': 'POST',
      'create-meeting': 'POST',
      'get-meetings': 'GET',
      'update-meeting': 'PATCH',
      'get-users': 'GET',
      'get-messages': 'GET'
    };

    return methods[actionName] || 'GET';
  }

  /**
   * Build request headers
   */
  buildHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'Nango-MCP-Wrapper/1.0.0'
    };

    // Add service-specific headers
    if (this.templateName === 'github') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
      headers['Accept'] = 'application/vnd.github.v3+json';
    } else if (this.templateName === 'slack') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'notion') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
      headers['Notion-Version'] = '2022-06-28';
    } else if (this.templateName === 'google-mail') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'salesforce') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'hubspot') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'jira') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'asana') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'linear') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'confluence') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'dropbox') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'zoom') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } else if (this.templateName === 'microsoft-teams') {
      headers['Authorization'] = `Bearer ${this.credentials.access_token}`;
    }

    return headers;
  }

  /**
   * Build request body
   */
  buildRequestBody(actionName, args) {
    if (this.getActionMethod(actionName) === 'GET') {
      return null;
    }

    // Service-specific body building
    if (this.templateName === 'slack' && actionName === 'send-message') {
      return {
        channel: args.channel,
        text: args.text,
        blocks: args.blocks || undefined
      };
    } else if (this.templateName === 'github' && actionName === 'create-issue') {
      const body = {
        title: args.title,
        body: args.body || ''
      };
      
      if (args.labels && args.labels.length > 0) {
        body.labels = args.labels;
      }
      
      if (args.assignees && args.assignees.length > 0) {
        body.assignees = args.assignees;
      }
      
      return body;
    } else if (this.templateName === 'google-mail' && actionName === 'send-email') {
      return {
        raw: Buffer.from(
          `To: ${args.to}\r\n` +
          `Subject: ${args.subject}\r\n` +
          `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
          `${args.body}`
        ).toString('base64url')
      };
    }

    return args;
  }

  /**
   * Make HTTP request
   */
  async httpRequest(method, url, headers, body) {
    return new Promise((resolve, reject) => {
      const options = {
        method,
        headers
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Register tools with MCP server
   */
  registerTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.find(t => t.name === request.params.name);
      if (!tool) {
        throw new Error(`Tool ${request.params.name} not found`);
      }

      const result = await tool.handler(request.params.arguments || {});
      return {
        content: [
          {
            type: 'text',
            text: result
          }
        ]
      };
    });
  }

  /**
   * Start the MCP server
   */
  startServer() {
    const transport = new StdioServerTransport();
    this.server.connect(transport);
    console.log(`[Nango MCP] ${this.templateName} server started with ${this.tools.length} tools`);
  }
}

// Run if called directly
if (require.main === module) {
  const templateName = process.argv[2];
  if (!templateName) {
    console.error('Usage: node nango-template-mcp-wrapper.js <template-name>');
    process.exit(1);
  }

  const wrapper = new NangoTemplateMCP(templateName);
}

module.exports = NangoTemplateMCP;