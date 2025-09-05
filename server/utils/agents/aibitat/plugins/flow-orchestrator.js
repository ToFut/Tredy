/**
 * Flow Orchestrator Plugin
 * Automatically creates and executes flows for multi-step requests
 */

const { AgentFlows } = require("../../../agentFlows");
const { DynamicFlowBuilder } = require("../../flowBuilder/dynamicFlowBuilder");

const flowOrchestrator = {
  name: "flow-orchestrator",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "flow-orchestrator",
      setup(aibitat) {
        aibitat.function({
          name: "execute_multi_step_task",
          description: `🚨 PRIMARY TOOL FOR COMPLEX REQUESTS 🚨
          
          Use this when user requests multiple actions in sequence:
          - Contains "and", "then", "also", "after", "next"
          - Multiple verbs: "check X and send Y", "get A then create B"
          - Sequential tasks: "first do X, then Y, finally Z"
          
          Examples that REQUIRE this tool:
          • "check my email and summarize important ones, then send summary to john@example.com"
          • "get my calendar for today, read recent emails, create a briefing and email it"
          • "search for news about AI, analyze trends, and post summary to LinkedIn"
          
          This ensures ALL requested actions are completed in the correct order!`,
          parameters: {
            type: "object", 
            properties: {
              user_request: {
                type: "string",
                description: "The complete multi-step request from the user"
              },
              save_workflow: {
                type: "boolean",
                description: "If true, saves the generated workflow for future reuse. Default: false",
                default: false
              },
              workflow_name: {
                type: "string", 
                description: "Custom name for saved workflow (only used if save_workflow is true)"
              }
            },
            required: ["user_request"]
          },
          handler: async function({ user_request, save_workflow = false, workflow_name }) {
            try {
              if (!user_request || user_request.trim() === '') {
                return `❌ Please provide a multi-step task description. For example: "Check my emails and create a summary report"`;
              }
              
              aibitat.introspect(`🔄 Creating dynamic flow for multi-step task: "${user_request}"`);
              
              // Use existing DynamicFlowBuilder to create flow
              const flowBuilder = new DynamicFlowBuilder();
              const flowConfig = await flowBuilder.createFlowFromPrompt(user_request, {});
              
              if (!flowConfig || !flowConfig.steps) {
                // Fallback: create simple LLM instruction flow
                flowConfig = {
                  name: `Auto: ${user_request.substring(0, 30)}...`,
                  description: `Auto-generated flow for: ${user_request}`,
                  active: true,
                  steps: [
                    {
                      type: "start",
                      config: { variables: [] }
                    },
                    {
                      type: "llmInstruction", 
                      config: {
                        instruction: `Execute this complete multi-step request: ${user_request}. Complete ALL requested actions in sequence. Be thorough and detailed.`,
                        resultVariable: "result",
                        directOutput: true
                      }
                    }
                  ]
                };
              }
              
              aibitat.introspect(`✅ Created flow with ${flowConfig.steps.length} steps`);
              
              // Save as temporary flow using AgentFlows
              const flowName = `Auto-Generated: ${user_request.substring(0, 40)}...`;
              const saveResult = AgentFlows.saveFlow(flowName, flowConfig);
              
              if (!saveResult.success) {
                throw new Error(`Failed to save flow: ${saveResult.error}`);
              }
              
              aibitat.introspect(`💾 Flow saved with UUID: ${saveResult.uuid}`);
              
              // Execute the flow immediately using AgentFlows
              const result = await AgentFlows.executeFlow(saveResult.uuid, {}, aibitat);
              
              // Only clean up if not saving
              if (!save_workflow) {
                AgentFlows.deleteFlow(saveResult.uuid);
                aibitat.introspect(`🗑️ Temporary flow cleaned up`);
              } else {
                // Update flow with custom name if provided
                if (workflow_name) {
                  const renamedFlow = AgentFlows.loadFlow(saveResult.uuid);
                  if (renamedFlow) {
                    renamedFlow.config.name = workflow_name;
                    renamedFlow.config.description = `Saved from: ${user_request}`;
                    AgentFlows.saveFlow(workflow_name, renamedFlow.config, saveResult.uuid);
                  }
                }
                aibitat.introspect(`💾 Workflow saved permanently with UUID: ${saveResult.uuid}`);
                aibitat.introspect(`📍 You can find it in Admin > Agent Skills > Agent Flows`);
              }
              
              if (!result.success) {
                const failedStep = result.results?.find(r => !r.success);
                return `❌ Workflow execution failed: ${failedStep?.error || 'Unknown error'}`;
              }
              
              aibitat.introspect(`🎉 Multi-step task completed successfully!`);
              
              // If there's direct output, return it
              if (result.directOutput) {
                return result.directOutput;
              }
              
              // Format comprehensive results
              let output = `✅ **Multi-Step Task Completed Successfully**\n\n`;
              
              if (save_workflow) {
                output += `💾 **Workflow Saved**: ${workflow_name || flowName}\n`;
                output += `📍 Location: Admin → Agent Skills → Agent Flows\n`;
                output += `🔁 This workflow can now be reused anytime!\n\n`;
              }
              
              if (result.results && result.results.length > 0) {
                result.results.forEach((stepResult, index) => {
                  if (stepResult.success) {
                    output += `**Step ${index + 1}:** ✅\n`;
                    
                    if (stepResult.result) {
                      if (typeof stepResult.result === 'string') {
                        output += `${stepResult.result}\n\n`;
                      } else {
                        output += `${JSON.stringify(stepResult.result, null, 2)}\n\n`;
                      }
                    }
                  } else {
                    output += `**Step ${index + 1}:** ❌ ${stepResult.error}\n\n`;
                  }
                });
                
                const successCount = result.results.filter(r => r.success).length;
                output += `📊 **Summary:** Successfully completed ${successCount}/${result.results.length} steps`;
              } else {
                output += "All requested actions have been completed.";
              }
              
              return output;
              
            } catch (error) {
              aibitat.introspect(`💥 Flow orchestration error: ${error.message}`);
              return `❌ Failed to execute multi-step task: ${error.message}`;
            }
          }
        });

        // Create workflow function
        aibitat.function({
          name: "create_workflow",
          description: "Create a reusable workflow from a task description without executing it",
          parameters: {
            type: "object",
            properties: {
              workflow_name: {
                type: "string",
                description: "Name for the workflow"
              },
              task_description: {
                type: "string",
                description: "Description of the multi-step task this workflow should perform"
              }
            },
            required: ["workflow_name", "task_description"]
          },
          handler: async function({ workflow_name, task_description }) {
            try {
              if (!workflow_name || !task_description) {
                return `❌ Please provide both a workflow name and task description`;
              }

              aibitat.introspect(`📝 Creating workflow: "${workflow_name}"`);
              
              // Use DynamicFlowBuilder to create flow
              const flowBuilder = new DynamicFlowBuilder();
              let flowConfig = await flowBuilder.createFlowFromPrompt(task_description, {});
              
              if (!flowConfig || !flowConfig.steps) {
                // Fallback: create simple workflow
                flowConfig = {
                  name: workflow_name,
                  description: task_description,
                  active: true,
                  steps: [
                    {
                      type: "start",
                      config: { variables: [] }
                    },
                    {
                      type: "llmInstruction",
                      config: {
                        instruction: task_description,
                        resultVariable: "result",
                        directOutput: true
                      }
                    }
                  ]
                };
              } else {
                flowConfig.name = workflow_name;
                flowConfig.description = task_description;
              }
              
              // Save the workflow
              const saveResult = AgentFlows.saveFlow(workflow_name, flowConfig);
              
              if (!saveResult.success) {
                return `❌ Failed to save workflow: ${saveResult.error}`;
              }
              
              aibitat.introspect(`✅ Workflow created with UUID: ${saveResult.uuid}`);
              
              return `✅ **Workflow Created Successfully!**

📝 **Name**: ${workflow_name}
📄 **Description**: ${task_description}
🔢 **Steps**: ${flowConfig.steps.length}
💾 **UUID**: ${saveResult.uuid}

📍 **Location**: Admin → Agent Skills → Agent Flows
🚀 **Usage**: The workflow "${workflow_name}" is now available as a tool for this agent!

You can now:
- Run it by saying "execute my ${workflow_name} workflow"
- Edit it in the Agent Builder
- Toggle it on/off in Agent Flows settings`;
              
            } catch (error) {
              aibitat.introspect(`❌ Workflow creation failed: ${error.message}`);
              return `❌ Failed to create workflow: ${error.message}`;
            }
          }
        });

        // Simple detection helper
        aibitat.function({
          name: "analyze_request_complexity",
          description: "Determine if a request needs multi-step orchestration",
          parameters: {
            type: "object",
            properties: {
              request: {
                type: "string",
                description: "User request to analyze"
              }
            },
            required: ["request"]
          },
          handler: async function({ request }) {
            const multiStepIndicators = [
              'and then', 'after that', 'next', 'also', 'then',
              'and send', 'and create', 'and post', 'and email',
              'first.*then', 'get.*and.*send', 'check.*then'
            ];
            
            const lower = request.toLowerCase();
            const hasMultipleSteps = multiStepIndicators.some(indicator => {
              if (indicator.includes('.*')) {
                return new RegExp(indicator).test(lower);
              }
              return lower.includes(indicator);
            });
            
            const actionCount = ['check', 'get', 'send', 'create', 'read', 'post', 'email'].filter(verb => 
              lower.includes(verb)
            ).length;
            
            if (hasMultipleSteps || actionCount >= 2) {
              return `This request requires multi-step orchestration. Use execute_multi_step_task with the full request.`;
            }
            
            return `This appears to be a single-step request. Use individual tools directly.`;
          }
        });
      }
    };
  }
};

module.exports = { flowOrchestrator };