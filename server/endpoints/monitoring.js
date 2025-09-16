const { validatedRequest } = require("../utils/middleware/validatedRequest");
const { flexUserRoleValid, ROLES } = require("../utils/middleware/multiUserProtected");
const { getSchedulingEngine } = require("../utils/agents/scheduler/engine");
const { AgentSchedule } = require("../models/agentSchedule");
const { ScheduleExecution } = require("../models/scheduleExecution");

function monitoringEndpoints(app) {
  if (!app) return;

  /**
   * GET /api/monitoring/health
   * Overall system health check endpoint
   */
  app.get(
    "/api/monitoring/health",
    async (request, response) => {
      try {
        const engine = getSchedulingEngine();
        const engineStatus = engine.getStatus();

        // Check database connectivity
        let dbHealthy = true;
        try {
          await AgentSchedule.count();
        } catch (error) {
          dbHealthy = false;
        }

        // Get active schedules status
        const activeSchedules = await AgentSchedule.getActive();
        const recentExecutions = await ScheduleExecution.getRecent(10);

        // Calculate success rate from recent executions
        const successfulExecutions = recentExecutions.filter(e => e.status === 'completed').length;
        const failedExecutions = recentExecutions.filter(e => e.status === 'failed').length;
        const successRate = recentExecutions.length > 0
          ? (successfulExecutions / recentExecutions.length) * 100
          : 100;

        // Determine overall health status
        const isHealthy = dbHealthy && engineStatus.running && successRate > 50;

        const healthStatus = {
          status: isHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          components: {
            database: {
              status: dbHealthy ? 'healthy' : 'unhealthy',
              message: dbHealthy ? 'Database connection active' : 'Database connection failed'
            },
            scheduler: {
              status: engineStatus.running ? 'healthy' : 'unhealthy',
              message: engineStatus.running
                ? `Scheduler running with ${engineStatus.activeSchedules} active schedules`
                : 'Scheduler is not running',
              details: {
                running: engineStatus.running,
                activeSchedules: engineStatus.activeSchedules,
                scheduleIds: engineStatus.scheduleIds
              }
            },
            executions: {
              status: successRate > 80 ? 'healthy' : successRate > 50 ? 'degraded' : 'unhealthy',
              message: `${successRate.toFixed(1)}% success rate in recent executions`,
              details: {
                recentTotal: recentExecutions.length,
                successful: successfulExecutions,
                failed: failedExecutions,
                successRate: `${successRate.toFixed(1)}%`
              }
            }
          },
          metrics: {
            totalSchedules: activeSchedules.length,
            enabledSchedules: activeSchedules.filter(s => s.enabled).length,
            disabledSchedules: activeSchedules.filter(s => !s.enabled).length,
            recentExecutions: {
              total: recentExecutions.length,
              completed: successfulExecutions,
              failed: failedExecutions,
              running: recentExecutions.filter(e => e.status === 'running').length
            }
          }
        };

        response.status(isHealthy ? 200 : 503).json(healthStatus);
      } catch (error) {
        console.error("Health check failed:", error);
        response.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    }
  );

  /**
   * GET /api/monitoring/schedules/status
   * Get detailed status of all schedules
   */
  app.get(
    "/api/monitoring/schedules/status",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const schedules = await AgentSchedule.getAll();
        const engine = getSchedulingEngine();
        const engineStatus = engine.getStatus();

        // Get detailed status for each schedule
        const schedulesWithStatus = await Promise.all(
          schedules.map(async (schedule) => {
            const stats = await ScheduleExecution.getStats(schedule.id);
            const lastExecution = await ScheduleExecution.getLastExecution(schedule.id);
            const isRegistered = engineStatus.scheduleIds.includes(schedule.id);

            return {
              id: schedule.id,
              name: schedule.name,
              workspaceId: schedule.workspace_id,
              agentId: schedule.agent_id,
              agentType: schedule.agent_type,
              cronExpression: schedule.cron_expression,
              timezone: schedule.timezone,
              enabled: schedule.enabled,
              status: {
                isActive: schedule.enabled && isRegistered,
                isRegistered,
                lastRun: schedule.last_run_at,
                nextRun: schedule.next_run_at,
                health: stats.successRate > 80 ? 'healthy' :
                       stats.successRate > 50 ? 'degraded' : 'unhealthy'
              },
              statistics: stats,
              lastExecution: lastExecution ? {
                id: lastExecution.id,
                status: lastExecution.status,
                startedAt: lastExecution.started_at,
                completedAt: lastExecution.completed_at,
                duration: lastExecution.duration_ms,
                error: lastExecution.error_message
              } : null
            };
          })
        );

        response.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          summary: {
            total: schedulesWithStatus.length,
            active: schedulesWithStatus.filter(s => s.status.isActive).length,
            healthy: schedulesWithStatus.filter(s => s.status.health === 'healthy').length,
            degraded: schedulesWithStatus.filter(s => s.status.health === 'degraded').length,
            unhealthy: schedulesWithStatus.filter(s => s.status.health === 'unhealthy').length
          },
          schedules: schedulesWithStatus
        });
      } catch (error) {
        console.error("Failed to get schedule status:", error);
        response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  /**
   * GET /api/monitoring/executions/failed
   * Get recent failed executions for monitoring
   */
  app.get(
    "/api/monitoring/executions/failed",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { limit = 20, hours = 24 } = request.query;

        const failedExecutions = await ScheduleExecution.getFailedInTimeRange(
          parseInt(hours),
          parseInt(limit)
        );

        // Group failures by schedule for easier analysis
        const failuresBySchedule = {};
        for (const execution of failedExecutions) {
          const scheduleId = execution.schedule_id;
          if (!failuresBySchedule[scheduleId]) {
            const schedule = await AgentSchedule.get({ id: scheduleId });
            failuresBySchedule[scheduleId] = {
              schedule: {
                id: schedule.id,
                name: schedule.name,
                workspaceId: schedule.workspace_id
              },
              failures: []
            };
          }
          failuresBySchedule[scheduleId].failures.push({
            id: execution.id,
            startedAt: execution.started_at,
            error: execution.error_message,
            duration: execution.duration_ms
          });
        }

        response.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          timeRange: `Last ${hours} hours`,
          summary: {
            totalFailures: failedExecutions.length,
            affectedSchedules: Object.keys(failuresBySchedule).length
          },
          failuresBySchedule
        });
      } catch (error) {
        console.error("Failed to get failed executions:", error);
        response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  /**
   * POST /api/monitoring/scheduler/restart
   * Restart the scheduling engine (admin only)
   */
  app.post(
    "/api/monitoring/scheduler/restart",
    [validatedRequest, flexUserRoleValid([ROLES.admin])],
    async (request, response) => {
      try {
        const engine = getSchedulingEngine();

        console.log("[Monitoring] Restarting scheduling engine...");

        // Stop the engine
        await engine.stop();

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start the engine again
        await engine.start();

        const newStatus = engine.getStatus();

        response.status(200).json({
          success: true,
          message: "Scheduling engine restarted successfully",
          status: newStatus
        });
      } catch (error) {
        console.error("Failed to restart scheduler:", error);
        response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  /**
   * GET /api/monitoring/metrics
   * Get detailed metrics for monitoring dashboards
   */
  app.get(
    "/api/monitoring/metrics",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const { hours = 24 } = request.query;

        // Get execution metrics over time
        const executionMetrics = await ScheduleExecution.getMetricsOverTime(parseInt(hours));

        // Get per-schedule metrics
        const schedules = await AgentSchedule.getAll();
        const scheduleMetrics = await Promise.all(
          schedules.map(async (schedule) => {
            const stats = await ScheduleExecution.getStats(schedule.id);
            return {
              scheduleId: schedule.id,
              scheduleName: schedule.name,
              ...stats
            };
          })
        );

        // Calculate aggregate metrics
        const totalExecutions = executionMetrics.reduce((sum, m) => sum + m.total, 0);
        const successfulExecutions = executionMetrics.reduce((sum, m) => sum + m.successful, 0);
        const failedExecutions = executionMetrics.reduce((sum, m) => sum + m.failed, 0);
        const avgDuration = executionMetrics.reduce((sum, m) => sum + (m.avgDuration || 0), 0) / executionMetrics.length;

        response.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          timeRange: `Last ${hours} hours`,
          aggregate: {
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            successRate: totalExecutions > 0
              ? ((successfulExecutions / totalExecutions) * 100).toFixed(1)
              : 0,
            avgDurationMs: avgDuration.toFixed(0)
          },
          timeSeries: executionMetrics,
          scheduleMetrics: scheduleMetrics.sort((a, b) => b.totalExecutions - a.totalExecutions)
        });
      } catch (error) {
        console.error("Failed to get metrics:", error);
        response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );

  /**
   * GET /api/monitoring/alerts
   * Get active alerts based on monitoring rules
   */
  app.get(
    "/api/monitoring/alerts",
    [validatedRequest, flexUserRoleValid([ROLES.admin, ROLES.manager])],
    async (request, response) => {
      try {
        const alerts = [];

        // Check for schedules with high failure rates
        const schedules = await AgentSchedule.getActive();
        for (const schedule of schedules) {
          const stats = await ScheduleExecution.getStats(schedule.id);

          if (stats.failedExecutions >= 3 && stats.successRate < 50) {
            alerts.push({
              level: 'critical',
              type: 'high_failure_rate',
              scheduleId: schedule.id,
              scheduleName: schedule.name,
              message: `Schedule "${schedule.name}" has ${stats.failedExecutions} failures with ${stats.successRate.toFixed(1)}% success rate`,
              details: stats
            });
          } else if (stats.failedExecutions >= 2 && stats.successRate < 70) {
            alerts.push({
              level: 'warning',
              type: 'elevated_failure_rate',
              scheduleId: schedule.id,
              scheduleName: schedule.name,
              message: `Schedule "${schedule.name}" showing degraded performance with ${stats.successRate.toFixed(1)}% success rate`,
              details: stats
            });
          }

          // Check for stuck executions
          const lastExecution = await ScheduleExecution.getLastExecution(schedule.id);
          if (lastExecution && lastExecution.status === 'running') {
            const runningTime = Date.now() - new Date(lastExecution.started_at).getTime();
            if (runningTime > 30 * 60 * 1000) { // 30 minutes
              alerts.push({
                level: 'warning',
                type: 'stuck_execution',
                scheduleId: schedule.id,
                scheduleName: schedule.name,
                message: `Schedule "${schedule.name}" has been running for ${Math.floor(runningTime / 60000)} minutes`,
                executionId: lastExecution.id
              });
            }
          }
        }

        // Check scheduler engine status
        const engine = getSchedulingEngine();
        const engineStatus = engine.getStatus();
        if (!engineStatus.running) {
          alerts.push({
            level: 'critical',
            type: 'scheduler_down',
            message: 'Scheduling engine is not running',
            action: 'Restart the scheduling engine'
          });
        }

        response.status(200).json({
          success: true,
          timestamp: new Date().toISOString(),
          alertCount: alerts.length,
          alerts: alerts.sort((a, b) => {
            const levelOrder = { critical: 0, warning: 1, info: 2 };
            return levelOrder[a.level] - levelOrder[b.level];
          })
        });
      } catch (error) {
        console.error("Failed to get alerts:", error);
        response.status(500).json({
          success: false,
          error: error.message
        });
      }
    }
  );
}

module.exports = { monitoringEndpoints };