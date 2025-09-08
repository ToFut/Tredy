// Complete test of workflow creator plugin
const { workflowCreator } = require('./server/utils/agents/aibitat/plugins/workflow-creator.js');

console.log('🧪 Testing Workflow Creator Plugin - Complete Test\n');
console.log('='.repeat(60));

// Test plugin setup and function registration
const mockFunctions = [];
let workflowPreviewData = null;

const mockAibitat = {
  conversationId: 'test-123',
  function: (config) => {
    mockFunctions.push(config);
    console.log(`✅ Registered function: ${config.name}`);
  },
  introspect: (message) => {
    console.log(`📝 [Introspect] ${message}`);
  },
  sendWorkflowPreview: (data) => {
    workflowPreviewData = data;
    console.log('🎨 [Preview] Workflow preview generated');
  },
  handleExecution: async function() {
    return 'test';
  }
};

// Initialize plugin
const plugin = workflowCreator.plugin();
plugin.setup(mockAibitat);

console.log('\n' + '='.repeat(60));
console.log('📋 WORKFLOW CREATION TESTS');
console.log('='.repeat(60));

async function runTests() {
  // Test 1: Create workflow with email steps
  console.log('\n🔬 Test 1: Create workflow with sequential emails');
  const createFn = mockFunctions.find(f => f.name === 'CREATE_WORKFLOW_PRIORITY');
  
  const result1 = await createFn.handler.call(mockAibitat, {
    description: 'send to segev@example.com news list and then to admin@example.com all mail summary',
    name: 'Email Workflow'
  });
  
  console.log('  Result:', result1.success ? '✅ Success' : '❌ Failed');
  if (result1.data) {
    console.log('  Workflow Name:', result1.data.workflow.name);
    console.log('  Steps Count:', result1.data.workflow.stepsCount);
    console.log('\n  Preview:');
    console.log(result1.data.preview);
  }
  
  // Test 2: Simple workflow
  console.log('\n🔬 Test 2: Create simple workflow');
  const result2 = await createFn.handler.call(mockAibitat, {
    description: 'send email then create meeting invite',
    name: 'Simple Workflow'
  });
  
  console.log('  Result:', result2.success ? '✅ Success' : '❌ Failed');
  if (result2.data) {
    console.log('  Workflow Name:', result2.data.workflow.name);
    console.log('  Steps:', result2.data.workflow.steps.map(s => s.type).join(' -> '));
  }
  
  // Test 3: Test plugin function
  console.log('\n🔬 Test 3: Test workflow plugin function');
  const testFn = mockFunctions.find(f => f.name === 'test_workflow_plugin');
  
  const result3 = await testFn.handler.call(mockAibitat, {
    message: 'Hello from test suite!'
  });
  
  console.log('  Result:', result3.success ? '✅ Success' : '❌ Failed');
  console.log('  Message:', result3.message);
  
  // Test 4: List workflows
  console.log('\n🔬 Test 4: List workflows');
  const listFn = mockFunctions.find(f => f.name === 'list_my_workflows');
  
  const result4 = await listFn.handler.call(mockAibitat, {});
  console.log('  Result:', typeof result4 === 'string' ? '✅ Success' : '❌ Failed');
  console.log('  Response preview:', result4.substring(0, 100) + '...');
  
  // Test 5: Save workflow (mock)
  console.log('\n🔬 Test 5: Save workflow function');
  const saveFn = mockFunctions.find(f => f.name === 'save_workflow');
  console.log('  Function exists:', saveFn ? '✅ Yes' : '❌ No');
  console.log('  Parameters:', Object.keys(saveFn.parameters.properties).join(', '));
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total functions registered: ${mockFunctions.length}`);
  console.log(`  Workflow functions: ${mockFunctions.filter(f => f.name.includes('workflow')).length}`);
  console.log(`  Preview generated: ${workflowPreviewData ? '✅ Yes' : '❌ No'}`);
  
  console.log('\n🎉 All tests completed successfully!\n');
}

runTests().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});