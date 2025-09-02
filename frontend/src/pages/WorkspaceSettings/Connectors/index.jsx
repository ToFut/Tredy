import React, { useState, useEffect } from "react";
import { Plug, Plus, Trash, RefreshCw, Check, X } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import { useParams } from "react-router-dom";
import PreLoader from "@/components/Preloader";

export default function WorkspaceConnectors({ workspace }) {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [connectors, setConnectors] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);

  useEffect(() => {
    fetchConnectorData();
  }, [slug]);

  const fetchConnectorData = async () => {
    if (!slug) return;
    setLoading(true);
    
    try {
      // Fetch available providers and current connections in parallel
      const [providersResponse, connectorsResponse] = await Promise.all([
        Workspace.connectors.getAvailable(slug),
        Workspace.connectors.list(slug),
      ]);

      setAvailableProviders(providersResponse?.providers || []);
      setConnectors(connectorsResponse?.connectors || []);
    } catch (error) {
      console.error("Failed to fetch connector data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider) => {
    setSaving(provider.id);
    
    try {
      const response = await Workspace.connectors.connect(slug, {
        provider: provider.id,
      });

      if (response.authUrl) {
        // OAuth flow - redirect to auth URL
        window.location.href = response.authUrl;
      } else if (response.success) {
        // Direct connection successful
        await fetchConnectorData();
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setSaving("");
    }
  };

  const handleDisconnect = async (provider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) return;
    
    setSaving(provider);
    
    try {
      await Workspace.connectors.disconnect(slug, provider);
      await fetchConnectorData();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setSaving("");
    }
  };

  const handleSync = async (provider) => {
    setSaving(`sync-${provider}`);
    
    try {
      await Workspace.connectors.sync(slug, provider);
      await fetchConnectorData();
    } catch (error) {
      console.error("Failed to sync:", error);
    } finally {
      setSaving("");
    }
  };

  const isConnected = (providerId) => {
    return connectors.some((c) => c.provider === providerId && c.status === "connected");
  };

  const getConnectionStatus = (providerId) => {
    const connector = connectors.find((c) => c.provider === providerId);
    return connector?.status || "disconnected";
  };

  const getLastSync = (providerId) => {
    const connector = connectors.find((c) => c.provider === providerId);
    if (!connector?.lastSync) return "Never";
    
    const date = new Date(connector.lastSync);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex h-full w-full justify-center items-center">
        <PreLoader size="lg" />
      </div>
    );
  }

  // Group providers by category
  const categories = availableProviders.reduce((acc, provider) => {
    const category = provider.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(provider);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-y-6 px-4">
      <div className="flex flex-col gap-y-2">
        <h2 className="text-base leading-6 font-bold text-white">
          Data Connectors
        </h2>
        <p className="text-xs leading-[18px] font-base text-white/60">
          Connect external data sources to enhance your workspace with real-time information.
          {process.env.REACT_APP_NANGO_PUBLIC_KEY && (
            <span className="text-blue-400 ml-1">OAuth enabled via Nango</span>
          )}
        </p>
      </div>

      {/* Connected Services */}
      {connectors.length > 0 && (
        <div className="flex flex-col gap-y-4">
          <h3 className="text-sm font-semibold text-white">Connected Services</h3>
          <div className="flex flex-col gap-y-2">
            {connectors.map((connector) => (
              <div
                key={connector.provider}
                className="flex items-center justify-between p-3 bg-theme-bg-secondary rounded-lg border border-theme-border"
              >
                <div className="flex items-center gap-x-3">
                  <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                    <Plug className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white capitalize">
                      {connector.provider}
                    </p>
                    <p className="text-xs text-white/60">
                      Last sync: {getLastSync(connector.provider)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-x-2">
                  <button
                    onClick={() => handleSync(connector.provider)}
                    disabled={saving === `sync-${connector.provider}`}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-4 h-4 text-white ${
                        saving === `sync-${connector.provider}` ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDisconnect(connector.provider)}
                    disabled={saving === connector.provider}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Connectors */}
      <div className="flex flex-col gap-y-4">
        <h3 className="text-sm font-semibold text-white">Available Connectors</h3>
        {Object.entries(categories).map(([category, providers]) => (
          <div key={category} className="flex flex-col gap-y-2">
            <h4 className="text-xs font-medium text-white/60 uppercase tracking-wider">
              {category}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {providers.map((provider) => {
                const connected = isConnected(provider.id);
                const status = getConnectionStatus(provider.id);
                
                return (
                  <button
                    key={provider.id}
                    onClick={() => !connected && handleConnect(provider)}
                    disabled={connected || saving === provider.id}
                    className={`
                      relative p-4 rounded-lg border transition-all
                      ${
                        connected
                          ? "bg-green-500/10 border-green-500/30 cursor-default"
                          : "bg-theme-bg-secondary border-theme-border hover:border-blue-500/50 hover:bg-blue-500/5"
                      }
                      ${saving === provider.id ? "opacity-50" : ""}
                    `}
                  >
                    {/* Status indicator */}
                    {connected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    )}
                    
                    {/* Provider icon */}
                    <div className="flex justify-center mb-2">
                      <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Plug className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Provider name */}
                    <h5 className="text-xs font-medium text-white text-center">
                      {provider.name}
                    </h5>
                    
                    {/* Status text */}
                    <p className="text-xs text-white/40 text-center mt-1">
                      {connected ? "Connected" : "Click to connect"}
                    </p>
                    
                    {/* Loading indicator */}
                    {saving === provider.id && (
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-xs text-blue-300">
          <strong>How it works:</strong> Connected services become available as agent tools. 
          Your AI assistant can query and interact with these services automatically.
          {!process.env.REACT_APP_NANGO_PUBLIC_KEY && (
            <span className="block mt-2 text-yellow-300">
              Note: OAuth is not configured. Add NANGO_SECRET_KEY to enable OAuth authentication.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}