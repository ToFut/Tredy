# AnythingLLM Proactive Agent Scheduler - Complete Guide

## ✅ What's Already Built

AnythingLLM has a **fully functional proactive agent scheduling system** that allows agents to execute automatically without user input.

### Architecture Overview

```
Server Startup → BackgroundService.boot() → Bree Worker Manager
                                                    ↓
                                         agent-scheduler job (persistent worker)
                                                    ↓
                                         Loads active schedules from DB
                                                    ↓
                                         Registers cron jobs for each schedule
                                                    ↓
                                         Executes agents at scheduled times
                                                    ↓
                                         Posts results to workspace chat
                                                    ↓
                                         Broadcasts WebSocket events
```

### Key Components

1. **BackgroundService** (`/server/utils/BackgroundWorkers/index.js`)
   - Starts on server boot (lines 62-64 in `/server/utils/boot/index.js`)
   - Uses Bree worker manager to run background jobs
   - Runs agent-scheduler as persistent worker (not interval-based)

2. **Agent Scheduler Job** (`/server/jobs/agent-scheduler/index.js`)
   - Loads schedules from database on startup
   - Creates cron jobs using `node-cron`
   - Executes agents via `SchedulableAgent`
   - Posts results as chat messages
   - Broadcasts WebSocket events to connected clients

3. **Database Models**
   - `agent_schedules` - Schedule configuration
   - `schedule_executions` - Execution history
   - Models at `/server/models/agentSchedule.js` and `/server/models/scheduleExecution.js`

4. **API Endpoints** (`/server/endpoints/agentSchedule.js`)
   - GET `/api/workspace/:slug/agent-schedules` - List schedules
   - POST `/api/workspace/:slug/agent-schedules` - Create schedule
   - PUT `/api/workspace/:slug/agent-schedules/:id` - Update schedule
   - DELETE `/api/workspace/:slug/agent-schedules/:id` - Delete schedule
   - POST `/api/workspace/:slug/agent-schedules/:id/toggle` - Enable/disable

---

## 🚀 Quick Start

### 1. Verify Scheduler is Running

The scheduler starts automatically when the server boots:

```bash
# Start server (if not running)
cd server
yarn dev:server

# Check logs for:
# [BackgroundWorkerService] Starting...
# [BackgroundWorkerService] Service started with 2 jobs ['cleanup-orphan-documents', 'agent-scheduler']
# [AgentScheduler] Starting...
# [AgentScheduler] Agent Scheduler started with X active schedules
```

### 2. Create Your First Schedule

**Option A: Via API** (recommended)

```bash
curl -X POST http://localhost:3001/api/workspace/my-workspace/agent-schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "agentId": "daily-summary",
    "agentType": "system",
    "name": "Daily Morning Summary",
    "description": "Summarizes overnight activity",
    "cronExpression": "0 9 * * *",
    "timezone": "America/New_York",
    "context": {},
    "enabled": true
  }'
```

**Option B: Via Database** (testing only)

```bash
sqlite3 server/storage/anythingllm.db "INSERT INTO agent_schedules
  (agent_id, agent_type, workspace_id, name, cron_expression, timezone, enabled, created_at, updated_at)
  VALUES
  ('test-agent', 'system', 1, 'Test Schedule', '*/5 * * * *', 'UTC', 1, datetime('now'), datetime('now'));"
```

**Option C: Via Test Script**

```bash
cd server
node test-scheduler-create.js
```

### 3. Monitor Execution

**Check Logs:**
```bash
tail -f server/server.log | grep -i scheduler
```

**Check Database:**
```bash
# View schedules
sqlite3 server/storage/anythingllm.db "SELECT * FROM agent_schedules;"

# View execution history
sqlite3 server/storage/anythingllm.db "SELECT * FROM schedule_executions ORDER BY started_at DESC LIMIT 10;"
```

