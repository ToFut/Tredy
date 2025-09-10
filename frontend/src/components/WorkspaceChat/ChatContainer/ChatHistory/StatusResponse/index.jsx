import React, { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import AgenticThinking from "@/components/AgenticThinking";

/**
 * Clean up debug messages and show user-friendly content
 */
function getCleanMessage(content) {
  if (!content) return "";
  
  // Hide all debug messages completely
  if (content.includes('[debug]:') || 
      content.includes('Executing MCP server:') || 
      content.includes('completed successfully') ||
      content.includes('attempting to call')) {
    return ""; // Hide debug messages completely
  }
  
  return content;
}

import AgentAnimation from "@/media/animations/agent-animation.webm";
import AgentStatic from "@/media/animations/agent-static.png";

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

  // Check if all messages are debug messages that should be hidden
  const hasNonDebugMessages = messages.some(msg => {
    const cleanContent = getCleanMessage(msg.content);
    return cleanContent && cleanContent.trim() !== "";
  });

  // If no non-debug messages and not actively thinking, hide the component
  if (!hasNonDebugMessages && !isThinking) {
    return null;
  }

  // Use clean AgenticThinking component when agent is actively thinking
  if (isThinking) {
    // Use the clean thinking display - hide debug messages for better UX
    return (
      <div className="flex justify-center w-full">
        <div className="w-full max-w-4xl px-4">
          <AgenticThinking
            stage="thinking"
            context={currentThought?.content || "Working on your request..."}
            isActive={isThinking}
            debugMessages={[]} // Hide debug messages - tools/metrics show in PromptReply now
            operations={[]}
          />
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
