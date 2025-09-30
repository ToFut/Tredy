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
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

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
          description: 'Download/fetch files or folders from Google Drive to local filesystem. Supports ALL file types: Google Workspace files (Docs, Sheets, Slides), PDFs with text extraction, DOCX with text extraction, images, videos, and binary files. Can recursively download entire folders with their contents. Use when user wants to download, save, or copy files/folders locally. IMPORTANT: Requires Google Drive file ID (not filename). Use search_gdrive_files first if you only have a filename.',
          inputSchema: {
            type: 'object',
            properties: {
              fileId: { type: 'string', description: 'Google Drive file or folder ID (long string like 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms) - NOT the filename. Use search_gdrive_files to find the ID.' },
              localPath: { type: 'string', description: 'Local file or folder path where to save the content. For folders, the folder name will be appended to this path.' },
              format: { type: 'string', description: 'Export format for Google Workspace files. Options: txt, html, rtf, pdf, docx, odt, epub, xlsx, ods, csv, pptx, odp, svg, png, jpg', default: 'txt' },
              recursive: { type: 'boolean', description: 'For folders: Set to true to recursively download all folder contents including subfolders (default: false). Ignored for files.', default: false }
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
          case 'create_gdrive_folder': return await this.createGoogleDriveFolder(args, workspaceId);
          case 'create_gdrive_file': return await this.createGoogleDriveFile(args, workspaceId);
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

      // Enhanced PDF and DOCX handling - extract real content using dedicated libraries
      if (file.mimeType === 'application/pdf' || file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const fileTypeDisplay = file.mimeType === 'application/pdf' ? 'PDF' : 'DOCX';
        console.log(`[GoogleDrive] ========================================`);
        console.log(`[GoogleDrive] Processing ${fileTypeDisplay}: ${file.name}`);
        console.log(`[GoogleDrive] File ID: ${file.id}`);
        console.log(`[GoogleDrive] File size: ${file.size ? this.formatFileSize(file.size) : 'Unknown'}`);
        console.log(`[GoogleDrive] ========================================`);

        let extractedContent = '';
        let extractionMethod = 'unknown';

        try {
          // Use the improved _fetchBinaryFile method
          console.log(`[GoogleDrive] Fetching binary file for ${fileTypeDisplay} extraction`);
          const fetchResult = await this._fetchBinaryFile(fileId, connectionId);
          const fileBuffer = fetchResult.buffer;

          console.log(`[GoogleDrive] Binary fetch completed using method: ${fetchResult.method}`);
          console.log(`[GoogleDrive] Buffer size: ${fileBuffer.length} bytes`);

          // Extract content using appropriate library
          if (file.mimeType === 'application/pdf') {
            console.log(`[GoogleDrive] Attempting PDF text extraction with pdf-parse`);
            extractedContent = await this.extractPdfText(fileBuffer);
            extractionMethod = 'pdf-parse';
            console.log(`[GoogleDrive] ✓ Successfully extracted PDF text: ${extractedContent.length} characters`);
          } else {
            // For DOCX files, check if it's a valid ZIP first
            console.log(`[GoogleDrive] Validating DOCX file (checking ZIP signature)`);
            if (this.isValidZip(fileBuffer)) {
              console.log(`[GoogleDrive] ✓ Valid DOCX structure detected, attempting mammoth extraction`);
              extractedContent = await this.extractDocxText(fileBuffer);
              extractionMethod = 'mammoth';
              console.log(`[GoogleDrive] ✓ Successfully extracted DOCX text using mammoth: ${extractedContent.length} characters`);
            } else {
              console.log(`[GoogleDrive] ✗ DOCX file ${file.name} is not a valid ZIP file`);
              throw new Error('DOCX file is not a valid ZIP format - buffer may be corrupted');
            }
          }

        } catch (extractionError) {
          console.error(`[GoogleDrive] ========================================`);
          console.error(`[GoogleDrive] ✗ ${fileTypeDisplay} extraction FAILED for ${file.name}`);
          console.error(`[GoogleDrive] Error: ${extractionError.message}`);
          console.error(`[GoogleDrive] Stack: ${extractionError.stack}`);
          console.error(`[GoogleDrive] ========================================`);

          // Try fallback methods based on file type
          if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // DOCX-specific fallback: Use Google Drive conversion
            console.log(`[GoogleDrive] Attempting DOCX fallback: Conversion via Google Docs`);
            try {
              extractedContent = await this._convertDocxViaGoogleDocs(fileId, file.name, connectionId);
              extractionMethod = 'google-docs-conversion';
              console.log(`[GoogleDrive] ✓ DOCX fallback succeeded using Google Docs conversion: ${extractedContent.length} characters`);
            } catch (conversionError) {
              console.error(`[GoogleDrive] ✗ DOCX Google Docs conversion also failed: ${conversionError.message}`);
              // Final fallback: return error message
              extractedContent = `DOCX File: ${file.name}\n\nContent extraction failed. \n\nAttempted methods:\n1. Direct DOCX parsing (mammoth): ${extractionError.message}\n2. Google Docs conversion: ${conversionError.message}\n\nFile ID: ${file.id}\n\nPlease try downloading the file manually or check if the file is corrupted.`;
              extractionMethod = 'failed';
            }
          } else {
            // PDF-specific fallback: Try Google Drive export (some PDFs can be exported)
            console.log(`[GoogleDrive] Attempting PDF fallback: Google Drive export`);
            try {
              const exportResponse = await this._exportGoogleWorkspaceFile(fileId, 'txt', connectionId);
              extractedContent = String(exportResponse.data);
              extractionMethod = 'google-drive-export';
              console.log(`[GoogleDrive] ✓ PDF fallback succeeded using Google Drive export: ${extractedContent.length} characters`);
            } catch (exportError) {
              console.error(`[GoogleDrive] ✗ PDF Google Drive export also failed: ${exportError.message}`);
              // Final fallback: return error message
              extractedContent = `PDF File: ${file.name}\n\nContent extraction failed.\n\nAttempted methods:\n1. Direct PDF parsing (pdf-parse): ${extractionError.message}\n2. Google Drive export: ${exportError.message}\n\nFile ID: ${file.id}\n\nThe PDF may be image-based (scanned) or corrupted. Please try downloading the file manually.`;
              extractionMethod = 'failed';
            }
          }
        }

        // Clean the extracted content
        const cleanedContent = this.cleanTextContent(extractedContent);
        console.log(`[GoogleDrive] Cleaned content length: ${cleanedContent.length} characters`);

        // Save as vector embedding locally with real content (only if extraction succeeded)
        if (extractionMethod !== 'failed') {
          try {
            console.log(`[GoogleDrive] Saving to vector storage...`);
            await this._saveFileAsVectorDocument(file, cleanedContent, workspaceId, file.mimeType === 'application/pdf' ? 'pdf' : 'docx');
            console.log(`[GoogleDrive] ✓ Successfully saved ${fileTypeDisplay} content to vector storage: ${file.name}`);
          } catch (saveError) {
            console.error(`[GoogleDrive] ⚠ Failed to save vector document for ${file.name}:`, saveError.message);
          }
        } else {
          console.log(`[GoogleDrive] ⚠ Skipping vector storage save due to extraction failure`);
        }

        console.log(`[GoogleDrive] ========================================`);
        console.log(`[GoogleDrive] ${fileTypeDisplay} processing completed`);
        console.log(`[GoogleDrive] Extraction method: ${extractionMethod}`);
        console.log(`[GoogleDrive] Final content length: ${cleanedContent.length} characters`);
        console.log(`[GoogleDrive] ========================================`);

        const largeContentResponse = this._handleLargeContent(cleanedContent, file.name, maxSize, chunked, `extracted ${fileTypeDisplay.toLowerCase()} content (${extractionMethod})`);
        if (largeContentResponse) return largeContentResponse;

        return { content: [{ type: 'text', text: `Content of "${file.name}" (${fileTypeDisplay} content extracted via ${extractionMethod}):\n\n${cleanedContent}` }] };
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
    const { fileId, localPath, format = 'txt', recursive = false } = args;

    try {
      const metaResponse = await this._getFileMetadata(fileId, connectionId, 'id,name,mimeType,size,createdTime,modifiedTime');
      const file = metaResponse.data;

      // Handle folder - recursive download
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        if (!recursive) {
          return {
            content: [{ type: 'text', text: `❌ Cannot download "${file.name}" - it is a folder. Set recursive=true to download folder contents, or use list_gdrive_files to see contents.` }],
            isError: true
          };
        }

        // Recursive folder download
        return await this._fetchFolderToLocal(fileId, localPath, connectionId, workspaceId);
      }

      // Check file size limit
      if (file.size && parseInt(file.size) > 100 * 1024 * 1024) {
        throw new Error(`File size (${this.formatFileSize(file.size)}) exceeds 100MB limit`);
      }

      // Create directory if needed
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        console.log(`[GoogleDrive] Creating directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
      }

      let contentToSave;
      let savedAs = file.mimeType;

      // Handle Google Workspace files
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        console.log(`[GoogleDrive] Exporting Google Workspace file: ${file.name} as ${format}`);
        try {
          const contentResponse = await this._exportGoogleWorkspaceFile(fileId, format, connectionId);
          contentToSave = Buffer.isBuffer(contentResponse.data)
            ? contentResponse.data
            : Buffer.from(String(contentResponse.data), 'utf8');
          savedAs = `${file.mimeType} (exported as ${format})`;
        } catch (exportError) {
          console.error(`[GoogleDrive] Export failed: ${exportError.message}`);
          throw new Error(`Failed to export Google Workspace file: ${exportError.message}`);
        }
      }
      // Handle PDF files with text extraction
      else if (file.mimeType === 'application/pdf') {
        console.log(`[GoogleDrive] Fetching PDF: ${file.name}`);
        try {
          const contentResponse = await this._fetchBinaryFile(fileId, connectionId);
          const pdfBuffer = contentResponse.buffer;

          // Extract text from PDF
          const extractedText = await this.extractPdfText(pdfBuffer);
          const cleanedText = this.cleanTextContent(extractedText);

          // Save extracted text to file
          contentToSave = Buffer.from(cleanedText, 'utf8');
          savedAs = 'PDF (extracted text)';
          console.log(`[GoogleDrive] Successfully extracted PDF text: ${cleanedText.length} characters`);
        } catch (pdfError) {
          console.error(`[GoogleDrive] PDF extraction failed: ${pdfError.message}, trying raw download`);
          // Fallback: save raw PDF
          const contentResponse = await this._fetchBinaryFile(fileId, connectionId);
          contentToSave = contentResponse.buffer;
          savedAs = 'PDF (binary)';
        }
      }
      // Handle DOCX files with text extraction
      else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        console.log(`[GoogleDrive] fetchGoogleDriveFileToLocal: Processing DOCX: ${file.name}`);
        try {
          console.log(`[GoogleDrive] Fetching DOCX binary data...`);
          const contentResponse = await this._fetchBinaryFile(fileId, connectionId);
          const docxBuffer = contentResponse.buffer;

          console.log(`[GoogleDrive] Binary fetch completed using method: ${contentResponse.method}`);
          console.log(`[GoogleDrive] Validating DOCX structure...`);

          // Check if valid ZIP (DOCX is ZIP format)
          if (this.isValidZip(docxBuffer)) {
            console.log(`[GoogleDrive] ✓ Valid DOCX ZIP structure confirmed`);
            const extractedText = await this.extractDocxText(docxBuffer);
            const cleanedText = this.cleanTextContent(extractedText);

            // Save extracted text to file
            contentToSave = Buffer.from(cleanedText, 'utf8');
            savedAs = 'DOCX (extracted text)';
            console.log(`[GoogleDrive] ✓ Successfully extracted DOCX text: ${cleanedText.length} characters`);
          } else {
            console.log(`[GoogleDrive] ✗ DOCX is not a valid ZIP, saving as binary`);
            contentToSave = docxBuffer;
            savedAs = 'DOCX (binary)';
          }
        } catch (docxError) {
          console.error(`[GoogleDrive] ✗ DOCX extraction failed: ${docxError.message}`);
          console.log(`[GoogleDrive] Attempting fallback: Google Docs conversion...`);
          try {
            // Try Google Docs conversion fallback
            const extractedText = await this._convertDocxViaGoogleDocs(fileId, file.name, connectionId);
            const cleanedText = this.cleanTextContent(extractedText);
            contentToSave = Buffer.from(cleanedText, 'utf8');
            savedAs = 'DOCX (extracted text via Google Docs)';
            console.log(`[GoogleDrive] ✓ Google Docs conversion succeeded: ${cleanedText.length} characters`);
          } catch (conversionError) {
            console.error(`[GoogleDrive] ✗ Google Docs conversion also failed: ${conversionError.message}`);
            console.log(`[GoogleDrive] Final fallback: saving raw DOCX binary`);
            // Final fallback: save raw DOCX
            const contentResponse = await this._fetchBinaryFile(fileId, connectionId);
            contentToSave = contentResponse.buffer;
            savedAs = 'DOCX (binary - extraction failed)';
          }
        }
      }
      // Handle text files
      else if (this.isTextMimeType(file.mimeType)) {
        console.log(`[GoogleDrive] Fetching text file: ${file.name}`);
        const contentResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${fileId}`,
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params: { alt: 'media' }
        });

        let textContent = String(contentResponse.data);
        textContent = this.cleanTextContent(textContent);
        contentToSave = Buffer.from(textContent, 'utf8');
        savedAs = 'text file';
      }
      // Handle all other binary files
      else {
        console.log(`[GoogleDrive] Fetching binary file: ${file.name} (${file.mimeType})`);
        const contentResponse = await this._fetchBinaryFile(fileId, connectionId);
        contentToSave = contentResponse.buffer;
        savedAs = 'binary file';
      }

      // Write to local filesystem
      fs.writeFileSync(localPath, contentToSave);
      const stats = fs.statSync(localPath);

      return {
        content: [{
          type: 'text',
          text: `✅ Successfully downloaded "${file.name}" to "${localPath}"
📏 Size: ${this.formatFileSize(stats.size)}
📄 Type: ${savedAs}
📅 Modified: ${file.modifiedTime ? new Date(file.modifiedTime).toLocaleString() : 'Unknown'}
🆔 File ID: ${file.id}`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'download file');
    }
  }

  /**
   * Helper method to fetch binary files from Google Drive with robust handling
   */
  async _fetchBinaryFile(fileId, connectionId) {
    let contentResponse;
    let binaryDataObtained = false;
    let responseMethod = 'unknown';

    console.log(`[GoogleDrive] _fetchBinaryFile: Fetching file ${fileId}`);

    // Method 1: Try with binary headers and responseType
    try {
      console.log(`[GoogleDrive] Method 1: Trying with binary headers and responseType arraybuffer`);
      contentResponse = await this.nango.get({
        endpoint: `/drive/v3/files/${fileId}`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: { alt: 'media' },
        headers: {
          'Accept': 'application/octet-stream'
        },
        responseType: 'arraybuffer'
      });

      // Check if we got proper binary data
      if (Buffer.isBuffer(contentResponse.data)) {
        binaryDataObtained = true;
        responseMethod = 'buffer';
        console.log(`[GoogleDrive] ✓ Got proper Buffer data, size: ${contentResponse.data.length} bytes`);
      } else if (contentResponse.data instanceof ArrayBuffer) {
        contentResponse.data = Buffer.from(contentResponse.data);
        binaryDataObtained = true;
        responseMethod = 'arraybuffer';
        console.log(`[GoogleDrive] ✓ Got ArrayBuffer, converted to Buffer, size: ${contentResponse.data.length} bytes`);
      } else if (typeof contentResponse.data === 'string') {
        // Check for unicode corruption
        let unicodeCount = 0;
        const sampleSize = Math.min(1000, contentResponse.data.length);
        for (let i = 0; i < sampleSize; i++) {
          if (contentResponse.data.charCodeAt(i) > 255) unicodeCount++;
        }
        const corruptionRate = unicodeCount / sampleSize;

        if (corruptionRate < 0.01) { // Less than 1% corruption is acceptable
          binaryDataObtained = true;
          responseMethod = 'string-clean';
          console.log(`[GoogleDrive] ✓ Got clean string data, size: ${contentResponse.data.length} chars, corruption: ${(corruptionRate * 100).toFixed(2)}%`);
        } else {
          console.log(`[GoogleDrive] ✗ Got corrupted string data (${unicodeCount}/${sampleSize} unicode chars = ${(corruptionRate * 100).toFixed(2)}%), trying fallback`);
        }
      }

      if (binaryDataObtained) {
        console.log(`[GoogleDrive] Response headers:`, JSON.stringify(contentResponse.headers || {}, null, 2));
      }
    } catch (error) {
      console.log(`[GoogleDrive] Method 1 failed: ${error.message}`);
    }

    // Method 2: Try without responseType specification
    if (!binaryDataObtained) {
      try {
        console.log(`[GoogleDrive] Method 2: Trying with binary headers only`);
        contentResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${fileId}`,
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params: { alt: 'media' },
          headers: {
            'Accept': 'application/octet-stream'
          }
        });

        if (Buffer.isBuffer(contentResponse.data) || typeof contentResponse.data === 'string') {
          binaryDataObtained = true;
          responseMethod = 'binary-headers';
          console.log(`[GoogleDrive] ✓ Method 2 succeeded, got ${typeof contentResponse.data}`);
        }
      } catch (error) {
        console.log(`[GoogleDrive] Method 2 failed: ${error.message}`);
      }
    }

    // Method 3: Fallback - try without specific headers
    if (!binaryDataObtained) {
      try {
        console.log(`[GoogleDrive] Method 3: Trying fallback without binary headers`);
        contentResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${fileId}`,
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey,
          params: { alt: 'media' }
        });
        responseMethod = 'fallback';
        console.log(`[GoogleDrive] ✓ Method 3 succeeded`);
      } catch (fallbackError) {
        console.error(`[GoogleDrive] ✗ All fetch methods failed. Last error: ${fallbackError.message}`);
        throw new Error(`Failed to fetch binary file using all methods: ${fallbackError.message}`);
      }
    }

    // Convert to Buffer with proper encoding
    let fileBuffer;
    if (Buffer.isBuffer(contentResponse.data)) {
      fileBuffer = contentResponse.data;
      console.log(`[GoogleDrive] Data is already a Buffer: ${fileBuffer.length} bytes`);
    } else if (contentResponse.data instanceof ArrayBuffer) {
      fileBuffer = Buffer.from(contentResponse.data);
      console.log(`[GoogleDrive] Converted ArrayBuffer to Buffer: ${fileBuffer.length} bytes`);
    } else if (typeof contentResponse.data === 'string') {
      console.log(`[GoogleDrive] Converting string to Buffer, length: ${contentResponse.data.length} chars`);

      // Check if this looks like base64 data
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const sample = contentResponse.data.substring(0, Math.min(200, contentResponse.data.length));
      const isBase64Like = base64Regex.test(sample);

      if (isBase64Like && contentResponse.data.length % 4 === 0) {
        try {
          fileBuffer = Buffer.from(contentResponse.data, 'base64');
          console.log(`[GoogleDrive] ✓ Decoded as base64: ${fileBuffer.length} bytes`);
        } catch (base64Error) {
          console.log(`[GoogleDrive] Base64 decoding failed: ${base64Error.message}, trying latin1`);
          fileBuffer = Buffer.from(contentResponse.data, 'latin1');
          console.log(`[GoogleDrive] Using latin1 encoding: ${fileBuffer.length} bytes`);
        }
      } else {
        // Use latin1 encoding for binary string - preserves all 8-bit values correctly
        fileBuffer = Buffer.from(contentResponse.data, 'latin1');
        console.log(`[GoogleDrive] Using latin1 encoding: ${fileBuffer.length} bytes`);
      }
    } else if (contentResponse.data && typeof contentResponse.data === 'object') {
      // Try to handle other object types
      try {
        fileBuffer = Buffer.from(JSON.stringify(contentResponse.data));
        console.log(`[GoogleDrive] Converted object to JSON Buffer: ${fileBuffer.length} bytes`);
      } catch (err) {
        fileBuffer = Buffer.from(String(contentResponse.data));
        console.log(`[GoogleDrive] Converted object to string Buffer: ${fileBuffer.length} bytes`);
      }
    } else {
      fileBuffer = Buffer.from(String(contentResponse.data));
      console.log(`[GoogleDrive] Fallback conversion to Buffer: ${fileBuffer.length} bytes`);
    }

    // Validate buffer integrity
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Fetched file buffer is empty or invalid');
    }

    // Log first few bytes for debugging
    const firstBytes = Array.from(fileBuffer.slice(0, 16))
      .map(b => '0x' + b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`[GoogleDrive] Buffer first 16 bytes: ${firstBytes}`);
    console.log(`[GoogleDrive] Successfully fetched binary file using method: ${responseMethod}, size: ${fileBuffer.length} bytes`);

    return { buffer: fileBuffer, method: responseMethod };
  }

  /**
   * Convert DOCX file to text by using Google Drive's conversion feature
   * Creates a temporary Google Doc copy, exports as text, then deletes the copy
   */
  async _convertDocxViaGoogleDocs(fileId, fileName, connectionId) {
    let tempDocId = null;

    try {
      console.log(`[GoogleDrive] Starting DOCX conversion via Google Docs for: ${fileName}`);

      // Step 1: Create a copy of the DOCX file and convert to Google Doc
      console.log(`[GoogleDrive] Step 1: Creating Google Doc copy of DOCX file`);

      const copyResponse = await this.nango.post({
        endpoint: `/drive/v3/files/${fileId}/copy`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        data: {
          name: `temp_conversion_${fileName}`,
          mimeType: 'application/vnd.google-apps.document' // Convert to Google Doc
        },
        headers: { 'Content-Type': 'application/json' }
      });

      tempDocId = copyResponse.data.id;
      console.log(`[GoogleDrive] ✓ Created temporary Google Doc: ${tempDocId}`);

      // Step 2: Export the Google Doc as plain text
      console.log(`[GoogleDrive] Step 2: Exporting Google Doc as text`);

      const exportResponse = await this.nango.get({
        endpoint: `/drive/v3/files/${tempDocId}/export`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: { mimeType: 'text/plain' }
      });

      const textContent = String(exportResponse.data);
      console.log(`[GoogleDrive] ✓ Exported text content: ${textContent.length} characters`);

      // Step 3: Delete the temporary Google Doc
      console.log(`[GoogleDrive] Step 3: Deleting temporary Google Doc`);

      try {
        await this.nango.delete({
          endpoint: `/drive/v3/files/${tempDocId}`,
          connectionId,
          providerConfigKey: this.nangoConfig.providerConfigKey
        });
        console.log(`[GoogleDrive] ✓ Deleted temporary Google Doc: ${tempDocId}`);
        tempDocId = null; // Mark as cleaned up
      } catch (deleteError) {
        console.error(`[GoogleDrive] ⚠ Failed to delete temporary Google Doc ${tempDocId}: ${deleteError.message}`);
        // Don't throw - we got the content, deletion is cleanup
      }

      console.log(`[GoogleDrive] ✓ Successfully converted DOCX to text via Google Docs`);
      return textContent;

    } catch (error) {
      console.error(`[GoogleDrive] ✗ DOCX conversion via Google Docs failed: ${error.message}`);

      // Cleanup: Try to delete temporary file if it was created
      if (tempDocId) {
        try {
          console.log(`[GoogleDrive] Cleaning up temporary Google Doc: ${tempDocId}`);
          await this.nango.delete({
            endpoint: `/drive/v3/files/${tempDocId}`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey
          });
          console.log(`[GoogleDrive] ✓ Cleanup successful`);
        } catch (cleanupError) {
          console.error(`[GoogleDrive] ⚠ Cleanup failed for ${tempDocId}: ${cleanupError.message}`);
          // Don't throw - just log
        }
      }

      throw new Error(`Failed to convert DOCX via Google Docs: ${error.message}`);
    }
  }

  /**
   * Helper method to recursively download folder contents
   */
  async _fetchFolderToLocal(folderId, localPath, connectionId, workspaceId) {
    try {
      const metaResponse = await this._getFileMetadata(folderId, connectionId, 'id,name,mimeType');
      const folderName = metaResponse.data.name;

      // Create folder locally
      const folderPath = path.join(localPath, folderName);
      if (!fs.existsSync(folderPath)) {
        console.log(`[GoogleDrive] Creating folder: ${folderPath}`);
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // List all files in the folder
      const query = `'${folderId}' in parents and trashed = false`;
      const response = await this.nango.get({
        endpoint: '/drive/v3/files',
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: {
          q: query,
          fields: 'files(id,name,mimeType,size)',
          pageSize: 100
        }
      });

      const items = response.data?.files || [];

      if (items.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `📁 Folder "${folderName}" is empty\n📂 Created local folder: ${folderPath}`
          }]
        };
      }

      const results = [];
      let fileCount = 0;
      let folderCount = 0;

      for (const item of items) {
        const itemPath = path.join(folderPath, item.name);

        if (item.mimeType === 'application/vnd.google-apps.folder') {
          // Recursive folder download
          folderCount++;
          const subFolderResult = await this._fetchFolderToLocal(item.id, folderPath, connectionId, workspaceId);
          results.push(`📁 ${item.name} (subfolder processed)`);
        } else {
          // Download file
          fileCount++;
          try {
            await this.fetchGoogleDriveFileToLocal(
              { fileId: item.id, localPath: itemPath },
              workspaceId
            );
            results.push(`✅ ${item.name}`);
          } catch (fileError) {
            console.error(`[GoogleDrive] Failed to download ${item.name}: ${fileError.message}`);
            results.push(`❌ ${item.name} (failed: ${fileError.message})`);
          }
        }
      }

      return {
        content: [{
          type: 'text',
          text: `✅ Successfully downloaded folder "${folderName}" to "${folderPath}"
📊 Summary:
  📄 Files: ${fileCount}
  📁 Subfolders: ${folderCount}
  📋 Total Items: ${items.length}

📋 Downloaded Items:
${results.join('\n')}`
        }]
      };
    } catch (error) {
      return buildNangoError(error, 'download folder');
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
      const mimeType = this.getMimeType(localPath);

      // Use exact working string format from test file
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        `Content-Type: ${mimeType}\r\n\r\n` +
        fileContent.toString() +
        close_delim;

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
      } else if (file.mimeType === 'application/pdf') {
        // Use dedicated PDF extraction with pdf-parse library
        try {
          const contentResponse = await this.nango.get({
            endpoint: `/drive/v3/files/${fileId}`,
            connectionId,
            providerConfigKey: this.nangoConfig.providerConfigKey,
            params: { alt: 'media' },
            headers: {
              'Accept': 'application/octet-stream'
            }
          });

          // Handle binary data properly for PDF files
          let pdfBuffer;
          if (Buffer.isBuffer(contentResponse.data)) {
            pdfBuffer = contentResponse.data;
          } else if (typeof contentResponse.data === 'string') {
            console.log(`[GoogleDrive] PDF received as string, length: ${contentResponse.data.length}`);

            // Check if this looks like base64 data
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            const isBase64Like = base64Regex.test(contentResponse.data.substring(0, 100));

            if (isBase64Like && contentResponse.data.length % 4 === 0) {
              try {
                pdfBuffer = Buffer.from(contentResponse.data, 'base64');
                console.log(`[GoogleDrive] PDF decoded as base64, buffer size: ${pdfBuffer.length}`);
              } catch (base64Error) {
                console.log(`[GoogleDrive] PDF base64 decoding failed, trying latin1 encoding`);
                pdfBuffer = Buffer.from(contentResponse.data, 'latin1');
              }
            } else {
              // Use latin1 encoding for binary string - preserves all 8-bit values correctly
              pdfBuffer = Buffer.from(contentResponse.data, 'latin1');
              console.log(`[GoogleDrive] PDF using latin1 encoding, buffer size: ${pdfBuffer.length}`);
            }
          } else {
            pdfBuffer = Buffer.from(contentResponse.data);
          }
          textContent = await this.extractPdfText(pdfBuffer);
          console.log(`[GoogleDrive] Successfully extracted PDF text using pdf-parse: ${file.name}`);
        } catch (pdfError) {
          console.error(`[GoogleDrive] PDF extraction failed for ${file.name}: ${pdfError.message}`);
          // Fallback to Google Drive export
          try {
            const exportResponse = await this._exportGoogleWorkspaceFile(fileId, 'txt', connectionId);
            textContent = String(exportResponse.data);
            console.log(`[GoogleDrive] Used Google Drive export fallback for PDF: ${file.name}`);
          } catch (fallbackError) {
            throw new Error(`Both PDF extraction methods failed: ${pdfError.message}; Fallback: ${fallbackError.message}`);
          }
        }
      } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // Use dedicated DOCX extraction with mammoth library
        console.log(`[GoogleDrive] convertDocumentToText: Processing DOCX file: ${file.name}`);
        try {
          // Use improved _fetchBinaryFile method
          console.log(`[GoogleDrive] Fetching DOCX binary data...`);
          const fetchResult = await this._fetchBinaryFile(fileId, connectionId);
          const docxBuffer = fetchResult.buffer;

          console.log(`[GoogleDrive] Binary fetch completed, buffer size: ${docxBuffer.length} bytes`);
          console.log(`[GoogleDrive] Validating DOCX structure...`);

          if (this.isValidZip(docxBuffer)) {
            console.log(`[GoogleDrive] ✓ Valid DOCX ZIP structure confirmed`);
            textContent = await this.extractDocxText(docxBuffer);
            console.log(`[GoogleDrive] ✓ Successfully extracted DOCX text using mammoth: ${file.name} (${textContent.length} chars)`);
          } else {
            console.log(`[GoogleDrive] ✗ Invalid DOCX ZIP structure detected`);
            throw new Error('DOCX file is not a valid ZIP format');
          }
        } catch (docxError) {
          console.error(`[GoogleDrive] ✗ DOCX extraction failed for ${file.name}: ${docxError.message}`);
          // Fallback to Google Drive conversion
          console.log(`[GoogleDrive] Attempting DOCX fallback: Google Docs conversion...`);
          try {
            textContent = await this._convertDocxViaGoogleDocs(fileId, file.name, connectionId);
            console.log(`[GoogleDrive] ✓ DOCX Google Docs conversion succeeded: ${file.name} (${textContent.length} chars)`);
          } catch (conversionError) {
            console.error(`[GoogleDrive] ✗ DOCX Google Docs conversion also failed: ${conversionError.message}`);
            throw new Error(`Both DOCX extraction methods failed: ${docxError.message}; Conversion: ${conversionError.message}`);
          }
        }
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


  async createGoogleDriveFolder(args, workspaceId) {
    const connectionId = this.getConnectionId(workspaceId);
    const { folderName, parentFolderId } = args;

    try {
      if (!folderName || folderName.trim() === '') {
        return {
          content: [{ type: 'text', text: '❌ Folder name cannot be empty' }],
          isError: true
        };
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

      // Use exact working format from test file
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
   * Extract text from PDF buffer using pdf-parse library
   */
  async extractPdfText(pdfBuffer) {
    try {
      const pdfData = await pdfParse(pdfBuffer);
      return pdfData.text;
    } catch (error) {
      console.error('PDF extraction error:', error.message);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  /**
   * Extract text from DOCX buffer using mammoth library
   */
  async extractDocxText(docxBuffer) {
    try {
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      return result.value;
    } catch (error) {
      console.error('DOCX extraction error:', error.message);
      throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
  }

  /**
   * Check if a buffer is a valid ZIP file by looking for ZIP signature
   */
  isValidZip(buffer) {
    if (!buffer || buffer.length < 4) {
      return false;
    }

    // Check for ZIP file signatures
    // PK\x03\x04 - Local file header signature
    // PK\x05\x06 - End of central directory signature
    // PK\x01\x02 - Central directory file header signature
    const zipSignatures = [
      [0x50, 0x4B, 0x03, 0x04], // PK..
      [0x50, 0x4B, 0x05, 0x06], // PK..
      [0x50, 0x4B, 0x01, 0x02]  // PK..
    ];

    // Check the first 4 bytes for ZIP signature
    const firstFour = [buffer[0], buffer[1], buffer[2], buffer[3]];

    for (const signature of zipSignatures) {
      if (signature.every((byte, index) => byte === firstFour[index])) {
        console.log(`[GoogleDrive] Valid ZIP signature found: PK${String.fromCharCode(signature[2])}${String.fromCharCode(signature[3])}`);
        return true;
      }
    }

    // Also check for empty ZIP (which is still valid)
    if (buffer.length >= 22) {
      // Look for end of central directory signature anywhere in the last part of file
      for (let i = buffer.length - 22; i >= 0; i--) {
        if (buffer[i] === 0x50 && buffer[i + 1] === 0x4B &&
            buffer[i + 2] === 0x05 && buffer[i + 3] === 0x06) {
          console.log(`[GoogleDrive] Valid ZIP end signature found`);
          return true;
        }
      }
    }

    console.log(`[GoogleDrive] No valid ZIP signature found. First 4 bytes: ${firstFour.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
    return false;
  }

  /**
   * Get the proper storage path for this workspace's Google Drive documents
   */
  _getWorkspaceStoragePath(workspaceId) {
    // Use the correct server storage path
    const baseStoragePath = process.env.STORAGE_DIR
      ? path.resolve(process.env.STORAGE_DIR, 'documents')
      : path.resolve('/mnt/c/Myprojects/Tredy/server/storage', 'documents');

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

    // Get file metadata to determine supported export formats
    let fileMetadata;
    try {
      const metaResponse = await this._getFileMetadata(fileId, connectionId);
      fileMetadata = metaResponse.data;
    } catch (metaError) {
      console.error(`Failed to get metadata for export: ${metaError.message}`);
      // Fallback - try with requested format
    }

    // Define fallback formats for each Google Workspace file type
    const fallbackFormats = {
      'application/vnd.google-apps.document': ['txt', 'html', 'pdf'],
      'application/vnd.google-apps.spreadsheet': ['csv', 'xlsx', 'txt'],
      'application/vnd.google-apps.presentation': ['txt', 'pdf', 'pptx'],
      'application/vnd.google-apps.drawing': ['png', 'svg', 'pdf'],
      'application/vnd.google-apps.form': ['txt', 'html']
    };

    const targetMimeType = exportMimeTypes[format] || exportMimeTypes['txt'];

    // First try with the requested format
    try {
      return await this.nango.get({
        endpoint: `/drive/v3/files/${fileId}/export`,
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        params: { mimeType: targetMimeType }
      });
    } catch (exportError) {
      console.error(`Export failed for format ${format}: ${exportError.message}`);

      // If the original format failed, try fallback formats
      if (fileMetadata && fallbackFormats[fileMetadata.mimeType]) {
        const fallbacks = fallbackFormats[fileMetadata.mimeType];

        for (const fallbackFormat of fallbacks) {
          if (fallbackFormat !== format) { // Don't retry the same format
            try {
              console.log(`Trying fallback export format: ${fallbackFormat}`);
              const fallbackMimeType = exportMimeTypes[fallbackFormat];

              const result = await this.nango.get({
                endpoint: `/drive/v3/files/${fileId}/export`,
                connectionId,
                providerConfigKey: this.nangoConfig.providerConfigKey,
                params: { mimeType: fallbackMimeType }
              });

              console.log(`Successfully exported using fallback format: ${fallbackFormat}`);
              return result;
            } catch (fallbackError) {
              console.error(`Fallback format ${fallbackFormat} also failed: ${fallbackError.message}`);
              continue;
            }
          }
        }
      }

      // If all fallback formats failed, throw the original error with more context
      throw new Error(`Export failed for all supported formats. Original error: ${exportError.message}. File type: ${fileMetadata?.mimeType || 'unknown'}`);
    }
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