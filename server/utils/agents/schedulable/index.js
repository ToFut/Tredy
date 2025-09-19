const { AgentSchedule } = require("../../../models/agentSchedule");
const {
  WorkspaceAgentInvocation,
} = require("../../../models/workspaceAgentInvocation");
const ImportedPlugin = require("../imported");
const AgentHandler = require("../index");
const { safeJsonParse } = require("../../http");

/**
 * SchedulableAgent - A wrapper class that adds scheduling capabilities to any agent
 * This class can wrap any existing agent (imported plugins, system agents, etc.)
 * and provide scheduling functionality without modifying the original agent code.
 */
class SchedulableAgent {
  constructor(agent, agentType = "imported") {
    this.agent = agent;
    this.agentType = agentType;
    this.schedulingEnabled = false;
    this.schedules = [];
  }

  /**
   * Create a new schedule for this agent
   * @param {Object} params - Schedule parameters
   * @param {string} params.name - Name of the schedule
   * @param {string} params.cronExpression - Cron expression for scheduling
   * @param {number} params.workspaceId - Workspace ID
   * @param {Object} params.context - Context/parameters for agent execution
   * @param {boolean} params.enabled - Whether schedule is enabled
   * @param {number} params.userId - User who created the schedule
   * @returns {Promise<Object>} Created schedule
   */
  async schedule({
    name,
    description = "",
    cronExpression,
    workspaceId,
    context = {},
    enabled = true,
    timezone = "UTC",
    userId = null,
  }) {
    // Validate cron expression
    const cron = require("node-cron");
    if (!cron.validate(cronExpression)) {
      throw new Error("Invalid cron expression");
    }

    // Calculate next run time
    const parser = require("cron-parser");
    const interval = parser.parseExpression(cronExpression, {
      tz: timezone,
    });
    const nextRunAt = interval.next().toDate();

    return await AgentSchedule.create({
      agentId: this.getAgentId(),
      agentType: this.agentType,
      name,
      description,
      workspaceId,
      cronExpression,
      timezone,
      context: JSON.stringify(context),
      enabled,
      nextRunAt,
      createdBy: userId,
    });
  }

