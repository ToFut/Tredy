/**
 * ThinkingTracker - Captures and streams agent thinking process
 * Similar to how Claude shows its process, we'll capture everything the agent does
 */

class ThinkingTracker {
  constructor(invocationId, workspaceId) {
    this.invocationId = invocationId;
    this.workspaceId = workspaceId;
    this.startTime = Date.now();
    this.events = [];
    this.metrics = {
      thinkingDuration: 0,
      toolsUsed: [],
      modelsUsed: new Set(),
      tokensUsed: 0,
      confidence: null,
      workflowsTriggered: [],
      errors: [],
      retries: 0
    };
    this.currentThought = null;
    this.socket = null;
  }

  setSocket(socket) {
    this.socket = socket;
  }

  // Start tracking a new thought/reasoning step
  startThinking(context) {
    this.currentThought = {
      id: `thought_${Date.now()}`,
      type: 'thinking',
      content: context,
      startTime: Date.now(),
      status: 'in_progress'
    };
    
    this.emit('thinking_start', {
      id: this.currentThought.id,
      content: context,
      timestamp: new Date().toISOString()
    });
    
    return this.currentThought.id;
  }

  // Log intermediate thinking steps
  logThought(content, metadata = {}) {
    const event = {
      id: `step_${Date.now()}`,
      type: 'thought_step',
      content,
      metadata,
      timestamp: Date.now()
    };
    
    this.events.push(event);
    this.emit('thought_step', event);
  }

  // End current thinking session
  endThinking(thoughtId, result = null) {
    if (this.currentThought && this.currentThought.id === thoughtId) {
      this.currentThought.endTime = Date.now();
      this.currentThought.duration = this.currentThought.endTime - this.currentThought.startTime;
      this.currentThought.status = 'completed';
      this.currentThought.result = result;
      
      this.metrics.thinkingDuration += this.currentThought.duration;
      
      this.emit('thinking_end', {
        id: thoughtId,
        duration: this.currentThought.duration,
        result: result
      });
      
      this.events.push(this.currentThought);
      this.currentThought = null;
    }
  }

  // Track tool usage
  trackToolUse(toolName, input, output = null, duration = null) {
    const toolEvent = {
      id: `tool_${Date.now()}`,
      type: 'tool_use',
      tool: toolName,
      input,
      output,
      duration,
      timestamp: Date.now()
    };
    
    this.events.push(toolEvent);
    this.metrics.toolsUsed.push({
      name: toolName,
      timestamp: toolEvent.timestamp,
      duration
    });
    
    this.emit('tool_use', {
      tool: toolName,
      status: output ? 'completed' : 'started',
      duration
    });
    
    return toolEvent.id;
  }

  // Track workflow execution
  trackWorkflow(workflowId, workflowName, status = 'started') {
    const workflowEvent = {
      id: `workflow_${Date.now()}`,
      type: 'workflow',
      workflowId,
      workflowName,
      status,
      timestamp: Date.now()
    };
    
    this.events.push(workflowEvent);
    
    if (status === 'started') {
      this.metrics.workflowsTriggered.push({
        id: workflowId,
        name: workflowName,
        startTime: workflowEvent.timestamp
      });
    }
    
    this.emit('workflow_update', {
      workflowId,
      workflowName,
      status
    });
  }

  // Track model usage
  trackModelUse(model, provider, tokens = 0) {
    this.metrics.modelsUsed.add(`${provider}:${model}`);
    this.metrics.tokensUsed += tokens;
    
    const modelEvent = {
      id: `model_${Date.now()}`,
      type: 'model_use',
      model,
      provider,
      tokens,
      timestamp: Date.now()
    };
    
    this.events.push(modelEvent);
    
    this.emit('model_use', {
      model,
      provider,
      tokens,
      totalTokens: this.metrics.tokensUsed
    });
  }

  // Track errors and retries
  trackError(error, context = null) {
    const errorEvent = {
      id: `error_${Date.now()}`,
      type: 'error',
      error: error.message || error,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };
    
    this.events.push(errorEvent);
    this.metrics.errors.push(errorEvent);
    
    this.emit('error', {
      error: error.message || error,
      context
    });
  }

  trackRetry(action, attempt) {
    this.metrics.retries++;
    
    const retryEvent = {
      id: `retry_${Date.now()}`,
      type: 'retry',
      action,
      attempt,
      timestamp: Date.now()
    };
    
    this.events.push(retryEvent);
    
    this.emit('retry', {
      action,
      attempt,
      totalRetries: this.metrics.retries
    });
  }

