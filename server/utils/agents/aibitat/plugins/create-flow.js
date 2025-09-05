/**
 * Create Flow Plugin
 * Allows agents to create new flows from natural language descriptions
 */

const { DynamicFlowBuilder, createFlowFromPrompt } = require("../../../agents/flowBuilder/dynamicFlowBuilder");
const { AgentFlows } = require("../../../agentFlows");
const { v4: uuidv4 } = require("uuid");

const createFlow = {
  name: "create_flow",
  description: "Create new agent flows from natural language descriptions",
  plugin: function () {
    return {
      name: this.name,
      description: this.description,
      setup(aibitat) {
        // Create flow from prompt
        aibitat.function({
          name: "create_flow",
          description: `Create a new agent flow from a natural language description.
          
          Examples:
          - "Check my email and summarize important messages"
          - "Search for news about AI and create a report"
          - "Monitor website changes and notify me"
          - "Get data from database and send to Slack"
          - "Every morning check calendar and email me today's schedule"
          
          The flow can include:
          - Data fetching (email, web, database)
          - Processing (summarize, analyze, extract)
          - Actions (send email, post to Slack, create document)
          - Conditions and logic
          - Scheduling (if pattern like "every morning" is included)`,
          parameters: {
            type: "object",
            properties: {
              flow_description: {
                type: "string",
                description: "Natural language description of what the flow should do"
              },
              flow_name: {
                type: "string",
                description: "Optional: Custom name for the flow"
              },
              auto_schedule: {
                type: "boolean",
                description: "Optional: Automatically schedule if time pattern detected (default: true)"
              }
            },
            required: ["flow_description"]
          },
          handler: async function({ flow_description, flow_name, auto_schedule = true }) {
            try {
              aibitat.introspect(`Creating flow from: "${flow_description}"`);
              
              // Use the DynamicFlowBuilder to create the flow
              const builder = new DynamicFlowBuilder();
              
              // Build flow configuration from prompt
              const flow = await builder.buildFlowFromPrompt(flow_description, {
                name: flow_name,
                userId: aibitat.agent?.id || 'system',
                description: flow_description.substring(0, 200)
              });

              // Save the flow
              const saveResult = AgentFlows.saveFlow(
                flow.name,
                flow.config,
                flow.uuid
              );

              if (!saveResult.success) {
                return `Failed to create flow: ${saveResult.error}`;
              }

              // Check if scheduling was requested and auto_schedule is enabled
              let scheduleInfo = "";
              if (flow.schedule && auto_schedule) {
                const { AgentSchedule } = require("../../../../models/agentSchedule");
                
                const schedule = await AgentSchedule.create({
                  agent_id: aibitat.agent?.id || "system",
                  agent_type: 'flow',
                  name: `Scheduled: ${flow.name}`,
                  cron_expression: flow.schedule.cron,
                  enabled: flow.schedule.enabled,
                  context: JSON.stringify({
                    flow_uuid: flow.uuid,
                    flow_name: flow.name,
                    workspace_id: aibitat.handlerProps?.workspaceId
                  })
                });

                scheduleInfo = `\n\n📅 **Scheduled Execution:**\n- Pattern: ${flow.schedule.pattern}\n- Cron: ${flow.schedule.cron}\n- Status: Active`;
              }

              // Generate flow summary
              const stepsSummary = flow.config.steps
                .filter(s => s.type !== 'start')
                .map((step, i) => `${i + 1}. ${step.name || step.type}`)
                .join('\n');

              return `✅ Successfully created flow: **${flow.name}**

**Flow ID:** ${flow.uuid}

**Steps Created:**
${stepsSummary}

**What this flow does:**
${flow.description}${scheduleInfo}

You can now:
- Execute it: "Run ${flow.name} flow"
- Schedule it: "Schedule ${flow.name} flow every morning"
- View details: "Show ${flow.name} flow details"`;

            } catch (error) {
              aibitat.introspect(`Error creating flow: ${error.message}`);
              return `Failed to create flow: ${error.message}`;
            }
          }
        });

        // Create flow with explicit steps
        aibitat.function({
          name: "create_custom_flow",
          description: "Create a flow with specific steps and configurations",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the flow"
              },
              description: {
                type: "string",
                description: "Description of what the flow does"
              },
              steps: {
                type: "array",
                description: "Array of step configurations",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                      enum: ["api_call", "llm_instruction", "web_scraping"],
                      description: "Type of step"
                    },
                    config: {
                      type: "object",
                      description: "Configuration for the step"
                    }
                  }
                }
              },
              variables: {
                type: "object",
                description: "Optional: Initial variables for the flow"
              }
            },
            required: ["name", "steps"]
          },
          handler: async function({ name, description, steps, variables = {} }) {
            try {
              const uuid = uuidv4();
              
              // Add start step with variables
              const flowSteps = [
                {
                  type: "start",
                  config: {
                    variables: Object.entries(variables).map(([k, v]) => ({
                      name: k,
                      value: v,
                      description: `Variable: ${k}`
                    }))
                  }
                },
                ...steps
              ];

              // Create flow configuration
              const flowConfig = {
                name,
                description: description || `Custom flow: ${name}`,
                version: "1.0.0",
                created_at: new Date().toISOString(),
                steps: flowSteps
              };

              // Save the flow
              const result = AgentFlows.saveFlow(name, flowConfig, uuid);
              
              if (!result.success) {
                return `Failed to create flow: ${result.error}`;
              }

              return `✅ Created custom flow: **${name}**
              
**Flow ID:** ${uuid}
**Steps:** ${steps.length}
**Variables:** ${Object.keys(variables).join(', ') || 'None'}

The flow is now available for execution or scheduling.`;

            } catch (error) {
              return `Error creating custom flow: ${error.message}`;
            }
          }
        });

        // List available flow templates
        aibitat.function({
          name: "list_flow_templates",
          description: "Show available flow templates and examples",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async function() {
            const templates = [
              {
                name: "Email Digest",
                description: "Check emails and summarize important ones",
                example: "Check my email every morning and summarize important messages"
              },
              {
                name: "News Monitor",
                description: "Search for news on topics and create reports",
                example: "Search for AI news every hour and summarize top stories"
              },
              {
                name: "Website Monitor",
                description: "Check website changes and notify",
                example: "Monitor example.com for changes every 30 minutes"
              },
              {
                name: "Data Pipeline",
                description: "Fetch data from source and send to destination",
                example: "Get sales data from database and send to Slack daily"
              },
              {
                name: "Social Media Automation",
                description: "Post content to social platforms",
                example: "Post weekly updates to LinkedIn and Twitter"
              },
              {
                name: "Calendar Briefing",
                description: "Get calendar events and send reminders",
                example: "Every morning at 8am, email me today's calendar events"
              }
            ];

            const templateList = templates.map(t => 
              `📋 **${t.name}**\n   ${t.description}\n   Example: "${t.example}"`
            ).join('\n\n');

            return `**Available Flow Templates:**\n\n${templateList}\n\n` +
                   `To create a flow, just describe what you want:\n` +
                   `"Create a flow to [your description]"`;
          }
        });
      }
    };
  }
};

module.exports = createFlow;