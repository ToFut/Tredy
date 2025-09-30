# Workflow Scheduling in AnythingLLM - Complete Guide

## ✅ YES! Workflows CAN Be Scheduled!

**AnythingLLM has FULL support for scheduling workflows!** This is already built into the system.

---

## **What's Already Built**

### **1. Workflow Scheduling Infrastructure** ✅

The `SchedulableAgent` class (`/server/utils/agents/schedulable/index.js`) supports **three agent types**:

```javascript
// Lines 112-133 in schedulable/index.js
} else if (this.agentType === "flow") {
  // For flows - use FlowExecutor
  const { FlowExecutor } = require("../../agentFlows/executor");
  const { Workspace } = require("../../../models/workspace");

  const workspace = await Workspace.get({ id: schedule.workspace_id });
  if (!workspace) {
    throw new Error(`Workspace not found: ${schedule.workspace_id}`);
  }

  const executor = new FlowExecutor(this.agent.flowData, {
    workspaceSlug: workspace.slug,
    userId: schedule.created_by,
  });

  result = await executor.execute({
    ...context,
    isScheduled: true,
    scheduleId,
    executedAt: new Date(),
  });
}
```

### **2. Supported Agent Types for Scheduling**

| Agent Type | Description | Scheduling Support |
|------------|-------------|-------------------|
| **`system`** | Built-in system agents | ✅ Fully supported |
| **`imported`** | Community Hub plugins | ✅ Fully supported |
| **`flow`** | Custom workflows/flows | ✅ Fully supported |

---

## **How Workflow Scheduling Works**

### **Architecture**

```
Cron Scheduler
      ↓
Schedule trigger fires
      ↓
SchedulableAgent.fromId(flowId, "flow")
      ↓
Load flow JSON from storage/plugins/agent-flows/
      ↓
FlowExecutor.execute(context)
      ↓
Execute workflow steps sequentially
      ↓
Post results to workspace chat
      ↓
Broadcast WebSocket event
```

### **Workflow Storage**

Workflows are stored as JSON files:
```
server/storage/plugins/agent-flows/
  ├── {flow-uuid-1}.json
  ├── {flow-uuid-2}.json
  └── {flow-uuid-3}.json
```

**Flow JSON Structure:**
```json
{
  "uuid": "abc123-def456",
  "name": "Daily Report Workflow",
  "description": "Generates daily summary report",
  "active": true,
  "steps": [
    {
      "type": "api-call",
      "config": {
        "url": "https://api.example.com/data",
        "method": "GET"
      }
    },
    {
      "type": "llm-instruction",
      "config": {
        "prompt": "Summarize this data: {{step1.response}}"
      }
    },
    {
      "type": "tool-call",
      "config": {
        "tool": "send-email",
        "params": {
          "to": "team@example.com",
          "body": "{{step2.output}}"
        }
      }
    }
  ]
}
```

---

## **Creating a Scheduled Workflow**

### **Method 1: Via API** (Recommended)

```bash
# Step 1: Create or get your workflow UUID
# Workflows are created via the workflow builder UI or API
FLOW_UUID="abc123-def456-789ghi"

# Step 2: Create schedule for the workflow
curl -X POST http://localhost:3001/api/workspace/my-workspace/agent-schedules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "agentId": "'"$FLOW_UUID"'",
    "agentType": "flow",
    "name": "Daily Report Workflow",
    "description": "Runs daily report generation workflow",
    "cronExpression": "0 9 * * *",
    "timezone": "America/New_York",
    "context": {
      "reportDate": "{{today}}",
      "includeMetrics": true
    },
    "enabled": true
  }'
```

### **Method 2: Via Database** (Testing)

