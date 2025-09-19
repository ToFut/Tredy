const cron = require("node-cron");
const { AgentSchedule } = require("../../../models/agentSchedule");
const { ScheduleExecution } = require("../../../models/scheduleExecution");
const SchedulableAgent = require("../schedulable");

/**
 * AgentSchedulingEngine - Manages all scheduled agent executions
 * This engine runs as a background service and handles:
 * - Loading and registering cron schedules
 * - Executing agents at scheduled times
 * - Managing execution history
 * - Handling errors and retries
 */
class AgentSchedulingEngine {
  constructor() {
    this.activeSchedules = new Map(); // Map of scheduleId -> cron task
    this.running = false;
    this.checkInterval = null;
  }

  /**
   * Start the scheduling engine
   */
  async start() {
    if (this.running) {
      console.log("[AgentScheduler] Engine already running");
      return;
    }

    console.log("[AgentScheduler] Starting scheduling engine...");
    this.running = true;

    try {
      // Load all active schedules
      const schedules = await AgentSchedule.getActive();
      console.log(
        `[AgentScheduler] Loading ${schedules.length} active schedules`
      );

      for (const schedule of schedules) {
        await this.registerSchedule(schedule);
      }

      // Check for missed schedules every minute
      this.missedScheduleChecker = setInterval(
        () => this.checkMissedSchedules(),
        60000 // 1 minute
      );

      // Clean up old execution records daily
      this.cleanupInterval = setInterval(
        () => this.cleanupOldExecutions(),
        24 * 60 * 60 * 1000 // 24 hours
      );

      console.log("[AgentScheduler] Engine started successfully");
    } catch (error) {
      console.error("[AgentScheduler] Failed to start engine:", error);
      this.running = false;
      throw error;
    }
  }

