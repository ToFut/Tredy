import { useState } from "react";
import {
  Trash,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  DotsThree,
  Calendar,
  Database,
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";

// Connector provider icons and colors
const providerConfig = {
  gmail: {
    icon: "📧",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    textColor: "text-red-600 dark:text-red-400",
  },
  slack: {
    icon: "💬",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    textColor: "text-purple-600 dark:text-purple-400",
  },
  "google-drive": {
    icon: "📁",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    textColor: "text-blue-600 dark:text-blue-400",
  },
  notion: {
    icon: "📝",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    textColor: "text-gray-600 dark:text-gray-400",
  },
  github: {
    icon: "🐙",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    textColor: "text-gray-600 dark:text-gray-400",
  },
  shopify: {
    icon: "🛒",
    bgColor: "bg-green-100 dark:bg-green-900/30",
    textColor: "text-green-600 dark:text-green-400",
  },
};

export default function ConnectorCard({
  connector,
  onDelete,
  onSync,
  isSyncing = false,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const config = providerConfig[connector.provider] || {
    icon: "🔌",
    bgColor: "bg-gray-100 dark:bg-gray-900/30",
    textColor: "text-gray-600 dark:text-gray-400",
  };

  const getStatusIcon = () => {
    switch (connector.status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "syncing":
        return (
          <ArrowsClockwise className="w-4 h-4 text-blue-500 animate-spin" />
        );
      default:
        return null;
    }
  };

  const getProviderName = (provider) => {
    const names = {
      gmail: "Gmail",
      slack: "Slack",
      "google-drive": "Google Drive",
      notion: "Notion",
      github: "GitHub",
      shopify: "Shopify",
    };
    return names[provider] || provider;
  };

  return (
    <div className="relative bg-theme-bg-primary rounded-xl border border-theme-border p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center text-2xl`}
          >
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-theme-text-primary">
              {getProviderName(connector.provider)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon()}
              <span className="text-xs text-theme-text-secondary">
                {connector.status === "connected"
                  ? "Connected"
                  : connector.status === "error"
                  ? "Error"
                  : connector.status === "syncing"
                  ? "Syncing..."
                  : "Pending"}
              </span>
            </div>
          </div>
        </div>
        
        {/* Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-theme-bg-secondary rounded-lg transition-colors"
          >
            <DotsThree className="w-5 h-5 text-theme-text-secondary" />
          </button>
          
          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-theme-bg-secondary rounded-lg shadow-lg border border-theme-border z-20">
                <button
                  onClick={() => {
                    onSync();
                    setShowMenu(false);
                  }}
                  disabled={isSyncing}
                  className="w-full px-4 py-2 text-left text-sm text-theme-text-primary hover:bg-theme-bg-primary transition-colors flex items-center gap-2"
                >
                  <ArrowsClockwise
                    className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                  />
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                >
                  <Trash className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Metadata */}
      {connector.metadata && (
        <div className="space-y-2 mb-4">
          {connector.metadata.email && (
            <div className="text-sm text-theme-text-secondary">
              {connector.metadata.email}
            </div>
          )}
          {connector.metadata.name && (
            <div className="text-sm text-theme-text-secondary">
              {connector.metadata.name}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-theme-border">
        <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
          <Calendar className="w-3 h-3" />
          {connector.lastSync ? (
            <>
              Last synced{" "}
              {formatDistanceToNow(new Date(connector.lastSync), {
                addSuffix: true,
              })}
            </>
          ) : (
            "Never synced"
          )}
        </div>
        
        {connector.metadata?.itemCount !== undefined && (
          <div className="flex items-center gap-2 text-xs text-theme-text-secondary">
            <Database className="w-3 h-3" />
            {connector.metadata.itemCount} items
          </div>
        )}
      </div>

      {/* Error Message */}
      {connector.status === "error" && connector.errorMessage && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-red-600 dark:text-red-400">
            {connector.errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}