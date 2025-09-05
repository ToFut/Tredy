const path = require("path");
const { parentPort } = require("worker_threads");
const { CronJob } = require("cron");

class AgentSchedulerJob {
  constructor() {
    this.schedules = new Map();
    this.isRunning = true;
    
    process.on("SIGTERM", () => this.stop());
    process.on("SIGINT", () => this.stop());
  }

  log(message, level = "info") {
    if (parentPort) {
      parentPort.postMessage({
        name: "agent-scheduler",
        message: `[AgentScheduler] ${message}`,
        level
      });
    } else {
      console.log(`[AgentScheduler] ${message}`);
    }
  }

  async start() {
    this.log("Agent Scheduler starting...");
    
    await this.loadSchedules();
    
    setInterval(() => {
      if (this.isRunning) {
        this.checkForUpdates();
      }
    }, 60000);
    
    this.log(`Agent Scheduler started with ${this.schedules.size} active schedules`);
  }

  async loadSchedules() {
    try {
      const { AgentSchedule } = require("../../models/agentSchedule");
      const schedules = await AgentSchedule.where({ enabled: true });
      
      for (const schedule of schedules) {
        this.addSchedule(schedule);
      }
    } catch (error) {
      this.log(`Error loading schedules: ${error.message}`, "error");
    }
  }

  async checkForUpdates() {
    try {
      const { AgentSchedule } = require("../../models/agentSchedule");
      const schedules = await AgentSchedule.where({ enabled: true });
      
      const currentIds = new Set(schedules.map(s => s.id));
      const existingIds = new Set(this.schedules.keys());
      
      for (const id of existingIds) {
        if (!currentIds.has(id)) {
          this.removeSchedule(id);
        }
      }
      
      for (const schedule of schedules) {
        const existing = this.schedules.get(schedule.id);
        if (!existing || existing.cron_expression !== schedule.cron_expression) {
          this.removeSchedule(schedule.id);
          this.addSchedule(schedule);
        }
      }
    } catch (error) {
      this.log(`Error checking for updates: ${error.message}`, "error");
    }
  }

  addSchedule(schedule) {
    try {
      const job = new CronJob(
        schedule.cron_expression,
        async () => {
          await this.executeSchedule(schedule.id);
        },
        null,
        true,
        schedule.timezone || "UTC"
      );
      
      this.schedules.set(schedule.id, {
        job,
        cron_expression: schedule.cron_expression,
        name: schedule.name
      });
      
      this.log(`Added schedule: ${schedule.name} (${schedule.cron_expression})`);
    } catch (error) {
      this.log(`Error adding schedule ${schedule.name}: ${error.message}`, "error");
    }
  }

