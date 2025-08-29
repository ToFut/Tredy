import React, { useState, useEffect } from "react";
import { Package, Download, Check, ToggleLeft, ToggleRight, Trash, MagnifyingGlass, SquaresFour, List } from "@phosphor-icons/react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import CommunityHub from "@/models/communityHub";
import paths from "@/utils/paths";
import SkillCard from "./SkillCard";
import InstalledSkills from "./InstalledSkills";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function MarketplaceView() {
  const [activeTab, setActiveTab] = useState("discover");
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [exploreItems, setExploreItems] = useState({
    agentSkills: { items: [], hasMore: false, totalCount: 0 },
    systemPrompts: { items: [], hasMore: false, totalCount: 0 },
    slashCommands: { items: [], hasMore: false, totalCount: 0 },
  });
  const [installedItems, setInstalledItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load explore items
      const { result } = await CommunityHub.fetchExploreItems();
      if (result) {
        setExploreItems(result);
      }
      
      // Load installed items
      const installed = await CommunityHub.getInstalledItems();
      setInstalledItems(installed);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInstallItem = async (item) => {
    try {
      const importId = item.importId || `allm-community-id:${item.itemType}:${item.id}`;
      
      if (item.itemType === "agent-skill") {
        await CommunityHub.importBundleItem(importId);
      } else if (item.itemType === "system-prompt") {
        // System prompts require workspace-specific installation
        alert("System prompts must be installed per workspace. Go to a specific workspace and use the 'Import Item' feature to install this system prompt.");
        return;
      } else if (item.itemType === "slash-command") {
        await CommunityHub.applyItem(importId, {});
      } else {
        // For other item types, try to apply them
        await CommunityHub.applyItem(importId, {});
      }
      
      // Reload data
      await loadData();
    } catch (error) {
      console.error("Failed to install item:", error);
      alert("Failed to install item: " + error.message);
    }
  };

  const handleUninstallItem = async (itemId) => {
    try {
      await CommunityHub.uninstallItem(itemId);
      await loadData();
    } catch (error) {
      console.error("Failed to uninstall item:", error);
    }
  };

  const handleToggleItem = async (itemId, active) => {
    try {
      await CommunityHub.toggleItem(itemId, active);
      await loadData();
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  // Get all items in a flat array
  const getAllItems = () => {
    const items = [];
    
    if (selectedCategory === "all" || selectedCategory === "agent-skills") {
      exploreItems.agentSkills?.items?.forEach(item => {
        items.push({ ...item, itemType: "agent-skill", category: "Agent Skills" });
      });
    }
    
    if (selectedCategory === "all" || selectedCategory === "prompts") {
      exploreItems.systemPrompts?.items?.forEach(item => {
        items.push({ ...item, itemType: "system-prompt", category: "System Prompts" });
      });
    }
    
    if (selectedCategory === "all" || selectedCategory === "commands") {
      exploreItems.slashCommands?.items?.forEach(item => {
        items.push({ ...item, itemType: "slash-command", category: "Slash Commands" });
      });
    }
    
    return items.filter(item => 
      !searchQuery || item.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const categories = [
    { id: "all", name: "All Items", count: 
      (exploreItems.agentSkills?.totalCount || 0) + 
      (exploreItems.systemPrompts?.totalCount || 0) + 
      (exploreItems.slashCommands?.totalCount || 0) 
    },
    { id: "agent-skills", name: "Agent Skills", count: exploreItems.agentSkills?.totalCount || 0 },
    { id: "prompts", name: "System Prompts", count: exploreItems.systemPrompts?.totalCount || 0 },
    { id: "commands", name: "Slash Commands", count: exploreItems.slashCommands?.totalCount || 0 },
  ];

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[86px] md:py-6 py-16">
          {/* Header */}
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white light:border-theme-sidebar-border border-b-2 border-opacity-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg leading-6 font-bold text-theme-text-primary">
                  Community Hub Marketplace
                </p>
                <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
                  Discover and install agent skills, prompts, and commands from the community
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="p-2 rounded hover:bg-theme-bg-primary transition-colors"
                >
                  {viewMode === "grid" ? <List className="w-5 h-5" /> : <SquaresFour className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-6 mb-4">
            <button
              onClick={() => setActiveTab("discover")}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === "discover"
                  ? "bg-primary-button text-white"
                  : "bg-theme-bg-primary text-theme-text-secondary hover:text-theme-text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <MagnifyingGlass className="w-4 h-4" />
                Discover
              </div>
            </button>
            <button
              onClick={() => setActiveTab("installed")}
              className={`px-4 py-2 rounded transition-colors ${
                activeTab === "installed"
                  ? "bg-primary-button text-white"
                  : "bg-theme-bg-primary text-theme-text-secondary hover:text-theme-text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Installed ({installedItems.length})
              </div>
            </button>
          </div>

          {/* Search Bar */}
          {activeTab === "discover" && (
            <div className="mb-6">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-theme-text-secondary" />
                <input
                  type="text"
                  placeholder="Search skills, prompts, and commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-theme-bg-primary border border-theme-border rounded-lg focus:outline-none focus:border-primary-button"
                />
              </div>
            </div>
          )}

          {/* Category Filter */}
          {activeTab === "discover" && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategory === category.id
                      ? "bg-primary-button text-white"
                      : "bg-theme-bg-primary text-theme-text-secondary hover:text-theme-text-primary"
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <LoadingSkeleton />
          ) : activeTab === "discover" ? (
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
              {getAllItems().map((item) => (
                <SkillCard
                  key={`${item.itemType}-${item.id}`}
                  item={item}
                  viewMode={viewMode}
                  onInstall={() => handleInstallItem(item)}
                  isInstalled={installedItems.some(i => i.hubId === item.id)}
                />
              ))}
              {getAllItems().length === 0 && (
                <div className="col-span-full text-center py-8 text-theme-text-secondary">
                  No items found. Try adjusting your search or filters.
                </div>
              )}
            </div>
          ) : (
            <InstalledSkills
              items={installedItems}
              onToggle={handleToggleItem}
              onUninstall={handleUninstallItem}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
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
  );
}