**Check Workspace Chat:**
- Scheduler posts results to workspace chat with `[SCHEDULED]` prefix
- Messages have `type: "schedule_result"` in JSON response

---

## 📋 Best Practices

### 1. Cron Expression Best Practices

**Use standard cron format:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └────── Month (1-12)
│ │ └───────── Day of month (1-31)
│ └──────────── Hour (0-23)
└─────────────── Minute (0-59)
```

**Common Patterns:**
```javascript
// Every minute (testing only!)
"* * * * *"

// Every 5 minutes
"*/5 * * * *"

// Every hour at minute 0
"0 * * * *"

// Daily at 9 AM
"0 9 * * *"

// Weekdays at 9 AM
"0 9 * * 1-5"

// First day of month at midnight
"0 0 1 * *"

// Every Sunday at 6 PM
"0 18 * * 0"
```

**Validation:**
```javascript
const { AgentSchedule } = require('./models/agentSchedule');

// Validate before creating
const isValid = AgentSchedule.validateCronExpression("0 9 * * *");
if (!isValid) {
  console.error("Invalid cron expression");
}
```

### 2. Timezone Configuration

**Always specify timezone explicitly:**
```javascript
{
  cronExpression: "0 9 * * *",
  timezone: "America/New_York" // Not "EST" or "EDT"
}
```

**Valid timezone examples:**
- `America/New_York`
- `Europe/London`
- `Asia/Tokyo`
- `UTC` (default)

**Never use abbreviations like EST, PST, etc. - they're ambiguous**

### 3. Agent Types

**System Agents** (most common for proactive tasks):
```javascript
{
  agentId: "summary-agent",
  agentType: "system",
  // Will execute with workspace's default agent configuration
}
```

**Imported Agents** (custom plugins):
```javascript
{
  agentId: "plugin-hub-id",
  agentType: "imported",
  // Uses imported plugin from Community Hub
}
```

**Custom Agents** (future):
```javascript
{
  agentId: "custom-agent-id",
  agentType: "custom",
  // User-defined agent configuration
}
```

### 4. Context Configuration

Pass dynamic context to agents:

```javascript
{
  context: JSON.stringify({
    // Execution-specific data
    reportType: "daily",
    includeMetrics: true,

    // Filters
    dateRange: "last_24_hours",

    // Action configuration
    notifyUsers: ["user@example.com"],

    // Custom instructions
    instructions: "Focus on high-priority items"
  })
}
```

### 5. Error Handling

**Scheduler automatically:**
- ✅ Logs all errors to `schedule_executions` table
- ✅ Creates error chat messages in workspace
- ✅ Broadcasts failure events via WebSocket
- ✅ Disables schedules after 5 consecutive failures with <20% success rate

**Manual error checking:**
```javascript
const { ScheduleExecution } = require('./models/scheduleExecution');

// Get execution stats
const stats = await ScheduleExecution.getStats(scheduleId);
console.log(stats);
// {
//   totalExecutions: 100,
//   successfulExecutions: 95,
//   failedExecutions: 5,
//   successRate: 95,
//   averageExecutionTime: 2.5
// }
```

### 6. Rate Limiting & Resource Management

**Built-in protections:**
- Each schedule runs in isolation (no interference)
- Failed schedules don't block other schedules
- Execution timeout: Can be configured per schedule

**Recommendations:**
```javascript
// Avoid overlapping executions
// ❌ BAD: Every minute for long-running task
{
  cronExpression: "* * * * *",  // Every minute
  // If task takes 2 minutes, jobs will queue up
}

// ✅ GOOD: Spacing for long tasks
{
  cronExpression: "*/5 * * * *", // Every 5 minutes
  // Enough time for 2-minute task to complete
}

