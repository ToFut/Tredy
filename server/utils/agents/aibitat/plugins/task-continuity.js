/**
 * Task Continuity Plugin
 * Ensures multi-part tasks complete fully with progress updates
 */

const taskContinuity = {
  name: "task-continuity",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "task-continuity",
      setup(aibitat) {
        // Initialize task tracking
        aibitat.taskState = {
          originalRequest: null,
          detectedTasks: [],
          completedTasks: [],
          inProgress: false
        };

        // Override handleExecution to detect and track multi-part tasks
        const originalHandleExecution = aibitat.handleExecution;
        if (originalHandleExecution && !originalHandleExecution._taskContinuityWrapped) {
          aibitat.handleExecution = async function(provider, messages, functions, byAgent) {
            // Detect if this is a multi-part request on first pass
            const userMessage = messages.find(m => m.role === 'user')?.content || '';
            
            if (!aibitat.taskState.inProgress && userMessage) {
              // Detect multiple tasks in the request
              const emails = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
              const hasMultipleTasks = 
                emails.length > 1 || 
                userMessage.includes(' and ') ||
                userMessage.includes(' both ') ||
                userMessage.includes(' each ');
              
              if (hasMultipleTasks) {
                aibitat.taskState = {
                  originalRequest: userMessage,
                  detectedTasks: emails.length > 0 ? emails : ['Task 1', 'Task 2'],
                  completedTasks: [],
                  inProgress: true
                };
                
                // Send initial progress message
                aibitat.introspect(`📋 Detected ${aibitat.taskState.detectedTasks.length} tasks to complete`);
              }
            }
            
            // Execute normally
            const result = await originalHandleExecution.apply(this, arguments);
            
            // After execution, check if we need to continue
            if (aibitat.taskState.inProgress) {
              // Check if a function was just executed
              const lastMessage = messages[messages.length - 1];
              const wasFunction = lastMessage?.role === 'function';
              
              if (wasFunction) {
                // Record completion
                aibitat.taskState.completedTasks.push('Task completed');
                
                const completed = aibitat.taskState.completedTasks.length;
                const total = aibitat.taskState.detectedTasks.length;
                
                // Send progress update
                aibitat.introspect(`✅ Progress: ${completed}/${total} tasks completed`);
                
                // If not all tasks are done and LLM is trying to return text
                if (completed < total && typeof result === 'string') {
                  this.handlerProps?.log?.(`[task-continuity] ${completed}/${total} complete, forcing continuation...`);
                  
                  // Create continuation message
                  const remainingTasks = aibitat.taskState.detectedTasks.slice(completed);
                  const continueMsg = {
                    role: "system",
                    content: `Task ${completed} of ${total} complete. Continue with the next task for: ${remainingTasks[0]}. Call the appropriate function now.`
                  };
                  
                  // Force another cycle
                  return await this.handleExecution(
                    provider,
                    [...messages, continueMsg],
                    functions,
                    byAgent
                  );
                } else if (completed >= total) {
                  // All done
                  aibitat.introspect(`🎉 All ${total} tasks completed successfully!`);
                  aibitat.taskState.inProgress = false;
                }
              }
            }
            
            return result;
          };
          aibitat.handleExecution._taskContinuityWrapped = true;
        }

        // Add a function to manually check task progress
        aibitat.function({
          name: "check_task_progress",
          description: "Check the progress of multi-part task execution",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async function() {
            const state = aibitat.taskState;
            if (!state.inProgress) {
              return "No multi-part task in progress.";
            }
            
            const completed = state.completedTasks.length;
            const total = state.detectedTasks.length;
            const remaining = state.detectedTasks.slice(completed);
            
            return `Task Progress:
- Original request: "${state.originalRequest}"
- Progress: ${completed}/${total} tasks completed
- Remaining: ${remaining.join(', ')}
${completed < total ? '\nContinue with the next task.' : '\nAll tasks completed!'}`;
          }
        });

        // Send periodic progress updates via WebSocket
        aibitat.on('functionExecuted', (functionName, result) => {
          if (aibitat.taskState.inProgress) {
            const progress = {
              type: 'taskProgress',
              completed: aibitat.taskState.completedTasks.length,
              total: aibitat.taskState.detectedTasks.length,
              message: `Working on task ${aibitat.taskState.completedTasks.length + 1} of ${aibitat.taskState.detectedTasks.length}...`
            };
            
            // Send via websocket if available
            if (aibitat.socket) {
              aibitat.socket.send(JSON.stringify(progress));
            }
          }
        });
      }
    };
  },
};

module.exports = { taskContinuity };