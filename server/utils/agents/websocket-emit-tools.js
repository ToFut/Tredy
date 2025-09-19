/**
 * WebSocket Tool Emission Helper
 * Adds real-time tool updates to existing WebSocket connection
 */

class WebSocketToolEmitter {
  constructor(socket) {
    this.socket = socket;
    this.messageId = null;
  }

  /**
   * Emit when tools are detected
   */
  emitToolDetection(messageId, tools) {
    this.messageId = messageId;
    this.socket.emit(`tool_executing_${messageId}`, {
      tools: tools.map((t) => ({
        name: this.cleanToolName(t),
        status: "preparing",
      })),
    });
  }

  /**
   * Emit when tool starts executing
   */
  emitToolExecution(toolName) {
    if (!this.messageId) return;

    this.socket.emit(`tool_executing_${this.messageId}`, {
      tools: [
        {
          name: this.cleanToolName(toolName),
          status: "executing",
        },
      ],
    });

    // Also track in ThinkingTracker if available
    if (this.thinkingTracker) {
      this.thinkingTracker.trackToolUse(toolName);
    }
  }

  /**
   * Emit when tool completes with AI-structured data
   */
  async emitToolComplete(toolName, result) {
    if (!this.messageId) return;

    // Get structured data from AI if LLM is available
    let structured = null;
    if (this.llmProvider) {
      structured = await this.getAIStructuredResponse(toolName, result);
    }

    this.socket.emit(`tool_executing_${this.messageId}`, {
      tools: [
        {
          name: this.cleanToolName(toolName),
          status: "complete",
          result: result,
          structured: structured, // AI-generated metadata
        },
      ],
    });

    // Track completion in ThinkingTracker if available
    if (this.thinkingTracker) {
      this.thinkingTracker.trackToolUse(toolName, null, result);
    }
  }

  /**
   * Get AI to structure the tool response
   */
  async getAIStructuredResponse(toolName, result) {
    try {
      // Use the same LLM that's running the agent
      const response = await this.llmProvider.getChatCompletion(
        [
          {
            role: "system",
            content: `Extract structured data from tool execution results. Return ONLY valid JSON with these fields:
- displayName: user-friendly name
- icon: emoji representation
- action: what happened (sent/created/fetched/etc)
- target: what was affected
- summary: one-line description
- highlights: array of {label, value} for key details`,
          },
          {
            role: "user",
            content: `Tool: ${toolName}\nResult: ${JSON.stringify(result).substring(0, 500)}`,
          },
        ],
        {
          temperature: 0,
          response_format: { type: "json_object" },
        }
      );

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.log("Failed to get AI structured response:", error);
      return null;
    }
  }

  /**
   * Emit metrics after completion
   */
  emitMetrics(metrics) {
    if (!this.messageId) return;

    // Extract relevant metrics
    const cleanMetrics = {
      time: this.formatTime(metrics.duration || metrics.time),
      model: this.formatModel(metrics.model || metrics.provider),
      cost: metrics.cost,
      confidence: metrics.confidence,
      tokens: metrics.tokens,
      thinking: metrics.thinking || [],
    };

    this.socket.emit(`metrics_${this.messageId}`, cleanMetrics);
  }

  /**
   * Clean tool name for display
   */
  cleanToolName(toolName) {
    return toolName
      .replace(/^MCP::/, "")
      .replace(/_ws\d+/, "")
      .replace(/[_-]/g, " ")
      .trim();
  }

  /**
   * Format time for display
   */
  formatTime(time) {
    if (!time) return null;

    if (typeof time === "number") {
      return time < 1000 ? `${time}ms` : `${(time / 1000).toFixed(1)}s`;
    }

    return time;
  }

  /**
   * Format model name
   */
  formatModel(model) {
    if (!model) return null;

    const modelMap = {
      "gpt-4o": "GPT-4",
      "gpt-3.5-turbo": "GPT-3.5",
      "claude-3-opus": "Claude 3",
      "claude-3-sonnet": "Claude 3",
      "gemini-pro": "Gemini Pro",
    };

    return modelMap[model] || model;
  }
}

/**
 * Integration with existing agent handler
 */
function enhanceAgentHandler(agentHandler, socket) {
  const emitter = new WebSocketToolEmitter(socket);

  // Inject thinkingTracker reference into emitter
  emitter.thinkingTracker = agentHandler.thinkingTracker;

  // Inject LLM provider for structured responses
  emitter.llmProvider = agentHandler.llm || agentHandler.provider;

  // Hook into agent lifecycle
  const originalRun = agentHandler.run;

  agentHandler.run = async function (...args) {
    const messageId = agentHandler.invocationId;

    // Emit tool detection
    if (agentHandler.tools && agentHandler.tools.length > 0) {
      emitter.emitToolDetection(messageId, agentHandler.tools);
    }

    // Hook into tool execution
    const originalCallTool = agentHandler.callTool;
    agentHandler.callTool = async function (toolName, ...toolArgs) {
      emitter.emitToolExecution(toolName);

      try {
        const result = await originalCallTool.call(this, toolName, ...toolArgs);
        emitter.emitToolComplete(toolName, result);
        return result;
      } catch (error) {
        emitter.emitToolComplete(toolName, { error: error.message });
        throw error;
      }
    };

    // Run original handler
    const result = await originalRun.call(this, ...args);

    // Emit final metrics
    if (agentHandler.metrics) {
      emitter.emitMetrics(agentHandler.metrics);
    }

    // Emit ThinkingTracker metrics if available
    if (agentHandler.thinkingTracker) {
      const displayData = agentHandler.thinkingTracker.getDisplayData();
      emitter.emitMetrics({
        time: displayData.duration,
        thinking: displayData.thoughtProcess,
        model: displayData.modelsUsed[0]?.model,
        confidence: displayData.confidence?.score,
        tools: displayData.toolsUsed,
        cost: null, // Could be calculated if needed
      });
    }

    return result;
  };

  return agentHandler;
}

module.exports = {
  WebSocketToolEmitter,
  enhanceAgentHandler,
};
