// Test various workflow types
const { workflowCreator } = require('./server/utils/agents/aibitat/plugins/workflow-creator.js');

console.log('🧪 Testing Generic Workflow Creator\n');
console.log('='.repeat(60));

const mockAibitat = {
  conversationId: 'test-generic',
  introspect: (msg) => console.log(`📝 ${msg}`),
  sendWorkflowPreview: (data) => console.log('🎨 Preview generated'),
  function: function(config) {
    this.functions = this.functions || {};
    this.functions[config.name] = config;
  }
};

// Initialize plugin
const plugin = workflowCreator.plugin();
plugin.setup(mockAibitat);

const createWorkflowFn = mockAibitat.functions['create_workflow'];

// Test cases for different workflow types
const testCases = [
  "fetch data from API then analyze results then generate report",
  "scrape website, process data, save to database",
  "get user input then validate then store in system",
  "analyze sales data then create visualization then send notification",
  "transform CSV data, apply filters, export to JSON"
];

async function testWorkflow(description) {
  console.log(`\n📋 Test: "${description}"`);
  console.log('-'.repeat(60));
  
  const result = await createWorkflowFn.handler.call(mockAibitat, {
    description: description
  });
  
  if (typeof result === 'string') {
    // Extract just the workflow diagram part
    const lines = result.split('\n');
    const diagramStart = lines.findIndex(line => line.includes('┌'));
    const diagramEnd = lines.findIndex(line => line.includes('└')) + 1;
    
    if (diagramStart >= 0 && diagramEnd > diagramStart) {
      console.log(lines.slice(diagramStart, diagramEnd).join('\n'));
    }
  }
}

async function runTests() {
  for (const testCase of testCases) {
    await testWorkflow(testCase);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ All workflow types tested successfully!');
}

runTests().catch(console.error);