/**
 * Simple Create Workflow Plugin
 * Minimal implementation to test visual workflow building
 */

const { v4: uuidv4 } = require("uuid");
const { AgentFlows } = require("../../../agentFlows");

const createWorkflow = {
  name: "create-workflow",
  startupConfig: {
    params: {},
  },
  plugin: function (agent) {
    return {
      name: "create-workflow", // This name will be visible to UnTooled
      setup(aibitat) {
        console.log("🔧 [CreateWorkflow] Setting up create-workflow plugin");
        
        // Register with the PLUGIN NAME, not a custom function name
        aibitat.function({
          name: "create-workflow", // MUST match plugin name for UnTooled
          description: "Creates automated workflows from natural language. Use when user wants to create a workflow or describes multiple steps.",
          examples: [
            {
              prompt: "create a workflow to fetch weather and send email",
              call: JSON.stringify({ description: "fetch weather and send email" })
            }
          ],
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Natural language description of the workflow"
              }
            },
            required: ["description"]
          },
          handler: async function ({ description }) {
            try {
              console.log("🎉 [CreateWorkflow] Handler called with:", description);
              console.log("🎉 [CreateWorkflow] Function is working!");
              
              const workflowName = `Workflow ${Date.now()}`;
              const workflowUuid = uuidv4();
              
              // Create initial workflow with building status
              let config = {
                name: workflowName,
                description: `Created: ${description}`,
                active: false,
                status: 'building',
                created_via: "chat",
                created_at: new Date().toISOString(),
                steps: [],
                visualBlocks: [],
                buildProgress: {
                  current: 0,
                  total: 3,
                  message: 'Starting workflow creation...'
                },
                // Signal to open Flow Panel
                openFlowPanel: true,
                workflowUuid: workflowUuid
              };
              
              // Save initial state
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`🏗️ Creating workflow: "${workflowName}"`);
              
              // Simulate progressive building
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Add start block with animation
              config.steps.push({
                type: "start",
                config: { variables: [] }
              });
              config.visualBlocks.push({
                id: 'start',
                type: 'start',
                name: '🚀 Start',
                description: 'Workflow entry point',
                status: 'complete'
              });
              config.buildProgress = {
                current: 1,
                total: 5,
                message: 'Initializing workflow...'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`🚀 Initializing workflow structure...`);
              
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Add data collection block
              config.visualBlocks.push({
                id: 'collect',
                type: 'dataCollection',
                name: '📊 Collect Data',
                description: 'Gathering required information',
                status: 'building'
              });
              config.buildProgress = {
                current: 2,
                total: 5,
                message: 'Setting up data collection...'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`📊 Configuring data collection...`);
              
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Mark data collection as complete and add processing block
              config.visualBlocks[1].status = 'complete';
              config.visualBlocks.push({
                id: 'process',
                type: 'llmInstruction',
                name: '🤖 AI Processing',
                description: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
                status: 'building'
              });
              config.buildProgress = {
                current: 3,
                total: 5,
                message: 'Adding AI processing...'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`🤖 Setting up AI processing: ${description.substring(0, 50)}...`);
              
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Mark processing as complete and add output block
              config.visualBlocks[2].status = 'complete';
              config.visualBlocks.push({
                id: 'output',
                type: 'output',
                name: '📤 Generate Output',
                description: 'Formatting results',
                status: 'building'
              });
              config.buildProgress = {
                current: 4,
                total: 5,
                message: 'Configuring output...'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`📤 Preparing output formatting...`);
              
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Add final completion block
              config.visualBlocks[3].status = 'complete';
              config.visualBlocks.push({
                id: 'complete',
                type: 'complete',
                name: '✅ Complete',
                description: 'Workflow ready!',
                status: 'complete'
              });
              
              // Add main instruction to steps
              config.steps.push({
                type: "llmInstruction",
                config: {
                  instruction: description,
                  resultVariable: "result"
                }
              });
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Complete workflow with celebration
              config.active = true;
              config.status = 'complete';
              config.buildProgress = {
                current: 5,
                total: 5,
                message: '🎉 Workflow complete!'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              
              // Clean up progress after 2 seconds
              setTimeout(async () => {
                delete config.buildProgress;
                await AgentFlows.saveFlow(config.name, config, workflowUuid);
              }, 2000);
              
              aibitat.introspect(`🎉 Workflow "${workflowName}" created successfully!`);
              
              // Return a string message instead of object to avoid chat system errors
              return `✅ Workflow "${workflowName}" created!\n\nDescription: ${description}\n\nThe workflow is now visible in your Flow Panel and ready to use!`;
              
            } catch (error) {
              console.error("❌ [CreateWorkflow] Error:", error);
              // Return error as string to avoid chat system errors
              return `Failed to create workflow: ${error.message}`;
            }
          }
        });
        
        console.log("✅ [CreateWorkflow] Plugin setup complete");
      }
    };
  }
};

module.exports = {
  createWorkflow,
  "create-workflow": createWorkflow // Also export with dash name
};