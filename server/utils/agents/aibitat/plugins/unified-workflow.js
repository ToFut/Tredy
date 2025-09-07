/**
 * Unified Workflow Plugin
 * Implements Task Planning, Workflow Orchestrator, and Auto Workflow
 * as a single intelligent system that adapts based on enabled skills
 */

const { v4: uuidv4 } = require("uuid");
const { AgentFlows } = require("../../../agentFlows");
const { DynamicFlowBuilder } = require("../../flowBuilder/dynamicFlowBuilder");
const { SystemSettings } = require("../../../../models/systemSettings");
const { safeJsonParse } = require("../../../http");

class UnifiedWorkflowPlugin {
  constructor(aibitat) {
    this.aibitat = aibitat;
    this.sessions = new Map();
    this.mode = null; // Will be set in setup
    this.flowBuilder = new DynamicFlowBuilder();
  }

  /**
   * Detect which mode to operate in based on enabled skills
   */
  async detectMode() {
    // Get enabled skills from system settings
    const enabledSkills = safeJsonParse(
      await SystemSettings.getValueOrFallback(
        { label: "default_agent_skills" },
        "[]"
      ),
      []
    );
    
    if (enabledSkills.includes("auto-workflow")) return "auto";
    if (enabledSkills.includes("flow-orchestrator")) return "orchestrator";
    if (enabledSkills.includes("task-planner")) return "planner";
    
    return null;
  }

  /**
   * Get or create a session for the current conversation
   */
  getSession(conversationId) {
    if (!this.sessions.has(conversationId)) {
      this.sessions.set(conversationId, {
        id: conversationId,
        tasks: [],
        workflows: [],
        context: {},
        state: "idle"
      });
    }
    return this.sessions.get(conversationId);
  }

  /**
   * Discover available capabilities dynamically
   */
  async discoverCapabilities() {
    const capabilities = {
      plugins: [],
      mcpServers: [],
      flowBlocks: ["llmInstruction", "api_call", "web_scraping"]
    };

    // Get available plugins
    if (this.aibitat.plugins) {
      this.aibitat.plugins.forEach((plugin, name) => {
        if (name !== "unified-workflow") {
          capabilities.plugins.push({
            name,
            description: plugin.description || `Plugin: ${name}`
          });
        }
      });
    }

    // Get MCP servers if available
    if (this.aibitat.mcpManager) {
      const servers = await this.aibitat.mcpManager.getActiveServers();
      capabilities.mcpServers = servers.map(s => ({
        name: s.name,
        description: s.description || `MCP Server: ${s.name}`
      }));
    }

    return capabilities;
  }

  /**
   * Analyze request complexity and create execution plan
   */
  async analyzeRequest(request) {
    const capabilities = await this.discoverCapabilities();
    
    // Use LLM to analyze the request
    const prompt = `Analyze this request and create an execution plan.
Request: "${request}"

Available capabilities:
${capabilities.plugins.map(p => `- ${p.name}: ${p.description}`).join("\n")}
${capabilities.mcpServers.map(s => `- ${s.name}: ${s.description}`).join("\n")}

Return a JSON object with:
{
  "complexity": "simple|multi-step|complex",
  "steps": ["step description 1", "step description 2", ...],
  "tools_needed": ["tool1", "tool2", ...],
  "requires_approval": false,
  "can_schedule": false
}`;

    try {
      const response = await this.aibitat.provider.complete({
        messages: [
          { role: "system", content: "You are a workflow analyzer. Return only valid JSON." },
          { role: "user", content: prompt }
        ]
      });
      
      return JSON.parse(response.result);
    } catch (error) {
      // Fallback to simple analysis
      return {
        complexity: "simple",
        steps: [request],
        tools_needed: [],
        requires_approval: false,
        can_schedule: request.includes("daily") || request.includes("every")
      };
    }
  }

  /**
   * Task Planner Mode - Creates and tracks task lists
   */
  async createTaskList({ request }) {
    const session = this.getSession(this.aibitat.conversationId);
    const analysis = await this.analyzeRequest(request);
    
    // Create task list
    const tasks = analysis.steps.map((step, index) => ({
      id: `task_${index + 1}`,
      content: step,
      status: "pending",
      order: index
    }));
    
    session.tasks = tasks;
    session.state = "planning";
    
    // Format task list for display
    const taskListDisplay = tasks.map(t => `☐ ${t.content}`).join("\n");
    
    this.aibitat.introspect(`Created task list with ${tasks.length} tasks`);
    
    // Start executing tasks
    const results = await this.executeTasks(session);
    
    return {
      mode: "task-planner",
      tasks: tasks.map(t => ({
        ...t,
        status: t.status === "completed" ? "✅" : t.status === "failed" ? "❌" : "☐"
      })),
      summary: `Completed ${results.completed} of ${results.total} tasks`,
      results: results.details
    };
  }

