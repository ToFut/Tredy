#!/usr/bin/env node

/**
 * Universal Integration MCP v2
 * A truly intelligent integration that discovers and adapts to any API
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { Nango } = require('@nangohq/node');

class UniversalIntegrationMCP {
  constructor() {
    this.server = new Server(
      { name: 'universal-integration-v2', version: '2.0.0' },
      { capabilities: { tools: {} } }
    );

    this.nangoConfig = {
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    };

    // Cache for discovered endpoints and capabilities
    this.apiCache = new Map();
    this.capabilityCache = new Map();
    
    // Pattern library for common API structures
    this.patterns = {
      messaging: [
        { pattern: /message|chat|conversation|inbox/i, category: 'messaging' },
        { pattern: /send|reply|forward/i, category: 'messaging_action' }
      ],
      social: [
        { pattern: /post|status|update|feed|timeline/i, category: 'social' },
        { pattern: /like|comment|share|react/i, category: 'social_action' }
      ],
      contacts: [
        { pattern: /contact|connection|friend|follower/i, category: 'contacts' },
        { pattern: /profile|user|member|person/i, category: 'profile' }
      ],
      search: [
        { pattern: /search|find|query|lookup/i, category: 'search' },
        { pattern: /filter|sort|limit|page/i, category: 'search_param' }
      ],
      calendar: [
        { pattern: /event|meeting|appointment|schedule/i, category: 'calendar' },
        { pattern: /invite|attendee|reminder/i, category: 'calendar_action' }
      ],
      files: [
        { pattern: /file|document|upload|download/i, category: 'files' },
        { pattern: /folder|directory|drive/i, category: 'file_organization' }
      ]
    };

    this.setupUniversalTools();
  }

  /**
   * Dynamically discover API capabilities
   */
  async discoverCapabilities(provider, workspaceId) {
    const cacheKey = `${provider}_${workspaceId}`;
    
    // Check cache first
    if (this.capabilityCache.has(cacheKey)) {
      return this.capabilityCache.get(cacheKey);
    }

    const nango = new Nango(this.nangoConfig);
    const connectionId = `workspace_${workspaceId}`;
    
    const capabilities = {
      provider,
      discovered: new Date().toISOString(),
      endpoints: [],
      tools: []
    };

    try {
      // Try common discovery endpoints
      const discoveryEndpoints = [
        '/api/v1/openapi.json',
        '/api/v2/swagger.json',
        '/.well-known/api-endpoints',
        '/api/capabilities',
        '/api/schema'
      ];

      for (const endpoint of discoveryEndpoints) {
        try {
          const response = await nango.proxy({
            method: 'GET',
            endpoint,
            connectionId,
            providerConfigKey: provider
          });

          if (response.data) {
            capabilities.schema = response.data;
            capabilities.endpoints = this.parseApiSchema(response.data);
            break;
          }
        } catch (e) {
          // Try next endpoint
        }
      }

      // If no schema found, try intelligent probing
      if (capabilities.endpoints.length === 0) {
        capabilities.endpoints = await this.probeCommonEndpoints(provider, connectionId);
      }

      // Generate tools from discovered endpoints
      capabilities.tools = this.generateToolsFromEndpoints(capabilities.endpoints);
      
      // Cache the results
      this.capabilityCache.set(cacheKey, capabilities);
      
      return capabilities;

    } catch (error) {
      console.error(`[Universal] Failed to discover capabilities for ${provider}:`, error);
      return capabilities;
    }
  }

  /**
   * Intelligently probe common API patterns
   */
  async probeCommonEndpoints(provider, connectionId) {
    const endpoints = [];
    const nango = new Nango(this.nangoConfig);
    
    // Common API patterns to test
    const probes = [
      // User/Profile endpoints
      { method: 'GET', path: '/me', category: 'profile' },
      { method: 'GET', path: '/user', category: 'profile' },
      { method: 'GET', path: '/users/me', category: 'profile' },
      { method: 'GET', path: '/api/v1/me', category: 'profile' },
      { method: 'GET', path: '/api/v1/user', category: 'profile' },
      
      // Messaging endpoints
      { method: 'GET', path: '/messages', category: 'messaging' },
      { method: 'GET', path: '/conversations', category: 'messaging' },
      { method: 'GET', path: '/api/v1/messages', category: 'messaging' },
      { method: 'POST', path: '/messages/send', category: 'messaging' },
      
      // Social endpoints
      { method: 'GET', path: '/posts', category: 'social' },
      { method: 'GET', path: '/feed', category: 'social' },
      { method: 'GET', path: '/timeline', category: 'social' },
      { method: 'POST', path: '/posts', category: 'social' },
      
      // Contacts/Connections
      { method: 'GET', path: '/contacts', category: 'contacts' },
      { method: 'GET', path: '/connections', category: 'contacts' },
      { method: 'GET', path: '/friends', category: 'contacts' },
      
      // Search
      { method: 'GET', path: '/search', category: 'search' },
      { method: 'GET', path: '/api/search', category: 'search' },
      
      // Calendar/Events
      { method: 'GET', path: '/events', category: 'calendar' },
      { method: 'GET', path: '/calendar', category: 'calendar' },
      { method: 'POST', path: '/events', category: 'calendar' },
      
      // Files
      { method: 'GET', path: '/files', category: 'files' },
      { method: 'GET', path: '/documents', category: 'files' },
      { method: 'POST', path: '/upload', category: 'files' }
    ];

    for (const probe of probes) {
      try {
        const response = await nango.proxy({
          method: probe.method,
          endpoint: probe.path,
          connectionId,
          providerConfigKey: provider,
          // Use minimal params to test endpoint existence
          params: probe.method === 'GET' ? { limit: 1 } : {},
          // Short timeout for probing
          timeout: 3000
        });

        if (response.status < 400) {
          endpoints.push({
            method: probe.method,
            path: probe.path,
            category: probe.category,
            responsive: true,
            sampleResponse: response.data ? Object.keys(response.data).slice(0, 5) : []
          });
          console.error(`[Universal] ✓ Found ${probe.category} endpoint: ${probe.path}`);
        }
      } catch (error) {
        // Endpoint doesn't exist or requires different params
        if (error.response?.status === 405) {
          // Method not allowed means endpoint exists but wrong method
          endpoints.push({
            method: probe.method === 'GET' ? 'POST' : 'GET',
            path: probe.path,
            category: probe.category,
            responsive: false
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Parse API schema (OpenAPI/Swagger) into endpoints
   */
  parseApiSchema(schema) {
    const endpoints = [];
    
    // Handle OpenAPI 3.0
    if (schema.openapi && schema.paths) {
      for (const [path, methods] of Object.entries(schema.paths)) {
        for (const [method, spec] of Object.entries(methods)) {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
            endpoints.push({
              method: method.toUpperCase(),
              path,
              category: this.categorizeEndpoint(path, spec),
              description: spec.summary || spec.description,
              parameters: spec.parameters || [],
              requestBody: spec.requestBody,
              responses: spec.responses
            });
          }
        }
      }
    }
    
    // Handle Swagger 2.0
    else if (schema.swagger && schema.paths) {
      // Similar parsing for Swagger 2.0
    }
    
    return endpoints;
  }

  /**
   * Categorize endpoint based on path and operation
   */
  categorizeEndpoint(path, spec) {
    const fullText = `${path} ${spec.summary || ''} ${spec.description || ''}`;
    
    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const { pattern, category: subCategory } of patterns) {
        if (pattern.test(fullText)) {
          return subCategory || category;
        }
      }
    }
    
    return 'general';
  }

  /**
   * Generate MCP tools from discovered endpoints
   */
  generateToolsFromEndpoints(endpoints) {
    const tools = [];
    const toolMap = new Map();

    for (const endpoint of endpoints) {
      // Group similar endpoints into single tools
      const toolKey = `${endpoint.category}_${endpoint.method.toLowerCase()}`;
      
      if (!toolMap.has(toolKey)) {
        const tool = {
          name: this.generateToolName(endpoint),
          description: this.generateToolDescription(endpoint),
          category: endpoint.category,
          endpoints: [endpoint],
          inputSchema: this.generateInputSchema(endpoint)
        };
        toolMap.set(toolKey, tool);
        tools.push(tool);
      } else {
        toolMap.get(toolKey).endpoints.push(endpoint);
      }
    }

    return tools;
  }

  /**
   * Generate tool name from endpoint
   */
  generateToolName(endpoint) {
    const action = endpoint.method === 'GET' ? 'get' : 
                   endpoint.method === 'POST' ? 'create' :
                   endpoint.method === 'PUT' ? 'update' :
                   endpoint.method === 'DELETE' ? 'delete' : 'manage';
    
    return `${action}_${endpoint.category}`;
  }

  /**
   * Generate tool description
   */
  generateToolDescription(endpoint) {
    if (endpoint.description) return endpoint.description;
    
    const action = endpoint.method === 'GET' ? 'Retrieve' : 
                   endpoint.method === 'POST' ? 'Create' :
                   endpoint.method === 'PUT' ? 'Update' :
                   endpoint.method === 'DELETE' ? 'Delete' : 'Manage';
    
    return `${action} ${endpoint.category.replace('_', ' ')}`;
  }

  /**
   * Generate input schema from endpoint parameters
   */
  generateInputSchema(endpoint) {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    // Add common parameters
    if (endpoint.method === 'GET') {
      schema.properties.limit = { type: 'number', description: 'Maximum results', default: 10 };
      schema.properties.offset = { type: 'number', description: 'Skip results', default: 0 };
    }

    // Parse parameters from endpoint spec
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        schema.properties[param.name] = {
          type: param.schema?.type || 'string',
          description: param.description
        };
        if (param.required) {
          schema.required.push(param.name);
        }
      }
    }

    // Always add workspace ID
    schema.properties.workspaceId = { 
      type: 'string', 
      description: 'Workspace ID (auto-detected if not provided)' 
    };

    return schema;
  }

  /**
   * Setup universal tools that work for any integration
   */
  setupUniversalTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      // Extract context to determine which provider we're working with
      const context = request.params?.context || {};
      const provider = context.provider || process.env.PROVIDER || 'unknown';
      const workspaceId = context.workspaceId || '1';
      
      // Discover capabilities for this provider
      const capabilities = await this.discoverCapabilities(provider, workspaceId);
      
      // Return discovered tools plus universal tools
      const tools = [
        {
          name: 'discover_capabilities',
          description: 'Discover what this service can do',
          inputSchema: {
            type: 'object',
            properties: {
              provider: { type: 'string', description: 'Service provider name' },
              workspaceId: { type: 'string', description: 'Workspace ID' }
            }
          }
        },
        {
          name: 'universal_request',
          description: 'Make any API request to the connected service',
          inputSchema: {
            type: 'object',
            properties: {
              method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
              endpoint: { type: 'string', description: 'API endpoint path' },
              params: { type: 'object', description: 'Query parameters' },
              data: { type: 'object', description: 'Request body' },
              provider: { type: 'string', description: 'Service provider' },
              workspaceId: { type: 'string', description: 'Workspace ID' }
            },
            required: ['method', 'endpoint']
          }
        },
        ...capabilities.tools
      ];

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        switch (name) {
          case 'discover_capabilities':
            return await this.handleDiscoverCapabilities(args);
          case 'universal_request':
            return await this.handleUniversalRequest(args);
          default:
            // Handle dynamically discovered tools
            return await this.handleDynamicTool(name, args);
        }
      } catch (error) {
        console.error(`[Universal] Error in ${name}:`, error);
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}\n\nTip: Try 'discover_capabilities' first to see what's available.`
          }],
          isError: true
        };
      }
    });
  }

  /**
   * Handle capability discovery
   */
  async handleDiscoverCapabilities(args) {
    const provider = args.provider || process.env.PROVIDER || 'unknown';
    const workspaceId = args.workspaceId || '1';
    
    const capabilities = await this.discoverCapabilities(provider, workspaceId);
    
    return {
      content: [{
        type: 'text',
        text: `Discovered Capabilities for ${provider}:

Endpoints Found: ${capabilities.endpoints.length}
Tools Generated: ${capabilities.tools.length}

Categories:
${[...new Set(capabilities.endpoints.map(e => e.category))].map(c => `• ${c}`).join('\n')}

Available Tools:
${capabilities.tools.map(t => `• ${t.name}: ${t.description}`).join('\n')}

Sample Endpoints:
${capabilities.endpoints.slice(0, 5).map(e => 
  `• ${e.method} ${e.path} (${e.category})`
).join('\n')}

Use 'universal_request' to call any endpoint directly.`
      }]
    };
  }

  /**
   * Handle universal API request
   */
  async handleUniversalRequest(args) {
    const provider = args.provider || process.env.PROVIDER;
    const workspaceId = args.workspaceId || '1';
    const connectionId = `workspace_${workspaceId}`;
    
    const nango = new Nango(this.nangoConfig);
    
    try {
      const response = await nango.proxy({
        method: args.method,
        endpoint: args.endpoint,
        connectionId,
        providerConfigKey: provider,
        params: args.params,
        data: args.data
      });

      // Intelligent response formatting
      const formatted = this.formatResponse(response.data, args.endpoint);
      
      return {
        content: [{
          type: 'text',
          text: formatted
        }]
      };
    } catch (error) {
      // Intelligent error handling with suggestions
      return this.handleApiError(error, args);
    }
  }

  /**
   * Handle dynamically discovered tools
   */
  async handleDynamicTool(toolName, args) {
    // Find the tool in our cache
    const provider = args.provider || process.env.PROVIDER;
    const workspaceId = args.workspaceId || '1';
    const capabilities = await this.discoverCapabilities(provider, workspaceId);
    
    const tool = capabilities.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found. Run discover_capabilities first.`);
    }

    // Execute the appropriate endpoint
    const endpoint = tool.endpoints[0]; // Use first matching endpoint
    
    return this.handleUniversalRequest({
      method: endpoint.method,
      endpoint: endpoint.path,
      params: args,
      provider,
      workspaceId
    });
  }

  /**
   * Format API response intelligently
   */
  formatResponse(data, endpoint) {
    if (!data) return 'No data returned';
    
    // Detect response type and format accordingly
    if (Array.isArray(data)) {
      return `Found ${data.length} items:\n\n${data.slice(0, 10).map((item, i) => 
        `${i + 1}. ${this.summarizeObject(item)}`
      ).join('\n')}`;
    } else if (typeof data === 'object') {
      return `Response:\n${this.summarizeObject(data)}`;
    } else {
      return `Response: ${data}`;
    }
  }

  /**
   * Summarize object for display
   */
  summarizeObject(obj) {
    const important = ['id', 'name', 'title', 'subject', 'message', 'text', 'email', 'date', 'created', 'updated'];
    const summary = [];
    
    for (const key of important) {
      if (obj[key]) {
        summary.push(`${key}: ${obj[key]}`);
      }
    }
    
    if (summary.length === 0) {
      // Show first 3 properties if no important ones found
      summary.push(...Object.entries(obj).slice(0, 3).map(([k, v]) => 
        `${k}: ${typeof v === 'object' ? '[Object]' : v}`
      ));
    }
    
    return summary.join(', ');
  }

  /**
   * Handle API errors intelligently
   */
  handleApiError(error, request) {
    const status = error.response?.status;
    const suggestions = [];
    
    if (status === 404) {
      suggestions.push('• Try discover_capabilities to see available endpoints');
      suggestions.push('• The endpoint path might have changed');
      suggestions.push(`• Try common variations like /api/v1${request.endpoint} or /v2${request.endpoint}`);
    } else if (status === 401 || status === 403) {
      suggestions.push('• Check if the OAuth connection is still valid');
      suggestions.push('• This endpoint might require additional scopes');
      suggestions.push('• Try reconnecting the service');
    } else if (status === 400) {
      suggestions.push('• Check the request parameters');
      suggestions.push('• Some required fields might be missing');
      suggestions.push('• Try with minimal parameters first');
    }
    
    return {
      content: [{
        type: 'text',
        text: `API Error (${status || 'Unknown'}): ${error.response?.data?.message || error.message}

Suggestions:
${suggestions.join('\n')}

Request Details:
• Method: ${request.method}
• Endpoint: ${request.endpoint}
• Provider: ${request.provider}

Try 'discover_capabilities' to explore what's available.`
      }],
      isError: true
    };
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Universal Integration MCP v2 started - will discover capabilities dynamically');
  }
}

// Start the server
if (require.main === module) {
  const server = new UniversalIntegrationMCP();
  server.start().catch(error => {
    console.error('Failed to start Universal Integration MCP:', error);
    process.exit(1);
  });
}

module.exports = UniversalIntegrationMCP;