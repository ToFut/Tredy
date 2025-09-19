const prisma = require("../utils/prisma");

const AgentSchedule = {
  /**
   * Create a new agent schedule
   */
  create: async function ({
    agentId,
    agentType,
    name,
    description = null,
    workspaceId,
    cronExpression,
    timezone = "UTC",
    context = "{}",
    enabled = true,
    nextRunAt = null,
    createdBy = null,
  }) {
    try {
      const schedule = await prisma.agent_schedules.create({
        data: {
          agent_id: agentId,
          agent_type: agentType,
          name,
          description,
          workspace_id: workspaceId,
          cron_expression: cronExpression,
          timezone,
          context,
          enabled,
          next_run_at: nextRunAt,
          created_by: createdBy,
        },
      });
      return { schedule, error: null };
    } catch (error) {
      console.error("Failed to create agent schedule:", error);
      return { schedule: null, error: error.message };
    }
  },

  /**
   * Get a single schedule by criteria
   */
  get: async function (where = {}) {
    try {
      // Map camelCase to snake_case for database fields
      const dbWhere = {};
      if (where.id) dbWhere.id = where.id;
      if (where.agentId) dbWhere.agent_id = where.agentId;
      if (where.workspaceId) dbWhere.workspace_id = where.workspaceId;

      const schedule = await prisma.agent_schedules.findFirst({
        where: dbWhere,
        include: {
          workspace: true,
          user: true,
          executions: {
            orderBy: { started_at: "desc" },
            take: 5,
          },
        },
      });
      return schedule;
    } catch (error) {
      console.error("Failed to get agent schedule:", error);
      return null;
    }
  },

  /**
   * Get multiple schedules by criteria
   */
  where: async function (where = {}, limit = null, orderBy = null) {
    try {
      // Map camelCase to snake_case for database fields
      const dbWhere = {};
      if (where.agentId) dbWhere.agent_id = where.agentId;
      if (where.agentType) dbWhere.agent_type = where.agentType;
      if (where.workspaceId) dbWhere.workspace_id = where.workspaceId;
      if (where.enabled !== undefined) dbWhere.enabled = where.enabled;
      if (where.createdBy) dbWhere.created_by = where.createdBy;

      const query = {
        where: dbWhere,
        include: {
          workspace: true,
          user: true,
        },
      };

      if (limit) query.take = limit;
      if (orderBy) query.orderBy = orderBy;

      const schedules = await prisma.agent_schedules.findMany(query);
      return schedules;
    } catch (error) {
      console.error("Failed to get agent schedules:", error);
      return [];
    }
  },

  /**
   * Get all active schedules that are due to run
   */
  getDueSchedules: async function () {
    try {
      const now = new Date();
      const schedules = await prisma.agent_schedules.findMany({
        where: {
          enabled: true,
          OR: [
            { next_run_at: { lte: now } },
            { next_run_at: null }, // Never run before
          ],
        },
        include: {
          workspace: true,
        },
      });
      return schedules;
    } catch (error) {
      console.error("Failed to get due schedules:", error);
      return [];
    }
  },

  /**
   * Get all active schedules (for registering with cron)
   */
  getActive: async function () {
    try {
      const schedules = await prisma.agent_schedules.findMany({
        where: {
          enabled: true,
        },
        include: {
          workspace: true,
        },
      });
      return schedules;
    } catch (error) {
      console.error("Failed to get active schedules:", error);
      return [];
    }
  },

  /**
   * Update a schedule
   */
  update: async function (scheduleId, updates = {}) {
    try {
      // Map camelCase to snake_case for database fields
      const data = {};
      if (updates.name !== undefined) data.name = updates.name;
      if (updates.description !== undefined)
        data.description = updates.description;
      if (updates.cronExpression !== undefined)
        data.cron_expression = updates.cronExpression;
      if (updates.timezone !== undefined) data.timezone = updates.timezone;
      if (updates.context !== undefined) data.context = updates.context;
      if (updates.enabled !== undefined) data.enabled = updates.enabled;
      if (updates.nextRunAt !== undefined) data.next_run_at = updates.nextRunAt;

      data.updated_at = new Date();

      const schedule = await prisma.agent_schedules.update({
        where: { id: scheduleId },
        data,
      });
      return { schedule, error: null };
    } catch (error) {
      console.error("Failed to update agent schedule:", error);
      return { schedule: null, error: error.message };
    }
  },

  /**
   * Update last run time and calculate next run time
   */
  updateLastRun: async function (scheduleId) {
    try {
      const schedule = await prisma.agent_schedules.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule) return false;

      // Calculate next run time based on cron expression
      const parser = require("cron-parser");
      const interval = parser.parseExpression(schedule.cron_expression, {
        tz: schedule.timezone,
      });
      const nextRunAt = interval.next().toDate();

      await prisma.agent_schedules.update({
        where: { id: scheduleId },
        data: {
          last_run_at: new Date(),
          next_run_at: nextRunAt,
          updated_at: new Date(),
        },
      });
      return true;
    } catch (error) {
      console.error("Failed to update last run time:", error);
      return false;
    }
  },

  /**
   * Delete a schedule
   */
  delete: async function (scheduleId) {
    try {
      // This will cascade delete all executions due to foreign key constraint
      await prisma.agent_schedules.delete({
        where: { id: scheduleId },
      });
      return true;
    } catch (error) {
      console.error("Failed to delete agent schedule:", error);
      return false;
    }
  },

  /**
   * Get schedule statistics for a workspace
   */
  getWorkspaceStats: async function (workspaceId) {
    try {
      const [total, active, executions] = await Promise.all([
        prisma.agent_schedules.count({
          where: { workspace_id: workspaceId },
        }),
        prisma.agent_schedules.count({
          where: { workspace_id: workspaceId, enabled: true },
        }),
        prisma.schedule_executions.count({
          where: {
            schedule: {
              workspace_id: workspaceId,
            },
          },
        }),
      ]);

      // Get recent executions
      const recentExecutions = await prisma.schedule_executions.findMany({
        where: {
          schedule: {
            workspace_id: workspaceId,
          },
        },
        orderBy: { started_at: "desc" },
        take: 10,
        include: {
          schedule: true,
        },
      });

      return {
        totalSchedules: total,
        activeSchedules: active,
        totalExecutions: executions,
        recentExecutions,
      };
    } catch (error) {
      console.error("Failed to get workspace schedule stats:", error);
      return {
        totalSchedules: 0,
        activeSchedules: 0,
        totalExecutions: 0,
        recentExecutions: [],
      };
    }
  },

  /**
   * Validate cron expression
   */
  validateCronExpression: function (expression) {
    try {
      const cron = require("node-cron");
      return cron.validate(expression);
    } catch {
      return false;
    }
  },
};

module.exports = { AgentSchedule };
