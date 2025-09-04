#!/usr/bin/env node

/**
 * Universal MCP Generator System
 * 
 * This is the master system that:
 * 1. Analyzes each connector deeply
 * 2. Generates comprehensive MCPs
 * 3. Connects OAuth
 * 4. Registers and verifies functionality
 */

const fs = require('fs').promises;
const path = require('path');
const { Nango } = require('@nangohq/node');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

class UniversalMCPGenerator {
  constructor() {
    this.nangoConfig = {
      secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    };
    
    this.nango = new Nango(this.nangoConfig);
    
    // Knowledge base of API patterns
    this.apiPatterns = {
      linkedin: {
        baseUrl: 'https://api.linkedin.com',
        apiVersion: 'v2',
        headers: {
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202401'
        },
        knownEndpoints: [
          { path: '/v2/userinfo', method: 'GET', category: 'profile' },
          { path: '/v2/ugcPosts', method: 'POST', category: 'posts' },
          { path: '/v2/messages', method: 'POST', category: 'messaging' },
          { path: '/v2/socialActions', method: 'GET', category: 'social' }
        ],
        limitations: {
          messaging: 'Read access restricted to partners',
          connections: 'List access removed from public API',
          search: 'Requires special permissions'
        }
      },
      slack: {
        baseUrl: 'https://slack.com/api',
        apiVersion: 'v1',
        knownEndpoints: [
          { path: '/conversations.list', method: 'GET', category: 'channels' },
          { path: '/chat.postMessage', method: 'POST', category: 'messaging' },
          { path: '/users.list', method: 'GET', category: 'users' },
          { path: '/files.upload', method: 'POST', category: 'files' }
        ]
      },
      github: {
        baseUrl: 'https://api.github.com',
        apiVersion: 'v3',
        headers: {
          'Accept': 'application/vnd.github.v3+json'
        },
        knownEndpoints: [
          { path: '/user', method: 'GET', category: 'profile' },
          { path: '/repos', method: 'GET', category: 'repositories' },
          { path: '/issues', method: 'GET', category: 'issues' },
          { path: '/pulls', method: 'GET', category: 'pull_requests' }
        ]
      },
      shopify: {
        baseUrl: 'https://{shop}.myshopify.com/admin/api',
        apiVersion: '2024-01',
        knownEndpoints: [
          { path: '/products.json', method: 'GET', category: 'products' },
          { path: '/orders.json', method: 'GET', category: 'orders' },
          { path: '/customers.json', method: 'GET', category: 'customers' },
          { path: '/inventory_items.json', method: 'GET', category: 'inventory' }
        ]
      },
      'google-drive': {
        baseUrl: 'https://www.googleapis.com/drive',
        apiVersion: 'v3',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        knownEndpoints: [
          { path: '/v3/files', method: 'GET', category: 'files', description: 'List files and folders' },
          { path: '/v3/files', method: 'POST', category: 'files', description: 'Create/upload files' },
          { path: '/v3/files/{fileId}', method: 'GET', category: 'files', description: 'Get file metadata' },
          { path: '/v3/files/{fileId}', method: 'PATCH', category: 'files', description: 'Update file metadata' },
          { path: '/v3/files/{fileId}', method: 'DELETE', category: 'files', description: 'Delete file' },
          { path: '/v3/files/{fileId}/copy', method: 'POST', category: 'files', description: 'Copy file' },
          { path: '/v3/files/{fileId}/permissions', method: 'GET', category: 'sharing', description: 'List permissions' },
          { path: '/v3/files/{fileId}/permissions', method: 'POST', category: 'sharing', description: 'Share file' },
          { path: '/v3/files/{fileId}/export', method: 'GET', category: 'export', description: 'Export Google Docs/Sheets' },
          { path: '/v3/about', method: 'GET', category: 'account', description: 'Get Drive info' },
          { path: '/v3/changes', method: 'GET', category: 'sync', description: 'Get changes for sync' },
          { path: '/v3/changes/watch', method: 'POST', category: 'sync', description: 'Watch for changes' }
        ],
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive.metadata'
        ],
        features: {
          fileOperations: ['list', 'upload', 'download', 'delete', 'copy', 'move'],
          sharing: ['share', 'unshare', 'permissions'],
          sync: ['changes', 'watch', 'webhooks'],
          export: ['docs', 'sheets', 'slides', 'pdf'],
          search: ['content', 'metadata', 'fulltext']
        }
      }
    };
  }

  /**
   * Main flow: Analyze → Generate → Connect → Verify
   */
  async generateMCPForService(serviceName, workspaceId) {
    console.log(`\n🚀 Generating Comprehensive MCP for ${serviceName}\n`);
    
    try {
      // Step 1: Deep Analysis
      console.log('1️⃣ Analyzing API...');
      const analysis = await this.deepAnalyzeAPI(serviceName, workspaceId);
      
      // Step 2: Generate MCP
      console.log('2️⃣ Generating MCP...');
      const mcpPath = await this.generateComprehensiveMCP(serviceName, analysis);
      
      // Step 3: Connect OAuth
      console.log('3️⃣ Connecting OAuth...');
      const oauthStatus = await this.verifyOAuthConnection(serviceName, workspaceId);
      
      // Step 4: Register MCP
      console.log('4️⃣ Registering MCP...');
      await this.registerMCP(serviceName, mcpPath, workspaceId);
      
      // Step 5: Verify Functionality
      console.log('5️⃣ Verifying functionality...');
      const verification = await this.verifyMCPFunctionality(serviceName, workspaceId);
      
      return {
        success: true,
        service: serviceName,
        mcpPath,
        analysis,
        oauthStatus,
        verification
      };
      
    } catch (error) {
      console.error(`Failed to generate MCP for ${serviceName}:`, error);
      return {
        success: false,
        service: serviceName,
        error: error.message
      };
    }
  }

  /**
   * Step 1: Deep API Analysis
   */
  async deepAnalyzeAPI(serviceName, workspaceId) {
    const analysis = {
      service: serviceName,
      timestamp: new Date().toISOString(),
      endpoints: [],
      capabilities: [],
      limitations: [],
      authentication: {},
      dataModels: {},
      rateLimits: {},
      bestPractices: []
    };
    
    const connectionId = `workspace_${workspaceId}`;
    
    // Use known patterns
    const patterns = this.apiPatterns[serviceName] || {};
    
    // Test authentication
    try {
      const authTest = await this.nango.getConnection(
        serviceName,
        connectionId
      );
      analysis.authentication = {
        type: 'OAuth2',
        status: 'connected',
        scopes: authTest.credentials?.scope?.split(' ') || [],
        expiresAt: authTest.credentials?.expires_at
      };
    } catch (error) {
      analysis.authentication = {
        type: 'OAuth2',
        status: 'disconnected',
        error: error.message
      };
    }
    
    // Probe endpoints comprehensively
    if (patterns.knownEndpoints) {
      for (const endpoint of patterns.knownEndpoints) {
        const endpointAnalysis = await this.analyzeEndpoint(
          serviceName,
          endpoint,
          connectionId
        );
        analysis.endpoints.push(endpointAnalysis);
      }
    }
    
    // Discover additional endpoints
    const discovered = await this.discoverEndpoints(serviceName, connectionId);
    analysis.endpoints.push(...discovered);
    
    // Analyze rate limits
    analysis.rateLimits = await this.detectRateLimits(serviceName, connectionId);
    
    // Determine capabilities
    analysis.capabilities = this.determineCapabilities(analysis.endpoints);
    
    // Document limitations
    analysis.limitations = patterns.limitations || {};
    
    // Extract data models
    analysis.dataModels = await this.extractDataModels(analysis.endpoints);
    
    // Generate best practices
    analysis.bestPractices = this.generateBestPractices(analysis);
    
    return analysis;
  }

  /**
   * Analyze individual endpoint deeply
   */
  async analyzeEndpoint(serviceName, endpoint, connectionId) {
    const result = {
      ...endpoint,
      working: false,
      responseSchema: null,
      requiredParams: [],
      optionalParams: [],
      examples: [],
      errors: []
    };
    
    try {
      // Test with minimal params
      const response = await this.nango.proxy({
        method: endpoint.method,
        endpoint: endpoint.path,
        connectionId,
        providerConfigKey: serviceName,
        params: endpoint.method === 'GET' ? { limit: 1 } : {},
        headers: this.apiPatterns[serviceName]?.headers
      });
      
      result.working = true;
      result.statusCode = response.status;
      
      // Analyze response structure
      if (response.data) {
        result.responseSchema = this.analyzeDataStructure(response.data);
        result.examples.push({
          request: { method: endpoint.method, path: endpoint.path },
          response: this.truncateExample(response.data)
        });
      }
      
      // Test for required parameters
      if (endpoint.method === 'POST' || endpoint.method === 'PUT') {
        result.requiredParams = await this.discoverRequiredParams(
          serviceName,
          endpoint,
          connectionId
        );
      }
      
    } catch (error) {
      result.errors.push({
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      
      // Analyze error to understand requirements
      if (error.response?.status === 400) {
        result.requiredParams = this.extractRequiredFromError(error.response.data);
      }
    }
    
    return result;
  }

  /**
   * Discover endpoints through intelligent probing
   */
  async discoverEndpoints(serviceName, connectionId) {
    const discovered = [];
    const commonPaths = [
      '/api/v1/openapi',
      '/api/v2/swagger',
      '/.well-known/openapi',
      '/api-docs',
      '/swagger.json'
    ];
    
    for (const path of commonPaths) {
      try {
        const response = await this.nango.proxy({
          method: 'GET',
          endpoint: path,
          connectionId,
          providerConfigKey: serviceName
        });
        
        if (response.data && (response.data.openapi || response.data.swagger)) {
          // Parse OpenAPI/Swagger spec
          const endpoints = this.parseOpenAPISpec(response.data);
          discovered.push(...endpoints);
          break;
        }
      } catch (e) {
        // Continue trying other paths
      }
    }
    
    return discovered;
  }

  /**
   * Step 2: Generate Comprehensive MCP
   */
  async generateComprehensiveMCP(serviceName, analysis) {
    // Clean service name for valid JavaScript class name
    const cleanServiceName = serviceName.replace(/[-_\s]/g, '').toLowerCase();
    const className = `${cleanServiceName.charAt(0).toUpperCase()}${cleanServiceName.slice(1)}MCP`;
    const fileName = `${serviceName}-generated-mcp.js`;
    const filePath = path.join(__dirname, fileName);
    
    const mcpCode = `#!/usr/bin/env node

/**
 * ${serviceName.toUpperCase()} MCP - Auto-generated
 * Generated: ${new Date().toISOString()}
 * 
 * Capabilities:
 * ${analysis.capabilities.map(c => `  - ${c}`).join('\n * ')}
 * 
 * Limitations:
 * ${Object.entries(analysis.limitations).map(([k, v]) => `  - ${k}: ${v}`).join('\n * ')}
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');

class ${className} {
  constructor() {
    this.server = new Server(
      { name: '${serviceName}-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.nangoConfig = {
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev',
      providerConfigKey: '${serviceName}'
    };

    // Service-specific configuration
    this.apiConfig = ${JSON.stringify(this.apiPatterns[serviceName] || {}, null, 4)};
    
    // Discovered endpoints
    this.endpoints = ${JSON.stringify(analysis.endpoints.filter(e => e.working), null, 4)};
    
    // Rate limiting
    this.rateLimits = ${JSON.stringify(analysis.rateLimits, null, 4)};
    
    this.setupTools();
  }

  getWorkspaceId(args) {
    if (args?.workspaceId) return args.workspaceId;
    if (process.env.NANGO_CONNECTION_ID) {
      return process.env.NANGO_CONNECTION_ID.replace('workspace_', '');
    }
    return '1';
  }

  setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        ${this.generateToolDefinitions(analysis)}
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const workspaceId = this.getWorkspaceId(args);
      
      console.error(\`[${serviceName} MCP] Processing \${name} for workspace \${workspaceId}\`);
      
      try {
        ${this.generateToolHandlers(analysis)}
        
        // Fallback to generic handler
        return await this.handleGenericRequest(name, args, workspaceId);
      } catch (error) {
        console.error(\`[${serviceName} MCP] Error in \${name}:\`, error);
        return {
          content: [{ type: 'text', text: \`Error: \${error.message}\` }],
          isError: true
        };
      }
    });
  }

  ${this.generateToolImplementations(analysis)}

  async handleGenericRequest(toolName, args, workspaceId) {
    const endpoint = this.endpoints.find(e => 
      toolName === this.generateToolName(e)
    );
    
    if (!endpoint) {
      throw new Error(\`Unknown tool: \${toolName}\`);
    }
    
    const nango = new Nango(this.nangoConfig);
    const connectionId = \`workspace_\${workspaceId}\`;
    
    const response = await nango.proxy({
      method: endpoint.method,
      endpoint: endpoint.path,
      connectionId,
      providerConfigKey: this.nangoConfig.providerConfigKey,
      headers: this.apiConfig.headers,
      params: args
    });
    
    return {
      content: [{
        type: 'text',
        text: this.formatResponse(response.data)
      }]
    };
  }

  formatResponse(data) {
    if (!data) return 'No data returned';
    
    if (Array.isArray(data)) {
      return \`Found \${data.length} items:\\n\\n\${
        data.slice(0, 10).map((item, i) => 
          \`\${i + 1}. \${this.summarizeItem(item)}\`
        ).join('\\n')
      }\`;
    }
    
    return JSON.stringify(data, null, 2);
  }

  summarizeItem(item) {
    const key = item.name || item.title || item.id || item.email || 'Item';
    return \`\${key}: \${item.description || item.message || ''}\`;
  }

  generateToolName(endpoint) {
    const action = endpoint.method === 'GET' ? 'get' :
                   endpoint.method === 'POST' ? 'create' :
                   endpoint.method === 'PUT' ? 'update' :
                   endpoint.method === 'DELETE' ? 'delete' : 'manage';
    return \`\${action}_\${endpoint.category}\`;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('${serviceName} MCP Server started (auto-generated)');
  }
}

if (require.main === module) {
  const server = new ${className}();
  server.start().catch(error => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  });
}

module.exports = ${className};`;

    await fs.writeFile(filePath, mcpCode);
    console.log(`✅ Generated MCP at: ${filePath}`);
    
    return filePath;
  }

  /**
   * Generate tool definitions from analysis
   */
  generateToolDefinitions(analysis) {
    const tools = [];
    
    for (const endpoint of analysis.endpoints.filter(e => e.working)) {
      const toolName = this.generateToolNameFromEndpoint(endpoint);
      const tool = {
        name: toolName,
        description: this.generateDescription(endpoint),
        inputSchema: {
          type: 'object',
          properties: this.generateProperties(endpoint),
          required: endpoint.requiredParams || []
        }
      };
      
      tools.push(JSON.stringify(tool, null, 8));
    }
    
    return tools.join(',\n        ');
  }

  /**
   * Generate tool handlers
   */
  generateToolHandlers(analysis) {
    const handlers = [];
    
    for (const endpoint of analysis.endpoints.filter(e => e.working)) {
      const toolName = this.generateToolNameFromEndpoint(endpoint);
      handlers.push(`
        if (name === '${toolName}') {
          return await this.handle_${toolName}(args, workspaceId);
        }`);
    }
    
    return handlers.join('\n        ');
  }

  /**
   * Generate tool implementations
   */
  generateToolImplementations(analysis) {
    const implementations = [];
    
    for (const endpoint of analysis.endpoints.filter(e => e.working)) {
      const toolName = this.generateToolNameFromEndpoint(endpoint);
      const impl = `
  async handle_${toolName}(args, workspaceId) {
    const nango = new Nango(this.nangoConfig);
    const connectionId = \`workspace_\${workspaceId}\`;
    
    try {
      const response = await nango.proxy({
        method: '${endpoint.method}',
        endpoint: '${endpoint.path}',
        connectionId,
        providerConfigKey: this.nangoConfig.providerConfigKey,
        headers: this.apiConfig.headers,
        ${endpoint.method === 'GET' ? 'params: args' : 'data: args'}
      });
      
      return {
        content: [{
          type: 'text',
          text: this.formatResponse(response.data)
        }]
      };
    } catch (error) {
      ${this.generateErrorHandling(endpoint)}
    }
  }`;
      implementations.push(impl);
    }
    
    return implementations.join('\n');
  }

  /**
   * Step 3: Verify OAuth Connection
   */
  async verifyOAuthConnection(serviceName, workspaceId) {
    try {
      const connection = await this.nango.getConnection(
        serviceName,
        `workspace_${workspaceId}`
      );
      
      return {
        connected: true,
        connectionId: connection.connection_id,
        scopes: connection.credentials?.scope,
        expiresAt: connection.credentials?.expires_at
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        action: 'User needs to connect via UI'
      };
    }
  }

  /**
   * Step 4: Register MCP in system
   */
  async registerMCP(serviceName, mcpPath, workspaceId) {
    // 1. Register MCP Server
    const configPath = path.join(__dirname, 'storage/plugins/anythingllm_mcp_servers.json');
    
    // Read current config
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);
    
    // Add new MCP
    const mcpKey = `${serviceName}_ws${workspaceId}`;
    config.mcpServers[mcpKey] = {
      type: 'stdio',
      command: 'node',
      args: [mcpPath],
      env: {
        NANGO_SECRET_KEY: this.nangoConfig.secretKey,
        NANGO_HOST: this.nangoConfig.host,
        NANGO_CONNECTION_ID: `workspace_${workspaceId}`
      },
      anythingllm: {
        autoStart: true,
        workspaceAware: true,
        generated: true,
        generatedAt: new Date().toISOString()
      }
    };
    
    // Save config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Registered ${mcpKey} in MCP configuration`);
    
    // 2. Register as Connector in Workspace System
    try {
      const { ConnectorTokens } = require('./models/connectorTokens');
      const { Workspace } = require('./models/workspace');
      
      // Get workspace
      const workspace = await Workspace.get({ id: parseInt(workspaceId) });
      if (!workspace) {
        console.warn(`⚠️ Workspace ${workspaceId} not found, skipping connector registration`);
        return;
      }
      
      // Register connector
      const connectorResult = await ConnectorTokens.upsert({
        workspaceId: parseInt(workspaceId),
        provider: serviceName,
        status: 'connected',
        authMethod: 'oauth',
        nangoConnectionId: `workspace_${workspaceId}`,
        metadata: {
          mcpEnabled: true,
          mcpPath: mcpPath,
          generatedAt: new Date().toISOString(),
          capabilities: this.getServiceCapabilities(serviceName),
          syncEnabled: true
        }
      });
      
      if (connectorResult.connector) {
        console.log(`✅ Registered ${serviceName} as connector for workspace ${workspaceId}`);
      }
    } catch (error) {
      console.warn(`⚠️ Could not register connector: ${error.message}`);
      // Don't fail the whole process if connector registration fails
    }
  }
  
  /**
   * Get service capabilities for connector registration
   */
  getServiceCapabilities(serviceName) {
    const capabilities = {
      'google-drive': ['documents', 'files', 'folders', 'sync', 'sharing'],
      'gmail': ['emails', 'attachments', 'labels', 'threads'],
      'google-calendar': ['events', 'calendars', 'reminders'],
      'linkedin': ['posts', 'connections', 'messages', 'profile'],
      'slack': ['messages', 'channels', 'users', 'files'],
      'github': ['repos', 'issues', 'pulls', 'commits'],
      'shopify': ['products', 'orders', 'customers', 'inventory']
    };
    
    return capabilities[serviceName] || ['data'];
  }

  /**
   * Step 5: Verify MCP Functionality
   */
  async verifyMCPFunctionality(serviceName, workspaceId) {
    const verification = {
      service: serviceName,
      timestamp: new Date().toISOString(),
      tests: []
    };
    
    // Start the MCP server
    try {
      const { stdout, stderr } = await exec(
        `node ${serviceName}-generated-mcp.js --test`,
        { timeout: 5000 }
      );
      
      verification.tests.push({
        name: 'Server Start',
        passed: !stderr.includes('Failed'),
        output: stdout
      });
    } catch (error) {
      verification.tests.push({
        name: 'Server Start',
        passed: false,
        error: error.message
      });
    }
    
    // Test basic functionality
    const testEndpoint = this.apiPatterns[serviceName]?.knownEndpoints?.[0];
    if (testEndpoint) {
      try {
        const nango = new Nango(this.nangoConfig);
        const response = await nango.proxy({
          method: testEndpoint.method,
          endpoint: testEndpoint.path,
          connectionId: `workspace_${workspaceId}`,
          providerConfigKey: serviceName,
          params: { limit: 1 }
        });
        
        verification.tests.push({
          name: 'API Call Test',
          passed: response.status < 400,
          endpoint: testEndpoint.path
        });
      } catch (error) {
        verification.tests.push({
          name: 'API Call Test',
          passed: false,
          error: error.message
        });
      }
    }
    
    verification.allPassed = verification.tests.every(t => t.passed);
    return verification;
  }

  // Helper methods
  
  analyzeDataStructure(data) {
    const structure = {};
    
    if (Array.isArray(data)) {
      structure.type = 'array';
      structure.itemType = data.length > 0 ? this.analyzeDataStructure(data[0]) : 'unknown';
      structure.count = data.length;
    } else if (typeof data === 'object' && data !== null) {
      structure.type = 'object';
      structure.properties = {};
      for (const [key, value] of Object.entries(data)) {
        structure.properties[key] = typeof value;
      }
    } else {
      structure.type = typeof data;
    }
    
    return structure;
  }

  truncateExample(data, maxLength = 200) {
    const str = JSON.stringify(data);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }

  extractRequiredFromError(errorData) {
    const required = [];
    const errorStr = JSON.stringify(errorData);
    
    // Common patterns for required fields
    const patterns = [
      /required.*?['"]([\w_]+)['"]/gi,
      /missing.*?['"]([\w_]+)['"]/gi,
      /field ['"]([\w_]+)['"] is required/gi
    ];
    
    for (const pattern of patterns) {
      const matches = errorStr.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) required.push(match[1]);
      }
    }
    
    return [...new Set(required)];
  }

  parseOpenAPISpec(spec) {
    const endpoints = [];
    
    if (spec.paths) {
      for (const [path, methods] of Object.entries(spec.paths)) {
        for (const [method, details] of Object.entries(methods)) {
          if (['get', 'post', 'put', 'delete'].includes(method.toLowerCase())) {
            endpoints.push({
              path,
              method: method.toUpperCase(),
              category: this.categorizeFromPath(path),
              description: details.summary || details.description,
              parameters: details.parameters,
              requestBody: details.requestBody
            });
          }
        }
      }
    }
    
    return endpoints;
  }

  categorizeFromPath(path) {
    if (path.includes('message')) return 'messaging';
    if (path.includes('user') || path.includes('profile')) return 'users';
    if (path.includes('post') || path.includes('feed')) return 'posts';
    if (path.includes('file') || path.includes('upload')) return 'files';
    if (path.includes('channel') || path.includes('conversation')) return 'channels';
    return 'general';
  }

  async detectRateLimits(serviceName, connectionId) {
    // Make rapid requests to detect rate limiting
    const limits = {
      detected: false,
      requestsPerMinute: null,
      headers: {}
    };
    
    // This would need real implementation
    return limits;
  }

  determineCapabilities(endpoints) {
    const capabilities = new Set();
    
    for (const endpoint of endpoints) {
      if (endpoint.working) {
        if (endpoint.category === 'messaging') capabilities.add('Send and receive messages');
        if (endpoint.category === 'posts') capabilities.add('Create and manage posts');
        if (endpoint.category === 'users') capabilities.add('Access user profiles');
        if (endpoint.category === 'files') capabilities.add('Upload and manage files');
      }
    }
    
    return Array.from(capabilities);
  }

  generateBestPractices(analysis) {
    const practices = [];
    
    if (analysis.rateLimits.detected) {
      practices.push('Implement rate limiting to avoid API throttling');
    }
    
    if (analysis.authentication.type === 'OAuth2') {
      practices.push('Handle token refresh automatically');
    }
    
    if (analysis.endpoints.some(e => e.category === 'messaging')) {
      practices.push('Batch message operations when possible');
    }
    
    return practices;
  }

  async discoverRequiredParams(serviceName, endpoint, connectionId) {
    // Would test with various parameter combinations
    return [];
  }

  generateToolNameFromEndpoint(endpoint) {
    const action = endpoint.method === 'GET' ? 'get' :
                   endpoint.method === 'POST' ? 'create' :
                   endpoint.method === 'PUT' ? 'update' :
                   endpoint.method === 'DELETE' ? 'delete' : 'manage';
    return `${action}_${endpoint.category}`;
  }

  generateDescription(endpoint) {
    if (endpoint.description) return endpoint.description;
    
    const action = endpoint.method === 'GET' ? 'Retrieve' :
                   endpoint.method === 'POST' ? 'Create' :
                   endpoint.method === 'PUT' ? 'Update' :
                   endpoint.method === 'DELETE' ? 'Delete' : 'Manage';
    
    return `${action} ${endpoint.category}`;
  }

  generateProperties(endpoint) {
    const props = {
      workspaceId: {
        type: 'string',
        description: 'Workspace ID (auto-detected)'
      }
    };
    
    if (endpoint.method === 'GET') {
      props.limit = { type: 'number', default: 10, description: 'Maximum results' };
      props.offset = { type: 'number', default: 0, description: 'Skip results' };
    }
    
    // Add from endpoint analysis
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        props[param.name] = {
          type: param.type || 'string',
          description: param.description
        };
      }
    }
    
    return props;
  }

  generateErrorHandling(endpoint) {
    return `
      if (error.response?.status === 404) {
        return {
          content: [{
            type: 'text',
            text: 'Resource not found. The ${endpoint.category} endpoint may have moved or requires different parameters.'
          }],
          isError: true
        };
      } else if (error.response?.status === 403) {
        return {
          content: [{
            type: 'text',
            text: 'Access denied. This ${endpoint.category} endpoint requires additional permissions.'
          }],
          isError: true
        };
      }
      throw error;`;
  }

  async extractDataModels(endpoints) {
    const models = {};
    
    for (const endpoint of endpoints) {
      if (endpoint.responseSchema) {
        models[endpoint.category] = endpoint.responseSchema;
      }
    }
    
    return models;
  }
}

// CLI Interface
async function main() {
  const generator = new UniversalMCPGenerator();
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Universal MCP Generator

Usage: node universal-mcp-generator.js <service> <workspaceId>

Services: linkedin, slack, github, shopify, gmail, etc.

Example: node universal-mcp-generator.js linkedin 1
    `);
    process.exit(0);
  }
  
  const [service, workspaceId] = args;
  const result = await generator.generateMCPForService(service, workspaceId);
  
  if (result.success) {
    console.log('\n✅ MCP Generation Complete!');
    console.log(`Service: ${result.service}`);
    console.log(`MCP Path: ${result.mcpPath}`);
    console.log(`Endpoints: ${result.analysis.endpoints.length}`);
    console.log(`Capabilities: ${result.analysis.capabilities.join(', ')}`);
    console.log('\nNext Steps:');
    console.log('1. Restart AnythingLLM server');
    console.log('2. Connect via UI if not already connected');
    console.log('3. Test with @agent commands');
  } else {
    console.error('\n❌ MCP Generation Failed');
    console.error(`Error: ${result.error}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = UniversalMCPGenerator;