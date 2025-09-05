/**
 * Schedule Flow Plugin
 * Allows agents to schedule existing flows for recurring execution
 */

const { AgentFlows } = require("../../../agentFlows");
const { AgentSchedule } = require("../../../../models/agentSchedule");

const scheduleFlow = {
  name: "schedule_flow",
  description: "Schedule existing agent flows for recurring execution",
  plugin: function () {
    return {
      name: this.name,
      description: this.description,
      setup(aibitat) {
        // Load available flows
        const availableFlows = AgentFlows.listFlows();
        
        aibitat.function({
          name: "schedule_flow",
          description: `Schedule an existing agent flow to run automatically at specified intervals.
          
          Available flows:
          ${availableFlows.map(f => `- ${f.name} (${f.uuid}): ${f.description}`).join('\n')}
          
          Common patterns:
          - "Run customer report flow every morning"
          - "Execute data sync flow hourly"
          - "Process emails flow every 30 minutes"`,
          parameters: {
            type: "object",
            properties: {
              flow_identifier: {
                type: "string",
                description: "Name or UUID of the flow to schedule"
              },
              schedule_pattern: {
                type: "string",
                description: "When to run: 'hourly', 'daily', 'weekly', 'every 30 minutes', 'every morning at 9am', etc."
              },
              flow_variables: {
                type: "object",
                description: "Optional: Variables to pass to the flow when it runs",
                additionalProperties: true
              },
              schedule_name: {
                type: "string",
                description: "Optional: Custom name for this schedule"
              }
            },
            required: ["flow_identifier", "schedule_pattern"]
          },
          handler: async function({ flow_identifier, schedule_pattern, flow_variables = {}, schedule_name }) {
            try {
              // Find the flow
              const flows = AgentFlows.listFlows();
              const flow = flows.find(f => 
                f.uuid === flow_identifier || 
                f.name.toLowerCase() === flow_identifier.toLowerCase()
              );
              
              if (!flow) {
                return `Flow "${flow_identifier}" not found. Available flows: ${flows.map(f => f.name).join(', ')}`;
              }

              // Convert pattern to cron
              const cronExpression = patternToCron(schedule_pattern);
              if (!cronExpression) {
                return `Invalid schedule pattern: "${schedule_pattern}". Try: "hourly", "daily at 9am", "every 30 minutes", etc.`;
              }

              // Create the schedule
              const scheduleName = schedule_name || `Scheduled: ${flow.name}`;
              
              const schedule = await AgentSchedule.create({
                agent_id: aibitat.agent?.id || "system",
                agent_type: "flow",
                name: scheduleName,
                cron_expression: cronExpression,
                enabled: true,
                context: JSON.stringify({
                  flow_uuid: flow.uuid,
                  flow_name: flow.name,
                  flow_variables: flow_variables,
                  workspace_id: aibitat.handlerProps?.workspaceId
                })
              });

              aibitat.introspect(`Created schedule for flow "${flow.name}"`);
              
              return `✅ Successfully scheduled flow "${flow.name}"
              
Schedule Details:
- Name: ${scheduleName}
- Pattern: ${schedule_pattern} (${cronExpression})
- Flow: ${flow.name}
- Variables: ${Object.keys(flow_variables).length > 0 ? JSON.stringify(flow_variables) : 'None'}
- Status: Active

The flow will run automatically according to the schedule. Results will be posted to this chat when the flow completes.`;
              
            } catch (error) {
              aibitat.introspect(`Error scheduling flow: ${error.message}`);
              return `Failed to schedule flow: ${error.message}`;
            }
          }
        });

        // List scheduled flows
        aibitat.function({
          name: "list_scheduled_flows",
          description: "View all scheduled flows and their status",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async function() {
            try {
              const schedules = await AgentSchedule.findAll({
                where: { 
                  agent_type: "flow",
                  enabled: true 
                }
              });

              if (!schedules || schedules.length === 0) {
                return "No scheduled flows found.";
              }

              const scheduleList = schedules.map(s => {
                const context = JSON.parse(s.context || "{}");
                return `📅 ${s.name}
   - Flow: ${context.flow_name}
   - Schedule: ${s.cron_expression}
   - Status: ${s.enabled ? 'Active' : 'Inactive'}
   - Last run: ${s.last_run || 'Never'}`;
              }).join('\n\n');

              return `Active Scheduled Flows:\n\n${scheduleList}`;
              
            } catch (error) {
              return `Error listing schedules: ${error.message}`;
            }
          }
        });

        // Cancel scheduled flow
        aibitat.function({
          name: "cancel_scheduled_flow",
          description: "Cancel/stop a scheduled flow",
          parameters: {
            type: "object",
            properties: {
              schedule_name: {
                type: "string",
                description: "Name of the schedule to cancel"
              }
            },
            required: ["schedule_name"]
          },
          handler: async function({ schedule_name }) {
            try {
              const schedule = await AgentSchedule.findOne({
                where: { 
                  name: schedule_name,
                  agent_type: "flow"
                }
              });

              if (!schedule) {
                return `Schedule "${schedule_name}" not found.`;
              }

              await schedule.update({ enabled: false });
              return `✅ Cancelled schedule: "${schedule_name}"`;
              
            } catch (error) {
              return `Error cancelling schedule: ${error.message}`;
            }
          }
        });
      }
    };
  }
};

/**
 * Convert natural language pattern to cron expression
 */
function patternToCron(pattern) {
  const lower = pattern.toLowerCase();
  
  const patterns = {
    'every minute': '* * * * *',
    'every 5 minutes': '*/5 * * * *',
    'every 10 minutes': '*/10 * * * *',
    'every 15 minutes': '*/15 * * * *',
    'every 30 minutes': '*/30 * * * *',
    'hourly': '0 * * * *',
    'every hour': '0 * * * *',
    'daily': '0 9 * * *',
    'every day': '0 9 * * *',
    'every morning': '0 9 * * *',
    'every evening': '0 18 * * *',
    'every night': '0 22 * * *',
    'weekly': '0 9 * * 1',
    'every week': '0 9 * * 1',
    'every monday': '0 9 * * 1',
    'every tuesday': '0 9 * * 2',
    'every wednesday': '0 9 * * 3',
    'every thursday': '0 9 * * 4',
    'every friday': '0 9 * * 5',
    'every saturday': '0 9 * * 6',
    'every sunday': '0 9 * * 0',
    'monthly': '0 9 1 * *',
    'every month': '0 9 1 * *'
  };

  // Check exact matches
  if (patterns[lower]) {
    return patterns[lower];
  }

  // Check for time-specific patterns
  const timeMatch = lower.match(/every day at (\d{1,2})(:\d{2})?\s*(am|pm)?/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    if (timeMatch[3] === 'pm' && hour !== 12) hour += 12;
    if (timeMatch[3] === 'am' && hour === 12) hour = 0;
    const minute = timeMatch[2] ? parseInt(timeMatch[2].slice(1)) : 0;
    return `${minute} ${hour} * * *`;
  }

  // Check for "every N minutes/hours"
  const intervalMatch = lower.match(/every (\d+)\s*(minute|hour)s?/);
  if (intervalMatch) {
    const num = parseInt(intervalMatch[1]);
    const unit = intervalMatch[2];
    if (unit === 'minute') return `*/${num} * * * *`;
    if (unit === 'hour') return `0 */${num} * * *`;
  }

  return null;
}

module.exports = scheduleFlow;