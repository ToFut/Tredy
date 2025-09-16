const cron = require("node-cron");
const path = require("path");
const fs = require("fs").promises;
const { FlowExecutor } = require("../../agentFlows/executor");

class WorkflowScheduler {
  constructor() {
    this.activeSchedules = new Map();
    this.running = false;
  }

  /**
   * Load a workflow from the storage directory
   */
  async loadWorkflow(workflowId) {
    // Try multiple possible paths
    const possiblePaths = [
      path.resolve(__dirname, "../../../../storage/plugins/agent-flows", `${workflowId}.json`),
      path.resolve(process.cwd(), "storage/plugins/agent-flows", `${workflowId}.json`),
      path.resolve(__dirname, "../../../storage/plugins/agent-flows", `${workflowId}.json`)
    ];

    let workflowPath = null;
    for (const testPath of possiblePaths) {
      try {
        await fs.access(testPath);
        workflowPath = testPath;
        break;
      } catch (e) {
        // Continue to next path
      }
    }

    if (!workflowPath) {
      throw new Error(`Workflow file not found in any expected location: ${workflowId}`);
    }

    try {
      const data = await fs.readFile(workflowPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Failed to load workflow ${workflowId}:`, error);
      return null;
    }
  }

  /**
   * Schedule a workflow to run on a cron schedule
   */
  async scheduleWorkflow(options) {
    const {
      workflowId,
      cronExpression = "* * * * *", // Default: every minute
      timezone = "UTC",
      maxExecutions = null,
      context = {},
      name = "Scheduled Workflow"
    } = options;

    // Load the workflow
    const workflow = await this.loadWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }

    // Create a unique schedule ID
    const scheduleId = `${workflowId}-${Date.now()}`;

    let executionCount = 0;

    // Create the scheduled task
    const task = cron.schedule(
      cronExpression,
      async () => {
        executionCount++;
        const startTime = new Date();

        console.log(`\n⚡ [${startTime.toLocaleString()}] Executing workflow: ${workflow.name || workflowId}`);
        console.log(`   Schedule: ${name}`);
        console.log(`   Execution #${executionCount}`);

        try {
          // Create executor instance
          const executor = new FlowExecutor(workflow, {
            workspaceSlug: context.workspaceSlug || "default",
            userId: context.userId || null
          });

          // Execute the workflow with context
          const result = await executor.execute({
            ...context,
            scheduledExecution: true,
            executionNumber: executionCount,
            scheduledAt: startTime
          });

          const endTime = new Date();
          const duration = ((endTime - startTime) / 1000).toFixed(2);

          if (result.success) {
            console.log(`   ✅ Workflow completed successfully in ${duration}s`);

            // Log any direct output
            if (result.directOutput) {
              console.log(`   📤 Output: ${JSON.stringify(result.directOutput).substring(0, 100)}...`);
            }
          } else {
            console.log(`   ❌ Workflow failed after ${duration}s`);
            console.error(`   Error: ${result.error || "Unknown error"}`);
          }

          // Check if we should stop after max executions
          if (maxExecutions && executionCount >= maxExecutions) {
            console.log(`\n🏁 Reached maximum executions (${maxExecutions}). Stopping schedule.`);
            this.stopSchedule(scheduleId);
          }

        } catch (error) {
          console.error(`   ❌ Failed to execute workflow:`, error.message);
        }
      },
      {
        scheduled: true,
        timezone: timezone
      }
    );

    // Store the schedule
    this.activeSchedules.set(scheduleId, {
      task,
      workflowId,
      workflow,
      cronExpression,
      timezone,
      name,
      startedAt: new Date(),
      executionCount: 0,
      maxExecutions
    });

    console.log(`\n✅ Workflow scheduled successfully!`);
    console.log(`   Schedule ID: ${scheduleId}`);
    console.log(`   Workflow: ${workflow.name || workflowId}`);
    console.log(`   Cron: ${cronExpression}`);
    console.log(`   Timezone: ${timezone}`);
    if (maxExecutions) {
      console.log(`   Max Executions: ${maxExecutions}`);
    }

    return scheduleId;
  }

  /**
   * Stop a scheduled workflow
   */
  stopSchedule(scheduleId) {
    const schedule = this.activeSchedules.get(scheduleId);
    if (!schedule) {
      console.log(`Schedule not found: ${scheduleId}`);
      return false;
    }

    schedule.task.stop();
    this.activeSchedules.delete(scheduleId);

    console.log(`\n⏹️  Stopped schedule: ${scheduleId}`);
    console.log(`   Total executions: ${schedule.executionCount}`);

    return true;
  }

  /**
   * Stop all scheduled workflows
   */
  stopAll() {
    console.log(`\n⏹️  Stopping all ${this.activeSchedules.size} scheduled workflows...`);

    for (const [scheduleId, schedule] of this.activeSchedules) {
      schedule.task.stop();
      console.log(`   - Stopped: ${schedule.name} (${schedule.executionCount} executions)`);
    }

    this.activeSchedules.clear();
    console.log(`✅ All schedules stopped.`);
  }

  /**
   * Get status of all schedules
   */
  getStatus() {
    const schedules = [];

    for (const [scheduleId, schedule] of this.activeSchedules) {
      schedules.push({
        id: scheduleId,
        name: schedule.name,
        workflowId: schedule.workflowId,
        workflowName: schedule.workflow.name,
        cronExpression: schedule.cronExpression,
        timezone: schedule.timezone,
        startedAt: schedule.startedAt,
        executionCount: schedule.executionCount,
        maxExecutions: schedule.maxExecutions
      });
    }

    return {
      running: this.running,
      activeSchedules: this.activeSchedules.size,
      schedules
    };
  }

  /**
   * Start the scheduler service
   */
  start() {
    if (this.running) {
      console.log("Scheduler already running");
      return;
    }

    this.running = true;
    console.log("🚀 Workflow Scheduler Service Started");

    // Keep the process alive
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down scheduler...");
      this.stopAll();
      process.exit(0);
    });
  }
}

// Singleton instance
let schedulerInstance = null;

function getWorkflowScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new WorkflowScheduler();
  }
  return schedulerInstance;
}

module.exports = {
  WorkflowScheduler,
  getWorkflowScheduler
};