```bash
# Get workspace ID
WORKSPACE_ID=1

# Get flow UUID (from workflow files)
FLOW_UUID="abc123-def456"

# Create schedule
sqlite3 server/storage/anythingllm.db "INSERT INTO agent_schedules
  (agent_id, agent_type, workspace_id, name, description, cron_expression, timezone, enabled, context, created_at, updated_at)
  VALUES
  ('$FLOW_UUID', 'flow', $WORKSPACE_ID, 'Daily Workflow', 'Scheduled workflow execution', '0 9 * * *', 'UTC', 1, '{}', datetime('now'), datetime('now'));"
```

### **Method 3: Programmatically**

```javascript
const SchedulableAgent = require('./utils/agents/schedulable');

async function scheduleWorkflow() {
  // Load workflow
  const flowId = "abc123-def456";
  const schedulableFlow = await SchedulableAgent.fromId(flowId, "flow");

  // Create schedule
  const schedule = await schedulableFlow.schedule({
    name: "Daily Report",
    description: "Generates daily summary",
    cronExpression: "0 9 * * *",
    workspaceId: 1,
    timezone: "America/New_York",
    context: {
      reportType: "daily",
      includeCharts: true
    },
    enabled: true
  });

  console.log("Schedule created:", schedule.id);
}
```

---

## **Available Workflow Types**

From `/server/utils/agentFlows/flowTypes.js`:

### **1. API Call Steps**
```json
{
  "type": "api-call",
  "config": {
    "url": "https://api.example.com/endpoint",
    "method": "GET|POST|PUT|DELETE",
    "headers": {
      "Authorization": "Bearer {{token}}"
    },
    "body": {
      "data": "{{previousStep.output}}"
    }
  }
}
```

**Use Cases:**
- Fetch external data
- Trigger webhooks
- Update external systems
- Pull metrics from APIs

