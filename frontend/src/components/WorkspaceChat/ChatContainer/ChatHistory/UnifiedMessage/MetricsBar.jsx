import React, { useState } from "react";
import {
  Zap,
  Cpu,
  Brain,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getToolLogo } from "./utils/toolLogos";

/**
 * MetricsBar Component
 * Displays a compact, single-line metrics bar under messages
 * Similar to Perplexity/ChatGPT style with tool logos and expandable details
 */
export default function MetricsBar({
  tools = [],
  metrics = {},
  thinking = [],
}) {
  const [expandedThinking, setExpandedThinking] = useState(false);

  // Don't render if no data
  if (!tools?.length && !metrics && !thinking?.length) {
    return null;
  }

  return (
    <>
      {/* Compact Metrics Line */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-3 px-1">
        {/* Tool Logos */}
        {tools && tools.length > 0 && (
          <>
            <ToolLogos tools={tools} />
            {(metrics?.time ||
              metrics?.confidence ||
              metrics?.model ||
              thinking?.length > 0) && (
              <span className="text-gray-300 dark:text-gray-600">•</span>
            )}
          </>
        )}

        {/* Execution Time */}
        {metrics?.time && (
          <>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span>{metrics.time}</span>
            </div>
            {(metrics?.confidence ||
              metrics?.model ||
              thinking?.length > 0) && (
              <span className="text-gray-300 dark:text-gray-600">•</span>
            )}
          </>
        )}

        {/* Confidence Bar */}
        {metrics?.confidence && (
          <>
            <ConfidenceBar value={metrics.confidence} />
            {(metrics?.model || thinking?.length > 0) && (
              <span className="text-gray-300 dark:text-gray-600">•</span>
            )}
          </>
        )}

        {/* Model */}
        {metrics?.model && (
          <>
            <div className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-purple-500" />
              <span>{metrics.model}</span>
            </div>
            {thinking?.length > 0 && (
              <span className="text-gray-300 dark:text-gray-600">•</span>
            )}
          </>
        )}

        {/* Expandable Thinking */}
        {thinking && thinking.length > 0 && (
          <button
            onClick={() => setExpandedThinking(!expandedThinking)}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
          >
            <Brain className="w-3 h-3" />
            <span>Details</span>
            {expandedThinking ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}
      </div>

      {/* Expanded Thinking Log */}
      {expandedThinking && thinking?.length > 0 && (
        <ThinkingLog steps={thinking} metrics={metrics} />
      )}
    </>
  );
}

/**
 * Tool Logos Display
 */
function ToolLogos({ tools }) {
  const maxDisplay = 5;
  const displayTools = tools.slice(0, maxDisplay);
  const remainingCount = tools.length - maxDisplay;

  return (
    <div className="flex items-center gap-1">
      {displayTools.map((tool, index) => (
        <ToolLogo key={index} tool={tool} />
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-gray-400 ml-1">+{remainingCount}</span>
      )}
    </div>
  );
}

/**
 * Individual Tool Logo
 */
function ToolLogo({ tool }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const logo = getToolLogo(tool.name || tool);
  const status = tool.status || "complete";

  const statusColors = {
    pending: "opacity-50",
    active: "ring-2 ring-blue-400",
    complete: "",
    error: "ring-2 ring-red-400",
  };

  const StatusIcon = () => {
    switch (status) {
      case "active":
        return <Loader2 className="w-2 h-2 text-blue-500 animate-spin" />;
      case "complete":
        return <CheckCircle className="w-2 h-2 text-green-500" />;
      case "error":
        return <AlertCircle className="w-2 h-2 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`relative ${statusColors[status]}`}>
        {typeof logo === "string" ? (
          <img src={logo} alt={tool.name || tool} className="w-5 h-5 rounded" />
        ) : (
          <div className="w-5 h-5 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            {React.createElement(logo, {
              className: "w-3 h-3 text-gray-600 dark:text-gray-400",
            })}
          </div>
        )}

        {/* Status indicator */}
        {status !== "complete" && (
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full">
            <StatusIcon />
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          {tool.name || tool}
          {tool.duration && ` (${tool.duration})`}
        </div>
      )}
    </div>
  );
}

/**
 * Confidence Bar Display
 */
function ConfidenceBar({ value }) {
  const percentage = typeof value === "number" ? value : parseInt(value);
  const color =
    percentage > 80
      ? "bg-green-500"
      : percentage > 60
        ? "bg-yellow-500"
        : "bg-orange-500";

  return (
    <div className="flex items-center gap-1">
      <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs">{percentage}%</span>
    </div>
  );
}

/**
 * Expanded Thinking Log
 */
function ThinkingLog({ steps, metrics }) {
  return (
    <div className="ml-12 mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
        <Brain className="w-3 h-3" />
        <span>Thinking Process</span>
        {metrics?.tokens && (
          <span className="text-gray-500 dark:text-gray-400 ml-auto">
            {metrics.tokens} tokens
          </span>
        )}
      </div>

      <div className="space-y-1">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="w-1 h-1 bg-purple-400 rounded-full mt-1.5" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {typeof step === "string" ? step : step.content || step.text}
            </span>
            {step.duration && (
              <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                {step.duration}
              </span>
            )}
          </div>
        ))}
      </div>

      {metrics?.thinkingTime && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Total thinking time</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {metrics.thinkingTime}
          </span>
        </div>
      )}
    </div>
  );
}
