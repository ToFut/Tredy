import React, { useState, useEffect } from "react";
import {
  Clock,
  Play,
  Pause,
  Trash,
  Edit,
  CheckCircle,
  XCircle,
  Timer,
  Calendar,
} from "@phosphor-icons/react";
import AgentSchedule from "@/models/agentSchedule";
import ScheduleModal from "./ScheduleModal";
import { formatDistanceToNow } from "date-fns";

export default function ScheduleList({ workspace }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedSchedule, setExpandedSchedule] = useState(null);
  const [executions, setExecutions] = useState({});

  useEffect(() => {
    loadSchedules();
  }, [workspace.slug]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await AgentSchedule.list(workspace.slug);
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadExecutions = async (scheduleId) => {
    try {
      const data = await AgentSchedule.getExecutions(workspace.slug, scheduleId, 10);
      setExecutions((prev) => ({ ...prev, [scheduleId]: data }));
    } catch (error) {
      console.error("Failed to load executions:", error);
    }
  };

  const handleToggleSchedule = async (schedule) => {
    try {
      await AgentSchedule.update(workspace.slug, schedule.id, {
        enabled: !schedule.enabled,
      });
      await loadSchedules();
    } catch (error) {
      console.error("Failed to toggle schedule:", error);
    }
  };

  const handleRunNow = async (scheduleId) => {
    try {
      await AgentSchedule.runNow(workspace.slug, scheduleId);
      // Refresh executions after a delay
      setTimeout(() => loadExecutions(scheduleId), 2000);
    } catch (error) {
      console.error("Failed to run schedule:", error);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    
    try {
      await AgentSchedule.delete(workspace.slug, scheduleId);
      await loadSchedules();
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    }
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedSchedule(null);
  };

  const handleModalSave = async () => {
    await loadSchedules();
  };

  const toggleExpanded = (scheduleId) => {
    if (expandedSchedule === scheduleId) {
      setExpandedSchedule(null);
    } else {
      setExpandedSchedule(scheduleId);
      if (!executions[scheduleId]) {
        loadExecutions(scheduleId);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-theme-text-secondary">
          Loading schedules...
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-theme-text-secondary mx-auto mb-4" />
        <p className="text-theme-text-secondary mb-4">
          No schedules configured yet
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-button text-white rounded hover:bg-primary-button-hover transition-colors"
        >
          Create First Schedule
        </button>
        {showModal && (
          <ScheduleModal
            isOpen={showModal}
            onClose={handleModalClose}
            onSave={handleModalSave}
            workspace={workspace}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-theme-text-primary">
          Agent Schedules
        </h3>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary-button text-white rounded hover:bg-primary-button-hover transition-colors"
        >
          Add Schedule
        </button>
      </div>

      <div className="space-y-3">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-theme-bg-primary rounded-lg border border-theme-border"
          >
            {/* Schedule Header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-theme-text-primary">
                      {schedule.name}
                    </h4>
                    {schedule.enabled ? (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-500 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  
                  {schedule.description && (
                    <p className="text-sm text-theme-text-secondary mb-2">
                      {schedule.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-theme-text-secondary">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {AgentSchedule.describeCronExpression(schedule.cron_expression)}
                    </div>
                    {schedule.last_run_at && (
                      <div className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        Last run {formatDistanceToNow(new Date(schedule.last_run_at))} ago
                      </div>
                    )}
                    {schedule.next_run_at && schedule.enabled && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next run {formatDistanceToNow(new Date(schedule.next_run_at), { addSuffix: true })}
                      </div>
                    )}
                  </div>

                  {/* Statistics */}
                  {schedule.stats && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-xs">
                        <span className="text-theme-text-secondary">Total runs:</span>{" "}
                        <span className="text-theme-text-primary">{schedule.stats.totalExecutions}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-theme-text-secondary">Success rate:</span>{" "}
                        <span className={schedule.stats.successRate > 80 ? "text-green-500" : "text-yellow-500"}>
                          {schedule.stats.successRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSchedule(schedule)}
                    className="p-1.5 rounded hover:bg-theme-bg-secondary transition-colors"
                    title={schedule.enabled ? "Disable" : "Enable"}
                  >
                    {schedule.enabled ? (
                      <Pause className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Play className="w-4 h-4 text-green-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleRunNow(schedule.id)}
                    className="p-1.5 rounded hover:bg-theme-bg-secondary transition-colors"
                    title="Run Now"
                  >
                    <Play className="w-4 h-4 text-primary-button" />
                  </button>
                  <button
                    onClick={() => handleEdit(schedule)}
                    className="p-1.5 rounded hover:bg-theme-bg-secondary transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-theme-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    className="p-1.5 rounded hover:bg-theme-bg-secondary transition-colors"
                    title="Delete"
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Expand/Collapse Executions */}
              <button
                onClick={() => toggleExpanded(schedule.id)}
                className="text-xs text-primary-button hover:underline mt-3"
              >
                {expandedSchedule === schedule.id ? "Hide" : "Show"} execution history
              </button>
            </div>

            {/* Execution History */}
            {expandedSchedule === schedule.id && (
              <div className="border-t border-theme-border p-4">
                <h5 className="text-sm font-medium text-theme-text-primary mb-3">
                  Recent Executions
                </h5>
                {executions[schedule.id]?.length > 0 ? (
                  <div className="space-y-2">
                    {executions[schedule.id].map((execution) => (
                      <div
                        key={execution.id}
                        className="flex items-center justify-between p-2 bg-theme-bg-secondary rounded"
                      >
                        <div className="flex items-center gap-2">
                          {execution.status === "success" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : execution.status === "failed" ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
                          )}
                          <span className="text-xs text-theme-text-secondary">
                            {formatDistanceToNow(new Date(execution.started_at))} ago
                          </span>
                        </div>
                        {execution.error && (
                          <span className="text-xs text-red-500" title={execution.error}>
                            Error: {execution.error.substring(0, 50)}...
                          </span>
                        )}
                        {execution.tokens_used > 0 && (
                          <span className="text-xs text-theme-text-secondary">
                            {execution.tokens_used} tokens
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-theme-text-secondary">
                    No execution history yet
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <ScheduleModal
          isOpen={showModal}
          onClose={handleModalClose}
          onSave={handleModalSave}
          workspace={workspace}
          schedule={selectedSchedule}
        />
      )}
    </div>
  );
}