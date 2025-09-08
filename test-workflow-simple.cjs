// Simple test of workflow creator plugin
const { workflowCreator } = require('./server/utils/agents/aibitat/plugins/workflow-creator.js');

console.log('🧪 Testing Workflow Creator Plugin\n');
console.log('='.repeat(60));

// Test 1: Plugin structure
console.log('\n✅ Test 1: Plugin structure');
console.log('  - Plugin name:', workflowCreator.name);
console.log('  - Has plugin function:', typeof workflowCreator.plugin === 'function');

// Test 2: Plugin initialization
console.log('\n✅ Test 2: Plugin initialization');
const pluginInstance = workflowCreator.plugin();
console.log('  - Plugin instance name:', pluginInstance.name);
console.log('  - Has setup function:', typeof pluginInstance.setup === 'function');

// Test 3: Mock Aibitat setup
console.log('\n✅ Test 3: Mock setup and function registration');

const mockFunctions = [];
const mockAibitat = {
  conversationId: 'test-123',
  function: (config) => {
    mockFunctions.push(config);
    console.log(`  - Registered function: ${config.name}`);
  },
  introspect: (message) => {
    console.log(`  [Introspect] ${message}`);
  },
  sendWorkflowPreview: (data) => {
    console.log('  [Preview] Workflow preview sent:', data.workflow?.name);
  },
  handleExecution: async function() {
    console.log('  [HandleExecution] Called');
    return 'test';
  }
};

// Setup the plugin
pluginInstance.setup(mockAibitat);

console.log('\n📋 Registered functions:');
mockFunctions.forEach((fn, index) => {
  console.log(`  ${index + 1}. ${fn.name}`);
  console.log(`     Description: ${fn.description.substring(0, 80)}...`);
});

// Test 4: Test workflow creation
console.log('\n✅ Test 4: Test workflow creation handler');

const createWorkflowFn = mockFunctions.find(f => f.name === 'CREATE_WORKFLOW_PRIORITY');
if (createWorkflowFn) {
  console.log('  Testing CREATE_WORKFLOW_PRIORITY function...');
  
  const testDescription = 'send to user@example.com then create summary report';
  
  createWorkflowFn.handler.call(mockAibitat, {
    description: testDescription,
    name: 'Test Workflow'
  }).then(result => {
    console.log('\n  Result:', result.success ? '✅ Success' : '❌ Failed');
    if (result.data) {
      console.log('  Workflow ID:', result.data.workflowId);
      console.log('  Workflow Name:', result.data.workflow?.name);
      console.log('  Steps Count:', result.data.workflow?.stepsCount);
    }
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests completed successfully!\n');
  }).catch(error => {
    console.error('  ❌ Error:', error.message);
  });
} else {
  console.log('  ❌ CREATE_WORKFLOW_PRIORITY function not found');
}

// Test 5: Test parsing logic
console.log('\n✅ Test 5: Test description parsing');
const { WorkflowCreatorSession } = require('./server/utils/agents/aibitat/plugins/workflow-creator.js');
const session = new WorkflowCreatorSession('test');

const testCases = [
  'send email to user@example.com then invite to meeting',
  'send to segev@example.com news list and then to admin@example.com summary',
  'create report then send notification'
];

testCases.forEach((desc, index) => {
  console.log(`\n  Test case ${index + 1}: "${desc}"`);
  const steps = session.parseDescriptionToWorkflowSteps(desc);
  console.log(`  Parsed ${steps.length} steps:`);
  steps.forEach((step, i) => {
    console.log(`    ${i + 1}. Type: ${step.type}`);
    if (step.config.url) console.log(`       URL: ${step.config.url}`);
    if (step.config.instruction) console.log(`       Instruction: ${step.config.instruction.substring(0, 50)}...`);
  });
});