import React, { useState, useEffect } from "react";
import { Package, Download, TrendingUp } from "@phosphor-icons/react";
import CommunityHub from "@/models/communityHub";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function HubItems() {
  const [loading, setLoading] = useState(true);
  const [trendingItems, setTrendingItems] = useState([]);
  const [installedItems, setInstalledItems] = useState([]);

  useEffect(() => {
    loadTrendingItems();
  }, []);

  const loadTrendingItems = async () => {
    setLoading(true);
    try {
      // Load trending items (first few from explore)
      const { result } = await CommunityHub.fetchExploreItems();
      if (result) {
        const allItems = [
          ...result.agentSkills.items.slice(0, 3).map(item => ({ ...item, itemType: "agent-skill", category: "Agent Skills" })),
          ...result.systemPrompts.items.slice(0, 2).map(item => ({ ...item, itemType: "system-prompt", category: "System Prompts" })),
          ...result.slashCommands.items.slice(0, 2).map(item => ({ ...item, itemType: "slash-command", category: "Slash Commands" })),
        ];
        setTrendingItems(allItems);
      }
      
      // Load installed items
      const installed = await CommunityHub.getInstalledItems();
      setInstalledItems(installed);
    } catch (error) {
      console.error("Error loading trending items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallItem = async (item) => {
    try {
      const importId = item.importId || `allm-community-id:${item.itemType}:${item.id}`;
      
      if (item.itemType === "agent-skill") {
        await CommunityHub.importBundleItem(importId);
      } else {
        await CommunityHub.applyItem(importId, {});
      }
      
      // Reload data
      await loadTrendingItems();
    } catch (error) {
      console.error("Failed to install item:", error);
    }
  };

  const getItemIcon = (itemType) => {
    switch (itemType) {
      case "agent-skill":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "system-prompt":
        return <Package className="w-5 h-5 text-green-500" />;
      case "slash-command":
        return <Package className="w-5 h-5 text-purple-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryColor = (itemType) => {
    switch (itemType) {
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

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (trendingItems.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-16 h-16 mx-auto text-theme-text-secondary mb-4" />
        <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
          No Trending Items
        </h3>
        <p className="text-theme-text-secondary mb-4">
          No trending items are available at the moment.
        </p>
        <a
          href="/settings/community-hub/marketplace"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-button text-white rounded hover:bg-primary-button-hover"
        >
          Browse Full Marketplace
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-theme-text-primary">
          Trending Items
        </h2>
        <a
          href="/settings/community-hub/marketplace"
          className="text-sm text-primary-button hover:text-primary-button-hover transition-colors"
        >
          View All →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trendingItems.map((item) => {
          const isInstalled = installedItems.some(i => i.hubId === item.id);
          
          return (
            <div
              key={`${item.itemType}-${item.id}`}
              className="bg-theme-bg-primary rounded-lg p-4 hover:shadow-lg transition-all duration-200 border border-theme-border"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(item.itemType)}`}>
                  {getItemIcon(item.itemType)}
                </div>
                <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-500 rounded">
                  Trending
                </span>
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
                onClick={() => handleInstallItem(item)}
                disabled={isInstalled}
                className={`w-full py-2 rounded transition-colors flex items-center justify-center gap-2 ${
                  isInstalled
                    ? "bg-green-500/20 text-green-500 cursor-not-allowed"
                    : "bg-primary-button text-white hover:bg-primary-button-hover"
                }`}
              >
                {isInstalled ? (
                  <>
                    <Package className="w-4 h-4" />
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
          );
        })}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton.default
          height="24px"
          width="150px"
          highlightColor="var(--theme-settings-input-active)"
          baseColor="var(--theme-settings-input-bg)"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-theme-bg-primary rounded-lg p-4">
            <Skeleton.default
              height="20px"
              width="60%"
              highlightColor="var(--theme-settings-input-active)"
              baseColor="var(--theme-settings-input-bg)"
              className="mb-2"
            />
            <Skeleton.default
              height="40px"
              width="100%"
              highlightColor="var(--theme-settings-input-active)"
              baseColor="var(--theme-settings-input-bg)"
              className="mb-3"
            />
            <Skeleton.default
              height="30px"
              width="100%"
              highlightColor="var(--theme-settings-input-active)"
              baseColor="var(--theme-settings-input-bg)"
            />
          </div>
        ))}
      </div>
    </div>
  );
}