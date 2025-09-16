const path = require('path');
const cron = require('./server/node_modules/node-cron');

// Load the workflow
const flowPath = path.join(__dirname, 'storage/plugins/agent-flows/9ec232c4-9188-449d-a850-7eb95fbb82be.json');
const workflow = require(flowPath);

console.log('🚀 Starting workflow scheduler test...');
console.log(`📋 Workflow: ${workflow.name}`);
console.log(`📝 Description: ${workflow.description}`);
console.log('');

let executionCount = 0;
const maxExecutions = 5;

// Function to simulate workflow execution
async function executeWorkflow() {
  executionCount++;
  const timestamp = new Date().toLocaleTimeString();

  console.log(`\n⚡ [${timestamp}] Execution #${executionCount} started`);
  console.log('  Processing steps:');

  // Simulate processing each step
  for (let i = 0; i < workflow.steps.length; i++) {
    const step = workflow.steps[i];
    console.log(`    Step ${i + 1}: ${step.type}`);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`  ✅ Workflow completed successfully!`);

  // Stop after 5 executions
  if (executionCount >= maxExecutions) {
    console.log(`\n🏁 Reached ${maxExecutions} executions. Stopping scheduler...`);
    task.stop();

    console.log('\n📊 Summary:');
    console.log(`  Total executions: ${executionCount}`);
    console.log(`  Schedule: Every minute`);
    console.log(`  Status: Test completed successfully!`);

    process.exit(0);
  }
}

// Schedule to run every minute
const task = cron.schedule('* * * * *', executeWorkflow, {
  scheduled: true,
  timezone: 'UTC'
});

console.log('⏰ Scheduler started - workflow will execute every minute');
console.log(`📍 Will run ${maxExecutions} times then stop`);
console.log('');

// Also run immediately for demonstration
executeWorkflow();