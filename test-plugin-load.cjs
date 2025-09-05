// Test if flow orchestrator plugin loads correctly
console.log('Testing flow orchestrator plugin loading...\n');

try {
  // Load plugins
  const plugins = require('./server/utils/agents/aibitat/plugins/index.js');
  
  console.log('All plugins loaded:', Object.keys(plugins));
  console.log('\n');
  
  // Check flow orchestrator
  console.log('flowOrchestrator exists:', !!plugins.flowOrchestrator);
  console.log('flowOrchestrator.name:', plugins.flowOrchestrator?.name);
  console.log('flowOrchestrator type:', typeof plugins.flowOrchestrator);
  
  if (plugins.flowOrchestrator) {
    console.log('flowOrchestrator keys:', Object.keys(plugins.flowOrchestrator));
    console.log('Has plugin function:', typeof plugins.flowOrchestrator.plugin === 'function');
  }
  
  // Check if it's in the alias list
  const hasAlias = plugins['flow-orchestrator'] === plugins.flowOrchestrator;
  console.log('Has alias "flow-orchestrator":', hasAlias);
  
} catch (error) {
  console.error('Error loading plugins:', error.message);
  console.error(error.stack);
}