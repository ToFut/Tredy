/**
 * Test Script: Create and Test Agent Scheduler
 *
 * This script demonstrates how to create a working agent schedule
 * that executes proactively without user input
 */

require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });
const { AgentSchedule } = require("./models/agentSchedule");
const { Workspace } = require("./models/workspace");

async function createTestSchedule() {
  console.log("🧪 Creating test agent schedule...\n");

  try {
    // Get first workspace
    const workspaces = await Workspace.where();
    if (!workspaces || workspaces.length === 0) {
      console.error("❌ No workspaces found. Please create a workspace first.");
      process.exit(1);
    }

    const workspace = workspaces[0];
    console.log(`✅ Using workspace: ${workspace.name} (ID: ${workspace.id})\n`);

    // Create a test schedule - runs every minute for testing
    const scheduleConfig = {
      agentId: "test-proactive-agent",
      agentType: "system", // Using system agent type
      name: "Test Proactive Agent",
      description: "Tests proactive agent execution - runs every minute",
      workspaceId: workspace.id,
      cronExpression: "* * * * *", // Every minute (for testing)
      timezone: "UTC",
      context: JSON.stringify({
        message: "This is a proactive agent test",
        timestamp: new Date().toISOString(),
      }),
      enabled: true,
      createdBy: null,
    };

    console.log("📝 Schedule Configuration:");
    console.log(JSON.stringify(scheduleConfig, null, 2));
    console.log();

    // Create schedule
    const { schedule, error } = await AgentSchedule.create(scheduleConfig);

    if (error) {
      console.error("❌ Failed to create schedule:", error);
      process.exit(1);
    }

    console.log("✅ Schedule created successfully!");
    console.log(`   ID: ${schedule.id}`);
    console.log(`   Name: ${schedule.name}`);
    console.log(`   Cron: ${schedule.cron_expression}`);
    console.log(`   Enabled: ${schedule.enabled}`);
    console.log();

    // Verify it was saved
    const savedSchedule = await AgentSchedule.get({ id: schedule.id });
    if (savedSchedule) {
      console.log("✅ Schedule verified in database");
      console.log();
      console.log("⏰ Next steps:");
      console.log("   1. Make sure server is running: yarn dev:server");
      console.log("   2. Watch server logs for scheduler activity");
      console.log("   3. Check workspace chat for proactive messages");
      console.log("   4. Scheduler will execute every minute");
      console.log();
      console.log("🔍 To view schedules:");
      console.log(
        `   sqlite3 server/storage/anythingllm.db "SELECT * FROM agent_schedules WHERE id=${schedule.id};"`
      );
      console.log();
      console.log("🗑️  To delete this test schedule:");
      console.log(
        `   sqlite3 server/storage/anythingllm.db "DELETE FROM agent_schedules WHERE id=${schedule.id};"`
      );
      console.log();
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// Run
createTestSchedule();
