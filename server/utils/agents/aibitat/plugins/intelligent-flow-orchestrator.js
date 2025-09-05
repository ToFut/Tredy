/**
 * Intelligent Flow Orchestrator
 * Automatically detects when user requests need multiple steps
 * and creates flows dynamically without explicit user commands
 */

const { DynamicFlowBuilder } = require("../../../agents/flowBuilder/dynamicFlowBuilder");
const { AgentFlows } = require("../../../agentFlows");
const { FlowExecutor } = require("../../../agentFlows/executor");

const intelligentFlowOrchestrator = {
  name: "intelligent_flow_orchestrator",
  description: "Automatically orchestrates multi-step tasks as flows",
  plugin: function () {
    return {
      name: this.name,
      description: this.description,
      setup(aibitat) {
        // Override the agent's message handler to intercept requests
        const originalHandler = aibitat.handleMessage?.bind(aibitat);
        
        if (originalHandler) {
          aibitat.handleMessage = async function(message, context) {
            // Analyze if this needs flow orchestration
            const flowAnalysis = analyzeForFlow(message, aibitat);
            
            if (flowAnalysis.needsFlow) {
              // Create and execute flow dynamically
              return await executeAsFlow(flowAnalysis, message, aibitat, context);
            }
            
            // Otherwise use normal tool handling
            return originalHandler(message, context);
          };
        }

        // Main orchestrator function
        aibitat.function({
          name: "orchestrate_task",
          description: `INTERNAL ORCHESTRATOR - Automatically handles complex multi-step tasks.
          
          This tool is used when a user request requires multiple operations like:
          - "Check my email, summarize important ones, and send me a report"
          - "Search for news about AI, analyze trends, and post to Slack"
          - "Get data from database, process it, and create a chart"
          
          The orchestrator will:
          1. Break down the task into steps
          2. Create a flow dynamically
          3. Execute each step in sequence
          4. Return the combined results`,
          parameters: {
            type: "object",
            properties: {
              task_description: {
                type: "string",
                description: "The complex task to orchestrate"
              },
              detected_steps: {
                type: "array",
                description: "Steps detected in the task",
                items: {
                  type: "object",
                  properties: {
                    action: { type: "string" },
                    target: { type: "string" },
                    tool: { type: "string" }
                  }
                }
              }
            },
            required: ["task_description"]
          },
          handler: async function({ task_description, detected_steps }) {
            try {
              aibitat.introspect(`Orchestrating complex task: "${task_description}"`);
              
              // Build flow dynamically
              const builder = new DynamicFlowBuilder();
              const flow = await builder.buildFlowFromPrompt(task_description);
              
              // Execute the flow immediately
              const executor = new FlowExecutor();
              executor.attachLogging(aibitat.introspect, aibitat.handlerProps?.log);
              
              const result = await executor.executeFlow(
                { config: flow.config },
                {},
                aibitat
              );
              
              if (!result.success) {
                return `Task orchestration failed: ${result.results[0]?.error || 'Unknown error'}`;
              }
              
              // Format results
              const formattedResults = formatFlowResults(result.results, flow.config.steps);
              
              // Optionally save successful flows for reuse
              if (shouldSaveFlow(task_description)) {
                const saved = AgentFlows.saveFlow(
                  flow.name,
                  flow.config,
                  flow.uuid
                );
                if (saved.success) {
                  aibitat.introspect(`Saved reusable flow: ${flow.name}`);
                }
              }
              
              return formattedResults;
              
            } catch (error) {
              aibitat.introspect(`Orchestration error: ${error.message}`);
              return `Failed to orchestrate task: ${error.message}`;
            }
          }
        });

        // Smart task analyzer
        aibitat.function({
          name: "analyze_task_complexity",
          description: "Analyzes if a task needs orchestration",
          parameters: {
            type: "object",
            properties: {
              user_request: {
                type: "string",
                description: "The user's request to analyze"
              }
            },
            required: ["user_request"]
          },
          handler: async function({ user_request }) {
            const analysis = analyzeForFlow(user_request, aibitat);
            
            if (analysis.needsFlow) {
              // Trigger orchestration
              return await aibitat.functions.orchestrate_task({
                task_description: user_request,
                detected_steps: analysis.steps
              });
            } else {
              return "This task can be handled with a single tool.";
            }
          }
        });
      }
    };
  }
};

