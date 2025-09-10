/**
 * Message Adapter
 * Converts legacy message formats to the new unified format
 * Ensures backward compatibility with existing message structures
 */

/**
 * Parse debug message content to extract tools and metrics
 */
function parseDebugMessage(debugContent) {
  const tools = [];
  const metrics = {};
  
  // Extract tool calls
  if (debugContent.includes('attempting to call')) {
    const toolMatch = debugContent.match(/`([^`]+)`/);
    if (toolMatch) {
      tools.push({
        name: toolMatch[1].replace(/_/g, ' ').replace(/-/g, ' '),
        status: 'pending'
      });
    }
  }
  
  if (debugContent.includes('Executing MCP server:')) {
    const serverMatch = debugContent.match(/Executing MCP server: ([^\s]+)/);
    if (serverMatch) {
      tools.push({
        name: serverMatch[1],
        status: 'active'
      });
    }
  }
  
  if (debugContent.includes('completed successfully')) {
    const serverMatch = debugContent.match(/MCP server: ([^:]+):/);
    if (serverMatch) {
      tools.push({
        name: serverMatch[1],
        status: 'complete'
      });
    }
    
    // Extract execution time if available
    const timeMatch = debugContent.match(/in (\d+\.?\d*)(ms|s)/);
    if (timeMatch) {
      metrics.time = timeMatch[2] === 'ms' 
        ? `${(parseFloat(timeMatch[1]) / 1000).toFixed(1)}s`
        : `${timeMatch[1]}s`;
    }
  }
  
  if (debugContent.includes('failed with error')) {
    const serverMatch = debugContent.match(/MCP server: ([^:]+):/);
    if (serverMatch) {
      tools.push({
        name: serverMatch[1],
        status: 'error'
      });
    }
  }
  
  return { tools, metrics };
}

/**
 * Extract thinking steps from various formats
 */
function extractThinkingSteps(message, agentStatus) {
  const steps = [];
  
  // Extract from agent status
  if (agentStatus?.thinking) {
    if (Array.isArray(agentStatus.thinking)) {
      steps.push(...agentStatus.thinking);
    } else if (typeof agentStatus.thinking === 'string') {
      steps.push(...agentStatus.thinking.split('\n').filter(s => s.trim()));
    }
  }
  
  // Extract from thought process in message
  const thoughtPattern = /<thinking>(.*?)<\/thinking>/s;
  const thoughtMatch = message?.match(thoughtPattern);
  if (thoughtMatch) {
    const thoughts = thoughtMatch[1].split('\n').filter(s => s.trim());
    steps.push(...thoughts);
  }
  
  return steps;
}

/**
 * Convert agent status to metrics
 */
function agentStatusToMetrics(agentStatus) {
  if (!agentStatus) return null;
  
  const metrics = {};
  
  if (agentStatus.duration) {
    metrics.time = agentStatus.duration;
  }
  
  if (agentStatus.model) {
    metrics.model = agentStatus.model;
  }
  
  if (agentStatus.confidence) {
    metrics.confidence = agentStatus.confidence;
  }
  
  if (agentStatus.tokens) {
    metrics.tokens = agentStatus.tokens;
  }
  
  if (agentStatus.thinkingTime) {
    metrics.thinkingTime = agentStatus.thinkingTime;
  }
  
  return Object.keys(metrics).length > 0 ? metrics : null;
}

/**
 * Convert tools from various formats
 */
function normalizeTools(tools, agentStatus, debugInfo) {
  const normalizedTools = [];
  
  // From direct tools prop
  if (Array.isArray(tools)) {
    tools.forEach(tool => {
      if (typeof tool === 'string') {
        normalizedTools.push({ name: tool, status: 'complete' });
      } else if (tool.name) {
        normalizedTools.push(tool);
      }
    });
  }
  
  // From agent status
  if (agentStatus?.tools) {
    agentStatus.tools.forEach(tool => {
      if (typeof tool === 'string') {
        normalizedTools.push({ name: tool, status: 'complete' });
      } else {
        normalizedTools.push(tool);
      }
    });
  }
  
  // From debug info
  if (debugInfo) {
    const { tools: debugTools } = parseDebugMessage(debugInfo);
    normalizedTools.push(...debugTools);
  }
  
  // Remove duplicates
  const uniqueTools = [];
  const seen = new Set();
  normalizedTools.forEach(tool => {
    const key = tool.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueTools.push(tool);
    }
  });
  
  return uniqueTools;
}

/**
 * Main adapter function
 * Converts legacy message formats to unified format
 */
export function adaptLegacyMessage({
  message,
  debugInfo,
  agentStatus,
  tools,
  metrics,
  thinking
}) {
  // Start with base structure
  const adapted = {
    content: message || '',
    tools: [],
    metrics: null,
    thinking: []
  };
  
  // Handle debug messages
  if (debugInfo) {
    const debugData = parseDebugMessage(debugInfo);
    adapted.tools.push(...debugData.tools);
    adapted.metrics = { ...adapted.metrics, ...debugData.metrics };
    
    // Convert debug message to more user-friendly content
    if (debugInfo.includes('attempting to call')) {
      adapted.content = 'Preparing to execute tool...';
    } else if (debugInfo.includes('Executing MCP server')) {
      adapted.content = 'Running operation...';
    } else if (debugInfo.includes('completed successfully')) {
      adapted.content = 'Operation completed successfully';
    } else if (debugInfo.includes('failed with error')) {
      const errorMatch = debugInfo.match(/error: (.+)$/);
      adapted.content = `Operation failed: ${errorMatch ? errorMatch[1] : 'Unknown error'}`;
    }
  }
  
  // Normalize tools from all sources
  adapted.tools = normalizeTools(tools, agentStatus, debugInfo);
  
  // Convert agent status to metrics
  const agentMetrics = agentStatusToMetrics(agentStatus);
  if (agentMetrics) {
    adapted.metrics = { ...adapted.metrics, ...agentMetrics };
  }
  
  // Use provided metrics if available
  if (metrics) {
    adapted.metrics = { ...adapted.metrics, ...metrics };
  }
  
  // Extract thinking steps
  const thinkingSteps = thinking || extractThinkingSteps(message, agentStatus);
  if (thinkingSteps && thinkingSteps.length > 0) {
    adapted.thinking = thinkingSteps;
  }
  
  return adapted;
}

/**
 * Check if a message needs adaptation
 */
export function needsAdaptation(message) {
  return !!(
    message.debugInfo ||
    message.agentStatus ||
    message.type === 'debug' ||
    message.type === 'agent'
  );
}

/**
 * Extract metrics from a streaming response
 */
export function extractStreamingMetrics(chunk) {
  const metrics = {};
  
  // Look for execution time
  const timeMatch = chunk.match(/\[time: (\d+\.?\d*)s\]/);
  if (timeMatch) {
    metrics.time = `${timeMatch[1]}s`;
  }
  
  // Look for model info
  const modelMatch = chunk.match(/\[model: ([^\]]+)\]/);
  if (modelMatch) {
    metrics.model = modelMatch[1];
  }
  
  // Look for confidence
  const confMatch = chunk.match(/\[confidence: (\d+)%?\]/);
  if (confMatch) {
    metrics.confidence = parseInt(confMatch[1]);
  }
  
  return Object.keys(metrics).length > 0 ? metrics : null;
}

/**
 * Extract tools from a streaming response
 */
export function extractStreamingTools(chunk) {
  const tools = [];
  
  // Look for tool invocations
  const toolPattern = /\[tool: ([^\]]+)\]/g;
  let match;
  while ((match = toolPattern.exec(chunk)) !== null) {
    tools.push({
      name: match[1],
      status: 'active'
    });
  }
  
  return tools;
}