  removeSchedule(scheduleId) {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      schedule.job.stop();
      this.schedules.delete(scheduleId);
      this.log(`Removed schedule: ${schedule.name}`);
    }
  }

  async executeSchedule(scheduleId) {
    const startTime = Date.now();
    this.log(`Executing schedule ID: ${scheduleId}`);
    
    try {
      const { AgentSchedule } = require("../../models/agentSchedule");
      const { ScheduleExecution } = require("../../models/scheduleExecution");
      const { Workspace } = require("../../models/workspace");
      const { SchedulableAgent } = require("../../utils/agents/schedulable");
      const { ImportedPlugin } = require("../../models/importedPlugin");
      const { WorkspaceChats } = require("../../models/workspaceChats");
      const { broadcastScheduleEvent } = require("../../utils/scheduleEvents");
      
      const schedule = await AgentSchedule.get({ id: scheduleId });
      if (!schedule || !schedule.enabled) {
        this.log(`Schedule ${scheduleId} not found or disabled`, "warn");
        return;
      }
      
      const workspace = await Workspace.get({ id: schedule.workspace_id });
      if (!workspace) {
        this.log(`Workspace ${schedule.workspace_id} not found`, "error");
        return;
      }
      
      // Broadcast schedule started event
      broadcastScheduleEvent(workspace.id, "schedule:started", {
        scheduleId,
        scheduleName: schedule.name,
        timestamp: new Date()
      });
      
      const execution = await ScheduleExecution.create({
        schedule_id: scheduleId,
        status: "running",
        started_at: new Date()
      });
      
      let result, error;
      try {
        let agent;
        
        if (schedule.agent_type === "imported") {
          const plugin = await ImportedPlugin.get({ hubId: schedule.agent_id });
          if (!plugin) {
            throw new Error(`Imported plugin ${schedule.agent_id} not found`);
          }
          agent = plugin;
        } else if (schedule.agent_type === "system") {
          // Support for system agents (chat-based schedules)
          agent = {
            id: schedule.agent_id || "chat-agent",
            name: schedule.name,
            type: "system"
          };
        } else if (schedule.agent_type === "slash") {
          throw new Error("Slash commands not yet supported for scheduling");
        }
        
        const schedulableAgent = new SchedulableAgent(agent, schedule.agent_type);
        result = await schedulableAgent.executeScheduled(scheduleId);
        
        await ScheduleExecution.update(execution.id, {
          status: "success",
          completed_at: new Date(),
          result: JSON.stringify(result || {}),
          tokens_used: result?.tokensUsed || 0
        });
        
        await AgentSchedule.update(scheduleId, {
          last_run_at: new Date(),
          next_run_at: this.getNextRunTime(schedule.cron_expression, schedule.timezone)
        });
        
        const duration = Date.now() - startTime;
        this.log(`Schedule ${schedule.name} executed successfully in ${duration}ms`);
        
        // Create proactive chat message with the results
        const resultText = typeof result === 'object' ? 
          (result.output || result.message || JSON.stringify(result)) : 
          String(result);
        
        await WorkspaceChats.create({
          workspaceId: workspace.id,
          prompt: `[SCHEDULED] ${schedule.name}`,
          response: JSON.stringify({
            text: `📋 **Scheduled Task Completed: ${schedule.name}**\n\n${resultText}`,
            type: "schedule_result",
            scheduleId: scheduleId,
            executionId: execution.id,
            timestamp: new Date()
          }),
          user: null,
          threadId: null,
          include: true
        });
        
        // Broadcast schedule completed event
        broadcastScheduleEvent(workspace.id, "schedule:completed", {
          scheduleId,
          scheduleName: schedule.name,
          success: true,
          result: resultText,
          duration,
          timestamp: new Date()
        });
        
      } catch (err) {
        error = err.message;
        await ScheduleExecution.update(execution.id, {
          status: "failed",
          completed_at: new Date(),
          error: error
        });
        
        // Create error message in chat
        await WorkspaceChats.create({
          workspaceId: workspace.id,
          prompt: `[SCHEDULED] ${schedule.name}`,
          response: JSON.stringify({
            text: `❌ **Scheduled Task Failed: ${schedule.name}**\n\nError: ${error}`,
            type: "schedule_error",
            scheduleId: scheduleId,
            executionId: execution.id,
            timestamp: new Date()
          }),
          user: null,
          threadId: null,
          include: true
        });
        
        // Broadcast schedule failed event
        broadcastScheduleEvent(workspace.id, "schedule:failed", {
          scheduleId,
          scheduleName: schedule.name,
          error,
          timestamp: new Date()
        });
        
        this.log(`Schedule ${schedule.name} failed: ${error}`, "error");
      }
      
    } catch (error) {
      this.log(`Error executing schedule ${scheduleId}: ${error.message}`, "error");
    }
  }

  getNextRunTime(cronExpression, timezone) {
    try {
      const job = new CronJob(cronExpression, () => {}, null, false, timezone);
      const nextDate = job.nextDate();
      return nextDate ? nextDate.toDate() : null;
    } catch (error) {
      this.log(`Error calculating next run time: ${error.message}`, "error");
      return null;
    }
  }

  stop() {
    this.log("Agent Scheduler stopping...");
    this.isRunning = false;
    
    for (const [id, schedule] of this.schedules) {
      schedule.job.stop();
    }
    
    this.schedules.clear();
    this.log("Agent Scheduler stopped");
    process.exit(0);
  }
}

const scheduler = new AgentSchedulerJob();
scheduler.start().catch(error => {
  console.error("Failed to start Agent Scheduler:", error);
  process.exit(1);
});