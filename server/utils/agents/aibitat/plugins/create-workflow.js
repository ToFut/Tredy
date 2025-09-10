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
              
              // Parse description into logical workflow steps
              function parseIntoSteps(desc) {
                const steps = [];
                const visualBlocks = [];
                
                // Split by common action words and conjunctions
                const parts = desc.split(/(?:\bthen\b|\band then\b|\bafter that\b|\bfinally\b|\bnext\b)/i)
                  .map(p => p.trim())
                  .filter(p => p.length > 0);
                
                parts.forEach((part, index) => {
                  let stepType = 'llmInstruction';
                  let icon = '🤖';
                  let tool = 'AI Processing';
                  let config = {};
                  
                  // Detect email operations
                  if (part.match(/(?:get|fetch|check|read).*?(?:email|mail|gmail)/i)) {
                    stepType = 'llmInstruction';
                    icon = '📧';
                    tool = 'Gmail - Fetch';
                    config = {
                      instruction: `Use gmail_ws4-get_emails to ${part}`,
                      resultVariable: `emails_${index}`,
                      directOutput: false
                    };
                  }
                  // Detect email sending
                  else if (part.match(/send.*?(?:email|mail|report|summary).*?to\s+([^\s]+)/i)) {
                    const match = part.match(/to\s+([^\s]+)/i);
                    const recipient = match ? match[1] : 'user@example.com';
                    stepType = 'llmInstruction';
                    icon = '📤';
                    tool = 'Gmail - Send';
                    config = {
                      instruction: `Use gmail_ws4-send_email to send to ${recipient}: ${part}`,
                      resultVariable: `sent_${index}`,
                      directOutput: false
                    };
                  }
                  // Detect summarization
                  else if (part.match(/summarize|summary/i)) {
                    stepType = 'llmInstruction';
                    icon = '📝';
                    tool = 'AI - Summarize';
                    config = {
                      instruction: part,
                      resultVariable: `summary_${index}`,
                      directOutput: false
                    };
                  }
                  // Detect priority/analysis
                  else if (part.match(/identify|analyze|priorities|important/i)) {
                    stepType = 'llmInstruction';
                    icon = '🎯';
                    tool = 'AI - Analyze';
                    config = {
                      instruction: part,
                      resultVariable: `analysis_${index}`,
                      directOutput: false
                    };
                  }
                  // Detect search operations
                  else if (part.match(/search|find|look for|specific.*?about/i)) {
                    stepType = 'llmInstruction';
                    icon = '🔍';
                    tool = 'Search';
                    config = {
                      instruction: part,
                      resultVariable: `search_${index}`,
                      directOutput: false
                    };
                  }
                  // Default AI processing
                  else {
                    stepType = 'llmInstruction';
                    icon = '🤖';
                    tool = 'AI Processing';
                    config = {
                      instruction: part,
                      resultVariable: `result_${index}`,
                      directOutput: false
                    };
                  }
                  
                  // Add to steps array
                  steps.push({
                    type: stepType,
                    config: config
                  });
                  
                  // Add to visual blocks
                  visualBlocks.push({
                    id: `step_${index}`,
                    type: stepType,
                    name: `${icon} ${tool}`,
                    description: part.substring(0, 60) + (part.length > 60 ? '...' : ''),
                    status: 'pending',
                    icon: icon,
                    tool: tool
                  });
                });
                
                return { steps, visualBlocks };
              }
              
              const { steps: workflowSteps, visualBlocks: parsedBlocks } = parseIntoSteps(description);
              
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