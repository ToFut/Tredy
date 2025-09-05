const { AgentSchedule } = require("../../../../models/agentSchedule");
const { ScheduleExecution } = require("../../../../models/scheduleExecution");
const { Workspace } = require("../../../../models/workspace");
const cron = require("node-cron");

/**
 * Agent Scheduling Plugin
 * Allows agents to create, manage, and monitor automated schedules through chat
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
    aibitat.function({
      name: "create_schedule",
      description: "Create a new automated schedule for agent tasks. Use cron expressions for timing (e.g., '0 9 * * *' for 9am daily, '*/30 * * * *' for every 30 minutes).",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name for the schedule (e.g., 'Daily Report', 'Hourly Sync')"
          },
          description: {
            type: "string", 
            description: "Description of what this schedule does"
          },
          cron_expression: {
            type: "string",
            description: "Cron expression for scheduling (e.g., '0 9 * * *' for 9am daily)"
          },
          task_prompt: {
            type: "string",
            description: "The task/prompt to execute when scheduled"
          },
          timezone: {
            type: "string",
            description: "Timezone for schedule execution (default: UTC)"
          }
        },
        required: ["name", "cron_expression", "task_prompt"]
      },
      handler: async function ({ name, description = "", cron_expression, task_prompt, timezone = "UTC" }) {
        try {
          // Validate cron expression
          if (!cron.validate(cron_expression)) {
            return `Error: Invalid cron expression '${cron_expression}'. Please use valid cron syntax like '0 9 * * *' (9am daily) or '*/30 * * * *' (every 30 minutes).`;
          }

          // Get current workspace from handler props
          const workspaceId = aibitat.handlerProps?.workspaceId;
          if (!workspaceId) {
            return "Error: Cannot create schedule - workspace context not available.";
          }

          // Calculate next run time
          const parser = require("cron-parser");
          const interval = parser.parseExpression(cron_expression, { tz: timezone });
          const nextRunAt = interval.next().toDate();

          // Create the schedule
          const schedule = await AgentSchedule.create({
            agent_id: "chat-agent", // Default agent ID for chat-created schedules
            agent_type: "system",
            name,
            description,
            workspace_id: workspaceId,
            cron_expression: cron_expression,
            timezone,
            context: JSON.stringify({ prompt: task_prompt }),
            enabled: true,
            next_run_at: nextRunAt,
            created_by: aibitat.handlerProps?.userId || null
          });

          if (!schedule) {
            return "Error: Failed to create schedule in database.";
          }

          return `✅ Schedule created successfully!

**Schedule Details:**
- Name: ${name}
- Description: ${description}
- Timing: ${cron_expression} (${timezone})
- Next run: ${nextRunAt.toLocaleString()}
- Task: ${task_prompt}
- Schedule ID: ${schedule.id}

The schedule is now active and will run automatically in the background.`;

        } catch (error) {
          console.error("Error creating schedule:", error);
          return `Error creating schedule: ${error.message}`;
        }
      }
    });

    aibitat.function({
      name: "list_schedules", 
      description: "View all schedules in the current workspace",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["all", "enabled", "disabled"],
            description: "Filter schedules by status (default: all)"
          }
        }
      },
      handler: async function ({ status = "all" }) {
        try {
          const workspaceId = aibitat.handlerProps?.workspaceId;
          if (!workspaceId) {
            return "Error: Workspace context not available.";
          }

          const where = { workspace_id: workspaceId };
          if (status !== "all") {
            where.enabled = status === "enabled";
          }

          const schedules = await AgentSchedule.where(where);

          if (!schedules.length) {
            return status === "all" ? 
              "No schedules found in this workspace." : 
              `No ${status} schedules found in this workspace.`;
          }

          let response = `📋 **${schedules.length} Schedule(s) Found:**\n\n`;

          for (const schedule of schedules) {
            const context = JSON.parse(schedule.context || "{}");
            const statusIcon = schedule.enabled ? "✅" : "❌";
            
            response += `${statusIcon} **${schedule.name}** (ID: ${schedule.id})
- Description: ${schedule.description || "No description"}
- Timing: ${schedule.cron_expression} (${schedule.timezone})
- Task: ${context.prompt || "No task defined"}
- Status: ${schedule.enabled ? "Enabled" : "Disabled"}
- Last run: ${schedule.last_run_at ? new Date(schedule.last_run_at).toLocaleString() : "Never"}
- Next run: ${schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleString() : "Not scheduled"}

`;
          }

          return response;
        } catch (error) {
          console.error("Error listing schedules:", error);
          return `Error listing schedules: ${error.message}`;
        }
      }
    });

    aibitat.function({
      name: "modify_schedule",
      description: "Update an existing schedule (enable/disable or change settings)",
      parameters: {
        type: "object", 
        properties: {
          schedule_id: {
            type: "number",
            description: "ID of the schedule to modify"
          },
          enabled: {
            type: "boolean",
            description: "Enable or disable the schedule"
          },
          name: {
            type: "string",
            description: "New name for the schedule"
          },
          cron_expression: {
            type: "string", 
            description: "New cron expression"
          },
          task_prompt: {
            type: "string",
            description: "New task/prompt to execute"
          }
        },
        required: ["schedule_id"]
      },
      handler: async function ({ schedule_id, enabled, name, cron_expression, task_prompt }) {
        try {
          const workspaceId = aibitat.handlerProps?.workspaceId;
          
          // Get existing schedule
          const schedule = await AgentSchedule.get({ id: schedule_id });
          if (!schedule) {
            return `Error: Schedule with ID ${schedule_id} not found.`;
          }

          // Verify workspace access
          if (schedule.workspace_id !== workspaceId) {
            return "Error: You don't have access to modify this schedule.";
          }

          const updates = {};
          
          // Build updates object
          if (enabled !== undefined) updates.enabled = enabled;
          if (name) updates.name = name;
          if (cron_expression) {
            if (!cron.validate(cron_expression)) {
              return `Error: Invalid cron expression '${cron_expression}'.`;
            }
            updates.cron_expression = cron_expression;
            
            // Recalculate next run time
            const parser = require("cron-parser");
            const interval = parser.parseExpression(cron_expression, { 
              tz: schedule.timezone 
            });
            updates.next_run_at = interval.next().toDate();
          }
          if (task_prompt) {
            const context = JSON.parse(schedule.context || "{}");
            context.prompt = task_prompt;
            updates.context = JSON.stringify(context);
          }

          // Update schedule
          const updated = await AgentSchedule.update(schedule_id, updates);
          if (!updated) {
            return "Error: Failed to update schedule.";
          }

          return `✅ Schedule updated successfully!

**Updated Schedule:**
- Name: ${updates.name || schedule.name}
- Status: ${updates.enabled !== undefined ? (updates.enabled ? "Enabled" : "Disabled") : (schedule.enabled ? "Enabled" : "Disabled")}
- Timing: ${updates.cron_expression || schedule.cron_expression}
- Next run: ${updates.next_run_at ? updates.next_run_at.toLocaleString() : new Date(schedule.next_run_at).toLocaleString()}`;

        } catch (error) {
          console.error("Error modifying schedule:", error);
          return `Error modifying schedule: ${error.message}`;
        }
      }
    });

    aibitat.function({
      name: "delete_schedule",
      description: "Delete a schedule permanently",
      parameters: {
        type: "object",
        properties: {
          schedule_id: {
            type: "number", 
            description: "ID of the schedule to delete"
          }
        },
        required: ["schedule_id"]
      },
      handler: async function ({ schedule_id }) {
        try {
          const workspaceId = aibitat.handlerProps?.workspaceId;
          
          // Get schedule to verify access
          const schedule = await AgentSchedule.get({ id: schedule_id });
          if (!schedule) {
            return `Error: Schedule with ID ${schedule_id} not found.`;
          }

          if (schedule.workspace_id !== workspaceId) {
            return "Error: You don't have access to delete this schedule.";
          }

          // Delete the schedule
          const deleted = await AgentSchedule.delete(schedule_id);
          if (!deleted) {
            return "Error: Failed to delete schedule.";
          }

          return `✅ Schedule "${schedule.name}" (ID: ${schedule_id}) deleted successfully.`;

        } catch (error) {
          console.error("Error deleting schedule:", error);
          return `Error deleting schedule: ${error.message}`;
        }
      }
    });

    aibitat.function({
      name: "schedule_status",
      description: "Check execution history and status of a specific schedule",
      parameters: {
        type: "object",
        properties: {
          schedule_id: {
            type: "number",
            description: "ID of the schedule to check"
          },
          limit: {
            type: "number",
            description: "Number of recent executions to show (default: 5)"
          }
        },
        required: ["schedule_id"]
      },
      handler: async function ({ schedule_id, limit = 5 }) {
        try {
          const workspaceId = aibitat.handlerProps?.workspaceId;
          
          // Get schedule
          const schedule = await AgentSchedule.get({ id: schedule_id });
          if (!schedule) {
            return `Error: Schedule with ID ${schedule_id} not found.`;
          }

          if (schedule.workspace_id !== workspaceId) {
            return "Error: You don't have access to view this schedule.";
          }

          // Get recent executions
          const executions = await ScheduleExecution.getRecent(schedule_id, limit);
          
          let response = `📊 **Schedule Status: ${schedule.name}**

**Current Status:**
- Enabled: ${schedule.enabled ? "✅ Yes" : "❌ No"}
- Last run: ${schedule.last_run_at ? new Date(schedule.last_run_at).toLocaleString() : "Never"}
- Next run: ${schedule.next_run_at ? new Date(schedule.next_run_at).toLocaleString() : "Not scheduled"}

**Recent Executions (${executions.length}):**\n`;

          if (!executions.length) {
            response += "No executions found.";
          } else {
            for (const exec of executions) {
              const statusIcon = exec.status === "success" ? "✅" : exec.status === "failed" ? "❌" : "⏳";
              const duration = exec.completed_at && exec.started_at ? 
                Math.round((new Date(exec.completed_at) - new Date(exec.started_at)) / 1000) : "N/A";
              
              response += `${statusIcon} ${new Date(exec.started_at).toLocaleString()} - ${exec.status} (${duration}s)`;
              if (exec.error) response += ` - Error: ${exec.error}`;
              response += "\n";
            }
          }

          return response;
        } catch (error) {
          console.error("Error checking schedule status:", error);
          return `Error checking schedule status: ${error.message}`;
        }
      }
    });
      }
    };
  }
};

module.exports = {
  agentScheduling
};