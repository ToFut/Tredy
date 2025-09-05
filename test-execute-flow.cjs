#!/usr/bin/env node

/**
 * Test executing a saved workflow directly
 */

const path = require('path');
const fs = require('fs');

// Read the workflow
const workflowPath = path.join(__dirname, 'server/storage/plugins/agent-flows/demo-workflow.json');
const workflow = JSON.parse(fs.readFileSync(workflowPath, 'utf8'));

console.log('📋 Workflow Details:');
console.log(`Name: ${workflow.name}`);
console.log(`Description: ${workflow.description}`);
console.log(`Steps: ${workflow.steps.length}`);
console.log('\n📝 Steps:');

workflow.steps.forEach((step, index) => {
  console.log(`${index + 1}. ${step.type}`);
  if (step.config.instruction) {
    console.log(`   Instruction: ${step.config.instruction.substring(0, 60)}...`);
  }
});

console.log('\n✅ To execute this workflow:');
console.log('1. In chat: "@agent run Demo Multi-Step Workflow"');
console.log('2. Or: "@agent execute flow_demo-workflow"');
console.log('\n⚠️  Note: The agent must have the workflow in its available tools');

// Show how to execute programmatically
console.log('\n💻 To execute programmatically:');
console.log(`
const { AgentFlows } = require('./server/utils/agentFlows');

// Execute the workflow
const result = await AgentFlows.executeFlow(
  'demo-workflow',  // UUID (filename without .json)
  { userEmail: 'test@example.com', projectName: 'Test Project' },  // Variables
  null  // aibitat instance (optional)
);

console.log('Result:', result);
`);