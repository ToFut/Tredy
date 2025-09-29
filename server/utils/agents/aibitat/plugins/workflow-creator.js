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
   * Parse natural language description into workflow steps using LLM-powered decomposition
   */
  async parseDescriptionToWorkflowSteps(description, aibitat) {
    console.log("🔧 [WorkflowCreator] Parsing description:", description);
    
    try {
      // Get available tools for context
      const availableTools = this.getAvailableTools(aibitat);
      
      // Use LLM to decompose task into logical steps
      const decompositionPrompt = `You are a workflow planning expert. Break down this task into logical, sequential steps:

"${description}"

Available tools: ${availableTools.slice(0, 20).join(', ')}${availableTools.length > 20 ? '...' : ''}

Rules:
1. Each step should be a single, specific action
2. Identify the exact tool needed for each step
3. Extract specific parameters (emails, names, etc.)
4. Consider data flow between steps
5. Be precise about what each step accomplishes

Return a JSON array of steps with this format:
[
  {
    "action": "send email",
    "target": "user@example.com",
    "content": "Hello",
    "tool": "gmail_ws6-send_email",
    "parameters": {"to": "user@example.com", "subject": "Message", "body": "Hello"}
  }
]

Only return the JSON array, no other text.`;
      
      console.log("🔧 [WorkflowCreator] Using LLM for task decomposition");
      const response = await aibitat.llm.chat([{
        role: "user",
        content: decompositionPrompt
      }], { temperature: 0.1 });
      
      // Parse LLM response
      let parsedSteps;
      try {
        const jsonMatch = response.match(/\[.*\]/s);
        if (jsonMatch) {
          parsedSteps = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON array found in response");
        }
      } catch (parseError) {
        console.log("🔧 [WorkflowCreator] LLM parsing failed, using fallback:", parseError.message);
        return this.parseDescriptionToWorkflowStepsFallback(description, availableTools);
      }
      
      // Convert LLM response to workflow steps with dependency tracking
      const steps = [];
      for (let i = 0; i < parsedSteps.length; i++) {
        const step = parsedSteps[i];
        steps.push(this.createWorkflowStep(step, i, availableTools, steps));
      }
      
      console.log("🔧 [WorkflowCreator] Created", steps.length, "workflow steps via LLM");
      return steps;
      
    } catch (error) {
      console.log("🔧 [WorkflowCreator] LLM decomposition failed, using fallback:", error.message);
      return this.parseDescriptionToWorkflowStepsFallback(description, aibitat ? this.getAvailableTools(aibitat) : []);
    }
  }

  /**
   * Get available tools from aibitat instance
   */
  getAvailableTools(aibitat) {
    if (!aibitat || !aibitat.functions) {
      return [];
    }
    
    const tools = Array.from(aibitat.functions.keys());
    console.log(`🔧 [WorkflowCreator] Found ${tools.length} available tools`);
    return tools;
  }

  /**
   * Create workflow step from LLM-parsed action with improved variable passing
   */
  createWorkflowStep(stepData, index, availableTools, allSteps = []) {
    const { action, target, content, tool, parameters, dependsOn } = stepData;
    
    // Try to find the best matching tool
    const bestTool = this.findBestTool(action, target, availableTools);
    
    // Handle variable substitution for parameters
    const processedParams = this.processParametersWithVariables(parameters || this.extractParameters(action, target, content), allSteps, index);
    
    if (bestTool) {
      // Create TOOL_CALL step
      return {
        type: FLOW_TYPES.TOOL_CALL.type,
        config: {
          toolName: bestTool,
          parameters: processedParams,
          resultVariable: `step_${index + 1}_result`,
          directOutput: this.shouldUseDirectOutput(action),
          dependsOn: dependsOn || (index > 0 ? [`step_${index}_result`] : [])
        }
      };
    } else if (action?.toLowerCase().includes('api') || target?.includes('http')) {
      // Create API_CALL step
      return {
        type: FLOW_TYPES.API_CALL.type,
        config: {
          url: target || "https://api.example.com",
          method: "POST",
          body: JSON.stringify(processedParams),
          responseVariable: `step_${index + 1}_result`,
          directOutput: false,
          dependsOn: dependsOn || (index > 0 ? [`step_${index}_result`] : [])
        }
      };
    } else {
      // Enhanced LLM_INSTRUCTION with variable context
      let instruction = `${action}: ${target || ''} ${content || ''}`.trim();
      
      // Add context from previous steps if available
      if (index > 0) {
        instruction += `\n\nContext from previous steps: Use the results from previous workflow steps as needed.`;
      }
      
      return {
        type: FLOW_TYPES.LLM_INSTRUCTION.type,
        config: {
          instruction,
          resultVariable: `step_${index + 1}_result`,
          directOutput: false,
          dependsOn: dependsOn || (index > 0 ? [`step_${index}_result`] : [])
        }
      };
    }
  }
  
  /**
   * Process parameters to include variable references from previous steps
   */
  processParametersWithVariables(params, allSteps, currentIndex) {
    if (!params || typeof params !== 'object') {
      return params;
    }
    
    const processedParams = { ...params };
    
    // Look for parameters that might reference previous step results
    Object.keys(processedParams).forEach(key => {
      let value = processedParams[key];
      
      // If value contains placeholder text that suggests it should use previous results
      if (typeof value === 'string') {
        // Replace dynamic content markers with variable references
        if (value.includes('{{previous}}') || value.includes('{{result}}')) {
          if (currentIndex > 0) {
            value = value.replace(/{{previous}}/g, `{{step_${currentIndex}_result}}`);
            value = value.replace(/{{result}}/g, `{{step_${currentIndex}_result}}`);
          }
        }
        
        // For email subjects, make them more specific
        if (key === 'subject' && (!value || value.length < 5)) {
          value = `Workflow Step ${currentIndex + 1} - ${value || 'Automated Message'}`;
        }
        
        processedParams[key] = value;
      }
    });
    
    return processedParams;
  }
  
  /**
   * Determine if step should use direct output (bypass LLM processing)
   */
  shouldUseDirectOutput(action) {
    const actionLower = (action || '').toLowerCase();
    
    // Actions that should show direct results
    const directOutputActions = ['send', 'create', 'book', 'schedule', 'connect', 'invite'];
    
    return directOutputActions.some(directAction => actionLower.includes(directAction));
  }

  /**
   * Find best matching tool for an action
   */
  findBestTool(action, target, availableTools) {
    const actionLower = (action || '').toLowerCase();
    const targetLower = (target || '').toLowerCase();
    
    // Email actions
    if (actionLower.includes('send') && (actionLower.includes('email') || actionLower.includes('mail') || targetLower.includes('@'))) {
      return availableTools.find(tool => tool.includes('gmail') && tool.includes('send_email'));
    }
    
    // LinkedIn actions
    if (actionLower.includes('linkedin') || actionLower.includes('invite') || actionLower.includes('connect')) {
      if (actionLower.includes('invite') || actionLower.includes('connect')) {
        return availableTools.find(tool => tool.includes('linkedin') && tool.includes('connect'));
      }
      if (actionLower.includes('message')) {
        return availableTools.find(tool => tool.includes('linkedin') && tool.includes('send_message'));
      }
      return availableTools.find(tool => tool.includes('linkedin'));
    }
    
    // Calendar actions
    if (actionLower.includes('calendar') || actionLower.includes('meeting') || actionLower.includes('schedule')) {
      if (actionLower.includes('book') || actionLower.includes('schedule')) {
        return availableTools.find(tool => tool.includes('calendar') && tool.includes('book'));
      }
      return availableTools.find(tool => tool.includes('calendar'));
    }
    
    // File operations
    if (actionLower.includes('read') || actionLower.includes('file') || actionLower.includes('write')) {
      return availableTools.find(tool => tool.includes('filesystem'));
    }
    
    // Web scraping
    if (actionLower.includes('scrape') || actionLower.includes('web') || targetLower.includes('http')) {
      return availableTools.find(tool => tool.includes('web'));
    }
    
    return null;
  }

  /**
   * Extract parameters from action components
   */
  extractParameters(action, target, content) {
    const actionLower = (action || '').toLowerCase();
    const params = {};
    
    // Email parameters
    if (actionLower.includes('email') || actionLower.includes('mail')) {
      if (target && target.includes('@')) {
        params.to = target;
      }
      if (content) {
        params.body = content;
        params.subject = content.length > 50 ? content.substring(0, 50) + '...' : content;
      }
    }
    
    // LinkedIn parameters
    if (actionLower.includes('linkedin')) {
      if (target) {
        params.name = target;
      }
      if (content) {
        params.message = content;
      }
    }
    
    // Calendar parameters
    if (actionLower.includes('calendar') || actionLower.includes('meeting')) {
      if (target) {
        params.title = target;
      }
      if (content) {
        params.description = content;
      }
    }
    
    return params;
  }

  /**
   * Fallback parsing method for when LLM fails
   */
  parseDescriptionToWorkflowStepsFallback(description, availableTools) {
    console.log("🔧 [WorkflowCreator] Using fallback parsing");
    
    const steps = [];
    
    // Try to extract multiple actions using improved regex
    const actions = this.extractActionsFromText(description);
    
    if (actions.length > 0) {
      actions.forEach((action, index) => {
        steps.push(this.createWorkflowStep(action, index, availableTools));
      });
    } else {
      // Single step fallback
      steps.push({
        type: FLOW_TYPES.LLM_INSTRUCTION.type,
        config: {
          instruction: description,
          resultVariable: 'step_1_result',
          directOutput: false
        }
      });
    }
    
    return steps;
  }

  /**
   * Extract actions from text using improved pattern matching
   */
  extractActionsFromText(text) {
    const actions = [];
    
    // Email pattern: send email/mail to X with Y
    const emailMatches = text.matchAll(/send\s+(?:email|mail)\s+to\s+([^\s]+@[^\s]+)\s+with\s+([^,]+?)(?:\s+and|$)/gi);
    for (const match of emailMatches) {
      actions.push({
        action: 'send email',
        target: match[1],
        content: match[2].trim()
      });
    }
    
    // LinkedIn pattern: send invite/connect on linkedin to X
    const linkedinMatches = text.matchAll(/send\s+(?:invite|connection)\s+(?:on|in)\s+(?:linkedin|linkdin)\s+to\s+([^,]+?)(?:\s+and|$)/gi);
    for (const match of linkedinMatches) {
      actions.push({
        action: 'linkedin connect',
        target: match[1].trim(),
        content: ''
      });
    }
    
    return actions;
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
        directOutput: false // Never use directOutput so agent can process results
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
    // Use the same smart naming logic as DynamicFlowBuilder
    const builder = new (require('../flowBuilder/dynamicFlowBuilder').DynamicFlowBuilder)();
    return builder.generateFlowName(description);
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

  /**
   * Send progressive update as each block is established
   */
  async sendProgressiveUpdate(aibitat, draft, currentSteps, stepNumber, totalSteps) {
    const preview = this.formatWorkflowPreview(draft, currentSteps);
    const progress = Math.round((stepNumber / totalSteps) * 100);
    
    // Send progress message
    const progressMessage = `🏗️ **Building Workflow: "${draft.name}"**\n\n` +
      `📊 Progress: ${stepNumber}/${totalSteps} blocks (${progress}%)\n\n` +
      `${preview}\n\n` +
      `⏳ *Adding next block...*`;
    
    // Use introspect to show progress in chat
    aibitat.introspect(`Progress: ${stepNumber}/${totalSteps} blocks established`);
    
    return progressMessage;
  }

  /**
   * Send final completion update
   */
  async sendCompletionUpdate(aibitat, draft, steps, uuid) {
    const preview = this.formatWorkflowPreview(draft, steps);
    
    aibitat.introspect(`🎯 Workflow ready! Saved with UUID: ${uuid}`);
    
    return {
      type: "workflowComplete",
      workflowId: draft.id,
      uuid,
      preview,
      workflow: {
        name: draft.name,
        description: draft.description,
        stepsCount: steps.length - 1,
        saved: true
      }
    };
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

        // Capture LLM's execution plan and convert to flow
        aibitat.function({
          name: "capture_execution_plan",
          description: "Capture the LLM's intended tool execution sequence and convert to visual flow",
          parameters: {
            type: "object",
            properties: {
              tools: {
                type: "array",
                description: "Array of tools the LLM plans to use in sequence",
                items: { type: "string" }
              },
              description: {
                type: "string",
                description: "What this flow will accomplish"
              }
            },
            required: ["tools", "description"]
          },
          handler: async ({ tools, description }) => {
            // Simply convert LLM's plan to flow JSON
            const flow = {
              id: uuidv4(),
              name: description.slice(0, 30),
              steps: tools.map((tool, idx) => ({
                type: "tool",
                tool: tool,
                order: idx
              }))
            };
            
            // Save and return
            await AgentFlows.saveFlow(flow.name, flow, flow.id);
            return `Flow created: ${tools.join(' → ')}`;
          }
        });
        
        // Main workflow creation function
        console.log("🔧 [WorkflowCreator] Registering create_workflow function");
        console.log("🔧 [WorkflowCreator] Plugin setup complete, about to register function");
        aibitat.function({
          name: "create_workflow", 
          description: "Creates automated workflows from natural language. ALWAYS use this when user describes: multiple steps, sequential tasks (then/and/after), automation requests, 'fetch and summarize', 'read and send', chained actions, or any multi-step process. Builds visual workflow that executes immediately.",
          examples: [
            {
              prompt: "fetch news about AI, summarize top 5 stories, and email me the summary",
              call: JSON.stringify({ description: "fetch news about AI, summarize top 5 stories, and email me the summary" })
            },
            {
              prompt: "read my last 10 emails and create a summary report",
              call: JSON.stringify({ description: "read my last 10 emails and create a summary report" })
            },
            {
              prompt: "check calendar then prepare meeting notes then send to attendees",
              call: JSON.stringify({ description: "check calendar then prepare meeting notes then send to attendees" })
            },
            {
              prompt: "get weather forecast and news then email daily briefing",
              call: JSON.stringify({ description: "get weather forecast and news then email daily briefing" })
            },
            {
              prompt: "analyze sales data then generate charts and send report",
              call: JSON.stringify({ description: "analyze sales data then generate charts and send report" })
            },
            {
              prompt: "search LinkedIn profiles and compile contact list",
              call: JSON.stringify({ description: "search LinkedIn profiles and compile contact list" })
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
              
              // Send initial workflow creation notification
              aibitat.introspect(`🏗️ Starting workflow creation: "${draft.name}"`);
              
              // Parse description into workflow steps using LLM-powered approach
              const parsedSteps = await session.parseDescriptionToWorkflowSteps(description, aibitat);
              
              // Progressive rendering: Add blocks one by one with real-time updates
              const steps = [];
              const workflowUuid = uuidv4();
              
              // Create visual blocks for the tree animation
              const visualBlocks = [];
              
              // Create initial workflow structure that will be progressively updated
              let workflowConfig = {
                name: draft.name,
                description: `Chat-created workflow: ${draft.description}`,
                active: false, // Start as inactive during building
                status: 'building',
                created_via: "chat",
                created_at: new Date().toISOString(),
                steps: [],
                visualBlocks: [], // For tree animation
                buildProgress: {
                  current: 0,
                  total: parsedSteps.length + 1,
                  message: 'Initializing workflow...'
                }
              };
              
              // Save initial workflow state (empty)
              await AgentFlows.saveFlow(workflowConfig.name, workflowConfig, workflowUuid);
              aibitat.introspect(`🏗️ Creating workflow: "${draft.name}"`);
              
              // Step 1: Add start block
              const startStep = {
                type: "start",
                config: { variables: [] }
              };
              steps.push(startStep);
              
              // Create visual start block
              const startBlock = {
                id: 'start',
                type: 'start',
                name: 'Start',
                description: 'Workflow begins here',
                x: 100,
                y: 50,
                status: 'building',
                connections: []
              };
              visualBlocks.push(startBlock);
              
              // Update workflow with start block
              workflowConfig.steps = [...steps];
              workflowConfig.visualBlocks = [...visualBlocks];
              workflowConfig.buildProgress = {
                current: 1,
                total: parsedSteps.length + 1,
                message: '🏁 Added start block'
              };
              await AgentFlows.saveFlow(workflowConfig.name, workflowConfig, workflowUuid);
              
              aibitat.introspect(`✅ Block 1 established: Start Block`);
              await session.sendProgressiveUpdate(aibitat, draft, steps, 1, parsedSteps.length + 1);
              
              // Mark start block as complete
              startBlock.status = 'complete';
              workflowConfig.visualBlocks = [...visualBlocks];
              await AgentFlows.saveFlow(workflowConfig.name, workflowConfig, workflowUuid);
              
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Step 2-N: Add each parsed step with progressive updates
              for (let i = 0; i < parsedSteps.length; i++) {
                const step = parsedSteps[i];
                steps.push(step);
                
                const stepNum = i + 2; // +2 because we have start block
                const stepTitle = session.getStepTitle(step);
                const blockId = `block_${i + 1}`;
                
                // Create visual block for tree
                const visualBlock = {
                  id: blockId,
                  type: step.type,
                  name: stepTitle,
                  description: step.config?.instruction || stepTitle,
                  x: 100,
                  y: 50 + (stepNum * 120), // Stack vertically
                  status: 'building',
                  connections: [visualBlocks[visualBlocks.length - 1].id] // Connect to previous block
                };
                visualBlocks.push(visualBlock);
                
                // Update workflow configuration with new step
                workflowConfig.steps = [...steps];
                workflowConfig.visualBlocks = [...visualBlocks];
                workflowConfig.buildProgress = {
                  current: stepNum,
                  total: parsedSteps.length + 1,
                  message: `🔧 Building ${stepTitle}...`
                };
                
                // Save updated workflow state - block appears
                await AgentFlows.saveFlow(workflowConfig.name, workflowConfig, workflowUuid);
                
                aibitat.introspect(`✅ Block ${stepNum} established: ${stepTitle}`);
                
                // Delay to show building animation
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Mark block as complete
                visualBlock.status = 'complete';
                workflowConfig.buildProgress.message = `✅ Completed ${stepTitle}`;
                workflowConfig.visualBlocks = [...visualBlocks];
                await AgentFlows.saveFlow(workflowConfig.name, workflowConfig, workflowUuid);
                
                // Send progressive update for this step
                await session.sendProgressiveUpdate(aibitat, draft, steps, stepNum, parsedSteps.length + 1);
                
                // Small delay before next block
                await new Promise(resolve => setTimeout(resolve, 400));
              }
              
              // Mark workflow as complete and active
              workflowConfig.active = true;
              workflowConfig.status = 'complete';
              workflowConfig.buildProgress.message = '🎉 Workflow completed!';
              
              // Final save - all blocks complete
              await AgentFlows.saveFlow(workflowConfig.name, workflowConfig, workflowUuid);
              
              // Clean up build progress after 2 seconds
              setTimeout(async () => {
                delete workflowConfig.buildProgress;
                await AgentFlows.saveFlow(workflowConfig.name, workflowConfig, workflowUuid);
              }, 2000);
              
              // Store final parsed workflow
              draft.steps = steps;
              
              // Create final visual preview
              const preview = session.formatWorkflowPreview(draft, steps);
              
              // Workflow already saved progressively above
              aibitat.introspect(`🎉 Workflow "${workflowConfig.name}" created successfully!`);
              
              // Send final completion update
              await session.sendCompletionUpdate(aibitat, draft, steps, workflowUuid);
              
              // Clean up draft
              session.draftWorkflows.delete(draft.id);
              
              return `🎉 **Workflow "${draft.name}" Created & Saved!**\n\n${preview}\n\n✅ **Auto-saved and ready to use!**\n🎯 **Run it with:** \`@agent run workflow ${draft.name}\`\n\n📁 *Check the Agent Flows panel to see your new workflow*`;
              
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