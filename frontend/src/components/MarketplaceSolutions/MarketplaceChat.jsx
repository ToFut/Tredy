import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Sparkle,
  Package,
  MagnifyingGlass,
  ArrowRight,
  Download,
  Check,
  Cube,
  FileText,
  Terminal,
  Lightning,
  Eye,
  Trash,
  Power,
} from "@phosphor-icons/react";
import CommunityHub from "@/models/communityHub";

// Quick search suggestions based on item types
const SEARCH_SUGGESTIONS = [
  "Show me agent skills",
  "Find system prompts",
  "Browse slash commands",
  "What plugins are available?",
  "Search for automation skills",
  "Show popular items",
];

export default function MarketplaceChat({
  isOpen,
  onClose,
  items = [],
  onItemAction,
  onRefresh,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("browse");
  const [loading, setLoading] = useState(false);
  const [exploreItems, setExploreItems] = useState({
    agentSkills: { items: [], hasMore: false, totalCount: 0 },
    systemPrompts: { items: [], hasMore: false, totalCount: 0 },
    slashCommands: { items: [], hasMore: false, totalCount: 0 },
  });
  const [selectedCategory, setSelectedCategory] = useState("all");

  const chatRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        searchRef.current?.focus();
      }, 300);
      loadExploreItems();
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const loadExploreItems = async () => {
    try {
      setLoading(true);
      // Fetch all items with high limit to show complete catalog
      const { result } = await CommunityHub.fetchExploreItems({ limit: 1000 });
      if (result) {
        setExploreItems(result);
      }
    } catch (error) {
      console.error("Error loading explore items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleInstall = async (item) => {
    try {
      const importId =
        item.importId || `allm-community-id:${item.itemType}:${item.id}`;

      if (item.itemType === "agent-skill") {
        await CommunityHub.importBundleItem(importId);
      } else if (item.itemType === "system-prompt") {
        // System prompts require workspace-specific installation
        alert(
          "System prompts must be installed per workspace. Go to a specific workspace and use the 'Import Item' feature to install this system prompt."
        );
        return;
      } else if (item.itemType === "slash-command") {
        await CommunityHub.applyItem(importId, {});
      } else {
        // For other item types, try to apply them
        await CommunityHub.applyItem(importId, {});
      }

      // Reload data
      await loadExploreItems();
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Failed to install item:", error);
      alert("Failed to install item: " + error.message);
    }
  };

  const handleToggle = async (item) => {
    try {
      // Use hubId if id is undefined, as imported plugins use hubId as their identifier
      const itemId = item.id || item.hubId;
      if (!itemId) {
        console.error("No valid ID found for item:", item);
        return;
      }
      await CommunityHub.toggleItem(itemId, !item.active);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  const handleUninstall = async (item) => {
    if (!confirm(`Are you sure you want to uninstall "${item.name}"?`)) {
      return;
    }

    try {
      // Use hubId if id is undefined, as imported plugins use hubId as their identifier
      const itemId = item.id || item.hubId;
      if (!itemId) {
        console.error("No valid ID found for item:", item);
        return;
      }
      await CommunityHub.uninstallItem(itemId);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Failed to uninstall item:", error);
    }
  };

  const getAllExploreItems = () => {
    const allItems = [];

    if (selectedCategory === "all" || selectedCategory === "agent-skills") {
      exploreItems.agentSkills?.items?.forEach((item) => {
        allItems.push({
          ...item,
          itemType: "agent-skill",
          category: "Agent Skills",
        });
      });
    }

    if (selectedCategory === "all" || selectedCategory === "prompts") {
      exploreItems.systemPrompts?.items?.forEach((item) => {
        allItems.push({
          ...item,
          itemType: "system-prompt",
          category: "System Prompts",
        });
      });
    }

    if (selectedCategory === "all" || selectedCategory === "commands") {
      exploreItems.slashCommands?.items?.forEach((item) => {
        allItems.push({
          ...item,
          itemType: "slash-command",
          category: "Slash Commands",
        });
      });
    }

    return allItems.filter(
      (item) =>
        !searchQuery ||
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter((suggestion) =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const isItemInstalled = (item) => {
    return items.some((i) => (i.hubId === item.id) || (i.id === item.id) || (i.hubId === item.hubId));
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Chat Interface */}
      <div
        ref={chatRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="marketplace-chat-title"
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-[9999] transform transition-transform duration-300 overflow-hidden ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <Sparkle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2
                id="marketplace-chat-title"
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                Marketplace Hub
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                Browse & Manage Your Agent Skills and Tools
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {items.filter((i) => i.active).length} active items
                </span>
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {items.filter((i) => i.active).length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Active
                </div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {items.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab("browse")}
            className={`px-4 py-2 rounded transition-colors ${
              selectedTab === "browse"
                ? "bg-primary-button text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <MagnifyingGlass className="w-4 h-4" />
              Browse
            </div>
          </button>
          <button
            onClick={() => setSelectedTab("installed")}
            className={`px-4 py-2 rounded transition-colors ${
              selectedTab === "installed"
                ? "bg-primary-button text-white"
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Installed ({items.length})
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(100vh-220px)] overflow-y-auto">
          {/* Search Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <MagnifyingGlass
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && handleSearch(searchQuery)
                }
                placeholder="Search for skills, prompts, commands..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Suggestions */}
            {searchQuery && filteredSuggestions.length > 0 && (
              <div className="mt-3 space-y-1">
                {filteredSuggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Browse Tab Content */}
          {selectedTab === "browse" && (
            <div className="flex-1 p-6">
              {/* Category Filter */}
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === "all"
                      ? "bg-primary-button text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  All Items
                </button>
                <button
                  onClick={() => setSelectedCategory("agent-skills")}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === "agent-skills"
                      ? "bg-primary-button text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Agent Skills
                </button>
                <button
                  onClick={() => setSelectedCategory("prompts")}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === "prompts"
                      ? "bg-primary-button text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Prompts
                </button>
                <button
                  onClick={() => setSelectedCategory("commands")}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === "commands"
                      ? "bg-primary-button text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Commands
                </button>
              </div>

              {/* Items Grid */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {getAllExploreItems().map((item) => {
                    const installed = isItemInstalled(item);
                    return (
                      <div
                        key={`${item.itemType}-${item.id || item.hubId || Math.random()}`}
                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {item.name}
                              </h4>
                              <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                                {item.category}
                              </span>
                              {installed && (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleInstall(item)}
                            disabled={installed}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                              installed
                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-not-allowed"
                                : "bg-purple-500 hover:bg-purple-600 text-white"
                            }`}
                          >
                            {installed ? (
                              <>
                                <Check className="w-4 h-4" />
                                Installed
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
                  })}
                  {getAllExploreItems().length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No items found. Try adjusting your search or filters.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Installed Tab Content */}
          {selectedTab === "installed" && (
            <div className="flex-1 p-6">
              <div className="space-y-3">
                {items
                  .filter(
                    (item) =>
                      !searchQuery ||
                      item.name?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item) => (
                    <div
                      key={`${item.itemType}-${item.id || item.hubId || Math.random()}`}
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {item.name}
                            </h4>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                item.active
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {item.active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Type: {item.itemType}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggle(item)}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={item.active ? "Deactivate" : "Activate"}
                          >
                            <Power
                              className={`w-5 h-5 ${
                                item.active
                                  ? "text-green-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => handleUninstall(item)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="Uninstall"
                          >
                            <Trash className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {items.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    No items installed yet. Browse the marketplace to get started!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
