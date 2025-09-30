/**
 * Agent Execution Guardian Plugin
 * 1. Prevents hallucination - ensures agents call functions instead of just claiming success
 * 2. Ensures multi-action completion - forces agents to complete all parts of multi-step requests
 * Simple, clean, follows AnythingLLM's original design
 */

const multiActionHandler = {
  name: "multi-action-handler",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "multi-action-handler",
      setup(aibitat) {
        // Track multi-action state
        aibitat.multiAction = {
          active: false,
          totalExpected: 0,
          completed: 0,
          targets: [],
        };

        // Simple completion tracker with loop prevention
        const originalHandleExecution = aibitat.handleExecution;
        if (
          originalHandleExecution &&
          !originalHandleExecution._multiActionWrapped
        ) {
          aibitat.handleExecution = async function (
            provider,
            messages,
            functions,
            byAgent
          ) {
            // Call original execution first
            const result = await originalHandleExecution.apply(this, arguments);

            // Prevent infinite loops - count system interventions
            const systemMessages = messages.filter(
              (m) =>
                m.role === "system" && m.content.includes("Continue by sending")
            );
            if (systemMessages.length >= 3) {
              aibitat.introspect(
                "⚠️ Too many continuation attempts. Stopping to prevent infinite loop."
              );
              return result;
            }

            // Only check for multi-email continuation if we just completed a function call
            const lastFunctionCall = messages
              .filter((m) => m.role === "function")
              .pop();
            if (!lastFunctionCall) {
              return result; // No function calls yet, let it proceed naturally
            }

            // After each execution, check if we need to continue
            const userMsg =
              messages.find((m) => m.role === "user")?.content || "";
            const emails =
              userMsg.match(
                /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
              ) || [];

            // Only intervene for multi-email requests after a successful function call
            if (emails.length > 1 && typeof result === "string") {
              // Count actual function executions (not just calls)
              const functionCalls = messages.filter(
                (m) => m.role === "function"
              );

              // Extract recipients from actual function execution results or debug logs
              const emailsSentTo = new Set();
              functionCalls.forEach((call) => {
                if (call.content && call.content.includes("successfully")) {
                  // Try to extract recipient from the function call context
                  const callIndex = messages.indexOf(call);
                  for (let i = callIndex - 1; i >= 0; i--) {
                    const msg = messages[i];
                    if (msg.role === "assistant" && msg.function_call) {
                      try {
                        const args =
                          typeof msg.function_call.arguments === "string"
                            ? JSON.parse(msg.function_call.arguments)
                            : msg.function_call.arguments;
                        if (args && args.to) {
                          emailsSentTo.add(args.to);
                          break;
                        }
                      } catch (e) {
                        // Ignore parsing errors
                      }
                    }
                  }
                }
              });

              // Check if we need to continue
              if (emailsSentTo.size < emails.length) {
                const remainingEmails = emails.filter(
                  (email) => !Array.from(emailsSentTo).includes(email)
                );

                if (remainingEmails.length > 0) {
                  aibitat.introspect(
                    `Progress: ${emailsSentTo.size}/${emails.length} emails sent. Need to send to: ${remainingEmails[0]}`
                  );

                  // Only continue if LLM returned text instead of making another function call
                  if (!result.includes("function_call")) {
                    const continueMsg = {
                      role: "system",
                      content: `You must now send an email to: ${remainingEmails[0]}. Call the email function immediately.`,
                    };

                    return await this.handleExecution(
                      provider,
                      [...messages, continueMsg],
                      functions,
                      byAgent
                    );
                  }
                }
              }
            }

            return result;
          };
          aibitat.handleExecution._multiActionWrapped = true;
        }
      },
    };
  },
};

module.exports = { multiActionHandler };
