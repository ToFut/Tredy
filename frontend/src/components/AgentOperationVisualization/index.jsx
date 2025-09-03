import React, { useState, useEffect, useRef } from "react";
import { 
  Brain, 
  CircleNotch, 
  CheckCircle, 
  Warning,
  CaretDown,
  CaretRight,
  Code,
  Database,
  Globe,
  Terminal,
  Sparkle,
  Lightning,
  Clock,
  ArrowRight,
  Copy,
  Check
} from "@phosphor-icons/react";

// Tool icons mapping
const TOOL_ICONS = {
  'universal-linkedin': Globe,
  'mcp-server': Terminal,
  'database': Database,
  'api': Globe,
  'code': Code,
  'default': Lightning
};

// Status colors and icons
const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-600' },
  running: { icon: CircleNotch, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-600' },
  success: { icon: CheckCircle, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-600' },
  error: { icon: Warning, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-600' }
};

export default function AgentOperationVisualization({ 
  operations = [], 
  isActive = true,
  showDebug = false 
}) {
  const [expandedOps, setExpandedOps] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const containerRef = useRef(null);

  // Auto-scroll to latest operation
  useEffect(() => {
    if (containerRef.current && operations.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [operations]);

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

  const formatOperationName = (name) => {
    // Convert snake_case or camelCase to readable format
    return name
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getToolIcon = (tool) => {
    const IconComponent = TOOL_ICONS[tool] || TOOL_ICONS.default;
    return IconComponent;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Brain className="w-5 h-5 text-white" />
            </div>
            {isActive && (
              <div className="absolute -top-1 -right-1">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-theme-text-primary">Agent Operations</h3>
            <p className="text-xs text-theme-text-secondary">
              {operations.length} operation{operations.length !== 1 ? 's' : ''} executed
            </p>
          </div>
        </div>
        
        {operations.length > 0 && (
          <button
            onClick={() => setExpandedOps(new Set())}
            className="text-xs text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            Collapse All
          </button>
        )}
      </div>

      {/* Operations List */}
      <div 
        ref={containerRef}
        className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar"
      >
        {operations.map((op, index) => {
          const isExpanded = expandedOps.has(op.id || index);
          const StatusIcon = STATUS_CONFIG[op.status]?.icon || Clock;
          const statusConfig = STATUS_CONFIG[op.status] || STATUS_CONFIG.pending;
          const ToolIcon = getToolIcon(op.tool);
          
          return (
            <div
              key={op.id || index}
              className={`glass-effect rounded-xl border border-theme-sidebar-border transition-all duration-300 hover:shadow-md ${
                op.status === 'running' ? 'animate-pulse-slow' : ''
              }`}
            >
              {/* Operation Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => toggleExpanded(op.id || index)}
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className={`p-2 rounded-lg ${statusConfig.bgColor} transition-colors`}>
                    <StatusIcon 
                      className={`w-4 h-4 ${statusConfig.textColor} ${
                        op.status === 'running' ? 'animate-spin' : ''
                      }`}
                    />
                  </div>
                  
                  {/* Operation Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ToolIcon className="w-4 h-4 text-theme-text-secondary" />
                      <span className="text-sm font-medium text-theme-text-primary">
                        {formatOperationName(op.name || op.tool)}
                      </span>
                      {op.duration && (
                        <span className="text-xs text-theme-text-secondary ml-auto">
                          {op.duration}ms
                        </span>
                      )}
                    </div>
                    
                    {/* Quick Summary */}
                    <p className="text-xs text-theme-text-secondary line-clamp-2">
                      {op.description || op.endpoint || 'Processing...'}
                    </p>
                    
                    {/* Tags */}
                    {op.tags && (
                      <div className="flex gap-1 mt-2">
                        {op.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Expand Icon */}
                  <div className="text-theme-text-secondary">
                    {isExpanded ? (
                      <CaretDown className="w-4 h-4" />
                    ) : (
                      <CaretRight className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-theme-sidebar-border animate-fadeIn">
                  <div className="mt-3 space-y-3">
                    {/* Parameters */}
                    {op.params && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-theme-text-secondary">Parameters</span>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(op.params, null, 2), `params-${op.id}`)}
                            className="text-xs text-theme-text-secondary hover:text-theme-text-primary"
                          >
                            {copiedId === `params-${op.id}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <pre className="text-xs bg-theme-bg-secondary rounded-lg p-3 overflow-x-auto">
                          <code className="text-theme-text-primary">
                            {JSON.stringify(op.params, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}
                    
                    {/* Response */}
                    {op.response && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-theme-text-secondary">Response</span>
                          <button
                            onClick={() => copyToClipboard(
                              typeof op.response === 'string' ? op.response : JSON.stringify(op.response, null, 2),
                              `response-${op.id}`
                            )}
                            className="text-xs text-theme-text-secondary hover:text-theme-text-primary"
                          >
                            {copiedId === `response-${op.id}` ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <pre className="text-xs bg-theme-bg-secondary rounded-lg p-3 overflow-x-auto max-h-32">
                          <code className={`${op.status === 'error' ? 'text-red-500' : 'text-theme-text-primary'}`}>
                            {typeof op.response === 'string' ? op.response : JSON.stringify(op.response, null, 2)}
                          </code>
                        </pre>
                      </div>
                    )}
                    
                    {/* Debug Info */}
                    {showDebug && op.debug && (
                      <div>
                        <span className="text-xs font-medium text-theme-text-secondary">Debug</span>
                        <div className="mt-1 text-xs text-theme-text-secondary bg-gray-50 rounded-lg p-3">
                          {op.debug}
                        </div>
                      </div>
                    )}
                    
                    {/* Timeline */}
                    {op.timeline && (
                      <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
                        <Clock className="w-3 h-3" />
                        <span>Started: {op.timeline.start}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>Completed: {op.timeline.end}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {/* Active Indicator */}
        {isActive && operations.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3">
            <Sparkle className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-xs text-theme-text-secondary">Agent is thinking...</span>
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {operations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-theme-sidebar-border">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-theme-text-secondary">Total</p>
              <p className="text-lg font-semibold text-theme-text-primary">{operations.length}</p>
            </div>
            <div>
              <p className="text-xs text-theme-text-secondary">Success</p>
              <p className="text-lg font-semibold text-green-600">
                {operations.filter(op => op.status === 'success').length}
              </p>
            </div>
            <div>
              <p className="text-xs text-theme-text-secondary">Errors</p>
              <p className="text-lg font-semibold text-red-600">
                {operations.filter(op => op.status === 'error').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified inline operation indicator for chat
export function InlineOperationIndicator({ operation, compact = false }) {
  const StatusIcon = STATUS_CONFIG[operation.status]?.icon || Clock;
  const statusConfig = STATUS_CONFIG[operation.status] || STATUS_CONFIG.pending;
  const ToolIcon = getToolIcon(operation.tool);
  
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 glass-effect rounded-full">
        <StatusIcon 
          className={`w-3 h-3 ${statusConfig.textColor} ${
            operation.status === 'running' ? 'animate-spin' : ''
          }`}
        />
        <span className="text-xs font-medium text-theme-text-primary">
          {operation.name}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-3 p-3 glass-effect rounded-lg border border-theme-sidebar-border">
      <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
        <ToolIcon className={`w-4 h-4 ${statusConfig.textColor}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-theme-text-primary">{operation.name}</p>
        <p className="text-xs text-theme-text-secondary">{operation.description}</p>
      </div>
      <StatusIcon 
        className={`w-4 h-4 ${statusConfig.textColor} ${
          operation.status === 'running' ? 'animate-spin' : ''
        }`}
      />
    </div>
  );
}