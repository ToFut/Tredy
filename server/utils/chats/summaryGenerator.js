const { WorkspaceChats } = require("../../models/workspaceChats");
const { getLLMProvider } = require("../helpers");
const { safeJsonParse } = require("../http");

// Cache for summaries (workspace-thread as key)
const summaryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

/**
 * Generate a concise summary after a message is sent
 * This runs in the background to not block the chat response
 */
async function generateAutoSummary(workspace, threadId = null) {
  try {
    const cacheKey = `${workspace.id}-${threadId || 'main'}`;
    
    // Get recent messages
    const chats = await WorkspaceChats.where(
      {
        workspaceId: workspace.id,
        thread_id: threadId,
        include: true
      },
      20, // Last 20 messages
      { id: "desc" }
    );

    if (!chats || chats.length === 0) {
      return null;
    }

    // Reverse to chronological order
    const chronologicalChats = chats.reverse();

    // Format last 10 messages for AI analysis
    const chatText = chronologicalChats
      .slice(-10)
      .map(chat => {
        const role = chat.user_id ? "User" : "Assistant";
        const response = safeJsonParse(chat.response, {});
        const text = chat.prompt || response.text || "";
        return `${role}: ${text.substring(0, 150)}`; // Limit each message
      })
      .filter(line => line.length > 10)
      .join("\n");

    if (!chatText) return null;

    // Get LLM provider
    const LLMConnector = getLLMProvider({
      provider: workspace?.chatProvider,
      model: workspace?.chatModel,
    });

    // Generate concise summary (100 words max)
    const prompt = `Analyze this conversation and provide a VERY CONCISE summary (100 words MAX):

${chatText}

Format your response EXACTLY like this:
OVERVIEW: [One sentence main topic/purpose - max 15 words]
DETAILS: [2-3 key points or actions - max 30 words total]

Be EXTREMELY brief and direct.`;

    const response = await LLMConnector.getChatCompletion(
      [
        {
          role: "system",
          content: "You are a ultra-concise summarizer. Maximum 100 words total. Be extremely brief."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      workspace
    );

    // Parse response
    const overviewMatch = response.match(/OVERVIEW:\s*(.+?)(?=DETAILS:|$)/s);
    const detailsMatch = response.match(/DETAILS:\s*(.+?)$/s);
    
    const summary = {
      overview: overviewMatch ? overviewMatch[1].trim().substring(0, 100) : "Ongoing conversation",
      details: detailsMatch ? detailsMatch[1].trim().substring(0, 150) : "",
      messageCount: await WorkspaceChats.count({
        workspaceId: workspace.id,
        thread_id: threadId,
        include: true
      }),
      lastActivity: new Date(),
      topics: extractTopics(chatText)
    };

    // Cache the summary
    summaryCache.set(cacheKey, {
      summary,
      timestamp: Date.now()
    });

    // Clean old cache entries
    cleanCache();

    return summary;
  } catch (error) {
    console.error("Error generating auto summary:", error);
    return null;
  }
}

/**
 * Get cached summary if available and fresh
 */
function getCachedSummary(workspaceId, threadId = null) {
  const cacheKey = `${workspaceId}-${threadId || 'main'}`;
  const cached = summaryCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.summary;
  }
  
  return null;
}

/**
 * Extract topics from chat text
 */
function extractTopics(text) {
  const topics = [];
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const stopWords = new Set(['that', 'this', 'with', 'from', 'have', 'will', 'your', 'what', 'when', 'where', 'which', 'would', 'could', 'should', 'user', 'assistant']);
  
  const wordCounts = {};
  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // Get top 3 most frequent words as topics
  Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([word]) => {
      topics.push(word.charAt(0).toUpperCase() + word.slice(1));
    });
  
  return topics;
}

/**
 * Clean old cache entries
 */
function cleanCache() {
  if (summaryCache.size > 50) {
    const entriesToDelete = [];
    const now = Date.now();
    
    for (const [key, value] of summaryCache.entries()) {
      if (now - value.timestamp > CACHE_TTL * 2) {
        entriesToDelete.push(key);
      }
    }
    
    entriesToDelete.forEach(key => summaryCache.delete(key));
  }
}

/**
 * Invalidate cache for a workspace/thread
 */
function invalidateCache(workspaceId, threadId = null) {
  const cacheKey = `${workspaceId}-${threadId || 'main'}`;
  summaryCache.delete(cacheKey);
}

module.exports = {
  generateAutoSummary,
  getCachedSummary,
  invalidateCache
};