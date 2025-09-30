const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { reqBody } = require("../utils/http");
const { AgentSchedule } = require("../models/agentSchedule");
const { ScheduleExecution } = require("../models/scheduleExecution");
const SchedulableAgent = require("../utils/agents/schedulable");
const { getSchedulingEngine } = require("../utils/agents/scheduler/engine");
const { Telemetry } = require("../models/telemetry");
const { EventLogs } = require("../models/eventLogs");

function agentScheduleEndpoints(app) {
  if (!app) return;

  /**
   * GET /api/workspace/:slug/agent-schedules
   * Get all schedules for a workspace
   */
  app.get(
    "/api/workspace/:slug/agent-schedules",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default]),
    ],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { Workspace } = require("../models/workspace");
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        const schedules = await AgentSchedule.where({
          workspaceId: workspace.id,
        });

        // Add execution stats for each schedule
        const schedulesWithStats = await Promise.all(
          schedules.map(async (schedule) => {
            const stats = await ScheduleExecution.getStats(schedule.id);
            return {
              ...schedule,
              stats,
            };
          })
        );

        response.status(200).json({
          success: true,
          schedules: schedulesWithStats,
        });
      } catch (error) {
        console.error("Failed to get agent schedules:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/workspace/:slug/agent-schedules
   * Create a new agent schedule
   */
  app.post(
    "/api/workspace/:slug/agent-schedules",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default])],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { Workspace } = require("../models/workspace");
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        const {
          agentId,
          agentType = "imported",
          name,
          description,
          cronExpression,
          timezone = "UTC",
          context = {},
          enabled = true,
        } = reqBody(request);

        // Validate cron expression
        if (!AgentSchedule.validateCronExpression(cronExpression)) {
          return response.status(400).json({
            success: false,
            error: "Invalid cron expression",
          });
        }

        // Create schedulable agent to validate it exists
        try {
          const agent = await SchedulableAgent.fromId(agentId, agentType);

          // Check if agent supports scheduling
          if (!agent.supportsScheduling()) {
            return response.status(400).json({
              success: false,
              error: "This agent does not support scheduling",
            });
          }

          // For flows, validate the flow exists and is active
          if (agentType === "flow") {
            const flowData = await SchedulableAgent.loadFlowById(agentId);
            if (!flowData) {
              return response.status(400).json({
                success: false,
                error: "Flow not found or invalid",
              });
            }
            if (flowData.active === false) {
              return response.status(400).json({
                success: false,
                error:
                  "Cannot schedule inactive flow. Please activate the flow first.",
              });
            }
          }

          // Create the schedule
          const schedule = await agent.schedule({
            name,
            description,
            cronExpression,
            workspaceId: workspace.id,
            context,
            enabled,
            timezone,
            userId: response.locals?.user?.id,
          });

          // Register with scheduling engine if enabled
          if (enabled) {
            const engine = getSchedulingEngine();
            await engine.updateSchedule(schedule.id);
          }

          await Telemetry.sendTelemetry("agent_schedule_created", {
            agentType,
            workspaceId: workspace.id,
          });

          await EventLogs.logEvent(
            "agent_schedule_created",
            {
              scheduleId: schedule.id,
              agentId,
              agentType,
              workspaceId: workspace.id,
            },
            response.locals?.user?.id
          );

          response.status(200).json({
            success: true,
            schedule,
          });
        } catch (agentError) {
          return response.status(400).json({
            success: false,
            error: `Invalid agent: ${agentError.message}`,
          });
        }
      } catch (error) {
        console.error("Failed to create agent schedule:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * PUT /api/workspace/:slug/agent-schedules/:scheduleId
   * Update an agent schedule
   */
  app.put(
    "/api/workspace/:slug/agent-schedules/:scheduleId",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug, scheduleId } = request.params;
        const { Workspace } = require("../models/workspace");
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Check schedule exists and belongs to workspace
        const schedule = await AgentSchedule.get({
          id: parseInt(scheduleId),
        });

        if (!schedule || schedule.workspace_id !== workspace.id) {
          return response.status(404).json({
            success: false,
            error: "Schedule not found",
          });
        }

        const updates = reqBody(request);

        // Validate cron expression if being updated
        if (
          updates.cronExpression &&
          !AgentSchedule.validateCronExpression(updates.cronExpression)
        ) {
          return response.status(400).json({
            success: false,
            error: "Invalid cron expression",
          });
        }

        // Update the schedule
        const { schedule: updatedSchedule, error } = await AgentSchedule.update(
          parseInt(scheduleId),
          updates
        );

        if (error) {
          return response.status(400).json({
            success: false,
            error,
          });
        }

        // Update in scheduling engine
        const engine = getSchedulingEngine();
        await engine.updateSchedule(parseInt(scheduleId));

        await EventLogs.logEvent(
          "agent_schedule_updated",
          {
            scheduleId: parseInt(scheduleId),
            updates,
          },
          response.locals?.user?.id
        );

        response.status(200).json({
          success: true,
          schedule: updatedSchedule,
        });
      } catch (error) {
        console.error("Failed to update agent schedule:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * DELETE /api/workspace/:slug/agent-schedules/:scheduleId
   * Delete an agent schedule
   */
  app.delete(
    "/api/workspace/:slug/agent-schedules/:scheduleId",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug, scheduleId } = request.params;
        const { Workspace } = require("../models/workspace");
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Check schedule exists and belongs to workspace
        const schedule = await AgentSchedule.get({
          id: parseInt(scheduleId),
        });

        if (!schedule || schedule.workspace_id !== workspace.id) {
          return response.status(404).json({
            success: false,
            error: "Schedule not found",
          });
        }

        // Unregister from scheduling engine
        const engine = getSchedulingEngine();
        engine.unregisterSchedule(parseInt(scheduleId));

        // Delete the schedule (cascades to executions)
        const success = await AgentSchedule.delete(parseInt(scheduleId));

        if (!success) {
          return response.status(500).json({
            success: false,
            error: "Failed to delete schedule",
          });
        }

        await EventLogs.logEvent(
          "agent_schedule_deleted",
          {
            scheduleId: parseInt(scheduleId),
            workspaceId: workspace.id,
          },
          response.locals?.user?.id
        );

        response.status(200).json({
          success: true,
        });
      } catch (error) {
        console.error("Failed to delete agent schedule:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/workspace/:slug/agent-schedules/:scheduleId/executions
   * Get execution history for a schedule
   */
  app.get(
    "/api/workspace/:slug/agent-schedules/:scheduleId/executions",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default]),
    ],
    async (request, response) => {
      try {
        const { slug, scheduleId } = request.params;
        const { limit = 20 } = request.query;

        const { Workspace } = require("../models/workspace");
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Check schedule exists and belongs to workspace
        const schedule = await AgentSchedule.get({
          id: parseInt(scheduleId),
        });

        if (!schedule || schedule.workspace_id !== workspace.id) {
          return response.status(404).json({
            success: false,
            error: "Schedule not found",
          });
        }

        const executions = await ScheduleExecution.getHistory(
          parseInt(scheduleId),
          parseInt(limit)
        );

        response.status(200).json({
          success: true,
          executions,
        });
      } catch (error) {
        console.error("Failed to get schedule executions:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * POST /api/workspace/:slug/agent-schedules/:scheduleId/run
   * Manually trigger a scheduled agent execution
   */
  app.post(
    "/api/workspace/:slug/agent-schedules/:scheduleId/run",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { slug, scheduleId } = request.params;
        const { Workspace } = require("../models/workspace");
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        // Check schedule exists and belongs to workspace
        const schedule = await AgentSchedule.get({
          id: parseInt(scheduleId),
        });

        if (!schedule || schedule.workspace_id !== workspace.id) {
          return response.status(404).json({
            success: false,
            error: "Schedule not found",
          });
        }

        // Execute the schedule immediately
        const engine = getSchedulingEngine();

        // Run in background - don't wait for completion
        setImmediate(async () => {
          try {
            await engine.executeSchedule(schedule);
          } catch (error) {
            console.error(
              `Failed to manually execute schedule ${scheduleId}:`,
              error
            );
          }
        });

        await EventLogs.logEvent(
          "agent_schedule_manual_run",
          {
            scheduleId: parseInt(scheduleId),
            workspaceId: workspace.id,
          },
          response.locals?.user?.id
        );

        response.status(200).json({
          success: true,
          message: "Schedule execution started",
        });
      } catch (error) {
        console.error("Failed to manually run schedule:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/workspace/:slug/agent-schedules/stats
   * Get scheduling statistics for a workspace
   */
  app.get(
    "/api/workspace/:slug/agent-schedules/stats",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default]),
    ],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { Workspace } = require("../models/workspace");
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          return response.status(404).json({
            success: false,
            error: "Workspace not found",
          });
        }

        const stats = await AgentSchedule.getWorkspaceStats(workspace.id);

        response.status(200).json({
          success: true,
          stats,
        });
      } catch (error) {
        console.error("Failed to get schedule stats:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );

  /**
   * GET /api/workspace/:slug/flows/schedulable
   * Get all available flows that can be scheduled
   */
  app.get(
    "/api/workspace/:slug/flows/schedulable",
    [
      validatedRequest,
      flexUserRoleValid([ROLES.admin, ROLES.manager, ROLES.default]),
    ],
    async (request, response) => {
      try {
        const flows = await SchedulableAgent.getAvailableFlows();
        response.status(200).json({
          success: true,
          flows,
        });
      } catch (error) {
        console.error("Failed to get schedulable flows:", error);
        response.status(500).json({
          success: false,
          error: error.message,
        });
      }
    }
  );
}

module.exports = { agentScheduleEndpoints };
