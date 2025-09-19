import React, { useState, useEffect } from "react";
import {
  Brain,
  MagnifyingGlass,
  Code,
  Database,
  Globe,
  FileText,
  CircleNotch,
  CheckCircle,
  Warning,
} from "@phosphor-icons/react";

export function ThinkingIndicator({ message = "Thinking..." }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-theme-text-secondary text-sm py-2">
      <Brain className="w-4 h-4 animate-pulse" />
      <span className="italic">
        {message}
        {dots}
      </span>
    </div>
  );
}

export function ToolUseIndicator({ tool, status = "running", result = null }) {
  const getToolIcon = () => {
    switch (tool?.type) {
      case "search":
        return <MagnifyingGlass className="w-4 h-4" />;
      case "code":
        return <Code className="w-4 h-4" />;
      case "database":
        return <Database className="w-4 h-4" />;
      case "web":
        return <Globe className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      default:
        return <CircleNotch className="w-4 h-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "running":
        return <CircleNotch className="w-4 h-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" weight="fill" />;
      case "error":
        return <Warning className="w-4 h-4 text-red-500" weight="fill" />;
      default:
        return null;
    }
  };

  return (
    <div className="my-3 p-3 bg-theme-bg-primary/50 rounded-lg border border-white/10 transition-all">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getToolIcon()}
          <span className="text-sm font-medium text-theme-text-primary">
            {tool?.name || "Tool"}
          </span>
        </div>
        {getStatusIcon()}
      </div>

      {tool?.description && (
        <p className="text-xs text-theme-text-secondary mb-2">
          {tool.description}
        </p>
      )}

      {status === "running" && (
        <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-75" />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse delay-150" />
          </div>
          <span>Processing...</span>
        </div>
      )}

      {status === "success" && result && (
        <div className="mt-2 p-2 bg-green-500/10 rounded text-xs text-green-400">
          {typeof result === "string"
            ? result
            : JSON.stringify(result, null, 2)}
        </div>
      )}

      {status === "error" && result && (
        <div className="mt-2 p-2 bg-red-500/10 rounded text-xs text-red-400">
          Error: {result}
        </div>
      )}
    </div>
  );
}

export function AgentWorkflow({ steps = [] }) {
  return (
    <div className="my-4 space-y-2">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
            step.status === "completed"
              ? "bg-green-500/5 border border-green-500/20"
              : step.status === "active"
                ? "bg-blue-500/5 border border-blue-500/20"
                : "opacity-50"
          }`}
        >
          <div
            className={`mt-0.5 ${
              step.status === "completed"
                ? "text-green-500"
                : step.status === "active"
                  ? "text-blue-500"
                  : "text-theme-text-secondary"
            }`}
          >
            {step.status === "completed" && (
              <CheckCircle className="w-5 h-5" weight="fill" />
            )}
            {step.status === "active" && (
              <CircleNotch className="w-5 h-5 animate-spin" />
            )}
            {step.status === "pending" && (
              <div className="w-5 h-5 rounded-full border-2 border-current" />
            )}
          </div>

          <div className="flex-1">
            <div className="font-medium text-sm text-theme-text-primary">
              {step.title}
            </div>
            {step.description && (
              <div className="text-xs text-theme-text-secondary mt-1">
                {step.description}
              </div>
            )}
            {step.result && step.status === "completed" && (
              <div className="text-xs text-green-400 mt-2">✓ {step.result}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