  /**
   * Execute the agent in a scheduled context
   * @param {number} scheduleId - ID of the schedule being executed
   * @returns {Promise<Object>} Execution result
   */
  async executeScheduled(scheduleId) {
    const schedule = await AgentSchedule.get({ id: scheduleId });
    if (!schedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    const context = safeJsonParse(schedule.context, {});

    // Create a special invocation for scheduled execution
    const invocation = await WorkspaceAgentInvocation.create({
      workspaceId: schedule.workspace_id,
      prompt: context.prompt || `[Scheduled Execution: ${schedule.name}]`,
      userId: schedule.created_by,
    });

    try {
      // Execute based on agent type
      let result;
      if (this.agentType === "imported") {
        // For imported plugins
        const plugin = ImportedPlugin.loadPluginByHubId(this.agent.hubId);
        result = await plugin.handler({
          ...context,
          isScheduled: true,
          scheduleId,
          executedAt: new Date(),
        });
      } else if (this.agentType === "system") {
        // For system agents - create handler and execute
        const handler = new AgentHandler({ uuid: invocation.uuid });
        await handler.init({
          workspace: { id: schedule.workspace_id },
          prompt: context.prompt || "",
          userId: schedule.created_by,
        });
        result = await handler.chat(context.prompt || "", context);
      } else if (this.agentType === "flow") {
        // For flows - use FlowExecutor
        const { FlowExecutor } = require("../../agentFlows/executor");
        const { Workspace } = require("../../../models/workspace");

        const workspace = await Workspace.get({ id: schedule.workspace_id });
        if (!workspace) {
          throw new Error(`Workspace not found: ${schedule.workspace_id}`);
        }

        const executor = new FlowExecutor(this.agent.flowData, {
          workspaceSlug: workspace.slug,
          userId: schedule.created_by,
        });

        result = await executor.execute({
          ...context,
          isScheduled: true,
          scheduleId,
          executedAt: new Date(),
        });
      } else {
        throw new Error(`Unknown agent type: ${this.agentType}`);
      }

      // Update last run time
      await AgentSchedule.updateLastRun(scheduleId);

      return {
        success: true,
        output: result,
        invocationId: invocation.uuid,
      };
    } catch (error) {
      console.error(`Failed to execute scheduled agent ${scheduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get all schedules for this agent
   * @param {number} workspaceId - Optional workspace filter
   * @returns {Promise<Array>} List of schedules
   */
  async getSchedules(workspaceId = null) {
    const where = {
      agentId: this.getAgentId(),
      agentType: this.agentType,
    };

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    return await AgentSchedule.where(where);
  }

  /**
   * Update a schedule
   * @param {number} scheduleId - Schedule ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated schedule
   */
  async updateSchedule(scheduleId, updates) {
    // If cron expression is being updated, recalculate next run time
    if (updates.cronExpression) {
      const parser = require("cron-parser");
      const interval = parser.parseExpression(updates.cronExpression, {
        tz: updates.timezone || "UTC",
      });
      updates.nextRunAt = interval.next().toDate();
    }

    return await AgentSchedule.update(scheduleId, updates);
  }

  /**
   * Delete a schedule
   * @param {number} scheduleId - Schedule ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteSchedule(scheduleId) {
    return await AgentSchedule.delete(scheduleId);
  }

  /**
   * Check if agent supports scheduling
   * @returns {boolean} Whether agent supports scheduling
   */
  supportsScheduling() {
    // Check if agent manifest explicitly defines scheduling support
    if (this.agent?.manifest?.capabilities?.scheduling) {
      return this.agent.manifest.capabilities.scheduling.supported !== false;
    }
    // Default to true - all agents can be scheduled
    return true;
  }

  /**
   * Get the agent's scheduling capabilities
   * @returns {Object} Scheduling capabilities
   */
  getSchedulingCapabilities() {
    const defaults = {
      supported: true,
      maxFrequency: "1m", // Minimum 1 minute between executions
      allowedModes: ["cron", "interval"],
      requiresContext: [],
    };

    if (this.agent?.manifest?.capabilities?.scheduling) {
      return {
        ...defaults,
        ...this.agent.manifest.capabilities.scheduling,
      };
    }

    return defaults;
  }

  /**
   * Get the agent ID
   * @returns {string} Agent ID
   */
  getAgentId() {
    if (this.agentType === "imported") {
      return this.agent.hubId || this.agent.id;
    }
    return this.agent.id || this.agent.name;
  }

  /**
   * Get agent metadata for display
   * @returns {Object} Agent metadata
   */
  getAgentMetadata() {
    return {
      id: this.getAgentId(),
      type: this.agentType,
      name: this.agent.name || this.agent.hubId,
      description: this.agent.description || "",
      version: this.agent.version || "1.0.0",
      author: this.agent.author || "System",
    };
  }

  /**
   * Load flow data by ID from storage
   * @param {string} flowId - Flow UUID
   * @returns {Promise<Object>} Flow data
   */
  static async loadFlowById(flowId) {
    const fs = require("fs").promises;
    const path = require("path");

    try {
      // Try multiple possible paths
      const possiblePaths = [
        path.resolve(
          process.cwd(),
          "storage",
          "plugins",
          "agent-flows",
          `${flowId}.json`
        ),
        path.resolve(
          process.cwd(),
          "server",
          "storage",
          "plugins",
          "agent-flows",
          `${flowId}.json`
        ),
        path.resolve(
          __dirname,
          "../../../storage/plugins/agent-flows",
          `${flowId}.json`
        ),
      ];

      for (const filePath of possiblePaths) {
        try {
          const data = await fs.readFile(filePath, "utf8");
          const flowData = JSON.parse(data);

          // Add the UUID to the flow data if not present
          if (!flowData.uuid) {
            flowData.uuid = flowId;
          }

          return flowData;
        } catch (err) {
          // Continue trying other paths
          continue;
        }
      }

      throw new Error(`Flow file not found: ${flowId}`);
    } catch (error) {
      console.error(`Failed to load flow ${flowId}:`, error);
      return null;
    }
  }

  /**
   * Get all available flows for scheduling
   * @returns {Promise<Array>} List of available flows
   */
  static async getAvailableFlows() {
    const fs = require("fs").promises;
    const path = require("path");

    try {
      // Try multiple possible paths
      const possibleDirs = [
        path.resolve(process.cwd(), "storage", "plugins", "agent-flows"),
        path.resolve(
          process.cwd(),
          "server",
          "storage",
          "plugins",
          "agent-flows"
        ),
        path.resolve(__dirname, "../../../storage/plugins/agent-flows"),
      ];

      for (const dir of possibleDirs) {
        try {
          const files = await fs.readdir(dir);
          const flows = [];

          for (const file of files) {
            if (file.endsWith(".json")) {
              const flowId = file.replace(".json", "");
              const flowData = await SchedulableAgent.loadFlowById(flowId);
              if (flowData) {
                flows.push({
                  id: flowId,
                  name: flowData.name || flowId,
                  description: flowData.description || "",
                  active: flowData.active !== false,
                });
              }
            }
          }

          return flows;
        } catch (err) {
          // Continue trying other paths
          continue;
        }
      }

      return [];
    } catch (error) {
      console.error("Failed to get available flows:", error);
      return [];
    }
  }

  /**
   * Factory method to create a schedulable agent from various sources
   * @param {string} agentId - Agent identifier
   * @param {string} agentType - Type of agent (imported, system, flow, etc.)
   * @returns {SchedulableAgent} Schedulable agent instance
   */
  static async fromId(agentId, agentType = "imported") {
    let agent;

    if (agentType === "imported") {
      // Load imported plugin
      const valid = ImportedPlugin.validateImportedPluginHandler(agentId);
      if (!valid) {
        throw new Error(`Invalid imported plugin: ${agentId}`);
      }
      agent = ImportedPlugin.loadPluginByHubId(agentId);
    } else if (agentType === "system") {
      // For system agents, we'll create a placeholder
      // The actual handler will be created during execution
      agent = {
        id: agentId,
        name: agentId,
        type: "system",
      };
    } else if (agentType === "flow") {
      // Load flow from storage
      const flowData = await SchedulableAgent.loadFlowById(agentId);
      if (!flowData) {
        throw new Error(`Flow not found: ${agentId}`);
      }
      agent = {
        id: agentId,
        name: flowData.name,
        description: flowData.description,
        type: "flow",
        flowData: flowData,
      };
    } else {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    return new SchedulableAgent(agent, agentType);
  }
}

module.exports = SchedulableAgent;
