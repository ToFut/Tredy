/**
 * Workflow Creator Plugin
 * Leverages existing DynamicFlowBuilder and AgentFlows infrastructure
 * Provides chat-based workflow creation with visual preview
 */

const { v4: uuidv4 } = require("uuid");

// Simple function to check if plugin loads
console.log("🔧 [WorkflowCreator] Plugin file loaded successfully");
const { AgentFlows } = require("../../../agentFlows");
const { DynamicFlowBuilder } = require("../../flowBuilder/dynamicFlowBuilder");

class WorkflowCreatorSession {
  constructor(conversationId) {
    this.conversationId = conversationId;
    this.draftWorkflows = new Map(); // workflowId -> workflow data
    this.flowBuilder = new DynamicFlowBuilder();
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
    const preview = [
      "┌─" + "─".repeat(workflow.name.length + 20) + "─┐",
      `│ 📋 ${workflow.name}${" ".repeat(20 - workflow.name.length + 2)}│`,
      "├─" + "─".repeat(workflow.name.length + 20) + "─┤",
      "│" + " ".repeat(workflow.name.length + 22) + "│"
    ];

    steps.forEach((step, index) => {
      if (step.type === 'start') return; // Skip start block
      
      const stepNum = String(index).padStart(1, '0');
      const emoji = this.getStepEmoji(step.type);
      const title = this.getStepTitle(step);
      const detail = this.getStepDetail(step);
      
      preview.push(`│ ${stepNum}️⃣ ${emoji} ${title}${" ".repeat(Math.max(0, workflow.name.length + 15 - title.length))}│`);
      if (detail) {
        preview.push(`│    └─> ${detail}${" ".repeat(Math.max(0, workflow.name.length + 10 - detail.length))}│`);
      }
      preview.push("│" + " ".repeat(workflow.name.length + 22) + "│");
    });

    preview.push("├─" + "─".repeat(workflow.name.length + 20) + "─┤");
    preview.push(`│ 📅 Status: Draft${" ".repeat(workflow.name.length + 8)}│`);
    preview.push("└─" + "─".repeat(workflow.name.length + 20) + "─┘");
    
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
        
        function getSession(conversationId) {
          if (!sessions.has(conversationId)) {
            sessions.set(conversationId, new WorkflowCreatorSession(conversationId));
          }
          return sessions.get(conversationId);
        }

        // Main workflow creation function
        console.log("🔧 [WorkflowCreator] Registering create_workflow_from_chat function");
        aibitat.function({
          name: "create_workflow_from_chat", 
          description: "PRIORITY FUNCTION: Use this when user mentions 'workflow' or 'create workflow' or describes sequential actions with 'then'. This creates a reusable automation workflow with visual preview. DO NOT execute individual actions when workflow is requested.",
          examples: [
            {
              prompt: "create workflow from chat: send email then invite",
              call: JSON.stringify({ description: "send email from chat then invite" })
            },
            {
              prompt: "create workflow from chat: send email from segev@sinosciences.com then invite to segev@futurixs.com",
              call: JSON.stringify({ description: "send email from segev@sinosciences.com then invite to segev@futurixs.com" })
            },
            {
              prompt: "create workflow: send notifications and create calendar events",
              call: JSON.stringify({ description: "send notifications and create calendar events" })
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
              
              // Use existing DynamicFlowBuilder to parse description
              const parsedSteps = session.flowBuilder.parsePromptToSteps(description);
              
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
              
              // Return structured data that can be parsed by frontend
              return {
                success: true,
                type: "workflowPreview",
                data: workflowData,
                message: `📋 **Workflow Created: "${draft.name}"**\n\nUse the commands below to interact with the workflow.`
              };
              
            } catch (error) {
              aibitat.introspect(`Error creating workflow: ${error.message}`);
              return {
                success: false,
                error: `Failed to create workflow: ${error.message}`
              };
            }
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
              
              // Create temporary workflow for testing
              const testConfig = {
                name: `TEST: ${draft.name}`,
                uuid: workflowId,
                config: {
                  steps: draft.steps
                }
              };
              
              // Use existing AgentFlows executor
              const result = await AgentFlows.executeFlow(workflowId, {}, aibitat);
              
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
              `📋 **${f.name}**\n   ${f.description || 'No description'}\n   Usage: @agent run ${f.name}`
            ).join('\n\n');
            
            return `📋 **Your Workflows (${flows.length}):**\n\n${flowList}`;
          }
        });
      }
    };
  }
};

module.exports = { workflowCreator };