import React from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowsClockwise,
  Gear,
  Link as LinkIcon
} from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

// Connector logo/icon mapping - using actual service logos
const getConnectorIcon = (provider) => {
  // Use actual logos from public directory or icon libraries
  const iconPaths = {
    gmail: "/icons/gmail.svg",
    slack: "/icons/slack.svg", 
    "google-drive": "/icons/google.svg",
    "google-calendar": "/icons/google.svg",
    linkedin: "/icons/linkedin.svg",
    github: "/icons/github.svg",
    notion: "/icons/notion.svg",
    shopify: "/icons/shopify.svg",
    stripe: "/icons/stripe.svg",
    airtable: "/icons/airtable.svg",
    facebook: "/icons/facebook.svg",
    default: "/icons/link.svg"
  };
  return iconPaths[provider] || iconPaths.default;
};

const getConnectorName = (provider) => {
  const names = {
    gmail: "Gmail",
    slack: "Slack",
    "google-drive": "Google Drive",
    "google-calendar": "Google Calendar", 
    linkedin: "LinkedIn",
    github: "GitHub",
    notion: "Notion",
    shopify: "Shopify",
    stripe: "Stripe",
    airtable: "Airtable",
    facebook: "Facebook",
    default: "Service"
  };
  return names[provider] || names.default;
};

const getStatusIcon = (status) => {
  switch (status) {
    case "connected":
      return <CheckCircle className="w-3 h-3 text-green-500" />;
    case "syncing":
      return <ArrowsClockwise className="w-3 h-3 text-blue-500 animate-spin" />;
    case "error":
      return <XCircle className="w-3 h-3 text-red-500" />;
    case "pending":
      return <Clock className="w-3 h-3 text-yellow-500" />;
    default:
      return <XCircle className="w-3 h-3 text-gray-400" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "connected":
      return "border-green-500 bg-green-50 dark:bg-green-900/20";
    case "syncing":
      return "border-blue-500 bg-blue-50 dark:bg-blue-900/20";
    case "error":
      return "border-red-500 bg-red-50 dark:bg-red-900/20";
    case "pending":
      return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
    default:
      return "border-gray-300 bg-gray-50 dark:bg-gray-800";
  }
};

export default function ConnectorBadge({ 
  connector, 
  size = "sm", 
  onClick, 
  onSync,
  onSettings,
  showTooltip = true,
  className = "" 
}) {
  const isConnected = connector?.status === "connected";
  const lastSync = connector?.lastSync ? new Date(connector.lastSync).toLocaleString() : "Never";
  const scopeLabel = connector?.scope === "user" ? "All workspaces" : "This workspace";

  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm", 
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg"
  };

  const badgeId = `connector-badge-${connector?.provider}-${Math.random().toString(36).substr(2, 9)}`;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) onClick(connector);
  };

  const handleSync = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSync) onSync(connector);
  };

  const handleSettings = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSettings) onSettings(connector);
  };

  return (
    <>
      <div
        id={badgeId}
        onClick={handleClick}
        className={`
          relative flex items-center justify-center rounded-full border-2 cursor-pointer
          transition-all duration-200 hover:scale-110 hover:shadow-lg
          ${sizeClasses[size]}
          ${getStatusColor(connector?.status)}
          ${className}
        `}
      >
        {/* Connector Logo */}
        <img 
          src={getConnectorIcon(connector?.provider)}
          alt={getConnectorName(connector?.provider)}
          className="relative z-10 w-5 h-5 object-contain"
          onError={(e) => {
            // Fallback to generic link icon if logo fails to load
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        {/* Fallback icon */}
        <LinkIcon 
          className="relative z-10 w-4 h-4 text-gray-500 hidden"
        />
        
        {/* Status Indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 z-20">
          {getStatusIcon(connector?.status)}
        </div>
        
        {/* User/Workspace Scope Indicator */}
        {connector?.scope === "user" && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border border-white dark:border-gray-800 flex items-center justify-center">
            <span className="text-white text-[8px] font-bold">U</span>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <Tooltip
          anchorSelect={`#${badgeId}`}
          place="bottom"
          className="!bg-gray-900 !text-white !text-xs !rounded-lg !px-3 !py-2 !max-w-xs"
          content={
            <div className="space-y-1">
              <div className="font-semibold">{getConnectorName(connector?.provider)}</div>
              <div className="text-gray-300">Status: {connector?.status || "unknown"}</div>
              <div className="text-gray-300">Scope: {scopeLabel}</div>
              <div className="text-gray-300">Last sync: {lastSync}</div>
              {isConnected && (
                <div className="flex gap-2 pt-1 mt-2 border-t border-gray-700">
                  <div 
                    onClick={handleSync}
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowsClockwise className="w-3 h-3" />
                    Sync
                  </div>
                  <div 
                    onClick={handleSettings}
                    className="text-gray-400 hover:text-gray-300 text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Gear className="w-3 h-3" />
                    Settings
                  </div>
                </div>
              )}
            </div>
          }
        />
      )}
    </>
  );
}

export function ConnectorBadgeGroup({ 
  connectors = [], 
  maxVisible = 4,
  onConnectorClick,
  onConnectorSync,
  onConnectorSettings,
  onShowAll,
  className = ""
}) {
  const visibleConnectors = connectors.slice(0, maxVisible);
  const hiddenCount = Math.max(0, connectors.length - maxVisible);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {visibleConnectors.map((connector) => (
        <ConnectorBadge
          key={`${connector.provider}-${connector.id}`}
          connector={connector}
          size="sm"
          onClick={onConnectorClick}
          onSync={onConnectorSync}
          onSettings={onConnectorSettings}
        />
      ))}
      
      {hiddenCount > 0 && (
        <button
          onClick={onShowAll}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          +{hiddenCount}
        </button>
      )}
    </div>
  );
}

// Quick connector add button
export function AddConnectorButton({ onClick, size = "sm", className = "" }) {
  const sizeClasses = {
    xs: "w-6 h-6 text-xs",
    sm: "w-8 h-8 text-sm", 
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg"
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center rounded-full border-2 border-dashed
        border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800
        text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-500
        hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200
        hover:scale-110
        ${sizeClasses[size]}
        ${className}
      `}
      title="Connect new service"
    >
      <LinkIcon className="w-4 h-4" />
    </button>
  );
}