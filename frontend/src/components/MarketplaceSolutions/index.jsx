import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowsClockwise,
  Plus,
  Package,
  Sparkle,
  Eye,
  ChatCircle,
  X,
  Cube,
  Terminal,
  FileText,
} from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import CommunityHub from "@/models/communityHub";
import { useParams } from "react-router-dom";
import MarketplaceChat from "./MarketplaceChat";
import MarketplaceDashboard from "./MarketplaceDashboard";

// Marketplace item type configurations
const ITEM_TYPE_CONFIGS = {
  "agent-skill": {
    name: "Agent Skill",
    category: "Skills",
    icon: "🤖",
    color: "from-blue-400 to-blue-600",
    description: "AI agent capabilities",
  },
  "system-prompt": {
    name: "System Prompt",
    category: "Prompts",
    icon: "📝",
    color: "from-purple-400 to-purple-600",
    description: "Pre-configured prompts",
  },
  "slash-command": {
    name: "Slash Command",
    category: "Commands",
    icon: "⚡",
    color: "from-green-400 to-green-600",
    description: "Quick commands",
  },
  plugin: {
    name: "Plugin",
    category: "Plugins",
    icon: "🔌",
    color: "from-orange-400 to-orange-600",
    description: "System extensions",
  },
};

// Category icons mapping
const CATEGORY_ICONS = {
  Skills: Cube,
  Prompts: FileText,
  Commands: Terminal,
  Plugins: Package,
};

