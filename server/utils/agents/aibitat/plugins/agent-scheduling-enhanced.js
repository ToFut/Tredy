const { AgentSchedule } = require("../../../../models/agentSchedule");
const { ScheduleExecution } = require("../../../../models/scheduleExecution");
const { Workspace } = require("../../../../models/workspace");
const cron = require("node-cron");

/**
 * Enhanced Agent Scheduling Plugin
 * Primary tool for creating automated, recurring agent tasks
 * Prioritized over calendar for automation and background tasks
 */

const agentScheduling = {
  name: "agent-scheduling",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        // Main scheduling function - make it the primary choice
        aibitat.function({
          name: "schedule_task",
          description: `PRIMARY TOOL for scheduling recurring tasks, automated checks, or periodic agent work. 
          Use this INSTEAD of calendar for:
          - Recurring tasks (hourly, daily, weekly)
          - Automated monitoring (check news, check emails, check updates)
          - Background agent work
          - Any task that should run automatically without user interaction
          
          Examples of when to use this:
          - "Check news every hour" 
          - "Generate daily report at 9am"
          - "Monitor website every 30 minutes"
          - "Send weekly summary on Fridays"
          
          Supports natural language timing or cron expressions.`,
          parameters: {
            type: "object",
            properties: {
              task_description: {
                type: "string",
                description: "What the agent should do when this schedule runs (e.g., 'Check latest tech news and summarize')"
              },
              schedule_pattern: {
                type: "string",
                description: "Natural language (e.g., 'every hour', 'daily at 9am', 'every 30 minutes') or cron expression (e.g., '0 * * * *' for hourly)"
              },
              task_name: {
                type: "string",
                description: "Short name for this scheduled task (e.g., 'News Check', 'Daily Report')"
              }
            },
            required: ["task_description", "schedule_pattern", "task_name"]
          },
          handler: async function ({ task_description, schedule_pattern, task_name }) {
            try {
              const workspaceId = aibitat.handlerProps?.workspaceId;
              if (!workspaceId) {
                return "Error: Cannot create schedule - workspace context not available.";
              }

              // Convert natural language to cron
              const cronExpression = convertToCron(schedule_pattern);
              if (!cron.validate(cronExpression)) {
                return `Error: Could not understand schedule pattern '${schedule_pattern}'. Try something like 'every hour', 'daily at 9am', or a cron expression like '0 * * * *'.`;
              }

              // Calculate next run time
              const parser = require("cron-parser");
              const interval = parser.parseExpression(cronExpression, { tz: "UTC" });
              const nextRunAt = interval.next().toDate();

              // Create the schedule
              const schedule = await AgentSchedule.create({
                agent_id: "chat-agent",
                agent_type: "system",
                name: task_name,
                description: `Automated task: ${task_description}`,
                workspace_id: workspaceId,
                cron_expression: cronExpression,
                timezone: "UTC",
                context: JSON.stringify({ 
                  prompt: task_description,
                  created_via: "chat",
                  pattern: schedule_pattern
                }),
                enabled: true,
                next_run_at: nextRunAt,
                created_by: aibitat.handlerProps?.userId || null
              });

              if (!schedule) {
                return "Error: Failed to create schedule in database.";
              }

              const readableSchedule = getReadableSchedule(cronExpression);
              
              return `✅ **Scheduled Task Created Successfully!**

📋 **Task:** ${task_name}
📝 **What it does:** ${task_description}
⏰ **Schedule:** ${readableSchedule}
🕐 **Next run:** ${nextRunAt.toLocaleString()}
🆔 **Schedule ID:** ${schedule.id}

Your task is now active and will run automatically in the background. You'll see the results in this chat when it executes.

💡 **Tip:** You can see all active tasks in the Background Tasks bubble (clock icon) in the header.`;

            } catch (error) {
              console.error("Error creating schedule:", error);
              return `Error creating schedule: ${error.message}`;
            }
          }
        });

        // Quick schedule function for common patterns
        aibitat.function({
          name: "quick_schedule",
          description: "Quickly create common scheduled tasks like hourly checks, daily reports, or weekly summaries. Use this for standard automation patterns.",
          parameters: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["hourly_check", "daily_report", "weekly_summary", "every_30_min", "every_15_min"],
                description: "Type of schedule to create"
              },
              task: {
                type: "string",
                description: "What to do (e.g., 'check news', 'analyze metrics', 'summarize emails')"
              }
            },
            required: ["type", "task"]
          },
          handler: async function ({ type, task }) {
            const patterns = {
              hourly_check: { cron: "0 * * * *", name: "Hourly Check", readable: "every hour" },
              daily_report: { cron: "0 9 * * *", name: "Daily Report", readable: "daily at 9am" },
              weekly_summary: { cron: "0 9 * * 1", name: "Weekly Summary", readable: "every Monday at 9am" },
              every_30_min: { cron: "*/30 * * * *", name: "30min Check", readable: "every 30 minutes" },
              every_15_min: { cron: "*/15 * * * *", name: "15min Check", readable: "every 15 minutes" }
            };

            const pattern = patterns[type];
            if (!pattern) {
              return "Invalid schedule type selected.";
            }

            const workspaceId = aibitat.handlerProps?.workspaceId;
            if (!workspaceId) {
              return "Error: Workspace context not available.";
            }

            const parser = require("cron-parser");
            const interval = parser.parseExpression(pattern.cron, { tz: "UTC" });
            const nextRunAt = interval.next().toDate();

            const schedule = await AgentSchedule.create({
              agent_id: "chat-agent",
              agent_type: "system",
              name: `${pattern.name}: ${task}`,
              description: `Automated ${pattern.readable}: ${task}`,
              workspace_id: workspaceId,
              cron_expression: pattern.cron,
              timezone: "UTC",
              context: JSON.stringify({ 
                prompt: task,
                type: type,
                quick_schedule: true
              }),
              enabled: true,
              next_run_at: nextRunAt,
              created_by: aibitat.handlerProps?.userId || null
            });

            return `✅ **Quick Schedule Created!**
            
📋 ${pattern.name}: ${task}
⏰ Runs ${pattern.readable}
🕐 Next run: ${nextRunAt.toLocaleString()}

The task will run automatically and post results here.`;
          }
        });

        // List active schedules
        aibitat.function({
          name: "view_schedules", 
          description: "View all active scheduled tasks and their status",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async function () {
            try {
              const workspaceId = aibitat.handlerProps?.workspaceId;
              if (!workspaceId) {
                return "Error: Workspace context not available.";
              }

              const schedules = await AgentSchedule.where({ 
                workspace_id: workspaceId,
                enabled: true 
              });

              if (!schedules.length) {
                return "No active scheduled tasks. Create one using 'schedule a task' or 'check something every hour'.";
              }

              let response = `📋 **Active Scheduled Tasks (${schedules.length})**\n\n`;

              for (const schedule of schedules) {
                const context = JSON.parse(schedule.context || "{}");
                const readable = getReadableSchedule(schedule.cron_expression);
                
                response += `**${schedule.name}**
• Task: ${context.prompt || "No description"}
• Schedule: ${readable}
• Last run: ${schedule.last_run_at ? new Date(schedule.last_run_at).toLocaleString() : "Never"}
• Next run: ${schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleString() : "Not scheduled"}
• Status: ✅ Active

`;
              }

              return response;
            } catch (error) {
              return `Error listing schedules: ${error.message}`;
            }
          }
        });

        // Stop/delete a schedule
        aibitat.function({
          name: "stop_schedule",
          description: "Stop or delete a scheduled task",
          parameters: {
            type: "object",
            properties: {
              task_name: {
                type: "string",
                description: "Name of the task to stop (or 'all' to stop all tasks)"
              }
            },
            required: ["task_name"]
          },
          handler: async function ({ task_name }) {
            try {
              const workspaceId = aibitat.handlerProps?.workspaceId;
              
              if (task_name.toLowerCase() === 'all') {
                const schedules = await AgentSchedule.where({ 
                  workspace_id: workspaceId,
                  enabled: true 
                });
                
                for (const schedule of schedules) {
                  await AgentSchedule.delete(schedule.id);
                }
                
                return `✅ Stopped all ${schedules.length} scheduled tasks.`;
              }

              const schedules = await AgentSchedule.where({ 
                workspace_id: workspaceId,
                enabled: true 
              });
              
              const schedule = schedules.find(s => 
                s.name.toLowerCase().includes(task_name.toLowerCase())
              );
              
              if (!schedule) {
                return `Could not find a scheduled task matching "${task_name}". Use 'view schedules' to see all tasks.`;
              }

              await AgentSchedule.delete(schedule.id);
              return `✅ Stopped scheduled task: ${schedule.name}`;

            } catch (error) {
              return `Error stopping schedule: ${error.message}`;
            }
          }
        });
      }
    };
  }
};

