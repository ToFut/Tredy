#!/usr/bin/env node

// Direct test of MCP servers without needing auth
import MCPCompatibilityLayer from './server/utils/MCP/index.js';

async function testMCP() {
  console.log('🔄 Initializing MCP Compatibility Layer...');
  
  try {
    const mcp = new MCPCompatibilityLayer();
    
    console.log('📋 Loading MCP server configurations...');
    console.log('Config file:', mcp.configFilePath);
    
    // Check what servers are configured
    console.log('🖥️  Configured servers:', mcp.mcpServerConfigs.map(s => s.name));
    
    // Try to boot MCP servers
    console.log('⚡ Booting MCP servers...');
    const bootResults = await mcp.bootMCPServers();
    
    console.log('📊 Boot results:');
    for (const [name, result] of Object.entries(bootResults)) {
      console.log(`  ${name}: ${result.status} - ${result.message}`);
    }
    
    // Get server status
    console.log('\n🔍 Getting server status...');
    const servers = await mcp.servers();
    
    console.log('📈 Server status:');
    for (const server of servers) {
      console.log(`\n📦 ${server.name}:`);
      console.log(`  Running: ${server.running}`);
      console.log(`  Tools: ${server.tools.length}`);
      if (server.tools.length > 0) {
        server.tools.forEach(tool => {
          console.log(`    - ${tool.name}: ${tool.description}`);
        });
      }
      if (server.error) {
        console.log(`  Error: ${server.error}`);
      }
    }
    
    // Test TestMCP server specifically
    const testMcpServer = servers.find(s => s.name === 'TestMCP');
    if (testMcpServer && testMcpServer.running) {
      console.log('\n🧪 Testing TestMCP server...');
      
      // Try to convert tools to plugins
      const plugins = await mcp.convertServerToolsToPlugins('TestMCP');
      if (plugins) {
        console.log(`✅ Successfully converted ${plugins.length} tools to plugins:`);
        plugins.forEach(plugin => {
          console.log(`  - ${plugin.name}: ${plugin.description}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing MCP:', error);
    console.error(error.stack);
  }
}

// Run the test
testMCP().then(() => {
  console.log('\n✅ MCP test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});