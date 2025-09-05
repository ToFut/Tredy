/**
 * Execute Multi-Step Plugin
 * A single, comprehensive plugin that ensures ALL requested actions are completed
 * Replaces: auto-workflow, multi-step-enhancer, flow-orchestrator
 */

const executeMultiStep = {
  name: "execute-multi-step",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "execute-multi-step",
      setup(aibitat) {
        // Intercept and redirect multi-action requests
        const originalFunctionHandler = aibitat.function.bind(aibitat);
        
        // Override function registration to add multi-step detection
        aibitat.function = function(config) {
          const originalHandler = config.handler;
          
          // Wrap handlers to detect multi-step needs
          if (config.name && (config.name.includes('book_meeting') || 
              config.name.includes('send_email') ||
              config.name.includes('calendar'))) {
            
            // Store original handler
            const wrappedHandler = async function(args) {
              // Check if the current message context suggests multiple actions
              const lastMessage = aibitat._chats?.slice(-1)[0]?.content || '';
              
              // Patterns that indicate multiple recipients/actions
              const multiPatterns = [
                /\band\b.*\b(to|for|with)\b/i,
                /both\s+\w+@/i,
                /\w+@[\w.-]+.*\w+@[\w.-]+/i, // Multiple emails
                /smile\s+\d+.*smile\s+\d+/i  // Multiple "smile" patterns
              ];
              
              const needsMultiStep = multiPatterns.some(pattern => 
                pattern.test(lastMessage)
              );
              
              if (needsMultiStep) {
                aibitat.introspect(`⚠️ Multiple actions detected. Redirecting to multi-step handler...`);
                
                // Force the agent to recognize it must use execute_multi_step_task
                const errorMsg = `STOP! This request has multiple recipients/actions.
                
You MUST use execute_multi_step_task with these parameters:
{
  "user_request": "${lastMessage}",
  "steps": [
    // Create a step for EACH recipient/action
    // Each step should have: step_number, description, tool_to_use, parameters
  ]
}

DO NOT call ${config.name} directly. Use execute_multi_step_task instead.`;
                
                return errorMsg;
              }
              
              // Single action - proceed normally
              return originalHandler.call(this, args);
            };
            
            // Mark as wrapped and store original
            wrappedHandler._isWrapped = true;
            wrappedHandler._original = originalHandler;
            config.handler = wrappedHandler;
          }
          
          return originalFunctionHandler(config);
        };
        
        // Main function that handles ALL multi-step requests
        aibitat.function({
          name: "execute_multi_step_task",
          description: `🚨 MANDATORY: Use this for requests with multiple recipients or actions!
          
          MUST USE when you see:
          - "and" between recipients/actions (e.g., "send to A and B")
          - Multiple email addresses mentioned
          - Words like: both, each, all, everyone
          - Multiple similar actions needed
          
          DO NOT call individual tools directly when multiple actions are needed.
          This function ensures ALL actions complete, not just the first!`,
          parameters: {
            type: "object",
            properties: {
              user_request: {
                type: "string",
                description: "The complete original user request"
              },
              steps: {
                type: "array",
                description: "All individual steps that need to be executed",
                items: {
                  type: "object",
                  properties: {
                    step_number: { 
                      type: "number",
                      description: "Step order (1, 2, 3...)"
                    },
                    description: { 
                      type: "string",
                      description: "What this step does"
                    },
                    tool_to_use: {
                      type: "string", 
                      description: "Which tool/function to call"
                    },
                    parameters: {
                      type: "object",
                      description: "Parameters for the tool call"
                    }
                  },
                  required: ["step_number", "description", "tool_to_use", "parameters"]
                }
              }
            },
            required: ["user_request", "steps"]
          },
          handler: async function({ user_request, steps }) {
            aibitat.introspect(`📋 Executing ${steps.length} steps for: "${user_request}"`);
            
            // Store execution context
            const executionContext = {
              request: user_request,
              totalSteps: steps.length,
              completedSteps: [],
              results: [],
              errors: []
            };
            
            // Execute each step sequentially
            for (const step of steps) {
              try {
                aibitat.introspect(`\nStep ${step.step_number}/${steps.length}: ${step.description}`);
                
                // Find the function to execute
                let fn = aibitat.functions.get(step.tool_to_use);
                
                // Try to find the actual underlying function if wrapped
                if (!fn) {
                  // Look through all registered functions for a match
                  for (const [name, func] of aibitat.functions.entries()) {
                    if (name.includes(step.tool_to_use) || step.tool_to_use.includes(name)) {
                      fn = func;
                      break;
                    }
                  }
                }
                
                if (!fn) {
                  // If function not found, record error but continue with other steps
                  const error = `Tool '${step.tool_to_use}' not found. Available tools: ${Array.from(aibitat.functions.keys()).join(', ')}`;
                  executionContext.errors.push({ step: step.step_number, error });
                  aibitat.introspect(`❌ ${error}`);
                  continue;
                }
                
                // Temporarily disable the interceptor for this call
                const originalHandler = fn.handler;
                if (originalHandler._isWrapped) {
                  // Get the original unwrapped handler
                  fn.handler = originalHandler._original || originalHandler;
                }
                
                // Execute the tool
                aibitat.introspect(`Calling ${step.tool_to_use} with params:`, step.parameters);
                const result = await fn.handler(step.parameters);
                
                // Restore wrapper if needed
                if (originalHandler._isWrapped) {
                  fn.handler = originalHandler;
                }
                
                // Record success
                executionContext.completedSteps.push(step.step_number);
                executionContext.results.push({
                  step: step.step_number,
                  description: step.description,
                  result: result
                });
                
                aibitat.introspect(`✅ Step ${step.step_number} completed`);
                
              } catch (error) {
                // Record error but continue with other steps
                executionContext.errors.push({ 
                  step: step.step_number, 
                  error: error.message 
                });
                aibitat.introspect(`❌ Step ${step.step_number} failed: ${error.message}`);
              }
            }
            
            // Generate comprehensive summary
            const successCount = executionContext.completedSteps.length;
            const failureCount = executionContext.errors.length;
            
            let summary = `## Task Execution Summary\n\n`;
            summary += `**Request:** ${user_request}\n\n`;
            summary += `**Results:** ${successCount}/${steps.length} steps completed successfully\n\n`;
            
            // Detail successful steps
            if (executionContext.results.length > 0) {
              summary += `### ✅ Completed Steps:\n`;
              for (const result of executionContext.results) {
                summary += `- Step ${result.step}: ${result.description}\n`;
                if (result.result && typeof result.result === 'string' && result.result.length < 200) {
                  summary += `  Result: ${result.result}\n`;
                }
              }
              summary += `\n`;
            }
            
            // Detail failed steps
            if (executionContext.errors.length > 0) {
              summary += `### ❌ Failed Steps:\n`;
              for (const error of executionContext.errors) {
                summary += `- Step ${error.step}: ${error.error}\n`;
              }
              summary += `\n`;
            }
            
            // IMPORTANT: Tell the LLM what still needs to be done
            const remainingSteps = steps.filter(s => 
              !executionContext.completedSteps.includes(s.step_number) &&
              !executionContext.errors.some(e => e.step === s.step_number)
            );
            
            if (remainingSteps.length > 0) {
              summary += `### ⏳ Remaining Steps:\n`;
              for (const step of remainingSteps) {
                summary += `- Step ${step.step_number}: ${step.description}\n`;
              }
              summary += `\nThese steps still need to be executed. Continue with the next tool calls.\n`;
            } else if (successCount === steps.length) {
              summary += `### ✨ All requested actions have been completed successfully!\n`;
            }
            
            return summary;
          }
        });

        // Helper function to check if a request needs multi-step handling
        aibitat.function({
          name: "analyze_request_complexity",
          description: "Analyze if a request needs multi-step execution",
          parameters: {
            type: "object",
            properties: {
              request: {
                type: "string",
                description: "The user's request"
              }
            },
            required: ["request"]
          },
          handler: async function({ request }) {
            // Keywords that indicate multiple steps
            const multiStepIndicators = [
              ' and ', ' then ', ' after ', ' also ', ' both ',
              ' each ', ' all ', ' every ', ' multiple ',
              'first ', 'second ', 'finally ', 'lastly ',
              ' to .* and .* to ', // pattern for "send to A and to B"
            ];
            
            const requestLower = request.toLowerCase();
            const needsMultiStep = multiStepIndicators.some(indicator => {
              if (indicator.includes('.*')) {
                // It's a regex pattern
                const regex = new RegExp(indicator);
                return regex.test(requestLower);
              }
              return requestLower.includes(indicator);
            });
            
            if (needsMultiStep) {
              return `This request requires multiple steps. Use execute_multi_step_task to ensure all actions are completed.`;
            }
            
            return `This appears to be a single-step request. Proceed with direct tool execution.`;
          }
        });
      }
    };
  },
};

module.exports = { executeMultiStep };