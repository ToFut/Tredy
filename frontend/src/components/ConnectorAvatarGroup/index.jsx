import React from "react";
import { Plus, Plug } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

// Get connector logo/icon mapping
const getConnectorIcon = (provider) => {
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

const getStatusColor = (status) => {
  switch (status) {
    case "connected":
      return "ring-green-400";
    case "syncing":
      return "ring-blue-400";
    case "error":
      return "ring-red-400";
    case "pending":
      return "ring-yellow-400";
    default:
      return "ring-gray-300";
  }
};

// Individual connector avatar
function ConnectorAvatar({ 
  connector, 
  size = 32, 
  onClick, 
  showStatus = true,
  className = "" 
}) {
  const avatarId = `connector-avatar-${connector?.provider}-${Math.random().toString(36).substr(2, 9)}`;
  
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) onClick(connector);
  };

  return (
    <>
      <div
        id={avatarId}
        onClick={handleClick}
        className={`
          relative flex-shrink-0 cursor-pointer transition-all duration-200
          hover:scale-110 hover:z-10 hover:shadow-lg
          ${className}
        `}
        style={{ width: size, height: size }}
      >
        <img
          src={getConnectorIcon(connector?.provider)}
          alt={getConnectorName(connector?.provider)}
          className={`
            w-full h-full object-contain rounded-full 
            bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-700
            ${showStatus ? getStatusColor(connector?.status) : ""}
            ${showStatus ? "ring-2" : ""}
          `}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        {/* Fallback icon */}
        <div 
          className={`
            hidden w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 
            border-2 border-white dark:border-gray-700 items-center justify-center
            ${showStatus ? getStatusColor(connector?.status) : ""}
            ${showStatus ? "ring-2" : ""}
          `}
        >
          <Plug className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip
        anchorSelect={`#${avatarId}`}
        place="bottom"
        className="!bg-gray-900 !text-white !text-xs !rounded-lg !px-3 !py-2"
        content={
          <div className="text-center">
            <div className="font-semibold">{getConnectorName(connector?.provider)}</div>
            <div className="text-gray-300 capitalize">{connector?.status || "unknown"}</div>
            {connector?.scope === "user" && (
              <div className="text-blue-300 text-xs">Available in all workspaces</div>
            )}
          </div>
        }
      />
    </>
  );
}

// Main avatar group component (like Discord/Slack member avatars)
export default function ConnectorAvatarGroup({ 
  connectors = [], 
  maxVisible = 4,
  avatarSize = 32,
  spacing = -8, // Negative for overlap
  onConnectorClick,
  onAddConnector,
  onShowAll,
  showAddButton = true,
  showStatus = true,
  className = "" 
}) {
  const visibleConnectors = connectors.slice(0, maxVisible);
  const hiddenCount = Math.max(0, connectors.length - maxVisible);

  return (
    <div className={`flex items-center ${className}`}>
      {/* Connector Avatars - Overlapped */}
      <div className="flex items-center" style={{ gap: spacing }}>
        {visibleConnectors.map((connector, index) => (
          <ConnectorAvatar
            key={`${connector.provider}-${connector.id || index}`}
            connector={connector}
            size={avatarSize}
            onClick={onConnectorClick}
            showStatus={showStatus}
            className={`relative z-${10 + index}`} // Higher z-index for later items
          />
        ))}
        
        {/* "+X more" avatar if there are hidden connectors */}
        {hiddenCount > 0 && (
          <div
            onClick={onShowAll}
            className={`
              flex-shrink-0 cursor-pointer transition-all duration-200
              hover:scale-110 hover:z-20 hover:shadow-lg
              flex items-center justify-center
              rounded-full bg-gray-200 dark:bg-gray-700 
              border-2 border-white dark:border-gray-700
              text-gray-600 dark:text-gray-300 font-semibold text-xs
            `}
            style={{ 
              width: avatarSize, 
              height: avatarSize,
              marginLeft: spacing > 0 ? spacing : Math.abs(spacing)
            }}
            title={`View all ${connectors.length} connectors`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
      
      {/* Add connector button */}
      {showAddButton && (
        <button
          onClick={onAddConnector}
          className={`
            flex-shrink-0 ml-2 transition-all duration-200
            hover:scale-110 hover:shadow-lg
            flex items-center justify-center
            rounded-full border-2 border-dashed
            border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800
            text-gray-400 dark:text-gray-500 hover:border-blue-400 hover:text-blue-500
            hover:bg-blue-50 dark:hover:bg-blue-900/20
          `}
          style={{ width: avatarSize, height: avatarSize }}
          title="Connect new service"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Compact version for mobile/small spaces
export function ConnectorAvatarGroupCompact({ 
  connectors = [], 
  maxVisible = 3,
  onConnectorClick,
  onAddConnector,
  onShowAll,
  className = "" 
}) {
  const hasConnectors = connectors.length > 0;
  
  if (!hasConnectors) {
    return (
      <button
        onClick={onAddConnector}
        className={`
          flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 
          dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 
          dark:hover:bg-gray-800 rounded-md transition-colors ${className}
        `}
      >
        <Plus className="w-3 h-3" />
        <span>Connect</span>
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ConnectorAvatarGroup
        connectors={connectors}
        maxVisible={maxVisible}
        avatarSize={24}
        spacing={-6}
        onConnectorClick={onConnectorClick}
        onAddConnector={onAddConnector}
        onShowAll={onShowAll}
        showAddButton={false}
        showStatus={false}
      />
      
      {/* Compact info */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {connectors.length}
        </span>
        <button
          onClick={onAddConnector}
          className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          <Plus className="w-3 h-3 text-gray-400 hover:text-blue-500" />
        </button>
      </div>
    </div>
  );
}

// Just the count with avatars (for status bars)
export function ConnectorAvatarSummary({ 
  connectors = [], 
  maxVisible = 5,
  onShowAll,
  className = "" 
}) {
  if (connectors.length === 0) return null;

  return (
    <div 
      onClick={onShowAll}
      className={`
        flex items-center gap-2 cursor-pointer hover:bg-gray-100 
        dark:hover:bg-gray-800 rounded-md px-2 py-1 transition-colors ${className}
      `}
    >
      <ConnectorAvatarGroup
        connectors={connectors}
        maxVisible={maxVisible}
        avatarSize={20}
        spacing={-4}
        showAddButton={false}
        showStatus={false}
      />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {connectors.length} service{connectors.length !== 1 ? 's' : ''} connected
      </span>
    </div>
  );
}