### **2. LLM Instruction Steps**
```json
{
  "type": "llm-instruction",
  "config": {
    "prompt": "Analyze this data and provide insights: {{step1.data}}",
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

**Use Cases:**
- Text summarization
- Data analysis
- Report generation
- Content creation

### **3. Web Scraping Steps**
```json
{
  "type": "web-scraping",
  "config": {
    "url": "https://example.com/page",
    "selector": ".content",
    "extract": ["text", "links", "images"]
  }
}
```

**Use Cases:**
- Monitor websites for changes
- Extract competitor data
- Collect news articles
- Scrape pricing information

### **4. Tool Call Steps**
```json
{
  "type": "tool-call",
  "config": {
    "tool": "send-email",
    "params": {
      "to": "user@example.com",
      "subject": "Daily Report",
      "body": "{{llmSummary.output}}"
    }
  }
}
```

**Use Cases:**
- Send notifications
- Update databases
- Create calendar events
- Post to Slack

---

## **Workflow Scheduling Examples**

### **Example 1: Daily Competitor Monitoring**

```json
{
  "uuid": "competitor-monitor-123",
  "name": "Daily Competitor Monitor",
  "description": "Scrapes competitor websites and summarizes changes",
  "steps": [
    {
      "id": "scrape1",
      "type": "web-scraping",
      "config": {
        "url": "https://competitor1.com/pricing",
        "selector": ".pricing-table"
      }
    },
    {
      "id": "scrape2",
      "type": "web-scraping",
      "config": {
        "url": "https://competitor2.com/features",
        "selector": ".features-list"
      }
    },
    {
      "id": "analyze",
      "type": "llm-instruction",
      "config": {
        "prompt": "Compare these competitor offerings and highlight any changes from yesterday:\n\nCompetitor 1: {{scrape1.content}}\n\nCompetitor 2: {{scrape2.content}}"
      }
    },
    {
      "id": "notify",
      "type": "tool-call",
      "config": {
        "tool": "send-slack-message",
        "params": {
          "channel": "#competitive-intel",
          "message": "{{analyze.output}}"
        }
      }
    }
  ]
}
```

**Schedule:** Daily at 6 AM
```bash
{
  "cronExpression": "0 6 * * *",
  "timezone": "America/New_York"
}
```

---

### **Example 2: Weekly Report Generation**

```json
{
  "uuid": "weekly-report-456",
  "name": "Weekly Team Report",
  "description": "Generates weekly summary from various data sources",
  "steps": [
    {
      "id": "fetchMetrics",
      "type": "api-call",
      "config": {
        "url": "https://analytics.example.com/api/weekly-stats",
        "method": "GET",
        "headers": {
          "Authorization": "Bearer {{env.ANALYTICS_TOKEN}}"
        }
      }
    },
    {
      "id": "fetchTickets",
      "type": "api-call",
      "config": {
        "url": "https://jira.example.com/api/tickets/closed-this-week",
        "method": "GET"
      }
    },
    {
      "id": "generateReport",
      "type": "llm-instruction",
      "config": {
        "prompt": "Create a comprehensive weekly team report:\n\nMetrics: {{fetchMetrics.response}}\n\nCompleted Tickets: {{fetchTickets.response}}\n\nFormat as an executive summary with key highlights and trends."
      }
    },
    {
      "id": "sendEmail",
      "type": "tool-call",
      "config": {
        "tool": "send-email",
        "params": {
          "to": ["team@example.com", "executives@example.com"],
          "subject": "Weekly Team Report - Week of {{today}}",
          "body": "{{generateReport.output}}"
        }
      }
    }
  ]
}
```

**Schedule:** Every Monday at 9 AM
```bash
{
  "cronExpression": "0 9 * * 1",
  "timezone": "UTC"
}
```

---

### **Example 3: Hourly System Health Check**

```json
{
  "uuid": "health-check-789",
  "name": "System Health Monitor",
  "description": "Checks system health and alerts on issues",
  "steps": [
    {
      "id": "checkAPI",
      "type": "api-call",
      "config": {
        "url": "https://api.example.com/health",
        "method": "GET",
        "timeout": 5000
      }
    },
    {
      "id": "checkDatabase",
      "type": "api-call",
      "config": {
        "url": "https://api.example.com/db/ping",
        "method": "GET"
      }
    },
    {
      "id": "evaluateHealth",
      "type": "llm-instruction",
      "config": {
        "prompt": "Analyze these health check results and determine if any alerts are needed:\n\nAPI Status: {{checkAPI.status}}\nAPI Response Time: {{checkAPI.responseTime}}ms\n\nDatabase Status: {{checkDatabase.status}}\n\nReturn 'ALERT' if there are issues, 'OK' if everything is healthy."
      }
    },
    {
      "id": "sendAlert",
      "type": "tool-call",
      "config": {
        "tool": "send-pagerduty-alert",
        "params": {
          "severity": "high",
          "message": "{{evaluateHealth.output}}"
        },
        "condition": "{{evaluateHealth.output.includes('ALERT')}}"
      }
    }
  ]
}
```

**Schedule:** Every hour
```bash
{
  "cronExpression": "0 * * * *",
  "timezone": "UTC"
}
```

---

## **Best Practices for Scheduled Workflows**

### **1. Variable Passing Between Steps**

Workflows can pass data between steps using variable interpolation:

```json
{
  "steps": [
    {
      "id": "step1",
      "type": "api-call",
      "config": {
        "url": "https://api.example.com/data"
      }
    },
    {
      "id": "step2",
      "type": "llm-instruction",
      "config": {
        "prompt": "Analyze: {{step1.response.data}}"
      }
    }
  ]
}
```

**Available variables:**
- `{{stepId.output}}` - Full output of previous step
- `{{stepId.response}}` - API response data
- `{{stepId.content}}` - Scraped content
- `{{today}}` - Current date
- `{{env.VAR_NAME}}` - Environment variables

### **2. Error Handling**

Add error handling to workflows:

```json
{
  "steps": [
    {
      "id": "mainTask",
      "type": "api-call",
      "config": {
        "url": "https://api.example.com/data",
        "retry": 3,
        "retryDelay": 1000
      }
    },
    {
      "id": "onError",
      "type": "tool-call",
      "config": {
        "tool": "send-alert",
        "params": {
          "message": "Workflow failed: {{mainTask.error}}"
        }
      },
      "condition": "{{mainTask.error}}"
    }
  ]
}
```

### **3. Conditional Execution**

Execute steps conditionally:

```json
{
  "steps": [
    {
      "id": "checkData",
      "type": "api-call",
      "config": {
        "url": "https://api.example.com/check"
      }
    },
    {
      "id": "processIfNeeded",
      "type": "llm-instruction",
      "config": {
        "prompt": "Process this: {{checkData.response}}"
      },
      "condition": "{{checkData.response.hasNewData}}"
    }
  ]
}
```

### **4. Timeout Configuration**

Set appropriate timeouts:

```json
{
  "config": {
    "globalTimeout": 300000,  // 5 minutes total
    "stepTimeout": 60000      // 1 minute per step
  },
  "steps": [...]
}
```

### **5. Resource Management**

**For long-running workflows:**
```javascript
// Avoid scheduling too frequently
{
  cronExpression: "0 */6 * * *",  // Every 6 hours, not every hour
  description: "Heavy data processing workflow"
}
```

**For lightweight workflows:**
```javascript
// Can run more frequently
{
  cronExpression: "*/15 * * * *",  // Every 15 minutes
  description: "Quick health check"
}
```

---

## **Managing Scheduled Workflows**

### **List Scheduled Workflows**

```bash
# Get all schedules for a workspace
curl http://localhost:3001/api/workspace/my-workspace/agent-schedules \
  -H "Authorization: Bearer TOKEN"

