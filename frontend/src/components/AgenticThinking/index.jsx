import React, { useState, useEffect } from "react";
import { Brain, Sparkle, Search, Code, Database, FileSearch, ChartLine, Cpu, CaretDown, CaretRight, Globe, Terminal, Lightning, CheckCircle, Warning, Clock, CircleNotch, Copy, Check } from "@phosphor-icons/react";

export default function AgenticThinking({ stage = 'thinking', context = '', isActive = true, debugMessages = [], operations = [] }) {
  const [currentProcess, setCurrentProcess] = useState(0);
  const [particles, setParticles] = useState([]);
  const [showDebugDetails, setShowDebugDetails] = useState(false);
  const [expandedOps, setExpandedOps] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  
  const processes = [
    { icon: Brain, label: "Understanding request", color: "from-purple-500 to-pink-500" },
    { icon: Search, label: "Searching knowledge", color: "from-blue-500 to-cyan-500" },
    { icon: Database, label: "Analyzing context", color: "from-emerald-500 to-teal-500" },
    { icon: Code, label: "Processing logic", color: "from-amber-500 to-orange-500" },
    { icon: ChartLine, label: "Generating insights", color: "from-indigo-500 to-purple-500" }
  ];

  // Tool icons mapping
  const TOOL_ICONS = {
    'universal-linkedin': Globe,
    'mcp-server': Terminal,
    'database': Database,
    'api': Globe,
    'code': Code,
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

  const parseOperations = () => {
    if (operations && operations.length > 0) return operations;
    
    // Parse debug messages into operations
    return debugMessages.map((msg, index) => {
      if (msg.includes('@agent is attempting to call')) {
        const toolMatch = msg.match(/`([^`]+)`/);
        const tool = toolMatch ? toolMatch[1] : 'unknown';
        return {
          id: index,
          name: tool.replace(/-/g, ' '),
          tool: tool.includes('linkedin') ? 'universal-linkedin' : 'mcp-server',
          status: 'pending',
          description: 'Preparing to execute tool',
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
        return {
          id: index,
          name: server.replace(/-/g, ' '),
          tool: server.includes('linkedin') ? 'universal-linkedin' : 'mcp-server',
          status: 'running',
          description: params ? `${params.method} ${params.endpoint}` : 'Executing operation...',
          params: params,
          debugMsg: msg
        };
      } else if (msg.includes('completed successfully')) {
        const serverMatch = msg.match(/MCP server: ([^:]+):/);
        const server = serverMatch ? serverMatch[1] : 'unknown';
        return {
          id: index,
          name: server.replace(/-/g, ' '),
          tool: server.includes('linkedin') ? 'universal-linkedin' : 'mcp-server',
          status: 'success',
          description: 'Operation completed successfully',
          debugMsg: msg
        };
      }
      return null;
    }).filter(Boolean);
  };

  const parsedOperations = parseOperations();

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setCurrentProcess((prev) => (prev + 1) % processes.length);
      
      // Add particles
      setParticles(prev => [...prev.slice(-10), {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2
      }]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const CurrentIcon = processes[currentProcess].icon;

  return (
    <div className="relative w-full px-4 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Main thinking container */}
        <div className="relative glass-effect rounded-2xl p-6 border border-theme-sidebar-border overflow-hidden transition-all duration-300 hover:shadow-lg">
          
          {/* Animated background gradient */}
          <div className="absolute inset-0 opacity-30">
            <div className={`absolute inset-0 bg-gradient-to-r ${processes[currentProcess].color} animate-pulse`} />
          </div>

          {/* Particle effects */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map(p => (
              <div
                key={p.id}
                className="absolute rounded-full bg-white/60 animate-float"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`
                }}
              />
            ))}
          </div>

          <div className="relative flex items-start gap-4">
            {/* Animated icon */}
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${processes[currentProcess].color} flex items-center justify-center animate-pulse shadow-lg`}>
                <CurrentIcon className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Content area */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold text-gray-900">AI is thinking</h3>
                <Sparkle className="w-4 h-4 text-amber-500 animate-pulse" />
              </div>
              
              {/* Current process */}
              <p className="text-sm text-gray-600 mb-3">{processes[currentProcess].label}...</p>

              {/* Process indicators */}
              <div className="flex gap-2 mb-3">
                {processes.map((process, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      index <= currentProcess 
                        ? `bg-gradient-to-r ${process.color}` 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Context preview */}
              {context && (
                <div className="p-3 bg-theme-bg-secondary/70 rounded-lg border border-theme-sidebar-border">
                  <p className="text-xs text-theme-text-secondary mb-1">Analyzing:</p>
                  <p className="text-sm text-theme-text-primary line-clamp-2">{context}</p>
                </div>
              )}
              
              {/* Tool Operations */}
              {parsedOperations.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-theme-text-primary flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Tool Operations ({parsedOperations.length})
                    </h4>
                    <button
                      onClick={() => setShowDebugDetails(!showDebugDetails)}
                      className="text-xs text-theme-text-secondary hover:text-theme-text-primary transition-colors flex items-center gap-1"
                    >
                      {showDebugDetails ? <CaretDown className="w-3 h-3" /> : <CaretRight className="w-3 h-3" />}
                      {showDebugDetails ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {parsedOperations.map((op, index) => {
                      const isExpanded = expandedOps.has(op.id);
                      const StatusIcon = STATUS_CONFIG[op.status]?.icon || Clock;
                      const statusConfig = STATUS_CONFIG[op.status] || STATUS_CONFIG.pending;
                      const ToolIcon = TOOL_ICONS[op.tool] || TOOL_ICONS.default;
                      
                      return (
                        <div key={op.id} className="bg-theme-bg-secondary/50 rounded-lg border border-theme-sidebar-border/50">
                          <div
                            className="p-3 cursor-pointer hover:bg-theme-bg-secondary/70 transition-colors"
                            onClick={() => showDebugDetails && toggleExpanded(op.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${statusConfig.bgColor} transition-colors`}>
                                <StatusIcon className={`w-3 h-3 ${statusConfig.textColor} ${op.status === 'running' ? 'animate-spin' : ''}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <ToolIcon className="w-3 h-3 text-theme-text-secondary" />
                                  <span className="text-sm font-medium text-theme-text-primary">{op.name}</span>
                                  {op.status === 'running' && <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />}
                                </div>
                                <p className="text-xs text-theme-text-secondary mt-0.5">{op.description}</p>
                              </div>
                              {showDebugDetails && (
                                <div className="text-theme-text-secondary">
                                  {isExpanded ? <CaretDown className="w-3 h-3" /> : <CaretRight className="w-3 h-3" />}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Expanded Debug Details */}
                          {showDebugDetails && isExpanded && (
                            <div className="px-3 pb-3 border-t border-theme-sidebar-border/30 animate-fadeIn">
                              {op.params && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-theme-text-secondary">Parameters</span>
                                    <button
                                      onClick={() => copyToClipboard(JSON.stringify(op.params, null, 2), `params-${op.id}`)}
                                      className="text-xs text-theme-text-secondary hover:text-theme-text-primary"
                                    >
                                      {copiedId === `params-${op.id}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                  <pre className="text-xs bg-theme-bg-primary/20 rounded p-2 overflow-x-auto max-h-20">
                                    <code className="text-theme-text-primary">{JSON.stringify(op.params, null, 2)}</code>
                                  </pre>
                                </div>
                              )}
                              <div className="mt-2">
                                <span className="text-xs font-medium text-theme-text-secondary">Debug Message</span>
                                <div className="mt-1 text-xs text-theme-text-secondary bg-theme-bg-primary/10 rounded p-2">
                                  {op.debugMsg}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live process steps */}
              <div className="mt-3 space-y-1">
                {processes.slice(0, currentProcess + 1).map((process, index) => {
                  const Icon = process.icon;
                  const isActive = index === currentProcess;
                  
                  return (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-xs transition-all ${
                        isActive ? 'opacity-100' : 'opacity-50'
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={isActive ? 'text-gray-900' : 'text-gray-500'}>
                        {process.label}
                      </span>
                      {index < currentProcess && (
                        <span className="text-green-500">✓</span>
                      )}
                      {isActive && (
                        <span className="flex gap-1 ml-auto">
                          <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence cards preview */}
        {parsedOperations.length === 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {['Analyzing patterns', 'Building context', 'Generating response'].map((text, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg glass-effect border border-theme-sidebar-border text-center transition-all hover-lift ${
                  i <= currentProcess / 2 ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <p className="text-xs text-theme-text-secondary">{text}</p>
                <div className="mt-1 flex justify-center gap-1">
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '100ms' }} />
                  <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Operation Summary */}
        {parsedOperations.length > 0 && (
          <div className="mt-3 pt-3 border-t border-theme-sidebar-border/30">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-theme-text-secondary">Total</p>
                <p className="text-lg font-semibold text-theme-text-primary">{parsedOperations.length}</p>
              </div>
              <div>
                <p className="text-xs text-theme-text-secondary">Success</p>
                <p className="text-lg font-semibold text-green-600">
                  {parsedOperations.filter(op => op.status === 'success').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-theme-text-secondary">Running</p>
                <p className="text-lg font-semibold text-blue-600">
                  {parsedOperations.filter(op => op.status === 'running').length}
                </p>
              </div>
            </div>
          </div>
        )}
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