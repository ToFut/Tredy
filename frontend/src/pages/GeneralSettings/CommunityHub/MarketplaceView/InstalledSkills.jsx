import React from "react";
import { ToggleLeft, ToggleRight, Trash, Package, Gear, ArrowSquareOut } from "@phosphor-icons/react";

export default function InstalledSkills({ items, onToggle, onUninstall }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto text-theme-text-secondary mb-4" />
        <h3 className="text-lg font-semibold text-theme-text-primary mb-2">
          No Skills Installed
        </h3>
        <p className="text-theme-text-secondary mb-4">
          You haven't installed any agent skills yet.
        </p>
        <a
          href="/settings/community-hub"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-button text-white rounded hover:bg-primary-button-hover"
        >
          Browse Marketplace
          <ArrowSquareOut className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-theme-text-primary">
          Installed Skills ({items.length})
        </h3>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.hubId || item.id}
            className="bg-theme-bg-primary rounded-lg p-4 border border-theme-border"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <button
                  onClick={() => onToggle(item.hubId || item.id, !item.active)}
                  className={`p-2 rounded-lg transition-colors ${
                    item.active
                      ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                      : "bg-gray-500/20 text-gray-500 hover:bg-gray-500/30"
                  }`}
                  title={item.active ? "Disable" : "Enable"}
                >
                  {item.active ? (
                    <ToggleRight className="w-5 h-5" />
                  ) : (
                    <ToggleLeft className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-theme-text-primary">
                      {item.name}
                    </h4>
                    {item.active ? (
                      <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-500 rounded">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-500 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-theme-text-secondary mb-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center gap-3 text-xs text-theme-text-secondary">
                    <span>Version: {item.version || "1.0.0"}</span>
                    {item.author && <span>• Author: {item.author}</span>}
                    <span>• ID: {item.hubId || item.id}</span>
                  </div>

                  {item.setup_args && Object.keys(item.setup_args).length > 0 && (
                    <div className="mt-3 p-2 bg-theme-bg-secondary rounded">
                      <p className="text-xs font-medium text-theme-text-primary mb-1">
                        Configuration Required:
                      </p>
                      <div className="space-y-1">
                        {Object.entries(item.setup_args).map(([key, config]) => (
                          <div key={key} className="text-xs text-theme-text-secondary">
                            • {key}: {config.description || "No description"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {item.setup_args && Object.keys(item.setup_args).length > 0 && (
                  <button
                    className="p-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                    title="Configure"
                  >
                    <Gear className="w-5 h-5" />
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to uninstall "${item.name}"?`)) {
                      onUninstall(item.hubId || item.id);
                    }
                  }}
                  className="p-2 text-red-500 hover:text-red-600 transition-colors"
                  title="Uninstall"
                >
                  <Trash className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}