/**
 * Smart Workflow Creator Plugin
 * Creates workflows on-demand and then executes them
 * This uses the existing infrastructure instead of fighting against it
 */

const { AgentFlows } = require("../../../agentFlows");
const { DynamicFlowBuilder } = require("../../flowBuilder/dynamicFlowBuilder");

const smartWorkflowCreator = {
  name: "smart-workflow-creator",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "smart-workflow-creator",
      setup(aibitat) {
        // Function to detect and create workflow
        aibitat.function({
          name: "create_and_execute_workflow",
          description: `🎯 SMART WORKFLOW SYSTEM - USE THIS FIRST!
          
          Automatically creates a workflow from any request, saves it, and executes it.
          Use this for ANY request that involves actions like:
          - Send email/invite
          - Check calendar
          - Multiple tasks
          - Any "do X and Y" request
          
          This ensures proper execution by creating a reusable workflow first.`,
          parameters: {
            type: "object",
            properties: {
              task_description: {
                type: "string",
                description: "What the user wants to accomplish"
              },
              workflow_name: {
                type: "string", 
                description: "Short name for the workflow (auto-generated if not provided)"
              },
              variables: {
                type: "object",
                description: "Any variables needed (emails, names, dates, etc.)",
                additionalProperties: { type: "string" }
              }
            },
            required: ["task_description"]
          },
          handler: async function({ task_description, workflow_name, variables = {} }) {
            try {
              aibitat.introspect(`🔧 Creating smart workflow for: "${task_description}"`);
              
              // Step 1: Create workflow using DynamicFlowBuilder
              const flowBuilder = new DynamicFlowBuilder();
              let flowConfig = await flowBuilder.createFlowFromPrompt(task_description, variables);
              
              if (!flowConfig || !flowConfig.steps) {
                // Fallback: create simple workflow
                flowConfig = {
                  name: workflow_name || `Auto: ${task_description.substring(0, 30)}`,
                  description: task_description,
                  active: true,
                  steps: [
                    {
                      type: "start",
                      config: { 
                        variables: Object.entries(variables).map(([name, value]) => ({ name, value }))
                      }
                    },
                    {
                      type: "llmInstruction",
                      config: {
                        instruction: `Complete this task: ${task_description}. Be thorough and execute all requested actions.`,
                        resultVariable: "result",
                        directOutput: true
                      }
                    }
                  ]
                };
              }
              
              // Ensure it has a good name
              if (!flowConfig.name) {
                flowConfig.name = workflow_name || `Auto: ${task_description.substring(0, 30)}`;
              }
              flowConfig.description = task_description;
              flowConfig.active = true;
              
              aibitat.introspect(`📝 Workflow structure created with ${flowConfig.steps.length} steps`);
              
              // Step 2: Save the workflow
              const saveResult = AgentFlows.saveFlow(flowConfig.name, flowConfig);
              
              if (!saveResult.success) {
                throw new Error(`Failed to save workflow: ${saveResult.error}`);
              }
              
              aibitat.introspect(`💾 Workflow saved with UUID: ${saveResult.uuid}`);
              aibitat.introspect(`🔄 Workflow is now available as tool: flow_${saveResult.uuid}`);
              
              // Step 3: Execute the workflow immediately
              aibitat.introspect(`🚀 Executing workflow...`);
              const result = await AgentFlows.executeFlow(saveResult.uuid, variables, aibitat);
              
              if (!result.success) {
                throw new Error(`Workflow execution failed: ${result.results?.[0]?.error || 'Unknown error'}`);
              }
              
              aibitat.introspect(`✅ Workflow executed successfully!`);
              
              // Return comprehensive result
              let output = `✅ **Task Completed Successfully!**\n\n`;
              output += `📋 **Workflow Created**: ${flowConfig.name}\n`;
              output += `🔧 **UUID**: ${saveResult.uuid}\n`;
              output += `♻️ **Reusable**: You can now say "run ${flowConfig.name}" anytime!\n\n`;
              
              if (result.directOutput) {
                output += `**Result:**\n${result.directOutput}`;
              } else if (result.results && result.results.length > 0) {
                output += `**Steps Completed:**\n`;
                result.results.forEach((stepResult, index) => {
                  if (stepResult.success) {
                    output += `${index + 1}. ✅ ${stepResult.type || 'Step'} completed\n`;
                  }
                });
              }
              
              return output;
              
            } catch (error) {
              aibitat.introspect(`❌ Smart workflow failed: ${error.message}`);
              return `❌ Failed to create/execute workflow: ${error.message}`;
            }
          }
        });

        // Function to list available workflows
        aibitat.function({
          name: "list_my_workflows", 
          description: "List all available workflows that can be executed",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async function() {
            const flows = AgentFlows.listFlows();
            
            if (flows.length === 0) {
              return "No workflows available. Create one using create_and_execute_workflow!";
            }
            
            let output = `📋 **Available Workflows:**\n\n`;
            flows.forEach((flow, index) => {
              output += `${index + 1}. **${flow.name}**\n`;
              output += `   📝 ${flow.description}\n`;
              output += `   🔧 UUID: ${flow.uuid}\n`;
              output += `   ⚡ Status: ${flow.active ? 'Active' : 'Inactive'}\n\n`;
            });
            
            output += `\n💡 **To run a workflow**, say:\n`;
            output += `- "Run [workflow name]"\n`;
            output += `- "Execute flow_[uuid]"\n`;
            
            return output;
          }
        });

        // Function to delete workflows
        aibitat.function({
          name: "delete_workflow",
          description: "Delete a workflow that's no longer needed",
          parameters: {
            type: "object",
            properties: {
              workflow_name_or_uuid: {
                type: "string",
                description: "The name or UUID of the workflow to delete"
              }
            },
            required: ["workflow_name_or_uuid"]
          },
          handler: async function({ workflow_name_or_uuid }) {
            const flows = AgentFlows.listFlows();
            const flow = flows.find(f => 
              f.name === workflow_name_or_uuid || 
              f.uuid === workflow_name_or_uuid ||
              f.uuid === workflow_name_or_uuid.replace('flow_', '')
            );
            
            if (!flow) {
              return `❌ Workflow "${workflow_name_or_uuid}" not found`;
            }
            
            const result = AgentFlows.deleteFlow(flow.uuid);
            
            if (result.success) {
              return `✅ Workflow "${flow.name}" deleted successfully`;
            } else {
              return `❌ Failed to delete workflow: ${result.error}`;
            }
          }
        });
      }
    };
  }
};

module.exports = { smartWorkflowCreator };