import React from "react";
import { Download, CheckCircle, Package, FileText, Command } from "@phosphor-icons/react";

export default function SkillCard({ item, viewMode, onInstall, isInstalled }) {
  const getItemIcon = () => {
    switch (item.itemType) {
      case "agent-skill":
        return <Package className="w-5 h-5" />;
      case "system-prompt":
        return <FileText className="w-5 h-5" />;
      case "slash-command":
        return <Command className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const getCategoryColor = () => {
    switch (item.itemType) {
      case "agent-skill":
        return "bg-blue-500/20 text-blue-500";
      case "system-prompt":
        return "bg-green-500/20 text-green-500";
      case "slash-command":
        return "bg-purple-500/20 text-purple-500";
      default:
        return "bg-gray-500/20 text-gray-500";
    }
  };

  if (viewMode === "list") {
    return (
      <div className="bg-theme-bg-primary rounded-lg p-4 hover:shadow-lg transition-all duration-200 border border-theme-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className={`p-2 rounded-lg ${getCategoryColor()}`}>
              {getItemIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-theme-text-primary">{item.name}</h3>
              <p className="text-sm text-theme-text-secondary line-clamp-1">{item.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-theme-text-secondary">{item.category}</span>
                {item.author && (
                  <>
                    <span className="text-xs text-theme-text-secondary">•</span>
                    <span className="text-xs text-theme-text-secondary">by {item.author}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onInstall}
            disabled={isInstalled || item.itemType === "system-prompt"}
            className={`px-4 py-2 rounded transition-colors flex items-center gap-2 ${
              isInstalled
                ? "bg-green-500/20 text-green-500 cursor-not-allowed"
                : item.itemType === "system-prompt"
                ? "bg-orange-500/20 text-orange-500 cursor-not-allowed"
                : "bg-primary-button text-white hover:bg-primary-button-hover"
            }`}
            title={item.itemType === "system-prompt" ? "System prompts must be installed per workspace" : ""}
          >
            {isInstalled ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Installed
              </>
            ) : item.itemType === "system-prompt" ? (
              <>
                <FileText className="w-4 h-4" />
                Workspace Only
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Install
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-bg-primary rounded-lg p-4 hover:shadow-lg transition-all duration-200 border border-theme-border">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${getCategoryColor()}`}>
          {getItemIcon()}
        </div>
        {isInstalled && (
          <CheckCircle className="w-5 h-5 text-green-500" />
        )}
      </div>
      
      <h3 className="font-semibold text-theme-text-primary mb-2 line-clamp-1">
        {item.name}
      </h3>
      
      <p className="text-sm text-theme-text-secondary mb-3 line-clamp-2">
        {item.description}
      </p>
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-theme-text-secondary px-2 py-1 bg-theme-bg-secondary rounded">
          {item.category}
        </span>
        {item.author && (
          <span className="text-xs text-theme-text-secondary">
            by {item.author}
          </span>
        )}
      </div>
      
      <button
        onClick={onInstall}
        disabled={isInstalled || item.itemType === "system-prompt"}
        className={`w-full py-2 rounded transition-colors flex items-center justify-center gap-2 ${
          isInstalled
            ? "bg-green-500/20 text-green-500 cursor-not-allowed"
            : item.itemType === "system-prompt"
            ? "bg-orange-500/20 text-orange-500 cursor-not-allowed"
            : "bg-primary-button text-white hover:bg-primary-button-hover"
        }`}
        title={item.itemType === "system-prompt" ? "System prompts must be installed per workspace" : ""}
      >
        {isInstalled ? (
          <>
            <CheckCircle className="w-4 h-4" />
            Installed
          </>
        ) : item.itemType === "system-prompt" ? (
          <>
            <FileText className="w-4 h-4" />
            Workspace Only
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Install
          </>
        )}
      </button>
    </div>
  );
}