  // Set confidence score
  setConfidence(score, reasoning = null) {
    this.metrics.confidence = {
      score,
      reasoning,
      timestamp: Date.now()
    };
    
    this.emit('confidence', {
      score,
      reasoning
    });
  }

  // Emit events to WebSocket
  emit(eventType, data) {
    if (this.socket && this.socket.readyState === 1) {
      this.socket.send(JSON.stringify({
        type: 'thinking_process',
        eventType,
        data,
        invocationId: this.invocationId,
        timestamp: new Date().toISOString()
      }));
    }
    
    // Also log to console for debugging
    console.log(`[ThinkingTracker] ${eventType}:`, data);
  }

  // Get complete session summary
  getSummary() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    return {
      invocationId: this.invocationId,
      workspaceId: this.workspaceId,
      startTime: this.startTime,
      endTime,
      totalDuration,
      metrics: {
        ...this.metrics,
        modelsUsed: Array.from(this.metrics.modelsUsed),
        eventCount: this.events.length
      },
      events: this.events
    };
  }

  // Get formatted display data for UI
  getDisplayData() {
    const summary = this.getSummary();
    
    return {
      duration: this.formatDuration(summary.totalDuration),
      thinkingTime: this.formatDuration(this.metrics.thinkingDuration),
      toolsUsed: this.metrics.toolsUsed.map(t => ({
        name: t.name,
        icon: this.getToolIcon(t.name),
        duration: t.duration ? this.formatDuration(t.duration) : null
      })),
      workflowCount: this.metrics.workflowsTriggered.length,
      workflows: this.metrics.workflowsTriggered,
      modelsUsed: Array.from(this.metrics.modelsUsed).map(m => {
        const [provider, model] = m.split(':');
        return {
          provider,
          model,
          icon: this.getProviderIcon(provider)
        };
      }),
      tokensUsed: this.formatTokens(this.metrics.tokensUsed),
      confidence: this.metrics.confidence,
      errorCount: this.metrics.errors.length,
      retryCount: this.metrics.retries,
      // Expandable thought process
      thoughtProcess: this.formatThoughtProcess()
    };
  }

  // Format thought process for display
  formatThoughtProcess() {
    return this.events.map(event => {
      switch(event.type) {
        case 'thinking':
          return {
            type: 'thinking',
            content: event.content,
            duration: event.duration,
            timestamp: event.timestamp,
            icon: '🤔'
          };
        case 'thought_step':
          return {
            type: 'step',
            content: event.content,
            metadata: event.metadata,
            timestamp: event.timestamp,
            icon: '💭'
          };
        case 'tool_use':
          return {
            type: 'tool',
            tool: event.tool,
            input: event.input,
            output: event.output,
            duration: event.duration,
            timestamp: event.timestamp,
            icon: this.getToolIcon(event.tool)
          };
        case 'workflow':
          return {
            type: 'workflow',
            name: event.workflowName,
            status: event.status,
            timestamp: event.timestamp,
            icon: '⚡'
          };
        case 'model_use':
          return {
            type: 'model',
            model: event.model,
            provider: event.provider,
            tokens: event.tokens,
            timestamp: event.timestamp,
            icon: '🧠'
          };
        case 'error':
          return {
            type: 'error',
            error: event.error,
            context: event.context,
            timestamp: event.timestamp,
            icon: '⚠️'
          };
        case 'retry':
          return {
            type: 'retry',
            action: event.action,
            attempt: event.attempt,
            timestamp: event.timestamp,
            icon: '🔄'
          };
        default:
          return event;
      }
    });
  }

  // Helper methods
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  }

  formatTokens(count) {
    if (count < 1000) return count.toString();
    return `${(count / 1000).toFixed(1)}k`;
  }

  getToolIcon(toolName) {
    const icons = {
      'web-search': '🌐',
      'web-scraping': '🔍',
      'document-summarizer': '📄',
      'rag-memory': '🧠',
      'sql-query': '🗄️',
      'create-chart': '📊',
      'stock-market': '📈',
      'create-workflow': '⚡',
      'filesystem': '📁',
      'puppeteer': '🎭',
      'gmail': '📧',
      'calendar': '📅',
      'linkedin': '💼'
    };
    return icons[toolName] || '🔧';
  }

  getProviderIcon(provider) {
    const icons = {
      'openai': '🤖',
      'anthropic': '🎭',
      'google': '🔮',
      'togetherai': '🤝',
      'groq': '⚡',
      'ollama': '🦙',
      'azure': '☁️'
    };
    return icons[provider] || '🤖';
  }
}

module.exports = { ThinkingTracker };