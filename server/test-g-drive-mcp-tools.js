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

require('dotenv').config();
const { Nango } = require('@nangohq/node');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  nango: {
    secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
    host: process.env.NANGO_HOST || 'https://api.nango.dev',
    providerConfigKey: process.env.NANGO_PROVIDER_CONFIG_KEY || 'google-drive',
    connectionId: process.env.NANGO_CONNECTION_ID || 'workspace_64'
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

      return true;
    } catch (error) {
      this.log(`MCP script test failed: ${error.message}`, 'error');
      return false;
    }
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
    console.log('  • get_gdrive_file_content - Print FULL content of files');
    console.log('  • upload_local_file_to_gdrive - Upload local files to Drive');

    console.log('\n' + '='.repeat(60));
  }

  async runAllTests() {
    console.log('🔍 Google Drive MCP Tools - Content Reader Test Suite');
    console.log('='.repeat(60));

    // Test 1: Connection
    const connected = await this.testConnection();
    if (!connected) {
      this.log('Cannot proceed without connection - check your Nango configuration', 'error');
      this.printSummary();
      return;
    }

    // Test 2: MCP Script
    await this.testMCPScript();

    // Test 3: List all files
    const allFiles = await this.testListFiles();

    // Test 4: Get content for all files
    if (allFiles && allFiles.length > 0) {
      this.log(`\n📄 Printing content for all ${allFiles.length} files...`, 'info');
      
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        this.log(`\n--- File ${i + 1}/${allFiles.length}: ${file.name} ---`, 'info');
        await this.testGetFileContent(file.id, file.name);
        
        // Add a small delay to avoid rate limiting
        if (i < allFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    // Test 6: Upload file
    const uploadedFileId = await this.testUploadFile();

    // Cleanup
    this.cleanup();

    // Print summary
    this.printSummary();

    const success = this.errors.length === 0;
    console.log(`\n${success ? '✅ All tests passed!' : '❌ Some tests failed - see errors above'}`);

    if (uploadedFileId) {
      console.log(`\n📝 Note: Uploaded test file (ID: ${uploadedFileId}) was left in Google Drive for manual verification.`);
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