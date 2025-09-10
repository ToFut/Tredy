import { memo, useRef, useEffect, useState } from "react";
import { Warning } from "@phosphor-icons/react";
import UserIcon from "../../../../UserIcon";
import renderMarkdown from "@/utils/chat/markdown";
import Citations from "../Citation";
import ThinkingMetrics from "../ThinkingMetrics";
import { getToolLogo } from "../UnifiedMessage/utils/toolLogos";
import { Zap, Cpu, Brain, ChevronRight, CheckCircle, Loader2 } from "lucide-react";

/**
 * Enhanced PromptReply - Modified version with inline metrics
 * This replaces the existing PromptReply with tool and metrics display
 */
const EnhancedPromptReply = ({
  uuid,
  reply,
  pending,
  error,
  workspace,
  sources = [],
  closed = true,
  // New props for agent data
  agentTools = [],
  agentMetrics = null,
  debugInfo = null
}) => {
  const assistantBackgroundColor = "bg-theme-bg-chat";
  const [showThinking, setShowThinking] = useState(false);
  const [executingTools, setExecutingTools] = useState([]);
  const [metricsData, setMetricsData] = useState(null);

  // Listen for WebSocket updates
  useEffect(() => {
    if (window.socket && uuid) {
      // Tool execution updates
      window.socket.on(`tool_executing_${uuid}`, (data) => {
        setExecutingTools(data.tools);
      });

      // Metrics updates
      window.socket.on(`metrics_${uuid}`, (data) => {
        setMetricsData(data);
      });

      return () => {
        window.socket.off(`tool_executing_${uuid}`);
        window.socket.off(`metrics_${uuid}`);
      };
    }
  }, [uuid]);

  // Parse debug info for tools
  useEffect(() => {
    if (debugInfo) {
      const tools = parseToolsFromDebug(debugInfo);
      if (tools.length > 0) {
        setExecutingTools(tools);
      }
    }
  }, [debugInfo]);

  if (!reply && sources.length === 0 && !pending && !error) return null;

  if (pending) {
    return (
      <div className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}>
        <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className="flex gap-x-5">
            <WorkspaceProfileImage workspace={workspace} />
            <div className="flex-1">
              {/* Show executing tools if available */}
              {executingTools.length > 0 ? (
                <LiveToolExecution tools={executingTools} />
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                  <span>Processing your request...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}>
        <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className="flex gap-x-5">
            <WorkspaceProfileImage workspace={workspace} />
            <span className={`inline-block p-2 rounded-lg bg-red-50 text-red-500`}>
              <Warning className="h-4 w-4 mb-1 inline-block" /> Could not respond to message.
              <span className="text-xs">Reason: {error || "unknown"}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={uuid} className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}>
      <div className="py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
        <div className="flex gap-x-5">
          <WorkspaceProfileImage workspace={workspace} />
          <div className="flex-1">
            {/* Main message content */}
            <div 
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(reply) }}
            />
            
            {/* Compact Metrics Bar (like landing page) */}
            {(executingTools.length > 0 || metricsData || agentMetrics) && (
              <CompactMetricsBar 
                tools={executingTools.length > 0 ? executingTools : agentTools}
                metrics={metricsData || agentMetrics}
                onToggleThinking={() => setShowThinking(!showThinking)}
                showThinking={showThinking}
              />
            )}
          </div>
        </div>
        
        <Citations sources={sources} />
      </div>
    </div>
  );
};

/**
 * Live Tool Execution Display
 */
function LiveToolExecution({ tools }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
        <span>Executing tools...</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {tools.map((tool, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
          >
            <ToolIcon tool={tool} />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
              {formatToolName(tool.name || tool)}
            </span>
            {tool.status === 'executing' && (
              <Loader2 className="w-3 h-3 animate-spin text-purple-600" />
            )}
            {tool.status === 'complete' && (
              <CheckCircle className="w-3 h-3 text-green-500" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact Metrics Bar Component
 */
function CompactMetricsBar({ tools = [], metrics = {}, onToggleThinking, showThinking }) {
  const hasData = tools.length > 0 || Object.keys(metrics).length > 0;
  
  if (!hasData) return null;

  return (
    <>
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3 px-1">
        {/* Tool Icons */}
        {tools.length > 0 && (
          <>
            <div className="flex items-center gap-1">
              {tools.slice(0, 5).map((tool, idx) => (
                <ToolIcon key={idx} tool={tool} size="small" />
              ))}
              {tools.length > 5 && (
                <span className="text-gray-400">+{tools.length - 5}</span>
              )}
            </div>
            {Object.keys(metrics).length > 0 && (
              <span className="text-gray-300 dark:text-gray-600">•</span>
            )}
          </>
        )}
        
        {/* Metrics */}
        {metrics.time && (
          <>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>{metrics.time}</span>
            </div>
            <span className="text-gray-300 dark:text-gray-600">•</span>
          </>
        )}
        
        {metrics.model && (
          <>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-purple-500" />
              <span>{metrics.model}</span>
            </div>
          </>
        )}
        
        {metrics.thinking && (
          <>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <button
              onClick={onToggleThinking}
              className="flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
            >
              <Brain className="w-3 h-3" />
              <span>Details</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${showThinking ? 'rotate-90' : ''}`} />
            </button>
          </>
        )}
      </div>
      
      {/* Expanded thinking details */}
      {showThinking && metrics.thinking && (
        <div className="ml-12 mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-1">
            {metrics.thinking.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-1 h-1 bg-purple-400 rounded-full mt-1.5" />
                <span className="text-xs text-gray-600 dark:text-gray-400">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Tool Icon Component
 */
function ToolIcon({ tool, size = "normal" }) {
  const logo = getToolLogo(tool.name || tool);
  const sizeClass = size === "small" ? "w-4 h-4" : "w-5 h-5";
  
  if (typeof logo === 'string') {
    return <img src={logo} alt={tool.name || tool} className={`${sizeClass} rounded`} />;
  }
  
  const Icon = logo;
  return <Icon className={`${sizeClass} text-gray-600 dark:text-gray-400`} />;
}

/**
 * Format tool name for display
 */
function formatToolName(name) {
  return name
    .replace(/[_-]/g, ' ')
    .replace(/mcp::/i, '')
    .replace(/ws\d+/g, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parse tools from debug info
 */
function parseToolsFromDebug(debugInfo) {
  const tools = [];
  
  if (debugInfo.includes('attempting to call')) {
    const match = debugInfo.match(/`([^`]+)`/);
    if (match) {
      tools.push({ name: match[1], status: 'preparing' });
    }
  }
  
  if (debugInfo.includes('Executing MCP server:')) {
    const match = debugInfo.match(/Executing MCP server: ([^\s]+)/);
    if (match) {
      tools.push({ name: match[1], status: 'executing' });
    }
  }
  
  if (debugInfo.includes('completed successfully')) {
    const match = debugInfo.match(/MCP server: ([^:]+):/);
    if (match) {
      tools.push({ name: match[1], status: 'complete' });
    }
  }
  
  return tools;
}

export function WorkspaceProfileImage({ workspace }) {
  if (!!workspace.pfpUrl) {
    return (
      <div className="relative w-[35px] h-[35px] rounded-full flex-shrink-0 overflow-hidden">
        <img
          src={workspace.pfpUrl}
          alt="Workspace profile picture"
          className="absolute top-0 left-0 w-full h-full object-cover rounded-full bg-white"
        />
      </div>
    );
  }

  return <UserIcon user={{ uid: workspace.slug }} role="assistant" />;
}

export default memo(EnhancedPromptReply);