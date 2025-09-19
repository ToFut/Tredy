import React from "react";

export default function TypingIndicator({ workspace }) {
  return (
    <div className="flex justify-center w-full bg-theme-bg-secondary border-b border-white/5">
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-4">
        <div className="flex gap-x-4 md:gap-x-6">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-sm bg-theme-bg-primary flex items-center justify-center">
              {workspace?.pfpUrl ? (
                <img
                  src={workspace.pfpUrl}
                  alt="AI"
                  className="w-full h-full object-cover rounded-sm"
                />
              ) : (
                <span className="text-xs font-semibold text-theme-text-primary">
                  AI
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 py-2">
            <div
              className="w-2 h-2 bg-theme-text-secondary rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2 h-2 bg-theme-text-secondary rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2 h-2 bg-theme-text-secondary rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function StreamingIndicator() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <span className="inline-block w-1 h-4 bg-theme-text-primary animate-pulse" />
    </span>
  );
}
