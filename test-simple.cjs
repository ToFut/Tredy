#!/usr/bin/env node

/**
 * Simple test to check if flow orchestrator is working
 */

console.log('🧪 Testing Flow Orchestrator System...\n');

// Test 1: Check if sample flow file exists
const fs = require('fs');
const path = require('path');

const sampleFlowPath = path.join(__dirname, 'server/storage/plugins/agent-flows/test-multi-step-sample.json');

console.log('📋 Test 1: Checking sample flow file...');
if (fs.existsSync(sampleFlowPath)) {
  console.log('✅ Sample flow file exists');
  
  const flowContent = fs.readFileSync(sampleFlowPath, 'utf8');
  const flow = JSON.parse(flowContent);
  
  console.log(`   Name: ${flow.name}`);
  console.log(`   Steps: ${flow.steps.length}`);
  console.log(`   Active: ${flow.active}`);
  
  console.log('\n📄 Flow Steps:');
  flow.steps.forEach((step, index) => {
    console.log(`   ${index + 1}. ${step.type} - ${step.config.instruction || 'Start/Variables'}`);
  });
  
} else {
  console.log('❌ Sample flow file not found');
}

// Test 2: Check if plugin file exists
const pluginPath = path.join(__dirname, 'server/utils/agents/aibitat/plugins/flow-orchestrator.js');
console.log('\n🔌 Test 2: Checking plugin file...');

if (fs.existsSync(pluginPath)) {
  console.log('✅ Flow orchestrator plugin exists');
  
  const pluginContent = fs.readFileSync(pluginPath, 'utf8');
  
  // Check for key functions
  const hasExecuteFunction = pluginContent.includes('execute_multi_step_task');
  const hasAgentFlows = pluginContent.includes('AgentFlows');
  const hasFlowBuilder = pluginContent.includes('DynamicFlowBuilder');
  
  console.log(`   Has execute_multi_step_task: ${hasExecuteFunction ? '✅' : '❌'}`);
  console.log(`   Has AgentFlows integration: ${hasAgentFlows ? '✅' : '❌'}`);
  console.log(`   Has DynamicFlowBuilder: ${hasFlowBuilder ? '✅' : '❌'}`);
  
} else {
  console.log('❌ Flow orchestrator plugin not found');
}

// Test 3: Check if plugin is in defaults
const defaultsPath = path.join(__dirname, 'server/utils/agents/defaults.js');
console.log('\n📦 Test 3: Checking if plugin is in defaults...');

if (fs.existsSync(defaultsPath)) {
  const defaultsContent = fs.readFileSync(defaultsPath, 'utf8');
  const hasFlowOrchestrator = defaultsContent.includes('flow-orchestrator') || defaultsContent.includes('flowOrchestrator');
  
  console.log(`   Plugin in defaults: ${hasFlowOrchestrator ? '✅' : '❌'}`);
  
  if (!hasFlowOrchestrator) {
    console.log('   ⚠️  Plugin may need to be added to DEFAULT_SKILLS');
  }
} else {
  console.log('❌ Defaults file not found');
}

// Test 4: Check server status
console.log('\n🖥️  Test 4: Checking server status...');
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/system/settings',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log(`✅ Server is running on port 3001 (Status: ${res.statusCode})`);
});

req.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.log('❌ Server is not running on port 3001');
  } else {
    console.log(`❌ Server error: ${err.message}`);
  }
});

req.on('timeout', () => {
  console.log('⚠️  Server request timed out');
  req.destroy();
});

req.end();

console.log('\n🎯 To test the flow orchestrator:');
console.log('1. Open AnythingLLM in browser (http://localhost:3000)');
console.log('2. Create an agent or use existing workspace');
console.log('3. Try a multi-step request like:');
console.log('   "Check my calendar for today and send summary to someone@email.com"');
console.log('4. The agent should use execute_multi_step_task automatically');

console.log('\n🎉 Basic tests complete!');