// For heavy tasks, use longer intervals
{
  cronExpression: "0 */4 * * *", // Every 4 hours
  description: "Heavy document processing"
}
```

### 7. Testing Strategy

**Step 1: Create test schedule with frequent execution**
```javascript
{
  cronExpression: "* * * * *", // Every minute
  name: "Test Schedule - DELETE AFTER TESTING",
  enabled: true
}
```

**Step 2: Monitor for 5-10 minutes**
```bash
# Watch logs
tail -f server/server.log | grep -i "AgentScheduler"

# Watch executions
watch -n 5 "sqlite3 server/storage/anythingllm.db 'SELECT COUNT(*) as count FROM schedule_executions;'"
```

**Step 3: Verify results in workspace chat**

**Step 4: Adjust schedule to production timing**
```javascript
// Update cron expression
await AgentSchedule.update(scheduleId, {
  cronExpression: "0 9 * * *", // Once daily at 9 AM
  enabled: true
});
```

**Step 5: Clean up test data**
```bash
sqlite3 server/storage/anythingllm.db "DELETE FROM schedule_executions WHERE schedule_id = X;"
```

### 8. Workspace Integration

**Scheduler posts results to workspace chat:**

```javascript
// Result appears as chat message
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
  user: null,          // No user - system generated
  threadId: null,      // Main workspace chat
  include: true        // Show in chat history
});
```

**WebSocket broadcasting:**
```javascript
// Clients receive real-time updates
broadcastScheduleEvent(workspace.id, "schedule:completed", {
  scheduleId,
  scheduleName: schedule.name,
  success: true,
  result: resultText,
  duration,
  timestamp: new Date()
});
```

---

## 🔧 Advanced Configuration

### Custom Agent Implementation

To create custom proactive agents, implement `SchedulableAgent` interface:

```javascript
// /server/utils/agents/schedulable/index.js

class SchedulableAgent {
  constructor(agent, agentType) {
    this.agent = agent;
    this.agentType = agentType;
  }

  async executeScheduled(scheduleId) {
    // Your custom logic here
    const schedule = await AgentSchedule.get({ id: scheduleId });
    const context = JSON.parse(schedule.context || '{}');

    // Execute agent tasks
    const result = await this.performTask(context);

    return {
      output: result.message,
      tokensUsed: result.tokensUsed || 0
    };
  }

  async performTask(context) {
    // Implement your proactive task
    // Examples:
    // - Check external APIs
    // - Process documents
    // - Send notifications
    // - Generate reports
    return {
      message: "Task completed successfully",
      tokensUsed: 0
    };
  }
}
```

### Dynamic Schedule Updates

**Update schedule at runtime:**
```javascript
const { getSchedulingEngine } = require('./utils/agents/scheduler/engine');
const engine = getSchedulingEngine();

// Reload all schedules
await engine.reloadSchedules();

// Or update single schedule (more efficient)
await engine.updateSchedule(scheduleId);
```

### Monitoring & Observability

**Track schedule health:**
```javascript
const { AgentSchedule } = require('./models/agentSchedule');

// Get workspace statistics
const stats = await AgentSchedule.getWorkspaceStats(workspaceId);
console.log(stats);
// {
//   totalSchedules: 10,
//   activeSchedules: 8,
//   totalExecutions: 450,
//   recentExecutions: [...]
// }
```

**Monitor missed schedules:**
```javascript
// Check for schedules that should have run but didn't
const dueSchedules = await AgentSchedule.getDueSchedules();
if (dueSchedules.length > 0) {
  console.warn(`Found ${dueSchedules.length} missed schedules`);
}
```

---

## 🐛 Troubleshooting

### Schedule Not Executing

**Check 1: Is scheduler running?**
```bash
ps aux | grep agent-scheduler
# Should see running node process
```

**Check 2: Is schedule enabled?**
```bash
sqlite3 server/storage/anythingllm.db "SELECT id, name, enabled, cron_expression FROM agent_schedules WHERE id=X;"
```

**Check 3: Is cron expression valid?**
```javascript
const cron = require('node-cron');
const isValid = cron.validate('* * * * *');
console.log('Valid:', isValid);
```

**Check 4: Check logs for errors**
```bash
grep -i "error" server/server.log | grep -i "scheduler"
```

### Schedule Disabled Automatically

**Check execution history:**
```bash
sqlite3 server/storage/anythingllm.db "
  SELECT status, error, started_at
  FROM schedule_executions
  WHERE schedule_id = X
  ORDER BY started_at DESC
  LIMIT 10;
