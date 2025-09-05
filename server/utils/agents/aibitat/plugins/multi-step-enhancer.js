/**
 * Multi-Step Task Enhancer
 * Helps agents better handle multi-step requests without requiring workflows
 */

const multiStepEnhancer = {
  name: "multi_step_enhancer",
  description: "Enhances agent's ability to handle multi-step tasks",
  plugin: function () {
    return {
      name: this.name,
      description: this.description,
      setup(aibitat) {
        // Plan multi-step tasks
        aibitat.function({
          name: "plan_multi_step_task",
          description: `ALWAYS use this tool FIRST when user requests multiple actions.
          
          Indicators to use this tool:
          - Request contains "and", "then", "after", "also"
          - Multiple actions mentioned (check, send, create, etc.)
          - Complex instructions with multiple outcomes
          
          This ensures ALL requested actions are completed.`,
          parameters: {
            type: "object",
            properties: {
              user_request: {
                type: "string",
                description: "The original user request"
              },
              detected_steps: {
                type: "array",
                description: "List of steps you identified",
                items: {
                  type: "object",
                  properties: {
                    step_number: { type: "number" },
                    action: { type: "string", description: "What to do" },
                    tool: { type: "string", description: "Tool to use" },
                    depends_on: { type: "number", description: "Previous step number if dependent" }
                  }
                }
              }
            },
            required: ["user_request", "detected_steps"]
          },
          handler: async function({ user_request, detected_steps }) {
            // Store the plan in context
            aibitat.context = aibitat.context || {};
            aibitat.context.currentPlan = {
              request: user_request,
              steps: detected_steps,
              completed: [],
              results: {}
            };
            
            const stepsList = detected_steps.map(s => 
              `${s.step_number}. ${s.action} (using ${s.tool})`
            ).join('\n');
            
            aibitat.introspect(`Created execution plan with ${detected_steps.length} steps`);
            
            return `📋 **Execution Plan Created**
            
**User Request:** ${user_request}

**Steps to Execute:**
${stepsList}

Now executing each step in sequence...`;
          }
        });

        // Track step completion
        aibitat.function({
          name: "complete_step",
          description: "Mark a step as completed and store its result",
          parameters: {
            type: "object",
            properties: {
              step_number: { type: "number" },
              result: { type: "string", description: "Result of the step" },
              success: { type: "boolean" }
            },
            required: ["step_number", "success"]
          },
          handler: async function({ step_number, result, success }) {
            if (!aibitat.context?.currentPlan) {
              return "No active plan to track.";
            }
            
            const plan = aibitat.context.currentPlan;
            plan.completed.push(step_number);
            plan.results[step_number] = { result, success };
            
            const remaining = plan.steps.filter(s => 
              !plan.completed.includes(s.step_number)
            );
            
            if (remaining.length === 0) {
              // All done - create summary
              const summary = plan.steps.map(s => {
                const r = plan.results[s.step_number];
                return `${s.step_number}. ${s.action}: ${r?.success ? '✅' : '❌'}`;
              }).join('\n');
              
              return `✅ **All Steps Completed**
              
${summary}

Task "${plan.request}" has been fully executed.`;
            }
            
            return `Step ${step_number} completed. ${remaining.length} steps remaining.`;
          }
        });

        // Verify all requested actions were taken
        aibitat.function({
          name: "verify_completion",
          description: "Verify all requested actions were completed",
          parameters: {
            type: "object",
            properties: {
              original_request: { type: "string" },
              actions_taken: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["original_request", "actions_taken"]
          },
          handler: async function({ original_request, actions_taken }) {
            // Parse common action keywords
            const actionKeywords = [
              'check', 'read', 'get', 'fetch',
              'summarize', 'analyze', 'extract',
              'send', 'create', 'post', 'notify',
              'invite', 'schedule', 'book'
            ];
            
            const requestLower = original_request.toLowerCase();
            const requestedActions = actionKeywords.filter(keyword => 
              requestLower.includes(keyword)
            );
            
            const completed = actions_taken.map(a => a.toLowerCase());
            const missed = requestedActions.filter(action => 
              !completed.some(c => c.includes(action))
            );
            
            if (missed.length > 0) {
              return `⚠️ **Incomplete Execution**
              
Requested actions not completed: ${missed.join(', ')}

Please complete these remaining actions.`;
            }
            
            return `✅ All requested actions appear to be completed.`;
          }
        });

        // Optional: Save successful multi-step execution as workflow
        aibitat.function({
          name: "save_execution_as_workflow",
          description: "Save the last successful multi-step execution as a reusable workflow",
          parameters: {
            type: "object",
            properties: {
              workflow_name: {
                type: "string",
                description: "Name for the saved workflow"
              },
              description: {
                type: "string",
                description: "Description of what this workflow does"
              }
            },
            required: ["workflow_name"]
          },
          handler: async function({ workflow_name, description }) {
            if (!aibitat.context?.currentPlan) {
              return "No execution plan to save.";
            }
            
            const plan = aibitat.context.currentPlan;
            
            // Convert execution plan to Agent Flow format
            const { AgentFlows } = require("../../../agentFlows");
            const { v4: uuidv4 } = require("uuid");
            
            const flowSteps = [
              {
                type: "start",
                config: { variables: [] }
              }
            ];
            
            // Add each step from the plan
            plan.steps.forEach(step => {
              // Map tool to flow step type
              let stepType = "llm_instruction"; // default
              let stepConfig = {
                prompt: step.action,
                resultVariable: `step_${step.step_number}_result`
              };
              
              // You could enhance this mapping based on tool types
              if (step.tool.includes('gmail') || step.tool.includes('email')) {
                stepType = "api_call";
                stepConfig = {
                  method: "POST",
                  resultVariable: `step_${step.step_number}_result`
                };
              }
              
              flowSteps.push({
                type: stepType,
                config: stepConfig
              });
            });
            
            const flowConfig = {
              name: workflow_name,
              description: description || plan.request,
              steps: flowSteps,
              created_at: new Date().toISOString()
            };
            
            const result = AgentFlows.saveFlow(
              workflow_name,
              flowConfig,
              uuidv4()
            );
            
            if (result.success) {
              return `✅ Workflow "${workflow_name}" saved successfully!
              
You can now:
- Run it: "Execute ${workflow_name} workflow"
- Schedule it: "Schedule ${workflow_name} daily"`;
            }
            
            return `Failed to save workflow: ${result.error}`;
          }
        });
      }
    };
  }
};

module.exports = multiStepEnhancer;