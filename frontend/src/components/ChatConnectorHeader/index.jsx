import React, { useState, useEffect, useRef } from "react";
import { isMobile } from "react-device-detect";
import {
  List,
  Plus,
  Gear,
  X,
  Plug,
  ArrowsClockwise,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { AddConnectorButton } from "../ConnectorBadge";
import ConnectorAvatarGroup from "../ConnectorAvatarGroup";
import UserConnector from "@/models/userConnector";
import paths from "@/utils/paths";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import showToast from "@/utils/toast";
import ModalWrapper from "../ModalWrapper";

// Quick Connect Modal Component
function QuickConnectModal({
  isOpen,
  onClose,
  availableConnectors = [],
  onConnect,
}) {
  const [connecting, setConnecting] = useState(null);

  const handleConnect = async (provider) => {
    try {
      setConnecting(provider);
      await onConnect(provider);
      onClose();
    } catch (error) {
      showToast(`Failed to connect ${provider}`, "error");
    } finally {
      setConnecting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="w-full max-w-md bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border overflow-hidden">
        {/* Header */}
        <div className="relative p-4 border-b border-theme-modal-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-theme-text-primary flex items-center gap-2">
              <Plug className="w-5 h-5" />
              Connect Service
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-theme-bg-primary rounded transition-colors"
            >
              <X className="w-5 h-5 text-theme-text-secondary" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {availableConnectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector.id)}
                disabled={connecting === connector.id}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <img
                  src={connector.logo}
                  alt={connector.name}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-theme-text-primary">
                    {connector.name}
                  </div>
                  <div className="text-xs text-theme-text-secondary">
                    {connector.category}
                  </div>
                </div>
                {connecting === connector.id && (
                  <ArrowsClockwise className="w-4 h-4 animate-spin text-blue-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-modal-border">
          <p className="text-xs text-theme-text-secondary text-center">
            Connected services will be available across all your workspaces
          </p>
        </div>
      </div>
    </ModalWrapper>
  );
}

// Desktop Chat Header
export function DesktopChatConnectorHeader({
  connectors = [],
  onConnectorClick,
  onConnectorSync,
  onConnectorSettings,
  onAddConnector,
  onManageConnectors,
}) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Left: Connected Services */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Connected:
          </span>
          <ConnectorAvatarGroup
            connectors={connectors}
            maxVisible={6}
            onConnectorClick={onConnectorClick}
            onAddConnector={onAddConnector}
            onShowAll={onManageConnectors}
          />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <AddConnectorButton
            onClick={onAddConnector}
            size="sm"
            className="hover:scale-105"
          />
          <button
            onClick={onManageConnectors}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Manage connectors"
          >
            <Gear className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Mobile Header with Connectors - includes full sidebar functionality
export function MobileChatConnectorHeader({
  connectors = [],
  onConnectorClick,
  onConnectorSync,
  onConnectorSettings,
  onAddConnector,
  onManageConnectors,
}) {
  const { logo } = useLogo();
  const { user } = useUser();
  const sidebarRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);

  useEffect(() => {
    // Darkens the rest of the screen when sidebar is open
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => {
          setShowBgOverlay(true);
        }, 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  return (
    <>
      {/* Main Header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div
          className="flex justify-between items-center px-4 py-3"
          style={{ height: "var(--app-header-height, 64px)" }}
        >
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <List className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-6 w-6 rounded" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                Tredy
              </span>
            </div>
          </div>

          {/* Right: Connector Actions */}
          <div className="flex items-center gap-2">
            <ConnectorAvatarGroup
              connectors={connectors}
              maxVisible={3}
              avatarSize={28}
              spacing={-6}
              onConnectorClick={onConnectorClick}
              onAddConnector={onAddConnector}
              onShowAll={onManageConnectors}
              showAddButton={false}
            />
            <AddConnectorButton onClick={onAddConnector} size="sm" />
          </div>
        </div>

        {/* Connector Status Bar (if connectors exist) */}
        {connectors.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {connectors.length} service{connectors.length !== 1 ? "s" : ""}{" "}
                connected
              </span>
              <button
                onClick={onManageConnectors}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Manage
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sidebar - Enhanced version of SidebarMobileHeader sidebar */}
      <div
        style={{
          transform: showSidebar ? `translateX(0vw)` : `translateX(-100vw)`,
        }}
        className={`z-99 fixed top-0 left-0 transition-all duration-500 w-[100vw] h-[100vh]`}
      >
        <div
          className={`${
            showBgOverlay
              ? "transition-all opacity-1"
              : "transition-none opacity-0"
          }  duration-500 fixed top-0 left-0 bg-black bg-opacity-50 w-screen h-screen`}
          onClick={() => setShowSidebar(false)}
        />
        <div
          ref={sidebarRef}
          className="relative h-[100vh] fixed top-0 left-0 bg-white dark:bg-gray-900 w-[85%] max-w-[320px] shadow-2xl"
        >
          <div className="w-full h-full flex flex-col overflow-x-hidden">
            {/* Enhanced Header with Connectors */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Tredy
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      AI Workspace
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Connected Services Section */}
              {connectors.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Connected Services
                    </span>
                    <button
                      onClick={onManageConnectors}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Manage
                    </button>
                  </div>
                  <ConnectorAvatarGroup
                    connectors={connectors}
                    maxVisible={8}
                    avatarSize={24}
                    spacing={-4}
                    onConnectorClick={onConnectorClick}
                    onAddConnector={onAddConnector}
                    onShowAll={onManageConnectors}
                    showAddButton={false}
                  />
                </div>
              )}

              {/* Search */}
              {(!user || user?.role !== "default") && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <MagnifyingGlass className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search workspaces..."
                    className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-300 placeholder-gray-500"
                  />
                </div>
              )}
            </div>

            {/* The rest would contain workspace navigation - simplified for now */}
            <div className="flex-1 p-4">
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                Workspace navigation goes here...
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="text-center">
                <button
                  onClick={onAddConnector}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Add Connector</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Main ChatConnectorHeader Component
export default function ChatConnectorHeader() {
  const { user } = useUser();
  const [connectors, setConnectors] = useState([]);
  const [availableConnectors, setAvailableConnectors] = useState([]);
  const [showQuickConnect, setShowQuickConnect] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch user connectors
  useEffect(() => {
    async function fetchConnectors() {
      try {
        const [userConnectors, available] = await Promise.all([
          UserConnector.list(),
          UserConnector.getAvailable(),
        ]);

        setConnectors(userConnectors || []);
        setAvailableConnectors(available || []);
      } catch (error) {
        console.error("Failed to fetch connectors:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchConnectors();

    // Listen for connector updates from chat buttons
    const handleConnectorUpdate = () => {
      refreshConnectors();
    };

    window.addEventListener("connector-updated", handleConnectorUpdate);

    return () => {
      window.removeEventListener("connector-updated", handleConnectorUpdate);
    };
  }, []);

  const handleConnectorClick = (connector) => {
    // Handle clicking on a specific connector (could show details, sync, etc.)
    console.log("Connector clicked:", connector);
  };

  const handleConnectorSync = async (connector) => {
    try {
      await UserConnector.sync(connector.provider);
      showToast(`${connector.provider} synced successfully`, "success");
      // Refresh connectors list
      const updatedConnectors = await UserConnector.list();
      setConnectors(updatedConnectors || []);
    } catch (error) {
      showToast(`Failed to sync ${connector.provider}`, "error");
    }
  };

  const handleConnectorSettings = (connector) => {
    // Navigate to connector settings
    window.location.href = paths.settings.userConnectors();
  };

  const handleAddConnector = () => {
    setShowQuickConnect(true);
  };

  const handleQuickConnect = async (provider) => {
    try {
      const { authUrl } = await UserConnector.initOAuth(provider);
      if (authUrl) {
        // Open OAuth window
        const authWindow = window.open(
          authUrl,
          "connector_auth",
          "width=600,height=700"
        );

        // Listen for OAuth callback
        const checkInterval = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkInterval);
            // Refresh connectors list
            refreshConnectors();
          }
        }, 1000);
      }
    } catch (error) {
      throw error; // Re-throw to be handled by QuickConnectModal
    }
  };

  const handleManageConnectors = () => {
    window.location.href = paths.settings.userConnectors();
  };

  const refreshConnectors = async () => {
    const userConnectors = await UserConnector.list();
    setConnectors(userConnectors || []);
  };

  if (loading) {
    return isMobile ? (
      <div className="fixed top-0 left-0 right-0 z-10 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    ) : (
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-4">
        <div className="text-sm text-gray-500">Loading connectors...</div>
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <MobileChatConnectorHeader
          connectors={connectors}
          onConnectorClick={handleConnectorClick}
          onConnectorSync={handleConnectorSync}
          onConnectorSettings={handleConnectorSettings}
          onAddConnector={handleAddConnector}
          onManageConnectors={handleManageConnectors}
        />
      ) : (
        <DesktopChatConnectorHeader
          connectors={connectors}
          onConnectorClick={handleConnectorClick}
          onConnectorSync={handleConnectorSync}
          onConnectorSettings={handleConnectorSettings}
          onAddConnector={handleAddConnector}
          onManageConnectors={handleManageConnectors}
        />
      )}

      {/* Quick Connect Modal */}
      <QuickConnectModal
        isOpen={showQuickConnect}
        onClose={() => setShowQuickConnect(false)}
        availableConnectors={availableConnectors}
        onConnect={handleQuickConnect}
      />
    </>
  );
}
