import React, { useState, useEffect } from "react";
import AgentSchedule from "@/models/agentSchedule";

export default function CronBuilder({ value, onChange, disabled = false }) {
  const [mode, setMode] = useState("preset");
  const [customExpression, setCustomExpression] = useState(
    value || "0 * * * *"
  );
  const [isValid, setIsValid] = useState(true);
  const [description, setDescription] = useState("");

  useEffect(() => {
    // Check if current value matches a preset
    const preset = AgentSchedule.cronPresets.find((p) => p.value === value);
    if (preset) {
      setMode("preset");
    } else {
      setMode("custom");
      setCustomExpression(value);
    }
    updateDescription(value);
  }, [value]);

  const updateDescription = (expression) => {
    if (expression) {
      setDescription(AgentSchedule.describeCronExpression(expression));
      setIsValid(AgentSchedule.validateCronExpression(expression));
    }
  };

  const handlePresetChange = (presetValue) => {
    onChange(presetValue);
    updateDescription(presetValue);
  };

  const handleCustomChange = (expression) => {
    setCustomExpression(expression);
    const valid = AgentSchedule.validateCronExpression(expression);
    setIsValid(valid);

    if (valid) {
      onChange(expression);
      updateDescription(expression);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("preset")}
          disabled={disabled}
          className={`px-3 py-1 rounded transition-colors ${
            mode === "preset"
              ? "bg-primary-button text-white"
              : "bg-theme-bg-primary text-theme-text-secondary hover:text-theme-text-primary"
          }`}
        >
          Presets
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          disabled={disabled}
          className={`px-3 py-1 rounded transition-colors ${
            mode === "custom"
              ? "bg-primary-button text-white"
              : "bg-theme-bg-primary text-theme-text-secondary hover:text-theme-text-primary"
          }`}
        >
          Custom
        </button>
      </div>

      {mode === "preset" ? (
        <div className="space-y-2">
          <label className="text-sm text-theme-text-secondary">
            Select a schedule preset
          </label>
          <select
            value={value}
            onChange={(e) => handlePresetChange(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 bg-theme-bg-primary border border-theme-border rounded-lg focus:outline-none focus:border-primary-button"
          >
            {AgentSchedule.cronPresets.map((preset) => (
              <option key={preset.value} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm text-theme-text-secondary">
            Cron Expression
          </label>
          <input
            type="text"
            value={customExpression}
            onChange={(e) => handleCustomChange(e.target.value)}
            disabled={disabled}
            placeholder="* * * * *"
            className={`w-full px-3 py-2 bg-theme-bg-primary border rounded-lg focus:outline-none ${
              isValid
                ? "border-theme-border focus:border-primary-button"
                : "border-red-500"
            }`}
          />
          {!isValid && (
            <p className="text-xs text-red-500">
              Invalid cron expression. Format: minute hour day month weekday
            </p>
          )}
          <p className="text-xs text-theme-text-secondary">
            Format: minute (0-59) hour (0-23) day (1-31) month (1-12) weekday
            (0-6)
          </p>
        </div>
      )}

      {description && isValid && (
        <div className="p-3 bg-theme-bg-secondary rounded-lg">
          <p className="text-sm text-theme-text-primary">
            <span className="font-medium">Schedule:</span> {description}
          </p>
        </div>
      )}

      <div className="text-xs text-theme-text-secondary space-y-1">
        <p className="font-medium">Quick Reference:</p>
        <ul className="space-y-0.5">
          <li>• Use * for any value</li>
          <li>• Use */n for every n units (e.g., */5 for every 5)</li>
          <li>• Use n-m for ranges (e.g., 1-5 for Monday-Friday)</li>
          <li>• Use n,m for specific values (e.g., 0,30 for :00 and :30)</li>
        </ul>
      </div>
    </div>
  );
}
