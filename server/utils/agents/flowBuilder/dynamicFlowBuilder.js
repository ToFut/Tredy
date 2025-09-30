/**
 * Dynamic Flow Builder
 * Converts natural language requests into executable Agent Flows
 */

const { v4: uuidv4 } = require("uuid");
const { AgentFlows } = require("../../agentFlows");

class DynamicFlowBuilder {
  constructor() {
    this.toolPatterns = {
      // Email related
      "check email": { tool: "gmail_read", type: "data_fetch" },
      "read email": { tool: "gmail_read", type: "data_fetch" },
      "get email": { tool: "gmail_read", type: "data_fetch" },
      "send email": { tool: "gmail_send", type: "action" },

      // Web related
      "search for": { tool: "web_search", type: "data_fetch" },
      "search web": { tool: "web_search", type: "data_fetch" },
      "scrape website": { tool: "web_scraping", type: "data_fetch" },
      "check website": { tool: "web_scraping", type: "data_fetch" },
      "monitor website": { tool: "web_scraping", type: "data_fetch" },

      // Data processing
      summarize: { tool: "summarize", type: "transform" },
      analyze: { tool: "analyze", type: "transform" },
      extract: { tool: "extract", type: "transform" },
      calculate: { tool: "calculate", type: "transform" },
      compare: { tool: "memory_compare", type: "transform" },

      // Database
      "query database": { tool: "sql_query", type: "data_fetch" },
      "get data from": { tool: "sql_query", type: "data_fetch" },
      "fetch from database": { tool: "sql_query", type: "data_fetch" },

      // Communication
      "post to slack": { tool: "slack_post", type: "action" },
      "send to slack": { tool: "slack_post", type: "action" },
      notify: { tool: "notification", type: "action" },

      // Document
      "create document": { tool: "create_doc", type: "action" },
      "generate report": { tool: "generate_report", type: "transform" },
      "create task list": { tool: "create_tasks", type: "transform" },

      // Calendar
      "check calendar": { tool: "calendar_read", type: "data_fetch" },
      "schedule meeting": { tool: "calendar_create", type: "action" },

      // Conditional
      if: { tool: "condition", type: "control" },
      when: { tool: "condition", type: "control" },
      filter: { tool: "filter", type: "transform" },
    };

    this.sequenceWords = [
      "then",
      "after that",
      "next",
      "finally",
      "and",
      "afterwards",
    ];
    this.schedulePatterns = ["every", "daily", "weekly", "hourly", "each"];
  }

  /**
   * Parse user prompt into workflow steps
   */
  parsePromptToSteps(prompt) {
    const steps = [];
    const lower = prompt.toLowerCase();

    // Split by sequence words
    const segments = this.splitBySequence(lower);

    segments.forEach((segment, index) => {
      const step = this.parseSegment(segment, index);
      if (step) steps.push(step);
    });

    // Add data flow connections
    this.connectDataFlow(steps);

    return steps;
  }

  /**
   * Split prompt by sequence indicators
   */
  splitBySequence(prompt) {
    let segments = [prompt];

    // Split by common sequence words
    this.sequenceWords.forEach((word) => {
      const newSegments = [];
      segments.forEach((segment) => {
        const parts = segment.split(new RegExp(`\\b${word}\\b`));
        parts.forEach((part, i) => {
          if (part.trim()) {
            newSegments.push(part.trim());
          }
        });
      });
      segments = newSegments;
    });

    // Also split by commas if they indicate sequence
    const finalSegments = [];
    segments.forEach((segment) => {
      if (segment.includes(",")) {
        segment.split(",").forEach((part) => {
          if (part.trim()) finalSegments.push(part.trim());
        });
      } else {
        finalSegments.push(segment);
      }
    });

    return finalSegments;
  }

  /**
   * Parse a segment into a flow step
   */
  parseSegment(segment, index) {
    // Find matching tool pattern
    for (const [pattern, config] of Object.entries(this.toolPatterns)) {
      if (segment.includes(pattern)) {
        return this.createStep(segment, pattern, config, index);
      }
    }

    // If no pattern matches, try to infer
    return this.inferStep(segment, index);
  }

  /**
   * Create a step configuration
   */
  createStep(segment, pattern, toolConfig, index) {
    const step = {
      id: `step_${index + 1}`,
      name: this.generateStepName(segment, pattern),
      type: toolConfig.type,
      tool: toolConfig.tool,
      config: {},
      inputs: [],
      outputs: [`${toolConfig.type}_${index + 1}_result`],
    };

    // Extract parameters from segment
    step.config = this.extractParameters(segment, pattern, toolConfig.tool);

    // Add provider info for tools that need authentication
    if (toolConfig.tool === "gmail_send" || toolConfig.tool === "gmail_read") {
      step.config.provider = "gmail";
      step.config.requiresAuth = true;
    }

    return step;
  }

  /**
   * Extract parameters from text segment
   */
  extractParameters(segment, pattern, tool) {
    const params = {};

    // Extract quoted strings
    const quotedMatch = segment.match(/"([^"]*)"|'([^']*)'/);
    if (quotedMatch) {
      params.content = quotedMatch[1] || quotedMatch[2];
    }

    // Tool-specific parameter extraction
    switch (tool) {
      case "gmail_read":
        if (segment.includes("important")) params.filter = "is:important";
        if (segment.includes("unread")) params.filter = "is:unread";
        if (segment.includes("today")) params.filter = "after:today";
        break;

      case "web_search":
        // Extract search query after "search for"
        const searchMatch = segment.match(
          /search (?:for |web )(.+?)(?:\s+and|\s*$)/
        );
        if (searchMatch) params.query = searchMatch[1];
        break;

      case "summarize":
        if (segment.includes("brief")) params.length = "brief";
        if (segment.includes("detailed")) params.length = "detailed";
        break;

      case "slack_post":
        // Extract channel
        const channelMatch = segment.match(/to\s+#?(\w+)/);
        if (channelMatch) params.channel = channelMatch[1];
        break;
    }

    return params;
  }