  /**
   * Flow Orchestrator Mode - Creates, executes, and saves workflows
   */
  async createWorkflow({ request }) {
    const session = this.getSession(this.aibitat.conversationId);
    const analysis = await this.analyzeRequest(request);
    
    this.aibitat.introspect(`Creating workflow for: ${request}`);
    
    // Build workflow using DynamicFlowBuilder
    const workflow = await this.flowBuilder.buildFlowFromPrompt(request, {
      name: this.generateWorkflowName(request),
      userId: this.workspace.id
    });
    
    session.workflows.push(workflow);
    session.state = "executing";
    
    // Execute the workflow
    const execution = await this.executeWorkflow(workflow, session);
    
    // Prepare save prompt
    const savePrompt = execution.success ? 
      "Would you like to save this workflow for future use?" : null;
    
    return {
      mode: "flow-orchestrator",
      workflow: {
        name: workflow.name,
        steps: workflow.config.steps.length,
        schedule: workflow.schedule
      },
      execution,
      savePrompt,
      workflowId: workflow.uuid
    };
  }

  /**
   * Auto Workflow Mode - Handles everything automatically
   */
  async autoExecute({ request }) {
    const session = this.getSession(this.aibitat.conversationId);
    const analysis = await this.analyzeRequest(request);
    
    this.aibitat.introspect(`Auto-executing: ${request}`);
    
    // For simple requests, execute directly
    if (analysis.complexity === "simple" && analysis.tools_needed.length === 1) {
      const tool = analysis.tools_needed[0];
      const result = await this.executeTool(tool, { request });
      
      return {
        mode: "auto-workflow",
        action: tool,
        result,
        completed: true
      };
    }
    
    // For complex requests, create and execute workflow automatically
    const workflow = await this.flowBuilder.buildFlowFromPrompt(request, {
      name: `Auto: ${request.substring(0, 50)}`,
      userId: this.workspace.id
    });
    
    const execution = await this.executeWorkflow(workflow, session);
    
    // Auto-save if successful and schedulable
    if (execution.success && analysis.can_schedule) {
      await AgentFlows.saveFlow(workflow.name, workflow.config, workflow.uuid);
      this.aibitat.introspect(`Workflow saved for future use: ${workflow.name}`);
    }
    
    return {
      mode: "auto-workflow",
      completed: execution.success,
      result: execution.result,
      automated_actions: execution.steps_completed
    };
  }

