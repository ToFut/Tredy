#!/usr/bin/env node

// Direct test of MCP server tools
import MCPCompatibilityLayer from './server/utils/MCP/index.js';

async function testMCPTools() {
  console.log('🔄 Testing MCP Tools...');
  
  try {
    const mcp = new MCPCompatibilityLayer();
    
    // Boot the servers
    await mcp.bootMCPServers();
    
    // Get the TestMCP server
    const testMcpServer = mcp.mcps['TestMCP'];
    
    if (!testMcpServer) {
      throw new Error('TestMCP server not found');
    }
    
    console.log('✅ TestMCP server found');
    
    // Test 1: Echo tool
    console.log('\n🔧 Testing echo tool...');
    try {
      const echoResult = await testMcpServer.callTool({
        name: 'echo',
        arguments: { text: 'Hello from AnythingLLM MCP test!' }
      });
      console.log('📤 Echo result:', JSON.stringify(echoResult, null, 2));
    } catch (error) {
      console.error('❌ Echo test failed:', error.message);
    }
    
    // Test 2: Get time tool
    console.log('\n🕐 Testing get_time tool...');
    try {
      const timeResult = await testMcpServer.callTool({
        name: 'get_time',
        arguments: {}
      });
      console.log('📅 Time result:', JSON.stringify(timeResult, null, 2));
    } catch (error) {
      console.error('❌ Time test failed:', error.message);
    }
    
    // Test 3: Calculate tool
    console.log('\n🧮 Testing calculate tool...');
    try {
      const calcResult = await testMcpServer.callTool({
        name: 'calculate',
        arguments: { expression: '(5 + 3) * 2' }
      });
      console.log('📊 Calculate result:', JSON.stringify(calcResult, null, 2));
    } catch (error) {
      console.error('❌ Calculate test failed:', error.message);
    }
    
    // Test 4: Calculate with error
    console.log('\n❗ Testing calculate with invalid expression...');
    try {
      const calcErrorResult = await testMcpServer.callTool({
        name: 'calculate',
        arguments: { expression: 'invalid + expression +' }
      });
      console.log('📊 Calculate error result:', JSON.stringify(calcErrorResult, null, 2));
    } catch (error) {
      console.error('❌ Expected error test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing MCP tools:', error);
    console.error(error.stack);
  }
}

// Run the test
testMCPTools().then(() => {
  console.log('\n✅ MCP tools test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});