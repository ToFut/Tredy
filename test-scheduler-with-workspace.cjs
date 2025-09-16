require('dotenv').config({ path: './server/.env' });
const path = require('path');
const cron = require('./server/node_modules/node-cron');

// Set required environment variables
process.env.STORAGE_DIR = path.resolve(__dirname, "server", "storage");
process.env.NODE_ENV = "development";

const { Workspace } = require('./server/models/workspace');
const { FlowExecutor } = require('./server/utils/agentFlows/executor');
const { AgentHandler } = require('./server/utils/agents/index');

async function testSchedulerWithWorkspace() {
  console.log('🚀 Testing Workflow Scheduler with Real Workspace');
  console.log('================================================\n');

  try {
    // Get a real workspace
    const workspace = await Workspace.get({ id: 3 }); // Using "Segev" workspace with OpenAI
    if (!workspace) {
      console.error('Workspace not found!');
      process.exit(1);
    }

    console.log(`📁 Using workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`🤖 LLM Provider: ${workspace.agentProvider || 'default'}`);
    console.log(`🧠 Model: ${workspace.agentModel || 'default'}\n`);

    // Load the workflow
    const workflowPath = path.join(__dirname, 'storage/plugins/agent-flows/9ec232c4-9188-449d-a850-7eb95fbb82be.json');
    const workflow = require(workflowPath);

    console.log(`📋 Workflow: ${workflow.name}`);
    console.log(`📝 Description: ${workflow.description}\n`);

    let executionCount = 0;
    const maxExecutions = 3; // Reduced for testing

    // Function to execute workflow with workspace context
    async function executeWorkflowWithWorkspace() {
      executionCount++;
      const timestamp = new Date().toLocaleTimeString();

      console.log(`\n⚡ [${timestamp}] Execution #${executionCount} started`);

      try {
        // Create an agent handler to get aibitat context
        const agentHandler = new AgentHandler({
          uuid: `scheduler-${Date.now()}`,
          workspace
        });

        // Initialize the agent handler
        await agentHandler.init(null, {
          workspace,
          prompt: 'Executing scheduled workflow',
          userId: null
        });

        // Create flow executor with workspace context
        const executor = new FlowExecutor(workflow, {
          workspaceSlug: workspace.slug,
          userId: null
        });

        // Attach the aibitat context for LLM operations
        executor.aibitat = agentHandler.aibitat;

        // Execute the workflow
        const startTime = Date.now();
        const result = await executor.execute({
          userEmail: 'scheduler@example.com',
          projectName: 'Scheduled Test Project',
          scheduledExecution: true
        });

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (result.success) {
          console.log(`  ✅ Workflow completed successfully in ${duration}s`);

          // Show the output variables
          if (result.variables && Object.keys(result.variables).length > 0) {
            console.log(`  📊 Output variables:`);
            for (const [key, value] of Object.entries(result.variables)) {
              const preview = typeof value === 'string'
                ? value.substring(0, 100) + (value.length > 100 ? '...' : '')
                : JSON.stringify(value).substring(0, 100);
              console.log(`     - ${key}: ${preview}`);
            }
          }
        } else {
          console.log(`  ❌ Workflow failed after ${duration}s`);
          if (result.error) {
            console.log(`     Error: ${result.error}`);
          }
        }

      } catch (error) {
        console.error(`  ❌ Execution failed:`, error.message);
      }

      // Stop after max executions
      if (executionCount >= maxExecutions) {
        console.log(`\n🏁 Reached ${maxExecutions} executions. Stopping scheduler...`);
        task.stop();

        console.log('\n📊 Summary:');
        console.log(`  Total executions: ${executionCount}`);
        console.log(`  Schedule: Every minute`);
        console.log(`  Workspace: ${workspace.name}`);
        console.log(`  Status: Test completed!`);

        process.exit(0);
      }
    }

    // Schedule to run every minute
    const task = cron.schedule('* * * * *', executeWorkflowWithWorkspace, {
      scheduled: true,
      timezone: 'UTC'
    });

    console.log('⏰ Scheduler started - workflow will execute every minute');
    console.log(`📍 Will run ${maxExecutions} times then stop`);
    console.log('🔑 Using real workspace configuration with LLM provider\n');

    // Also run immediately for testing
    await executeWorkflowWithWorkspace();

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testSchedulerWithWorkspace();