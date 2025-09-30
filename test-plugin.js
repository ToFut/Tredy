const plugins = require('./server/utils/agents/aibitat/plugins/index.js');

console.log('Available plugins:', Object.keys(plugins).filter(k => !k.includes('name')).slice(0, 20).join(', '));
console.log('\nProcurement plugin exists:', !!plugins.procurementOrchestrator);

if (plugins.procurementOrchestrator) {
  console.log('✅ Plugin name:', plugins.procurementOrchestrator.name);
} else {
  console.log('❌ Procurement plugin NOT found');
}