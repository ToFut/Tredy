import React, { useState, useEffect } from "react";
import { 
  Clock, 
  Brain, 
  Wrench, 
  ChartBar, 
  CaretDown, 
  CaretRight,
  Copy,
  ArrowClockwise,
  Code,
  Globe,
  Database,
  FileText,
  Sparkle,
  WarningCircle,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

// Tool icon mapping
const TOOL_ICONS = {
  'web-search': Globe,
  'web-scraping': Globe,
  'document-summarizer': FileText,
  'rag-memory': Brain,
  'sql-query': Database,
  'create-chart': ChartBar,
  'create-workflow': Sparkle,
  'filesystem': FileText,
  'gmail': Globe,
  'calendar': Clock,
  'linkedin': Globe,
  'default': Wrench
};

// Get tool icon
const getToolIcon = (toolName) => {
  for (const [key, Icon] of Object.entries(TOOL_ICONS)) {
    if (toolName?.toLowerCase().includes(key)) return Icon;
  }
  return TOOL_ICONS.default;
};

export default function ThinkingMetrics({ 
  metrics = {}, 
  debugMessages = [],
  isThinking = false,
  onCopy,
  onRegenerate 
}) {
  const [expanded, setExpanded] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [copiedMetrics, setCopiedMetrics] = useState(false);

  // Parse metrics from the ThinkingTracker data
  const {
    duration = "0s",
    thinkingTime = "0s",
    toolsUsed = [],
    workflowCount = 0,
    modelsUsed = [],
    tokensUsed = "0",
    confidence = null,
    errorCount = 0,
    retryCount = 0,
    thoughtProcess = []
  } = metrics;

  const handleCopyMetrics = () => {
    const metricsText = `
Thinking Metrics:
- Duration: ${duration}
- Thinking Time: ${thinkingTime}
- Tools Used: ${toolsUsed.map(t => t.name).join(', ')}
- Workflows: ${workflowCount}
- Models: ${modelsUsed.map(m => `${m.provider}:${m.model}`).join(', ')}
- Tokens: ${tokensUsed}
${confidence ? `- Confidence: ${confidence.score}%` : ''}
- Errors: ${errorCount}
- Retries: ${retryCount}
    `.trim();
    
    navigator.clipboard.writeText(metricsText);
    setCopiedMetrics(true);
    setTimeout(() => setCopiedMetrics(false), 2000);
  };

  // Don't show if no metrics and not thinking
  if (!isThinking && Object.keys(metrics).length === 0) return null;

  return (
    <div className="mt-3 w-full max-w-[800px]">
      {/* Main Metrics Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-theme-bg-secondary/50 backdrop-blur-sm rounded-lg border border-theme-border shadow-sm"
      >
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-theme-bg-secondary/70 transition-colors rounded-t-lg"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ChartBar className={`w-4 h-4 ${isThinking ? 'animate-pulse text-blue-500' : 'text-theme-text-secondary'}`} />
              <span className="text-sm font-medium text-theme-text-primary">
                {isThinking ? "Processing..." : "Process Metrics"}
              </span>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-3 text-xs text-theme-text-secondary">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {duration}
              </span>
              {toolsUsed.length > 0 && (
                <span className="flex items-center gap-1">
                  <Wrench className="w-3 h-3" />
                  {toolsUsed.length} tools
                </span>
              )}
              {workflowCount > 0 && (
                <span className="flex items-center gap-1">
                  <Sparkle className="w-3 h-3" />
                  {workflowCount} workflows
                </span>
              )}
              <span className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {tokensUsed} tokens
              </span>
            </div>
          </div>
          
          {expanded ? (
            <CaretDown className="w-4 h-4 text-theme-text-secondary" />
          ) : (
            <CaretRight className="w-4 h-4 text-theme-text-secondary" />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-4">
                {/* Detailed Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Thinking Time */}
                  <div className="bg-theme-bg-primary/50 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Brain className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs text-theme-text-secondary">Thinking</span>
                    </div>
                    <span className="text-sm font-medium text-theme-text-primary">{thinkingTime}</span>
                  </div>

                  {/* Execution Time */}
                  <div className="bg-theme-bg-primary/50 rounded-md p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs text-theme-text-secondary">Execution</span>
                    </div>
                    <span className="text-sm font-medium text-theme-text-primary">
                      {duration !== thinkingTime ? duration : "0s"}
                    </span>
                  </div>

                  {/* Model Info */}
                  {modelsUsed.length > 0 && (
                    <div className="bg-theme-bg-primary/50 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs text-theme-text-secondary">Model</span>
                      </div>
                      <span className="text-sm font-medium text-theme-text-primary truncate">
                        {modelsUsed[0].model}
                      </span>
                    </div>
                  )}

                  {/* Confidence */}
                  {confidence && (
                    <div className="bg-theme-bg-primary/50 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <ChartBar className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs text-theme-text-secondary">Confidence</span>
                      </div>
                      <span className="text-sm font-medium text-theme-text-primary">
                        {confidence.score}%
                      </span>
                    </div>
                  )}

                  {/* Errors */}
                  {errorCount > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <WarningCircle className="w-3.5 h-3.5 text-red-500" />
                        <span className="text-xs text-red-600 dark:text-red-400">Errors</span>
                      </div>
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        {errorCount} {retryCount > 0 && `(${retryCount} retries)`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tools Used */}
                {toolsUsed.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-theme-text-secondary">Tools Used</div>
                    <div className="flex flex-wrap gap-2">
                      {toolsUsed.map((tool, idx) => {
                        const Icon = getToolIcon(tool.name);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1.5 bg-theme-bg-primary/50 rounded-md"
                          >
                            <Icon className="w-3.5 h-3.5 text-theme-text-secondary" />
                            <span className="text-xs text-theme-text-primary">{tool.name}</span>
                            {tool.duration && (
                              <span className="text-xs text-theme-text-secondary">({tool.duration})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Timeline Button */}
                <div className="flex items-center gap-2 pt-2 border-t border-theme-border">
                  <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-primary/50 rounded-md transition-colors"
                  >
                    <Code className="w-3.5 h-3.5" />
                    {showTimeline ? "Hide" : "View"} Detailed Timeline
                  </button>
                  
                  <button
                    onClick={handleCopyMetrics}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-primary/50 rounded-md transition-colors"
                  >
                    {copiedMetrics ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Metrics
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Timeline View */}
      <AnimatePresence>
        {showTimeline && thoughtProcess.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 bg-theme-bg-secondary/30 rounded-lg border border-theme-border p-4"
          >
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h4 className="text-xs font-medium text-theme-text-secondary mb-3">Execution Timeline</h4>
              {thoughtProcess.map((event, idx) => (
                <TimelineItem key={idx} event={event} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center gap-2">
        {onCopy && (
          <button
            onClick={onCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary/50 rounded-md transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Response
          </button>
        )}
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-bg-secondary/50 rounded-md transition-colors"
          >
            <ArrowClockwise className="w-3.5 h-3.5" />
            Regenerate
          </button>
        )}
      </div>
    </div>
  );
}

// Timeline Item Component
function TimelineItem({ event }) {
  const getEventIcon = () => {
    switch(event.type) {
      case 'thinking': return <Brain className="w-3.5 h-3.5 text-purple-500" />;
      case 'tool': return <Wrench className="w-3.5 h-3.5 text-blue-500" />;
      case 'workflow': return <Sparkle className="w-3.5 h-3.5 text-amber-500" />;
      case 'error': return <WarningCircle className="w-3.5 h-3.5 text-red-500" />;
      case 'retry': return <ArrowClockwise className="w-3.5 h-3.5 text-orange-500" />;
      default: return <ArrowRight className="w-3.5 h-3.5 text-theme-text-secondary" />;
    }
  };

  return (
    <div className="flex gap-3 text-xs">
      <div className="flex-shrink-0 w-16 text-theme-text-secondary">
        {new Date(event.timestamp).toLocaleTimeString('en-US', { 
          hour12: false,
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        }).slice(3)}
      </div>
      <div className="flex-shrink-0">{getEventIcon()}</div>
      <div className="flex-1 text-theme-text-primary">
        {event.content || event.tool || event.error || "Processing..."}
      </div>
    </div>
  );
}