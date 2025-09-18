#!/usr/bin/env node

/**
 * Universal Google Drive MCP Server
 * Dynamically handles ANY workspace without hardcoding
 * Leverages existing Google Drive sync capabilities
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');

class UniversalGoogleDriveMCP {
  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    this.server = new Server(
      { name: 'universal-google-drive-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.nangoConfig = {
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev',
      providerConfigKey: 'google-drive'
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
      console.error(`[Google Drive MCP] Using provider config from nangoConfig: ${this.nangoConfig.providerConfigKey}`);
      return this.nangoConfig.providerConfigKey;
    }

    if (process.env.NANGO_PROVIDER_CONFIG_KEY) {
      console.error(`[Google Drive MCP] Using provider config from env: ${process.env.NANGO_PROVIDER_CONFIG_KEY}`);
      return process.env.NANGO_PROVIDER_CONFIG_KEY;
    }

    // Secure fallback - use known working provider config
    const fallbackConfig = 'google-drive';
    console.error(`[Google Drive MCP] No provider config found, using secure fallback: ${fallbackConfig}`);
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
      console.error(`[Google Drive MCP] Using workspace ID from args: ${args.workspaceId}`);
      return args.workspaceId;
    }

    // Extract from NANGO_CONNECTION_ID if set
    if (process.env.NANGO_CONNECTION_ID) {
      const id = process.env.NANGO_CONNECTION_ID.replace('workspace_', '');
      console.error(`[Google Drive MCP] Using workspace ID from NANGO_CONNECTION_ID: ${id}`);
      return id;
    }

    // Extract from server instance name if available (legacy)
    if (process.env.MCP_SERVER_NAME) {
      const match = process.env.MCP_SERVER_NAME.match(/_ws(\d+)$/);
      if (match) {
        console.error(`[Google Drive MCP] Using workspace ID from server name: ${match[1]}`);
        return match[1];
      }
    }

    // Default fallback - should rarely happen now
    console.error('[Google Drive MCP] Warning: No workspace ID found, using default workspace 1');
    return '1'; // Default to workspace 1
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_files',
          description: 'List files and folders from Google Drive',
          inputSchema: {
            type: 'object',
            properties: {
              folderId: { type: 'string', description: 'Folder ID to list (default: root)' },
              maxResults: { type: 'number', description: 'Maximum files to return', default: 50 },
              query: { type: 'string', description: 'Search query (e.g. "name contains \'document\'" or "mimeType=\'application/pdf\'")' },
              orderBy: { type: 'string', description: 'Sort order (name, modifiedTime, size, etc.)' },
              workspaceId: { type: 'string', description: 'Workspace ID (auto-detected if not provided)' }
            }
          }
        },
        {
          name: 'get_file_content',
          description: 'Get content of a Google Drive file (text documents only)',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: { type: 'string', description: 'Google Drive file ID' },
              mimeType: { type: 'string', description: 'MIME type for export (e.g. text/plain for Google Docs)' },
              workspaceId: { type: 'string', description: 'Workspace ID (auto-detected if not provided)' }
            },
            required: ['fileId']
          }
        },
        {
          name: 'upload_file',
          description: 'Upload a file to Google Drive',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'File name' },
              content: { type: 'string', description: 'File content (base64 encoded for binary files)' },
              mimeType: { type: 'string', description: 'MIME type of the file' },
              folderId: { type: 'string', description: 'Parent folder ID (default: root)' },
              workspaceId: { type: 'string', description: 'Workspace ID (auto-detected if not provided)' }
            },
            required: ['name', 'content']
          }
        },
        {
          name: 'create_folder',
          description: 'Create a new folder in Google Drive',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Folder name' },
              parentId: { type: 'string', description: 'Parent folder ID (default: root)' },
              workspaceId: { type: 'string', description: 'Workspace ID (auto-detected if not provided)' }
            },
            required: ['name']
          }
        },
        {
          name: 'share_file',
          description: 'Share a Google Drive file or folder',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: { type: 'string', description: 'File or folder ID to share' },
              email: { type: 'string', description: 'Email address to share with' },
              role: { type: 'string', description: 'Permission role (reader, writer, commenter)', default: 'reader' },
              type: { type: 'string', description: 'Permission type (user, group, domain, anyone)', default: 'user' },
              workspaceId: { type: 'string', description: 'Workspace ID (auto-detected if not provided)' }
            },
            required: ['fileId']
          }
        },
        {
          name: 'get_synced_documents',
          description: 'Get documents that have been synced to the workspace from Google Drive',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'Maximum documents to return', default: 20 },
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
      console.error(`[Google Drive MCP] Processing ${name} for workspace ${workspaceId}`);

      // Inject workspace into args
      const enhancedArgs = { ...args, workspaceId };

      try {
        switch (name) {
          case 'list_files':
            return await this.listFiles(enhancedArgs);
          case 'get_file_content':
            return await this.getFileContent(enhancedArgs);
          case 'upload_file':
            return await this.uploadFile(enhancedArgs);
          case 'create_folder':
            return await this.createFolder(enhancedArgs);
          case 'share_file':
            return await this.shareFile(enhancedArgs);
          case 'get_synced_documents':
            return await this.getSyncedDocuments(enhancedArgs);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[Google Drive MCP] Error in ${name}:`, error);
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

  async listFiles(args) {
    const workspaceId = args.workspaceId;
    const connectionId = `workspace_${workspaceId}`;

    // Create fresh Nango instance for each request
    const { Nango } = require('@nangohq/node');
    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const providerConfigKey = this.getProviderConfigKey();
    const { folderId = 'root', maxResults = 50, query, orderBy } = args;

    // Build query parameters
    const params = {
      pageSize: maxResults
    };

    if (folderId !== 'root') {
      params.q = `'${folderId}' in parents`;
    }

    if (query) {
      params.q = params.q ? `${params.q} and ${query}` : query;
    }

    if (orderBy) {
      params.orderBy = orderBy;
    }

    try {
      console.error(`[Google Drive MCP] Listing files for ${connectionId} with params:`, params);

      const response = await nango.proxy({
        method: 'GET',
        endpoint: 'https://www.googleapis.com/drive/v3/files',
        connectionId: connectionId,
        providerConfigKey: providerConfigKey,
        params: {
          ...params,
          fields: 'files(id,name,mimeType,size,modifiedTime,parents,webViewLink),nextPageToken'
        }
      });

      const files = response.data.files || [];

      if (files.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No files found in the specified location.'
          }]
        };
      }

      const fileList = files.map((file, i) => {
        const size = file.size ? `${Math.round(file.size / 1024)} KB` : 'N/A';
        const type = file.mimeType === 'application/vnd.google-apps.folder' ? '📁 Folder' : '📄 File';
        const modified = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown';

        return `${i + 1}. ${type}: ${file.name}\n   ID: ${file.id}\n   Size: ${size} | Modified: ${modified}\n   Link: ${file.webViewLink || 'N/A'}`;
      });

      return {
        content: [{
          type: 'text',
          text: `Found ${files.length} items:\n\n${fileList.join('\n\n')}`
        }]
      };
    } catch (error) {
      console.error('[Google Drive MCP] Error listing files:', error.response?.data || error.message);
      throw new Error(`Failed to list files: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getFileContent(args) {
    const workspaceId = args.workspaceId;
    const connectionId = `workspace_${workspaceId}`;

    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const providerConfigKey = this.getProviderConfigKey();
    const { fileId, mimeType } = args;

    if (!fileId) {
      throw new Error('File ID is required');
    }

    try {
      console.error(`[Google Drive MCP] Getting file content for ${fileId}`);

      // First get file metadata
      const metaResponse = await nango.proxy({
        method: 'GET',
        endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}`,
        connectionId: connectionId,
        providerConfigKey: providerConfigKey,
        params: { fields: 'id,name,mimeType,size' }
      });

      const fileInfo = metaResponse.data;

      // For Google Workspace files, use export endpoint
      if (fileInfo.mimeType.includes('google-apps')) {
        const exportMimeType = mimeType || 'text/plain';

        const exportResponse = await nango.proxy({
          method: 'GET',
          endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}/export`,
          connectionId: connectionId,
          providerConfigKey: providerConfigKey,
          params: { mimeType: exportMimeType }
        });

        return {
          content: [{
            type: 'text',
            text: `File: ${fileInfo.name}\nType: ${fileInfo.mimeType}\n\nContent:\n${exportResponse.data}`
          }]
        };
      } else {
        // For regular files, use direct download
        const downloadResponse = await nango.proxy({
          method: 'GET',
          endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}`,
          connectionId: connectionId,
          providerConfigKey: providerConfigKey,
          params: { alt: 'media' }
        });

        return {
          content: [{
            type: 'text',
            text: `File: ${fileInfo.name}\nType: ${fileInfo.mimeType}\nSize: ${fileInfo.size} bytes\n\nContent:\n${downloadResponse.data}`
          }]
        };
      }
    } catch (error) {
      console.error('[Google Drive MCP] Error getting file content:', error.response?.data || error.message);
      throw new Error(`Failed to get file content: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async uploadFile(args) {
    const workspaceId = args.workspaceId;
    const connectionId = `workspace_${workspaceId}`;

    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const providerConfigKey = this.getProviderConfigKey();
    const { name, content, mimeType = 'text/plain', folderId = 'root' } = args;

    if (!name || !content) {
      throw new Error('File name and content are required');
    }

    try {
      console.error(`[Google Drive MCP] Uploading file ${name} to ${folderId}`);

      // Create file metadata
      const metadata = {
        name: name,
        parents: folderId !== 'root' ? [folderId] : undefined
      };

      // Use multipart upload
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;

      const body = delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) + delimiter +
        `Content-Type: ${mimeType}\r\n\r\n` +
        content + close_delim;

      const response = await nango.proxy({
        method: 'POST',
        endpoint: 'https://www.googleapis.com/upload/drive/v3/files',
        connectionId: connectionId,
        providerConfigKey: providerConfigKey,
        headers: {
          'Content-Type': `multipart/related; boundary="${boundary}"`
        },
        params: { uploadType: 'multipart' },
        data: body
      });

      return {
        content: [{
          type: 'text',
          text: `✓ File uploaded successfully!\nName: ${response.data.name}\nID: ${response.data.id}\nLink: https://drive.google.com/file/d/${response.data.id}/view`
        }]
      };
    } catch (error) {
      console.error('[Google Drive MCP] Error uploading file:', error.response?.data || error.message);
      throw new Error(`Failed to upload file: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async createFolder(args) {
    const workspaceId = args.workspaceId;
    const connectionId = `workspace_${workspaceId}`;

    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const providerConfigKey = this.getProviderConfigKey();
    const { name, parentId = 'root' } = args;

    if (!name) {
      throw new Error('Folder name is required');
    }

    try {
      console.error(`[Google Drive MCP] Creating folder ${name} in ${parentId}`);

      const metadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId !== 'root' ? [parentId] : undefined
      };

      const response = await nango.proxy({
        method: 'POST',
        endpoint: 'https://www.googleapis.com/drive/v3/files',
        connectionId: connectionId,
        providerConfigKey: providerConfigKey,
        headers: {
          'Content-Type': 'application/json'
        },
        data: metadata
      });

      return {
        content: [{
          type: 'text',
          text: `✓ Folder created successfully!\nName: ${response.data.name}\nID: ${response.data.id}\nLink: https://drive.google.com/drive/folders/${response.data.id}`
        }]
      };
    } catch (error) {
      console.error('[Google Drive MCP] Error creating folder:', error.response?.data || error.message);
      throw new Error(`Failed to create folder: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async shareFile(args) {
    const workspaceId = args.workspaceId;
    const connectionId = `workspace_${workspaceId}`;

    const nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });

    const providerConfigKey = this.getProviderConfigKey();
    const { fileId, email, role = 'reader', type = 'user' } = args;

    if (!fileId) {
      throw new Error('File ID is required');
    }

    try {
      console.error(`[Google Drive MCP] Sharing file ${fileId} with ${email || 'public'}`);

      const permission = {
        type: type,
        role: role
      };

      if (email && type === 'user') {
        permission.emailAddress = email;
      }

      const response = await nango.proxy({
        method: 'POST',
        endpoint: `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
        connectionId: connectionId,
        providerConfigKey: providerConfigKey,
        headers: {
          'Content-Type': 'application/json'
        },
        data: permission
      });

      return {
        content: [{
          type: 'text',
          text: `✓ File shared successfully!\nPermission ID: ${response.data.id}\nType: ${response.data.type}\nRole: ${response.data.role}${response.data.emailAddress ? `\nShared with: ${response.data.emailAddress}` : ''}`
        }]
      };
    } catch (error) {
      console.error('[Google Drive MCP] Error sharing file:', error.response?.data || error.message);
      throw new Error(`Failed to share file: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getSyncedDocuments(args) {
    const workspaceId = args.workspaceId;
    const { limit = 20 } = args;

    try {
      console.error(`[Google Drive MCP] Getting synced documents for workspace ${workspaceId}`);

      // Use the existing Nango sync to get documents
      const nango = new Nango({
        secretKey: process.env.NANGO_SECRET_KEY,
        host: process.env.NANGO_HOST || 'https://api.nango.dev'
      });

      const connectionId = `workspace_${workspaceId}`;
      const providerConfigKey = this.getProviderConfigKey();

      const records = await nango.listRecords({
        providerConfigKey: providerConfigKey,
        connectionId: connectionId,
        model: 'Document'
      });

      const documents = records.records || [];

      if (documents.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'No synced documents found. Make sure Google Drive sync is enabled for this workspace.'
          }]
        };
      }

      const docList = documents.slice(0, limit).map((doc, i) => {
        const lastModified = doc.lastModified ? new Date(doc.lastModified).toLocaleDateString() : 'Unknown';
        return `${i + 1}. ${doc.title || doc.name}\n   ID: ${doc.id}\n   Type: ${doc.mimeType || 'Unknown'}\n   Modified: ${lastModified}\n   Status: ${doc.syncStatus || 'Synced'}`;
      });

      return {
        content: [{
          type: 'text',
          text: `Found ${documents.length} synced documents (showing ${Math.min(limit, documents.length)}):\n\n${docList.join('\n\n')}`
        }]
      };
    } catch (error) {
      console.error('[Google Drive MCP] Error getting synced documents:', error);
      // If sync records don't exist, fall back to direct API call
      return {
        content: [{
          type: 'text',
          text: 'Sync data not available. Use list_files to browse Google Drive directly, or ensure Google Drive sync is properly configured.'
        }]
      };
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Universal Google Drive MCP Server started');
  }
}

// Start the server
if (require.main === module) {
  const server = new UniversalGoogleDriveMCP();
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = UniversalGoogleDriveMCP;