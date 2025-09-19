import { useState, useEffect, useRef } from "react";

/**
 * Hook to parse and manage agent debug messages into structured operations
 */
export function useAgentOperations(debugMessages = []) {
  const [operations, setOperations] = useState([]);
  const operationMap = useRef(new Map());

  useEffect(() => {
    const parseDebugMessages = () => {
      const newOperations = [];

      debugMessages.forEach((message, index) => {
        const operation = parseDebugMessage(message, index);
        if (operation) {
          // Check if this is an update to existing operation
          const existingOp = operationMap.current.get(operation.toolId);
          if (existingOp) {
            // Update existing operation
            Object.assign(existingOp, operation);
          } else {
            // Add new operation
            operationMap.current.set(operation.toolId, operation);
            newOperations.push(operation);
          }
        }
      });

      // Convert map to array for display
      setOperations(Array.from(operationMap.current.values()));
    };

    parseDebugMessages();
  }, [debugMessages]);

  return { operations };
}

/**
 * Parse a debug message into a structured operation object
 */
function parseDebugMessage(message, index) {
  if (!message || typeof message !== "string") return null;

  // Parse different types of debug messages
  if (message.includes("@agent is attempting to call")) {
    return parseAttemptMessage(message, index);
  } else if (message.includes("Executing MCP server:")) {
    return parseExecutionMessage(message, index);
  } else if (message.includes("completed successfully")) {
    return parseCompletionMessage(message, index);
  } else if (message.includes("failed") || message.includes("error")) {
    return parseErrorMessage(message, index);
  }

  return null;
}

/**
 * Parse attempt messages: "@agent is attempting to call `tool-name` tool"
 */
function parseAttemptMessage(message, index) {
  const toolMatch = message.match(/`([^`]+)`/);
  const tool = toolMatch ? toolMatch[1] : "unknown";

  return {
    id: `attempt-${index}`,
    toolId: tool,
    name: tool.replace(/-/g, " "),
    tool: extractToolCategory(tool),
    status: "pending",
    description: "Preparing to execute tool",
    timestamp: Date.now(),
    type: "attempt",
    tags: ["tool-call"],
  };
}

/**
 * Parse execution messages: "Executing MCP server: tool-name with {...}"
 */
function parseExecutionMessage(message, index) {
  const serverMatch = message.match(/Executing MCP server: ([^\s]+)/);
  const server = serverMatch ? serverMatch[1] : "unknown";

  // Try to extract parameters
  let params = null;
  try {
    const paramsMatch = message.match(/with (.+)$/);
    if (paramsMatch) {
      params = JSON.parse(paramsMatch[1]);
    }
  } catch (e) {
    // Ignore JSON parse errors
  }

  return {
    id: `exec-${index}`,
    toolId: server,
    name: server.replace(/-/g, " "),
    tool: extractToolCategory(server),
    status: "running",
    description: "Executing operation...",
    params: params,
    timestamp: Date.now(),
    type: "execution",
    tags: ["mcp-server", "executing"],
  };
}

/**
 * Parse completion messages: "MCP server: tool-name completed successfully"
 */
function parseCompletionMessage(message, index) {
  const serverMatch = message.match(/MCP server: ([^:]+):/);
  const server = serverMatch ? serverMatch[1] : "unknown";

  return {
    id: `complete-${index}`,
    toolId: server,
    name: server.replace(/-/g, " "),
    tool: extractToolCategory(server),
    status: "success",
    description: "Operation completed successfully",
    timestamp: Date.now(),
    type: "completion",
    tags: ["completed", "success"],
  };
}

/**
 * Parse error messages
 */
function parseErrorMessage(message, index) {
  const serverMatch = message.match(/MCP server: ([^:]+):/);
  const server = serverMatch ? serverMatch[1] : "unknown";

  return {
    id: `error-${index}`,
    toolId: server,
    name: server.replace(/-/g, " "),
    tool: extractToolCategory(server),
    status: "error",
    description: "Operation failed",
    response: message,
    timestamp: Date.now(),
    type: "error",
    tags: ["error", "failed"],
  };
}

/**
 * Extract tool category from tool name
 */
function extractToolCategory(tool) {
  if (tool.includes("linkedin")) return "universal-linkedin";
  if (tool.includes("database") || tool.includes("db")) return "database";
  if (tool.includes("api") || tool.includes("http")) return "api";
  if (tool.includes("code") || tool.includes("script")) return "code";
  if (tool.includes("mcp")) return "mcp-server";
  return "default";
}

/**
 * Mock operations for testing/demo
 */
export const mockOperations = [
  {
    id: "1",
    toolId: "universal-linkedin-universal_request",
    name: "LinkedIn Profile Request",
    tool: "universal-linkedin",
    status: "success",
    description: "GET /v2/people/~",
    params: {
      method: "GET",
      endpoint: "/v2/people/~",
      provider: "linkedin",
    },
    response: { id: "user123", firstName: "John", lastName: "Doe" },
    duration: 1250,
    timestamp: Date.now() - 5000,
    tags: ["linkedin", "profile"],
  },
  {
    id: "2",
    toolId: "universal-linkedin-universal_request",
    name: "LinkedIn Extended Profile",
    tool: "universal-linkedin",
    status: "running",
    description: "GET /v2/people/~ with projection",
    params: {
      method: "GET",
      endpoint: "/v2/people/~",
      params: { projection: "(id,first-name,last-name,email-address)" },
      provider: "linkedin",
    },
    timestamp: Date.now(),
    tags: ["linkedin", "profile", "extended"],
  },
  {
    id: "3",
    toolId: "database-query",
    name: "Database Query",
    tool: "database",
    status: "pending",
    description: "Querying user preferences",
    timestamp: Date.now() + 1000,
    tags: ["database", "query"],
  },
];
