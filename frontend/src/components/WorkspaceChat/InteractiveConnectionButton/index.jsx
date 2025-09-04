import React, { useState, useEffect } from "react";
import { Plug, Check, X, ArrowRight } from "@phosphor-icons/react";
import System from "@/models/system";
import Workspace from "@/models/workspace";
import nangoService from "@/services/NangoService";

export default function InteractiveConnectionButton({ 
  provider, 
  workspace,
  placeholderId 
}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [providerInfo, setProviderInfo] = useState(null);

  console.log("🔌 InteractiveConnectionButton rendering for:", provider, workspace?.slug);

  // Early return with debug if no provider
  if (!provider) {
    console.error("🔌 ERROR: No provider specified for InteractiveConnectionButton");
    return <div className="text-red-500">Error: No provider specified</div>;
  }

  useEffect(() => {
    // Load provider info and check status on mount
    console.log("🔌 Component mounted, loading provider info for:", provider);
    loadProviderInfo();
    checkConnectionStatus();
  }, []);

  const loadProviderInfo = async () => {
    try {
      // Get available providers list using workspace model
      const response = await Workspace.connectors.getAvailable(workspace?.slug);
      const info = response.providers?.find(p => p.id === provider);
      if (info) {
        setProviderInfo(info);
      }
    } catch (err) {
      console.error("Failed to load provider info:", err);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      // Use workspace model to check connection status
      const response = await Workspace.connectors.list(workspace?.slug);
      const connector = response.connectors?.find(c => c.provider === provider);
      setIsConnected(connector?.status === "connected");
    } catch (err) {
      console.error("Failed to check connection status:", err);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Get OAuth configuration from existing endpoint
      const initResponse = await fetch(
        `${API_BASE}/v1/workspace/${workspace?.slug}/connectors/connect`,
        {
          method: "POST",
          headers: baseHeaders(),
          body: JSON.stringify({ provider }),
        }
      );

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.error || "Failed to initialize OAuth");
      }

      const { authConfig, message } = await initResponse.json();

      // Check if already connected
      if (message === "Already connected") {
        setIsConnected(true);
        System.success(`Already connected to ${providerInfo?.name || provider}!`);
        setIsConnecting(false);
        return;
      }

      // Check if provider is not configured in Nango
      if (authConfig?.error === 'provider_not_configured') {
        setError(`${authConfig.message} Please configure ${provider} in your Nango dashboard first.`);
        setIsConnecting(false);
        return;
      }

      // Check if we have Nango configured
      if (!authConfig?.publicKey) {
        setError("OAuth not configured for this provider");
        setIsConnecting(false);
        return;
      }

      // Load Nango frontend SDK if not already loaded
      if (!window.Nango) {
        await loadNangoSDK();
      }

      // Create Nango instance
      const nango = new window.Nango({ 
        publicKey: authConfig.publicKey,
        host: authConfig.host 
      });

      // Trigger OAuth flow
      const result = await nango.auth(
        authConfig.providerConfigKey,
        authConfig.connectionId
      );

      if (result) {
        // Notify backend of successful OAuth
        const callbackResponse = await fetch(
          `${API_BASE}/v1/workspace/${workspace?.slug}/connectors/callback`,
          {
            method: "POST",
            headers: baseHeaders(),
            body: JSON.stringify({
              provider,
              connectionId: authConfig.connectionId,
            }),
          }
        );

        if (callbackResponse.ok) {
          setIsConnected(true);
          System.success(`Successfully connected to ${providerInfo?.name || provider}!`);
        }
      }
    } catch (err) {
      console.error("OAuth connection failed:", err);
      setError(err.message || "Connection failed");
      System.error(`Failed to connect to ${providerInfo?.name || provider}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch(
        `${API_BASE}/v1/workspace/${workspace?.slug}/connectors/${provider}`,
        {
          method: "DELETE",
          headers: baseHeaders(),
        }
      );

      if (response.ok) {
        setIsConnected(false);
        System.success(`Disconnected from ${providerInfo?.name || provider}`);
      }
    } catch (err) {
      console.error("Failed to disconnect:", err);
      System.error(`Failed to disconnect from ${providerInfo?.name || provider}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Get display info from provider or use defaults
  const displayInfo = providerInfo || {
    name: provider.charAt(0).toUpperCase() + provider.slice(1),
    description: `Connect to ${provider}`,
    category: "integration"
  };

  // Map categories to colors and icons
  const categoryStyles = {
    communication: { icon: "💬", color: "from-blue-500 to-blue-600" },
    ecommerce: { icon: "🛍️", color: "from-green-500 to-green-600" },
    productivity: { icon: "📅", color: "from-purple-500 to-purple-600" },
    payments: { icon: "💳", color: "from-indigo-500 to-indigo-600" },
    development: { icon: "🐙", color: "from-gray-700 to-gray-900" },
    integration: { icon: "🔌", color: "from-gray-500 to-gray-600" }
  };

  const style = categoryStyles[displayInfo.category] || categoryStyles.integration;

  return (
    <div className="my-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${style.color} text-white flex items-center justify-center`}>
          <span className="text-2xl">{style.icon}</span>
        </div>
        
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Connect to {displayInfo.name}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {displayInfo.description}
          </p>
          
          {error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <X size={16} />
                {error}
              </p>
            </div>
          )}
          
          {isConnected ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Check size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Connected
                </span>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={isConnecting}
                className="text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white
                bg-gradient-to-r ${style.color} hover:opacity-90 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-md hover:shadow-lg transform hover:-translate-y-0.5
              `}
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plug size={18} />
                  Connect {displayInfo.name}
                  <ArrowRight size={16} className="ml-1" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to load Nango SDK
function loadNangoSDK() {
  return new Promise((resolve, reject) => {
    if (window.Nango) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/@nangohq/frontend/dist/index.umd.js";
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}