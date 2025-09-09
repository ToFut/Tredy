const {
  WorkspaceAgentInvocation,
} = require("../../models/workspaceAgentInvocation");
const { writeResponseChunk } = require("../helpers/chat/responses");

/**
 * Detects and handles @flow commands by converting them to workflow-creator agent invocations
 * @param {Object} params - Parameters for flow detection
 * @param {string} params.uuid - The unique identifier for this chat session
 * @param {Object} params.response - The response object to write chunks to
 * @param {string} params.message - The user message to check for @flow command
 * @param {Object} params.workspace - The workspace object
 * @param {Object} params.user - The user object
 * @param {Object} params.thread - The thread object
 * @returns {boolean} True if this is a flow command, false otherwise
 */
async function grepFlow({
  uuid,
  response,
  message,
  workspace,
  user = null,
  thread = null,
}) {
  // Check if message starts with @flow
  if (!message.startsWith("@flow")) return false;

  // Extract the flow description after @flow
  const flowDescription = message.replace(/^@flow\s*/i, '').trim();
  
  // Convert to agent command with explicit function call instruction
  // Format: @agent [INSTRUCTION] to ensure the LLM understands to use the function
  const agentMessage = `@agent [SYSTEM: You MUST call the create_workflow function] Create a workflow that: ${flowDescription}`;

  // Create agent invocation for workflow-creator
  const { invocation: newInvocation } = await WorkspaceAgentInvocation.new({
    prompt: agentMessage,
    workspace: workspace,
    user: user,
    thread: thread,
  });

  if (!newInvocation) {
    writeResponseChunk(response, {
      id: uuid,
      type: "statusResponse",
      textResponse: "Flow creator could not be invoked. Chat will be handled as default chat.",
      sources: [],
      close: true,
      animate: false,
      error: null,
    });
    return false;
  }

  // Initialize websocket connection for agent interaction
  writeResponseChunk(response, {
    id: uuid,
    type: "agentInitWebsocketConnection",
    textResponse: null,
    sources: [],
    close: false,
    error: null,
    websocketUUID: newInvocation.uuid,
  });

  // Close HTTP stream and switch to agent mode
  writeResponseChunk(response, {
    id: uuid,
    type: "agentThinking",
    textResponse: "Workflow creator invoked",
    sources: [],
    close: true,
    error: null,
    animate: true,
    agentName: "workflow-creator",
  });
  
  return true;
}

module.exports = { grepFlow };