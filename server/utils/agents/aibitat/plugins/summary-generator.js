const { WorkspaceChats } = require("../../../../models/workspaceChats");
const { safeJsonParse } = require("../../../../utils/http");

const summaryGenerator = {
  name: "summary-generator",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup: function (aibitat) {
        aibitat.function({
          super: aibitat,
          name: "generateChatSummary",
          description: "Generate a comprehensive summary of the current chat conversation or thread",
          parameters: {
            type: "object",
            properties: {
              includeActionItems: {
                type: "boolean",
                description: "Whether to extract and include action items from the conversation",
                default: true
              },
              includeTopics: {
                type: "boolean", 
                description: "Whether to identify and include main topics discussed",
                default: true
              },
              maxMessages: {
                type: "number",
                description: "Maximum number of recent messages to include in summary",
                default: 50
              }
            },
          },
          handler: async function ({ includeActionItems = true, includeTopics = true, maxMessages = 50 }) {
            try {
              const invocation = this.super.handlerProps.invocation;
              const workspace = invocation.workspace;
              const threadId = invocation.thread_id || null;

              // Fetch chat history
              const chats = await WorkspaceChats.where(
                {
                  workspaceId: workspace.id,
                  thread_id: threadId,
                  include: true
                },
                maxMessages,
                { id: "desc" }
              );

              if (!chats || chats.length === 0) {
                return "No conversation history found to summarize.";
              }

              // Reverse to get chronological order
              const chronologicalChats = chats.reverse();

              // Format chat history for analysis
              const chatText = chronologicalChats
                .map(chat => {
                  const role = chat.user_id ? "User" : "Assistant";
                  const response = safeJsonParse(chat.response, {});
                  const text = chat.prompt || response.text || "";
                  return `${role}: ${text}`;
                })
                .filter(line => line.length > 0)
                .join("\n");

              if (!chatText || chatText.trim().length === 0) {
                return "No meaningful conversation content found to summarize.";
              }

              // Generate summary using the workspace's LLM
              const summaryPrompt = `Analyze the following conversation and provide a comprehensive summary:

${chatText}

Please provide a detailed summary with the following structure:

**Overview:**
[One paragraph overview of the entire conversation]

${includeTopics ? `**Main Topics Discussed:**
- [Topic 1]
- [Topic 2]
- [Topic 3]
(List all significant topics)

` : ''}
**Key Points:**
- [Important point 1]
- [Important point 2]
- [Important point 3]
(Include all significant points made)

${includeActionItems ? `**Action Items & Next Steps:**
- [ ] [Action item 1]
- [ ] [Action item 2]
(Include any todos, tasks, or follow-ups mentioned)

` : ''}
**Conversation Tone:** [Brief description of the overall tone and nature of the conversation]

**Summary Generated:** ${new Date().toLocaleString()}
**Messages Analyzed:** ${chronologicalChats.length}`;

              // Use the agent's LLM to generate the summary
              const messages = [
                {
                  role: "system",
                  content: "You are a conversation analyst. Provide detailed, accurate summaries that capture the essence and important details of conversations. Be thorough but concise."
                },
                {
                  role: "user", 
                  content: summaryPrompt
                }
              ];

              const summary = await this.super.llm.sendChat(
                messages,
                {
                  temperature: 0.3,
                  max_tokens: 1000
                }
              );

              return summary;

            } catch (error) {
              console.error("Error generating summary:", error);
              return `Failed to generate summary: ${error.message}`;
            }
          },
        });

        aibitat.function({
          super: aibitat,
          name: "getQuickSummary",
          description: "Get a quick, brief summary of the current conversation suitable for tooltips or previews",
          parameters: {
            type: "object",
            properties: {},
          },
          handler: async function () {
            try {
              const invocation = this.super.handlerProps.invocation;
              const workspace = invocation.workspace;
              const threadId = invocation.thread_id || null;

              // Get last 20 messages for AI summary
              const recentChats = await WorkspaceChats.where(
                {
                  workspaceId: workspace.id,
                  thread_id: threadId,
                  include: true
                },
                20,
                { id: "desc" }
              );

              if (!recentChats || recentChats.length === 0) {
                return {
                  overview: "No conversations yet",
                  details: "",
                  messageCount: 0,
                  lastActivity: null
                };
              }

              // Reverse to get chronological order
              const chronologicalChats = recentChats.reverse();

              // Format last few messages for AI analysis
              const chatText = chronologicalChats
                .slice(-10) // Last 10 messages for context
                .map(chat => {
                  const role = chat.user_id ? "User" : "Assistant";
                  const response = safeJsonParse(chat.response, {});
                  const text = chat.prompt || response.text || "";
                  return `${role}: ${text.substring(0, 200)}`; // Limit each message
                })
                .filter(line => line.length > 0)
                .join("\n");

              // Generate concise AI summary (100 words max)
              const summaryPrompt = `Analyze this conversation and provide a VERY CONCISE summary in exactly 100 words or less:

${chatText}

Format your response EXACTLY like this:
OVERVIEW: [One sentence describing the main topic/purpose]
DETAILS: [2-3 key points or actions discussed]`;

              const messages = [
                {
                  role: "system",
                  content: "You are a concise summarizer. Always respond in 100 words or less. Be extremely brief and direct."
                },
                {
                  role: "user", 
                  content: summaryPrompt
                }
              ];

              const aiSummary = await this.super.llm.sendChat(
                messages,
                {
                  temperature: 0.3,
                  max_tokens: 150 // Enforce token limit
                }
              );

              // Parse AI response
              const overviewMatch = aiSummary.match(/OVERVIEW:\s*(.+?)(?=DETAILS:|$)/s);
              const detailsMatch = aiSummary.match(/DETAILS:\s*(.+?)$/s);
              
              const overview = overviewMatch ? overviewMatch[1].trim() : "Ongoing conversation";
              const details = detailsMatch ? detailsMatch[1].trim() : "";

              const messageCount = await WorkspaceChats.count({
                workspaceId: workspace.id,
                thread_id: threadId,
                include: true
              });

              return {
                overview: overview.substring(0, 100), // Ensure max 100 chars
                details: details.substring(0, 150), // Ensure max 150 chars
                messageCount: messageCount,
                lastActivity: recentChats[0]?.createdAt || new Date()
              };

            } catch (error) {
              console.error("Error getting quick summary:", error);
              return {
                overview: "Unable to load summary",
                details: "",
                messageCount: 0,
                lastActivity: null
              };
            }
          },
        });
      },
    };
  },
};

module.exports = {
  summaryGenerator,
};