  /**
   * Connect data flow between steps
   */
  connectDataFlow(steps) {
    steps.forEach((step, index) => {
      if (index > 0) {
        const prevStep = steps[index - 1];

        // If current step can consume previous output
        if (this.canConnect(prevStep.type, step.type)) {
          step.inputs.push(...prevStep.outputs);
        }
      }
    });
  }

  /**
   * Check if two step types can be connected
   */
  canConnect(outputType, inputType) {
    const connections = {
      data_fetch: ["transform", "action"],
      transform: ["transform", "action"],
      control: ["data_fetch", "transform", "action"],
    };

    return connections[outputType]?.includes(inputType) || false;
  }

  /**
   * Generate human-readable step name
   */
  generateStepName(segment, pattern) {
    // Capitalize first letter of each word
    return pattern
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Try to infer step from context
   */
  inferStep(segment, index) {
    // Look for action verbs
    const verbs = ["create", "generate", "make", "build", "send", "post"];

    for (const verb of verbs) {
      if (segment.includes(verb)) {
        return {
          id: `step_${index + 1}`,
          name: `Process: ${segment.substring(0, 30)}...`,
          type: "transform",
          tool: "agent_process",
          config: { prompt: segment },
          inputs: index > 0 ? [`step_${index}_result`] : [],
          outputs: [`step_${index + 1}_result`],
        };
      }
    }

    return null;
  }

  /**
   * Build complete flow from user prompt
   */
  async buildFlowFromPrompt(prompt, metadata = {}) {
    // Extract schedule if present
    const scheduleInfo = this.extractSchedule(prompt);
    const workflowPrompt = scheduleInfo.cleanPrompt;

    // Parse steps
    const steps = this.parsePromptToSteps(workflowPrompt);

    if (steps.length === 0) {
      throw new Error("Could not understand workflow from prompt");
    }

    // Create flow configuration
    const flow = {
      uuid: uuidv4(),
      name: metadata.name || this.generateFlowName(prompt),
      description:
        metadata.description || `Automated flow: ${prompt.substring(0, 100)}`,
      version: "1.0.0",
      created_by: metadata.userId || "system",
      created_at: new Date().toISOString(),
      schedule: scheduleInfo.schedule,
      config: {
        steps: steps,
        variables: this.extractVariables(steps),
        error_handling: {
          on_error: "continue",
          retry_count: 2,
          notification: true,
        },
      },
    };

    return flow;
  }

  /**
   * Extract schedule information from prompt
   */
  extractSchedule(prompt) {
    const lower = prompt.toLowerCase();
    let schedule = null;
    let cleanPrompt = prompt;

    const schedulePatterns = {
      "every morning": "0 9 * * *",
      "every day": "0 9 * * *",
      "every hour": "0 * * * *",
      "every 30 minutes": "*/30 * * * *",
      daily: "0 9 * * *",
      hourly: "0 * * * *",
      weekly: "0 9 * * MON",
    };

    for (const [pattern, cron] of Object.entries(schedulePatterns)) {
      if (lower.includes(pattern)) {
        schedule = {
          pattern: pattern,
          cron: cron,
          enabled: true,
        };

        // Remove schedule part from prompt
        cleanPrompt = prompt.replace(new RegExp(pattern, "gi"), "").trim();
        break;
      }
    }

    return { schedule, cleanPrompt };
  }

  /**
   * Extract variables from steps
   */
  extractVariables(steps) {
    const variables = {};

    steps.forEach((step) => {
      step.outputs.forEach((output) => {
        variables[output] = {
          type: "dynamic",
          description: `Output from ${step.name}`,
        };
      });
    });

    return variables;
  }

  /**
   * Generate flow name from prompt
   */
  generateFlowName(prompt) {
    // Take first few words or action
    const words = prompt.split(" ").slice(0, 5);
    return words.join(" ") + "...";
  }

  /**
   * Save flow and optionally schedule it
   */
  async saveAndScheduleFlow(flow) {
    // Save the flow
    const saved = await AgentFlows.saveFlow(flow);

    // If has schedule, create scheduled task
    if (flow.schedule) {
      const { AgentSchedule } = require("../../../models/agentSchedule");

      await AgentSchedule.create({
        agent_id: flow.uuid,
        agent_type: "flow",
        name: `Scheduled: ${flow.name}`,
        cron_expression: flow.schedule.cron,
        enabled: flow.schedule.enabled,
        context: JSON.stringify({
          flow_uuid: flow.uuid,
          flow_name: flow.name,
        }),
      });
    }

    return saved;
  }
}

/**
 * Main function to create flow from natural language
 */
async function createFlowFromPrompt(prompt, options = {}) {
  const builder = new DynamicFlowBuilder();

  try {
    // Build flow configuration
    const flow = await builder.buildFlowFromPrompt(prompt, options);

    // Validate flow
    if (!flow.config.steps || flow.config.steps.length === 0) {
      throw new Error("No valid workflow steps could be extracted");
    }

    // Save and schedule
    const result = await builder.saveAndScheduleFlow(flow);

    return {
      success: true,
      flow: flow,
      message: `Created flow "${flow.name}" with ${flow.config.steps.length} steps${flow.schedule ? " and scheduled it" : ""}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  DynamicFlowBuilder,
  createFlowFromPrompt,
};
