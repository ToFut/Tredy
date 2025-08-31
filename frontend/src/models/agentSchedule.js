import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const AgentSchedule = {
  /**
   * Get all schedules for a workspace
   */
  list: async (workspaceSlug) => {
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/agent-schedules`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error || "Failed to fetch schedules");
        return res.schedules;
      })
      .catch((e) => {
        console.error("Failed to fetch schedules:", e);
        return [];
      });
  },

  /**
   * Create a new schedule
   */
  create: async (workspaceSlug, scheduleData) => {
    return await fetch(`${API_BASE}/workspace/${workspaceSlug}/agent-schedules`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify(scheduleData),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error || "Failed to create schedule");
        return res.schedule;
      })
      .catch((e) => {
        console.error("Failed to create schedule:", e);
        throw e;
      });
  },

  /**
   * Update a schedule
   */
  update: async (workspaceSlug, scheduleId, updates) => {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/agent-schedules/${scheduleId}`,
      {
        method: "PUT",
        headers: baseHeaders(),
        body: JSON.stringify(updates),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error || "Failed to update schedule");
        return res.schedule;
      })
      .catch((e) => {
        console.error("Failed to update schedule:", e);
        throw e;
      });
  },

  /**
   * Delete a schedule
   */
  delete: async (workspaceSlug, scheduleId) => {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/agent-schedules/${scheduleId}`,
      {
        method: "DELETE",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error || "Failed to delete schedule");
        return true;
      })
      .catch((e) => {
        console.error("Failed to delete schedule:", e);
        throw e;
      });
  },

  /**
   * Get execution history for a schedule
   */
  getExecutions: async (workspaceSlug, scheduleId, limit = 20) => {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/agent-schedules/${scheduleId}/executions?limit=${limit}`,
      {
        method: "GET",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error || "Failed to fetch executions");
        return res.executions;
      })
      .catch((e) => {
        console.error("Failed to fetch executions:", e);
        return [];
      });
  },

  /**
   * Manually trigger a schedule
   */
  runNow: async (workspaceSlug, scheduleId) => {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/agent-schedules/${scheduleId}/run`,
      {
        method: "POST",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error || "Failed to run schedule");
        return res;
      })
      .catch((e) => {
        console.error("Failed to run schedule:", e);
        throw e;
      });
  },

  /**
   * Get workspace scheduling statistics
   */
  getStats: async (workspaceSlug) => {
    return await fetch(
      `${API_BASE}/workspace/${workspaceSlug}/agent-schedules/stats`,
      {
        method: "GET",
        headers: baseHeaders(),
      }
    )
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error || "Failed to fetch stats");
        return res.stats;
      })
      .catch((e) => {
        console.error("Failed to fetch stats:", e);
        return {
          totalSchedules: 0,
          activeSchedules: 0,
          totalExecutions: 0,
          recentExecutions: [],
        };
      });
  },

  /**
   * Validate a cron expression
   */
  validateCronExpression: (expression) => {
    // Basic validation - can be enhanced with a library
    const cronPattern = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    return cronPattern.test(expression);
  },

  /**
   * Get human-readable description of cron expression
   */
  describeCronExpression: (expression) => {
    const parts = expression.split(" ");
    if (parts.length !== 5) return "Invalid expression";

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Common patterns
    if (expression === "0 * * * *") return "Every hour";
    if (expression === "0 0 * * *") return "Daily at midnight";
    if (expression === "0 9 * * *") return "Daily at 9:00 AM";
    if (expression === "0 9 * * 1-5") return "Weekdays at 9:00 AM";
    if (expression === "*/5 * * * *") return "Every 5 minutes";
    if (expression === "*/15 * * * *") return "Every 15 minutes";
    if (expression === "0 0 * * 0") return "Weekly on Sunday at midnight";
    if (expression === "0 0 1 * *") return "Monthly on the 1st at midnight";

    // Build custom description
    let desc = "";
    
    if (minute === "*") desc += "Every minute";
    else if (minute.includes("*/")) desc += `Every ${minute.split("/")[1]} minutes`;
    else desc += `At minute ${minute}`;

    if (hour !== "*") {
      if (hour.includes("*/")) desc += ` of every ${hour.split("/")[1]} hours`;
      else desc += ` of hour ${hour}`;
    }

    if (dayOfMonth !== "*") desc += ` on day ${dayOfMonth}`;
    if (month !== "*") desc += ` in month ${month}`;
    if (dayOfWeek !== "*") desc += ` on weekday ${dayOfWeek}`;

    return desc;
  },

  /**
   * Common cron presets for UI
   */
  cronPresets: [
    { label: "Every 5 minutes", value: "*/5 * * * *" },
    { label: "Every 15 minutes", value: "*/15 * * * *" },
    { label: "Every 30 minutes", value: "*/30 * * * *" },
    { label: "Every hour", value: "0 * * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Daily at 9:00 AM", value: "0 9 * * *" },
    { label: "Daily at midnight", value: "0 0 * * *" },
    { label: "Weekdays at 9:00 AM", value: "0 9 * * 1-5" },
    { label: "Weekly on Monday", value: "0 9 * * 1" },
    { label: "Monthly on the 1st", value: "0 0 1 * *" },
  ],
};

export default AgentSchedule;