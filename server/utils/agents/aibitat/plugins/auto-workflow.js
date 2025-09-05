/**
 * Auto Workflow Plugin - Minimal implementation using ONLY original AnythingLLM systems
 * This creates workflows on-demand using the existing AgentFlows system
 */

const { AgentFlows } = require("../../../agentFlows");

const autoWorkflow = {
  name: "auto-workflow",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "auto-workflow",
      setup(aibitat) {
        // Single function that creates and executes workflows
        aibitat.function({
          name: "auto_workflow",
          description: `ALWAYS USE THIS FOR ANY ACTION REQUEST!
          
          Automatically creates and executes a workflow for any task.
          This ensures proper multi-step execution.
          
          USE FOR: emails, calendar, invites, or ANY action request.`,
          parameters: {
            type: "object",
            properties: {
              task: {
                type: "string",
                description: "What the user wants done"
              }
            },
            required: ["task"]
          },
          handler: async function({ task }) {
            try {
              aibitat.introspect(`Creating workflow for: "${task}"`);
              
              // Create a simple workflow config using existing AgentFlows format
              const flowConfig = {
                name: `Auto: ${task.substring(0, 30)}`,
                description: task,
                active: true,
                steps: [
                  {
                    type: "start",
                    config: { variables: [] }
                  },
                  {
                    type: "llmInstruction",
                    config: {
                      instruction: `Execute this task completely: ${task}. 
                      
                      Important instructions:
                      - If this involves sending an invite, create a proper calendar event
                      - If this involves email, use the email tools
                      - Complete ALL requested actions
                      - Be thorough and don't skip steps`,
                      resultVariable: "result",
                      directOutput: true
                    }
                  }
                ]
              };
              
              // Save the workflow using existing system
              const saveResult = AgentFlows.saveFlow(flowConfig.name, flowConfig);
              
              if (!saveResult.success) {
                return `Failed to create workflow: ${saveResult.error}`;
              }
              
              aibitat.introspect(`Executing workflow ${saveResult.uuid}`);
              
              // Execute using existing system
              const result = await AgentFlows.executeFlow(saveResult.uuid, {}, aibitat);
              
              // Clean up temporary workflow
              AgentFlows.deleteFlow(saveResult.uuid);
              
              if (!result.success) {
                return `Task failed: ${result.results?.[0]?.error || 'Unknown error'}`;
              }
              
              // Return the direct output if available
              if (result.directOutput) {
                aibitat.skipHandleExecution = true; // Stop further processing
                return result.directOutput;
              }
              
              return `Task completed successfully`;
              
            } catch (error) {
              aibitat.introspect(`Error: ${error.message}`);
              return `Failed to execute task: ${error.message}`;
            }
          }
        });
      }
    };
  }
};

module.exports = { autoWorkflow };