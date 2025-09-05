/**
 * Simple Task Tracker
 * Forces agent to continue execution until all tasks are done
 */

const simpleTaskTracker = {
  name: "task-tracker",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        // Override the completion function to prevent early stopping
        const originalComplete = aibitat.complete;
        
        aibitat.taskContext = {
          originalRequest: null,
          completedActions: [],
          pendingActions: []
        };

        // Force continuation tool
        aibitat.function({
          name: "continue_remaining_tasks",
          description: `🚨 CRITICAL: Use this when you've completed a task but more actions are needed.
          
          MANDATORY when the original request had multiple parts like:
          - "check X and do Y" - after doing X, call this to continue with Y
          - "get A, then send B" - after getting A, call this to continue with B
          - "do X, Y, and Z" - after each step, call this to continue
          
          This prevents forgetting the remaining tasks!`,
          parameters: {
            type: "object",
            properties: {
              completed_action: {
                type: "string",
                description: "What you just finished doing"
              },
              remaining_actions: {
                type: "array",
                items: { type: "string" },
                description: "What still needs to be done from the original request"
              }
            },
            required: ["completed_action", "remaining_actions"]
          },
          handler: async function({ completed_action, remaining_actions }) {
            aibitat.taskContext.completedActions.push(completed_action);
            aibitat.taskContext.pendingActions = remaining_actions;
            
            if (remaining_actions.length === 0) {
              return `✅ All tasks completed! Summary of what was done:\n${aibitat.taskContext.completedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`;
            }
            
            const next = remaining_actions[0];
            return `✅ Completed: ${completed_action}

📋 **Remaining tasks (${remaining_actions.length}):**
${remaining_actions.map((task, i) => `${i + 1}. ${task}`).join('\n')}

🎯 **Next action:** ${next}

Continue with the next task now!`;
          }
        });

        // Check completion status
        aibitat.function({
          name: "check_task_completion",
          description: "Check if all requested tasks have been completed",
          parameters: {
            type: "object",
            properties: {
              original_request: {
                type: "string",
                description: "The user's original multi-part request"
              }
            },
            required: ["original_request"]
          },
          handler: async function({ original_request }) {
            // Parse the request for action keywords
            const actionWords = [
              'check', 'get', 'read', 'fetch', 'retrieve',
              'send', 'email', 'create', 'make', 'post',
              'summarize', 'analyze', 'process'
            ];
            
            const foundActions = actionWords.filter(word => 
              original_request.toLowerCase().includes(word)
            );
            
            const completed = aibitat.taskContext.completedActions;
            
            if (completed.length < foundActions.length) {
              return `⚠️ **Incomplete Request**
              
**Original request:** ${original_request}
**Actions found:** ${foundActions.join(', ')}
**Completed so far:** ${completed.join(', ') || 'None'}

Please continue with the remaining actions!`;
            }
            
            return `✅ Request appears to be complete!`;
          }
        });
      }
    };
  }
};

module.exports = { simpleTaskTracker };