"
```

**Schedule disabled if:**
- 5+ consecutive failures
- Success rate < 20%

**Re-enable after fixing:**
```javascript
await AgentSchedule.update(scheduleId, { enabled: true });
await engine.updateSchedule(scheduleId);
```

### No Results in Chat

**Check workspace ID:**
```bash
sqlite3 server/storage/anythingllm.db "
  SELECT s.id, s.name, s.workspace_id, w.name as workspace_name
  FROM agent_schedules s
  JOIN workspaces w ON s.workspace_id = w.id
  WHERE s.id = X;
"
```

**Check execution status:**
```bash
sqlite3 server/storage/anythingllm.db "
  SELECT status, output, error
  FROM schedule_executions
  WHERE schedule_id = X
  ORDER BY started_at DESC
  LIMIT 1;
"
```

**Check workspace chats:**
```bash
sqlite3 server/storage/anythingllm.db "
  SELECT id, prompt, response, createdAt
  FROM workspace_chats
  WHERE workspaceId = X
  AND prompt LIKE '[SCHEDULED]%'
  ORDER BY createdAt DESC
  LIMIT 5;
"
```

---

## 📊 Production Deployment

### Environment Variables

```env
# No special env vars needed - scheduler uses existing config
# Just ensure these are set:
JWT_SECRET=your-jwt-secret
SIG_KEY=your-signature-key
SIG_SALT=your-signature-salt
```

### Database Migrations

Scheduler tables are included in default Prisma schema. Run migrations:

```bash
cd server
yarn prisma:migrate
```

### Performance Considerations

**Single Server:**
- Handles 100+ schedules easily
- Each schedule runs in isolated cron job
- No resource contention

**Multiple Servers:**
- ⚠️ Current implementation: All servers run scheduler
- ⚠️ May cause duplicate executions
- **Solution:** Use leader election or external scheduler (Kubernetes CronJob, AWS EventBridge)

**High-Volume Schedules:**
```javascript
// Instead of many per-minute schedules
// ❌ BAD: 100 schedules at "* * * * *"

// ✅ GOOD: One schedule that processes multiple tasks
{
  cronExpression: "* * * * *",
  agentId: "batch-processor",
  context: {
    taskIds: [1, 2, 3, ...100]
  }
}
```

### Monitoring Setup

**Metrics to track:**
- Total active schedules
- Execution success rate
- Average execution time
- Failed executions count
- Missed schedule count

**Example monitoring query:**
```sql
-- Daily execution summary
SELECT
  DATE(started_at) as date,
  COUNT(*) as total,
  SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed,
  AVG(CAST((julianday(completed_at) - julianday(started_at)) * 86400 AS REAL)) as avg_duration_seconds
FROM schedule_executions
WHERE started_at >= date('now', '-7 days')
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

---

## 🎯 Common Use Cases

### 1. Daily Summary Reports

```javascript
{
  name: "Daily Activity Summary",
  agentId: "summary-agent",
  agentType: "system",
  cronExpression: "0 9 * * *", // 9 AM daily
  timezone: "America/New_York",
  context: {
    reportType: "daily_summary",
    includeSections: ["new_documents", "chat_activity", "agent_usage"],
    emailRecipients: ["team@example.com"]
  }
}
```

### 2. Document Processing

```javascript
{
  name: "Nightly Document Sync",
  agentId: "doc-processor",
  agentType: "imported",
  cronExpression: "0 2 * * *", // 2 AM daily
  context: {
    action: "sync_and_embed",
    sources: ["google-drive", "sharepoint"],
    embedBatchSize: 100
  }
}
```

