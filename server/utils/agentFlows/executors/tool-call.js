/**
 * Execute a tool call flow step - calls MCP/Agent tools
 * @param {Object} config Flow step configuration  
 * @param {{introspect: Function, logger: Function, aibitat: Object}} context Execution context
 * @returns {Promise<string>} Tool result
 */
async function executeToolCall(config, context) {
  const { toolName, parameters = {}, resultVariable } = config;
  const { introspect, logger, aibitat } = context;
  
  logger(
    `\x1b[43m[AgentFlowToolExecutor]\x1b[0m - executing Tool Call: ${toolName}`
  );
  introspect(`Calling tool: ${toolName}...`);

  try {
    if (!aibitat) {
      throw new Error("Agent context (aibitat) not available for tool execution");
    }

    // Get the function from aibitat
    const fn = aibitat.functions.get(toolName);
    if (!fn) {
      const availableFunctions = Array.from(aibitat.functions.keys()).slice(0, 10);
      throw new Error(`Tool "${toolName}" not found. Available: ${availableFunctions.join(', ')}${aibitat.functions.size > 10 ? '...' : ''}`);
    }

    logger(`Executing tool "${toolName}" with parameters:`, parameters);
    introspect(`Executing ${toolName}...`);

    // Call the tool handler directly
    const result = await fn.handler(parameters);
    
    introspect(`Tool ${toolName} completed successfully`);
    
    if (resultVariable) {
      config.resultVariable = resultVariable;
    }
    
    // Return result as string
    return typeof result === "string" ? result : JSON.stringify(result);
    
  } catch (error) {
    logger(`Tool call failed: ${error.message}`, error);
    throw new Error(`Tool "${toolName}" failed: ${error.message}`);
  }
}

module.exports = executeToolCall;