  /**
   * Stop the scheduling engine
   */
  async stop() {
    if (!this.running) return;

    console.log("[AgentScheduler] Stopping scheduling engine...");

    // Stop all cron tasks
    for (const [scheduleId, task] of this.activeSchedules.entries()) {
      task.stop();
      console.log(`[AgentScheduler] Stopped schedule ${scheduleId}`);
    }
    this.activeSchedules.clear();

    // Clear intervals
    if (this.missedScheduleChecker) {
      clearInterval(this.missedScheduleChecker);
      this.missedScheduleChecker = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.running = false;
    console.log("[AgentScheduler] Engine stopped");
  }

  /**
   * Register a schedule with the cron system
   */
  async registerSchedule(schedule) {
    try {
      // Unregister existing schedule if it exists
      if (this.activeSchedules.has(schedule.id)) {
        this.unregisterSchedule(schedule.id);
      }

      // Don't register disabled schedules
      if (!schedule.enabled) {
        console.log(
          `[AgentScheduler] Schedule ${schedule.id} is disabled, skipping registration`
        );
        return;
      }

      console.log(
        `[AgentScheduler] Registering schedule ${schedule.id}: ${schedule.name}`
      );

      // Create cron task
      const task = cron.schedule(
        schedule.cron_expression,
        async () => {
          await this.executeSchedule(schedule);
        },
        {
          scheduled: true,
          timezone: schedule.timezone || "UTC",
        }
      );

      this.activeSchedules.set(schedule.id, task);
      console.log(
        `[AgentScheduler] Schedule ${schedule.id} registered successfully`
      );
    } catch (error) {
      console.error(
        `[AgentScheduler] Failed to register schedule ${schedule.id}:`,
        error
      );
    }
  }

  /**
   * Unregister a schedule
   */
  unregisterSchedule(scheduleId) {
    const task = this.activeSchedules.get(scheduleId);
    if (task) {
      task.stop();
      this.activeSchedules.delete(scheduleId);
      console.log(`[AgentScheduler] Unregistered schedule ${scheduleId}`);
    }
  }

  /**
   * Execute a scheduled agent
   */
  async executeSchedule(schedule) {
    console.log(
      `[AgentScheduler] Executing schedule ${schedule.id}: ${schedule.name}`
    );

    // Start execution tracking
    const execution = await ScheduleExecution.start(schedule.id);
    if (!execution) {
      console.error(
        `[AgentScheduler] Failed to create execution record for schedule ${schedule.id}`
      );
      return;
    }

    try {
      // Create schedulable agent
      const schedulableAgent = await SchedulableAgent.fromId(
        schedule.agent_id,
        schedule.agent_type
      );

      // Execute the agent
      const result = await schedulableAgent.executeScheduled(schedule.id);

      // Mark execution as successful
      await ScheduleExecution.complete(
        execution.id,
        result.output,
        result.tokensUsed || 0
      );

      // Update schedule's last run time
      await AgentSchedule.updateLastRun(schedule.id);

      console.log(
        `[AgentScheduler] Successfully executed schedule ${schedule.id}`
      );
    } catch (error) {
      console.error(
        `[AgentScheduler] Failed to execute schedule ${schedule.id}:`,
        error
      );

      // Mark execution as failed
      await ScheduleExecution.fail(execution.id, error);

      // Optionally disable schedule after repeated failures
      const stats = await ScheduleExecution.getStats(schedule.id);
      if (stats.failedExecutions >= 5 && stats.successRate < 20) {
        console.warn(
          `[AgentScheduler] Disabling schedule ${schedule.id} due to repeated failures`
        );
        await AgentSchedule.update(schedule.id, { enabled: false });
        this.unregisterSchedule(schedule.id);
      }
    }
  }

  /**
   * Check for and execute any missed schedules
   */
  async checkMissedSchedules() {
    try {
      const dueSchedules = await AgentSchedule.getDueSchedules();

      for (const schedule of dueSchedules) {
        // Skip if already registered (will run on its own schedule)
        if (this.activeSchedules.has(schedule.id)) {
          continue;
        }

        console.log(
          `[AgentScheduler] Found missed schedule ${schedule.id}, executing now`
        );
        await this.executeSchedule(schedule);
      }
    } catch (error) {
      console.error("[AgentScheduler] Error checking missed schedules:", error);
    }
  }

  /**
   * Clean up old execution records
   */
  async cleanupOldExecutions() {
    try {
      const {
        ScheduleExecution,
      } = require("../../../models/scheduleExecution");
      const deleted = await ScheduleExecution.cleanup(30); // Keep 30 days of history
      console.log(
        `[AgentScheduler] Cleaned up ${deleted} old execution records`
      );
    } catch (error) {
      console.error("[AgentScheduler] Error cleaning up executions:", error);
    }
  }

  /**
   * Reload schedules (called when schedules are added/updated)
   */
  async reloadSchedules() {
    console.log("[AgentScheduler] Reloading all schedules...");

    // Stop all current schedules
    for (const [scheduleId, task] of this.activeSchedules.entries()) {
      task.stop();
    }
    this.activeSchedules.clear();

    // Reload all active schedules
    const schedules = await AgentSchedule.getActive();
    for (const schedule of schedules) {
      await this.registerSchedule(schedule);
    }

    console.log(`[AgentScheduler] Reloaded ${schedules.length} schedules`);
  }

  /**
   * Update a single schedule (more efficient than full reload)
   */
  async updateSchedule(scheduleId) {
    // Unregister existing schedule
    this.unregisterSchedule(scheduleId);

    // Get updated schedule
    const schedule = await AgentSchedule.get({ id: scheduleId });
    if (schedule && schedule.enabled) {
      await this.registerSchedule(schedule);
    }
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      running: this.running,
      activeSchedules: this.activeSchedules.size,
      scheduleIds: Array.from(this.activeSchedules.keys()),
    };
  }
}

// Singleton instance
let engineInstance = null;

/**
 * Get or create the scheduling engine instance
 */
function getSchedulingEngine() {
  if (!engineInstance) {
    engineInstance = new AgentSchedulingEngine();
  }
  return engineInstance;
}

module.exports = {
  AgentSchedulingEngine,
  getSchedulingEngine,
};
