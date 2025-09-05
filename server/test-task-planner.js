/**
 * Test script for Task Planner plugin
 */

const { taskPlanner } = require("./utils/agents/aibitat/plugins/task-planner.js");

console.log("Task Planner Plugin Test");
console.log("========================");
console.log("Plugin name:", taskPlanner.name);
console.log("Has startupConfig:", !!taskPlanner.startupConfig);
console.log("Has plugin function:", typeof taskPlanner.plugin === 'function');

// Test the plugin setup
const mockAibitat = {
  taskPlan: null,
  function: (config) => {
    console.log("\nRegistered function:", config.name);
    console.log("Description preview:", config.description.substring(0, 100) + "...");
  },
  complete: null,
  introspect: (msg) => console.log("[Introspect]", msg)
};

const plugin = taskPlanner.plugin();
console.log("\nPlugin instance name:", plugin.name);
console.log("Setting up plugin...");
plugin.setup(mockAibitat);

console.log("\nTask Plan initialized:", mockAibitat.taskPlan);

// Test creating a task plan
console.log("\n--- Testing Task Plan Creation ---");
const testHandler = mockAibitat.functions?.create_task_plan?.handler;
if (testHandler) {
  const result = testHandler({
    tasks: [
      { id: "task_1", description: "Check email", tool_needed: "gmail_read" },
      { id: "task_2", description: "Summarize", tool_needed: "summarize" },
      { id: "task_3", description: "Send email", tool_needed: "gmail_send" }
    ]
  });
  console.log("Result:", result);
}

console.log("\n✅ Task Planner plugin test complete!");