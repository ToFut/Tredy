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
                }
              };
              
              // Save initial state
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`🏗️ Creating workflow: "${workflowName}"`);
              
              // Simulate progressive building
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Add start block
              config.steps.push({
                type: "start",
                config: { variables: [] }
              });
              config.visualBlocks.push({
                id: 'start',
                type: 'start',
                name: 'Start',
                status: 'complete'
              });
              config.buildProgress = {
                current: 1,
                total: 3,
                message: 'Added start block...'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`✅ Added start block`);
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Add main instruction block
              config.steps.push({
                type: "llmInstruction",
                config: {
                  instruction: description,
                  resultVariable: "result"
                }
              });
              config.visualBlocks.push({
                id: 'main',
                type: 'llmInstruction',
                name: 'Process Task',
                description: description,
                status: 'complete',
                connections: ['start']
              });
              config.buildProgress = {
                current: 2,
                total: 3,
                message: 'Added task block...'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`✅ Added task: ${description}`);
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Complete workflow
              config.active = true;
              config.status = 'complete';
              config.buildProgress = {
                current: 3,
                total: 3,
                message: '🎉 Workflow complete!'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              
              // Clean up progress after 2 seconds
              setTimeout(async () => {
                delete config.buildProgress;
                await AgentFlows.saveFlow(config.name, config, workflowUuid);
              }, 2000);
              
              aibitat.introspect(`🎉 Workflow "${workflowName}" created successfully!`);
              
              return {
                success: true,
                message: `✅ Workflow "${workflowName}" created!\n\nDescription: ${description}\n\nThe workflow is now visible in your Flow Panel and ready to use!`
              };
              
            } catch (error) {
              console.error("❌ [CreateWorkflow] Error:", error);
              return {
                success: false,
                message: `Failed to create workflow: ${error.message}`
              };
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