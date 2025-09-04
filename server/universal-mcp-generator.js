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
    
    // Universal patterns for API discovery (not service-specific)
    this.universalPatterns = {
      // Common OpenAPI/Swagger paths
      openApiPaths: [
        '/openapi.json', '/swagger.json', '/api-docs', '/.well-known/openapi',
        '/api/v1/openapi', '/api/v2/swagger', '/v1/api-docs', '/v2/api-docs'
      ],
      
      // Common API endpoint patterns to probe
      commonEndpoints: [
        '/api', '/api/v1', '/api/v2', '/api/v3', '/v1', '/v2', '/v3',
        '/users', '/user', '/me', '/profile', '/account',
        '/items', '/resources', '/data', '/list', '/search',
        '/files', '/documents', '/folders', '/media',
        '/messages', '/posts', '/comments', '/notifications',
        '/events', '/activities', '/logs', '/history',
        '/settings', '/config', '/preferences',
        '/products', '/services', '/catalog',
        '/orders', '/transactions', '/payments',
        '/customers', '/contacts', '/leads'
      ],
      
      // Method patterns for different operations
      methodPatterns: {
        'GET': ['list', 'read', 'fetch', 'search', 'query'],
        'POST': ['create', 'add', 'submit', 'send'],
        'PUT': ['update', 'replace', 'set'],
        'PATCH': ['modify', 'edit', 'change'],
        'DELETE': ['remove', 'delete', 'destroy']
      }
    };
    
    // Store learned patterns for services (builds over time)
    this.learnedPatterns = {};
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
      const verification = await this.verifyMCPFunctionality(serviceName, workspaceId, analysis);
      
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
    
    // Initialize API config for the service
    analysis.apiConfig = {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
    };
    
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
    
    // First try to discover OpenAPI/Swagger spec
    console.log(`[Universal MCP] Discovering API specification for ${serviceName}...`);
    const openApiSpec = await this.discoverOpenAPISpec(serviceName, connectionId);
    
    if (openApiSpec) {
      console.log(`[Universal MCP] Found OpenAPI spec for ${serviceName}`);
      const specEndpoints = this.parseOpenAPISpec(openApiSpec);
      for (const endpoint of specEndpoints) {
        const endpointAnalysis = await this.analyzeEndpoint(
          serviceName,
          endpoint,
          connectionId
        );
        analysis.endpoints.push(endpointAnalysis);
      }
      analysis.authentication.type = openApiSpec.components?.securitySchemes ? 
        Object.keys(openApiSpec.components.securitySchemes)[0] : 'OAuth2';
    } else {
      // Fallback to intelligent probing
      console.log(`[Universal MCP] No OpenAPI spec found, using intelligent probing...`);
      const discovered = await this.intelligentProbe(serviceName, connectionId);
      for (const endpoint of discovered) {
        const endpointAnalysis = await this.analyzeEndpoint(
          serviceName,
          endpoint,
          connectionId
        );
        analysis.endpoints.push(endpointAnalysis);
      }
    }
    
    // Analyze rate limits
    analysis.rateLimits = await this.detectRateLimits(serviceName, connectionId);
    
    // Determine capabilities
    analysis.capabilities = this.determineCapabilities(analysis.endpoints);
    
    // Document limitations based on analysis
    analysis.limitations = this.detectLimitations(analysis.endpoints);
    
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
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
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
   * Discover OpenAPI/Swagger specification
   */
  async discoverOpenAPISpec(serviceName, connectionId) {
    const specPaths = [
      '/openapi.json',
      '/swagger.json',
      '/api-docs',
      '/api/swagger.json',
      '/.well-known/openapi',
      '/api/v1/openapi',
      '/api/v2/swagger',
      '/docs/api.json',
      '/api-docs.json'
    ];
    
    for (const path of specPaths) {
      try {
        const response = await this.nango.proxy({
          method: 'GET',
          endpoint: path,
          connectionId,
          providerConfigKey: serviceName
        });
        
        if (response.data && (response.data.openapi || response.data.swagger || response.data.paths)) {
          console.log(`[Universal MCP] Found API spec at ${path}`);
          return response.data;
        }
      } catch (e) {
        // Continue trying other paths
      }
    }
    
    return null;
  }
  
  /**
   * Intelligent API probing when no spec is available
   */
  async intelligentProbe(serviceName, connectionId) {
    const discovered = [];
    
    // Service-specific patterns for common APIs
    const servicePatterns = {
      'google-drive': [
        { path: 'https://www.googleapis.com/drive/v3/files', method: 'GET', category: 'files' },
        { path: 'https://www.googleapis.com/drive/v3/about', method: 'GET', category: 'account' }
      ],
      'gmail': [
        { path: 'https://gmail.googleapis.com/gmail/v1/users/me/messages', method: 'GET', category: 'messages' },
        { path: 'https://gmail.googleapis.com/gmail/v1/users/me/profile', method: 'GET', category: 'profile' }
      ],
      'google-calendar': [
        { path: 'https://www.googleapis.com/calendar/v3/calendars/primary/events', method: 'GET', category: 'events' },
        { path: 'https://www.googleapis.com/calendar/v3/users/me/calendarList', method: 'GET', category: 'calendars' }
      ]
    };
    
    // Use service-specific patterns if available, otherwise use generic patterns
    const patterns = servicePatterns[serviceName] || [
      // REST patterns
      { path: '/api/users', method: 'GET', category: 'users' },
      { path: '/api/me', method: 'GET', category: 'auth' },
      { path: '/api/profile', method: 'GET', category: 'users' },
      { path: '/api/account', method: 'GET', category: 'account' },
      { path: '/api/files', method: 'GET', category: 'files' },
      { path: '/api/documents', method: 'GET', category: 'documents' },
      { path: '/api/items', method: 'GET', category: 'items' },
      { path: '/api/resources', method: 'GET', category: 'resources' },
      { path: '/api/events', method: 'GET', category: 'events' },
      { path: '/api/messages', method: 'GET', category: 'messages' },
      // Version patterns
      { path: '/v1/users', method: 'GET', category: 'users' },
      { path: '/v2/users', method: 'GET', category: 'users' },
      // Common endpoints
      { path: '/users', method: 'GET', category: 'users' },
      { path: '/files', method: 'GET', category: 'files' },
      { path: '/search', method: 'GET', category: 'search' },
      { path: '/status', method: 'GET', category: 'system' },
      { path: '/health', method: 'GET', category: 'system' }
    ];
    
    const commonPatterns = patterns;
    
    // Test each pattern
    for (const pattern of commonPatterns) {
      try {
        const response = await this.nango.proxy({
          method: pattern.method,
          endpoint: pattern.path,
          connectionId,
          providerConfigKey: serviceName,
          params: { limit: 1 }
        });
        
        if (response.status === 200) {
          console.log(`[Universal MCP] Found working endpoint: ${pattern.method} ${pattern.path}`);
          discovered.push({
            ...pattern,
            description: `${pattern.category} operations`,
            working: true
          });
          
          // If we found a base path, explore related CRUD operations
          if (pattern.method === 'GET') {
            const basePath = pattern.path.replace(/\/$/,'');
            discovered.push(
              { path: basePath, method: 'POST', category: pattern.category, description: `Create ${pattern.category}` },
              { path: `${basePath}/{id}`, method: 'GET', category: pattern.category, description: `Get ${pattern.category} by ID` },
              { path: `${basePath}/{id}`, method: 'PUT', category: pattern.category, description: `Update ${pattern.category}` },
              { path: `${basePath}/{id}`, method: 'DELETE', category: pattern.category, description: `Delete ${pattern.category}` }
            );
          }
        }
      } catch (error) {
        // Endpoint doesn't exist or requires auth, continue
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
    this.apiConfig = ${JSON.stringify(analysis.apiConfig || { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }, null, 4)};
    
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
  async verifyMCPFunctionality(serviceName, workspaceId, analysis = {}) {
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
    
    // Test basic functionality with first discovered endpoint
    const testEndpoint = analysis.endpoints?.[0];
    if (testEndpoint && testEndpoint.working) {
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
    // Use regex patterns for more flexible matching
    const patterns = {
      'messaging': /message|chat|conversation|comment|reply/i,
      'users': /user|profile|account|member|person|people|contact/i,
      'posts': /post|article|blog|content|feed|story|update/i,
      'files': /file|document|upload|attachment|media|asset|download/i,
      'channels': /channel|room|space|group|team|workspace/i,
      'events': /event|calendar|schedule|meeting|appointment/i,
      'tasks': /task|todo|issue|ticket|job|workflow/i,
      'storage': /drive|storage|folder|directory|bucket/i,
      'email': /mail|email|inbox|message/i,
      'payments': /payment|transaction|invoice|billing|subscription/i,
      'products': /product|item|catalog|inventory|sku/i,
      'orders': /order|purchase|cart|checkout/i,
      'analytics': /analytics|metrics|stats|report|insight/i,
      'auth': /auth|login|logout|token|session|oauth/i,
      'settings': /setting|config|preference|option/i
    };
    
    for (const [category, pattern] of Object.entries(patterns)) {
      if (pattern.test(path)) {
        return category;
      }
    }
    
    return 'general';
  }
  
  detectLimitations(endpoints) {
    const limitations = {};
    
    // Analyze endpoints to detect limitations
    const hasRateLimiting = endpoints.some(e => 
      e.errors?.some(err => err.status === 429)
    );
    
    if (hasRateLimiting) {
      limitations.rateLimit = 'Rate limiting detected - implement exponential backoff';
    }
    
    const hasPagination = endpoints.some(e => 
      e.responseSchema?.includes('next') || 
      e.responseSchema?.includes('cursor') ||
      e.responseSchema?.includes('page')
    );
    
    if (hasPagination) {
      limitations.pagination = 'API uses pagination - handle multiple requests for full data';
    }
    
    const requiresAuth = endpoints.some(e => 
      e.errors?.some(err => err.status === 401 || err.status === 403)
    );
    
    if (requiresAuth) {
      limitations.authentication = 'OAuth2 authentication required for all endpoints';
    }
    
    const hasComplexParams = endpoints.some(e => 
      e.requiredParams?.length > 3
    );
    
    if (hasComplexParams) {
      limitations.complexity = 'Some endpoints require multiple parameters';
    }
    
    return limitations;
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