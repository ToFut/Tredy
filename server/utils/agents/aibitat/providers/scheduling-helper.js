/**
 * Scheduling System Prompt Enhancement
 * Helps agents understand when to use scheduling vs other tools
 */

const SCHEDULING_CONTEXT = `
## IMPORTANT: Task Scheduling Guidelines

When users ask about recurring tasks, automated checks, or periodic activities, you should use the internal scheduling system (schedule_task tool) INSTEAD of calendar tools.

### When to use schedule_task (internal scheduling):
- Any recurring or periodic task (hourly, daily, weekly)
- Automated monitoring or checking (news, emails, websites, data)
- Background agent work that runs without user interaction
- Tasks with patterns like "every", "check regularly", "monitor", "track"
- Examples:
  • "Check news every hour" → Use schedule_task
  • "Send me daily reports" → Use schedule_task
  • "Monitor website every 30 minutes" → Use schedule_task
  • "Weekly summary on Fridays" → Use schedule_task

### When to use calendar tools:
- One-time events or meetings
- Appointments with specific people
- Events that need calendar invites
- Examples:
  • "Schedule a meeting tomorrow at 3pm" → Use calendar
  • "Add dentist appointment next Tuesday" → Use calendar

### Priority Order for Scheduling:
1. First choice: schedule_task for automation
2. Second choice: quick_schedule for common patterns
3. Last resort: calendar for one-time events

Remember: Scheduled tasks run automatically in the background and post results directly to this chat. Users can see active tasks in the Background Tasks bubble (clock icon).
`;

/**
 * Inject scheduling context into system prompts
 */
function enhanceSystemPromptWithScheduling(originalPrompt) {
  return originalPrompt + "\n\n" + SCHEDULING_CONTEXT;
}

/**
 * Check if a user request is about scheduling
 */
function isSchedulingRequest(userMessage) {
  const schedulingKeywords = [
    "every hour",
    "every day",
    "every week",
    "every month",
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "recurring",
    "periodic",
    "regularly",
    "schedule",
    "automate",
    "monitor",
    "check regularly",
    "track",
    "remind me",
    "every \\d+ (hour|minute|day|week)",
    "at \\d+am",
    "at \\d+pm",
  ];

  const lower = userMessage.toLowerCase();
  return schedulingKeywords.some((keyword) => {
    if (keyword.includes("\\d")) {
      return new RegExp(keyword).test(lower);
    }
    return lower.includes(keyword);
  });
}

/**
 * Convert user scheduling request to structured format
 */
function parseSchedulingRequest(userMessage) {
  const request = {
    isScheduling: isSchedulingRequest(userMessage),
    suggestedTool: null,
    pattern: null,
    task: null,
  };

  if (!request.isScheduling) return request;

  // Extract pattern
  const patterns = {
    "every hour": "hourly",
    hourly: "hourly",
    "every day": "daily",
    daily: "daily",
    "every week": "weekly",
    weekly: "weekly",
    "every 30 minutes": "every_30_min",
    "every 15 minutes": "every_15_min",
  };

  for (const [key, value] of Object.entries(patterns)) {
    if (userMessage.toLowerCase().includes(key)) {
      request.pattern = value;
      request.suggestedTool = "schedule_task";
      break;
    }
  }

  // Extract task (what comes after "check", "monitor", "track", etc.)
  const taskMatch = userMessage.match(
    /(?:check|monitor|track|analyze|summarize|report on|fetch|get)\s+(.+?)(?:\s+every|\s+hourly|\s+daily|$)/i
  );
  if (taskMatch) {
    request.task = taskMatch[1];
  }

  return request;
}

module.exports = {
  SCHEDULING_CONTEXT,
  enhanceSystemPromptWithScheduling,
  isSchedulingRequest,
  parseSchedulingRequest,
};
