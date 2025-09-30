import { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import AgentSchedule from "@/models/agentSchedule";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import { Calendar, Clock, Play, Pause, Trash, CheckCircle, XCircle } from "@phosphor-icons/react";
import { FullScreenLoader } from "@/components/Preloader";

function ScheduleCard({ schedule, onToggle, onDelete, onRunNow }) {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutions();
  }, [schedule.id]);

  async function loadExecutions() {
    try {
      const execs = await AgentSchedule.getExecutions(
        schedule.workspaceSlug,
        schedule.id
      );
      setExecutions(execs.slice(0, 5)); // Show last 5 executions
    } catch (error) {
      console.error("Failed to load executions:", error);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-500";
      case "failed":
        return "text-red-500";
      case "running":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" weight="fill" />;
      case "failed":
        return <XCircle className="w-4 h-4" weight="fill" />;
      case "running":
        return <Clock className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-theme-bg-secondary rounded-lg p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-1">
            {schedule.name}
          </h3>
          <p className="text-white/60 text-sm">
            {AgentSchedule.describeCronExpression(schedule.cron_expression)}
          </p>
          {schedule.description && (
            <p className="text-white/40 text-xs mt-1">{schedule.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(schedule)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              schedule.enabled
                ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
            }`}
          >
            {schedule.enabled ? (
              <>
                <Play className="inline w-4 h-4 mr-1" weight="fill" />
                Active
              </>
            ) : (
              <>
                <Pause className="inline w-4 h-4 mr-1" weight="fill" />
                Paused
              </>
            )}
          </button>
        </div>
      </div>

      {/* Schedule Info */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-white/60">Workspace:</span>
          <span className="text-white ml-2">{schedule.workspaceName || "Unknown"}</span>
        </div>
        <div>
          <span className="text-white/60">Agent Type:</span>
          <span className="text-white ml-2 capitalize">{schedule.agent_type}</span>
        </div>
        {schedule.last_run_at && (
          <div>
            <span className="text-white/60">Last Run:</span>
            <span className="text-white ml-2">{formatDate(schedule.last_run_at)}</span>
          </div>
        )}
        {schedule.next_run_at && (
          <div>
            <span className="text-white/60">Next Run:</span>
            <span className="text-white ml-2">{formatDate(schedule.next_run_at)}</span>
          </div>
        )}
      </div>

      {/* Execution Stats */}
      {schedule.stats && (
        <div className="flex gap-4 mb-4 text-sm">
          <div className="bg-theme-bg-primary rounded px-3 py-2">
            <span className="text-white/60">Total:</span>
            <span className="text-white ml-2 font-semibold">
              {schedule.stats.totalExecutions}
            </span>
          </div>
          <div className="bg-green-500/10 rounded px-3 py-2">
            <span className="text-green-500/80">Success:</span>
            <span className="text-green-500 ml-2 font-semibold">
              {schedule.stats.successfulExecutions}
            </span>
          </div>
          <div className="bg-red-500/10 rounded px-3 py-2">
            <span className="text-red-500/80">Failed:</span>
            <span className="text-red-500 ml-2 font-semibold">
              {schedule.stats.failedExecutions}
            </span>
          </div>
          {schedule.stats.successRate !== undefined && (
            <div className="bg-blue-500/10 rounded px-3 py-2">
              <span className="text-blue-500/80">Success Rate:</span>
              <span className="text-blue-500 ml-2 font-semibold">
                {schedule.stats.successRate.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recent Executions */}
      {!loading && executions.length > 0 && (
        <div className="border-t border-white/10 pt-4 mt-4">
          <h4 className="text-white/80 text-sm font-medium mb-3">
            Recent Executions
          </h4>
          <div className="space-y-2">
            {executions.map((exec) => (
              <div
                key={exec.id}
                className="flex items-center justify-between bg-theme-bg-primary rounded px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(exec.status)}>
                    {getStatusIcon(exec.status)}
                  </span>
                  <span className="text-white/60">
                    {formatDate(exec.started_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {exec.completed_at && (
                    <span className="text-white/40 text-xs">
                      {Math.round((exec.completed_at - exec.started_at) / 1000)}s
                    </span>
                  )}
                  {exec.error && (
                    <span className="text-red-500/80 text-xs truncate max-w-xs" title={exec.error}>
                      {exec.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-4 border-t border-white/10 pt-4">
        <button
          onClick={() => onRunNow(schedule)}
          className="px-4 py-2 bg-primary-button hover:bg-primary-button/80 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Play className="inline w-4 h-4 mr-1" weight="fill" />
          Run Now
        </button>
        <button
          onClick={() => onDelete(schedule)}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash className="inline w-4 h-4 mr-1" weight="fill" />
          Delete
        </button>
      </div>
    </div>
  );
}

export default function AdminSchedules() {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    loadSchedules();
  }, []);

  async function loadSchedules() {
    try {
      // Load all workspaces
      const allWorkspaces = await Workspace.all();
      setWorkspaces(allWorkspaces);

      // Load schedules from all workspaces
      const schedulePromises = allWorkspaces.map(async (ws) => {
        try {
          const schedules = await AgentSchedule.list(ws.slug);
          return schedules.map((s) => ({
            ...s,
            workspaceSlug: ws.slug,
            workspaceName: ws.name,
          }));
        } catch (error) {
          console.error(`Failed to load schedules for ${ws.slug}:`, error);
          return [];
        }
      });

      const schedulesArrays = await Promise.all(schedulePromises);
      const allSchedules = schedulesArrays.flat();

      setSchedules(allSchedules);
    } catch (error) {
      console.error("Failed to load schedules:", error);
      showToast("Failed to load schedules", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(schedule) {
    try {
      await AgentSchedule.update(schedule.workspaceSlug, schedule.id, {
        enabled: !schedule.enabled,
      });
      showToast(
        `Schedule ${schedule.enabled ? "paused" : "activated"}`,
        "success"
      );
      await loadSchedules();
    } catch (error) {
      console.error("Failed to toggle schedule:", error);
      showToast("Failed to update schedule", "error");
    }
  }

  async function handleDelete(schedule) {
    if (
      !window.confirm(
        `Are you sure you want to delete the schedule "${schedule.name}"? This action cannot be undone.`
      )
    )
      return;

    try {
      await AgentSchedule.delete(schedule.workspaceSlug, schedule.id);
      showToast("Schedule deleted successfully", "success");
      await loadSchedules();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      showToast("Failed to delete schedule", "error");
    }
  }

  async function handleRunNow(schedule) {
    try {
      await AgentSchedule.runNow(schedule.workspaceSlug, schedule.id);
      showToast("Schedule execution started", "success");
      // Reload after a short delay to show the new execution
      setTimeout(() => loadSchedules(), 2000);
    } catch (error) {
      console.error("Failed to run schedule:", error);
      showToast("Failed to run schedule", "error");
    }
  }

  if (loading) {
    return (
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] w-full h-full flex justify-center items-center"
      >
        <FullScreenLoader />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-primary flex">
      {!isMobile && <Sidebar />}
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll no-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-4">
          <div className="flex items-center gap-x-4 mb-6">
            <Calendar size={32} className="text-white" weight="bold" />
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold text-white">
                Schedule Dashboard
              </h2>
              <p className="text-white/60 text-sm">
                Monitor and manage scheduled workflow executions
              </p>
            </div>
          </div>

          {schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-white/60">
              <Calendar size={64} className="mb-4" />
              <p className="text-lg font-medium mb-2">No schedules yet</p>
              <p className="text-sm">
                Create schedules from the Agents page to automate your workflows
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {schedules.map((schedule) => (
                <ScheduleCard
                  key={schedule.id}
                  schedule={schedule}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onRunNow={handleRunNow}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
