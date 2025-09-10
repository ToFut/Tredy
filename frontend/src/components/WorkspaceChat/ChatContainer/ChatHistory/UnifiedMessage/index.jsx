import React, { useState } from "react";
import { WorkspaceProfileImage } from "../PromptReply";
import MessageContent from "./MessageContent";
import MetricsBar from "./MetricsBar";
import LoadingState from "./LoadingState";
import { adaptLegacyMessage } from "./utils/messageAdapter";

/**
 * UnifiedMessage Component
 * A single, consistent message display component that handles all message types:
 * - Regular chat messages
 * - Agent responses with tools
 * - Loading states
 * - Error states
 * - Debug information (converted to metrics)
 */
export default function UnifiedMessage({
  uuid,
  message,
  workspace,
  isLoading = false,
  error = null,
  pending = false,
  sources = [],
  // New unified props
  tools = [],
  metrics = null,
  thinking = [],
  stage = null,
  progress = null,
  // Legacy props for backward compatibility
  debugInfo = null,
  agentStatus = null
}) {
  // Adapt legacy message formats
  const adaptedMessage = React.useMemo(() => {
    if (debugInfo || agentStatus) {
      return adaptLegacyMessage({ 
        message, 
        debugInfo, 
        agentStatus,
        tools,
        metrics 
      });
    }
    return { content: message, tools, metrics, thinking };
  }, [message, debugInfo, agentStatus, tools, metrics, thinking]);

  const assistantBackgroundColor = "bg-theme-bg-chat";

  // Handle loading state
  if (pending || isLoading) {
    return (
      <div className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}>
        <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className="flex gap-x-5">
            <WorkspaceProfileImage workspace={workspace} />
            <div className="flex-1">
              <LoadingState 
                stage={stage}
                progress={progress}
                tools={adaptedMessage.tools}
                message={adaptedMessage.content}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}>
        <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className="flex gap-x-5">
            <WorkspaceProfileImage workspace={workspace} />
            <div className="flex-1">
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Could not complete request
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty message
  if (!adaptedMessage.content && !sources?.length) {
    return null;
  }

  // Render normal message
  return (
    <div
      key={uuid}
      className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}
    >
      <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
        <div className="flex gap-x-5">
          <WorkspaceProfileImage workspace={workspace} />
          <div className="flex-1">
            {/* Main Message Content */}
            <MessageContent 
              content={adaptedMessage.content}
              sources={sources}
              workspace={workspace}
            />
            
            {/* Compact Metrics Bar (only if has tools or metrics) */}
            {(adaptedMessage.tools?.length > 0 || adaptedMessage.metrics) && (
              <MetricsBar 
                tools={adaptedMessage.tools}
                metrics={adaptedMessage.metrics}
                thinking={adaptedMessage.thinking}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}