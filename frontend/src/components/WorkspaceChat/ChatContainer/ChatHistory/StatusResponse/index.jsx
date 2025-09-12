import React, { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import AgenticThinking from "@/components/AgenticThinking";

/**
 * Extract structured tool results from [TOOL_RESULT] blocks
 */
function extractToolResult(content) {
  if (!content) return null;
  
  // Look for [TOOL_RESULT] blocks in the content
  const toolResultMatch = content.match(/\[TOOL_RESULT\]([\s\S]*?)\[\/TOOL_RESULT\]/);
  if (toolResultMatch) {
    try {
      return JSON.parse(toolResultMatch[1]);
    } catch (e) {
      console.log("Failed to parse TOOL_RESULT:", e);
    }
  }
  return null;
}

/**
 * Parse debug messages into clean tool information
 */
function parseDebugToToolInfo(content) {
  if (!content) return null;
  
  // First try to extract structured TOOL_RESULT
  const toolResult = extractToolResult(content);
  if (toolResult) {
    return {
      type: toolResult.status === 'success' ? 'complete' : 'failed',
      tool: toolResult.displayName || toolResult.tool,
      message: toolResult.summary,
      structured: toolResult
    };
  }
  
  // Tool call attempt
  if (content.includes('[debug]:') && content.includes('attempting to call')) {
    const toolMatch = content.match(/`([^`]+)`/);
    const tool = toolMatch ? toolMatch[1] : '';
    return {
      type: 'preparing',
      tool: formatToolName(tool),
      message: `Preparing ${formatToolName(tool)}...`
    };
  }
  
  // MCP server execution
  if (content.includes('Executing MCP server:')) {
    const serverMatch = content.match(/Executing MCP server: ([^\s]+)/);
    const server = serverMatch ? serverMatch[1] : '';
    return {
      type: 'executing',
      tool: formatToolName(server),
      message: `Using ${formatToolName(server)}...`
    };
  }
  
  // Completion - handle both formats
  if (content.includes('completed successfully')) {
    // Try format: "MCP server: gmail_ws3:send_email completed successfully"
    let serverMatch = content.match(/MCP server: ([^:]+):/);
    if (!serverMatch) {
      // Try format: "gmail_ws3 completed successfully"
      serverMatch = content.match(/([^\s]+) completed successfully/);
    }
    const server = serverMatch ? serverMatch[1] : '';
    return {
      type: 'complete',
      tool: formatToolName(server),
      message: `${formatToolName(server)} completed`
    };
  }
  
  return null;
}

/**
 * Format tool name for display
 */
function formatToolName(name) {
  if (!name) return 'Tool';
  return name
    .replace(/[_-]/g, ' ')
    .replace(/mcp/gi, '')
    .replace(/ws\d+/g, '')
    .replace(/gmail/gi, 'Gmail')
    .replace(/linkedin/gi, 'LinkedIn')
    .replace(/calendar/gi, 'Calendar')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || 'Tool';
}

/**
 * Clean up message content for display
 */
function getCleanMessage(content) {
  if (!content) return '';
  
  // Remove debug prefixes
  let cleaned = content
    .replace(/^\[debug\]:\s*/i, '')
    .replace(/^\[.*?\]:\s*/i, '')
    .trim();
  
  // If it's a simple status message, return as is
  if (cleaned.length < 100 && !cleaned.includes('\n')) {
    return cleaned;
  }
  
  // For longer messages, try to extract the essential part
  const lines = cleaned.split('\n').filter(line => line.trim());
  if (lines.length > 0) {
    return lines[0].trim();
  }
  
  return cleaned;
}

import { CheckCircle, Loader2, Mail, Calendar, Globe, CheckCircle2, Zap } from "lucide-react";
import AgentAnimation from "@/media/animations/agent-animation.webm";
import AgentStatic from "@/media/animations/agent-static.png";

// Tool logos mapping (same as landing page)
const toolLogos = {
  "Gmail": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
  "Google Calendar": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
  "LinkedIn": "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
  "Google Drive": "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg"
};

/**
 * Enhanced Tool Status Display matching landing page design
 */
function EnhancedToolDisplay({ tools, latestTool, content }) {
  const getToolLogo = (toolName) => {
    const name = toolName.charAt(0).toUpperCase() + toolName.slice(1).toLowerCase();
    return toolLogos[name] || toolLogos["Gmail"]; // fallback to Gmail logo
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'complete': return CheckCircle2;
      case 'executing': return Loader2;
      case 'preparing': return Loader2;
      default: return Loader2;
    }
  };

  const getStatusColor = (type) => {
    switch (type) {
      case 'complete': return 'text-green-600';
      case 'executing': return 'text-blue-600 animate-spin';
      case 'preparing': return 'text-purple-600';
      default: return 'text-gray-500';
    }
  };

  // If we have structured data from TOOL_RESULT, use it
  if (latestTool?.structured) {
    const { icon, displayName, summary, highlights, metrics, status } = latestTool.structured;
    const isSuccess = status === 'success';
    
    return (
      <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-4 mb-2">
        <div className="space-y-3">
          {/* Header with icon and status */}
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <h4 className="font-semibold text-gray-900">
              {isSuccess ? '✅' : '❌'} {summary}
            </h4>
          </div>
          
          {/* Highlights section */}
          {highlights && highlights.length > 0 && (
            <div className="space-y-2">
              {highlights.map((highlight, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      highlight.importance === 'primary' ? 'text-gray-700' : 'text-gray-600'
                    }`}>
                      {highlight.label}
                    </span>
                  </div>
                  <div className={`text-sm mt-1 ${
                    highlight.importance === 'primary' ? 'text-gray-900 font-medium' : 'text-gray-700'
                  }`}>
                    {highlight.label.includes('ID') ? (
                      <span className="font-mono text-xs bg-gray-50 px-2 py-1 rounded">
                        {highlight.value}
                      </span>
                    ) : (
                      highlight.value
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Metrics footer */}
          {metrics && (
            <div className="flex items-center gap-3 text-xs text-gray-600 pt-2 border-t border-gray-100">
              {metrics.duration && (
                <>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-600" />
                    <span>{metrics.duration}ms</span>
                  </div>
                  <span className="text-gray-300">•</span>
                </>
              )}
              {metrics.confidence && (
                <>
                  <div className="flex items-center gap-1">
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${metrics.confidence}%` }}
                      ></div>
                    </div>
                    <span>{metrics.confidence}%</span>
                  </div>
                  <span className="text-gray-300">•</span>
                </>
              )}
              <div className="flex items-center gap-1">
                <span>{displayName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Fallback: If we have a complete action with meaningful content, show basic result
  if (latestTool?.type === 'complete' && content) {
    return (
      <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-4 mb-2">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">✅ {latestTool.message || 'Action Completed'}</h4>
          <p className="text-sm text-gray-600">
            {getCleanMessage(content)}
          </p>
        </div>
      </div>
    );
  }

  // For in-progress or preparing states, show minimal status
  return (
    <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-4 mb-2">
      <div className="flex items-center gap-3">
        {latestTool && (
          <>
            <img 
              src={getToolLogo(latestTool.tool)} 
              alt={latestTool.tool}
              className="w-5 h-5 rounded"
            />
            {React.createElement(getStatusIcon(latestTool.type), {
              className: `w-4 h-4 ${getStatusColor(latestTool.type)}`
            })}
            <span className="text-sm font-medium text-gray-900">
              {latestTool.message}
            </span>
          </>
        )}
      </div>
      
      {/* Compact metrics line like in landing page */}
      <div className="flex items-center gap-3 text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-600" />
          <span>Processing...</span>
        </div>
        <span className="text-gray-300">•</span>
        <div className="flex items-center gap-1">
          <span>Tool:</span>
          <span className="font-medium">{latestTool?.tool}</span>
        </div>
      </div>
    </div>
  );
}

export default function StatusResponse({
  messages = [],
  isThinking = false,
  showCheckmark = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentThought = messages[messages.length - 1];
  const previousThoughts = messages.slice(0, -1);

  function handleExpandClick() {
    if (!previousThoughts.length > 0) return;
    setIsExpanded(!isExpanded);
  }

  // Parse debug messages into tool information
  const toolInfo = messages.map(msg => parseDebugToToolInfo(msg.content)).filter(Boolean);
  const latestTool = toolInfo[toolInfo.length - 1];

  // If we have tool information, show enhanced tool display
  if (toolInfo.length > 0 && !isThinking) {
    const relevantContent = currentThought?.content || messages.map(m => m.content).join(' ');
    return (
      <div className="flex justify-start w-full">
        <div className="max-w-[85%] space-y-2">
          <EnhancedToolDisplay 
            tools={toolInfo} 
            latestTool={latestTool} 
            content={relevantContent}
          />
          
          {/* Metrics line - only for completed tasks with structured data */}
          {latestTool?.type === 'complete' && latestTool?.structured?.metrics && (
            <div className="flex items-center gap-3 text-xs text-gray-600 px-1">
              {/* Tool Logo */}
              <div className="flex items-center gap-1">
                <span className="text-lg" title={latestTool.structured.displayName}>
                  {latestTool.structured.icon || '🔧'}
                </span>
              </div>

              {/* Only show metrics that exist */}
              {latestTool.structured.metrics.duration && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-600" />
                    <span>{latestTool.structured.metrics.duration}ms</span>
                  </div>
                </>
              )}

              {latestTool.structured.metrics.confidence && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <div className="w-12 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${latestTool.structured.metrics.confidence}%` }}
                      ></div>
                    </div>
                    <span>{latestTool.structured.metrics.confidence}%</span>
                  </div>
                </>
              )}

              {latestTool.structured.displayName && (
                <>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center gap-1">
                    <span>{latestTool.structured.displayName}</span>
                  </div>
                </>
              )}
            </div>
          )}
          
          {/* Fallback metrics for non-structured responses (backward compatibility) */}
          {latestTool?.type === 'complete' && !latestTool?.structured && (
            <div className="flex items-center gap-3 text-xs text-gray-600 px-1">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span>Completed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Use clean AgenticThinking component when agent is actively thinking
  if (isThinking) {
    // Check if we have tool information during thinking
    if (toolInfo.length > 0) {
      const relevantContent = currentThought?.content || messages.map(m => m.content).join(' ');
      return (
        <div className="flex justify-start w-full">
          <div className="max-w-[85%] space-y-2">
            <EnhancedToolDisplay 
              tools={toolInfo} 
              latestTool={latestTool}
              content={relevantContent}
            />
          </div>
        </div>
      );
    }
    
    // Fall back to clean thinking display with no generic steps
    return (
      <div className="flex justify-start w-full">
        <div className="max-w-[85%] space-y-2">
          <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              <span className="text-sm font-medium text-gray-900">
                Processing request...
              </span>
            </div>
            
            {/* Minimal processing indicator */}
            <div className="flex items-center gap-3 text-xs text-gray-600 mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-600" />
                <span>AI working...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback to simple display for non-debug status responses
  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-[80%] flex flex-col">
        <div className=" w-full max-w-[800px]">
          <div
            onClick={handleExpandClick}
            style={{ borderRadius: "6px" }}
            className={`${!previousThoughts?.length ? "" : `${previousThoughts?.length ? "hover:bg-theme-sidebar-item-hover" : ""}`} items-start bg-theme-bg-chat-input py-2 px-4 flex gap-x-2`}
          >
            <div className="w-7 h-7 flex justify-center flex-shrink-0 items-center">
              {isThinking ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-8 h-8 scale-150 transition-opacity duration-200 light:invert light:opacity-50"
                  data-tooltip-id="agent-thinking"
                  data-tooltip-content="Working on your request..."
                  aria-label="Working on your request..."
                >
                  <source src={AgentAnimation} type="video/webm" />
                </video>
              ) : (
                <img
                  src={AgentStatic}
                  alt="Agent complete"
                  className="w-6 h-6 transition-opacity duration-200 light:invert light:opacity-50"
                  data-tooltip-id="agent-thinking"
                  data-tooltip-content="Task completed"
                  aria-label="Task completed"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "" : "max-h-6"}`}
              >
                <div className="text-theme-text-secondary font-mono leading-6">
                  {!isExpanded ? (
                    <span className="block w-full truncate mt-[2px]">
                      {getCleanMessage(currentThought?.content) || "Working on your request..."}
                    </span>
                  ) : (
                    <>
                      {previousThoughts.map((thought, index) => (
                        <div
                          key={`cot-${thought.uuid || index}`}
                          className="mb-2"
                        >
                          {getCleanMessage(thought.content)}
                        </div>
                      ))}
                      <div>{getCleanMessage(currentThought?.content) || ""}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-x-2">
              {previousThoughts?.length > 0 && (
                <button
                  onClick={handleExpandClick}
                  data-tooltip-id="expand-cot"
                  data-tooltip-content={
                    isExpanded ? "Hide thought chain" : "Show thought chain"
                  }
                  className="border-none text-theme-text-secondary hover:text-theme-text-primary transition-colors p-1 rounded-full hover:bg-theme-sidebar-item-hover"
                  aria-label={
                    isExpanded ? "Hide thought chain" : "Show thought chain"
                  }
                >
                  <CaretDown
                    className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
