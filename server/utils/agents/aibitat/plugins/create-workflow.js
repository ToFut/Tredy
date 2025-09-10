/**
 * Simple Create Workflow Plugin
 * Minimal implementation to test visual workflow building
 */

const { v4: uuidv4 } = require("uuid");
const { AgentFlows } = require("../../../agentFlows");

const createWorkflow = {
  name: "create-workflow",
  startupConfig: {
    params: {},
  },
  plugin: function (agent) {
    return {
      name: "create-workflow", // This name will be visible to UnTooled
      setup(aibitat) {
        console.log("🔧 [CreateWorkflow] Setting up create-workflow plugin");
        
        // Register with the PLUGIN NAME, not a custom function name
        aibitat.function({
          name: "create-workflow", // MUST match plugin name for UnTooled
          description: "Creates automated workflows from natural language. Use when user wants to create a workflow or describes multiple steps.",
          examples: [
            {
              prompt: "create a workflow to fetch weather and send email",
              call: JSON.stringify({ description: "fetch weather and send email" })
            }
          ],
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Natural language description of the workflow"
              }
            },
            required: ["description"]
          },
          handler: async function ({ description }) {
            try {
              console.log("🎉 [CreateWorkflow] Handler called with:", description);
              
              const workflowName = `Workflow ${Date.now()}`;
              const workflowUuid = uuidv4();
              
              // Parse description into logical workflow steps using available tools
              function parseIntoSteps(desc, availableTools = []) {
                // Split description into logical parts
                const parts = desc.split(/(?:\bthen\b|\band then\b|\bafter that\b|\bfinally\b|\bnext\b)/i)
                  .map(p => p.trim())
                  .filter(p => p.length > 0);
                
                // For each part, create an LLM instruction that can use tools
                const steps = parts.map((part, index) => ({
                  type: 'llmInstruction',
                  config: {
                    instruction: `You MUST complete this task: ${part}

IMPORTANT: You have access to these tools and MUST use them to complete the task:
${availableTools.slice(0, 20).map(tool => `- ${tool}`).join('\n')}

DO NOT just describe what you would do. ACTUALLY CALL the appropriate tool functions.
For example:
- If asked to get emails, CALL gmail_ws11-get_emails
- If asked to send email, CALL gmail_ws11-send_email with proper parameters
- If asked to search, CALL the appropriate search tool

Execute the task NOW using the tools available.`,
                    resultVariable: `step_${index}_result`,
                    directOutput: false
                  }
                }));
                
                // Create visual blocks
                const visualBlocks = parts.map((part, index) => ({
                  id: `step_${index}`,
                  type: 'llmInstruction', 
                  name: `🔧 Smart Step ${index + 1}`,
                  description: part.substring(0, 60) + (part.length > 60 ? '...' : ''),
                  status: 'pending',
                  icon: '🔧',
                  tool: 'AI + Tools'
                }));
                
                return { steps, visualBlocks };
              }
              
              // Get available tools from aibitat context
              let availableTools = [];
              try {
                if (aibitat && aibitat.functions) {
                  availableTools = Array.from(aibitat.functions.keys())
                    .filter(name => !name.startsWith('flow_') && name !== 'create-workflow') // Filter out workflow functions
                    .slice(0, 30); // Limit to prevent prompt bloat
                  console.log(`[CreateWorkflow] Found ${availableTools.length} available tools`);
                }
              } catch (error) {
                console.warn('[CreateWorkflow] Could not load available tools:', error.message);
              }
              
              const { steps: workflowSteps, visualBlocks: parsedBlocks } = parseIntoSteps(description, availableTools);
              
              // Create initial workflow with building status
              let config = {
                name: workflowName,
                description: `Created: ${description}`,
                active: false,
                status: 'building',
                created_via: "chat",
                created_at: new Date().toISOString(),
                steps: [],
                visualBlocks: [],
                buildProgress: {
                  current: 0,
                  total: parsedBlocks.length + 2, // +2 for start and complete blocks
                  message: 'Starting workflow creation...'
                },
                // Signal to open Flow Panel AND WorkflowBuilder
                openFlowPanel: true,
                openWorkflowBuilder: true,
                workflowUuid: workflowUuid
              };
              
              // Save initial state
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`🏗️ Creating workflow: "${workflowName}"`);
              
              // Simulate progressive building
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Add start block
              config.steps.push({
                type: "start",
                config: { variables: [] }
              });
              config.visualBlocks.push({
                id: 'start',
                type: 'start',
                name: '🚀 Start',
                description: 'Workflow entry point',
                status: 'complete',
                icon: '🚀',
                tool: 'Start'
              });
              config.buildProgress = {
                current: 1,
                total: parsedBlocks.length + 2,
                message: 'Initializing workflow...'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`🚀 Building workflow with ${parsedBlocks.length} steps...`);
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Add each parsed block with animation
              for (let i = 0; i < parsedBlocks.length; i++) {
                const block = parsedBlocks[i];
                
                // Mark previous blocks as complete
                if (i > 0) {
                  config.visualBlocks[config.visualBlocks.length - 1].status = 'complete';
                }
                
                // Add current block as building
                block.status = 'building';
                config.visualBlocks.push(block);
                
                // Add corresponding step
                config.steps.push(workflowSteps[i]);
                
                config.buildProgress = {
                  current: i + 2,
                  total: parsedBlocks.length + 2,
                  message: `Adding: ${block.tool}...`
                };
                
                await AgentFlows.saveFlow(config.name, config, workflowUuid);
                aibitat.introspect(`${block.icon} Adding ${block.tool}: ${block.description.substring(0, 30)}...`);
                
                await new Promise(resolve => setTimeout(resolve, 1200));
              }
              
              // Mark last block as complete
              if (config.visualBlocks.length > 1) {
                config.visualBlocks[config.visualBlocks.length - 1].status = 'complete';
              }
              
              // Add complete block
              config.visualBlocks.push({
                id: 'complete',
                type: 'complete',
                name: '✅ Complete',
                description: 'Workflow ready!',
                status: 'complete',
                icon: '✅',
                tool: 'Complete'
              });
              
              // Complete workflow
              config.active = true;
              config.status = 'complete';
              config.buildProgress = {
                current: parsedBlocks.length + 2,
                total: parsedBlocks.length + 2,
                message: '🎉 Workflow complete!'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              
              // Clean up progress after 2 seconds
              setTimeout(async () => {
                delete config.buildProgress;
                await AgentFlows.saveFlow(config.name, config, workflowUuid);
              }, 2000);
              
              aibitat.introspect(`🎉 Workflow "${workflowName}" created with ${parsedBlocks.length} steps!`);
              
              // Return a string message instead of object to avoid chat system errors
              return `✅ Workflow "${workflowName}" created with ${parsedBlocks.length} steps!\n\nSteps:\n${parsedBlocks.map((b, i) => `${i+1}. ${b.icon} ${b.tool}`).join('\n')}\n\nThe workflow is now visible in your Flow Panel and ready to use!`;
              
            } catch (error) {
              console.error("❌ [CreateWorkflow] Error:", error);
              // Return error as string to avoid chat system errors
              return `Failed to create workflow: ${error.message}`;
            }
          }
        });
        
        console.log("✅ [CreateWorkflow] Plugin setup complete");
      }
    };
  }
};

module.exports = {
  createWorkflow,
  "create-workflow": createWorkflow // Also export with dash name
};