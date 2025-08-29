const fs = require('fs');
const path = require('path');

// Test the MCP configuration parsing
const configPath = path.resolve(process.env.HOME, '.anythingllm/plugins/anythingllm_mcp_servers.json');
console.log('Reading config from:', configPath);

const configContent = fs.readFileSync(configPath, 'utf8');
console.log('Raw config:', configContent);

const config = JSON.parse(configContent);
console.log('\nParsed config:', JSON.stringify(config, null, 2));

// Test the server parsing logic
const servers = Object.entries(config.mcpServers).map(([name, server]) => ({
  name,
  server,
}));

console.log('\nServer definitions:');
servers.forEach(({ name, server }) => {
  console.log(`\n${name}:`);
  console.log('  Has command?', server.hasOwnProperty('command'));
  console.log('  Has url?', server.hasOwnProperty('url'));
  console.log('  Has type?', server.hasOwnProperty('type'));
  
  // Determine server type using the same logic as MCPHypervisor
  let serverType;
  if (server.hasOwnProperty('command')) {
    serverType = 'stdio';
  } else if (server.hasOwnProperty('url')) {
    serverType = 'http';
  } else {
    serverType = 'sse';
  }
  console.log('  Detected type:', serverType);
  
  // Validate based on type
  if (serverType === 'http') {
    if (!['sse', 'streamable'].includes(server?.type)) {
      console.log('  ❌ VALIDATION ERROR: MCP server type must have sse or streamable value.');
    } else {
      console.log('  ✅ Validation passed');
    }
  }
});

console.log('\n\nTotal servers found:', servers.length);