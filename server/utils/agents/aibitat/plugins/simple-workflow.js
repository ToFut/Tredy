/**
 * Simple Unified Workflow Plugin
 * Convert prompt → flow JSON → save → execute
 */

const { v4: uuidv4 } = require("uuid");
const { AgentFlows } = require("../../../agentFlows");

const simpleWorkflow = {
  name: "simple-workflow",
  startupConfig: {
    params: {},
  },
  description: "Simple workflow creation and execution from natural language",
  plugin: function () {
    return {
      name: "simple-workflow",
      description: "Convert natural language to executable workflows",
      async setup(aibitat) {
        
        aibitat.introspect("Simple Workflow plugin initialized");

        /**
         * Send live writing event to FlowPanel
         */
        function sendLiveWritingEvent(flowId, step, stepIndex, totalSteps, isComplete = false) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('flowWriting', {
              detail: {
                flowId,
                step,
                stepIndex,
                totalSteps,
                isComplete
              }
            }));
          }
        }

        /**
         * Convert prompt to flow JSON with live writing animation
         */
        async function promptToFlow(prompt) {
          const flowId = require("uuid").v4();
          
          // Start writing animation
          sendLiveWritingEvent(flowId, {
            type: 'start',
            title: 'Analyzing Request',
            description: 'Breaking down your request into workflow steps...'
          }, 0, 5);

          const analysisPrompt = `Convert this request into a workflow JSON:
"${prompt}"

Return ONLY valid JSON in this exact format:
{
  "name": "Brief workflow name (max 50 chars)",
  "description": "What this workflow does",
  "steps": [
    {
      "type": "start",
      "config": {
        "variables": [{"name": "varname", "value": "initial value"}]
      }
    },
    {
      "type": "llmInstruction", 
      "config": {
        "instruction": "Read last 5 emails and summarize them",
        "resultVariable": "step_1_result"
      }
    },
    {
      "type": "llmInstruction",
      "config": {
        "instruction": "Create urgency chart from {{step_1_result}}",
        "resultVariable": "step_2_result"
      }
    },
    {
      "type": "llmInstruction", 
      "config": {
        "instruction": "Send email to recipient with {{step_1_result}} and {{step_2_result}}",
        "resultVariable": "step_3_result",
        "directOutput": true
      }
    }
  ]
}

Use these step types:
- "llmInstruction" for AI processing (emails, summaries, charts, analysis)
- "apiCall" for HTTP requests  
- "webScraping" for web content
- Variables: {{variable_name}} in instructions
- Final step should have "directOutput": true
- Sequential step variables: step_1_result, step_2_result, etc.`;

          try {
            // Simulate step-by-step creation with live updates
            sendLiveWritingEvent(flowId, {
              type: 'llm',
              title: 'Step 1: Reading Emails',
              description: 'Setting up email reading step...'
            }, 1, 5);

            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing

            sendLiveWritingEvent(flowId, {
              type: 'llm', 
              title: 'Step 2: Creating Summary',
              description: 'Adding summarization logic...'
            }, 2, 5);

            await new Promise(resolve => setTimeout(resolve, 800));

            sendLiveWritingEvent(flowId, {
              type: 'llm',
              title: 'Step 3: Urgency Analysis', 
              description: 'Building urgency detection and charting...'
            }, 3, 5);

            await new Promise(resolve => setTimeout(resolve, 800));

            sendLiveWritingEvent(flowId, {
              type: 'llm',
              title: 'Step 4: Sending Results',
              description: 'Configuring email delivery...'
            }, 4, 5);

            await new Promise(resolve => setTimeout(resolve, 500));

            const response = await aibitat.provider.complete({
              messages: [
                { role: "system", content: "You are a workflow converter. Return only valid JSON, no explanations." },
                { role: "user", content: analysisPrompt }
              ]
            });

            const flowJson = JSON.parse(response.result);
            flowJson.uuid = flowId; // Add the flowId to the result
            
            aibitat.introspect(`Converted prompt to ${flowJson.steps.length} steps`);
            
            // Complete the writing animation
            sendLiveWritingEvent(flowId, null, 5, 5, true);
            
            return flowJson;

          } catch (error) {
            aibitat.introspect(`Conversion error: ${error.message}`);
            // Fallback simple flow
            return {
              name: "Simple Flow",
              description: prompt.substring(0, 100),
              steps: [
                {
                  type: "start",
                  config: { variables: [] }
                },
                {
                  type: "llmInstruction",
                  config: {
                    instruction: prompt,
                    resultVariable: "step_1_result",
                    directOutput: false // Allow agent to process and act on results
                  }
                }
              ]
            };
          }
        }

        // Main function: Create and execute workflow
        aibitat.function({
          name: "execute_workflow",
          description: "Convert natural language request into workflow and execute it immediately. Use for any multi-step request with 'then', 'and', or sequential actions.",
          parameters: {
            type: "object",
            properties: {
              request: {
                type: "string",
                description: "The complete workflow request in natural language"
              }
            },
            required: ["request"]
          },
          handler: async ({ request }) => {
            try {
              aibitat.introspect(`Processing workflow request: ${request.substring(0, 60)}...`);
              
              // 1. Convert prompt to flow JSON
              const flowJson = await promptToFlow(request);
              
              // 2. Generate UUID and save flow
              const uuid = uuidv4();
              flowJson.active = true;
              
              const saveResult = await AgentFlows.saveFlow(
                flowJson.name,
                flowJson,
                uuid
              );
              
              if (!saveResult.success) {
                return `❌ Failed to save workflow: ${saveResult.error}`;
              }
              
              aibitat.introspect(`Workflow saved with UUID: ${uuid}`);
              
              // 3. Execute immediately
              const execResult = await AgentFlows.executeFlow(uuid, {}, aibitat);
              
              if (execResult.success) {
                // Return the final result
                if (execResult.directOutput) {
                  return execResult.directOutput;
                } else {
                  const finalResult = execResult.results[execResult.results.length - 1];
                  return finalResult?.result || `✅ Workflow "${flowJson.name}" completed successfully!`;
                }
              } else {
                return `❌ Workflow execution failed: ${execResult.results?.[0]?.error || 'Unknown error'}`;
              }
              
            } catch (error) {
              return `❌ Workflow error: ${error.message}`;
            }
          }
        });

        // Function: Run existing saved workflow
        aibitat.function({
          name: "run_workflow", 
          description: "Execute a previously saved workflow by name or UUID",
          parameters: {
            type: "object",
            properties: {
              workflow: {
                type: "string",
                description: "Name or UUID of the workflow to run"
              }
            },
            required: ["workflow"]
          },
          handler: async ({ workflow }) => {
            try {
              const flows = AgentFlows.listFlows();
              
              // Find by name or UUID
              let targetFlow = flows.find(f => 
                f.name.toLowerCase() === workflow.toLowerCase() || 
                f.uuid === workflow
              );
              
              if (!targetFlow) {
                const available = flows.map(f => f.name).join(', ');
                return `❌ Workflow "${workflow}" not found. Available: ${available}`;
              }
              
              aibitat.introspect(`Running workflow: ${targetFlow.name}`);
              
              const result = await AgentFlows.executeFlow(targetFlow.uuid, {}, aibitat);
              
              if (result.success) {
                if (result.directOutput) {
                  return result.directOutput;
                } else {
                  return `✅ Workflow "${targetFlow.name}" completed successfully!`;
                }
              } else {
                return `❌ Workflow "${targetFlow.name}" failed: ${result.results?.[0]?.error || 'Unknown error'}`;
              }
              
            } catch (error) {
              return `❌ Error running workflow: ${error.message}`;
            }
          }
        });

        // Function: List available workflows
        aibitat.function({
          name: "list_workflows",
          description: "Show all available workflows that can be run",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async () => {
            try {
              const flows = AgentFlows.listFlows();
              
              if (flows.length === 0) {
                return "No workflows found. Create one by describing a multi-step task.";
              }
              
              const list = flows.map(f => 
                `• **${f.name}** (${f.uuid.substring(0, 8)})\n  ${f.description || 'No description'}`
              ).join('\n\n');
              
              return `Available workflows (${flows.length}):\n\n${list}`;
              
            } catch (error) {
              return `❌ Error listing workflows: ${error.message}`;
            }
          }
        });
        
      }
    };
  }
};

module.exports = { simpleWorkflow };