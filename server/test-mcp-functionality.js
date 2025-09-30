#!/usr/bin/env node

/**
 * Test MCP Server Functionality for g-drive-mcp-tools.js
 * This test simulates how AnythingLLM communicates with the MCP server via stdio
 */

const { spawn } = require('child_process');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env.development') });

// Test files to check
const TEST_FILES = [
  {
    name: 'sales.docx',
    fileId: '1vsXURMGRMUMfU8Sac5vU1CoG8phdxxLi',
    type: 'DOCX',
    workspaceId: '150'
  }
  // Add more test files here as needed
];

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  MCP SERVER FUNCTIONALITY TEST                           ║');
console.log('║  Testing: g-drive-mcp-tools.js                          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

class MCPServerTester {
  constructor() {
    this.requestId = 1;
    this.responseBuffer = '';
    this.pendingRequests = new Map();
    this.initialized = false;
  }

  async start() {
    console.log('🚀 Starting MCP server...\n');

    return new Promise((resolve, reject) => {
      this.mcpServer = spawn('node', [
        path.join(__dirname, 'g-drive-mcp-tools.js')
      ], {
        env: {
          ...process.env,
          NANGO_SECRET_KEY: process.env.NANGO_SECRET_KEY,
          NANGO_HOST: process.env.NANGO_HOST || 'https://api.nango.dev',
          NANGO_PROVIDER_CONFIG_KEY: 'google-drive',
          NANGO_CONNECTION_ID: 'workspace_150', // Override to use workspace 150
          STORAGE_DIR: path.join(__dirname, 'storage')
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.mcpServer.stdout.on('data', (data) => {
        this.handleStdout(data);
      });

      this.mcpServer.stderr.on('data', (data) => {
        const message = data.toString();
        // Show important logs
        if (message.includes('[GoogleDrive]') || message.includes('ERROR') || message.includes('FAIL')) {
          console.log('📋 [MCP LOG]:', message.trim());
        }
      });

      this.mcpServer.on('error', (error) => {
        console.error('❌ Failed to start MCP server:', error.message);
        reject(error);
      });

      this.mcpServer.on('close', (code) => {
        console.log(`\n🛑 MCP server exited with code ${code}\n`);
      });

      // Initialize
      this.initialize()
        .then(() => {
          console.log('✅ MCP server initialized successfully\n');
          this.initialized = true;
          resolve();
        })
        .catch((err) => {
          console.error('❌ MCP initialization failed:', err.message);
          reject(err);
        });
    });
  }

  handleStdout(data) {
    this.responseBuffer += data.toString();

    // Parse JSON-RPC messages line by line
    const lines = this.responseBuffer.split('\n');
    this.responseBuffer = lines.pop() || '';

    lines.forEach(line => {
      if (!line.trim()) return;

      try {
        const message = JSON.parse(line);

        // Handle responses
        if (message.id && this.pendingRequests.has(message.id)) {
          const { resolve, reject } = this.pendingRequests.get(message.id);
          this.pendingRequests.delete(message.id);

          if (message.error) {
            reject(new Error(JSON.stringify(message.error)));
          } else {
            resolve(message.result);
          }
        }
      } catch (err) {
        // Not JSON or already handled
      }
    });
  }

  sendRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });
      this.mcpServer.stdin.write(JSON.stringify(request) + '\n');

      // Timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Timeout waiting for ${method}`));
        }
      }, 30000);
    });
  }

  async initialize() {
    return this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'mcp-test-client',
        version: '1.0.0'
      }
    });
  }

  async listTools() {
    console.log('📋 Listing available MCP tools...\n');

    const result = await this.sendRequest('tools/list');
    const tools = result.tools || [];

    console.log(`Found ${tools.length} tools:\n`);
    tools.forEach((tool, i) => {
      console.log(`${i + 1}. ${tool.name}`);
      console.log(`   ${tool.description.substring(0, 70)}...`);
    });
    console.log('');

    return tools;
  }

  async callTool(name, args) {
    return this.sendRequest('tools/call', {
      name,
      arguments: args
    });
  }

  async testSearchFiles(fileName, workspaceId) {
    console.log('─'.repeat(60));
    console.log(`🔍 TEST: search_gdrive_files`);
    console.log(`   Searching for: "${fileName}"`);
    console.log(`   Workspace: ${workspaceId}`);
    console.log('─'.repeat(60));

    try {
      const result = await this.callTool('search_gdrive_files', {
        fileName,
        workspaceId
      });

      if (result.content && result.content.length > 0) {
        const text = result.content[0].text;

        // Check if it's an error
        if (text.includes('Could not') || text.includes('error') || text.includes('failed')) {
          console.log('❌ FAILED:', text.substring(0, 150));
          return { success: false, error: text };
        }

        console.log('✅ SUCCESS\n');
        console.log(text);
        console.log('');
        return { success: true, result: text };
      }

      console.log('❌ FAILED: No content returned\n');
      return { success: false, error: 'No content' };
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
      return { success: false, error: error.message };
    }
  }

  async testGetFileContent(fileId, fileName, workspaceId) {
    console.log('─'.repeat(60));
    console.log(`📄 TEST: get_gdrive_file_content`);
    console.log(`   File: "${fileName}"`);
    console.log(`   File ID: ${fileId}`);
    console.log(`   Workspace: ${workspaceId}`);
    console.log('─'.repeat(60));

    try {
      const result = await this.callTool('get_gdrive_file_content', {
        fileId,
        workspaceId
      });

      if (result.content && result.content.length > 0) {
        const text = result.content[0].text;

        // Check if it's an error
        if (text.includes('Could not') || text.includes('Unfortunately') || text.includes('extraction failed')) {
          console.log('❌ FAILED:', text.substring(0, 200));
          return { success: false, error: text };
        }

        console.log('✅ SUCCESS\n');
        console.log('Content length:', text.length, 'characters');
        console.log('\nFirst 500 characters:');
        console.log('┌' + '─'.repeat(58) + '┐');
        const lines = text.substring(0, 500).split('\n');
        lines.forEach(line => {
          console.log('│ ' + line.substring(0, 56).padEnd(56) + ' │');
        });
        console.log('└' + '─'.repeat(58) + '┘\n');

        return { success: true, contentLength: text.length, preview: text.substring(0, 500) };
      }

      console.log('❌ FAILED: No content returned\n');
      return { success: false, error: 'No content' };
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
      return { success: false, error: error.message };
    }
  }

  async testConvertDocumentToText(fileId, fileName, workspaceId) {
    console.log('─'.repeat(60));
    console.log(`🔄 TEST: convert_document_to_text`);
    console.log(`   File: "${fileName}"`);
    console.log(`   File ID: ${fileId}`);
    console.log(`   Workspace: ${workspaceId}`);
    console.log('─'.repeat(60));

    try {
      const result = await this.callTool('convert_document_to_text', {
        fileId,
        workspaceId
      });

      if (result.content && result.content.length > 0) {
        const text = result.content[0].text;

        // Check if it's an error
        if (text.includes('Could not') || text.includes('error') || text.includes('failed')) {
          console.log('❌ FAILED:', text.substring(0, 200));
          return { success: false, error: text };
        }

        console.log('✅ SUCCESS\n');
        console.log('Content length:', text.length, 'characters');
        console.log('\nFirst 300 characters:');
        console.log(text.substring(0, 300) + '...\n');

        return { success: true, contentLength: text.length };
      }

      console.log('❌ FAILED: No content returned\n');
      return { success: false, error: 'No content' };
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
      return { success: false, error: error.message };
    }
  }

  async testGetFileContentByName(fileName, workspaceId) {
    console.log('─'.repeat(60));
    console.log(`📝 TEST: get_gdrive_file_content_by_name`);
    console.log(`   File: "${fileName}"`);
    console.log(`   Workspace: ${workspaceId}`);
    console.log('─'.repeat(60));

    try {
      const result = await this.callTool('get_gdrive_file_content_by_name', {
        fileName,
        workspaceId
      });

      if (result.content && result.content.length > 0) {
        const text = result.content[0].text;

        // Check if it's an error
        if (text.includes('Could not') || text.includes('No file found') || text.includes('Multiple files')) {
          console.log('❌ FAILED:', text.substring(0, 200));
          return { success: false, error: text };
        }

        console.log('✅ SUCCESS\n');
        console.log('Content length:', text.length, 'characters\n');

        return { success: true, contentLength: text.length };
      }

      console.log('❌ FAILED: No content returned\n');
      return { success: false, error: 'No content' };
    } catch (error) {
      console.log('❌ FAILED:', error.message, '\n');
      return { success: false, error: error.message };
    }
  }

  async runTests() {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };

    try {
      // List available tools
      await this.listTools();

      // Test each file
      for (const file of TEST_FILES) {
        console.log('\n' + '═'.repeat(60));
        console.log(`TESTING FILE: ${file.name}`);
        console.log('═'.repeat(60) + '\n');

        // Test 1: Search for file
        results.total++;
        const searchResult = await this.testSearchFiles(file.name, file.workspaceId);
        results.tests.push({ name: `search_gdrive_files (${file.name})`, result: searchResult });
        if (searchResult.success) results.passed++;
        else results.failed++;

        // Test 2: Get file content
        results.total++;
        const contentResult = await this.testGetFileContent(file.fileId, file.name, file.workspaceId);
        results.tests.push({ name: `get_gdrive_file_content (${file.name})`, result: contentResult });
        if (contentResult.success) results.passed++;
        else results.failed++;

        // Test 3: Convert document to text (for DOCX/PDF)
        if (file.type === 'DOCX' || file.type === 'PDF') {
          results.total++;
          const convertResult = await this.testConvertDocumentToText(file.fileId, file.name, file.workspaceId);
          results.tests.push({ name: `convert_document_to_text (${file.name})`, result: convertResult });
          if (convertResult.success) results.passed++;
          else results.failed++;
        }

        // Test 4: Get file content by name
        results.total++;
        const byNameResult = await this.testGetFileContentByName(file.name, file.workspaceId);
        results.tests.push({ name: `get_gdrive_file_content_by_name (${file.name})`, result: byNameResult });
        if (byNameResult.success) results.passed++;
        else results.failed++;
      }

      // Print summary
      console.log('\n' + '═'.repeat(60));
      console.log('TEST SUMMARY');
      console.log('═'.repeat(60));
      console.log(`Total tests: ${results.total}`);
      console.log(`✅ Passed: ${results.passed}`);
      console.log(`❌ Failed: ${results.failed}`);
      console.log('─'.repeat(60));

      // Detailed results
      console.log('\nDetailed Results:');
      results.tests.forEach((test, i) => {
        const status = test.result.success ? '✅' : '❌';
        console.log(`${i + 1}. ${status} ${test.name}`);
        if (!test.result.success && test.result.error) {
          console.log(`   Error: ${test.result.error.substring(0, 80)}...`);
        }
      });

      console.log('═'.repeat(60) + '\n');

      return results.failed === 0;

    } catch (error) {
      console.error('\n❌ Test suite failed:', error.message);
      console.error(error.stack);
      return false;
    }
  }

  stop() {
    if (this.mcpServer) {
      this.mcpServer.kill();
    }
  }
}

async function main() {
  const tester = new MCPServerTester();

  try {
    await tester.start();

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = await tester.runTests();

    // Give time for any final logs
    await new Promise(resolve => setTimeout(resolve, 500));

    tester.stop();

    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
    tester.stop();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MCPServerTester;