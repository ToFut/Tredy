// Test script for workflow scheduling with real execution
const path = require("path");

// Set required environment variables
process.env.STORAGE_DIR = path.resolve(__dirname, "server", "storage");
process.env.NODE_ENV = "development";

// Load the scheduler
const { getWorkflowScheduler } = require("./server/utils/agents/scheduler/workflow-scheduler");

async function testWorkflowScheduling() {
  console.log("🎯 Testing Workflow Scheduling System");
  console.log("=====================================\n");

  const scheduler = getWorkflowScheduler();
  scheduler.start();

  try {
    // The workflow we found earlier
    const workflowId = "9ec232c4-9188-449d-a850-7eb95fbb82be";

    // Schedule the workflow to run every minute for 5 executions
    const scheduleId = await scheduler.scheduleWorkflow({
      workflowId: workflowId,
      cronExpression: "* * * * *", // Every minute
      timezone: "UTC",
      maxExecutions: 5,
      name: "Demo Workflow - Every Minute Test",
      context: {
        userEmail: "scheduler-test@example.com",
        projectName: "Automated Scheduler Test",
        testMode: true
      }
    });

    console.log("\n⏰ Workflow is now scheduled!");
    console.log("The workflow will execute 5 times (once per minute)");
    console.log("Press Ctrl+C to stop early\n");

    // Also schedule a second workflow with different timing (every 30 seconds)
    // This demonstrates multiple concurrent schedules
    const scheduleId2 = await scheduler.scheduleWorkflow({
      workflowId: workflowId,
      cronExpression: "*/30 * * * * *", // Every 30 seconds
      timezone: "UTC",
      maxExecutions: 10,
      name: "Demo Workflow - Every 30 Seconds Test",
      context: {
        userEmail: "rapid-test@example.com",
        projectName: "Rapid Fire Test",
        testMode: true
      }
    });

    // Show status
    setInterval(() => {
      const status = scheduler.getStatus();
      if (status.activeSchedules > 0) {
        console.log("\n📊 Current Status:");
        status.schedules.forEach(schedule => {
          console.log(`   - ${schedule.name}: ${schedule.executionCount}/${schedule.maxExecutions || '∞'} executions`);
        });
      } else {
        console.log("\n✅ All schedules completed!");
        process.exit(0);
      }
    }, 15000); // Status update every 15 seconds

  } catch (error) {
    console.error("❌ Error setting up scheduler:", error);
    process.exit(1);
  }
}

// Run the test
testWorkflowScheduling();