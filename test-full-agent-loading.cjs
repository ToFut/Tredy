/**
 * Test script to debug the complete workflow-creator plugin loading process
 * This will simulate the full agent loading flow to identify where the issue occurs
 */

console.log('🔧 Starting comprehensive workflow-creator debugging...\n');

const path = require('path');

async function testPluginLoading() {
  console.log('=== Step 1: Testing Plugin Registration ===');
  
  try {
    // Test basic plugin loading
    const { workflowCreator } = require('./server/utils/agents/aibitat/plugins/workflow-creator.js');
    console.log('✅ Workflow creator plugin loaded');
    console.log('   Name:', workflowCreator.name);
    
    // Test defaults loading
    const { agentSkillsFromSystemSettings } = require('./server/utils/agents/defaults.js');
    console.log('✅ Defaults module loaded');
    
    console.log('\n=== Step 2: Testing System Skills Loading ===');
    
    // Get the default skills
    const systemSkills = await agentSkillsFromSystemSettings();
    console.log('📊 System skills loaded:', systemSkills.length);
    console.log('📝 Skills list:');
    systemSkills.forEach(skill => console.log(`   - ${skill}`));
    
    const hasWorkflowCreator = systemSkills.includes('workflow-creator');
    console.log(`${hasWorkflowCreator ? '✅' : '❌'} workflow-creator in system skills:`, hasWorkflowCreator);
    
    console.log('\n=== Step 3: Testing Agent Definition ===');
    
    // Test workspace agent definition (this is where functions get loaded)
    const { WORKSPACE_AGENT } = require('./server/utils/agents/defaults.js');
    const workspaceDefinition = await WORKSPACE_AGENT.getDefinition('togetherai', 'test-workspace');
    
    console.log('📋 Workspace agent definition loaded');
    console.log('   Functions count:', workspaceDefinition.functions?.length || 0);
    console.log('   Functions list:');
    if (workspaceDefinition.functions) {
      workspaceDefinition.functions.forEach((func, index) => {
        console.log(`   ${index + 1}. ${func}`);
      });
    }
    
    const hasWorkflowCreatorFunction = workspaceDefinition.functions?.includes('workflow-creator');
    console.log(`${hasWorkflowCreatorFunction ? '✅' : '❌'} workflow-creator in agent functions:`, hasWorkflowCreatorFunction);
    
    console.log('\n=== Step 4: Testing Plugin Function Registration ===');
    
    // Create a mock aibitat to test function registration
    const functions = new Map();
    const mockAibitat = {
      functions,
      function: function(config) {
        console.log(`🔧 Registering function: ${config.name}`);
        console.log(`   Description: ${config.description.substring(0, 100)}...`);
        this.functions.set(config.name, config);
        return this;
      }
    };
    
    // Set up the plugin
    const pluginInstance = workflowCreator.plugin();
    pluginInstance.setup(mockAibitat);
    
    console.log(`📊 Total functions registered: ${functions.size}`);
    
    // Check for create_workflow_from_chat specifically
    const hasCreateWorkflowFunction = functions.has('create_workflow_from_chat');
    console.log(`${hasCreateWorkflowFunction ? '✅' : '❌'} create_workflow_from_chat function registered:`, hasCreateWorkflowFunction);
    
    if (hasCreateWorkflowFunction) {
      const func = functions.get('create_workflow_from_chat');
      console.log('\n📋 create_workflow_from_chat details:');
      console.log('   Description:', func.description);
      console.log('   Parameters:', JSON.stringify(func.parameters, null, 2));
      console.log('   Examples:', func.examples?.length || 0);
      if (func.examples) {
        func.examples.forEach((example, index) => {
          console.log(`   Example ${index + 1}:`);
          console.log(`     Prompt: "${example.prompt}"`);
          console.log(`     Call: ${example.call}`);
        });
      }
    }
    
    console.log('\n=== Step 5: Testing UnTooled Function Selection ===');
    
    // Test how UnTooled would select the function
    const UnTooled = require('./server/utils/agents/aibitat/providers/helpers/untooled.js');
    const untooled = new UnTooled();
    
    // Convert functions to the format UnTooled expects
    const availableFunctions = Array.from(functions.values());
    
    console.log('🔍 Testing function showcase generation...');
    const showcase = untooled.showcaseFunctions(availableFunctions);
    console.log('📄 Function showcase length:', showcase.length);
    
    // Test if the function is properly included
    const includesCreateWorkflow = showcase.includes('create_workflow_from_chat');
    console.log(`${includesCreateWorkflow ? '✅' : '❌'} create_workflow_from_chat in showcase:`, includesCreateWorkflow);
    
    if (includesCreateWorkflow) {
      console.log('\n📋 Function showcase for create_workflow_from_chat:');
      const showcaseLines = showcase.split('\n');
      const startIndex = showcaseLines.findIndex(line => line.includes('create_workflow_from_chat'));
      if (startIndex !== -1) {
        const endIndex = showcaseLines.findIndex((line, index) => index > startIndex && line.includes('-----------'));
        if (endIndex !== -1) {
          showcaseLines.slice(startIndex - 1, endIndex + 1).forEach(line => console.log('   ', line));
        }
      }
    }
    
    console.log('\n=== Step 6: Testing Function Validation ===');
    
    // Test function call validation
    const testCall = {
      name: 'create_workflow_from_chat',
      arguments: {
        description: 'create workflow to send email and book meeting'
      }
    };
    
    const validation = untooled.validFuncCall(testCall, availableFunctions);
    console.log(`${validation.valid ? '✅' : '❌'} Function call validation:`, validation.valid);
    if (!validation.valid) {
      console.log('   Reason:', validation.reason);
    }
    
    console.log('\n✅ Comprehensive debugging complete!');
    console.log('\n🎯 Summary:');
    console.log(`   Plugin loads: ✅`);
    console.log(`   In system skills: ${hasWorkflowCreator ? '✅' : '❌'}`);
    console.log(`   In agent functions: ${hasWorkflowCreatorFunction ? '✅' : '❌'}`);
    console.log(`   Function registers: ${hasCreateWorkflowFunction ? '✅' : '❌'}`);
    console.log(`   In UnTooled showcase: ${includesCreateWorkflow ? '✅' : '❌'}`);
    console.log(`   Function validation: ${validation.valid ? '✅' : '❌'}`);
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPluginLoading().catch(console.error);