### 3. Email Monitoring

```javascript
{
  name: "Check Urgent Emails",
  agentId: "email-monitor",
  agentType: "system",
  cronExpression: "*/15 * * * *", // Every 15 minutes
  context: {
    filters: {
      priority: "high",
      unread: true,
      since: "15m"
    },
    actions: ["summarize", "notify"]
  }
}
```

### 4. Calendar Reminders

```javascript
{
  name: "Meeting Prep Reminder",
  agentId: "calendar-agent",
  agentType: "system",
  cronExpression: "0 * * * *", // Every hour
  context: {
    lookAhead: "1h",
    prepareFor: ["meetings", "deadlines"],
    actions: ["fetch_context", "create_summary"]
  }
}
```

### 5. Maintenance Tasks

```javascript
{
  name: "Weekly Cleanup",
  agentId: "maintenance",
  agentType: "system",
  cronExpression: "0 0 * * 0", // Sundays at midnight
  context: {
    tasks: [
      "archive_old_chats",
      "cleanup_temp_files",
      "regenerate_summaries"
    ]
  }
}
```

---

## 🚀 Next Steps: Extending to Event-Based Triggers

The current scheduler is time-based (cron). To add event-based triggers:

### 1. Reuse Scheduler Execution Logic

The scheduler's execution code (`/server/jobs/agent-scheduler/index.js` lines 112-257) can be extracted and reused:

```javascript
// New: /server/utils/proactive/executeProactiveAgent.js

async function executeProactiveAgent(workspaceId, agentConfig, context, triggerId) {
  // Copy execution logic from agent-scheduler/index.js
  // Replace schedule with generic trigger config
  // Keep everything else the same:
  // - Agent execution
  // - Chat message creation
  // - WebSocket broadcasting
  // - Error handling
}
```

### 2. Add Event Hooks

Hook into existing events:

```javascript
// In /server/endpoints/document.js (after upload)
const { triggerProactiveAgents } = require('../utils/proactive');

await triggerProactiveAgents('document.uploaded', {
  workspaceId: workspace.id,
  documentId: doc.id,
  documentName: doc.name
});
```

### 3. Create Trigger Database Schema

Extend scheduler tables:

```sql
CREATE TABLE proactive_triggers (
  id INTEGER PRIMARY KEY,
  workspace_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'schedule', 'event', 'condition'
  event_type TEXT,            -- 'document.uploaded', 'email.received'
  condition_config JSON,      -- For threshold/pattern triggers
  agent_config JSON,          -- Same as schedule agent config
  enabled BOOLEAN DEFAULT true,
  ...
);
```

This leverages all existing scheduler infrastructure while adding event-based capabilities.

---

## 📚 Reference

### Database Schema

```sql
-- Schedule configuration
CREATE TABLE agent_schedules (
  id INTEGER PRIMARY KEY,
  agent_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  workspace_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cron_expression TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  enabled BOOLEAN DEFAULT true,
  context TEXT,
  last_run_at DATETIME,
  next_run_at DATETIME,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Execution history
CREATE TABLE schedule_executions (
  id INTEGER PRIMARY KEY,
  schedule_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  output TEXT,
  error TEXT,
  tokens_used INTEGER DEFAULT 0
);
```

### Key Files

- `/server/utils/BackgroundWorkers/index.js` - Background job manager
- `/server/jobs/agent-scheduler/index.js` - Scheduler implementation
- `/server/models/agentSchedule.js` - Schedule model
- `/server/models/scheduleExecution.js` - Execution model
- `/server/endpoints/agentSchedule.js` - API endpoints
- `/server/utils/scheduleEvents.js` - WebSocket broadcasting
- `/server/utils/agents/schedulable/index.js` - Agent interface

---

**🎉 The scheduler is production-ready and fully functional! Start creating schedules today.**
