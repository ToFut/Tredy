import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Calendar,
  Clock,
  Play,
  Pause,
  Trash,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react";
import AgentSchedule from "@/models/agentSchedule";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";

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
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-gray-900 dark:text-white font-semibold text-base mb-1">
            {schedule.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {AgentSchedule.describeCronExpression(schedule.cron_expression)}
          </p>
          {schedule.description && (
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">{schedule.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(schedule)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              schedule.enabled
                ? "bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30"
                : "bg-gray-500/20 text-gray-600 dark:text-gray-400 hover:bg-gray-500/30"
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
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Workspace:</span>
          <span className="text-gray-900 dark:text-white ml-2">{schedule.workspaceName || "Unknown"}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Agent Type:</span>
          <span className="text-gray-900 dark:text-white ml-2 capitalize">{schedule.agent_type}</span>
        </div>
        {schedule.last_run_at && (
          <div>
            <span className="text-gray-600 dark:text-gray-400">Last Run:</span>
            <span className="text-gray-900 dark:text-white ml-2">{formatDate(schedule.last_run_at)}</span>
          </div>
        )}
        {schedule.next_run_at && (
          <div>
            <span className="text-gray-600 dark:text-gray-400">Next Run:</span>
            <span className="text-gray-900 dark:text-white ml-2">{formatDate(schedule.next_run_at)}</span>
          </div>
        )}
      </div>

      {/* Execution Stats */}
      {schedule.stats && (
        <div className="flex gap-3 mb-3 text-sm">
          <div className="bg-white dark:bg-gray-700 rounded px-3 py-2">
            <span className="text-gray-600 dark:text-gray-400">Total:</span>
            <span className="text-gray-900 dark:text-white ml-2 font-semibold">
              {schedule.stats.totalExecutions}
            </span>
          </div>
          <div className="bg-green-500/10 rounded px-3 py-2">
            <span className="text-green-600 dark:text-green-400/80">Success:</span>
            <span className="text-green-600 dark:text-green-400 ml-2 font-semibold">
              {schedule.stats.successfulExecutions}
            </span>
          </div>
          <div className="bg-red-500/10 rounded px-3 py-2">
            <span className="text-red-600 dark:text-red-400/80">Failed:</span>
            <span className="text-red-600 dark:text-red-400 ml-2 font-semibold">
              {schedule.stats.failedExecutions}
            </span>
          </div>
          {schedule.stats.successRate !== undefined && (
            <div className="bg-blue-500/10 rounded px-3 py-2">
              <span className="text-blue-600 dark:text-blue-400/80">Success Rate:</span>
              <span className="text-blue-600 dark:text-blue-400 ml-2 font-semibold">
                {schedule.stats.successRate.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Recent Executions */}
      {!loading && executions.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <h4 className="text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
            Recent Executions
          </h4>
          <div className="space-y-2">
            {executions.map((exec) => (
              <div
                key={exec.id}
                className="flex items-center justify-between bg-white dark:bg-gray-700 rounded px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(exec.status)}>
                    {getStatusIcon(exec.status)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {formatDate(exec.started_at)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {exec.completed_at && (
                    <span className="text-gray-500 dark:text-gray-500 text-xs">
                      {Math.round((new Date(exec.completed_at) - new Date(exec.started_at)) / 1000)}s
                    </span>
                  )}
                  {exec.error && (
                    <span className="text-red-600 dark:text-red-400/80 text-xs truncate max-w-xs" title={exec.error}>
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
      <div className="flex gap-2 mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        <button
          onClick={() => onRunNow(schedule)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Play className="inline w-4 h-4 mr-1" weight="fill" />
          Run Now
        </button>
        <button
          onClick={() => onDelete(schedule)}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash className="inline w-4 h-4 mr-1" weight="fill" />
          Delete
        </button>
      </div>
    </div>
  );
}

export default function SchedulesModal({ isOpen, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      loadSchedules();
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  async function loadSchedules() {
    try {
      setLoading(true);
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

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedules-title"
        className={`fixed top-0 right-0 h-full w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl z-[9999] transform transition-transform duration-300 overflow-hidden ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl shadow-lg">
              <Calendar className="w-7 h-7 text-white" weight="bold" />
            </div>
            <div>
              <h2 id="schedules-title" className="text-2xl font-bold text-gray-900 dark:text-white">
                Workflow Schedules
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Monitor and manage scheduled workflow executions
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {schedules.filter((s) => s.enabled).length} active schedules
                </span>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {schedules.filter((s) => s.enabled).length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Active
                </div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {schedules.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-100px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <Calendar size={64} className="mb-4" />
              <p className="text-lg font-medium mb-2">No schedules yet</p>
              <p className="text-sm">
                Create schedules from the Agents page to automate your workflows
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
    </>
  );

  return createPortal(modalContent, document.body);
}
