import React, { useState, useEffect } from "react";
import { X, Clock, Info } from "@phosphor-icons/react";
import CronBuilder from "./CronBuilder";
import AgentSchedule from "@/models/agentSchedule";

export default function ScheduleModal({
  isOpen,
  onClose,
  onSave,
  workspace,
  agent,
  schedule = null, // For editing existing schedules
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    cronExpression: "0 * * * *",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    enabled: true,
    context: {},
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (schedule) {
      // Editing existing schedule
      setFormData({
        name: schedule.name || "",
        description: schedule.description || "",
        cronExpression: schedule.cron_expression || "0 * * * *",
        timezone: schedule.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled: schedule.enabled ?? true,
        context: typeof schedule.context === "string" 
          ? JSON.parse(schedule.context) 
          : schedule.context || {},
      });
    } else if (agent) {
      // Creating new schedule
      setFormData((prev) => ({
        ...prev,
        name: `${agent.name} Schedule`,
        context: {
          agentId: agent.id || agent.hubId,
          agentName: agent.name,
        },
      }));
    }
  }, [schedule, agent]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!AgentSchedule.validateCronExpression(formData.cronExpression)) {
      newErrors.cronExpression = "Invalid cron expression";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setSaving(true);
    try {
      const scheduleData = {
        ...formData,
        agentId: agent?.id || agent?.hubId || schedule?.agent_id,
        agentType: agent?.type || schedule?.agent_type || "imported",
      };

      if (schedule) {
        // Update existing schedule
        await AgentSchedule.update(workspace.slug, schedule.id, scheduleData);
      } else {
        // Create new schedule
        await AgentSchedule.create(workspace.slug, scheduleData);
      }

      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save schedule:", error);
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleContextChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      context: {
        ...prev.context,
        [key]: value,
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-theme-bg-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-theme-bg-secondary border-b border-theme-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-button" />
            <h2 className="text-lg font-semibold text-theme-text-primary">
              {schedule ? "Edit Schedule" : "Create Agent Schedule"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-theme-bg-primary transition-colors"
          >
            <X className="w-5 h-5 text-theme-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-theme-text-primary">
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm text-theme-text-secondary mb-1">
                Schedule Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 bg-theme-bg-primary border rounded-lg focus:outline-none ${
                  errors.name
                    ? "border-red-500"
                    : "border-theme-border focus:border-primary-button"
                }`}
                placeholder="Daily Report Generation"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm text-theme-text-secondary mb-1">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-lg focus:outline-none focus:border-primary-button"
                rows="2"
                placeholder="Describe what this schedule does..."
              />
            </div>
          </div>

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-theme-text-primary">
              Schedule Configuration
            </h3>
            
            <CronBuilder
              value={formData.cronExpression}
              onChange={(expr) => setFormData({ ...formData, cronExpression: expr })}
              disabled={saving}
            />
            {errors.cronExpression && (
              <p className="text-xs text-red-500">{errors.cronExpression}</p>
            )}

            <div>
              <label className="block text-sm text-theme-text-secondary mb-1">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-lg focus:outline-none focus:border-primary-button"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Australia/Sydney">Sydney</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 text-primary-button rounded focus:ring-primary-button"
              />
              <label htmlFor="enabled" className="text-sm text-theme-text-primary">
                Enable this schedule immediately
              </label>
            </div>
          </div>

          {/* Agent Context */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-theme-text-primary">
              Agent Context (Optional)
            </h3>
            
            <div className="p-3 bg-theme-bg-primary rounded-lg flex items-start gap-2">
              <Info className="w-4 h-4 text-theme-text-secondary mt-0.5" />
              <p className="text-xs text-theme-text-secondary">
                Add any parameters or context the agent should use when executing.
                This could include URLs to scrape, prompts to use, or any other data.
              </p>
            </div>

            <div>
              <label className="block text-sm text-theme-text-secondary mb-1">
                Prompt (Optional)
              </label>
              <textarea
                value={formData.context.prompt || ""}
                onChange={(e) => handleContextChange("prompt", e.target.value)}
                className="w-full px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-lg focus:outline-none focus:border-primary-button"
                rows="3"
                placeholder="Enter a prompt for the agent to execute..."
              />
            </div>

            {/* Additional context fields based on agent type */}
            {agent?.type === "web-scraper" && (
              <div>
                <label className="block text-sm text-theme-text-secondary mb-1">
                  URL to Scrape
                </label>
                <input
                  type="url"
                  value={formData.context.url || ""}
                  onChange={(e) => handleContextChange("url", e.target.value)}
                  className="w-full px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-lg focus:outline-none focus:border-primary-button"
                  placeholder="https://example.com"
                />
              </div>
            )}
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-500/10 border border-red-500 rounded-lg">
              <p className="text-sm text-red-500">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-button text-white rounded hover:bg-primary-button-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : schedule ? "Update Schedule" : "Create Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}