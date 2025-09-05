#!/usr/bin/env node

/**
 * Test script for Flow Orchestrator
 * Tests the multi-step workflow system
 */

// Change to server directory for proper imports
process.chdir('./server');

const { AgentFlows } = require('./utils/agentFlows');
const { flowOrchestrator } = require('./utils/agents/aibitat/plugins/flow-orchestrator');

async function testFlowOrchestrator() {
  console.log('🧪 Testing Flow Orchestrator System...\n');

  try {
    // Test 1: Check if our sample flow exists
    console.log('📋 Test 1: Checking available flows...');
    const flows = AgentFlows.listFlows();
    console.log(`Found ${flows.length} flows:`);
    flows.forEach(flow => {
      console.log(`  - ${flow.name} (${flow.uuid}) - ${flow.active ? 'Active' : 'Inactive'}`);
    });

    // Test 2: Load our sample flow 
    const sampleFlow = flows.find(f => f.name.includes('Multi-Step Email'));
    if (sampleFlow) {
      console.log(`\n✅ Found sample flow: ${sampleFlow.name}`);
      
      // Test 3: Execute the sample flow
      console.log('\n🚀 Test 3: Executing sample flow...');
      
      const mockAibitat = {
        introspect: (message) => console.log(`[INTROSPECT] ${message}`),
        function: () => {},
        handlerProps: { log: console.log }
      };

      const result = await AgentFlows.executeFlow(
        sampleFlow.uuid, 
        { 
          recipient: 'test@example.com',
          date: 'today'
        }, 
        mockAibitat
      );

      console.log('\n📊 Execution Result:');
      console.log('Success:', result.success);
      console.log('Steps completed:', result.results?.length || 0);
      
      if (result.success && result.directOutput) {
        console.log('\n📄 Direct Output:');
        console.log(result.directOutput);
      }

      if (result.results) {
        console.log('\n📝 Step Results:');
        result.results.forEach((stepResult, index) => {
          console.log(`Step ${index + 1}: ${stepResult.success ? '✅' : '❌'}`);
          if (stepResult.result) {
            console.log(`  Result: ${stepResult.result.substring(0, 100)}...`);
          }
        });
      }

    } else {
      console.log('❌ Sample flow not found. Creating it...');
      
      // Create the flow programmatically
      const flowConfig = {
        name: "Multi-Step Email and Calendar Test",
        description: "Sample flow to test multi-step orchestration",
        active: true,
        steps: [
          {
            type: "start",
            config: {
              variables: [
                { name: "recipient", value: "segev@futuirxs.com" },
                { name: "date", value: "today" }
              ]
            }
          },
          {
            type: "llmInstruction",
            config: {
              instruction: "Create a test daily brief with simulated calendar and weather data",
              resultVariable: "dailyBrief",
              directOutput: true
            }
          }
        ]
      };

      const saveResult = AgentFlows.saveFlow(
        "Multi-Step Email and Calendar Test",
        flowConfig
      );

      if (saveResult.success) {
        console.log(`✅ Created sample flow with UUID: ${saveResult.uuid}`);
      } else {
        console.log(`❌ Failed to create flow: ${saveResult.error}`);
      }
    }

    // Test 4: Test plugin loading
    console.log('\n🔌 Test 4: Testing Flow Orchestrator Plugin...');
    const plugin = flowOrchestrator.plugin();
    console.log(`Plugin name: ${plugin.name}`);
    console.log('Plugin setup function exists:', typeof plugin.setup === 'function');

    console.log('\n🎉 Flow Orchestrator Tests Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testFlowOrchestrator().catch(console.error);