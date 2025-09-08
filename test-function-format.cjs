/**
 * Test to examine the exact function format passed to OpenAI API
 */

async function testWorkflowFunction() {
console.log('🔧 Testing function format for workflow-creator...');

try {
  // Load the workflow creator plugin
  const { workflowCreator } = require('./server/utils/agents/aibitat/plugins/workflow-creator.js');
  
  // Create a mock aibitat with the exact structure used in production
  const mockFunctions = new Map();
  const mockAibitat = {
    functions: mockFunctions,
    conversationId: 'test-123',
    function: function(config) {
      console.log(`📝 Function registered: ${config.name}`);
      this.functions.set(config.name, config);
    },
    introspect: function(message) {
      console.log(`💭 Introspect: ${message}`);
    }
  };
  
  // Set up the plugin 
  const pluginInstance = workflowCreator.plugin();
  pluginInstance.setup(mockAibitat);
  
  // Get the create_workflow_from_chat function
  const createWorkflowFunc = mockFunctions.get('create_workflow_from_chat');
  
  if (createWorkflowFunc) {
    console.log('\n🎯 create_workflow_from_chat function structure:');
    console.log('Name:', createWorkflowFunc.name);
    console.log('Description:', createWorkflowFunc.description);
    console.log('Parameters:', JSON.stringify(createWorkflowFunc.parameters, null, 2));
    
    // Test the function format that would be sent to OpenAI
    const openAIFormat = {
      name: createWorkflowFunc.name,
      description: createWorkflowFunc.description,
      parameters: createWorkflowFunc.parameters
    };
    
    console.log('\n📤 Format sent to OpenAI API:');
    console.log(JSON.stringify(openAIFormat, null, 2));
    
    // Test the function execution with sample data
    console.log('\n🧪 Testing function execution...');
    try {
      const testArgs = {
        description: "send email to john@example.com then create a calendar event"
      };
      
      const result = await createWorkflowFunc.handler(testArgs);
      console.log('✅ Function execution result:', typeof result, result?.success ? 'SUCCESS' : 'FAIL');
      
    } catch (error) {
      console.log('❌ Function execution error:', error.message);
    }
    
  } else {
    console.log('❌ create_workflow_from_chat function not found!');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
}
}

// Run the test
testWorkflowFunction();