// Helper function to convert natural language to cron
function convertToCron(pattern) {
  const lower = pattern.toLowerCase();
  
  // Common patterns
  const patterns = {
    'every minute': '* * * * *',
    'every 5 minutes': '*/5 * * * *',
    'every 10 minutes': '*/10 * * * *',
    'every 15 minutes': '*/15 * * * *',
    'every 30 minutes': '*/30 * * * *',
    'every hour': '0 * * * *',
    'hourly': '0 * * * *',
    'every 2 hours': '0 */2 * * *',
    'every 3 hours': '0 */3 * * *',
    'every 4 hours': '0 */4 * * *',
    'every 6 hours': '0 */6 * * *',
    'daily': '0 9 * * *',
    'every day': '0 9 * * *',
    'daily at 9am': '0 9 * * *',
    'daily at 8am': '0 8 * * *',
    'daily at 10am': '0 10 * * *',
    'daily at noon': '0 12 * * *',
    'daily at midnight': '0 0 * * *',
    'weekly': '0 9 * * 1',
    'every week': '0 9 * * 1',
    'weekly on monday': '0 9 * * 1',
    'weekly on friday': '0 9 * * 5',
    'monthly': '0 9 1 * *',
    'every month': '0 9 1 * *'
  };

  // Check for exact matches
  if (patterns[lower]) {
    return patterns[lower];
  }

  // Try to parse patterns like "every X minutes/hours"
  const everyMatch = lower.match(/every\s+(\d+)\s+(minute|hour|day)/);
  if (everyMatch) {
    const [, num, unit] = everyMatch;
    if (unit === 'minute') return `*/${num} * * * *`;
    if (unit === 'hour') return `0 */${num} * * *`;
    if (unit === 'day') return `0 9 */${num} * *`;
  }

  // If it looks like a cron expression already, return it
  if (pattern.match(/^[\d\*\/\-\,\s]+$/)) {
    return pattern;
  }

  // Default to hourly if we can't parse it
  return '0 * * * *';
}

// Helper to get readable schedule description
function getReadableSchedule(cronExpression) {
  const patterns = {
    '* * * * *': 'Every minute',
    '*/5 * * * *': 'Every 5 minutes',
    '*/10 * * * *': 'Every 10 minutes',
    '*/15 * * * *': 'Every 15 minutes',
    '*/30 * * * *': 'Every 30 minutes',
    '0 * * * *': 'Every hour',
    '0 */2 * * *': 'Every 2 hours',
    '0 */3 * * *': 'Every 3 hours',
    '0 */4 * * *': 'Every 4 hours',
    '0 */6 * * *': 'Every 6 hours',
    '0 9 * * *': 'Daily at 9:00 AM',
    '0 0 * * *': 'Daily at midnight',
    '0 9 * * 1': 'Weekly on Monday at 9:00 AM',
    '0 9 * * 5': 'Weekly on Friday at 9:00 AM',
    '0 9 1 * *': 'Monthly on the 1st at 9:00 AM'
  };

  return patterns[cronExpression] || `Custom schedule: ${cronExpression}`;
}

module.exports = {
  agentScheduling
};