// Marketplace Item Circle Component
function MarketplaceItemCircle({
  item,
  size = 40,
  onClick,
  onBrowse,
  showStatus = true,
  className = "",
}) {
  const config = ITEM_TYPE_CONFIGS[item?.itemType] || {
    name: item?.itemType || "Unknown",
    category: "Other",
    icon: "📦",
    color: "from-gray-400 to-gray-600",
    description: "Marketplace item",
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "installing":
        return (
          <ArrowsClockwise className="w-3 h-3 text-blue-500 animate-spin" />
        );
      case "error":
        return <XCircle className="w-3 h-3 text-red-500" />;
      case "inactive":
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return <XCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "ring-green-500 bg-green-50 dark:bg-green-900/20";
      case "installing":
        return "ring-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "error":
        return "ring-red-500 bg-red-50 dark:bg-red-900/20";
      case "inactive":
        return "ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "ring-gray-300 bg-gray-50 dark:bg-gray-800";
    }
  };

  const itemId = `marketplace-circle-${item?.id || Math.random().toString(36).substr(2, 9)}`;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (item?.active && onClick) {
      onClick(item);
    } else if (onBrowse) {
      onBrowse();
    }
  };

  // Determine status
  const status = item?.active ? "active" : item?.installing ? "installing" : "inactive";

  return (
    <>
      <div
        id={itemId}
        onClick={handleClick}
        className={`
          relative group cursor-pointer transform transition-all duration-300 hover:scale-110 hover:shadow-lg
          ${className}
        `}
        style={{ width: size, height: size }}
      >
        {/* Main Circle */}
        <div
          className={`
          w-full h-full rounded-full flex items-center justify-center
          bg-gradient-to-br ${config.color} shadow-md
          ring-2 ring-white dark:ring-gray-800
          hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-900
          transition-all duration-200
          ${showStatus ? getStatusColor(status) : ""}
        `}
        >
          <span style={{ fontSize: size * 0.4 }}>{config.icon}</span>
        </div>

        {/* Status Indicator */}
        {showStatus && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
            {getStatusIcon(status)}
          </div>
        )}

        {/* Installing Animation */}
        {status === "installing" && (
          <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
        )}

        {/* Hover Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          <div className="font-medium">{item?.name || config.name}</div>
          <div className="text-gray-400">{config.description}</div>
          {item && (
            <div className="text-gray-300 mt-1">Status: {status}</div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip anchorSelect={`#${itemId}`} place="bottom" className="z-50">
        <div className="text-center">
          <div className="font-medium">{item?.name || config.name}</div>
          <div className="text-xs text-gray-400">{config.category}</div>
        </div>
      </Tooltip>
    </>
  );
}

// Marketplace Solutions Component
export default function MarketplaceSolutions({
  className = "",
  onItemClick,
  onBrowseMarketplace,
  maxVisible = 8,
  showCategories = true,
  compact = false,
}) {
  const { slug } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showMarketplaceChat, setShowMarketplaceChat] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    loadInstalledItems();
  }, [slug]);

  // Handle ESC key for dashboard modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && showDashboard) {
        setShowDashboard(false);
      }
    };

    if (showDashboard) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [showDashboard]);

  const loadInstalledItems = async () => {
    try {
      setLoading(true);
      const installedItems = await CommunityHub.getInstalledItems();
      setItems(installedItems || []);
    } catch (error) {
      console.error("Error loading installed items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBrowse = () => {
    if (onBrowseMarketplace) {
      onBrowseMarketplace();
    } else {
      setShowMarketplaceChat(true);
    }
  };

  const visibleItems = showAll
    ? items
    : items.slice(0, maxVisible);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
            />
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Loading...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
        {/* Label - Hidden in compact mode */}
        {!compact && (
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              Marketplace:
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:hidden">
              Items:
            </span>
          </div>
        )}

        {/* Marketplace Item Circles */}
        <div className="flex items-center gap-1">
          {visibleItems.map((item, index) => (
            <MarketplaceItemCircle
              key={`${item.itemType}-${item.id}-${index}`}
              item={item}
              size={compact ? 28 : 32}
              onClick={onItemClick}
              onBrowse={handleBrowse}
              showStatus={true}
              className="hover:z-10"
            />
          ))}

          {/* Show More/Less Button */}
          {items.length > maxVisible && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all`}
              title={showAll ? "Show less" : `Show ${items.length - maxVisible} more`}
            >
              {showAll ? (
                <span className="text-xs font-bold text-gray-500">−</span>
              ) : (
                <span className="text-xs font-bold text-gray-500">+{items.length - maxVisible}</span>
              )}
            </button>
          )}

          {/* Marketplace Chat Button */}
          {!compact && (
            <button
              onClick={() => setShowMarketplaceChat(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all"
              title="Browse Marketplace"
            >
              <ChatCircle className="w-3 h-3" />
            </button>
          )}

          {/* Dashboard Button */}
          {!compact && (
            <button
              onClick={() => setShowDashboard(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all"
              title="Open Dashboard"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}

          {/* Browse Marketplace Button */}
          <button
            onClick={handleBrowse}
            className={`${compact ? "w-7 h-7" : "w-8 h-8"} rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all`}
            title="Browse marketplace"
          >
            <Plus className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"}`} />
          </button>
        </div>

        {/* Status Summary - Hidden in compact mode */}
        {!compact && items.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hidden lg:flex">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>
              {items.filter((i) => i.active).length} active
            </span>
          </div>
        )}
      </div>

      {/* Marketplace Chat Modal */}
      <MarketplaceChat
        isOpen={showMarketplaceChat}
        onClose={() => setShowMarketplaceChat(false)}
        items={items}
        onItemAction={(item) => {
          console.log("Item action:", item);
          loadInstalledItems();
        }}
        onRefresh={loadInstalledItems}
      />

      {/* Dashboard Modal */}
      {showDashboard &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowDashboard(false);
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-dashboard-title"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden z-[9999]">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2
                      id="marketplace-dashboard-title"
                      className="text-xl font-bold text-gray-900 dark:text-white"
                    >
                      Your Marketplace Items
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      All your installed agent skills, prompts, and commands
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                      {items.filter((i) => i.active).length} active items • {items.length} total
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDashboard(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close dashboard"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Dashboard Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <MarketplaceDashboard
                  items={items}
                  onRefresh={loadInstalledItems}
                  onItemAction={(item) => {
                    console.log("Dashboard item action:", item);
                    loadInstalledItems();
                  }}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
