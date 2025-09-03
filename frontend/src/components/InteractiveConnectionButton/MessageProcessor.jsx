import React from "react";
import InteractiveConnectionButton from "./index";
import DOMPurify from "@/utils/chat/purify";
import renderMarkdown from "@/utils/chat/markdown";

// Patterns to detect connection prompts in messages
const CONNECTION_PATTERNS = [
  {
    pattern: /\[connect:(\w+(?:-\w+)?)\]/gi,
    provider: (match) => match[1]
  },
  {
    pattern: /\[oauth:(\w+(?:-\w+)?)\]/gi,
    provider: (match) => match[1]
  },
  {
    pattern: /\[integration:(\w+(?:-\w+)?)\]/gi,
    provider: (match) => match[1]
  }
];

// Enhanced message processor that can inject connection buttons
export default function ProcessedMessage({ 
  message, 
  workspaceSlug, 
  onConnectionComplete = () => {},
  className = "" 
}) {
  const processMessage = (text) => {
    let processedText = text;
    const connectionButtons = [];

    // Find and replace connection patterns with placeholder
    CONNECTION_PATTERNS.forEach((patternObj) => {
      let match;
      while ((match = patternObj.pattern.exec(text)) !== null) {
        const provider = patternObj.provider(match);
        const buttonId = `connection-btn-${provider}-${Date.now()}`;
        
        // Replace the pattern with a placeholder div
        processedText = processedText.replace(
          match[0], 
          `<div class="connection-button-placeholder" data-provider="${provider}" data-button-id="${buttonId}"></div>`
        );

        // Store button info for rendering
        connectionButtons.push({ provider, buttonId });
      }
    });

    return { processedText, connectionButtons };
  };

  const { processedText, connectionButtons } = processMessage(message);

  // If no connection buttons found, render normally
  if (connectionButtons.length === 0) {
    return (
      <span
        className={`flex flex-col gap-y-1 ${className}`}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(renderMarkdown(message))
        }}
      />
    );
  }

  // Render with connection buttons
  return (
    <div className={`flex flex-col gap-y-1 ${className}`}>
      <span
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(renderMarkdown(processedText))
        }}
      />
      
      {/* Render connection buttons */}
      <div className="flex flex-wrap gap-2 mt-2">
        {connectionButtons.map(({ provider, buttonId }) => (
          <InteractiveConnectionButton
            key={buttonId}
            provider={provider}
            workspaceSlug={workspaceSlug}
            onConnectionComplete={onConnectionComplete}
            className="inline-block"
          />
        ))}
      </div>
    </div>
  );
}

// Enhanced renderer for assistant messages with connection button support
export function RenderAssistantContent({ 
  message, 
  workspaceSlug,
  expanded = false,
  onConnectionComplete = () => {} 
}) {
  // Check if message contains connection patterns
  const hasConnectionPrompts = CONNECTION_PATTERNS.some(patternObj => 
    patternObj.pattern.test(message)
  );

  if (hasConnectionPrompts) {
    return (
      <ProcessedMessage
        message={message}
        workspaceSlug={workspaceSlug}
        onConnectionComplete={onConnectionComplete}
      />
    );
  }

  // Regular assistant message rendering with thought processing
  // (keeping the existing logic from the original component)
  return (
    <span
      className="flex flex-col gap-y-1"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(renderMarkdown(message))
      }}
    />
  );
}