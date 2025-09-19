import React, { useState } from "react";
import toolRegistry from "@/utils/toolRegistry";
import {
  CheckCircle,
  XCircle,
  CircleNotch,
  CaretDown,
  CaretRight,
  Copy,
  Check,
} from "@phosphor-icons/react";

/**
 * Compact tool usage badge shown inline with messages
 * Displays tool icons and expands to show details
 */
export default function ToolUsageBadge({
  toolCalls = [],
  toolUsageSummary = null,
  className = "",
}) {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Don't show if no tools were used
  if (!toolCalls || toolCalls.length === 0) return null;

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(
      typeof text === "string" ? text : JSON.stringify(text, null, 2)
    );
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get icon for a tool
  const getToolIcon = (toolName) => {
    const Icon = toolRegistry.getIcon(toolName);
    const colors = toolRegistry.getColorScheme(toolName);
    return { Icon, colors };
  };

  // Count statuses
  const successCount = toolCalls.filter((t) => t.status === "success").length;
  const errorCount = toolCalls.filter((t) => t.status === "error").length;
  const runningCount = toolCalls.filter((t) => t.status === "running").length;

  return (
    <div className={`inline-block ${className}`}>
      {/* Compact badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="
          inline-flex items-center gap-2 px-2 py-1
          bg-theme-bg-secondary/50 hover:bg-theme-bg-secondary
          border border-theme-sidebar-border rounded-lg
          transition-all duration-200 text-xs
          group
        "
      >
        {/* Expand icon */}
        {expanded ? (
          <CaretDown className="w-3 h-3 text-theme-text-secondary" />
        ) : (
          <CaretRight className="w-3 h-3 text-theme-text-secondary" />
        )}

        {/* Tool count */}
        <span className="text-theme-text-secondary">
          {toolCalls.length} tool{toolCalls.length > 1 ? "s" : ""}
        </span>

        {/* Mini tool icons */}
        <div className="flex items-center -space-x-1">
          {toolCalls.slice(0, 3).map((tool, idx) => {
            const { Icon, colors } = getToolIcon(tool.name);
            return (
              <div
                key={tool.id || idx}
                className="w-5 h-5 rounded border bg-white flex items-center justify-center"
                style={{
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  zIndex: 3 - idx,
                }}
              >
                <Icon
                  className="w-3 h-3"
                  style={{ color: colors.primary }}
                  weight="duotone"
                />
              </div>
            );
          })}
          {toolCalls.length > 3 && (
            <div className="ml-1 px-1 text-[10px] text-theme-text-secondary">
              +{toolCalls.length - 3}
            </div>
          )}
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-1 ml-1">
          {successCount > 0 && (
            <CheckCircle className="w-3 h-3 text-green-500" weight="fill" />
          )}
          {errorCount > 0 && (
            <XCircle className="w-3 h-3 text-red-500" weight="fill" />
          )}
          {runningCount > 0 && (
            <CircleNotch className="w-3 h-3 text-blue-500 animate-spin" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div
          className="
          absolute z-50 mt-1 p-3 min-w-[300px] max-w-[500px]
          bg-theme-bg-primary border border-theme-sidebar-border rounded-lg shadow-lg
          animate-fadeIn
        "
        >
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {toolCalls.map((tool) => {
              const { Icon, colors } = getToolIcon(tool.name);
              const toolMeta = toolRegistry.getTool(tool.name);

              return (
                <div
                  key={tool.id}
                  className="
                    flex items-start gap-2 p-2
                    bg-theme-bg-secondary/50 rounded-lg
                    border border-theme-sidebar-border/50
                  "
                >
                  {/* Tool icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: colors.primary }}
                      weight="duotone"
                    />
                  </div>

                  {/* Tool details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-theme-text-primary">
                        {toolMeta.name}
                      </span>
                      {/* Status */}
                      {tool.status === "success" && (
                        <CheckCircle
                          className="w-3 h-3 text-green-500"
                          weight="fill"
                        />
                      )}
                      {tool.status === "error" && (
                        <XCircle
                          className="w-3 h-3 text-red-500"
                          weight="fill"
                        />
                      )}
                      {tool.status === "running" && (
                        <CircleNotch className="w-3 h-3 text-blue-500 animate-spin" />
                      )}
                    </div>

                    {/* Provider */}
                    {toolMeta.provider && (
                      <span className="text-[10px] text-theme-text-secondary">
                        {toolMeta.provider}
                      </span>
                    )}

                    {/* Response preview */}
                    {tool.response && (
                      <div className="mt-1 flex items-start gap-1">
                        <pre className="text-[10px] text-theme-text-secondary truncate flex-1">
                          {typeof tool.response === "string"
                            ? tool.response.substring(0, 100)
                            : JSON.stringify(tool.response).substring(0, 100)}
                          {(typeof tool.response === "string"
                            ? tool.response
                            : JSON.stringify(tool.response)
                          ).length > 100 && "..."}
                        </pre>
                        <button
                          onClick={() =>
                            copyToClipboard(tool.response, tool.id)
                          }
                          className="p-0.5 text-theme-text-secondary hover:text-theme-text-primary"
                          title="Copy response"
                        >
                          {copiedId === tool.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    {/* Error message */}
                    {tool.error && (
                      <div className="mt-1 text-[10px] text-red-500">
                        {tool.error}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary footer */}
          {toolUsageSummary && (
            <div className="mt-2 pt-2 border-t border-theme-sidebar-border">
              <div className="flex items-center justify-between text-[10px] text-theme-text-secondary">
                <span>Total: {toolUsageSummary.totalCount}</span>
                <div className="flex items-center gap-3">
                  {toolUsageSummary.successCount > 0 && (
                    <span className="text-green-500">
                      ✓ {toolUsageSummary.successCount}
                    </span>
                  )}
                  {toolUsageSummary.errorCount > 0 && (
                    <span className="text-red-500">
                      ✗ {toolUsageSummary.errorCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
