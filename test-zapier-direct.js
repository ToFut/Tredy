#!/usr/bin/env node

// Direct test of Zapier MCP servers without AnythingLLM wrapper
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const servers = [
  {
    name: 'Zapier',
    url: 'https://mcp.zapier.com/api/mcp/s/NTdlYTE1NGYtYzI5OS00NmVhLTg2N2EtZjA3YWZiZDdjN2E1Ojg3MjNkNGFjLTI2MjItNDU0NS04MmE4LWRmNzg5ZDJhYTgzMQ==/mcp'
  },
  {
    name: 'GoogleDrive', 
    url: 'https://mcp.zapier.com/api/mcp/s/Y2UwYTJiMTItYThiOS00NTllLWEwNGUtODYxY2I1MjBhZjlhOjU1MWZkZTNhLWFlM2YtNGE1YS04OTdhLTNlODRhNzA2ZmY5OQ==/mcp'
  },
  {
    name: 'Facebook',
    url: 'https://mcp.zapier.com/api/mcp/s/NGY2YjM5NzItYWM2YS00ZTgzLTk1ZWItNWZhZjA5NTFkZjYxOmJlM2ZiYWM5LTEyNjUtNGM0Zi1iZjBkLWI3NjdlMTg4NDAxZg==/mcp'
  }
];

async function testServer(serverConfig) {
  console.log(`\n🔍 Testing ${serverConfig.name}...`);
  console.log(`📡 URL: ${serverConfig.url}`);
  
  try {
    // Create client
    const client = new Client(
      {
        name: `test-client-${serverConfig.name.toLowerCase()}`,
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Create SSE transport
    console.log('⚡ Creating SSE transport...');
    const transport = new SSEClientTransport(new URL(serverConfig.url));
    
    // Add event listeners for debugging
    transport.onopen = () => console.log('🔗 Transport opened');
    transport.onclose = () => console.log('❌ Transport closed');
    transport.onerror = (error) => console.log('🚨 Transport error:', error);
    transport.onmessage = (message) => console.log('📨 Message:', message.data.slice(0, 200) + '...');

    // Set connection timeout
    const connectionTimeout = 15000; // 15 seconds
    console.log(`⏱️  Setting ${connectionTimeout/1000}s connection timeout...`);

    const connectionPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Connection timeout after ${connectionTimeout/1000}s`)), connectionTimeout);
    });

    // Race connection vs timeout
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Connected successfully!');

    // Test basic functionality
    console.log('📋 Listing tools...');
    const toolsResult = await client.listTools();
    console.log(`🔧 Found ${toolsResult.tools?.length || 0} tools:`);
    
    if (toolsResult.tools) {
      toolsResult.tools.slice(0, 5).forEach(tool => {
        console.log(`  - ${tool.name}: ${tool.description?.slice(0, 80) || 'No description'}...`);
      });
      if (toolsResult.tools.length > 5) {
        console.log(`  ... and ${toolsResult.tools.length - 5} more tools`);
      }
    }

    // Test calling a tool if available
    if (toolsResult.tools && toolsResult.tools.length > 0) {
      const firstTool = toolsResult.tools[0];
      console.log(`\n🧪 Testing first tool: ${firstTool.name}`);
      
      try {
        // Create minimal arguments based on schema
        const args = {};
        if (firstTool.inputSchema?.properties) {
          Object.entries(firstTool.inputSchema.properties).forEach(([key, schema]) => {
            if (firstTool.inputSchema.required?.includes(key)) {
              // Provide minimal test values for required fields
              if (schema.type === 'string') {
                args[key] = 'test';
              } else if (schema.type === 'number') {
                args[key] = 1;
              } else if (schema.type === 'boolean') {
                args[key] = true;
              }
            }
          });
        }
        
        console.log(`📤 Calling with args:`, args);
        const toolResult = await client.callTool({
          name: firstTool.name,
          arguments: args
        });
        console.log('📥 Tool result:', JSON.stringify(toolResult, null, 2).slice(0, 500) + '...');
        
      } catch (toolError) {
        console.log('⚠️  Tool call error (expected for invalid args):', toolError.message);
      }
    }

    // Close connection
    await client.close();
    console.log('✅ Connection closed cleanly');
    
    return { success: true, error: null, toolCount: toolsResult.tools?.length || 0 };

  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('🔍 Error details:', {
      name: error.name,
      code: error.code,
      cause: error.cause?.message,
    });
    
    return { success: false, error: error.message, toolCount: 0 };
  }
}

async function testAllServers() {
  console.log('🚀 Starting direct MCP server tests...\n');
  
  const results = {};
  
  for (const server of servers) {
    const result = await testServer(server);
    results[server.name] = result;
    
    // Add delay between tests
    if (servers.indexOf(server) < servers.length - 1) {
      console.log('\n⏳ Waiting 2s before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n📊 SUMMARY RESULTS:');
  console.log('='.repeat(50));
  
  for (const [name, result] of Object.entries(results)) {
    const status = result.success ? '✅ WORKING' : '❌ FAILED';
    const tools = result.success ? `${result.toolCount} tools` : 'N/A';
    console.log(`${name.padEnd(12)}: ${status} (${tools})`);
    if (!result.success) {
      console.log(`${' '.repeat(14)} Error: ${result.error}`);
    }
  }
  
  console.log('='.repeat(50));
}

// Run tests
testAllServers()
  .then(() => {
    console.log('\n✅ All tests completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal test error:', error);
    process.exit(1);
  });