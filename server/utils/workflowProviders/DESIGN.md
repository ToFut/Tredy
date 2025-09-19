# Workflow System Design - Inspired by Claude's Task Management

## Current State Analysis

### Original AnythingLLM Implementation

- **AgentFlows**: Storage and execution of pre-built flows
- **FlowExecutor**: Sequential step execution without state persistence
- **Agent Builder UI**: Visual flow creation interface

### Custom Additions (Untracked)

- Multiple overlapping workflow plugins (flow-orchestrator, auto-workflow, task-planner, etc.)
- No consistent pattern or architecture
- Limited context preservation between steps

## Proposed Architecture: Task-Aware Workflow System

Inspired by how Claude naturally manages multi-step tasks using TodoWrite, maintaining context and smoothly transitioning between steps.

## Core Concepts

### 1. WorkflowSession (Like Claude's Todo Management)

```javascript
class WorkflowSession {
  constructor(sessionId, workspace, agent) {
    this.sessionId = sessionId;
    this.workspace = workspace;
    this.agent = agent;

    // Task list with statuses (like Claude's todos)
    this.tasks = [];

    // Persistent context across all tasks
    this.context = {
      variables: {},
      completedSteps: [],
      currentStep: null,
      conversationHistory: [],
    };

    // State machine
    this.state = "idle"; // idle, planning, executing, waiting_for_user
  }

  // Parse request into tasks (like Claude creating todos)
  async planTasks(userRequest) {
    this.state = "planning";
    const tasks = await this.parseIntoTasks(userRequest);

    this.tasks = tasks.map((task) => ({
      content: task.description,
      activeForm: task.activeDescription, // "Sending email" vs "Send email"
      status: "pending",
      dependencies: task.dependencies || [],
      result: null,
    }));

    return this.tasks;
  }

  // Execute tasks with state awareness
  async executeTasks() {
    this.state = "executing";

    for (const task of this.tasks) {
      // Check dependencies
      if (!this.canExecuteTask(task)) continue;

      // Update status (like Claude marking in_progress)
      task.status = "in_progress";
      await this.notifyProgress(task);

      try {
        // Execute with full context
        const result = await this.executeTask(task);

        // Update task and context
        task.status = "completed";
        task.result = result;
        this.updateContext(task, result);

        // Notify completion
        await this.notifyCompletion(task);
      } catch (error) {
        task.status = "failed";
        task.error = error;

        // Decide: retry, skip, or halt
        await this.handleTaskFailure(task);
      }
    }
  }
}
```

### 2. Provider Pattern (Like LLM/Vector Providers)

```javascript
// Base provider
class BaseWorkflowProvider {
  constructor(workspace, agent) {
    this.workspace = workspace;
    this.agent = agent;
    this.sessions = new Map(); // Active workflow sessions
  }

  // Get or create session for conversation
  getSession(conversationId) {
    if (!this.sessions.has(conversationId)) {
      this.sessions.set(
        conversationId,
        new WorkflowSession(conversationId, this.workspace, this.agent)
      );
    }
    return this.sessions.get(conversationId);
  }

  // Core capabilities
  async parseRequest(request) {
    /* Parse into structured tasks */
  }
  async executeWorkflow(tasks, context) {
    /* Execute with state management */
  }
  async handleInterruption(session, newRequest) {
    /* Handle mid-flow changes */
  }
}

// Intelligent provider with advanced capabilities
class IntelligentWorkflowProvider extends BaseWorkflowProvider {
  async parseRequest(request) {
    // Smart parsing like Claude understanding "send to X then Y"
    const indicators = {
      sequence: ["then", "after", "next", "followed by"],
      parallel: ["and", "also", "simultaneously"],
      conditional: ["if", "when", "unless"],
    };

    // Parse into task graph with dependencies
    return this.buildTaskGraph(request, indicators);
  }

  async optimizeTasks(tasks) {
    // Identify tasks that can run in parallel
    const parallelGroups = this.identifyParallelGroups(tasks);
    return this.scheduleOptimalExecution(parallelGroups);
  }
}
```

