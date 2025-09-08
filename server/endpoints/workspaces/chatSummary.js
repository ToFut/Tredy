const { Workspace } = require("../../models/workspace");
const { WorkspaceChats } = require("../../models/workspaceChats");
const { WorkspaceThread } = require("../../models/workspaceThread");
const { validatedRequest } = require("../../utils/middleware/validatedRequest");
const { getLLMProvider } = require("../../utils/helpers");
const { reqBody, safeJsonParse } = require("../../utils/http");
const { getCachedSummary: getAutoSummary, generateAutoSummary } = require("../../utils/chats/summaryGenerator");

function chatSummaryEndpoints(app) {
  if (!app) return;

  // Generate summary for a workspace or thread
  app.post(
    "/workspace/:slug/chat-summary",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { threadSlug = null, forceRefresh = false } = reqBody(request);
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          response.status(404).json({ error: "Workspace not found" });
          return;
        }

        // Get thread if threadSlug provided
        let threadId = null;
        if (threadSlug) {
          const thread = await WorkspaceThread.get({ slug: threadSlug, workspace_id: workspace.id });
          threadId = thread?.id || null;
        }

        // Get recent chat history
        const chats = await WorkspaceChats.where(
          {
            workspaceId: workspace.id,
            thread_id: threadId,
            include: true
          },
          50, // Last 50 messages
          { id: "desc" }
        );

        if (!chats || chats.length === 0) {
          response.status(200).json({
            summary: {
              brief: "No conversations yet",
              topics: [],
              keyPoints: [],
              lastActivity: null,
              messageCount: 0,
              actionItems: [],
              sentiment: "neutral"
            }
          });
          return;
        }

        // Check cache if not forcing refresh
        if (!forceRefresh) {
          const cached = await getCachedSummary(workspace.id, threadId);
          if (cached && cached.timestamp > Date.now() - 30 * 60 * 1000) { // 30 min cache
            response.status(200).json({ summary: cached.summary });
            return;
          }
        }

        // Generate summary using LLM
        const summary = await generateSummary(workspace, chats.reverse()); // Reverse to chronological order
        
        // Cache the summary
        await cacheSummary(workspace.id, threadId, summary);

        response.status(200).json({ summary });
      } catch (error) {
        console.error("Error generating chat summary:", error);
        response.status(500).json({ error: "Failed to generate summary" });
      }
    }
  );

  // Get summary for hover tooltip (lightweight)
  app.get(
    "/workspace/:slug/quick-summary",
    [validatedRequest],
    async (request, response) => {
      try {
        const { slug } = request.params;
        const { threadSlug = null } = request.query;
        const workspace = await Workspace.get({ slug });

        if (!workspace) {
          response.status(404).json({ error: "Workspace not found" });
          return;
        }

        // Get thread if threadSlug provided
        let threadId = null;
        if (threadSlug) {
          const thread = await WorkspaceThread.get({ slug: threadSlug, workspace_id: workspace.id });
          threadId = thread?.id || null;
        }

        // Try to get auto-generated summary from cache first
        const autoSummary = getAutoSummary(workspace.id, threadId);
        if (autoSummary) {
          response.status(200).json({ 
            summary: autoSummary
          });
          return;
        }

        // If no cache, generate it now
        const summary = await generateAutoSummary(workspace, threadId);
        if (summary) {
          response.status(200).json({ summary });
          return;
        }

        // Fallback to quick stats if generation fails
        const stats = await getQuickStats(workspace.id, threadId);
        response.status(200).json({ summary: stats });
      } catch (error) {
        console.error("Error getting quick summary:", error);
        response.status(500).json({ error: "Failed to get summary" });
      }
    }
  );
}

async function generateSummary(workspace, chats) {
  try {
    const LLMConnector = getLLMProvider({
      provider: workspace?.chatProvider,
      model: workspace?.chatModel,
    });

    // Format last 15 messages for concise summary
    const recentChats = chats.slice(-15);
    const chatText = recentChats
      .map(chat => {
        const role = chat.user_id ? "User" : "Assistant";
        const response = safeJsonParse(chat.response, {});
        const text = chat.prompt || response.text || "";
        // Limit each message to 150 chars for brevity
        return `${role}: ${text.substring(0, 150)}`;
      })
      .filter(line => line.includes(": ") && line.split(": ")[1].trim().length > 0)
      .join("\n");

    const prompt = `Analyze this conversation and provide a VERY CONCISE summary (100 words MAX total):

${chatText}

Return a JSON with this EXACT structure:
{
  "overview": "One sentence describing the main topic/purpose (max 50 words)",
  "details": "2-3 bullet points of key actions or decisions (max 50 words total)",
  "topics": ["topic1", "topic2", "topic3"],
  "messageCount": ${chats.length}
}

Be EXTREMELY concise. Total summary must be under 100 words.`;

    const response = await LLMConnector.getChatCompletion(
      [{ role: "system", content: "You are a concise summarizer. Maximum 100 words total. Be extremely brief." }],
      prompt,
      workspace
    );

    // Parse the JSON response
    let summary;
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      summary = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
    } catch (parseError) {
      console.error("Failed to parse LLM response:", parseError);
      summary = {
        overview: "Ongoing conversation",
        details: "",
        topics: [],
        messageCount: chats.length
      };
    }

    // Ensure brevity
    if (summary.overview) {
      summary.overview = summary.overview.substring(0, 100);
    }
    if (summary.details) {
      summary.details = summary.details.substring(0, 150);
    }

    // Add metadata
    summary.lastActivity = chats[chats.length - 1]?.createdAt || new Date();
    summary.messageCount = chats.length;

    return summary;
  } catch (error) {
    console.error("Error in generateSummary:", error);
    return {
      overview: "Failed to generate summary",
      details: "",
      topics: [],
      lastActivity: new Date(),
      messageCount: chats.length
    };
  }
}

async function getQuickStats(workspaceId, threadId) {
  const count = await WorkspaceChats.count({
    workspaceId,
    thread_id: threadId,
    include: true
  });

  const lastChat = await WorkspaceChats.get(
    {
      workspaceId,
      thread_id: threadId,
      include: true
    },
    1,
    { id: "desc" }
  );

  return {
    brief: `${count} messages exchanged`,
    lastActivity: lastChat?.createdAt || null,
    messageCount: count,
    topics: []
  };
}

// Simple in-memory cache for summaries
const summaryCache = new Map();

async function getCachedSummary(workspaceId, threadId) {
  const key = `${workspaceId}-${threadId || 'main'}`;
  return summaryCache.get(key);
}

async function cacheSummary(workspaceId, threadId, summary) {
  const key = `${workspaceId}-${threadId || 'main'}`;
  summaryCache.set(key, {
    summary,
    timestamp: Date.now()
  });
  
  // Clean old cache entries
  if (summaryCache.size > 100) {
    const oldestKey = summaryCache.keys().next().value;
    summaryCache.delete(oldestKey);
  }
}

module.exports = { chatSummaryEndpoints };