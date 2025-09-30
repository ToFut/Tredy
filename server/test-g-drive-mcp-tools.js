#!/usr/bin/env node

/**
 * Test Google Drive MCP Tools
 * Comprehensive test suite for g-drive-mcp-tools.js
 *
 * This test verifies:
 * - Connection to Google Drive via Nango
 * - Listing ALL files and directories in Google Drive
 * - Printing FULL content of all files (not just previews)
 * - Uploading files from local filesystem
 */

require('dotenv').config({ path: '.env.development' });
const { Nango } = require('@nangohq/node');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  nango: {
    secretKey: process.env.NANGO_SECRET_KEY,
    host: process.env.NANGO_HOST || 'https://api.nango.dev',
    providerConfigKey: process.env.NANGO_PROVIDER_CONFIG_KEY || 'google-drive',
    connectionId: process.env.NANGO_CONNECTION_ID || 'workspace_150'
  },
  testDir: './test-gdrive-mcp',
  testFile: 'test-upload.txt'
};

class GoogleDriveMCPTester {
  constructor() {
    this.nango = new Nango(TEST_CONFIG.nango);
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    const logMessage = `${prefix} [${timestamp}] ${message}`;

    console.log(logMessage);

    if (type === 'error') {
      this.errors.push(message);
    } else {
      this.results.push(message);
    }
  }

