/**
 * Agent Loop Plugin - Implements the Think → Act → Observe → Think pattern
 * Based on Manus Agent architecture
 */

const agentLoop = {
  name: "agent-loop",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "agent-loop",
      setup(aibitat) {
        // Track the agent's current task state
        aibitat.agentState = {
          originalRequest: null,
          completedActions: [],
          pendingActions: [],
          observations: [],
          currentStep: 0
        };

        // Function to help agent track its progress
        aibitat.function({
          name: "track_progress",
          description: `Use this to track what you've done and what's left to do.
          Call this AFTER each action to record progress and determine next steps.`,
          parameters: {
            type: "object",
            properties: {
              original_request: {
                type: "string",
                description: "The complete original user request"
              },
              action_just_completed: {
                type: "string",
                description: "What action was just completed"
              },
              result_observed: {
                type: "string",
                description: "What was the result of that action"
              },
              remaining_actions: {
                type: "array",
                items: { type: "string" },
                description: "What actions still need to be done"
              }
            },
            required: ["original_request", "action_just_completed", "result_observed", "remaining_actions"]
          },
          handler: async function({ original_request, action_just_completed, result_observed, remaining_actions }) {
            // Update agent state
            aibitat.agentState.originalRequest = original_request;
            aibitat.agentState.completedActions.push(action_just_completed);
            aibitat.agentState.observations.push(result_observed);
            aibitat.agentState.pendingActions = remaining_actions;
            aibitat.agentState.currentStep++;
            
            // Provide feedback to continue or complete
            if (remaining_actions.length > 0) {
              aibitat.introspect(`✅ Completed: ${action_just_completed}`);
              aibitat.introspect(`📋 Still to do: ${remaining_actions.join(', ')}`);
              
              return `Progress Update:
              
**Completed:** ${action_just_completed}
**Result:** ${result_observed}

**Remaining Actions (${remaining_actions.length}):**
${remaining_actions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Continue with the next action.`;
            } else {
              const summary = aibitat.agentState.completedActions.join('\n- ');
              return `Task Complete!
              
**Original Request:** ${original_request}

**All Actions Completed:**
- ${summary}

All requested actions have been successfully completed.`;
            }
          }
        });

        // Function to analyze request complexity upfront
        aibitat.function({
          name: "plan_actions",
          description: `Use this FIRST when you receive a complex request.
          Break down the request into individual actions that need to be taken.`,
          parameters: {
            type: "object",
            properties: {
              request: {
                type: "string",
                description: "The user's request"
              },
              identified_actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action: { type: "string" },
                    target: { type: "string" },
                    details: { type: "string" }
                  }
                },
                description: "List of individual actions identified"
              }
            },
            required: ["request", "identified_actions"]
          },
          handler: async function({ request, identified_actions }) {
            aibitat.agentState.originalRequest = request;
            aibitat.agentState.pendingActions = identified_actions.map(a => a.action);
            
            aibitat.introspect(`📝 Planning ${identified_actions.length} actions for: "${request}"`);
            
            const actionList = identified_actions.map((a, i) => 
              `${i + 1}. ${a.action} for ${a.target}: ${a.details}`
            ).join('\n');
            
            return `Execution Plan Created:

**Request:** ${request}

**Actions to Execute:**
${actionList}

Now proceeding to execute each action in sequence...`;
          }
        });

        // Intercept function execution results to force continuation
        const originalFunction = aibitat.function.bind(aibitat);
        aibitat.function = function(config) {
          const originalHandler = config.handler;
          
          // Wrap the handler to detect when we need to continue
          config.handler = async function(...args) {
            const result = await originalHandler.apply(this, args);
            
            // Check if this looks like an email/calendar action
            const isActionTool = config.name && (
              config.name.includes('send_email') || 
              config.name.includes('book_meeting') ||
              config.name.includes('calendar') ||
              config.name.includes('gmail')
            );
            
            if (isActionTool && result && typeof result === 'string') {
              // Check the last user message for multiple recipients
              const lastUserMsg = aibitat._chats?.slice(-5).find(c => c.from === 'USER')?.content || '';
              
              // Patterns indicating multiple actions needed
              const hasMultipleActions = 
                (lastUserMsg.match(/\w+@[\w.-]+/g) || []).length > 1 || // Multiple emails
                /\band\b.*\b(to|for|with)\b/i.test(lastUserMsg) || // "and" pattern
                /smile\s+\d+.*smile\s+\d+/i.test(lastUserMsg); // Multiple smile codes
              
              if (hasMultipleActions) {
                // Check if we've already sent to all recipients
                const sentToPattern = /successfully sent to ([\w@.-]+)/gi;
                const alreadySent = [];
                let match;
                while ((match = sentToPattern.exec(result)) !== null) {
                  alreadySent.push(match[1].toLowerCase());
                }
                
                // Extract all email addresses from original request
                const allEmails = (lastUserMsg.match(/\w+@[\w.-]+/g) || [])
                  .map(e => e.toLowerCase());
                
                const remainingEmails = allEmails.filter(e => !alreadySent.includes(e));
                
                if (remainingEmails.length > 0) {
                  aibitat.introspect(`📧 Still need to send to: ${remainingEmails.join(', ')}`);
                  
                  // Force continuation by returning a special message
                  return result + `\n\n⚠️ IMPORTANT: You still need to send to ${remainingEmails.join(', ')}. Call the send_email or book_meeting function again for the remaining recipient(s).`;
                }
              }
            }
            
            return result;
          };
          
          return originalFunction(config);
        };
      }
    };
  },
};

module.exports = { agentLoop };