import React, { useState, useEffect } from "react";
import {
  Plug,
  Plus,
  ArrowsClockwise,
  Check,
  Warning,
  CloudArrowDown,
  LinkBreak,
  Lightning,
  Globe,
  EnvelopeSimple,
  GithubLogo,
  SlackLogo,
  GoogleLogo,
  Notebook,
  Database,
  FileText,
  Calendar,
  Sparkle,
} from "@phosphor-icons/react";
import UserConnector from "@/models/userConnector";
import showToast from "@/utils/toast";

// Connector configurations with smart defaults
const CONNECTOR_CONFIG = {
  gmail: {
    name: "Gmail",
    icon: EnvelopeSimple,
    color: "from-red-400 to-red-600",
    emoji: "📧",
    provider: "google",
    scopes: ["email", "calendar"],
    syncInterval: 300000, // 5 minutes
    features: ["email", "attachments", "contacts"],
    quickActions: ["compose", "search", "sync"],
  },
  slack: {
    name: "Slack",
    icon: SlackLogo,
    color: "from-purple-500 to-purple-700",
    emoji: "💬",
    provider: "slack",
    syncInterval: 60000, // 1 minute
    features: ["messages", "channels", "files"],
    quickActions: ["post", "search", "sync"],
  },
  github: {
    name: "GitHub",
    icon: GithubLogo,
    color: "from-gray-700 to-gray-900",
    emoji: "🐙",
    provider: "github",
    syncInterval: 600000, // 10 minutes
    features: ["repos", "issues", "pull-requests"],
    quickActions: ["create-issue", "search", "sync"],
  },
  notion: {
    name: "Notion",
    icon: Notebook,
    color: "from-gray-600 to-gray-800",
    emoji: "📝",
    provider: "notion",
    syncInterval: 900000, // 15 minutes
    features: ["pages", "databases", "blocks"],
    quickActions: ["create-page", "search", "sync"],
  },
  google_drive: {
    name: "Google Drive",
    icon: FileText,
    color: "from-blue-400 to-blue-600",
    emoji: "📁",
    provider: "google",
    scopes: ["drive"],
    syncInterval: 600000,
    features: ["files", "folders", "sharing"],
    quickActions: ["upload", "search", "sync"],
  },
  calendar: {
    name: "Calendar",
    icon: Calendar,
    color: "from-green-400 to-green-600",
    emoji: "📅",
    provider: "google",
    scopes: ["calendar"],
    syncInterval: 300000,
    features: ["events", "reminders", "availability"],
    quickActions: ["create-event", "view-today", "sync"],
  },
};

