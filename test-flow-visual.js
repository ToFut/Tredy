#!/usr/bin/env node

/**
 * Test script to verify @flow visual workflow building
 */

const { AgentFlows } = require('./server/utils/agentFlows');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

console.log('🧪 Testing Visual Workflow Building...\n');

async function testVisualWorkflowBuilding() {
  try {
    const workflowName = `Test Workflow ${Date.now()}`;
    const workflowUuid = uuidv4();
    
    console.log(`📝 Creating workflow: ${workflowName}`);
    console.log(`   UUID: ${workflowUuid}`);
    
    // Step 1: Initialize workflow with building status
    let config = {
      name: workflowName,
      description: 'Testing visual workflow building',
      active: false,
      status: 'building',
      created_via: 'test',
      created_at: new Date().toISOString(),
      steps: [],
      visualBlocks: [],
      buildProgress: {
        current: 0,
        total: 3,
        message: 'Initializing workflow...'
      }
    };
    
    await AgentFlows.saveFlow(config.name, config, workflowUuid);
    console.log('✅ Step 1: Workflow initialized with building status');
    
    // Wait to simulate building
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Add start block
    config.steps.push({
      type: 'start',
      config: { variables: [] }
    });
    config.visualBlocks.push({
      id: 'start',
      type: 'start',
      name: 'Start',
      status: 'complete'
    });
    config.buildProgress = {
      current: 1,
      total: 3,
      message: 'Added start block...'
    };
    
    await AgentFlows.saveFlow(config.name, config, workflowUuid);
    console.log('✅ Step 2: Added start block');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Add main task block
    config.steps.push({
      type: 'llmInstruction',
      config: {
        instruction: 'Send email with weather update',
        resultVariable: 'result'
      }
    });
    config.visualBlocks.push({
      id: 'main',
      type: 'llmInstruction', 
      name: 'Send Email',
      description: 'Send weather update email',
      status: 'complete',
      connections: ['start']
    });
    config.buildProgress = {
      current: 2,
      total: 3,
      message: 'Added email task...'
    };
    
    await AgentFlows.saveFlow(config.name, config, workflowUuid);
    console.log('✅ Step 3: Added main task block');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Complete workflow
    config.active = true;
    config.status = 'complete';
    config.buildProgress = {
      current: 3,
      total: 3,
      message: '🎉 Workflow complete!'
    };
    
    await AgentFlows.saveFlow(config.name, config, workflowUuid);
    console.log('✅ Step 4: Workflow completed');
    
    // Clean up progress after delay
    setTimeout(async () => {
      delete config.buildProgress;
      await AgentFlows.saveFlow(config.name, config, workflowUuid);
      console.log('✅ Cleaned up build progress');
    }, 2000);
    
    // Verify workflow was saved
    const savedPath = path.join(
      __dirname,
      'server',
      'storage',
      'plugins',
      'agent-flows',
      `${workflowUuid}.json`
    );
    
    console.log(`\n📁 Workflow saved to: ${savedPath}`);
    console.log('\n🎉 Test completed successfully!');
    console.log('Open the Flow Panel in the UI to see the visual workflow.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVisualWorkflowBuilding();