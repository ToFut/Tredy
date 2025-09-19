import { useState } from "react";
import { X } from "@phosphor-icons/react";

export default function AddConnectorModal({
  availableConnectors,
  onAdd,
  onClose,
}) {
  const [selectedProvider, setSelectedProvider] = useState(null);

  const handleConnect = () => {
    if (selectedProvider) {
      onAdd(selectedProvider);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-theme-bg-primary rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-theme-border">
          <h2 className="text-xl font-semibold text-theme-text-primary">
            Add New Connector
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-theme-bg-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-theme-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-theme-text-secondary mb-6">
            Choose a service to connect to your account. These integrations will
            be available across all your workspaces.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {availableConnectors.map((connector) => (
              <div
                key={connector.provider}
                onClick={() => setSelectedProvider(connector.provider)}
                className={`cursor-pointer p-4 rounded-lg border transition-all ${
                  selectedProvider === connector.provider
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-theme-border hover:border-theme-text-secondary"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {getProviderIcon(connector.provider)}
                  </div>
                  <div>
                    <h3 className="font-medium text-theme-text-primary">
                      {connector.name}
                    </h3>
                    <p className="text-xs text-theme-text-secondary">
                      {connector.description}
                    </p>
                    {!connector.supported && (
                      <span className="inline-block mt-1 text-xs text-amber-500">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>

                {connector.scopes && (
                  <div className="mt-3 pt-3 border-t border-theme-border">
                    <p className="text-xs text-theme-text-secondary">
                      Permissions: {connector.scopes.slice(0, 2).join(", ")}
                      {connector.scopes.length > 2 && "..."}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-theme-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={!selectedProvider}
            className="px-6 py-2 bg-theme-bg-primary text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}

function getProviderIcon(provider) {
  const icons = {
    gmail: "📧",
    slack: "💬",
    "google-drive": "📁",
    notion: "📝",
    github: "🐙",
    shopify: "🛒",
  };
  return icons[provider] || "🔌";
}