// Smart Connector Bubble Component
export function SmartConnectorBubble({
  connector,
  size = 40,
  onClick,
  showStatus = true,
  isCompact = false,
}) {
  const [status, setStatus] = useState(connector?.status || "connected");
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(connector?.lastSync);

  const config = CONNECTOR_CONFIG[connector?.type] || {
    name: connector?.name || "Service",
    color: "from-gray-400 to-gray-600",
    emoji: "🔌",
    icon: Plug,
  };

  const Icon = config.icon;

  // Auto-sync based on interval
  useEffect(() => {
    if (connector?.type && config.syncInterval) {
      const interval = setInterval(() => {
        handleSync();
      }, config.syncInterval);
      return () => clearInterval(interval);
    }
  }, [connector]);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await UserConnector.sync(connector.provider, {
        workspaceId: connector.workspaceId,
      });
      setLastSync(new Date());
      setStatus("connected");
    } catch (error) {
      setStatus("error");
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (isSyncing)
      return <ArrowsClockwise className="w-3 h-3 animate-spin text-white" />;
    if (status === "error") return <Warning className="w-3 h-3 text-red-500" />;
    if (status === "connected")
      return <Check className="w-3 h-3 text-green-500" />;
    return <LinkBreak className="w-3 h-3 text-gray-400" />;
  };

  const getTimeSinceSync = () => {
    if (!lastSync) return "Never synced";
    const diff = Date.now() - new Date(lastSync).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (isCompact) {
    return (
      <div
        className="relative group cursor-pointer"
        onClick={onClick}
        style={{ width: size * 0.75, height: size * 0.75 }}
      >
        <div
          className={`
          w-full h-full rounded-full flex items-center justify-center
          bg-gradient-to-br ${config.color} shadow-md
          ring-1 ring-white dark:ring-gray-800
        `}
        >
          <span style={{ fontSize: size * 0.4 }}>{config.emoji}</span>
        </div>
        {showStatus && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
            {getStatusIcon()}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-200 hover:scale-110"
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      {/* Main Bubble */}
      <div
        className={`
        w-full h-full rounded-full flex items-center justify-center
        bg-gradient-to-br ${config.color} shadow-lg
        ring-2 ring-white dark:ring-gray-800
        hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-900
        transition-all duration-200
      `}
      >
        {config.emoji ? (
          <span style={{ fontSize: size * 0.5 }}>{config.emoji}</span>
        ) : (
          <Icon className="w-6 h-6 text-white" />
        )}
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800 flex items-center justify-center">
          {getStatusIcon()}
        </div>
      )}

      {/* Sync Animation */}
      {isSyncing && (
        <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
      )}

      {/* Detailed Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
        <div className="text-sm font-medium">{config.name}</div>
        <div className="text-xs text-gray-400">
          {status === "connected"
            ? `Synced ${getTimeSinceSync()}`
            : "Disconnected"}
        </div>
        {config.features && (
          <div className="flex gap-1 mt-1">
            {config.features.slice(0, 3).map((feature, idx) => (
              <span
                key={idx}
                className="text-xs bg-gray-800 px-1.5 py-0.5 rounded"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Connect Widget
export function QuickConnectWidget({ workspace, onConnect }) {
  const [availableConnectors, setAvailableConnectors] = useState([]);
  const [connecting, setConnecting] = useState(null);

  useEffect(() => {
    // Detect available connectors based on workspace settings
    const detectAvailable = async () => {
      const available = Object.keys(CONNECTOR_CONFIG).filter((type) => {
        // Check if connector is not already connected
        return !workspace?.connectors?.some((c) => c.type === type);
      });
      setAvailableConnectors(available);
    };
    detectAvailable();
  }, [workspace]);

  const handleQuickConnect = async (type) => {
    setConnecting(type);
    const config = CONNECTOR_CONFIG[type];

    try {
      // Smart OAuth flow
      if (config.provider === "google") {
        const authUrl = await UserConnector.getAuthUrl("google", {
          scopes: config.scopes,
          workspaceId: workspace.id,
        });
        window.location.href = authUrl;
      } else if (config.provider === "slack") {
        const authUrl = await UserConnector.getAuthUrl("slack", {
          workspaceId: workspace.id,
        });
        window.open(authUrl, "_blank", "width=500,height=700");
      } else {
        // Generic OAuth
        await onConnect?.(type);
      }
    } catch (error) {
      showToast(`Failed to connect ${config.name}`, "error");
    } finally {
      setConnecting(null);
    }
  };

  if (availableConnectors.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {availableConnectors.slice(0, 3).map((type) => {
        const config = CONNECTOR_CONFIG[type];
        const Icon = config.icon;

        return (
          <button
            key={type}
            onClick={() => handleQuickConnect(type)}
            disabled={connecting === type}
            className={`
              p-1.5 rounded-full transition-all duration-200
              ${
                connecting === type
                  ? "bg-gray-100 dark:bg-gray-700 animate-pulse"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110"
              }
            `}
            title={`Connect ${config.name}`}
          >
            <Icon
              className={`
              w-4 h-4 
              ${
                connecting === type
                  ? "text-gray-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              }
            `}
            />
          </button>
        );
      })}
    </div>
  );
}

// Connector Add Button with Smart Suggestions
export function SmartConnectorAddButton({ onClick, workspace, size = 40 }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // AI-powered suggestions based on workspace content
    const getSuggestions = () => {
      const suggested = [];

      // Suggest email if workspace has communication needs
      if (!workspace?.connectors?.some((c) => c.type === "gmail")) {
        suggested.push({
          type: "gmail",
          reason: "Email integration for better communication",
        });
      }

      // Suggest GitHub if code-related workspace
      if (
        workspace?.name?.toLowerCase().includes("dev") ||
        workspace?.name?.toLowerCase().includes("code")
      ) {
        if (!workspace?.connectors?.some((c) => c.type === "github")) {
          suggested.push({
            type: "github",
            reason: "Track code changes and issues",
          });
        }
      }

      // Suggest calendar for project management
      if (!workspace?.connectors?.some((c) => c.type === "calendar")) {
        suggested.push({
          type: "calendar",
          reason: "Schedule meetings and deadlines",
        });
      }

      setSuggestions(suggested.slice(0, 2));
    };

    getSuggestions();
  }, [workspace]);

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowSuggestions(true)}
        onMouseLeave={() => setShowSuggestions(false)}
        className="transform transition-all duration-200 hover:scale-110"
        style={{ width: size, height: size }}
      >
        <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors relative">
          <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />

          {/* AI Sparkle indicator */}
          {suggestions.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center">
              <Sparkle className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>
      </button>

      {/* Smart Suggestions Tooltip */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-3 bg-gray-900 text-white rounded-lg z-50 min-w-[200px]">
          <div className="text-xs font-medium mb-2 flex items-center gap-1">
            <Sparkle className="w-3 h-3 text-purple-400" />
            AI Suggestions
          </div>
          {suggestions.map((suggestion, idx) => {
            const config = CONNECTOR_CONFIG[suggestion.type];
            return (
              <div key={idx} className="flex items-center gap-2 py-1">
                <span className="text-sm">{config.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{config.name}</div>
                  <div className="text-xs text-gray-400">
                    {suggestion.reason}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Connector Group with Actions
export function ConnectorGroup({ connectors = [], workspace, onManage }) {
  const [expanded, setExpanded] = useState(false);
  const visibleCount = 3;

  const handleQuickAction = async (connector, action) => {
    const config = CONNECTOR_CONFIG[connector.type];

    switch (action) {
      case "sync":
        showToast(`Syncing ${config.name}...`, "info");
        await UserConnector.sync(connector.provider, {
          workspaceId: workspace.id,
        });
        showToast(`${config.name} synced successfully!`, "success");
        break;
      case "compose":
        // Open compose modal or redirect
        window.open("https://mail.google.com/mail/?view=cm", "_blank");
        break;
      case "search":
        // Open search interface
        onManage?.(connector, "search");
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Connected Services */}
      <div className="flex items-center -space-x-2">
        {connectors
          .slice(0, expanded ? undefined : visibleCount)
          .map((connector, idx) => (
            <SmartConnectorBubble
              key={idx}
              connector={connector}
              size={40}
              onClick={() => handleQuickAction(connector, "sync")}
              showStatus={idx < 2}
            />
          ))}

        {/* More indicator */}
        {!expanded && connectors.length > visibleCount && (
          <button
            onClick={() => setExpanded(true)}
            className="relative w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-900 hover:bg-gray-300 dark:hover:bg-gray-600 transform transition-all duration-200 hover:scale-110"
          >
            +{connectors.length - visibleCount}
          </button>
        )}
      </div>

      {/* Quick Connect for available services */}
      <QuickConnectWidget workspace={workspace} />

      {/* Add new connector */}
      <SmartConnectorAddButton workspace={workspace} onClick={onManage} />
    </div>
  );
}

export default {
  SmartConnectorBubble,
  QuickConnectWidget,
  SmartConnectorAddButton,
  ConnectorGroup,
};