/**
 * Analyze if a request needs flow orchestration
 */
function analyzeForFlow(message, aibitat) {
  const lower = message.toLowerCase();
  
  // Patterns that indicate multi-step operations
  const multiStepIndicators = [
    // Sequence words
    'and then', 'after that', 'afterwards', 'next', 'finally',
    // Multiple actions
    'and send', 'and create', 'and post', 'and notify',
    'and summarize', 'and analyze', 'and generate',
    // Complex requests
    'check.*summarize.*send',
    'search.*analyze.*report',
    'get.*process.*create',
    'fetch.*transform.*deliver',
    'monitor.*detect.*alert'
  ];
  
  // Count action verbs
  const actionVerbs = [
    'check', 'read', 'get', 'fetch', 'search', 'find',
    'summarize', 'analyze', 'process', 'extract', 'calculate',
    'send', 'post', 'create', 'generate', 'notify', 'alert',
    'monitor', 'track', 'watch', 'schedule', 'update'
  ];
  
  let actionCount = 0;
  let detectedSteps = [];
  
  for (const verb of actionVerbs) {
    if (lower.includes(verb)) {
      actionCount++;
      // Try to extract what follows the verb
      const regex = new RegExp(`${verb}\\s+([\\w\\s]+?)(?:\\s+and|\\s*,|\\s*$)`);
      const match = lower.match(regex);
      if (match) {
        detectedSteps.push({
          action: verb,
          target: match[1].trim(),
          tool: mapActionToTool(verb)
        });
      }
    }
  }
  
  // Check for multi-step patterns
  const hasMultiStepPattern = multiStepIndicators.some(pattern => {
    if (pattern.includes('.*')) {
      return new RegExp(pattern).test(lower);
    }
    return lower.includes(pattern);
  });
  
  // Determine if this needs a flow
  const needsFlow = actionCount >= 2 || hasMultiStepPattern || detectedSteps.length >= 2;
  
  return {
    needsFlow,
    steps: detectedSteps,
    actionCount,
    confidence: needsFlow ? 'high' : 'low'
  };
}

/**
 * Map action verbs to likely tools
 */
function mapActionToTool(action) {
  const toolMap = {
    'check': 'data_fetch',
    'read': 'data_fetch',
    'get': 'data_fetch',
    'fetch': 'data_fetch',
    'search': 'web_search',
    'find': 'search',
    'summarize': 'summarize',
    'analyze': 'analyze',
    'process': 'transform',
    'extract': 'extract',
    'calculate': 'calculate',
    'send': 'action',
    'post': 'action',
    'create': 'action',
    'generate': 'generate',
    'notify': 'notification',
    'alert': 'notification',
    'monitor': 'monitor',
    'track': 'track',
    'watch': 'monitor',
    'schedule': 'schedule',
    'update': 'update'
  };
  
  return toolMap[action] || 'process';
}

/**
 * Execute request as a flow
 */
async function executeAsFlow(analysis, message, aibitat, context) {
  try {
    // Use the orchestrate_task function
    const result = await aibitat.functions.orchestrate_task({
      task_description: message,
      detected_steps: analysis.steps
    });
    
    return result;
  } catch (error) {
    // Fallback to normal handling
    return null;
  }
}

/**
 * Format flow execution results
 */
function formatFlowResults(results, steps) {
  const successful = results.filter(r => r.success);
  
  if (successful.length === 0) {
    return "No steps completed successfully.";
  }
  
  let output = "✅ **Task Completed Successfully**\n\n";
  
  successful.forEach((result, index) => {
    const step = steps[index + 1]; // Skip start step
    if (step && result.result) {
      output += `**${step.name || step.type}:**\n`;
      output += typeof result.result === 'object' 
        ? JSON.stringify(result.result, null, 2) 
        : result.result;
      output += "\n\n";
    }
  });
  
  return output;
}

/**
 * Determine if a flow should be saved for reuse
 */
function shouldSaveFlow(description) {
  // Save flows that look reusable
  const reusablePatterns = [
    'every', 'daily', 'weekly', 'regularly',
    'always', 'routine', 'standard',
    'report', 'digest', 'summary'
  ];
  
  const lower = description.toLowerCase();
  return reusablePatterns.some(pattern => lower.includes(pattern));
}

module.exports = intelligentFlowOrchestrator;