const chalk = require("chalk");
const { Telemetry } = require("../../../../models/telemetry");
const SOCKET_TIMEOUT_MS = 300 * 1_000; // 5 mins

/**
 * Websocket Interface plugin. It prints the messages on the console and asks for feedback
 * while the conversation is running in the background.
 */

// export interface AIbitatWebSocket extends ServerWebSocket<unknown> {
//   askForFeedback?: any
//   awaitResponse?: any
//   handleFeedback?: (message: string) => void;
// }

const WEBSOCKET_BAIL_COMMANDS = [
  "exit",
  "/exit",
  "stop",
  "/stop",
  "halt",
  "/halt",
  "/reset", // Will not reset but will bail. Powerusers always do this and the LLM responds.
];
const websocket = {
  name: "websocket",
  startupConfig: {
    params: {
      socket: {
        required: true,
      },
      muteUserReply: {
        required: false,
        default: true,
      },
      introspection: {
        required: false,
        default: true,
      },
    },
  },
  plugin: function ({
    socket, // @type AIbitatWebSocket
    muteUserReply = true, // Do not post messages to "USER" back to frontend.
    introspection = false, // when enabled will attach socket to Aibitat object with .introspect method which reports status updates to frontend.
  }) {
    return {
      name: this.name,
      toolCalls: [], // Track all tool calls for this session
      setup(aibitat) {
        aibitat.onError(async (error) => {
          let errorMessage =
            error?.message || "An error occurred while running the agent.";
          console.error(chalk.red(`   error: ${errorMessage}`), error);
          aibitat.introspect(
            `Error encountered while running: ${errorMessage}`
          );
          socket.send(
            JSON.stringify({ type: "wssFailure", content: errorMessage })
          );
          aibitat.terminate();
        });

        aibitat.introspect = (messageText) => {
          if (!introspection) return; // Dump thoughts when not wanted.
          socket.send(
            JSON.stringify({
              type: "statusResponse",
              content: messageText,
              animate: true,
            })
          );
        };

        // Add method to send workflow preview
        aibitat.sendWorkflowPreview = (workflowData) => {
          socket.send(
            JSON.stringify({
              type: "workflowPreview",
              content: workflowData,
              uuid: require("uuid").v4(),
            })
          );
        };

        // Add method to track tool calls
        aibitat.trackToolCall = (toolName, params, status = "pending") => {
          const toolCall = {
            id: require("uuid").v4(),
            name: toolName,
            params: params,
            status: status,
            timestamp: Date.now(),
          };

          if (!this.toolCalls) this.toolCalls = [];
          this.toolCalls.push(toolCall);

          // Send tool tracking update to frontend
          socket.send(
            JSON.stringify({
              type: "toolCall",
              content: toolCall,
            })
          );

          return toolCall.id;
        };

        // Update tool call status
        aibitat.updateToolCall = (toolId, updates) => {
          const toolCall = this.toolCalls?.find((tc) => tc.id === toolId);
          if (toolCall) {
            Object.assign(toolCall, updates);
            socket.send(
              JSON.stringify({
                type: "toolCallUpdate",
                content: { id: toolId, ...updates },
              })
            );
          }
        };

        // expose function for sockets across aibitat
        // type param must be set or else msg will not be shown or handled in UI.
        aibitat.socket = {
          send: (type = "__unhandled", content = "") => {
            socket.send(JSON.stringify({ type, content }));
          },
        };

        // aibitat.onStart(() => {
        //   console.log("🚀 starting chat ...");
        // });

        aibitat.onMessage((message) => {
          if (message.from !== "USER")
            Telemetry.sendTelemetry("agent_chat_sent");
          if (message.from === "USER" && muteUserReply) return;

          // Debug: Log message being sent to identify duplicates
          console.log(
            `[WebSocket Plugin] Sending message from ${message.from} to ${message.to}: ${message.content?.substring(0, 50)}...`
          );
          socket.send(JSON.stringify(message));
        });

        aibitat.onTerminate(() => {
          // Send final tool usage summary before closing
          if (this.toolCalls && this.toolCalls.length > 0) {
            socket.send(
              JSON.stringify({
                type: "toolUsageSummary",
                content: {
                  tools: this.toolCalls,
                  totalCount: this.toolCalls.length,
                  successCount: this.toolCalls.filter(
                    (t) => t.status === "success"
                  ).length,
                  errorCount: this.toolCalls.filter((t) => t.status === "error")
                    .length,
                },
              })
            );
          }
          // console.log("🚀 chat finished");
          socket.close();
        });

        aibitat.onInterrupt(async (node) => {
          const feedback = await socket.askForFeedback(socket, node);
          if (WEBSOCKET_BAIL_COMMANDS.includes(feedback)) {
            socket.close();
            return;
          }

          await aibitat.continue(feedback);
        });

        /**
         * Socket wait for feedback on socket
         *
         * @param socket The content to summarize. // AIbitatWebSocket & { receive: any, echo: any }
         * @param node The chat node // { from: string; to: string }
         * @returns The summarized content.
         */
        socket.askForFeedback = (socket, node) => {
          socket.awaitResponse = (question = "waiting...") => {
            socket.send(JSON.stringify({ type: "WAITING_ON_INPUT", question }));

            return new Promise(function (resolve) {
              let socketTimeout = null;
              socket.handleFeedback = (message) => {
                const data = JSON.parse(message);
                if (data.type !== "awaitingFeedback") return;
                delete socket.handleFeedback;
                clearTimeout(socketTimeout);
                resolve(data.feedback);
                return;
              };

              socketTimeout = setTimeout(() => {
                console.log(
                  chalk.red(
                    `Client took too long to respond, chat thread is dead after ${SOCKET_TIMEOUT_MS}ms`
                  )
                );
                resolve("exit");
                return;
              }, SOCKET_TIMEOUT_MS);
            });
          };

          return socket.awaitResponse(`Provide feedback to ${chalk.yellow(
            node.to
          )} as ${chalk.yellow(node.from)}.
           Press enter to skip and use auto-reply, or type 'exit' to end the conversation: \n`);
        };
        // console.log("🚀 WS plugin is complete.");
      },
    };
  },
};

module.exports = {
  websocket,
  WEBSOCKET_BAIL_COMMANDS,
};
