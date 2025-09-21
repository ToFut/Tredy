#!/usr/bin/env node

/**
 * Google Drive MCP Tools
 * Comprehensive Google Drive integration with local filesystem operations
 *
 * Features:
 * - Fetch files from Google Drive to local filesystem
 * - Upload files from local filesystem to Google Drive
 * - Get content of files/folders from Google Drive
 * - List all files and directories in Google Drive
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');
const fs = require('fs');
const path = require('path');

class GoogleDriveMCPTools {
  constructor() {
    if (!process.env.NANGO_SECRET_KEY) {
      throw new Error('NANGO_SECRET_KEY environment variable is required');
    }

    this.server = new Server(
      { name: 'g-drive-mcp-tools', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.nangoConfig = {
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev',
      providerConfigKey: process.env.NANGO_PROVIDER_CONFIG_KEY || 'google-drive'
    };

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
    return process.env.NANGO_CONNECTION_ID || `workspace_${workspaceId}`;
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_gdrive_files',
          description: 'List all files and directories in Google Drive. Use when user wants to browse, explore, or see what files are available.',
          inputSchema: {
            type: 'object',
            properties: {
              folderId: {
                type: 'string',
                description: 'Google Drive folder ID to list contents of (optional, defaults to root)'
              },
              limit: {
                type: 'number',
                description: 'Maximum number of files to return (default: 50)',
                default: 50
              },
              query: {
                type: 'string',
                description: 'Search query to filter files (optional)'
              }
            }
          }
        },
        {
          name: 'get_gdrive_file_content',
          description: 'STEP 2: Get the actual content of a Google Drive file. Use this AFTER getting the file ID from search_gdrive_files. Supports all file types including text files, Google Docs, Sheets, etc. CRITICAL: You MUST have the actual Google Drive file ID (NOT the filename). Handles large files with size limits and chunking.',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'REQUIRED: The Google Drive file ID returned from search_gdrive_files (looks like "1SSpDJcLuNymglZzLDnt1zVSaAYX5S_mb"). This is NOT the filename - it is the unique Google Drive identifier.'
              },
              format: {
                type: 'string',
                description: 'Optional: Export format for Google Workspace files (txt, html, pdf, docx, etc). Default is txt.',
                default: 'txt'
              },
              maxSize: {
                type: 'number',
                description: 'Optional: Maximum content size in bytes (default: 50MB). Larger files will be truncated or chunked.',
                default: 52428800
              },
              chunked: {
                type: 'boolean',
                description: 'Optional: For large files, return first chunk with info instead of truncating (default: false).',
                default: false
              }
            },
            required: ['fileId']
          }
        },
        {
          name: 'fetch_gdrive_file_to_local',
          description: 'Download/fetch a file from Google Drive to local filesystem. Supports all file types including Google Workspace files. Use when user wants to download, save, or copy files locally. IMPORTANT: Requires Google Drive file ID (not filename). Use search_gdrive_files first if you only have a filename.',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'Google Drive file ID (long string like 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms) - NOT the filename. Use search_gdrive_files to find the ID.'
              },
              localPath: {
                type: 'string',
                description: 'Local file path where to save the file'
              },
              format: {
                type: 'string',
                description: 'Export format for Google Workspace files. Options: txt, html, rtf, pdf, docx, odt, epub, xlsx, ods, csv, pptx, odp, svg, png, jpg',
                default: 'txt'
              }
            },
            required: ['fileId', 'localPath']
          }
        },
        {
          name: 'upload_local_file_to_gdrive',
          description: 'Upload/insert a file from local filesystem to Google Drive. Supports all file types including images, documents, videos, audio, archives, and code files. Use when user wants to upload, backup, or share local files.',
          inputSchema: {
            type: 'object',
            properties: {
              localPath: {
                type: 'string',
                description: 'Local file path to upload (supports all file types)'
              },
              fileName: {
                type: 'string',
                description: 'Name for the file in Google Drive (optional, uses local filename if not provided)'
              },
              folderId: {
                type: 'string',
                description: 'Google Drive folder ID to upload to (optional, uploads to root if not provided)'
              }
            },
            required: ['localPath']
          }
        },
        {
          name: 'search_gdrive_files',
          description: 'STEP 1: Search for files in Google Drive by filename. This MUST be called FIRST when user wants to find a file. Returns file IDs needed for other operations. ALWAYS use this when you only have a filename like "ex2_q4.c.txt".',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: {
                type: 'string',
                description: 'REQUIRED: Exact or partial filename to search for (e.g. "ex2_q4.c.txt")'
              },
              mimeType: {
                type: 'string',
                description: 'Optional: MIME type filter (e.g., "text/plain" for .txt files)'
              },
              folderId: {
                type: 'string',
                description: 'Optional: Folder ID to search within (searches entire drive if not provided)'
              },
              limit: {
                type: 'number',
                description: 'Optional: Maximum results (default: 10)',
                default: 10
              }
            },
            required: ['fileName']
          }
        },
        {
          name: 'convert_document_to_text',
          description: 'Convert PDF and DOCX files from Google Drive to clean, human-readable text. Handles proper text extraction, formatting, and removes formatting artifacts. Use when user wants to read content from PDF or DOCX files.',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: {
                type: 'string',
                description: 'Google Drive file ID (long string like 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms) - NOT the filename. Use search_gdrive_files to find the ID.'
              },
              preserveFormatting: {
                type: 'boolean',
                description: 'Whether to preserve basic formatting like paragraphs and line breaks (default: true)',
                default: true
              },
              maxLength: {
                type: 'number',
                description: 'Maximum length of extracted text in characters (default: 50000)',
                default: 50000
              }
            },
            required: ['fileId']
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const workspaceId = this.getWorkspaceId(args);

      console.error(`[g-drive-mcp-tools] Processing ${name} for workspace ${workspaceId}`);

      try {
        switch (name) {
          case 'list_gdrive_files':
            return await this.listGoogleDriveFiles(args, workspaceId);
          case 'get_gdrive_file_content':
            return await this.getGoogleDriveFileContent(args, workspaceId);
          case 'fetch_gdrive_file_to_local':
            return await this.fetchGoogleDriveFileToLocal(args, workspaceId);
          case 'upload_local_file_to_gdrive':
            return await this.uploadLocalFileToGoogleDrive(args, workspaceId);
          case 'search_gdrive_files':
            return await this.searchGoogleDriveFiles(args, workspaceId);
          case 'convert_document_to_text':
            return await this.convertDocumentToText(args, workspaceId);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[g-drive-mcp-tools] Error in ${name}:`, error);
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  async listGoogleDriveFiles(args, workspaceId) {
    const nango = new Nango(this.nangoConfig);
    const connectionId = this.getConnectionId(workspaceId);
    const { folderId, limit = 50, query } = args;

    try {
      let endpoint = '/drive/v3/files';
      const params = {
        pageSize: limit,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink)'
      };

      // Add folder filter if specified
      if (folderId) {
        params.q = `'${folderId}' in parents`;
      }

      // Add search query if specified
      if (query) {
        const searchQuery = `name contains '${query}'`;
        params.q = params.q ? `${params.q} and ${searchQuery}` : searchQuery;
      }

      const response = await nango.get({
        endpoint,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params
      });

      const files = response.data?.files || [];

      if (files.length === 0) {
        return {
          content: [{
            type: 'text',
            text: folderId ? `No files found in the specified folder.` : 'No files found in Google Drive.'
          }]
        };
      }

      const formatted = files.map((file, i) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const icon = isFolder ? '📁' : '📄';
        const size = file.size ? `(${this.formatFileSize(file.size)})` : '';
        const modified = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '';

        return `${i + 1}. ${icon} ${file.name} ${size}\n   ID: ${file.id}\n   Type: ${isFolder ? 'Folder' : file.mimeType}\n   Modified: ${modified}\n   Link: ${file.webViewLink || 'N/A'}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${files.length} items in Google Drive:\n\n${formatted}`
        }]
      };
    } catch (error) {
      console.error('List files error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Could not list Google Drive files. Please check your connection and try again.`
        }],
        isError: true
      };
    }
  }

  async getGoogleDriveFileContent(args, workspaceId) {
    const nango = new Nango(this.nangoConfig);
    const connectionId = this.getConnectionId(workspaceId);
    const { fileId, format = 'txt', maxSize = 50 * 1024 * 1024, chunked = false } = args; // 50MB default limit

    try {
      // First get file metadata
      const metaResponse = await nango.get({
        endpoint: `/drive/v3/files/${fileId}`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: {
          fields: 'id,name,mimeType,size,parents'
        }
      });

      const file = metaResponse.data;

      // Check file size and warn if large
      const fileSize = parseInt(file.size) || 0;
      if (fileSize > maxSize) {
        return {
          content: [{
            type: 'text',
            text: `⚠️ File "${file.name}" is too large (${this.formatFileSize(fileSize)}).\n\nMaximum supported size: ${this.formatFileSize(maxSize)}\n\nFor large files, consider:\n1. Using chunked reading with chunked=true parameter\n2. Downloading the file locally first\n3. Using a smaller maxSize parameter\n\nFile ID: ${fileId}\nActual size: ${this.formatFileSize(fileSize)}`
          }]
        };
      }

      // Handle folders
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        // List folder contents
        const folderResponse = await nango.get({
          endpoint: '/drive/v3/files',
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params: {
            q: `'${fileId}' in parents`,
            fields: 'files(id,name,mimeType,size)'
          }
        });

        const contents = folderResponse.data?.files || [];
        const formatted = contents.map((item, i) => {
          const icon = item.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
          const size = item.size ? `(${this.formatFileSize(item.size)})` : '';
          return `${i + 1}. ${icon} ${item.name} ${size} - ID: ${item.id}`;
        }).join('\n');

        return {
          content: [{
            type: 'text',
            text: `Folder "${file.name}" contains ${contents.length} items:\n\n${formatted}`
          }]
        };
      }

      // Handle Google Workspace files (Docs, Sheets, etc.)
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        const exportMimeTypes = {
          // Text formats
          'txt': 'text/plain',
          'html': 'text/html',
          'rtf': 'application/rtf',
          
          // Document formats
          'pdf': 'application/pdf',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'odt': 'application/vnd.oasis.opendocument.text',
          'epub': 'application/epub+zip',
          
          // Spreadsheet formats
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ods': 'application/vnd.oasis.opendocument.spreadsheet',
          'csv': 'text/csv',
          
          // Presentation formats
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'odp': 'application/vnd.oasis.opendocument.presentation',
          
          // Drawing formats
          'svg': 'image/svg+xml',
          'png': 'image/png',
          'jpg': 'image/jpeg'
        };

        const mimeType = exportMimeTypes[format] || exportMimeTypes['txt'];

        const exportResponse = await nango.get({
          endpoint: `/drive/v3/files/${fileId}/export`,
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params: { mimeType }
        });

        // Handle the response data properly
        let content;
        if (typeof exportResponse.data === 'string') {
          content = exportResponse.data;
        } else if (Buffer.isBuffer(exportResponse.data)) {
          content = exportResponse.data.toString('utf8');
        } else {
          content = String(exportResponse.data);
        }

        return {
          content: [{
            type: 'text',
            text: `Content of "${file.name}" (exported as ${format}):\n\n${content}`
          }]
        };
      }

      // Handle regular files
      const contentResponse = await nango.get({
        endpoint: `/drive/v3/files/${fileId}`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: { alt: 'media' },
        responseType: 'arraybuffer'
      });

      // Handle the response data properly
      let content;
      if (typeof contentResponse.data === 'string') {
        content = contentResponse.data;
      } else if (Buffer.isBuffer(contentResponse.data)) {
        content = contentResponse.data.toString('utf8');
      } else {
        content = String(contentResponse.data);
      }

      // Handle large content with chunking or truncation
      if (content.length > maxSize) {
        if (chunked) {
          // Return first chunk with info about remaining content
          const chunkSize = Math.floor(maxSize * 0.8); // Use 80% of max size for safety
          const truncatedContent = content.substring(0, chunkSize);
          const remainingLength = content.length - chunkSize;

          return {
            content: [{
              type: 'text',
              text: `Content of "${file.name}" (CHUNK 1 of large file):\n` +
                    `Total size: ${this.formatFileSize(content.length)} | Showing: ${this.formatFileSize(chunkSize)}\n` +
                    `Remaining: ${this.formatFileSize(remainingLength)}\n\n` +
                    `${truncatedContent}\n\n` +
                    `[Content continues... Use fetch_gdrive_file_to_local for complete file]`
            }]
          };
        } else {
          // Truncate content
          const truncatedContent = content.substring(0, maxSize);
          return {
            content: [{
              type: 'text',
              text: `Content of "${file.name}" (TRUNCATED):\n` +
                    `Original size: ${this.formatFileSize(content.length)} | Showing: ${this.formatFileSize(maxSize)}\n\n` +
                    `${truncatedContent}\n\n` +
                    `[Content truncated - use fetch_gdrive_file_to_local for complete file or increase maxSize parameter]`
            }]
          };
        }
      }

      return {
        content: [{
          type: 'text',
          text: `Content of "${file.name}":\n\n${content}`
        }]
      };

    } catch (error) {
      console.error('Get file content error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Could not get file content. File may not exist or you may not have permission to access it.`
        }],
        isError: true
      };
    }
  }

  async fetchGoogleDriveFileToLocal(args, workspaceId) {
    const nango = new Nango(this.nangoConfig);
    const connectionId = this.getConnectionId(workspaceId);
    const { fileId, localPath, format = 'txt' } = args;

    try {
      // Get file metadata first
      const metaResponse = await nango.get({
        endpoint: `/drive/v3/files/${fileId}`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: {
          fields: 'id,name,mimeType,size'
        }
      });

      const file = metaResponse.data;

      // Validate file size before download
      if (file.size && file.size > 5 * 1024 * 1024 * 1024) { // 5GB limit
        throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (5GB)`);
      }

      // Create directory if it doesn't exist
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let contentResponse;

      // Handle Google Workspace files
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        const exportMimeTypes = {
          // Text formats
          'txt': 'text/plain',
          'html': 'text/html',
          'rtf': 'application/rtf',
          
          // Document formats
          'pdf': 'application/pdf',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'odt': 'application/vnd.oasis.opendocument.text',
          'epub': 'application/epub+zip',
          
          // Spreadsheet formats
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'ods': 'application/vnd.oasis.opendocument.spreadsheet',
          'csv': 'text/csv',
          
          // Presentation formats
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'odp': 'application/vnd.oasis.opendocument.presentation',
          
          // Drawing formats
          'svg': 'image/svg+xml',
          'png': 'image/png',
          'jpg': 'image/jpeg'
        };

        const mimeType = exportMimeTypes[format] || exportMimeTypes['txt'];

        contentResponse = await nango.get({
          endpoint: `/drive/v3/files/${fileId}/export`,
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params: { mimeType }
        });
      } else {
        // Handle regular files
        contentResponse = await nango.get({
          endpoint: `/drive/v3/files/${fileId}`,
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params: { alt: 'media' }
        });
      }

      // Write content to local file
      if (typeof contentResponse.data === 'string') {
        fs.writeFileSync(localPath, contentResponse.data, 'utf8');
      } else if (Buffer.isBuffer(contentResponse.data)) {
        fs.writeFileSync(localPath, contentResponse.data);
      } else {
        // Handle other data types (like ArrayBuffer)
        fs.writeFileSync(localPath, Buffer.from(contentResponse.data));
      }

      const stats = fs.statSync(localPath);

      return {
        content: [{
          type: 'text',
          text: `✓ Successfully downloaded "${file.name}" to "${localPath}"\nFile size: ${this.formatFileSize(stats.size)}`
        }]
      };

    } catch (error) {
      console.error('Fetch file error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Could not download file. Please check the file ID and local path, and ensure you have permission to access the file.`
        }],
        isError: true
      };
    }
  }

  async uploadLocalFileToGoogleDrive(args, workspaceId) {
    const nango = new Nango(this.nangoConfig);
    const connectionId = this.getConnectionId(workspaceId);
    const { localPath, fileName, folderId } = args;

    try {
      // Check if local file exists
      if (!fs.existsSync(localPath)) {
        throw new Error(`Local file does not exist: ${localPath}`);
      }

      const stats = fs.statSync(localPath);
      
      // File size validation (Google Drive has a 5TB limit, but we'll set a reasonable limit)
      const maxFileSize = 5 * 1024 * 1024 * 1024; // 5GB
      if (stats.size > maxFileSize) {
        throw new Error(`File size (${this.formatFileSize(stats.size)}) exceeds maximum allowed size (${this.formatFileSize(maxFileSize)})`);
      }
      
      // Check if file is empty
      if (stats.size === 0) {
        throw new Error('Cannot upload empty files');
      }
      
      const fileContent = fs.readFileSync(localPath);
      const actualFileName = fileName || path.basename(localPath);
      
      // Validate file name
      if (!actualFileName || actualFileName.trim() === '') {
        throw new Error('File name cannot be empty');
      }

      // Create metadata
      const metadata = {
        name: actualFileName
      };

      if (folderId) {
        metadata.parents = [folderId];
      }

      // Create multipart upload request
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      // Handle binary files properly
      const mimeType = this.getMimeType(localPath);
      const isTextFile = this.isTextMimeType(mimeType);
      
      let multipartRequestBody;
      if (isTextFile) {
        // For text files, convert to string
        multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n` +
          fileContent.toString('utf8') +
          close_delim;
      } else {
        // For binary files, use Buffer directly
        const metadataPart = Buffer.from(
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          `Content-Type: ${mimeType}\r\n\r\n`
        );
        
        const endPart = Buffer.from(close_delim);
        
        multipartRequestBody = Buffer.concat([metadataPart, fileContent, endPart]);
      }

      const uploadResponse = await nango.post({
        endpoint: '/upload/drive/v3/files',
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: { uploadType: 'multipart' },
        data: multipartRequestBody,
        headers: {
          'Content-Type': `multipart/related; boundary="${boundary}"`
        }
      });

      return {
        content: [{
          type: 'text',
          text: `✓ Successfully uploaded "${actualFileName}" to Google Drive\nFile ID: ${uploadResponse.data.id}\nSize: ${this.formatFileSize(stats.size)}\nLink: ${uploadResponse.data.webViewLink || 'N/A'}`
        }]
      };

    } catch (error) {
      console.error('Upload file error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Could not upload file. Please check the local file path and ensure you have permission to upload to Google Drive.`
        }],
        isError: true
      };
    }
  }

  async searchGoogleDriveFiles(args, workspaceId) {
    const nango = new Nango(this.nangoConfig);
    const connectionId = this.getConnectionId(workspaceId);
    const { fileName, mimeType, folderId, limit = 10 } = args;

    try {
      let endpoint = '/drive/v3/files';
      const params = {
        pageSize: limit,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink)'
      };

      // Build search query
      let query = `name contains '${fileName}' and trashed = false`;
      
      // Add folder filter if specified
      if (folderId) {
        query += ` and '${folderId}' in parents`;
      }

      // Add MIME type filter if specified
      if (mimeType) {
        query += ` and mimeType = '${mimeType}'`;
      }

      params.q = query;

      const response = await nango.get({
        endpoint,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params
      });

      const files = response.data?.files || [];

      if (files.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `No files found matching "${fileName}". Please check the filename and try again.`
          }]
        };
      }

      const formatted = files.map((file, i) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const icon = isFolder ? '📁' : '📄';
        const size = file.size ? `(${this.formatFileSize(file.size)})` : '';
        const modified = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '';

        return `${i + 1}. ${icon} ${file.name} ${size}\n   ID: ${file.id}\n   Type: ${isFolder ? 'Folder' : file.mimeType}\n   Modified: ${modified}\n   Link: ${file.webViewLink || 'N/A'}`;
      }).join('\n\n');

      return {
        content: [{
          type: 'text',
          text: `Found ${files.length} file(s) matching "${fileName}":\n\n${formatted}\n\n💡 Use the file ID (not the name) with other Google Drive tools.`
        }]
      };
    } catch (error) {
      console.error('Search files error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Could not search Google Drive files. Please check your connection and try again.`
        }],
        isError: true
      };
    }
  }

  async convertDocumentToText(args, workspaceId) {
    const nango = new Nango(this.nangoConfig);
    const connectionId = this.getConnectionId(workspaceId);
    const { fileId, preserveFormatting = true, maxLength = 50000 } = args;

    try {
      // First get file metadata to determine file type
      const metaResponse = await nango.get({
        endpoint: `/drive/v3/files/${fileId}`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: {
          fields: 'id,name,mimeType,size'
        }
      });

      const file = metaResponse.data;
      const fileName = file.name;
      const mimeType = file.mimeType;

      console.error(`[convert_document_to_text] Converting ${fileName} (${mimeType})`);

      let textContent = '';

      // Handle Google Workspace files (Docs, Sheets, etc.)
      if (mimeType.startsWith('application/vnd.google-apps.')) {
        const exportMimeTypes = {
          'application/vnd.google-apps.document': 'text/plain',
          'application/vnd.google-apps.spreadsheet': 'text/csv',
          'application/vnd.google-apps.presentation': 'text/plain',
          'application/vnd.google-apps.drawing': 'text/plain'
        };

        const exportMimeType = exportMimeTypes[mimeType] || 'text/plain';

        const exportResponse = await nango.get({
          endpoint: `/drive/v3/files/${fileId}/export`,
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params: { mimeType: exportMimeType }
        });

        textContent = exportResponse.data || '';
      }
      // Handle PDF files
      else if (mimeType === 'application/pdf') {
        // For PDFs, we'll export as text/plain which Google Drive supports
        try {
          const exportResponse = await nango.get({
            endpoint: `/drive/v3/files/${fileId}/export`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { mimeType: 'text/plain' }
          });
          textContent = exportResponse.data || '';
        } catch (exportError) {
          // If export fails, try to get the raw content
          const contentResponse = await nango.get({
            endpoint: `/drive/v3/files/${fileId}`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { alt: 'media' }
          });
          
          // For PDFs, we can't easily extract text without a PDF parser
          // Return a message indicating the limitation
          textContent = `[PDF File: ${fileName}]\n\nThis is a PDF file. To extract text content, please download the file and use a PDF text extraction tool. The file contains ${file.size ? this.formatFileSize(file.size) : 'unknown size'} of data.`;
        }
      }
      // Handle DOCX files
      else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Export DOCX as plain text
        try {
          const exportResponse = await nango.get({
            endpoint: `/drive/v3/files/${fileId}/export`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { mimeType: 'text/plain' }
          });
          textContent = exportResponse.data || '';
        } catch (exportError) {
          // If export fails, try alternative formats
          try {
            const exportResponse = await nango.get({
              endpoint: `/drive/v3/files/${fileId}/export`,
              connectionId,
              providerConfigKey: this.nangoConfig.providerConfigKey,
              params: { mimeType: 'text/html' }
            });
            textContent = exportResponse.data || '';
          } catch (htmlError) {
            textContent = `[DOCX File: ${fileName}]\n\nUnable to extract text from this DOCX file. Please try downloading the file and opening it with a word processor.`;
          }
        }
      }
      // Handle other document types
      else if (mimeType.includes('document') || mimeType.includes('text')) {
        try {
          const exportResponse = await nango.get({
            endpoint: `/drive/v3/files/${fileId}/export`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { mimeType: 'text/plain' }
          });
          textContent = exportResponse.data || '';
        } catch (exportError) {
          // Try to get raw content
          const contentResponse = await nango.get({
            endpoint: `/drive/v3/files/${fileId}`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { alt: 'media' }
          });
          textContent = contentResponse.data || '';
        }
      }
      else {
        return {
          content: [{
            type: 'text',
            text: `Unsupported file type: ${mimeType}\n\nFile: ${fileName}\nType: ${mimeType}\n\nThis function only supports PDF, DOCX, and Google Workspace documents.`
          }]
        };
      }

      // Clean and format the text
      let cleanedText = this.cleanTextContent(textContent, preserveFormatting);

      // Truncate if too long
      if (cleanedText.length > maxLength) {
        cleanedText = cleanedText.substring(0, maxLength) + '\n\n[Content truncated - file is longer than ' + maxLength + ' characters]';
      }

      // Add file information header
      const header = `📄 Document Content: ${fileName}\n` +
                    `📋 Type: ${mimeType}\n` +
                    `📏 Size: ${file.size ? this.formatFileSize(file.size) : 'Unknown'}\n` +
                    `📝 Extracted Text Length: ${cleanedText.length} characters\n\n` +
                    '─'.repeat(50) + '\n\n';

      return {
        content: [{
          type: 'text',
          text: header + cleanedText
        }]
      };

    } catch (error) {
      console.error('Convert document error:', error.response?.data || error.message);
      return {
        content: [{
          type: 'text',
          text: `Could not convert document to text. Error: ${error.message}\n\nPlease ensure the file exists and you have permission to access it.`
        }],
        isError: true
      };
    }
  }

  cleanTextContent(text, preserveFormatting = true) {
    if (!text) return '';

    let cleaned = text;

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\r\n/g, '\n');
    cleaned = cleaned.replace(/\r/g, '\n');
    
    // Remove HTML tags if present
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    cleaned = cleaned.replace(/&nbsp;/g, ' ');
    cleaned = cleaned.replace(/&amp;/g, '&');
    cleaned = cleaned.replace(/&lt;/g, '<');
    cleaned = cleaned.replace(/&gt;/g, '>');
    cleaned = cleaned.replace(/&quot;/g, '"');
    cleaned = cleaned.replace(/&#39;/g, "'");
    
    if (preserveFormatting) {
      // Preserve paragraph breaks
      cleaned = cleaned.replace(/\n\s*\n/g, '\n\n');
      // Remove excessive line breaks but keep paragraphs
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    } else {
      // Remove all line breaks and normalize spaces
      cleaned = cleaned.replace(/\s+/g, ' ');
    }
    
    // Remove leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // Remove control characters except newlines and tabs
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return cleaned;
  }

  formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  isTextMimeType(mimeType) {
    const textMimeTypes = [
      'text/',
      'application/json',
      'application/xml',
      'application/javascript',
      'application/typescript',
      'application/x-httpd-php',
      'application/sql',
      'application/x-python',
      'application/x-java-source',
      'application/x-c++src',
      'application/x-csrc',
      'application/x-chdr',
      'application/x-ruby',
      'application/x-go',
      'application/x-rust',
      'application/x-swift',
      'application/x-kotlin',
      'application/x-scala',
      'application/yaml',
      'application/markdown'
    ];
    
    return textMimeTypes.some(textType => mimeType.startsWith(textType));
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      // Text files
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.csv': 'text/csv',
      '.xml': 'text/xml',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.json': 'application/json',
      '.yaml': 'text/yaml',
      '.yml': 'text/yaml',
      
      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.odt': 'application/vnd.oasis.opendocument.text',
      '.rtf': 'application/rtf',
      
      // Spreadsheets
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
      '.csv': 'text/csv',
      
      // Presentations
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.odp': 'application/vnd.oasis.opendocument.presentation',
      
      // Images
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.tiff': 'image/tiff',
      '.ico': 'image/x-icon',
      
      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.aac': 'audio/aac',
      
      // Video
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',
      
      // Archives
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      
      // Code files
      '.py': 'text/x-python',
      '.java': 'text/x-java-source',
      '.cpp': 'text/x-c++src',
      '.c': 'text/x-csrc',
      '.h': 'text/x-chdr',
      '.php': 'application/x-httpd-php',
      '.rb': 'text/x-ruby',
      '.go': 'text/x-go',
      '.rs': 'text/x-rust',
      '.swift': 'text/x-swift',
      '.kt': 'text/x-kotlin',
      '.scala': 'text/x-scala',
      
      // Database
      '.sql': 'application/sql',
      '.db': 'application/x-sqlite3',
      '.sqlite': 'application/x-sqlite3',
      
      // Other
      '.exe': 'application/x-msdownload',
      '.dmg': 'application/x-apple-diskimage',
      '.iso': 'application/x-iso9660-image',
      '.bin': 'application/octet-stream',
      '.dat': 'application/octet-stream'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Google Drive MCP Tools Server started');
  }
}

if (require.main === module) {
  const server = new GoogleDriveMCPTools();
  server.start().catch(error => {
    console.error('Failed to start Google Drive MCP Tools server:', error);
    process.exit(1);
  });
}

module.exports = GoogleDriveMCPTools;