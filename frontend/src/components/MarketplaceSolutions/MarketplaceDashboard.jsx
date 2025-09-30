import React, { useState } from "react";
import {
  Cube,
  FileText,
  Terminal,
  Package,
  Check,
  X,
  Power,
  Trash,
  ChartBar,
  Calendar,
  Download,
  Lightning,
} from "@phosphor-icons/react";

// Item type icons
const ITEM_TYPE_ICONS = {
  "agent-skill": Cube,
  "system-prompt": FileText,
  "slash-command": Terminal,
  plugin: Package,
};

// Item type colors
const ITEM_TYPE_COLORS = {
  "agent-skill": "from-blue-500 to-blue-600",
  "system-prompt": "from-purple-500 to-purple-600",
  "slash-command": "from-green-500 to-green-600",
  plugin: "from-orange-500 to-orange-600",
};

export default function MarketplaceDashboard({
  items = [],
  onRefresh,
  onItemAction,
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  // Group items by type
  const itemsByType = items.reduce((acc, item) => {
    const type = item.itemType || "other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(item);
    return acc;
  }, {});

  // Get statistics
  const stats = {
    total: items.length,
    active: items.filter((i) => i.active).length,
    inactive: items.filter((i) => !i.active).length,
    agentSkills: itemsByType["agent-skill"]?.length || 0,
    systemPrompts: itemsByType["system-prompt"]?.length || 0,
    slashCommands: itemsByType["slash-command"]?.length || 0,
  };

  const categories = [
    { id: "all", name: "All Items", count: stats.total },
    { id: "agent-skill", name: "Agent Skills", count: stats.agentSkills },
    { id: "system-prompt", name: "System Prompts", count: stats.systemPrompts },
    { id: "slash-command", name: "Slash Commands", count: stats.slashCommands },
  ];

  const filteredItems =
    selectedCategory === "all"
      ? items
      : items.filter((item) => item.itemType === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Items"
          value={stats.total}
          color="blue"
        />
        <StatCard
          icon={Lightning}
          label="Active"
          value={stats.active}
          color="green"
        />
        <StatCard
          icon={Power}
          label="Inactive"
          value={stats.inactive}
          color="yellow"
        />
        <StatCard
          icon={Download}
          label="This Month"
          value={items.filter((i) => {
            // Filter items added this month (if we had createdAt)
            return true;
          }).length}
          color="purple"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? "bg-primary-button text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Items Display */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No items found in this category
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={`${item.itemType}-${item.id}`}
              item={item}
              onAction={onItemAction}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ItemRow
              key={`${item.itemType}-${item.id}`}
              item={item}
              onAction={onItemAction}
            />
          ))}
        </div>
      )}

      {/* Activity Timeline (Optional) */}
      {items.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <div
                key={`activity-${item.itemType}-${item.id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div
                  className={`p-2 bg-gradient-to-br ${
                    ITEM_TYPE_COLORS[item.itemType] || "from-gray-400 to-gray-600"
                  } rounded-lg`}
                >
                  {React.createElement(
                    ITEM_TYPE_ICONS[item.itemType] || Package,
                    { className: "w-4 h-4 text-white" }
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {item.itemType} • {item.active ? "Active" : "Inactive"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Statistics Card Component
function StatCard({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    yellow: "from-yellow-500 to-yellow-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <div
          className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-lg`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

// Item Card Component (Grid View)
function ItemCard({ item, onAction }) {
  const IconComponent = ITEM_TYPE_ICONS[item.itemType] || Package;
  const colorClass = ITEM_TYPE_COLORS[item.itemType] || "from-gray-400 to-gray-600";

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-3 bg-gradient-to-br ${colorClass} rounded-lg`}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white truncate">
            {item.name}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {item.itemType}
          </p>
        </div>
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.active
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          {item.active ? "Active" : "Inactive"}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onAction?.(item)}
          className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Power className="w-4 h-4" />
          {item.active ? "Disable" : "Enable"}
        </button>
        <button
          onClick={() => onAction?.(item)}
          className="p-2 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
          title="Remove"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Item Row Component (List View)
function ItemRow({ item, onAction }) {
  const IconComponent = ITEM_TYPE_ICONS[item.itemType] || Package;
  const colorClass = ITEM_TYPE_COLORS[item.itemType] || "from-gray-400 to-gray-600";

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-3 bg-gradient-to-br ${colorClass} rounded-lg`}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {item.itemType}
          </p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            item.active
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}
        >
          {item.active ? "Active" : "Inactive"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAction?.(item)}
            className="px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Power className="w-4 h-4" />
            {item.active ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => onAction?.(item)}
            className="p-2 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors"
            title="Remove"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
