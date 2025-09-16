require('dotenv').config({ path: 'server/.env' });
const path = require('path');
const { AgentSchedule } = require('./server/models/agentSchedule');
const { Workspace } = require('./server/models/workspace');
const SchedulableAgent = require('./server/utils/agents/schedulable');
const { getSchedulingEngine } = require('./server/utils/agents/scheduler/engine');

// Set storage dir if not set
if (!process.env.STORAGE_DIR) {
  process.env.STORAGE_DIR = path.resolve(__dirname, 'server', 'storage');
}

async function testScheduler() {
  console.log('Starting workflow scheduler test...');

  try {
    // Get or create a workspace
    const workspaces = await Workspace.where();
    if (!workspaces.length) {
      console.error('No workspaces found. Please create a workspace first.');
      process.exit(1);
    }
    const workspace = workspaces[0];
    console.log(`Using workspace: ${workspace.name} (ID: ${workspace.id})`);

    // The workflow ID we found
    const flowId = '9ec232c4-9188-449d-a850-7eb95fbb82be';

    // Create a schedulable agent from the flow
    const schedulableAgent = await SchedulableAgent.fromId(flowId, 'flow');

    // Create a schedule that runs every minute
    const schedule = await schedulableAgent.schedule({
      name: 'Test Workflow Schedule - Every Minute',
      description: 'Testing workflow scheduling every minute for 5 minutes',
      cronExpression: '* * * * *', // Every minute
      workspaceId: workspace.id,
      context: {
        prompt: 'Execute the demo workflow',
        userEmail: 'test@example.com',
        projectName: 'Scheduler Test Project'
      },
      enabled: true,
      timezone: 'UTC',
      userId: null
    });

    console.log(`Created schedule: ${schedule.name} (ID: ${schedule.id})`);
    console.log(`Cron expression: ${schedule.cron_expression}`);
    console.log(`Next run at: ${schedule.next_run_at}`);

    // Start the scheduling engine
    const engine = getSchedulingEngine();
    await engine.start();

    console.log('\n✅ Scheduler started successfully!');
    console.log('The workflow will run every minute.');
    console.log('Watch the console for execution logs...\n');

    // Set a timer to stop after 5 minutes
    setTimeout(async () => {
      console.log('\n⏰ 5 minutes elapsed. Stopping scheduler...');

      // Disable the schedule
      await AgentSchedule.update(schedule.id, { enabled: false });

      // Stop the engine
      await engine.stop();

      // Get execution stats
      const { ScheduleExecution } = require('./server/models/scheduleExecution');
      const executions = await ScheduleExecution.where({ schedule_id: schedule.id });

      console.log(`\n📊 Execution Summary:`);
      console.log(`Total executions: ${executions.length}`);
      executions.forEach((exec, i) => {
        console.log(`  ${i + 1}. ${exec.started_at} - Status: ${exec.status}`);
      });

      console.log('\n✅ Test completed!');
      process.exit(0);
    }, 5 * 60 * 1000 + 5000); // 5 minutes + 5 seconds buffer

  } catch (error) {
    console.error('Error setting up scheduler:', error);
    process.exit(1);
  }
}

// Run the test
testScheduler();