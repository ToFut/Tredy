import React from "react";
import { Terminal, Play, CheckCircle, WarningCircle } from "@phosphor-icons/react";

export default function DebugMessage({ message }) {
  // Determine message type and styling
  const getMessageStyle = (content) => {
    if (content.includes('[debug]:') && content.includes('attempting to call')) {
      return {
        type: 'attempt',
        icon: Terminal,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/20',
        prefix: 'Calling'
      };
    } else if (content.includes('Executing MCP server:')) {
      return {
        type: 'execution',
        icon: Play,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/5',
        borderColor: 'border-orange-500/20',
        prefix: 'Executing'
      };
    } else if (content.includes('completed successfully')) {
      return {
        type: 'success',
        icon: CheckCircle,
        color: 'text-green-400',
        bgColor: 'bg-green-500/5',
        borderColor: 'border-green-500/20',
        prefix: 'Success'
      };
    } else if (content.includes('failed with error')) {
      return {
        type: 'error',
        icon: WarningCircle,
        color: 'text-red-400',
        bgColor: 'bg-red-500/5',
        borderColor: 'border-red-500/20',
        prefix: 'Error'
      };
    }
    
    // Default debug style
    return {
      type: 'debug',
      icon: Terminal,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/5',
      borderColor: 'border-gray-500/20',
      prefix: 'Debug'
    };
  };

  const parseMessage = (content) => {
    // Extract tool name from debug messages
    if (content.includes('attempting to call')) {
      const toolMatch = content.match(/`([^`]+)`/);
      const tool = toolMatch ? toolMatch[1] : '';
      return {
        tool: tool.replace(/_/g, ' ').replace(/-/g, ' '),
        action: 'Preparing to call tool'
      };
    }
    
    if (content.includes('Executing MCP server:')) {
      const serverMatch = content.match(/Executing MCP server: ([^\s]+)/);
      const server = serverMatch ? serverMatch[1] : '';
      const argsMatch = content.match(/with (.+)$/);
      const args = argsMatch ? argsMatch[1] : '';
      
      return {
        tool: server.replace(/_/g, ' ').replace(/-/g, ' '),
        action: 'Running operation',
        details: args
      };
    }
    
    if (content.includes('completed successfully')) {
      const serverMatch = content.match(/MCP server: ([^:]+):/);
      const server = serverMatch ? serverMatch[1] : '';
      return {
        tool: server.replace(/_/g, ' ').replace(/-/g, ' '),
        action: 'Operation completed'
      };
    }
    
    if (content.includes('failed with error')) {
      const serverMatch = content.match(/MCP server: ([^:]+):/);
      const server = serverMatch ? serverMatch[1] : '';
      return {
        tool: server.replace(/_/g, ' ').replace(/-/g, ' '),
        action: 'Operation failed'
      };
    }
    
    return {
      tool: 'System',
      action: content,
      details: null
    };
  };

  const style = getMessageStyle(message);
  const parsed = parseMessage(message);
  const IconComponent = style.icon;

  return (
    <div className="flex justify-start w-full mb-2">
      <div className="max-w-4xl">
        <div className={`
          ${style.bgColor} ${style.borderColor} 
          border rounded-xl p-3 backdrop-blur-sm
        `}>
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <IconComponent className={`w-4 h-4 ${style.color}`} />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium ${style.color} uppercase tracking-wider`}>
                  {style.prefix}
                </span>
                <span className="text-xs text-gray-500">
                  {parsed.tool}
                </span>
              </div>
              
              <p className="text-sm text-gray-300 mb-1">
                {parsed.action}
              </p>
              
              {/* Show detailed parameters if available */}
              {parsed.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                    View parameters
                  </summary>
                  <pre className="mt-1 text-xs text-gray-400 bg-black/20 rounded p-2 overflow-x-auto font-mono">
                    {parsed.details}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}