# Filter by agent type
sqlite3 server/storage/anythingllm.db "
  SELECT id, name, agent_id, cron_expression, enabled
  FROM agent_schedules
  WHERE agent_type = 'flow'
  AND workspace_id = 1;
"
```

### **Update Workflow Schedule**

```bash
# Update cron expression
curl -X PUT http://localhost:3001/api/workspace/my-workspace/agent-schedules/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "cronExpression": "0 10 * * *",
    "enabled": true
  }'
```

### **View Execution History**

```bash
# Get execution history for a schedule
sqlite3 server/storage/anythingllm.db "
  SELECT
    se.id,
    se.status,
    se.started_at,
    se.completed_at,
    se.output,
    se.error
  FROM schedule_executions se
  JOIN agent_schedules s ON se.schedule_id = s.id
  WHERE s.agent_type = 'flow'
  AND s.id = 1
  ORDER BY se.started_at DESC
  LIMIT 10;
"
```

### **Pause/Resume Workflow**

```bash
# Pause
curl -X POST http://localhost:3001/api/workspace/my-workspace/agent-schedules/1/toggle \
  -H "Authorization: Bearer TOKEN"

# Or via database
sqlite3 server/storage/anythingllm.db "UPDATE agent_schedules SET enabled = 0 WHERE id = 1;"
```

---

## **Testing Workflow Schedules**

### **Step 1: Create Test Workflow**

```bash
# Create simple test workflow
cat > server/storage/plugins/agent-flows/test-workflow.json << 'EOF'
{
  "uuid": "test-workflow-123",
  "name": "Test Scheduled Workflow",
  "description": "Simple test workflow",
  "active": true,
  "steps": [
    {
      "id": "getMessage",
      "type": "llm-instruction",
      "config": {
        "prompt": "Say hello and provide the current timestamp: {{executedAt}}"
      }
    }
  ]
}
EOF
```

### **Step 2: Schedule It (Every Minute for Testing)**

```bash
sqlite3 server/storage/anythingllm.db "INSERT INTO agent_schedules
  (agent_id, agent_type, workspace_id, name, cron_expression, timezone, enabled, created_at, updated_at)
  VALUES
  ('test-workflow-123', 'flow', 1, 'Test Workflow Schedule', '* * * * *', 'UTC', 1, datetime('now'), datetime('now'));"
