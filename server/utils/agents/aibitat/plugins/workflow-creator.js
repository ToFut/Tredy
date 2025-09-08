/**
 * Workflow Creator Plugin
 * Leverages existing DynamicFlowBuilder and AgentFlows infrastructure
 * Provides chat-based workflow creation with visual preview
 */

const { v4: uuidv4 } = require("uuid");
const { Deduplicator } = require("../utils/dedupe");

// Simple function to check if plugin loads
console.log("🔧 [WorkflowCreator] Plugin file loaded successfully");
const { AgentFlows } = require("../../../agentFlows");
const { FLOW_TYPES } = require("../../../agentFlows/flowTypes");

class WorkflowCreatorSession {
  constructor(conversationId) {
    this.conversationId = conversationId;
    this.draftWorkflows = new Map(); // workflowId -> workflow data
    // Use existing AgentFlows infrastructure for workflow management
  }

  /**
   * Parse natural language description into workflow steps
   * Inspired by claude-task-master's AI-driven task decomposition
   */
  parseDescriptionToWorkflowSteps(description) {
    console.log("🔧 [WorkflowCreator] Parsing description:", description);
    
    const steps = [];
    const lowerDesc = description.toLowerCase();
    
    // Module: Parse sequential steps with "then" keyword
    if (lowerDesc.includes('then')) {
      const parts = description.split(/\s+then\s+/i);
      parts.forEach((part, index) => {
        steps.push(this.parseGenericStep(part.trim(), index));
      });
    } 
    // Module: Parse comma-separated steps
    else if (lowerDesc.includes(',')) {
      const parts = description.split(',');
      parts.forEach((part, index) => {
        steps.push(this.parseGenericStep(part.trim(), index));
      });
    }
    // Single step workflow
    else {
      steps.push(this.parseGenericStep(description, 0));
    }
    
    console.log("🔧 [WorkflowCreator] Parsed", steps.length, "workflow steps");
    return steps;
  }

  parseGenericStep(stepText, index) {
    const lower = stepText.toLowerCase();
    
    // Determine step type based on keywords
    let stepType = FLOW_TYPES.LLM_INSTRUCTION.type;
    let config = {};
    
    // Email detection (if contains @ symbol)
    if (stepText.includes('@')) {
      const emailMatch = stepText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        stepType = FLOW_TYPES.API_CALL.type;
        config = {
          url: "MCP://gmail:send_email",
          method: "POST", 
          body: JSON.stringify({
            to: emailMatch[0],
            subject: `Workflow Step ${index + 1}`,
            message: stepText
          }),
          responseVariable: `step${index + 1}Response`
        };
      }
    }
    // API/Integration keywords
    else if (lower.includes('fetch') || lower.includes('api') || lower.includes('get') || lower.includes('post')) {
      stepType = FLOW_TYPES.API_CALL.type;
      config = {
        url: "CONFIGURE_URL",
        method: lower.includes('post') ? "POST" : "GET",
        responseVariable: `apiResponse${index + 1}`
      };
    }
    // Data processing keywords
    else if (lower.includes('analyze') || lower.includes('process') || lower.includes('transform')) {
      stepType = FLOW_TYPES.LLM_INSTRUCTION.type;
      config = {
        instruction: stepText,
        resultVariable: `processedData${index + 1}`
      };
    }
    // Report/Summary generation
    else if (lower.includes('report') || lower.includes('summary') || lower.includes('generate')) {
      stepType = FLOW_TYPES.LLM_INSTRUCTION.type;
      config = {
        instruction: stepText,
        resultVariable: `generatedContent${index + 1}`
      };
    }
    // Database operations
    else if (lower.includes('save') || lower.includes('store') || lower.includes('database')) {
      stepType = FLOW_TYPES.API_CALL.type;
      config = {
        url: "DATABASE://operation",
        method: "POST",
        body: JSON.stringify({ action: stepText }),
        responseVariable: `dbResult${index + 1}`
      };
    }
    // Default: Generic LLM instruction
    else {
      stepType = FLOW_TYPES.LLM_INSTRUCTION.type;
      config = {
        instruction: stepText,
        resultVariable: `result${index + 1}`
      };
    }
    
