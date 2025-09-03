import React, { useState, useEffect } from "react";
import Admin from "@/models/admin";

export default function ConnectorNode({
  config,
  onConfigChange,
  renderVariableSelect,
}) {
  const [availableConnectors, setAvailableConnectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAvailableConnectors();
  }, []);

  const fetchAvailableConnectors = async () => {
    try {
      // Fetch SQL connections
      const res = await Admin.systemPreferencesByFields(["agent_sql_connections"]);
      const sqlConnections = res?.settings?.agent_sql_connections || [];
      
      // Build connectors list
      const connectors = [];
      
      // Add SQL connections
      sqlConnections.forEach(conn => {
        if (conn.action !== "remove") {
          connectors.push({
            type: "sql",
            id: conn.database_id,
            label: `SQL: ${conn.database_id}`,
            config: conn
          });
        }
      });

      // Add other connector types that might be available
      // These would be based on system configuration
      const systemConnectors = [
        { type: "webhook", id: "webhook", label: "Webhook" },
        { type: "api", id: "rest-api", label: "REST API" },
        { type: "nango", id: "nango", label: "Nango Integration" },
        { type: "universal", id: "universal", label: "Universal Integration" },
      ];

      setAvailableConnectors([...connectors, ...systemConnectors]);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch connectors:", error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Connector
        </label>
        {loading ? (
          <div className="text-sm text-theme-text-secondary">Loading connectors...</div>
        ) : (
          <select
            value={config?.connectorType || ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                connectorType: e.target.value,
              })
            }
            className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
          >
            <option value="">Select a connector...</option>
            {availableConnectors.map((connector) => (
              <option key={`${connector.type}-${connector.id}`} value={connector.id}>
                {connector.label}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Configuration
        </label>
        <textarea
          value={config?.parameters || ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              parameters: e.target.value,
            })
          }
          className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
          rows={3}
          placeholder="Enter connector configuration (JSON format)..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Result Variable
        </label>
        {renderVariableSelect(
          config.resultVariable,
          (value) => onConfigChange({ ...config, resultVariable: value }),
          "Select or create variable",
          true
        )}
      </div>
    </div>
  );
}