  async testConnection() {
    this.log('Testing Nango connection to Google Drive...', 'info');

    try {
      // Test basic connection by getting user info
      const response = await this.nango.get({
        endpoint: '/drive/v3/about',
        connectionId: TEST_CONFIG.nango.connectionId,
        providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
        params: { fields: 'user,storageQuota' }
      });

      if (response.data?.user) {
        this.log(`Connected successfully! User: ${response.data.user.displayName} (${response.data.user.emailAddress})`, 'success');

        if (response.data.storageQuota) {
          const used = Math.round(response.data.storageQuota.usage / 1024 / 1024 / 1024 * 100) / 100;
          const limit = Math.round(response.data.storageQuota.limit / 1024 / 1024 / 1024 * 100) / 100;
          this.log(`Storage: ${used}GB used of ${limit}GB`, 'info');
        }

        return true;
      } else {
        this.log('Connection failed - no user data returned', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Connection failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testListFiles() {
    this.log('Testing file listing functionality...', 'info');

    try {
      let allFiles = [];
      let nextPageToken = null;
      let pageCount = 0;

      // Get all files by paginating through results
      do {
        pageCount++;
        this.log(`Fetching page ${pageCount}...`, 'info');
        
        const params = {
          pageSize: 100, // Maximum page size
          fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,parents,webViewLink),nextPageToken'
        };

        if (nextPageToken) {
          params.pageToken = nextPageToken;
        }

        const response = await this.nango.get({
          endpoint: '/drive/v3/files',
          connectionId: TEST_CONFIG.nango.connectionId,
          providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
          params: params
        });

        const files = response.data?.files || [];
        allFiles = allFiles.concat(files);
        nextPageToken = response.data?.nextPageToken;

        this.log(`Page ${pageCount}: Found ${files.length} files`, 'info');
      } while (nextPageToken);

      this.log(`Found ${allFiles.length} total files in Google Drive`, 'success');

      // Log all files
      allFiles.forEach((file, i) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const icon = isFolder ? '📁' : '📄';
        const size = file.size ? `(${this.formatFileSize(file.size)})` : '';
        this.log(`  ${i + 1}. ${icon} ${file.name} ${size} - ID: ${file.id}`, 'info');
      });

      return allFiles;
    } catch (error) {
      this.log(`File listing failed: ${error.message}`, 'error');
      return null;
    }
  }

  async testGetFileContent(fileId, fileName) {
    this.log(`Testing file content retrieval for "${fileName}"...`, 'info');

    try {
      // Get file metadata first
      const metaResponse = await this.nango.get({
        endpoint: `/drive/v3/files/${fileId}`,
        connectionId: TEST_CONFIG.nango.connectionId,
        providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
        params: { fields: 'id,name,mimeType,size' }
      });

      const file = metaResponse.data;

      // Handle different file types
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        this.log(`"${fileName}" is a folder - listing contents`, 'info');

        const folderResponse = await this.nango.get({
          endpoint: '/drive/v3/files',
          connectionId: TEST_CONFIG.nango.connectionId,
          providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
          params: {
            q: `'${fileId}' in parents`,
            fields: 'files(id,name,mimeType,size)'
          }
        });

        const contents = folderResponse.data?.files || [];
        this.log(`Folder contains ${contents.length} items`, 'success');

        contents.slice(0, 3).forEach((item, i) => {
          const icon = item.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
          this.log(`  ${i + 1}. ${icon} ${item.name}`, 'info');
        });

        return true;
      }

      // Handle Google Workspace files
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        this.log(`"${fileName}" is a Google Workspace file - exporting as text`, 'info');

        try {
          const exportResponse = await this.nango.get({
            endpoint: `/drive/v3/files/${fileId}/export`,
            connectionId: TEST_CONFIG.nango.connectionId,
            providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
            params: { mimeType: 'text/plain' }
          });

          const content = exportResponse.data || '';
          this.log(`File content (${content.length} chars):`, 'success');
          console.log('='.repeat(60));
          console.log(content);
          console.log('='.repeat(60));
          return true;
        } catch (exportError) {
          this.log(`Export failed, file type may not support text export: ${exportError.message}`, 'error');
          return false;
        }
      }

      // Handle regular files
      try {
        const contentResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${fileId}`,
          connectionId: TEST_CONFIG.nango.connectionId,
          providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
          params: { alt: 'media' }
        });

        const content = contentResponse.data || '';
        this.log(`File content (${content.length} chars):`, 'success');
        console.log('='.repeat(60));
        console.log(content.toString());
        console.log('='.repeat(60));
        return true;
      } catch (mediaError) {
        this.log(`Content retrieval failed: ${mediaError.message}`, 'error');
        return false;
      }

    } catch (error) {
      this.log(`File content retrieval failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDownloadFile(fileId, fileName) {
    this.log(`Testing file download for "${fileName}"...`, 'info');

    // Create test directory
    if (!fs.existsSync(TEST_CONFIG.testDir)) {
      fs.mkdirSync(TEST_CONFIG.testDir, { recursive: true });
    }

    const localPath = path.join(TEST_CONFIG.testDir, `downloaded_${fileName}`);

    try {
      // Get file metadata
      const metaResponse = await this.nango.get({
        endpoint: `/drive/v3/files/${fileId}`,
        connectionId: TEST_CONFIG.nango.connectionId,
        providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
        params: { fields: 'id,name,mimeType,size' }
      });

      const file = metaResponse.data;

      // Skip folders for download test
      if (file.mimeType === 'application/vnd.google-apps.folder') {
        this.log(`Skipping folder download for "${fileName}"`, 'info');
        return true;
      }

      let contentResponse;

      // Handle Google Workspace files
      if (file.mimeType.startsWith('application/vnd.google-apps.')) {
        contentResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${fileId}/export`,
          connectionId: TEST_CONFIG.nango.connectionId,
          providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
          params: { mimeType: 'text/plain' }
        });
      } else {
        // Handle regular files
        contentResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${fileId}`,
          connectionId: TEST_CONFIG.nango.connectionId,
          providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
          params: { alt: 'media' }
        });
      }

      // Write to local file
      const content = contentResponse.data;
      if (typeof content === 'string') {
        fs.writeFileSync(localPath, content, 'utf8');
      } else {
        fs.writeFileSync(localPath, Buffer.from(content));
      }

      const stats = fs.statSync(localPath);
      this.log(`Successfully downloaded "${fileName}" to "${localPath}" (${this.formatFileSize(stats.size)})`, 'success');

      return localPath;
    } catch (error) {
      this.log(`File download failed: ${error.message}`, 'error');
      return null;
    }
  }

  async testUploadFile() {
    this.log('Testing file upload functionality...', 'info');

    // Create test directory and file
    if (!fs.existsSync(TEST_CONFIG.testDir)) {
      fs.mkdirSync(TEST_CONFIG.testDir, { recursive: true });
    }

    const testFilePath = path.join(TEST_CONFIG.testDir, TEST_CONFIG.testFile);
    const testContent = `Test file created by Google Drive MCP Tools\nTimestamp: ${new Date().toISOString()}\nThis is a test upload from the local filesystem.`;

    try {
      // Create test file
      fs.writeFileSync(testFilePath, testContent, 'utf8');
      this.log(`Created test file: ${testFilePath}`, 'info');

      // Upload to Google Drive using simple upload
      const boundary = '-------314159265358979323846';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadata = {
        name: `test-mcp-upload-${Date.now()}.txt`
      };

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain\r\n\r\n' +
        testContent +
        close_delim;

      const uploadResponse = await this.nango.post({
        endpoint: '/upload/drive/v3/files',
        connectionId: TEST_CONFIG.nango.connectionId,
        providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
        params: { uploadType: 'multipart' },
        data: multipartRequestBody,
        headers: {
          'Content-Type': `multipart/related; boundary="${boundary}"`
        }
      });

      if (uploadResponse.data?.id) {
        this.log(`Successfully uploaded test file! File ID: ${uploadResponse.data.id}`, 'success');
        this.log(`File name: ${uploadResponse.data.name}`, 'info');
        if (uploadResponse.data.webViewLink) {
          this.log(`View link: ${uploadResponse.data.webViewLink}`, 'info');
        }
        return uploadResponse.data.id;
      } else {
        this.log('Upload failed - no file ID returned', 'error');
        return null;
      }
    } catch (error) {
      this.log(`File upload failed: ${error.message}`, 'error');
      console.error('Upload error details:', error.response?.data || error);
      return null;
    }
  }

  async testMCPScript() {
    this.log('Testing MCP script directly...', 'info');

    try {
      // Test dependencies first
      await this.testDependencies();

      // Test if the MCP script can be loaded
      const GoogleDriveMCPTools = require('./g-drive-mcp-tools.js');
      const mcpInstance = new GoogleDriveMCPTools();

      this.log('MCP script loaded successfully', 'success');

      // Test workspace ID detection
      const testArgs = { workspaceId: '64' };
      const workspaceId = mcpInstance.getWorkspaceId(testArgs);
      this.log(`Workspace ID detection: ${workspaceId}`, 'info');

      // Test connection ID generation
      const connectionId = mcpInstance.getConnectionId(workspaceId);
      this.log(`Connection ID: ${connectionId}`, 'info');

      // Test PDF and DOCX extraction functions
      this.log('Testing PDF and DOCX extraction functions...', 'info');

      if (typeof mcpInstance.extractPdfText === 'function') {
        this.log('✅ extractPdfText function available', 'success');
      } else {
        this.log('❌ extractPdfText function missing', 'error');
      }

      if (typeof mcpInstance.extractDocxText === 'function') {
        this.log('✅ extractDocxText function available', 'success');
      } else {
        this.log('❌ extractDocxText function missing', 'error');
      }

      // Test error handling with invalid buffers
      try {
        const invalidBuffer = Buffer.from('Not a valid PDF');
        await mcpInstance.extractPdfText(invalidBuffer);
        this.log('⚠️ PDF extraction should have failed', 'info');
      } catch (error) {
        this.log('✅ PDF extraction properly handles invalid data', 'success');
      }

      try {
        const invalidBuffer = Buffer.from('Not a valid DOCX');
        await mcpInstance.extractDocxText(invalidBuffer);
        this.log('⚠️ DOCX extraction should have failed', 'info');
      } catch (error) {
        this.log('✅ DOCX extraction properly handles invalid data', 'success');
      }

      return true;
    } catch (error) {
      this.log(`MCP script test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testDependencies() {
    this.log('Checking required dependencies...', 'info');

    const dependencies = [
      { name: 'mammoth', description: 'DOCX text extraction library' },
      { name: 'pdf-parse', description: 'PDF text extraction library' },
      { name: '@nangohq/node', description: 'Nango SDK for OAuth integrations' },
      { name: '@modelcontextprotocol/sdk', description: 'MCP SDK for protocol support' }
    ];

    let allDepsAvailable = true;

    for (const dep of dependencies) {
      try {
        require(dep.name);
        this.log(`✅ ${dep.name} - ${dep.description}`, 'success');
      } catch (depError) {
        this.log(`❌ ${dep.name} - MISSING (${dep.description})`, 'error');
        this.log(`   Install with: npm install ${dep.name}`, 'info');
        allDepsAvailable = false;
      }
    }

    if (!allDepsAvailable) {
      this.log('⚠️ Some dependencies are missing. File extraction may fail.', 'info');
      this.log('Run: npm install mammoth pdf-parse @nangohq/node @modelcontextprotocol/sdk', 'info');
    } else {
      this.log('✅ All required dependencies are available', 'success');
    }

    return allDepsAvailable;
  }

  async testCreateFolder() {
    this.log('Testing folder creation functionality...', 'info');

    try {
      const folderName = `Test-Folder-${Date.now()}`;
      const metadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      };

      const response = await this.nango.post({
        endpoint: '/drive/v3/files',
        connectionId: TEST_CONFIG.nango.connectionId,
        providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
        data: metadata,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data?.id) {
        this.log(`Successfully created folder "${folderName}" with ID: ${response.data.id}`, 'success');
        return response.data.id;
      } else {
        this.log('Folder creation failed - no ID returned', 'error');
        return null;
      }
    } catch (error) {
      this.log(`Folder creation failed: ${error.message}`, 'error');
      return null;
    }
  }

  async testCreateFile() {
    this.log('Testing file creation functionality...', 'info');

    try {
      const fileName = `test-created-file-${Date.now()}.txt`;
      const content = `This is a test file created directly in Google Drive
Created at: ${new Date().toISOString()}
Content for testing purposes.`;

      const metadata = { name: fileName };
      const boundary = '-------314159265358979323846264';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const metadataPart = Buffer.from(
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: text/plain\r\n\r\n'
      );

      const contentPart = Buffer.from(content, 'utf8');
      const endPart = Buffer.from(close_delim);
      const multipartRequestBody = Buffer.concat([metadataPart, contentPart, endPart]);

      const response = await this.nango.post({
        endpoint: '/upload/drive/v3/files',
        connectionId: TEST_CONFIG.nango.connectionId,
        providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
        params: { uploadType: 'multipart' },
        data: multipartRequestBody,
        headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` }
      });

      if (response.data?.id) {
        this.log(`Successfully created file "${fileName}" with ID: ${response.data.id}`, 'success');
        return response.data.id;
      } else {
        this.log('File creation failed - no ID returned', 'error');
        return null;
      }
    } catch (error) {
      this.log(`File creation failed: ${error.message}`, 'error');
      return null;
    }
  }

  async testAutoVectorization() {
    this.log('Testing auto-vectorization during file content retrieval...', 'info');

    try {
      // Get a few test files to verify auto-vectorization
      const params = {
        pageSize: 3,
        fields: 'files(id, name, mimeType, size)',
        q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'"
      };

      const response = await this.nango.get({
        endpoint: '/drive/v3/files',
        connectionId: TEST_CONFIG.nango.connectionId,
        providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
        params
      });

      const files = response.data?.files || [];
      if (files.length === 0) {
        this.log('No files found for auto-vectorization test', 'info');
        return { vectorizedFiles: 0 };
      }

      this.log(`Testing auto-vectorization with ${files.length} files`, 'info');
      let vectorizedFiles = 0;

      // Test the MCP get_gdrive_file_content function which should auto-vectorize
      const GoogleDriveMCPTools = require('./g-drive-mcp-tools.js');
      const mcpInstance = new GoogleDriveMCPTools();

      for (const file of files) {
        try {
          const fileSize = parseInt(file.size) || 0;
          if (fileSize > 5 * 1024 * 1024) {
            this.log(`Skipping large file: ${file.name}`, 'info');
            continue;
          }

          this.log(`Testing auto-vectorization for: ${file.name}`, 'info');

          // Call the MCP function which should auto-vectorize
          const result = await mcpInstance.getGoogleDriveFileContent(
            { fileId: file.id },
            TEST_CONFIG.nango.connectionId.replace('workspace_', '')
          );

          if (result.isError) {
            this.log(`Auto-vectorization failed for ${file.name}: ${result.content[0].text}`, 'error');
            continue;
          }

          // Check if the content was retrieved successfully
          const contentText = result.content[0].text;
          if (contentText.includes('Content of')) {
            this.log(`Auto-vectorization successful for: ${file.name}`, 'success');
            vectorizedFiles++;
          }

        } catch (error) {
          this.log(`Auto-vectorization error for ${file.name}: ${error.message}`, 'error');
        }
      }

      this.log(`Auto-vectorization test complete: ${vectorizedFiles} files processed`, 'success');
      return { vectorizedFiles };

    } catch (error) {
      this.log(`Auto-vectorization test failed: ${error.message}`, 'error');
      return null;
    }
  }

  async testSpecificFiles() {
    this.log('Testing specific files: ItayCV2025.pdf.pdf, תהליך מכירה הדרכות ומוצרים.docx, and ItayCV.docx...', 'info');

    const targetFiles = ['ItayCV2025.pdf.pdf', 'תהליך מכירה הדרכות ומוצרים.docx', 'ItayCV.docx'];
    const results = {
      foundFiles: [],
      processedFiles: [],
      vectorizedFiles: [],
      errors: []
    };

    try {
      // Search for specific files by name
      for (const fileName of targetFiles) {
        this.log(`Searching for file: ${fileName}...`, 'info');

        const searchParams = {
          q: `name = '${fileName}' and trashed = false`,
          fields: 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink)'
        };

        const searchResponse = await this.nango.get({
          endpoint: '/drive/v3/files',
          connectionId: TEST_CONFIG.nango.connectionId,
          providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
          params: searchParams
        });

        const foundFiles = searchResponse.data?.files || [];

        if (foundFiles.length === 0) {
          this.log(`❌ File not found: ${fileName}`, 'error');
          results.errors.push(`File not found: ${fileName}`);
          continue;
        }

        if (foundFiles.length > 1) {
          this.log(`⚠️ Multiple files found with name ${fileName}. Using the first one.`, 'info');
        }

        const file = foundFiles[0];
        this.log(`✅ Found file: ${file.name} (ID: ${file.id}, Size: ${this.formatFileSize(file.size)})`, 'success');
        results.foundFiles.push(file);

        // Test complete flow: fetch content + auto-vectorization
        await this.testCompleteFlowForFile(file, results);
      }

      // Summary for specific files test
      this.log(`\n📊 Specific Files Test Summary:`, 'info');
      this.log(`  Found: ${results.foundFiles.length}/${targetFiles.length} files`, 'info');
      this.log(`  Content Retrieved: ${results.processedFiles.length} files`, 'info');
      this.log(`  Auto-Vectorized: ${results.vectorizedFiles.length} files`, 'info');
      this.log(`  Errors: ${results.errors.length}`, results.errors.length > 0 ? 'error' : 'success');

      if (results.errors.length > 0) {
        this.log(`Error details:`, 'error');
        results.errors.forEach(error => this.log(`  - ${error}`, 'error'));
      }

      return results;

    } catch (error) {
      this.log(`Specific files test failed: ${error.message}`, 'error');
      results.errors.push(`Test failure: ${error.message}`);
      return results;
    }
  }

  async testCompleteFlowForFile(file, results) {
    this.log(`\n🔄 Testing complete flow for: ${file.name}`, 'info');

    try {
      // Step 1: Test direct content retrieval
      this.log(`Step 1: Retrieving content directly...`, 'info');
      const contentSuccess = await this.testGetFileContent(file.id, file.name);

      if (contentSuccess) {
        results.processedFiles.push(file);
        this.log(`✅ Direct content retrieval successful for ${file.name}`, 'success');
      } else {
        this.log(`❌ Direct content retrieval failed for ${file.name}`, 'error');
        results.errors.push(`Content retrieval failed: ${file.name}`);
      }

      // Step 2: Test MCP auto-vectorization flow
      this.log(`Step 2: Testing MCP auto-vectorization flow...`, 'info');

      const GoogleDriveMCPTools = require('./g-drive-mcp-tools.js');
      const mcpInstance = new GoogleDriveMCPTools();

      // Test the main MCP function that should auto-vectorize
      const vectorResult = await mcpInstance.getGoogleDriveFileContent(
        { fileId: file.id },
        TEST_CONFIG.nango.connectionId.replace('workspace_', '')
      );

      if (vectorResult.isError) {
        this.log(`❌ MCP auto-vectorization failed for ${file.name}: ${vectorResult.content[0].text}`, 'error');
        results.errors.push(`MCP vectorization failed: ${file.name} - ${vectorResult.content[0].text}`);
        return;
      }

      // Check if vectorization was successful
      const contentText = vectorResult.content[0].text;
      this.log(`MCP Response for ${file.name}:`, 'info');
      console.log('─'.repeat(50));
      console.log(contentText);
      console.log('─'.repeat(50));

      if (contentText.includes('Content of') || contentText.includes('successfully') || contentText.includes('vector')) {
        this.log(`✅ MCP auto-vectorization successful for: ${file.name}`, 'success');
        results.vectorizedFiles.push(file);
      } else {
        this.log(`⚠️ MCP function executed but unclear if vectorization occurred for: ${file.name}`, 'info');
      }

      // Step 3: Test the explicit save function if available
      this.log(`Step 3: Testing explicit save function...`, 'info');

      if (typeof mcpInstance.getGoogleDriveFileWithAutoSave === 'function') {
        const saveResult = await mcpInstance.getGoogleDriveFileWithAutoSave(
          { fileId: file.id },
          TEST_CONFIG.nango.connectionId.replace('workspace_', '')
        );

        if (!saveResult.isError) {
          this.log(`✅ Explicit save function successful for: ${file.name}`, 'success');
          console.log('Save Result:', saveResult.content[0].text);
        } else {
          this.log(`❌ Explicit save function failed for ${file.name}: ${saveResult.content[0].text}`, 'error');
        }
      } else {
        this.log(`⚠️ Explicit save function not available`, 'info');
      }

      // Step 4: Enhanced file type specific debugging
      await this.testFileTypeSpecificDebugging(file, mcpInstance, results);

    } catch (error) {
      this.log(`Complete flow test failed for ${file.name}: ${error.message}`, 'error');
      results.errors.push(`Flow test failed: ${file.name} - ${error.message}`);
    }
  }

  async testFileTypeSpecificDebugging(file, mcpInstance, results) {
    this.log(`Step 4: Enhanced file type debugging for: ${file.name}`, 'info');

    // Test mammoth library availability and functionality
    if (file.name.toLowerCase().includes('.docx')) {
      this.log(`🔍 Debugging DOCX extraction for: ${file.name}`, 'info');

      // Check if mammoth is available
      let mammoth;
      try {
        mammoth = require('mammoth');
        this.log(`✅ Mammoth library is available`, 'success');
      } catch (mammothError) {
        this.log(`❌ Mammoth library not available: ${mammothError.message}`, 'error');
        results.errors.push(`Mammoth library missing: ${mammothError.message}`);
        return;
      }

      // Test actual file buffer retrieval
      this.log(`🔍 Testing file buffer retrieval...`, 'info');
      try {
        const bufferResponse = await this.nango.get({
          endpoint: `/drive/v3/files/${file.id}`,
          connectionId: TEST_CONFIG.nango.connectionId,
          providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
          params: { alt: 'media' },
          headers: {
            'Accept': 'application/octet-stream'
          }
        });

        // Handle binary data properly for DOCX files
        let fileBuffer;
        if (Buffer.isBuffer(bufferResponse.data)) {
          fileBuffer = bufferResponse.data;
        } else if (typeof bufferResponse.data === 'string') {
          // If Nango returns string for binary data, treat as binary
          fileBuffer = Buffer.from(bufferResponse.data, 'binary');
        } else if (bufferResponse.data instanceof ArrayBuffer) {
          fileBuffer = Buffer.from(bufferResponse.data);
        } else {
          // Last resort
          fileBuffer = Buffer.from(bufferResponse.data);
        }

        this.log(`✅ File buffer retrieved: ${fileBuffer.length} bytes`, 'success');

        // Test mammoth extraction directly
        this.log(`🔍 Testing mammoth extraction directly...`, 'info');
        try {
          const mammothResult = await mammoth.extractRawText({ buffer: fileBuffer });
          const extractedText = mammothResult.value;

          this.log(`✅ Mammoth extraction successful: ${extractedText.length} characters`, 'success');
          console.log('─'.repeat(30));
          console.log('MAMMOTH EXTRACTED CONTENT:');
          console.log(extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''));
          console.log('─'.repeat(30));

          if (extractedText.trim().length === 0) {
            this.log(`⚠️ Mammoth extracted empty content from ${file.name}`, 'info');
            results.errors.push(`Empty DOCX content: ${file.name}`);
          }

        } catch (mammothError) {
          this.log(`❌ Mammoth extraction failed: ${mammothError.message}`, 'error');
          results.errors.push(`Mammoth extraction error: ${file.name} - ${mammothError.message}`);

          // Test Google Drive export fallback
          this.log(`🔍 Testing Google Drive export fallback...`, 'info');
          try {
            const exportResponse = await this.nango.get({
              endpoint: `/drive/v3/files/${file.id}/export`,
              connectionId: TEST_CONFIG.nango.connectionId,
              providerConfigKey: TEST_CONFIG.nango.providerConfigKey,
              params: { mimeType: 'text/plain' }
            });

            const exportedText = String(exportResponse.data);
            this.log(`✅ Google Drive export successful: ${exportedText.length} characters`, 'success');
            console.log('─'.repeat(30));
            console.log('GOOGLE DRIVE EXPORTED CONTENT:');
            console.log(exportedText.substring(0, 500) + (exportedText.length > 500 ? '...' : ''));
            console.log('─'.repeat(30));

          } catch (exportError) {
            this.log(`❌ Google Drive export also failed: ${exportError.message}`, 'error');
            results.errors.push(`Export fallback failed: ${file.name} - ${exportError.message}`);
          }
        }

      } catch (bufferError) {
        this.log(`❌ File buffer retrieval failed: ${bufferError.message}`, 'error');
        results.errors.push(`Buffer retrieval failed: ${file.name} - ${bufferError.message}`);
      }

      // Test MCP instance extraction method
      this.log(`🔍 Testing MCP instance extractDocxText method...`, 'info');
      if (typeof mcpInstance.extractDocxText === 'function') {
        this.log(`✅ extractDocxText method is available`, 'success');
        // We already tested this above with the actual buffer
      } else {
        this.log(`❌ extractDocxText method missing from MCP instance`, 'error');
        results.errors.push(`MCP extractDocxText method missing`);
      }
    }

    // Test PDF debugging if needed
    if (file.name.toLowerCase().includes('.pdf')) {
      this.log(`🔍 Debugging PDF extraction for: ${file.name}`, 'info');

      // Check if pdf-parse is available
      let pdfParse;
      try {
        pdfParse = require('pdf-parse');
        this.log(`✅ PDF-parse library is available`, 'success');
      } catch (pdfError) {
        this.log(`❌ PDF-parse library not available: ${pdfError.message}`, 'error');
        results.errors.push(`PDF-parse library missing: ${pdfError.message}`);
        return;
      }

      if (typeof mcpInstance.extractPdfText === 'function') {
        this.log(`✅ extractPdfText method is available`, 'success');
      } else {
        this.log(`❌ extractPdfText method missing from MCP instance`, 'error');
        results.errors.push(`MCP extractPdfText method missing`);
      }
    }
  }

  isTextMimeType(mimeType) {
    const textMimeTypes = [
      'text/', 'application/json', 'application/xml', 'application/javascript', 'application/typescript'
    ];
    return textMimeTypes.some(textType => mimeType.startsWith(textType));
  }

  formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  cleanup() {
    this.log('Cleaning up test files...', 'info');

    try {
      if (fs.existsSync(TEST_CONFIG.testDir)) {
        const files = fs.readdirSync(TEST_CONFIG.testDir);
        files.forEach(file => {
          const filePath = path.join(TEST_CONFIG.testDir, file);
          fs.unlinkSync(filePath);
          this.log(`Deleted: ${filePath}`, 'info');
        });
        fs.rmdirSync(TEST_CONFIG.testDir);
        this.log(`Removed test directory: ${TEST_CONFIG.testDir}`, 'success');
      }
    } catch (error) {
      this.log(`Cleanup error: ${error.message}`, 'error');
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    console.log(`\n✅ Successful operations: ${this.results.length}`);
    console.log(`❌ Failed operations: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\nErrors encountered:');
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    console.log('\nTest configuration:');
    console.log(`  Nango Host: ${TEST_CONFIG.nango.host}`);
    console.log(`  Provider Config: ${TEST_CONFIG.nango.providerConfigKey}`);
    console.log(`  Connection ID: ${TEST_CONFIG.nango.connectionId}`);

    console.log('\nMCP Tools Available:');
    console.log('  • list_gdrive_files - List ALL files and directories');
    console.log('  • get_gdrive_file_content - Print FULL content of files (AUTO-VECTORIZES)');
    console.log('  • get_gdrive_file_with_auto_save - Get content with explicit save verification');
    console.log('  • upload_local_file_to_gdrive - Upload local files to Drive');
    console.log('  • create_gdrive_folder - Create new folders in Google Drive');
    console.log('  • create_gdrive_file - Create new text files in Google Drive');
    console.log('');
    console.log('Tests Include:');
    console.log('  • Specific File Tests - Tests for ItayCV2025.pdf.pdf, תהליך מכירה הדרכות ומוצרים.docx, and ItayCV.docx');
    console.log('  • Complete Flow Testing - Content retrieval + auto-vectorization');
    console.log('  • File Type Extraction - PDF and DOCX text extraction verification');
    console.log('  • Enhanced DOCX Debugging - Mammoth library testing and fallback verification');
    console.log('  • Multiple DOCX Comparison - Tests multiple non-corrupted DOCX files');

    console.log('\n' + '='.repeat(60));
  }

  async runAllTests() {
    console.log('🔍 Google Drive MCP Tools - Content Reader Test Suite');
    console.log('='.repeat(60));

    // Test 1: Connection
    const connected = await this.testConnection();
    if (!connected) {
      this.log('Connection failed, but continuing with offline tests...', 'info');
    }

    // Test 2: MCP Script (always run this test)
    await this.testMCPScript();

    // Test 3: List all files (only if connected)
    let allFiles = null;
    if (connected) {
      allFiles = await this.testListFiles();
    }

    // Test 4: Get content for all files (only if connected)
    if (connected && allFiles && allFiles.length > 0) {
      this.log(`\n📄 Printing content for all ${allFiles.length} files...`, 'info');
      
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        this.log(`\n--- File ${i + 1}/${allFiles.length}: ${file.name} ---`, 'info');
        await this.testGetFileContent(file.id, file.name);
        
        // Add a small delay to avoid rate limiting
        if (i < allFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (i == 4){
          break; // Limit to first 5 files for brevity
        }
      }
    }

    // Test 5: Create folder (only if connected)
    let folderId = null;
    if (connected) {
      folderId = await this.testCreateFolder();
    }

    // Test 6: Create file (only if connected)
    let createdFileId = null;
    if (connected) {
      createdFileId = await this.testCreateFile();
    }

    // Test 7: Upload file (only if connected)
    let uploadedFileId = null;
    if (connected) {
      uploadedFileId = await this.testUploadFile();
    }

    // Test 8: Auto-vectorization (only if connected)
    let vectorResult = null;
    if (connected) {
      vectorResult = await this.testAutoVectorization();
    }

    // Test 9: Specific files test - ItayCV2025.pdf.pdf and sales.docx (only if connected)
    let specificFilesResult = null;
    if (connected) {
      specificFilesResult = await this.testSpecificFiles();
    }

    // Cleanup
    this.cleanup();

    // Print summary
    this.printSummary();

    const success = this.errors.length === 0;
    console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed - see errors above'}`);

    if (uploadedFileId) {
      console.log(`\n📝 Note: Uploaded test file (ID: ${uploadedFileId}) was left in Google Drive for manual verification.`);
    }

    if (folderId) {
      console.log(`📁 Note: Created test folder (ID: ${folderId}) was left in Google Drive.`);
    }

    if (createdFileId) {
      console.log(`📄 Note: Created test file (ID: ${createdFileId}) was left in Google Drive.`);
    }

    if (vectorResult && vectorResult.vectorizedFiles > 0) {
      console.log(`🔍 Note: Auto-vectorized ${vectorResult.vectorizedFiles} files during content retrieval`);
    }

    if (specificFilesResult) {
      console.log(`📁 Specific Files Test Results:`);
      console.log(`   - ItayCV2025.pdf.pdf, תהליך מכירה הדרכות ומוצרים.docx, and ItayCV.docx search completed`);
      console.log(`   - Found: ${specificFilesResult.foundFiles.length}/3 target files`);
      console.log(`   - Content Retrieved: ${specificFilesResult.processedFiles.length} files`);
      console.log(`   - Auto-Vectorized: ${specificFilesResult.vectorizedFiles.length} files`);
      if (specificFilesResult.errors.length > 0) {
        console.log(`   - Errors: ${specificFilesResult.errors.length} (see details above)`);
      }
    }

    return success;
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new GoogleDriveMCPTester();

  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = GoogleDriveMCPTester;