    return {
      type: stepType,
      config: {
        ...config,
        directOutput: false
      }
    };
  }

  createDraftWorkflow(description, name = null) {
    const workflowId = uuidv4();
    const draft = {
      id: workflowId,
      name: name || this.generateWorkflowName(description),
      description,
      created: new Date(),
      status: 'draft'
    };
    
    this.draftWorkflows.set(workflowId, draft);
    return draft;
  }

  generateWorkflowName(description) {
    const words = description.split(" ").slice(0, 4);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }

  formatWorkflowPreview(workflow, steps) {
    const boxWidth = Math.max(50, workflow.name.length + 20);
    const innerWidth = boxWidth - 2;
    
    const preview = [
      "┌" + "─".repeat(boxWidth) + "┐",
      `│ 📋 ${workflow.name}${" ".repeat(Math.max(0, innerWidth - workflow.name.length - 3))}│`,
      "├" + "─".repeat(boxWidth) + "┤"
    ];

    steps.forEach((step, index) => {
      if (step.type === 'start') return; // Skip start block
      
      const stepNum = String(index).padStart(1, '0');
      const emoji = this.getStepEmoji(step.type);
      const title = this.getStepTitle(step);
      const detail = this.getStepDetail(step);
      
      const stepLine = ` ${stepNum}️⃣ ${emoji} ${title}`;
      preview.push(`│${stepLine}${" ".repeat(Math.max(0, innerWidth - stepLine.length))}│`);
      
      if (detail) {
        const detailLine = `    └─> ${detail}`;
        preview.push(`│${detailLine}${" ".repeat(Math.max(0, innerWidth - detailLine.length))}│`);
      }
    });

    preview.push("├" + "─".repeat(boxWidth) + "┤");
    const statusLine = ` 📅 Status: Draft`;
    preview.push(`│${statusLine}${" ".repeat(Math.max(0, innerWidth - statusLine.length))}│`);
    preview.push("└" + "─".repeat(boxWidth) + "┘");
    
    return preview.join("\n");
  }

  getStepEmoji(type) {
    const emojis = {
      'llmInstruction': '🧠',
      'api_call': '🔌',
      'web_scraping': '🌐',
      'condition': '❓',
      'loop': '🔄',
      'email': '📧',
      'calendar': '📅'
    };
    return emojis[type] || '⚙️';
  }

  getStepTitle(step) {
    if (step.type === 'llmInstruction') {
      const instruction = step.config.instruction || '';
      return instruction.length > 25 ? instruction.substring(0, 22) + '...' : instruction;
    }
    return step.type.charAt(0).toUpperCase() + step.type.slice(1);
  }

  getStepDetail(step) {
    if (step.config.resultVariable) {
      return `Store as: ${step.config.resultVariable}`;
    }
    return null;
  }
}

