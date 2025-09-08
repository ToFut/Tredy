// Direct test of workflow creator function
const path = require('path');

// Set up module paths
process.env.NODE_ENV = 'development';

// Load the workflow creator plugin
const { workflowCreator } = require('./server/utils/agents/aibitat/plugins/workflow-creator.js');

console.log('🧪 Testing Workflow Creator Plugin - Direct Function Call\n');
console.log('='.repeat(60));

// Create mock aibitat context
const mockAibitat = {
  conversationId: 'test-direct',
  introspect: (msg) => console.log(`📝 [Introspect] ${msg}`),
  sendWorkflowPreview: (data) => console.log('🎨 [Preview] Generated'),
  function: function(config) {
    // Store the function config
    this.functions = this.functions || {};
    this.functions[config.name] = config;
    console.log(`✅ Registered: ${config.name}`);
  }
};

// Initialize plugin
const plugin = workflowCreator.plugin();
plugin.setup(mockAibitat);

// Get the create_workflow function
const createWorkflowFn = mockAibitat.functions['create_workflow'];

if (!createWorkflowFn) {
  console.error('❌ create_workflow function not found!');
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('📋 TEST: Creating workflow from description');
console.log('='.repeat(60));

// Test the exact user request
const testDescription = "send email to segev@sinosciences.com then create report";

console.log(`\nInput: "${testDescription}"\n`);

// Call the function
createWorkflowFn.handler.call(mockAibitat, {
  description: testDescription,
  name: null
}).then(result => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULT:');
  console.log('='.repeat(60));
  
  if (typeof result === 'string') {
    console.log('\n✅ Function returned visual preview:\n');
    console.log(result);
  } else {
    console.log('❌ Unexpected result format:', result);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test completed successfully!');
  
}).catch(error => {
  console.error('\n❌ Test failed:', error);
  process.exit(1);
});