### 3. Integration with Agent System

```javascript
// In agent handler
class EnhancedAgentHandler {
  constructor(workspace) {
    this.workspace = workspace;
    this.workflowProvider = selectWorkflowProvider(workspace);
  }

  async handleMessage(message, conversationId) {
    // Get or create workflow session
    const session = this.workflowProvider.getSession(conversationId);

    // Check if this is a multi-step request
    if (this.isMultiStepRequest(message)) {
      // Plan tasks
      await session.planTasks(message);

      // Show plan to user (like Claude showing todos)
      await this.showTaskPlan(session.tasks);

      // Execute tasks
      await session.executeTasks();
    } else {
      // Handle single-step normally
      await this.handleSingleStep(message);
    }
  }
}
```

### 4. Plugin Integration

```javascript
// Single, unified workflow plugin
const unifiedWorkflow = {
  name: "unified-workflow",
  plugin: function () {
    return {
      name: "unified-workflow",
      setup(aibitat) {
        const provider = aibitat.workspace.workflowProvider;
        const session = provider.getSession(aibitat.conversationId);

        aibitat.function({
          name: "execute_workflow",
          description: "Execute any multi-step task maintaining context",
          parameters: {
            type: "object",
            properties: {
              request: {
                type: "string",
                description: "The complete request",
              },
              mode: {
                type: "string",
                enum: ["auto", "interactive", "background"],
                description: "Execution mode",
              },
            },
          },
          handler: async ({ request, mode = "auto" }) => {
            // Use the workflow provider
            await session.planTasks(request);

            if (mode === "interactive") {
              return session.tasks; // Let user approve
            }

            // Execute
            await session.executeTasks();
            return session.getExecutionSummary();
          },
        });

        // Add task management functions
        aibitat.function({
          name: "get_workflow_status",
          description: "Get current workflow status and tasks",
          handler: () => session.getStatus(),
        });

        aibitat.function({
          name: "modify_task",
          description: "Modify a task in the current workflow",
          handler: ({ taskId, modifications }) =>
            session.modifyTask(taskId, modifications),
        });
      },
    };
  },
};
```

## Key Benefits

1. **Natural Flow**: Mirrors how Claude handles tasks with TodoWrite
2. **Context Preservation**: Maintains state across entire conversation
3. **Modular Architecture**: Follows AnythingLLM's provider pattern
4. **Single Source of Truth**: One unified workflow system instead of many plugins
5. **Intelligent Execution**: Handles dependencies, parallel execution, failures
6. **User Visibility**: Shows task progress like Claude's todo updates
7. **Extensible**: Easy to add new providers for different workflow strategies

## Migration Path

1. **Phase 1**: Implement WorkflowSession and BaseWorkflowProvider
2. **Phase 2**: Create IntelligentWorkflowProvider with smart parsing
3. **Phase 3**: Integrate with existing AgentFlows for backward compatibility
4. **Phase 4**: Migrate existing workflow plugins to use new system
5. **Phase 5**: Deprecate old plugins, maintain single unified plugin

## Example Usage

```javascript
// User: "Check my calendar for tomorrow, find conflicts, then email the team about any issues"

// System creates tasks:
[
  { content: "Check calendar for tomorrow", status: "pending" },
  {
    content: "Identify scheduling conflicts",
    status: "pending",
    dependencies: [0],
  },
  {
    content: "Email team about conflicts",
    status: "pending",
    dependencies: [1],
  },
];

// Executes maintaining context:
// 1. ✅ Fetches calendar → stores events in context
// 2. ✅ Analyzes conflicts using calendar data → stores conflicts
// 3. ✅ Emails team with specific conflict details from context
```

This design ensures smooth, context-aware execution exactly like how Claude naturally manages multi-step tasks.