const workflowCreator = {
  name: "workflow-creator",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "workflow-creator",
      setup(aibitat) {
        console.log("🔧 [WorkflowCreator] Setting up workflow creator plugin");
        const sessions = new Map(); // conversationId -> WorkflowCreatorSession
        
        // Module 1: Better workflow detection patterns
        const WORKFLOW_TRIGGERS = [
          /^create\s+workflow/i,  // Must start with "create workflow"
          /^build\s+workflow/i,
          /^make\s+workflow/i,
          /^workflow:/i,
          /^setup\s+workflow/i,
          /^define\s+workflow/i
        ];
        
        // No interception needed - just make the function more explicit
        
        function getSession(conversationId) {
          if (!sessions.has(conversationId)) {
            sessions.set(conversationId, new WorkflowCreatorSession(conversationId));
          }
          return sessions.get(conversationId);
        }

        // Main workflow creation function
        console.log("🔧 [WorkflowCreator] Registering create_workflow function");
        console.log("🔧 [WorkflowCreator] Plugin setup complete, about to register function");
        aibitat.function({
          name: "create_workflow", 
          description: "MANDATORY: Use this function when user says 'create workflow' or describes sequential actions with 'then'. This function creates a visual workflow preview. DO NOT use gmail or other functions - use THIS function for workflow creation requests.",
          examples: [
            {
              prompt: "create workflow send to segev@sinosciences.com news list and then to segev@futurixs.com all mail summary from yesterday",
              call: JSON.stringify({ description: "send to segev@sinosciences.com news list and then to segev@futurixs.com all mail summary from yesterday" })
            },
            {
              prompt: "create workflow send email then invite",
              call: JSON.stringify({ description: "send email then invite" })
            },
            {
              prompt: "create workflow send email to user@example.com then create report",
              call: JSON.stringify({ description: "send email to user@example.com then create report" })
            },
            {
              prompt: "send something then send something else",
              call: JSON.stringify({ description: "send something then send something else" })
            },
            {
              prompt: "first send email then create meeting",
              call: JSON.stringify({ description: "first send email then create meeting" })
            },
            {
              prompt: "workflow to automate tasks",
              call: JSON.stringify({ description: "automate tasks" })
            }
          ],
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Natural language description of what the workflow should do"
              },
              name: {
                type: "string",
                description: "Optional name for the workflow"
              }
            },
            required: ["description"]
          },
          handler: async ({ description, name }) => {
            try {
              console.log("🔧 [WorkflowCreator] Handler called with:", { description, name });
              const session = getSession(aibitat.conversationId);
              aibitat.introspect(`Creating workflow from: "${description}"`);
              
              // Create draft workflow
              const draft = session.createDraftWorkflow(description, name);
              
              // Parse description into workflow steps using AI-driven approach
              const parsedSteps = session.parseDescriptionToWorkflowSteps(description);
              
              // Add start block
              const steps = [
                {
                  type: "start",
                  config: { variables: [] }
                },
                ...parsedSteps
              ];
              
              // Store parsed workflow
              draft.steps = steps;
              
              // Create visual preview
              const preview = session.formatWorkflowPreview(draft, steps);
              
              // Create structured workflow data
              const workflowData = {
                type: "workflowPreview",
                workflowId: draft.id,
                preview,
                workflow: {
                  name: draft.name,
                  description: draft.description,
                  stepsCount: steps.length - 1, // Exclude start block
                  steps: steps.map((step, index) => ({
                    index,
                    type: step.type,
                    title: session.getStepTitle(step),
                    detail: session.getStepDetail(step)
                  }))
                },
                actions: [
                  `To save: "@agent save workflow ${draft.id} as [name]"`,
                  `To edit step: "@agent edit workflow step [number] to [description]"`,
                  `To test: "@agent test workflow ${draft.id}"`,
                  `To cancel: "@agent cancel workflow ${draft.id}"`
                ]
              };
              
              // Send workflow preview via WebSocket 
              if (aibitat.sendWorkflowPreview) {
                aibitat.sendWorkflowPreview(workflowData);
              }
              
              aibitat.introspect("📋 Workflow preview generated! Review and save when ready.");
              
              // Return the visual preview directly as the message
              const fullMessage = `📋 **Workflow Created: "${draft.name}"**\n\n${preview}\n\n**Available Commands:**\n${workflowData.actions.join('\n')}\n\n---\n*Workflow ID: ${draft.id}*`;
              
              return fullMessage;
              
            } catch (error) {
              aibitat.introspect(`Error creating workflow: ${error.message}`);
              return `❌ Failed to create workflow: ${error.message}`;
            }
          }
        });
        console.log("🔧 [WorkflowCreator] create_workflow function registered successfully");

        // Test function to verify plugin is working
        aibitat.function({
          name: "test_workflow_plugin",
          description: "Simple test function to verify the workflow plugin is working. Use this when user says 'test' or 'test workflow'.",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "string",
                description: "Test message"
              }
            },
            required: ["message"]
          },
          handler: async ({ message }) => {
            console.log("🔧 [WorkflowCreator] TEST FUNCTION CALLED:", message);
            return {
              success: true,
              message: "✅ Workflow plugin is working! Test successful: " + message
            };
          }
        });

        // Save workflow function
        aibitat.function({
          name: "save_workflow",
          description: "Save a draft workflow to permanent storage",
          parameters: {
            type: "object",
            properties: {
              workflowId: {
                type: "string",
                description: "ID of the draft workflow to save"
              },
              name: {
                type: "string",
                description: "Name for the saved workflow"
              }
            },
            required: ["workflowId"]
          },
          handler: async ({ workflowId, name }) => {
            try {
              const session = getSession(aibitat.conversationId);
              const draft = session.draftWorkflows.get(workflowId);
              
              if (!draft) {
                return { success: false, error: "Workflow draft not found" };
              }
              
              // Create final workflow config
              const workflowConfig = {
                name: name || draft.name,
                description: `Chat-created workflow: ${draft.description}`,
                active: true,
                created_via: "chat",
                created_at: new Date().toISOString(),
                steps: draft.steps
              };
              
              // Save using existing AgentFlows infrastructure
              const uuid = uuidv4();
              const result = await AgentFlows.saveFlow(workflowConfig.name, workflowConfig, uuid);
              
              if (result.success) {
                aibitat.introspect(`Workflow "${workflowConfig.name}" saved successfully!`);
                
                // Clean up draft
                session.draftWorkflows.delete(workflowId);
                
                return {
                  success: true,
                  message: `✅ Workflow "${workflowConfig.name}" saved successfully!`,
                  uuid,
                  usage: `Run it with: "@agent run ${workflowConfig.name}"`,
                  stepsCount: draft.steps.length - 1
                };
              } else {
                return {
                  success: false,
                  error: result.error || "Failed to save workflow"
                };
              }
            } catch (error) {
              aibitat.introspect(`Error saving workflow: ${error.message}`);
              return {
                success: false,
                error: error.message
              };
            }
          }
        });

        // Edit workflow step function
        aibitat.function({
          name: "edit_workflow_step",
          description: "Edit a specific step in a draft workflow",
          parameters: {
            type: "object",
            properties: {
              workflowId: {
                type: "string",
                description: "ID of the draft workflow"
              },
              stepNumber: {
                type: "number",
                description: "Step number to edit (1-based)"
              },
              newDescription: {
                type: "string",
                description: "New description for the step"
              }
            },
            required: ["workflowId", "stepNumber", "newDescription"]
          },
          handler: async ({ workflowId, stepNumber, newDescription }) => {
            try {
              const session = getSession(aibitat.conversationId);
              const draft = session.draftWorkflows.get(workflowId);
              
              if (!draft) {
                return { success: false, error: "Workflow draft not found" };
              }
              
              const stepIndex = stepNumber; // stepNumber is 1-based, but we include start block at 0
              if (stepIndex >= draft.steps.length || stepIndex < 1) {
                return { success: false, error: "Invalid step number" };
              }
              
              // Update the step
              draft.steps[stepIndex] = {
                type: "llmInstruction",
                config: {
                  instruction: newDescription,
                  resultVariable: `step${stepNumber}Result`
                }
              };
              
              aibitat.introspect(`Updated step ${stepNumber}: ${newDescription}`);
              
              // Return updated preview
              const preview = session.formatWorkflowPreview(draft, draft.steps);
              
              return {
                type: "workflowPreview",
                workflowId: draft.id,
                preview,
                message: `Step ${stepNumber} updated successfully!`,
                workflow: {
                  name: draft.name,
                  description: draft.description,
                  stepsCount: draft.steps.length - 1
                }
              };
              
            } catch (error) {
              return {
                success: false,
                error: error.message
              };
            }
          }
        });

        // Test workflow function
        aibitat.function({
          name: "test_workflow",
          description: "Test run a draft workflow without saving it",
          parameters: {
            type: "object",
            properties: {
              workflowId: {
                type: "string",
                description: "ID of the draft workflow to test"
              }
            },
            required: ["workflowId"]
          },
          handler: async ({ workflowId }) => {
            try {
              const session = getSession(aibitat.conversationId);
              const draft = session.draftWorkflows.get(workflowId);
              
              if (!draft) {
                return { success: false, error: "Workflow draft not found" };
              }
              
              aibitat.introspect(`Test running workflow: ${draft.name}`);
              
              // Execute the draft workflow directly using FlowExecutor
              const { FlowExecutor } = require("../../../agentFlows/executor");
              const flowExecutor = new FlowExecutor();
              
              // Create temporary workflow config for testing
              const testFlow = {
                name: `TEST: ${draft.name}`,
                uuid: workflowId,
                config: {
                  name: draft.name,
                  description: draft.description,
                  steps: draft.steps
                }
              };
              
              // Execute the draft workflow directly
              const result = await flowExecutor.executeFlow(testFlow, {}, aibitat);
              
              return {
                success: result.success,
                message: result.success ? "✅ Test run completed successfully!" : "❌ Test run failed",
                results: result.results,
                testRun: true
              };
              
            } catch (error) {
              return {
                success: false,
                error: `Test run failed: ${error.message}`
              };
            }
          }
        });

        // Cancel workflow function
        aibitat.function({
          name: "cancel_workflow_creation",
          description: "Cancel workflow creation and delete draft",
          parameters: {
            type: "object",
            properties: {
              workflowId: {
                type: "string",
                description: "ID of the draft workflow to cancel"
              }
            },
            required: ["workflowId"]
          },
          handler: async ({ workflowId }) => {
            const session = getSession(aibitat.conversationId);
            const draft = session.draftWorkflows.get(workflowId);
            
            if (!draft) {
              return { success: false, error: "Workflow draft not found" };
            }
            
            session.draftWorkflows.delete(workflowId);
            aibitat.introspect(`Cancelled workflow creation: ${draft.name}`);
            
            return {
              success: true,
              message: `❌ Workflow creation cancelled: ${draft.name}`
            };
          }
        });

        // Run workflow by name function
        aibitat.function({
          name: "run_workflow",
          description: "Run a saved workflow by name. Use this when user says 'run [workflow name]' or 'execute [workflow name]'",
          parameters: {
            type: "object",
            properties: {
              workflowName: {
                type: "string",
                description: "Name of the workflow to run"
              }
            },
            required: ["workflowName"]
          },
          handler: async ({ workflowName }) => {
            try {
              const flows = AgentFlows.listFlows();
              const flow = flows.find(f => f.name.toLowerCase() === workflowName.toLowerCase());
              
              if (!flow) {
                const availableFlows = flows.map(f => f.name).join(', ');
                return `❌ Workflow "${workflowName}" not found. Available workflows: ${availableFlows}`;
              }
              
              aibitat.introspect(`Running workflow: ${flow.name}`);
              
              // Execute the workflow
              const result = await AgentFlows.executeFlow(flow.uuid, {}, aibitat);
              
              if (!result.success) {
                const error = result.results?.[0]?.error || "Unknown error";
                return `❌ Workflow "${flow.name}" failed: ${error}`;
              }
              
              aibitat.introspect(`Workflow "${flow.name}" completed successfully`);
              
              // If the flow has directOutput, return it directly
              if (result.directOutput) {
                return AgentFlows.stringifyResult(result.directOutput);
              }
              
              return `✅ Workflow "${flow.name}" completed successfully!\n\nResults: ${AgentFlows.stringifyResult(result)}`;
              
            } catch (error) {
              return `❌ Error running workflow "${workflowName}": ${error.message}`;
            }
          }
        });

        // List my workflows function
        aibitat.function({
          name: "list_my_workflows",
          description: "List all saved workflows",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async () => {
            const flows = AgentFlows.listFlows();
            
            if (flows.length === 0) {
              return "📋 No workflows found. Create one with: \"@agent create workflow [description]\"";
            }
            
            const flowList = flows.map(f => 
              `📋 **${f.name}**\n   ${f.description || 'No description'}\n   Usage: @agent run workflow ${f.name}`
            ).join('\n\n');
            
            return `📋 **Your Workflows (${flows.length}):**\n\n${flowList}`;
          }
        });
      }
    };
  }
};

module.exports = { workflowCreator, WorkflowCreatorSession };