/**
 * Test script to debug workflow-creator plugin function loading
 */

// Import required modules without causing initialization issues
const path = require('path');

console.log('🔧 Starting workflow-creator plugin debug...');

try {
  // Check if the workflow-creator plugin file exists and loads
  const workflowCreatorPath = path.join(__dirname, 'server/utils/agents/aibitat/plugins/workflow-creator.js');
  console.log('📁 Workflow creator plugin path:', workflowCreatorPath);
  
  const { workflowCreator } = require(workflowCreatorPath);
  console.log('✅ Workflow creator plugin loaded successfully');
  console.log('📋 Plugin name:', workflowCreator.name);
  
  // Check the plugin structure
  if (workflowCreator.plugin && typeof workflowCreator.plugin === 'function') {
    console.log('✅ Plugin function exists');
    
    // Create a mock aibitat to see what functions get registered
    const mockAibitat = {
      functions: new Map(),
      function: function(config) {
        console.log(`🔧 Function registered: ${config.name}`);
        console.log(`   Description: ${config.description}`);
        this.functions.set(config.name, config);
      }
    };
    
    // Execute the plugin setup
    const pluginInstance = workflowCreator.plugin();
    if (pluginInstance.setup) {
      console.log('🚀 Setting up plugin...');
      pluginInstance.setup(mockAibitat);
      
      console.log(`📊 Total functions registered: ${mockAibitat.functions.size}`);
      console.log('📝 Registered functions:');
      for (const [name, config] of mockAibitat.functions) {
        console.log(`   - ${name}: ${config.description.substring(0, 80)}...`);
      }
    } else {
      console.log('❌ Plugin setup method not found');
    }
  } else {
    console.log('❌ Plugin function not found or not a function');
  }
  
} catch (error) {
  console.error('❌ Error loading workflow creator plugin:', error.message);
  console.error('Stack:', error.stack);
}

console.log('✅ Debug complete');