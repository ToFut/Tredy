import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle, Circle } from "lucide-react";
import { getToolLogo } from "./utils/toolLogos";

/**
 * LoadingState Component
 * Unified loading display that replaces multiple loading indicators
 * Shows progress, active tools, and current stage
 */
export default function LoadingState({
  stage = null,
  progress = null,
  tools = [],
  message = null,
}) {
  const [dots, setDots] = useState("");
  const [visibleTools, setVisibleTools] = useState([]);

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === "...") return "";
        return prev + ".";
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Progressively show tools
  useEffect(() => {
    if (tools.length > 0) {
      tools.forEach((tool, index) => {
        setTimeout(() => {
          setVisibleTools((prev) => [...prev, tool]);
        }, index * 200);
      });
    }
    return () => setVisibleTools([]);
  }, [tools]);

  // Determine loading message
  const getLoadingMessage = () => {
    if (message) return message;
    if (stage) return stage;

    // Smart messages based on tools
    if (tools.some((t) => t.name?.includes("search"))) {
      return "Searching for information";
    }
    if (
      tools.some((t) => t.name?.includes("gmail") || t.name?.includes("email"))
    ) {
      return "Processing email";
    }
    if (tools.some((t) => t.name?.includes("calendar"))) {
      return "Checking calendar";
    }
    if (tools.some((t) => t.name?.includes("jira"))) {
      return "Managing tasks";
    }
    if (tools.some((t) => t.name?.includes("workflow"))) {
      return "Building workflow";
    }

    return "Processing";
  };

  return (
    <div className="space-y-3">
      {/* Main loading message */}
      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
        <span>
          {getLoadingMessage()}
          {dots}
        </span>
      </div>

      {/* Tool indicators */}
      {visibleTools.length > 0 && (
        <div className="flex items-center gap-2">
          {visibleTools.map((tool, index) => (
            <ToolIndicator key={index} tool={tool} />
          ))}
        </div>
      )}

      {/* Progress bar */}
      {progress !== null && (
        <div className="w-full max-w-xs">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtle hint text */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        This may take a moment
      </p>
    </div>
  );
}

/**
 * Tool Indicator Component
 * Shows individual tool status during loading
 */
function ToolIndicator({ tool }) {
  const logo = getToolLogo(tool.name || tool);
  const status = tool.status || "pending";

  const [show, setShow] = useState(false);

  useEffect(() => {
    // Animate entrance
    setTimeout(() => setShow(true), 100);
  }, []);

  const statusStyles = {
    pending: "opacity-40 scale-90",
    active: "opacity-100 scale-100 ring-2 ring-purple-400 ring-offset-2",
    complete: "opacity-70 scale-100",
    error: "opacity-70 scale-100 ring-2 ring-red-400",
  };

  const StatusIcon = () => {
    switch (status) {
      case "pending":
        return <Circle className="w-3 h-3 text-gray-400" />;
      case "active":
        return <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />;
      case "complete":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        relative transition-all duration-300 transform
        ${show ? statusStyles[status] : "opacity-0 scale-0"}
      `}
    >
      {/* Tool Logo */}
      <div className="relative">
        {typeof logo === "string" ? (
          <img
            src={logo}
            alt={tool.name || tool}
            className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 p-1.5 shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
            {React.createElement(logo, {
              className: "w-4 h-4 text-gray-600 dark:text-gray-400",
            })}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5">
          <StatusIcon />
        </div>
      </div>

      {/* Tool Name (on hover) */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {tool.name || tool}
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative compact loading for inline use
 */
export function InlineLoading({ message = "Loading" }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>
        {message}
        {dots}
      </span>
    </span>
  );
}
