const prisma = require("../utils/prisma");

const ScheduleExecution = {
  /**
   * Start a new execution
   */
  start: async function (scheduleId) {
    try {
      const execution = await prisma.schedule_executions.create({
        data: {
          schedule_id: scheduleId,
          status: "running",
          started_at: new Date(),
        },
      });
      return execution;
    } catch (error) {
      console.error("Failed to start schedule execution:", error);
      return null;
    }
  },

  /**
   * Complete an execution successfully
   */
  complete: async function (executionId, output = null, tokensUsed = 0) {
    try {
      const execution = await prisma.schedule_executions.update({
        where: { id: executionId },
        data: {
          status: "success",
          completed_at: new Date(),
          output: typeof output === "object" ? JSON.stringify(output) : output,
          tokens_used: tokensUsed,
        },
      });
      return execution;
    } catch (error) {
      console.error("Failed to complete schedule execution:", error);
      return null;
    }
  },

  /**
   * Mark an execution as failed
   */
  fail: async function (executionId, error) {
    try {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const execution = await prisma.schedule_executions.update({
        where: { id: executionId },
        data: {
          status: "failed",
          completed_at: new Date(),
          error: errorMessage,
        },
      });
      return execution;
    } catch (err) {
      console.error("Failed to mark schedule execution as failed:", err);
      return null;
    }
  },

  /**
   * Get execution history for a schedule
   */
  getHistory: async function (scheduleId, limit = 20) {
    try {
      const executions = await prisma.schedule_executions.findMany({
        where: { schedule_id: scheduleId },
        orderBy: { started_at: "desc" },
        take: limit,
      });
      return executions;
    } catch (error) {
      console.error("Failed to get execution history:", error);
      return [];
    }
  },

  /**
   * Get execution statistics for a schedule
   */
  getStats: async function (scheduleId) {
    try {
      const [total, successful, failed, avgDuration] = await Promise.all([
        prisma.schedule_executions.count({
          where: { schedule_id: scheduleId },
        }),
        prisma.schedule_executions.count({
          where: { schedule_id: scheduleId, status: "success" },
        }),
        prisma.schedule_executions.count({
          where: { schedule_id: scheduleId, status: "failed" },
        }),
        prisma.$queryRaw`
          SELECT AVG(CAST((julianday(completed_at) - julianday(started_at)) * 86400 AS REAL)) as avg_duration
          FROM schedule_executions
          WHERE schedule_id = ${scheduleId} AND completed_at IS NOT NULL
        `,
      ]);

      return {
        totalExecutions: total,
        successfulExecutions: successful,
        failedExecutions: failed,
        successRate: total > 0 ? (successful / total) * 100 : 0,
        averageDuration: avgDuration[0]?.avg_duration || 0,
      };
    } catch (error) {
      console.error("Failed to get execution stats:", error);
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        averageDuration: 0,
      };
    }
  },

  /**
   * Clean up old execution records
   */
  cleanup: async function (daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deleted = await prisma.schedule_executions.deleteMany({
        where: {
          started_at: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`Cleaned up ${deleted.count} old execution records`);
      return deleted.count;
    } catch (error) {
      console.error("Failed to cleanup execution records:", error);
      return 0;
    }
  },

  /**
   * Get currently running executions
   */
  getRunning: async function () {
    try {
      const executions = await prisma.schedule_executions.findMany({
        where: {
          status: "running",
        },
        include: {
          schedule: true,
        },
      });
      return executions;
    } catch (error) {
      console.error("Failed to get running executions:", error);
      return [];
    }
  },
};

module.exports = { ScheduleExecution };
