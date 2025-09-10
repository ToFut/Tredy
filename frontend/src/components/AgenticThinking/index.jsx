import React, { useState, useEffect } from "react";
import { Brain, Sparkle, MagnifyingGlass, Code, Database, FileSearch, ChartLine, Cpu, CaretDown, CaretRight, Globe, Terminal, Lightning, CheckCircle, Warning, Clock, CircleNotch, Copy, Check } from "@phosphor-icons/react";

export default function AgenticThinking({ stage = 'thinking', context = '', isActive = true, debugMessages = [], operations = [] }) {
  const [currentProcess, setCurrentProcess] = useState(0);
  const [dots, setDots] = useState('');
  
  const processes = [
    { icon: Brain, label: "Processing request", color: "from-purple-500 to-pink-500" },
    { icon: Code, label: "Executing task", color: "from-amber-500 to-orange-500" },
    { icon: CheckCircle, label: "Completing operation", color: "from-green-500 to-emerald-500" }
  ];

  // Tool icons mapping
  const TOOL_ICONS = {
    'universal-linkedin': Globe,
    'mcp-server': Terminal,
    'database': Database,
    'api': Globe,
    'code': Code,
    'facebook': Globe,
    'messenger': Globe,
    'linkedin': Globe,
    'gmail': Globe,
    'slack': Globe,
    'default': Lightning
  };

  // Status configuration
  const STATUS_CONFIG = {
    pending: { icon: Clock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
    running: { icon: CircleNotch, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
    success: { icon: CheckCircle, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
    error: { icon: Warning, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-600' }
  };

  // Helper functions
  const toggleExpanded = (id) => {
    setExpandedOps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper function to get readable tool information
  const getReadableToolInfo = (tool) => {
    if (tool.includes('facebook_messenger')) {
      return {
        name: 'Facebook Messenger',
        toolIcon: 'facebook',
        description: '📱 Preparing to send Facebook message'
      };
    } else if (tool.includes('linkedin')) {
      return {
        name: 'LinkedIn',
        toolIcon: 'linkedin',
        description: '💼 Preparing LinkedIn action'
      };
    } else if (tool.includes('gmail')) {
      return {
        name: 'Gmail',
        toolIcon: 'gmail',
        description: '📧 Preparing email action'
      };
    } else if (tool.includes('slack')) {
      return {
        name: 'Slack',
        toolIcon: 'slack',
        description: '💬 Preparing Slack message'
      };
    }
    
    return {
      name: tool.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      toolIcon: 'default',
      description: '🔧 Preparing to use external tool'
    };
  };

  // Helper function to get readable action from server execution
  const getReadableServerInfo = (server, params) => {
    if (server.toLowerCase().includes('facebook')) {
      const text = params?.text || '';
      const page = params?.page || 'Page';
      return {
        name: 'Facebook Messenger',
        toolIcon: 'facebook',
        description: `📱 Sending message "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}" to ${page}`
      };
    } else if (server.toLowerCase().includes('linkedin')) {
      return {
        name: 'LinkedIn',
        toolIcon: 'linkedin',
        description: '💼 Executing LinkedIn action'
      };
    } else if (server.toLowerCase().includes('gmail')) {
      return {
        name: 'Gmail',
        toolIcon: 'gmail',
        description: '📧 Processing email request'
      };
    } else if (server.toLowerCase().includes('slack')) {
      return {
        name: 'Slack',
        toolIcon: 'slack',
        description: '💬 Sending team message'
      };
    }
    
    return {
      name: server.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      toolIcon: 'default',
      description: `🔧 Executing ${server} integration`
    };
  };

  const parseOperations = () => {
    if (operations && operations.length > 0) return operations;
    
    // Parse debug messages into operations
    return debugMessages.map((msg, index) => {
      if (msg.includes('@agent is attempting to call')) {
        const toolMatch = msg.match(/`([^`]+)`/);
        const tool = toolMatch ? toolMatch[1] : 'unknown';
        const toolInfo = getReadableToolInfo(tool);
        
        return {
          id: index,
          name: toolInfo.name,
          tool: toolInfo.toolIcon,
          status: 'pending',
          description: toolInfo.description,
          debugMsg: msg
        };
      } else if (msg.includes('Executing MCP server:')) {
        const serverMatch = msg.match(/Executing MCP server: ([^\s]+)/);
        const server = serverMatch ? serverMatch[1] : 'unknown';
        let params = null;
        try {
          const paramsMatch = msg.match(/with (.+)$/);
          if (paramsMatch) {
            params = JSON.parse(paramsMatch[1]);
          }
        } catch (e) {}
        
        const serverInfo = getReadableServerInfo(server, params);
        
        return {
          id: index,
          name: serverInfo.name,
          tool: serverInfo.toolIcon,
          status: 'running',
          description: serverInfo.description,
          params: params,
          debugMsg: msg
        };
      } else if (msg.includes('completed successfully')) {
        const serverMatch = msg.match(/MCP server: ([^:]+):/);
        const server = serverMatch ? serverMatch[1] : 'unknown';
        const serverInfo = getReadableServerInfo(server, null);
        
        return {
          id: index,
          name: serverInfo.name,
          tool: serverInfo.toolIcon,
          status: 'success',
          description: '✅ Task completed successfully',
          debugMsg: msg
        };
      }
      return null;
    }).filter(Boolean);
  };

  const parsedOperations = parseOperations();

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Progress through processes
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setCurrentProcess((prev) => (prev + 1) % processes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const CurrentIcon = processes[currentProcess].icon;

  return (
    <div className="w-full max-w-none py-2">
      {/* Claude-style header */}
      <div className="mb-2">
        <h3 className="text-[13px] font-medium text-gray-800 tracking-[-0.01em] leading-none">
          Thinking{dots}
        </h3>
      </div>

      {/* Claude-style bullet list - only show current and completed */}
      <div className="space-y-[6px]">
        {processes.slice(0, currentProcess + 1).map((process, index) => {
          const isCompleted = index < currentProcess;
          const isCurrent = index === currentProcess;
          
          return (
            <div
              key={index}
              className={`flex items-start gap-[8px] transition-opacity duration-300 ${
                isCurrent ? 'opacity-100' : 'opacity-70'
              }`}
            >
              {/* Animated bullet */}
              <div className="mt-[6px] flex-shrink-0">
                {isCompleted ? (
                  <div className="w-[3px] h-[3px] bg-gray-600 rounded-full" />
                ) : (
                  <div className="w-[3px] h-[3px] bg-gray-800 rounded-full animate-pulse" />
                )}
              </div>
              
              {/* Animated text */}
              <span className={`text-[12px] leading-[18px] font-normal ${
                isCompleted ? 'text-gray-600' : 'text-gray-800'
              }`}>
                {process.label}{isCurrent ? dots : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simplified inline thinking indicator
export function InlineThinking({ message = "Processing" }) {
  const [dots, setDots] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border border-purple-200">
      <div className="flex gap-1">
        <Brain className="w-4 h-4 text-purple-600 animate-pulse" />
        <Sparkle className="w-3 h-3 text-amber-500 animate-pulse" />
      </div>
      <span className="text-sm font-medium text-purple-700">
        {message}{'.'.repeat(dots)}
      </span>
    </div>
  );
}

// Compact thinking bar for chat
export function ThinkingBar({ processes = [], currentStep = 0 }) {
  return (
    <div className="w-full px-4 py-2 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
            <Brain className="w-4 h-4 text-white" />
          </div>
          
          {/* Process name */}
          <div className="flex-1">
            <p className="text-xs text-gray-500">AI Processing</p>
            <p className="text-sm font-medium text-gray-900">
              {processes[currentStep] || 'Thinking...'}
            </p>
          </div>
          
          {/* Progress */}
          <div className="flex gap-1">
            {processes.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i <= currentStep ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}