#!/usr/bin/env node

/**
 * Force refresh MCP configurations for workspace 4
 */

const { MCPNangoBridge } = require('./utils/connectors/mcp-nango-bridge');

async function refreshMCPConfigs() {
  console.log('🔄 Refreshing MCP configurations for workspace 4...\n');
  
  const bridge = new MCPNangoBridge();
  
  try {
    // Force update for workspace 4
    await bridge.updateMCPServersForWorkspace(4);
    
    console.log('✅ MCP configurations updated!');
    console.log('\nThe following changes were made:');
    console.log('- Gmail: Now uses gmail-mcp-server.js');
    console.log('- Google Calendar: Now uses simple-google-calendar-mcp.js');
    console.log('\nRestart AnythingLLM or refresh the workspace to apply changes.');
    
  } catch (error) {
    console.error('❌ Error updating MCP configurations:', error);
  }
}

refreshMCPConfigs().catch(console.error);