```

### **Step 3: Monitor Execution**

```bash
# Watch logs
tail -f server/server.log | grep -i "workflow\|schedule"

# Watch database
watch -n 5 "sqlite3 server/storage/anythingllm.db 'SELECT COUNT(*) as executions FROM schedule_executions WHERE schedule_id = (SELECT id FROM agent_schedules WHERE agent_id = \"test-workflow-123\");'"
```

### **Step 4: Verify Results in Workspace Chat**

Check workspace chat for messages with `[SCHEDULED]` prefix containing workflow output.

### **Step 5: Clean Up**

```bash
# Delete test schedule
sqlite3 server/storage/anythingllm.db "DELETE FROM agent_schedules WHERE agent_id = 'test-workflow-123';"

# Delete test workflow
rm server/storage/plugins/agent-flows/test-workflow.json
```

---

## **Troubleshooting**

### **Workflow Not Executing**

**Check 1: Workflow file exists**
```bash
ls -la server/storage/plugins/agent-flows/{your-flow-uuid}.json
```

**Check 2: Schedule is enabled**
```bash
sqlite3 server/storage/anythingllm.db "SELECT id, name, enabled, agent_id FROM agent_schedules WHERE agent_type = 'flow';"
```

**Check 3: FlowExecutor is working**
```javascript
const { FlowExecutor } = require('./server/utils/agentFlows/executor');
const fs = require('fs');

const flowData = JSON.parse(fs.readFileSync('server/storage/plugins/agent-flows/test.json'));
const executor = new FlowExecutor(flowData, { workspaceSlug: 'test-workspace' });
const result = await executor.execute({});
console.log(result);
```

### **Workflow Errors in Logs**

```bash
# Check for workflow execution errors
grep -i "flowexecutor\|workflow.*error" server/server.log

# Check execution failures in database
sqlite3 server/storage/anythingllm.db "
  SELECT se.id, s.name, se.error, se.started_at
  FROM schedule_executions se
  JOIN agent_schedules s ON se.schedule_id = s.id
  WHERE s.agent_type = 'flow'
  AND se.status = 'failed'
  ORDER BY se.started_at DESC
  LIMIT 10;
"
```

---

## **Summary**

### ✅ **What Works**

- ✅ **Workflows can be scheduled** using cron expressions
- ✅ **All workflow types supported** (API calls, LLM, web scraping, tool calls)
- ✅ **Execution tracking** in database
- ✅ **Results posted to chat** automatically
- ✅ **WebSocket broadcasting** of completion events
- ✅ **Full variable passing** between workflow steps
- ✅ **Error handling** and retry logic

### 📋 **Agent Types Comparison**

| Feature | System Agents | Imported Plugins | **Workflows** |
|---------|--------------|------------------|---------------|
| Scheduling | ✅ | ✅ | ✅ |
| Cron expressions | ✅ | ✅ | ✅ |
| Context passing | ✅ | ✅ | ✅ |
| Multi-step execution | ❌ | Limited | ✅ **Best** |
| API integration | Limited | Via plugin | ✅ Native |
| No-code | ❌ | ❌ | ✅ |

### 🎯 **Recommended Use Cases**

**Use Workflows for:**
- Multi-step automation tasks
- Data pipeline orchestration
- Report generation workflows
- External system integration
- Complex conditional logic

**Use System Agents for:**
- Simple single-task automation
- Chat-based interactions
- Quick scheduled messages

**Use Imported Plugins for:**
- Specialized functionality
- Custom integrations
- Community-contributed tools

---

**🚀 Workflows + Scheduling = Powerful Proactive Automation!**

The combination of workflows (multi-step automation) and scheduling (time-based execution) gives you everything needed for production-grade proactive automation in AnythingLLM.
