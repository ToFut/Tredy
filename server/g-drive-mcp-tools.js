#!/usr/bin/env node

/**
 * Google Drive MCP Tools
 * Comprehensive Google Drive integration with local filesystem operations
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
      console.log(`[GoogleDriveMCP] Loading environment from: ${envFile}`);
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
              folderId: { type: 'string', description: 'Google Drive folder ID to list contents of (optional, defaults to root)' },
              limit: { type: 'number', description: 'Maximum number of files to return (default: 50)', default: 50 },
              query: { type: 'string', description: 'Search query to filter files (optional)' }
            }
          }
        },
        {
          name: 'get_gdrive_file_content',
          description: 'STEP 2: Get the actual content of a Google Drive file. Use this AFTER getting the file ID from search_gdrive_files. Supports all file types including text files, Google Docs, Sheets, etc. CRITICAL: You MUST have the actual Google Drive file ID (NOT the filename). Handles large files with size limits and chunking.',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: { type: 'string', description: 'REQUIRED: The Google Drive file ID returned from search_gdrive_files (looks like "1SSpDJcLuNymglZzLDnt1zVSaAYX5S_mb"). This is NOT the filename - it is the unique Google Drive identifier.' },
              format: { type: 'string', description: 'Optional: Export format for Google Workspace files (txt, html, pdf, docx, etc). Default is txt.', default: 'txt' },
              maxSize: { type: 'number', description: 'Optional: Maximum content size in bytes (default: 50MB). Larger files will be truncated or chunked.', default: 52428800 },
              chunked: { type: 'boolean', description: 'Optional: For large files, return first chunk with info instead of truncating (default: false).', default: false }
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
              fileId: { type: 'string', description: 'Google Drive file ID (long string like 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms) - NOT the filename. Use search_gdrive_files to find the ID.' },
              localPath: { type: 'string', description: 'Local file path where to save the file' },
              format: { type: 'string', description: 'Export format for Google Workspace files. Options: txt, html, rtf, pdf, docx, odt, epub, xlsx, ods, csv, pptx, odp, svg, png, jpg', default: 'txt' }
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
              localPath: { type: 'string', description: 'Local file path to upload (supports all file types)' },
              fileName: { type: 'string', description: 'Name for the file in Google Drive (optional, uses local filename if not provided)' },
              folderId: { type: 'string', description: 'Google Drive folder ID to upload to (optional, uploads to root if not provided)' }
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
              fileName: { type: 'string', description: 'REQUIRED: Exact or partial filename to search for (e.g. "ex2_q4.c.txt")' },
              mimeType: { type: 'string', description: 'Optional: MIME type filter (e.g., "text/plain" for .txt files)' },
              folderId: { type: 'string', description: 'Optional: Folder ID to search within (searches entire drive if not provided)' },
              limit: { type: 'number', description: 'Optional: Maximum results (default: 10)', default: 10 }
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
              fileId: { type: 'string', description: 'Google Drive file ID (long string like 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms) - NOT the filename. Use search_gdrive_files to find the ID.' },
              preserveFormatting: { type: 'boolean', description: 'Whether to preserve basic formatting like paragraphs and line breaks (default: true)', default: true },
              maxLength: { type: 'number', description: 'Maximum length of extracted text in characters (default: 50000)', default: 50000 }
            },
            required: ['fileId']
          }
        },
        {
          name: 'get_gdrive_file_content_by_name',
          description: 'Get the content of a Google Drive file by its name. Searches for the file and returns content if a single match is found.',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: { type: 'string', description: 'REQUIRED: The exact or partial filename to search for.' }
            },
            required: ['fileName']
          }
        },
        {
          name: 'sync_all_drive_files_to_local_vectors',
          description: 'Fetches all files from Google Drive and saves them to a local directory for vector processing.',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'create_gdrive_folder',
          description: 'Create a new folder in Google Drive. Use when user wants to organize files or create directory structure.',
          inputSchema: {
            type: 'object',
            properties: {
              folderName: { type: 'string', description: 'REQUIRED: Name of the new folder to create' },
              parentFolderId: { type: 'string', description: 'Optional: Parent folder ID where to create the new folder (creates in root if not provided)' }
            },
            required: ['folderName']
          }
        },
        {
          name: 'create_gdrive_file',
          description: 'Create a new text file in Google Drive with specified content. Use when user wants to create documents or text files.',
          inputSchema: {
            type: 'object',
            properties: {
              fileName: { type: 'string', description: 'REQUIRED: Name of the new file to create (should include extension like .txt, .md, etc.)' },
              content: { type: 'string', description: 'REQUIRED: Text content to write to the file' },
              folderId: { type: 'string', description: 'Optional: Folder ID where to create the file (creates in root if not provided)' },
              mimeType: { type: 'string', description: 'Optional: MIME type of the file (default: text/plain)', default: 'text/plain' }
            },
            required: ['fileName', 'content']
          }
        },
        {
          name: 'create_vector_embeddings_from_gdrive',
          description: 'Extract content from all Google Drive files and save as vector embeddings in local storage for semantic search. Processes text files, documents, PDFs, and Google Workspace files.',
          inputSchema: {
            type: 'object',
            properties: {
              outputPath: { type: 'string', description: 'Optional: Custom output directory path (default: server/storage/documents)', default: 'server/storage/documents' },
              includeMetadata: { type: 'boolean', description: 'Optional: Include file metadata in embeddings (default: true)', default: true },
              chunkSize: { type: 'number', description: 'Optional: Text chunk size for embeddings (default: 1000)', default: 1000 },
              skipLargeFiles: { type: 'boolean', description: 'Optional: Skip files larger than 50MB (default: true)', default: true }
            }
          }
        },
        {
          name: 'get_gdrive_file_with_auto_save',
          description: 'Get Google Drive file content AND automatically save it to local vector storage. This is the preferred method when you want both file content AND automatic local saving for vector embeddings. Use this instead of get_gdrive_file_content when you want to ensure the file is saved locally.',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: { type: 'string', description: 'REQUIRED: The Google Drive file ID returned from search_gdrive_files' },
              format: { type: 'string', description: 'Optional: Export format for Google Workspace files (txt, html, pdf, docx, etc). Default is txt.', default: 'txt' },
              saveToVectors: { type: 'boolean', description: 'Optional: Force save to vector storage even if auto-save fails (default: true)', default: true },
              workspaceId: { type: 'string', description: 'Optional: Specific workspace ID for saving (uses detected workspace if not provided)' }
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
          case 'list_gdrive_files': return await this.listGoogleDriveFiles(args, workspaceId);
          case 'get_gdrive_file_content': return await this.getGoogleDriveFileContent(args, workspaceId);
          case 'fetch_gdrive_file_to_local': return await this.fetchGoogleDriveFileToLocal(args, workspaceId);
          case 'upload_local_file_to_gdrive': return await this.uploadLocalFileToGoogleDrive(args, workspaceId);
          case 'search_gdrive_files': return await this.searchGoogleDriveFiles(args, workspaceId);
          case 'convert_document_to_text': return await this.convertDocumentToText(args, workspaceId);
          case 'get_gdrive_file_content_by_name': return await this.getGoogleDriveFileContentByName(args, workspaceId);
          case 'sync_all_drive_files_to_local_vectors': return await this.syncAllDriveFilesToLocalVectors(args, workspaceId);
          case 'create_gdrive_folder': return await this.createGoogleDriveFolder(args, workspaceId);
          case 'create_gdrive_file': return await this.createGoogleDriveFile(args, workspaceId);
          case 'create_vector_embeddings_from_gdrive': return await this.createVectorEmbeddingsFromGoogleDrive(args, workspaceId);
          case 'get_gdrive_file_with_auto_save': return await this.getGoogleDriveFileWithAutoSave(args, workspaceId);
          default: throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return buildNangoError(error, `execute tool ${name}`);
      }
    });
  }

  // =========== Public Tool Methods ===========

  async listGoogleDriveFiles(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { folderId, limit = 50, query } = args;

    try {
      const params = {
        pageSize: limit,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink)'
      };
      let q = ['trashed = false']; // Only show non-trashed files
      if (folderId) q.push(`'${folderId}' in parents`);
      if (query) q.push(`name contains '${query}'`);
      params.q = q.join(' and ');

      const response = await this.nango.get({
        endpoint: '/drive/v3/files',
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params
      });

      const files = response.data?.files || [];

      if (files.length === 0) {
        const location = folderId ? 'in the specified folder' : 'in Google Drive root directory';
        const searchInfo = query ? ` matching "${query}"` : '';
        return {
          content: [{
            type: 'text',
            text: `📭 NO FILES FOUND
🔍 Search: No files found${searchInfo} ${location}
📁 Location: ${folderId ? `Folder ID: ${folderId}` : 'Root Directory'}

💡 Tips:
• Check if the folder ID is correct
• Try a different search query
• Use create_gdrive_folder or create_gdrive_file to add content
• Use upload_local_file_to_gdrive to upload files`
          }]
        };
      }

      // Sort files: folders first, then by name
      files.sort((a, b) => {
        const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
        const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
        if (aIsFolder && !bIsFolder) return -1;
        if (!aIsFolder && bIsFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      const location = folderId ? 'folder' : 'root directory';
      const searchInfo = query ? ` (filtered by "${query}")` : '';
      const title = `📁 GOOGLE DRIVE CONTENTS - ${location.toUpperCase()}${searchInfo}`;

      return this._formatFileList(files, title);
    } catch (error) {
      return buildNangoError(error, 'list Google Drive files');
    }
  }

  async getGoogleDriveFileContent(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { fileId, format = 'txt', maxSize = 50 * 1024 * 1024, chunked = false } = args;

    try {
      const metaResponse = await this._getFileMetadata(fileId, connectionId);
      const file = metaResponse.data;

      const fileSize = parseInt(file.size) || 0;
      if (fileSize > maxSize) {
        return { content: [{ type: 'text', text: `⚠️ File "${file.name}" is too large (${this.formatFileSize(fileSize)}). Max size: ${this.formatFileSize(maxSize)}.` }] };
      }

      if (file.mimeType === 'application/vnd.google-apps.folder') {
        const folderContents = await this.listGoogleDriveFiles({ folderId: fileId }, workspaceId);
        folderContents.content[0].text = `Folder "${file.name}" contains:\n` + folderContents.content[0].text;
        return folderContents;
      }

      // Enhanced Google Workspace file handling
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        try {
          const exportResponse = await this._exportGoogleWorkspaceFile(fileId, format, connectionId);
          let content = Buffer.isBuffer(exportResponse.data) ? exportResponse.data.toString('utf8') : String(exportResponse.data);
          content = this.cleanTextContent(content);

          // Save as vector embedding locally
          try {
            await this._saveFileAsVectorDocument(file, content, workspaceId, 'google_workspace');
          } catch (saveError) {
            console.error(`[GoogleDrive] Failed to save vector document for ${file.name}:`, saveError.message);
          }

          const largeContentResponse = this._handleLargeContent(content, file.name, maxSize, chunked, `exported as ${format}`);
          if (largeContentResponse) return largeContentResponse;

          return { content: [{ type: 'text', text: `Content of "${file.name}" (exported as ${format}):\n\n${content}` }] };
        } catch (exportError) {
          console.error(`Failed to export Google Workspace file ${file.name}:`, exportError.message);
          return { content: [{ type: 'text', text: `⚠️ Could not export "${file.name}" as ${format}. Error: ${exportError.message}` }] };
        }
      }

      // Enhanced PDF and DOCX handling
      if (file.mimeType === 'application/pdf' || file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          // Try to get text content first by downloading and using Google Drive's text extraction
          const contentResponse = await this.nango.get({
            endpoint: `/drive/v3/files/${fileId}`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { alt: 'media' }
          });

          // For PDF files, try to extract text using Google Drive's conversion
          if (file.mimeType === 'application/pdf') {
            try {
              const exportResponse = await this._exportGoogleWorkspaceFile(fileId, 'txt', connectionId);
              let content = this.cleanTextContent(String(exportResponse.data));

              // Save as vector embedding locally
              try {
                await this._saveFileAsVectorDocument(file, content, workspaceId, 'pdf');
              } catch (saveError) {
                console.error(`[GoogleDrive] Failed to save vector document for ${file.name}:`, saveError.message);
              }

              const largeContentResponse = this._handleLargeContent(content, file.name, maxSize, chunked, 'converted to text');
              if (largeContentResponse) return largeContentResponse;
              return { content: [{ type: 'text', text: `Content of "${file.name}" (converted to text):\n\n${content}` }] };
            } catch (pdfError) {
              return { content: [{ type: 'text', text: `File "${file.name}" is a PDF file but text extraction failed: ${pdfError.message}. Use 'fetch_gdrive_file_to_local' to download it.` }] };
            }
          }

          return { content: [{ type: 'text', text: `File "${file.name}" is a binary document. Use 'fetch_gdrive_file_to_local' to download it or try 'convert_document_to_text' for text extraction.` }] };
        } catch (error) {
          return { content: [{ type: 'text', text: `File "${file.name}" could not be processed: ${error.message}. Use 'fetch_gdrive_file_to_local' to download it.` }] };
        }
      }

      // Handle regular text files
      if (this.isTextMimeType(file.mimeType)) {
        try {
          const contentResponse = await this.nango.get({
            endpoint: `/drive/v3/files/${fileId}`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { alt: 'media' }
          });
          let content = String(contentResponse.data);
          content = this.cleanTextContent(content);

          // Save as vector embedding locally
          try {
            await this._saveFileAsVectorDocument(file, content, workspaceId, 'text');
          } catch (saveError) {
            console.error(`[GoogleDrive] Failed to save vector document for ${file.name}:`, saveError.message);
          }

          const largeContentResponse = this._handleLargeContent(content, file.name, maxSize, chunked);
          if (largeContentResponse) return largeContentResponse;

          return { content: [{ type: 'text', text: `Content of "${file.name}":\n\n${content}` }] };
        } catch (textError) {
          return { content: [{ type: 'text', text: `Failed to retrieve content from "${file.name}": ${textError.message}` }] };
        }
      }

      // Binary files that can't be processed as text
      return { content: [{ type: 'text', text: `File "${file.name}" is a binary format (${file.mimeType}) and cannot be displayed as text. Use 'fetch_gdrive_file_to_local' to download it.` }] };
    } catch (error) {
      return buildNangoError(error, 'get file content');
    }
  }

  async fetchGoogleDriveFileToLocal(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { fileId, localPath, format = 'txt' } = args;

    try {
      const metaResponse = await this._getFileMetadata(fileId, connectionId, 'id,name,mimeType,size');
      const file = metaResponse.data;

      if (file.size && file.size > 50 * 1024 * 1024) { 
        throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds 300mb limit`);
      }

      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      let contentResponse;
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        contentResponse = await this._exportGoogleWorkspaceFile(fileId, format, connectionId);
      } else {
        contentResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${fileId}`, connectionId, providerConfigKey: this.nangoConfig.providerConfigKey, params: { alt: 'media' }
        });
      }

      const buffer = Buffer.isBuffer(contentResponse.data) ? contentResponse.data : Buffer.from(contentResponse.data);
      fs.writeFileSync(localPath, buffer);

      const stats = fs.statSync(localPath);
      return { content: [{ type: 'text', text: `✓ Successfully downloaded "${file.name}" to "${localPath}" (${this.formatFileSize(stats.size)})` }] };
    } catch (error) {
      return buildNangoError(error, 'download file');
    }
  }

  async uploadLocalFileToGoogleDrive(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { localPath, fileName, folderId } = args;

    try {
      if (!fs.existsSync(localPath)) throw new Error(`Local file does not exist: ${localPath}`);
      
      const stats = fs.statSync(localPath);
      if (stats.size > 5 * 1024 * 1024 * 1024) throw new Error(`File size exceeds 5GB limit`);
      if (stats.size === 0) throw new Error('Cannot upload empty files');
      
      const fileContent = fs.readFileSync(localPath);
      const actualFileName = fileName || path.basename(localPath);
      if (!actualFileName || actualFileName.trim() === '') throw new Error('File name cannot be empty');

      const metadata = { name: actualFileName };
      if (folderId) metadata.parents = [folderId];

      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";
      const mimeType = this.getMimeType(localPath);

      const metadataPart = Buffer.from(delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + `Content-Type: ${mimeType}\r\n\r\n`);
      const endPart = Buffer.from(close_delim);
      const multipartRequestBody = Buffer.concat([metadataPart, fileContent, endPart]);

      const uploadResponse = await this.nango.post({
        endpoint: '/upload/drive/v3/files',
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: { uploadType: 'multipart' },
        data: multipartRequestBody,
        headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` }
      });

      return { content: [{ type: 'text', text: `✓ Successfully uploaded "${actualFileName}" to Google Drive\nFile ID: ${uploadResponse.data.id}` }] };
    } catch (error) {
      return buildNangoError(error, 'upload file');
    }
  }

  async searchGoogleDriveFiles(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { fileName, mimeType, folderId, limit = 10 } = args;

    try {
      const params = {
        pageSize: limit,
        fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink)'
      };
      
      let q = [`name contains '${fileName}'`, 'trashed = false'];
      if (folderId) q.push(`'${folderId}' in parents`);
      if (mimeType) q.push(`mimeType = '${mimeType}'`);
      params.q = q.join(' and ');

      const response = await this.nango.get({
        endpoint: '/drive/v3/files',
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params
      });

      const files = response.data?.files || [];
      if (files.length === 0) {
        return { content: [{ type: 'text', text: `No files found matching "${fileName}".` }] };
      }

      const title = `Found ${files.length} file(s) matching "${fileName}":`;
      const formatted = this._formatFileList(files, title);
      formatted.content[0].text += `\n\n💡 Use the file ID (not the name) with other Google Drive tools.`;
      return formatted;
    } catch (error) {
      return buildNangoError(error, 'search Google Drive files');
    }
  }

  async convertDocumentToText(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { fileId, preserveFormatting = true, maxLength = 50000 } = args;

    try {
      const metaResponse = await this._getFileMetadata(fileId, connectionId, 'id,name,mimeType,size');
      const file = metaResponse.data;

      let textContent = '';
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        const format = file.mimeType === 'application/vnd.google-apps.spreadsheet' ? 'csv' : 'txt';
        const exportResponse = await this._exportGoogleWorkspaceFile(fileId, format, connectionId);
        textContent = String(exportResponse.data);
      } else if (file.mimeType === 'application/pdf' || file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const exportResponse = await this._exportGoogleWorkspaceFile(fileId, 'txt', connectionId);
        textContent = String(exportResponse.data);
      } else if (this.isTextMimeType(file.mimeType)) {
        const contentResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${fileId}`, connectionId, providerConfigKey: this.nangoConfig.providerConfigKey, params: { alt: 'media' }
        });
        textContent = String(contentResponse.data);
      } else {
        return { content: [{ type: 'text', text: `Unsupported file type for text conversion: ${file.mimeType}` }] };
      }

      let cleanedText = this.cleanTextContent(textContent, preserveFormatting);
      if (cleanedText.length > maxLength) {
        cleanedText = cleanedText.substring(0, maxLength) + '\n\n[Content truncated]';
      }

      const header = `📄 Document Content: ${file.name}\n📏 Size: ${this.formatFileSize(file.size)}\n\n` + '─'.repeat(50) + '\n\n';
      return { content: [{ type: 'text', text: header + cleanedText }] };
    } catch (error) {
      return buildNangoError(error, 'convert document to text');
    }
  }

  async getGoogleDriveFileContentByName(args, workspaceId) {
    const { fileName } = args;
    const searchResult = await this.searchGoogleDriveFiles({ fileName, limit: 2 }, workspaceId);

    if (searchResult.isError) return searchResult;

    const searchResultText = searchResult.content[0].text;
    const fileMatches = [...searchResultText.matchAll(/ID: (\S+)/g)];

    if (fileMatches.length === 0) return { content: [{ type: 'text', text: `No file found with name "${fileName}".` }], isError: true };
    if (fileMatches.length > 1) return { content: [{ type: 'text', text: `Multiple files found with name "${fileName}". Please be more specific or use the file ID.` }], isError: true };

    const fileId = fileMatches[0][1];
    return await this.getGoogleDriveFileContent({ fileId }, workspaceId);
  }

  async syncAllDriveFilesToLocalVectors(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const googleDriveFolderPath = this._getWorkspaceStoragePath(workspaceId);

    if (!fs.existsSync(googleDriveFolderPath)) {
      fs.mkdirSync(googleDriveFolderPath, { recursive: true });
    }

    let allFiles = [];
    let nextPageToken = null;
    let filesProcessed = 0;
    let skippedFiles = 0;
    let errorFiles = 0;
    let totalSize = 0;

    try {
      console.log(`[GoogleDrive] Starting sync for workspace ${workspaceId}...`);

      // Get all files from Google Drive
      do {
        const params = {
          pageSize: 100,
          fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink)',
          q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'"
        };
        if (nextPageToken) params.pageToken = nextPageToken;

        const response = await this.nango.get({
          endpoint: '/drive/v3/files',
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params
        });

        const files = response.data?.files || [];
        allFiles = allFiles.concat(files);
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      console.log(`[GoogleDrive] Found ${allFiles.length} files to process`);

      // Process each file
      for (const file of allFiles) {
        try {
          const fileSize = parseInt(file.size) || 0;

          // Skip very large files (over 50MB)
          if (fileSize > 50 * 1024 * 1024) {
            console.log(`[GoogleDrive] Skipping large file: ${file.name} (${this.formatFileSize(fileSize)})`);
            skippedFiles++;
            continue;
          }

          let content = '';

          // Extract content based on file type
          if (file.mimeType.startsWith('application/vnd.google-apps.')) {
            try {
              const exportResponse = await this._exportGoogleWorkspaceFile(file.id, 'txt', connectionId);
              content = this.cleanTextContent(String(exportResponse.data));
            } catch (exportError) {
              console.log(`[GoogleDrive] Could not export ${file.name}: ${exportError.message}`);
              errorFiles++;
              continue;
            }
          } else if (this.isTextMimeType(file.mimeType)) {
            try {
              const contentResponse = await this.nango.get({
                endpoint: `/drive/v3/files/${file.id}`,
                connectionId,
                providerConfigKey: this.nangoConfig.providerConfigKey,
                params: { alt: 'media' }
              });
              content = this.cleanTextContent(String(contentResponse.data));
            } catch (contentError) {
              console.log(`[GoogleDrive] Could not get content for ${file.name}: ${contentError.message}`);
              errorFiles++;
              continue;
            }
          } else if (file.mimeType === 'application/pdf') {
            try {
              const exportResponse = await this._exportGoogleWorkspaceFile(file.id, 'txt', connectionId);
              content = this.cleanTextContent(String(exportResponse.data));
            } catch (extractError) {
              console.log(`[GoogleDrive] Could not extract text from PDF ${file.name}: ${extractError.message}`);
              errorFiles++;
              continue;
            }
          } else {
            console.log(`[GoogleDrive] Skipping binary file: ${file.name} (${file.mimeType})`);
            skippedFiles++;
            continue;
          }

          if (!content || content.trim().length === 0) {
            console.log(`[GoogleDrive] Skipping empty file: ${file.name}`);
            skippedFiles++;
            continue;
          }

          // Save as AnythingLLM document
          await this._saveFileAsVectorDocument(file, content, workspaceId, this._getFileTypeFromMime(file.mimeType));

          filesProcessed++;
          totalSize += fileSize;
          console.log(`[GoogleDrive] ✅ Processed: ${file.name}`);

        } catch (error) {
          console.error(`[GoogleDrive] ❌ Error processing file ${file.name}:`, error.message);
          errorFiles++;
        }
      }

      const summary = `🎯 SYNC COMPLETE FOR WORKSPACE ${workspaceId}

📊 PROCESSING SUMMARY:
✅ Successfully processed: ${filesProcessed} files
⏭️  Skipped files: ${skippedFiles} files
❌ Error files: ${errorFiles} files
📁 Total files found: ${allFiles.length} files
📏 Total content size: ${this.formatFileSize(totalSize)}

📂 STORAGE LOCATION:
${googleDriveFolderPath}

💡 FILES SAVED IN ANYTHINGLLM FORMAT:
• Each file saved as JSON with 'pageContent' field in put_here directory
• Files are now available for vector embedding
• Documents can be added to workspaces for chat
• All files from all workspaces are saved in the same put_here folder`;

      return { content: [{ type: 'text', text: summary }] };
    } catch (error) {
      return buildNangoError(error, 'sync all files from Google Drive');
    }
  }

  async createGoogleDriveFolder(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { folderName, parentFolderId } = args;

    try {
      if (!folderName || folderName.trim() === '') {
        throw new Error('Folder name cannot be empty');
      }

      const metadata = {
        name: folderName.trim(),
        mimeType: 'application/vnd.google-apps.folder'
      };

      if (parentFolderId) {
        metadata.parents = [parentFolderId];
      }

      const response = await this.nango.post({
        endpoint: '/drive/v3/files',
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        data: metadata,
        headers: { 'Content-Type': 'application/json' }
      });

      const folder = response.data;
      const location = parentFolderId ? 'in specified parent folder' : 'in root directory';

      return {
        content: [{
          type: 'text',
          text: `✅ Successfully created folder "${folder.name}" ${location}\n📁 Folder ID: ${folder.id}\n🔗 Link: https://drive.google.com/drive/folders/${folder.id}`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'create Google Drive folder');
    }
  }

  async createGoogleDriveFile(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { fileName, content, folderId, mimeType = 'text/plain' } = args;

    try {
      if (!fileName || fileName.trim() === '') {
        throw new Error('File name cannot be empty');
      }
      if (content === undefined || content === null) {
        throw new Error('File content cannot be null or undefined');
      }

      const metadata = {
        name: fileName.trim()
      };

      if (folderId) {
        metadata.parents = [folderId];
      }

      // Create multipart upload
      const boundary = '-------314159265358979323846264';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadataPart = Buffer.from(
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n`
      );

      const contentPart = Buffer.from(content, 'utf8');
      const endPart = Buffer.from(close_delim);
      const multipartRequestBody = Buffer.concat([metadataPart, contentPart, endPart]);

      const response = await this.nango.post({
        endpoint: '/upload/drive/v3/files',
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: { uploadType: 'multipart' },
        data: multipartRequestBody,
        headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` }
      });

      const file = response.data;
      const location = folderId ? 'in specified folder' : 'in root directory';
      const contentPreview = content.length > 100 ? content.substring(0, 100) + '...' : content;

      return {
        content: [{
          type: 'text',
          text: `✅ Successfully created file "${file.name}" ${location}\n📄 File ID: ${file.id}\n📝 Size: ${this.formatFileSize(content.length)}\n🔗 Link: https://drive.google.com/file/d/${file.id}/view\n\n📄 Content Preview:\n${contentPreview}`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'create Google Drive file');
    }
  }

  async createVectorEmbeddingsFromGoogleDrive(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const {
      outputPath = null, // Will use workspace-specific path if not provided
      includeMetadata = true,
      chunkSize = 1000,
      skipLargeFiles = true
    } = args;

    try {
      // Use workspace-specific storage path
      const googleDriveFolderPath = outputPath || this._getWorkspaceStoragePath(workspaceId);

      // Ensure output directory exists
      if (!fs.existsSync(googleDriveFolderPath)) {
        fs.mkdirSync(googleDriveFolderPath, { recursive: true });
      }

      let allFiles = [];
      let nextPageToken = null;
      let processedFiles = 0;
      let skippedFiles = 0;
      let errorFiles = 0;
      let totalSize = 0;

      // Get all files from Google Drive
      console.log(`[GoogleDrive] 📁 Fetching all files from Google Drive for workspace ${workspaceId}...`);
      do {
        const params = {
          pageSize: 100,
          fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink)',
          q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'"
        };
        if (nextPageToken) params.pageToken = nextPageToken;

        const response = await this.nango.get({
          endpoint: '/drive/v3/files',
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params
        });

        const files = response.data?.files || [];
        allFiles = allFiles.concat(files);
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      console.log(`[GoogleDrive] 📊 Found ${allFiles.length} files to process`);

      // Process each file
      for (const file of allFiles) {
        try {
          const fileSize = parseInt(file.size) || 0;

          // Skip large files if requested
          if (skipLargeFiles && fileSize > 50 * 1024 * 1024) {
            console.log(`[GoogleDrive] ⏭️  Skipping large file: ${file.name} (${this.formatFileSize(fileSize)})`);
            skippedFiles++;
            continue;
          }

          // Get file content
          let content = '';

          // Extract content based on file type
          if (file.mimeType.startsWith('application/vnd.google-apps.')) {
            // Google Workspace files
            try {
              const exportResponse = await this._exportGoogleWorkspaceFile(file.id, 'txt', connectionId);
              content = this.cleanTextContent(String(exportResponse.data));
            } catch (exportError) {
              console.log(`[GoogleDrive] ⚠️  Could not export ${file.name}: ${exportError.message}`);
              errorFiles++;
              continue;
            }
          } else if (this.isTextMimeType(file.mimeType)) {
            // Regular text files
            try {
              const contentResponse = await this.nango.get({
                endpoint: `/drive/v3/files/${file.id}`,
                connectionId,
                providerConfigKey: this.nangoConfig.providerConfigKey,
                params: { alt: 'media' }
              });
              content = this.cleanTextContent(String(contentResponse.data));
            } catch (contentError) {
              console.log(`[GoogleDrive] ⚠️  Could not get content for ${file.name}: ${contentError.message}`);
              errorFiles++;
              continue;
            }
          } else if (file.mimeType === 'application/pdf' ||
                     file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // PDF and DOCX files - try to extract text
            try {
              const exportResponse = await this._exportGoogleWorkspaceFile(file.id, 'txt', connectionId);
              content = this.cleanTextContent(String(exportResponse.data));
            } catch (extractError) {
              console.log(`[GoogleDrive] ⚠️  Could not extract text from ${file.name}: ${extractError.message}`);
              errorFiles++;
              continue;
            }
          } else {
            console.log(`[GoogleDrive] ⏭️  Skipping binary file: ${file.name} (${file.mimeType})`);
            skippedFiles++;
            continue;
          }

          if (!content || content.trim().length === 0) {
            console.log(`[GoogleDrive] ⏭️  Skipping empty file: ${file.name}`);
            skippedFiles++;
            continue;
          }

          // Create chunks for embedding if content is large
          const chunks = chunkSize > 0 ? this._createTextChunks(content, chunkSize) : [content];

          // Save each chunk as a separate AnythingLLM document
          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const tokenCount = Math.ceil(chunk.length / 4);

            // Create AnythingLLM-compatible document
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const chunkFileName = chunks.length > 1
              ? `${file.id}_${sanitizedName}_chunk_${i + 1}_of_${chunks.length}.json`
              : `${file.id}_${sanitizedName}.json`;

            const outputFile = path.join(googleDriveFolderPath, chunkFileName);

            const anythingLLMDocument = {
              id: chunks.length > 1 ? `${file.id}_chunk_${i}` : file.id,
              url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
              title: chunks.length > 1 ? `${file.name} (chunk ${i + 1}/${chunks.length})` : file.name,
              docAuthor: 'Google Drive',
              description: `Google Drive ${this._getFileTypeFromMime(file.mimeType)} file: ${file.name}${chunks.length > 1 ? ` (chunk ${i + 1}/${chunks.length})` : ''}`,
              docSource: `Google Drive file imported via MCP tools for workspace ${workspaceId}`,
              chunkSource: `google-drive-workspace-${workspaceId}`,
              published: file.modifiedTime || file.createdTime || new Date().toISOString(),
              wordCount: chunk.split(/\s+/).length,
              pageContent: chunk,
              token_count_estimate: tokenCount,
              // Additional metadata
              mimeType: file.mimeType,
              fileSize: file.size ? parseInt(file.size) : 0,
              fileType: this._getFileTypeFromMime(file.mimeType),
              googleDriveId: file.id,
              createdTime: file.createdTime,
              modifiedTime: file.modifiedTime,
              importedAt: new Date().toISOString(),
              workspaceId: workspaceId,
              chunkIndex: chunks.length > 1 ? i : null,
              totalChunks: chunks.length > 1 ? chunks.length : null
            };

            fs.writeFileSync(outputFile, JSON.stringify(anythingLLMDocument, null, 2), 'utf8');
          }

          processedFiles++;
          totalSize += fileSize;
          console.log(`[GoogleDrive] ✅ Processed: ${file.name} (${chunks.length} ${chunks.length > 1 ? 'chunks' : 'document'})`);

        } catch (error) {
          console.error(`[GoogleDrive] ❌ Error processing file ${file.name}:`, error.message);
          errorFiles++;
        }
      }

      const summary = `🎯 VECTOR EMBEDDINGS CREATION COMPLETE FOR WORKSPACE ${workspaceId}

📊 PROCESSING SUMMARY:
✅ Successfully processed: ${processedFiles} files
⏭️  Skipped files: ${skippedFiles} files
❌ Error files: ${errorFiles} files
📁 Total files found: ${allFiles.length} files
📏 Total content size: ${this.formatFileSize(totalSize)}

📂 STORAGE LOCATION:
${googleDriveFolderPath}

💡 ANYTHINGLLM INTEGRATION:
• Documents saved in AnythingLLM-compatible format in put_here directory
• Each file has required 'pageContent' field
• Files are ready for vector database indexing
• Documents can be added to workspaces for chat
• Large files were chunked into ${chunkSize}-character segments
• All workspace files are saved in the same put_here folder

🔧 CONFIGURATION:
• Chunk size: ${chunkSize} characters
• Include metadata: ${includeMetadata}
• Skip large files: ${skipLargeFiles}
• Workspace ID: ${workspaceId}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };

    } catch (error) {
      return buildNangoError(error, 'create vector embeddings from Google Drive');
    }
  }

  async getGoogleDriveFileWithAutoSave(args, workspaceId) {
    const { fileId, format = 'txt', saveToVectors = true, workspaceId: customWorkspaceId } = args;
    const targetWorkspaceId = customWorkspaceId || workspaceId;

    console.log(`[GoogleDrive] Getting file ${fileId} with auto-save for workspace ${targetWorkspaceId}`);

    try {
      // Get the file content using the existing method
      const contentResult = await this.getGoogleDriveFileContent({ fileId, format }, targetWorkspaceId);

      if (contentResult.isError) {
        return contentResult;
      }

      // Check if save was successful by looking for the saved file
      const googleDriveFolderPath = this._getWorkspaceStoragePath(targetWorkspaceId);
      const connectionId = this.getConnectionId(targetWorkspaceId);

      try {
        const metaResponse = await this._getFileMetadata(fileId, connectionId);
        const file = metaResponse.data;
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const expectedFileName = `${fileId}_${sanitizedFileName}.json`;
        const expectedFilePath = path.join(googleDriveFolderPath, expectedFileName);

        let saveStatus = '';
        if (fs.existsSync(expectedFilePath)) {
          const stats = fs.statSync(expectedFilePath);
          const savedData = JSON.parse(fs.readFileSync(expectedFilePath, 'utf8'));
          saveStatus = `\n\n💾 AUTO-SAVE STATUS: ✅ SAVED SUCCESSFULLY
📂 Location: ${expectedFilePath}
📏 Size: ${this.formatFileSize(stats.size)}
📝 Page Content: ${savedData.pageContent.length} characters
🆔 Document ID: ${savedData.id}
⏰ Saved at: ${savedData.importedAt}
🎯 Workspace: ${savedData.workspaceId}

💡 This file is now available for vector embedding and semantic search in AnythingLLM!`;
        } else {
          saveStatus = `\n\n💾 AUTO-SAVE STATUS: ⚠️ NOT FOUND
Expected location: ${expectedFilePath}
${saveToVectors ? 'Attempting manual save...' : 'Auto-save was disabled'}`;

          if (saveToVectors) {
            // Force save if it wasn't saved automatically
            try {
              // Extract content from the result
              const contentText = contentResult.content[0].text;
              const actualContent = contentText.split('\n\n').slice(1).join('\n\n'); // Remove header

              await this._saveFileAsVectorDocument(file, actualContent, targetWorkspaceId, this._getFileTypeFromMime(file.mimeType));
              saveStatus += `\n✅ Manual save completed successfully!`;
            } catch (manualSaveError) {
              saveStatus += `\n❌ Manual save failed: ${manualSaveError.message}`;
            }
          }
        }

        // Append save status to the original content result
        contentResult.content[0].text += saveStatus;
        return contentResult;

      } catch (metaError) {
        // If we can't get metadata, just return the content with a warning
        contentResult.content[0].text += `\n\n💾 AUTO-SAVE STATUS: ⚠️ Could not verify save status: ${metaError.message}`;
        return contentResult;
      }

    } catch (error) {
      return buildNangoError(error, 'get Google Drive file with auto-save');
    }
  }

  _createTextChunks(text, chunkSize) {
    if (!text || text.length <= chunkSize) {
      return [text];
    }

    const chunks = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      let endIndex = currentIndex + chunkSize;

      // Try to break at a sentence or paragraph boundary
      if (endIndex < text.length) {
        const nextParagraph = text.indexOf('\n\n', currentIndex);
        const nextSentence = text.indexOf('.', endIndex - 100);

        if (nextParagraph > currentIndex && nextParagraph < endIndex + 200) {
          endIndex = nextParagraph;
        } else if (nextSentence > currentIndex && nextSentence < endIndex + 100) {
          endIndex = nextSentence + 1;
        }
      }

      const chunk = text.substring(currentIndex, endIndex).trim();
      if (chunk.length > 0) {
        chunks.push(chunk);
      }

      currentIndex = endIndex;
    }

    return chunks;
  }

  // =========== Helper Methods ===========

  /**
   * Get the proper storage path for this workspace's Google Drive documents
   */
  _getWorkspaceStoragePath(workspaceId) {
    // Use the correct server storage path
    const baseStoragePath = process.env.STORAGE_DIR
      ? path.resolve(process.env.STORAGE_DIR, 'documents')
      : path.resolve('/mnt/c/MyProjects/Tredy/server/storage', 'documents');

    // Save all files in the put_here directory as requested
    const googleDriveFolderPath = path.join(baseStoragePath, 'put_here');
    return googleDriveFolderPath;
  }

  /**
   * Save a Google Drive file as an AnythingLLM-compatible vector document
   */
  async _saveFileAsVectorDocument(file, content, workspaceId, fileType) {
    try {
      const googleDriveFolderPath = this._getWorkspaceStoragePath(workspaceId);
      console.log(`[GoogleDrive] Saving file to: ${googleDriveFolderPath}`);

      if (!fs.existsSync(googleDriveFolderPath)) {
        console.log(`[GoogleDrive] Creating directory: ${googleDriveFolderPath}`);
        fs.mkdirSync(googleDriveFolderPath, { recursive: true });
      }

      // Create AnythingLLM-compatible document structure
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const documentFileName = `${file.id}_${sanitizedFileName}.json`;
      const documentPath = path.join(googleDriveFolderPath, documentFileName);

      // Estimate token count (rough approximation: 1 token ≈ 4 characters)
      const tokenCount = Math.ceil(content.length / 4);

      const anythingLLMDocument = {
        id: file.id,
        url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
        title: file.name,
        docAuthor: 'Google Drive',
        description: `Google Drive ${fileType} file: ${file.name}`,
        docSource: `Google Drive file imported via MCP tools for workspace ${workspaceId}`,
        chunkSource: `google-drive-workspace-${workspaceId}`,
        published: file.modifiedTime || file.createdTime || new Date().toISOString(),
        wordCount: content.split(/\s+/).length,
        pageContent: content,
        token_count_estimate: tokenCount,
        // Additional metadata
        mimeType: file.mimeType,
        fileSize: file.size ? parseInt(file.size) : 0,
        fileType: fileType,
        googleDriveId: file.id,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        importedAt: new Date().toISOString(),
        workspaceId: workspaceId
      };

      // Save the document
      fs.writeFileSync(documentPath, JSON.stringify(anythingLLMDocument, null, 2), 'utf8');
      console.log(`[GoogleDrive] 💾 Saved vector document: ${documentFileName}`);

      return documentPath;
    } catch (error) {
      console.error(`[GoogleDrive] Failed to save vector document for ${file.name}:`, error.message);
      throw error;
    }
  }

  async _getFileMetadata(fileId, connectionId, fields = 'id,name,mimeType,size,parents,webViewLink') {
    return this.nango.get({
      endpoint: `/drive/v3/files/${fileId}`,
      connectionId,
      providerConfigKey: this.nangoConfig.providerConfigKey,
      params: { fields }
    });
  }

  _formatFileList(files, title) {
    // Create a structured summary
    const fileCount = files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder').length;
    const folderCount = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder').length;

    const summary = `📊 GOOGLE DRIVE CONTENTS SUMMARY
📁 Folders: ${folderCount}
📄 Files: ${fileCount}
📋 Total Items: ${files.length}

═══════════════════════════════════════════════════════`;

    const formatted = files.map((file, i) => {
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
      const icon = isFolder ? '📁' : '📄';
      const size = file.size ? `${this.formatFileSize(file.size)}` : 'Unknown';
      const modified = file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Unknown';
      const fileType = isFolder ? 'Folder' : this._getFileTypeFromMime(file.mimeType);

      return `${i + 1}. ${icon} ${file.name}
   📋 ID: ${file.id}
   📁 Type: ${fileType}
   📏 Size: ${size}
   📅 Modified: ${modified}
   🔗 Link: ${file.webViewLink || 'N/A'}`;
    }).join('\n\n');

    const fullOutput = `${summary}\n\n${formatted}\n\n═══════════════════════════════════════════════════════\n💡 TIP: Use the file ID (not the name) with other Google Drive tools.`;

    return { content: [{ type: 'text', text: fullOutput }] };
  }
  
  async _exportGoogleWorkspaceFile(fileId, format, connectionId) {
    const exportMimeTypes = {
      'txt': 'text/plain', 'html': 'text/html', 'rtf': 'application/rtf',
      'pdf': 'application/pdf', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'odt': 'application/vnd.oasis.opendocument.text', 'epub': 'application/epub+zip',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'ods': 'application/vnd.oasis.opendocument.spreadsheet', 'csv': 'text/csv',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'odp': 'application/vnd.oasis.opendocument.presentation',
      'svg': 'image/svg+xml', 'png': 'image/png', 'jpg': 'image/jpeg'
    };
    const mimeType = exportMimeTypes[format] || exportMimeTypes['txt'];

    return this.nango.get({
      endpoint: `/drive/v3/files/${fileId}/export`,
      connectionId,
      providerConfigKey: this.nangoConfig.providerConfigKey,
      params: { mimeType }
    });
  }

  _handleLargeContent(content, fileName, maxSize, chunked, format = 'raw') {
    if (content.length > maxSize) {
      if (chunked) {
        const chunkSize = Math.floor(maxSize * 0.8);
        const truncatedContent = content.substring(0, chunkSize);
        return { content: [{ type: 'text', text: `Content of "${fileName}" (CHUNK 1 of large file, ${format}):\nTotal size: ${this.formatFileSize(content.length)} | Showing: ${this.formatFileSize(chunkSize)}\n\n${truncatedContent}\n\n[Content continues... Use fetch_gdrive_file_to_local for complete file]` }] };
      } else {
        const truncatedContent = content.substring(0, maxSize);
        return { content: [{ type: 'text', text: `Content of "${fileName}" (TRUNCATED, ${format}):\nOriginal size: ${this.formatFileSize(content.length)} | Showing: ${this.formatFileSize(maxSize)}\n\n${truncatedContent}\n\n[Content truncated - use fetch_gdrive_file_to_local for complete file or increase maxSize parameter]` }] };
      }
    }
    return null;
  }

  cleanTextContent(text, preserveFormatting = true) {
    if (!text) return '';
    let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    cleaned = cleaned.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    if (preserveFormatting) {
      cleaned = cleaned.replace(/\n\s*\n/g, '\n\n').replace(/\n{3,}/g, '\n\n');
    } else {
      cleaned = cleaned.replace(/\s+/g, ' ');
    }
    cleaned = cleaned.trim();
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
      'text/', 'application/json', 'application/xml', 'application/javascript', 'application/typescript',
      'application/x-httpd-php', 'application/sql', 'application/x-python', 'application/x-java-source',
      'application/x-c++src', 'application/x-csrc', 'application/x-chdr', 'application/x-ruby', 'application/x-go',
      'application/x-rust', 'application/x-swift', 'application/x-kotlin', 'application/x-scala',
      'application/yaml', 'application/markdown'
    ];
    return textMimeTypes.some(textType => mimeType.startsWith(textType));
  }

  _getFileTypeFromMime(mimeType) {
    const mimeToType = {
      'application/vnd.google-apps.folder': 'Folder',
      'application/vnd.google-apps.document': 'Google Document',
      'application/vnd.google-apps.spreadsheet': 'Google Spreadsheet',
      'application/vnd.google-apps.presentation': 'Google Presentation',
      'application/vnd.google-apps.form': 'Google Form',
      'application/vnd.google-apps.drawing': 'Google Drawing',
      'application/vnd.google-apps.script': 'Google Apps Script',
      'application/pdf': 'PDF Document',
      'application/msword': 'Word Document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
      'application/vnd.ms-excel': 'Excel Spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
      'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint Presentation',
      'text/plain': 'Text File',
      'text/csv': 'CSV File',
      'application/json': 'JSON File',
      'text/html': 'HTML File',
      'text/css': 'CSS File',
      'application/javascript': 'JavaScript File',
      'application/typescript': 'TypeScript File',
      'text/x-python': 'Python File',
      'text/x-java-source': 'Java File',
      'text/x-c++src': 'C++ File',
      'image/jpeg': 'JPEG Image',
      'image/png': 'PNG Image',
      'image/gif': 'GIF Image',
      'image/svg+xml': 'SVG Image',
      'video/mp4': 'MP4 Video',
      'video/quicktime': 'QuickTime Video',
      'audio/mpeg': 'MP3 Audio',
      'audio/wav': 'WAV Audio',
      'application/zip': 'ZIP Archive'
    };

    if (mimeType.startsWith('image/')) return 'Image File';
    if (mimeType.startsWith('video/')) return 'Video File';
    if (mimeType.startsWith('audio/')) return 'Audio File';
    if (mimeType.startsWith('text/')) return 'Text File';

    return mimeToType[mimeType] || 'File';
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.txt': 'text/plain', '.md': 'text/markdown', '.csv': 'text/csv', '.xml': 'text/xml', '.html': 'text/html',
      '.css': 'text/css', '.js': 'application/javascript', '.ts': 'application/typescript', '.json': 'application/json',
      '.pdf': 'application/pdf', '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml',
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.mov': 'video/quicktime',
      '.zip': 'application/zip', '.py': 'text/x-python', '.java': 'text/x-java-source', '.cpp': 'text/x-c++src',
      '.bin': 'application/octet-stream'
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