const { Telemetry } = require("../models/telemetry");
const {
  WorkspaceAgentInvocation,
} = require("../models/workspaceAgentInvocation");
const { AgentHandler } = require("../utils/agents");
const {
  WEBSOCKET_BAIL_COMMANDS,
} = require("../utils/agents/aibitat/plugins/websocket");
const { safeJsonParse } = require("../utils/http");
const { registerConnection } = require("../utils/scheduleEvents");
const { enhanceAgentHandler } = require("../utils/agents/websocket-emit-tools");

// Setup listener for incoming messages to relay to socket so it can be handled by agent plugin.
function relayToSocket(message) {
  if (this.handleFeedback) return this?.handleFeedback?.(message);
  this.checkBailCommand(message);
}

function agentWebsocket(app) {
  if (!app) return;

  app.ws("/agent-invocation/:uuid", async function (socket, request) {
    try {
      const agentHandler = await new AgentHandler({
        uuid: String(request.params.uuid),
      }).init();

      if (!agentHandler.invocation) {
        socket.close();
        return;
      }

      // Register this connection for schedule events
      if (agentHandler.invocation?.workspace_id) {
        registerConnection(agentHandler.invocation.workspace_id, socket);
      }

      // Enhance agent handler with WebSocket tool emissions
      enhanceAgentHandler(agentHandler, socket);
      
      socket.on("message", relayToSocket);
      socket.on("close", () => {
        agentHandler.closeAlert();
        WorkspaceAgentInvocation.close(String(request.params.uuid));
        return;
      });

      socket.checkBailCommand = (data) => {
        const content = safeJsonParse(data)?.feedback;
        if (WEBSOCKET_BAIL_COMMANDS.includes(content)) {
          agentHandler.log(
            `User invoked bail command while processing. Closing session now.`
          );
          agentHandler.aibitat.abort();
          socket.close();
          return;
        }
      };

      await Telemetry.sendTelemetry("agent_chat_started");
      await agentHandler.createAIbitat({ socket });
      await agentHandler.startAgentCluster();
    } catch (e) {
      console.error(e.message, e);
      socket?.send(JSON.stringify({ type: "wssFailure", content: e.message }));
      socket?.close();
    }
  });
}

module.exports = { agentWebsocket };
