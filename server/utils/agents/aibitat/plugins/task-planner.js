/**
 * Task Planner Plugin
 * Forces agent to create and track a to-do list for multi-step requests
 */

const taskPlanner = {
  name: "task-planner",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        // Initialize task tracking in context
        aibitat.taskPlan = {
          tasks: [],
          completed: [],
          failed: []
        };

        // Create task plan
        aibitat.function({
          name: "create_task_plan", 
          description: `🚨 CRITICAL PRIORITY TOOL 🚨 - ALWAYS use this FIRST before ANY other tools when user requests multiple actions.

          MANDATORY for requests containing:
          - Multiple action words: "check AND get", "send AND create", "then", "after", "also"
          - Multiple steps: "do X, then Y", "get A and send B" 
          - Multiple targets/recipients
          - Sequential operations

          Example: "check email and send summary" = 2 actions → MUST use create_task_plan first!
          
          This prevents forgetting tasks and ensures completion!`,
          parameters: {
            type: "object",
            properties: {
              tasks: {
                type: "array",
                description: "List of tasks to complete",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", description: "Task ID (e.g., task_1)" },
                    description: { type: "string", description: "What to do" },
                    tool_needed: { type: "string", description: "Tool name to use" },
                    depends_on: { type: "string", description: "ID of task this depends on" }
                  },
                  required: ["id", "description", "tool_needed"]
                }
              }
            },
            required: ["tasks"]
          },
          handler: async function({ tasks }) {
            // Store the plan
            aibitat.taskPlan.tasks = tasks;
            aibitat.taskPlan.completed = [];
            aibitat.taskPlan.failed = [];
            
            const taskList = tasks.map((t, i) => 
              `${i + 1}. ${t.description} [${t.tool_needed}]`
            ).join('\n');
            
            aibitat.introspect(`Created task plan with ${tasks.length} tasks`);
            
            return `📋 **Task Plan Created**

**Tasks to Complete:**
${taskList}

Now executing each task in order. I will track completion and ensure all tasks are done.`;
          }
        });

        // Mark task complete
        aibitat.function({
          name: "mark_task_complete",
          description: "Mark a task as completed",
          parameters: {
            type: "object",
            properties: {
              task_id: { type: "string", description: "ID of completed task" },
              result_summary: { type: "string", description: "Brief result summary" }
            },
            required: ["task_id"]
          },
          handler: async function({ task_id, result_summary }) {
            if (!aibitat.taskPlan.tasks.length) {
              return "No active task plan.";
            }
            
            aibitat.taskPlan.completed.push(task_id);
            
            const remaining = aibitat.taskPlan.tasks.filter(t => 
              !aibitat.taskPlan.completed.includes(t.id) &&
              !aibitat.taskPlan.failed.includes(t.id)
            );
            
            if (remaining.length === 0) {
              const summary = aibitat.taskPlan.tasks.map(t => {
                const status = aibitat.taskPlan.completed.includes(t.id) ? '✅' : 
                               aibitat.taskPlan.failed.includes(t.id) ? '❌' : '⏭️';
                return `${status} ${t.description}`;
              }).join('\n');
              
              return `🎉 **All Tasks Completed!**

${summary}`;
            }
            
            const nextTask = remaining[0];
            return `✅ Task "${task_id}" completed.

**Next Task:** ${nextTask.description}
**Tool Required:** ${nextTask.tool_needed}

${remaining.length - 1} more tasks remaining.`;
          }
        });

        // Check remaining tasks
        aibitat.function({
          name: "check_remaining_tasks",
          description: "Check what tasks are still pending",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async function() {
            if (!aibitat.taskPlan.tasks.length) {
              return "No active task plan.";
            }
            
            const remaining = aibitat.taskPlan.tasks.filter(t => 
              !aibitat.taskPlan.completed.includes(t.id) &&
              !aibitat.taskPlan.failed.includes(t.id)
            );
            
            if (remaining.length === 0) {
              return "✅ All tasks completed!";
            }
            
            const taskList = remaining.map(t => 
              `- ${t.description} [${t.tool_needed}]`
            ).join('\n');
            
            return `📋 **Remaining Tasks:**

${taskList}

Please continue with the next task.`;
          }
        });

        // Override completion to check tasks
        const originalComplete = aibitat.complete?.bind(aibitat);
        if (originalComplete) {
          aibitat.complete = async function(...args) {
            // If there's an active plan with remaining tasks
            if (aibitat.taskPlan?.tasks?.length > 0) {
              const remaining = aibitat.taskPlan.tasks.filter(t => 
                !aibitat.taskPlan.completed.includes(t.id)
              );
              
              if (remaining.length > 0) {
                aibitat.introspect(`⚠️ ${remaining.length} tasks still pending!`);
                // Force the agent to check remaining tasks
                return {
                  functionCall: {
                    name: "check_remaining_tasks",
                    arguments: {}
                  }
                };
              }
            }
            
            return originalComplete(...args);
          };
        }
      }
    };
  }
};

module.exports = { taskPlanner };