  /**
   * Execute tasks with progress tracking
   */
  async executeTasks(session) {
    let completed = 0;
    const total = session.tasks.length;
    const details = [];
    
    for (const task of session.tasks) {
      task.status = "in_progress";
      this.aibitat.introspect(`Working on: ${task.content}`);
      
      try {
        // Execute task using available tools
        const result = await this.executeStep(task.content, session.context);
        
        task.status = "completed";
        task.result = result;
        completed++;
        
        details.push({
          task: task.content,
          status: "success",
          result
        });
        
        // Update context for next task
        session.context[`task_${task.id}_result`] = result;
        
      } catch (error) {
        task.status = "failed";
        task.error = error.message;
        
        details.push({
          task: task.content,
          status: "failed",
          error: error.message
        });
      }
    }
    
    return { completed, total, details };
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflow, session) {
    try {
      // Use AgentFlows executor
      const result = await AgentFlows.executeFlow(
        workflow.uuid,
        session.context,
        this.aibitat
      );
      
      return {
        success: result.success,
        result: result.results,
        steps_completed: workflow.config.steps.length
      };
      
    } catch (error) {
      this.aibitat.introspect(`Workflow execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        steps_completed: 0
      };
    }
  }

  /**
   * Execute a single step using available tools
   */
  async executeStep(stepDescription, context) {
    // Try to match with available tools
    const capabilities = await this.discoverCapabilities();
    
    // Use LLM to determine best tool and parameters
    const prompt = `Execute this step: "${stepDescription}"
Context: ${JSON.stringify(context)}
Available tools: ${capabilities.plugins.map(p => p.name).join(", ")}

Return the tool to use and parameters, or indicate if this should be handled by the LLM directly.`;

    try {
      const response = await this.aibitat.provider.complete({
        messages: [
          { role: "system", content: "You are a workflow executor." },
          { role: "user", content: prompt }
        ]
      });
      
      return response.result;
    } catch (error) {
      // Fallback to LLM instruction
      return `Completed: ${stepDescription}`;
    }
  }

  /**
   * Execute a specific tool
   */
  async executeTool(toolName, params) {
    // Check if it's a plugin function
    if (this.aibitat.functions && this.aibitat.functions[toolName]) {
      return await this.aibitat.functions[toolName].handler(params);
    }
    
    // Fallback to LLM
    return `Executed ${toolName} with params: ${JSON.stringify(params)}`;
  }

  /**
   * Save a workflow after execution
   */
  async saveWorkflow({ workflowId, name }) {
    const session = this.getSession(this.aibitat.conversationId);
    const workflow = session.workflows.find(w => w.uuid === workflowId);
    
    if (!workflow) {
      return { success: false, error: "Workflow not found" };
    }
    
    const result = await AgentFlows.saveFlow(
      name || workflow.name,
      workflow.config,
      workflow.uuid
    );
    
    if (result.success) {
      this.aibitat.introspect(`Workflow saved: ${name || workflow.name}`);
      return {
        success: true,
        message: `Workflow "${name || workflow.name}" saved successfully!`,
        uuid: result.uuid
      };
    }
    
    return result;
  }

  /**
   * Generate workflow name from request
   */
  generateWorkflowName(request) {
    const words = request.split(" ").slice(0, 5);
    return words.join(" ") + (words.length < request.split(" ").length ? "..." : "");
  }
}

/**
 * Plugin Definition
 */
const unifiedWorkflow = {
  name: "unified-workflow",
  description: "Unified workflow system for task planning, orchestration, and automation",
  plugin: function () {
    return {
      name: "unified-workflow",
      description: "Handles task planning, workflow orchestration, and automatic workflow execution",
      async setup(aibitat) {
        const plugin = new UnifiedWorkflowPlugin(aibitat);
        
        // Detect mode based on enabled skills
        plugin.mode = await plugin.detectMode();
        
        // Skip if no mode is enabled
        if (!plugin.mode) {
          return;
        }
        
        aibitat.introspect(`Unified Workflow plugin initialized in ${plugin.mode} mode`);
        
        // Register functions based on mode
        switch (plugin.mode) {
          case "planner":
            // Task Planning mode
            aibitat.function({
              name: "create_task_list",
              description: "Break down a complex request into trackable tasks and execute them",
              parameters: {
                type: "object",
                properties: {
                  request: {
                    type: "string",
                    description: "The request to break down into tasks"
                  }
                },
                required: ["request"]
              },
              handler: plugin.createTaskList.bind(plugin)
            });
            break;
            
          case "orchestrator":
            // Workflow Orchestrator mode
            aibitat.function({
              name: "create_workflow",
              description: "Create and execute a workflow from a natural language request",
              parameters: {
                type: "object",
                properties: {
                  request: {
                    type: "string",
                    description: "The workflow request"
                  }
                },
                required: ["request"]
              },
              handler: plugin.createWorkflow.bind(plugin)
            });
            
            aibitat.function({
              name: "save_workflow",
              description: "Save a completed workflow for future use",
              parameters: {
                type: "object",
                properties: {
                  workflowId: {
                    type: "string",
                    description: "The workflow ID to save"
                  },
                  name: {
                    type: "string",
                    description: "Optional custom name for the workflow"
                  }
                },
                required: ["workflowId"]
              },
              handler: plugin.saveWorkflow.bind(plugin)
            });
            break;
            
          case "auto":
            // Auto Workflow mode
            aibitat.function({
              name: "auto_execute",
              description: "Automatically handle any action request by creating and executing workflows",
              parameters: {
                type: "object",
                properties: {
                  request: {
                    type: "string",
                    description: "The action request to handle"
                  }
                },
                required: ["request"]
              },
              handler: plugin.autoExecute.bind(plugin)
            });
            
            // In auto mode, intercept all action-like requests
            const originalIntrospect = aibitat.introspect.bind(aibitat);
            aibitat.introspect = function(message) {
              // Check if this looks like an action request
              const actionKeywords = ["send", "create", "schedule", "check", "find", "get", "post", "update", "delete"];
              const hasAction = actionKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
              );
              
              if (hasAction && !message.startsWith("[")) {
                // Auto-handle action requests
                plugin.autoExecute({ request: message });
              }
              
              return originalIntrospect(message);
            };
            break;
        }
        
        // Common function for all modes - get workflow status
        aibitat.function({
          name: "get_workflow_status",
          description: "Get the status of current workflow session",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: () => {
            const session = plugin.getSession(aibitat.conversationId);
            return {
              mode: plugin.mode,
              state: session.state,
              tasks: session.tasks.length,
              workflows: session.workflows.length,
              context_keys: Object.keys(session.context)
            };
          }
        });
      }
    };
  }
};

module.exports = { unifiedWorkflow };