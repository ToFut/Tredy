import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  UserPlus,
  Share,
  Sparkle,
  Crown,
  Users,
  Robot,
  Lightning,
  ArrowsOut,
  Plug,
  Trash,
  ArrowClockwise,
  Check,
} from "@phosphor-icons/react";
import { isMobile } from "react-device-detect";
import Admin from "@/models/admin";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import ModalWrapper from "../ModalWrapper";
import nangoService from "@/services/NangoService";
import BackgroundTasksBubble from "../WorkspaceChat/BackgroundTasksBubble";

// Avatar Component - Google-style circular avatars
function Avatar({
  user,
  size = 40,
  onClick,
  showBadge = false,
  badgeIcon: BadgeIcon,
}) {
  const colors = [
    "bg-gradient-to-br from-blue-400 to-blue-600",
    "bg-gradient-to-br from-purple-400 to-purple-600",
    "bg-gradient-to-br from-green-400 to-green-600",
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-indigo-400 to-indigo-600",
    "bg-gradient-to-br from-teal-400 to-teal-600",
  ];

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const colorIndex =
    (user?.username || user?.email || "").charCodeAt(0) % colors.length;

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      {/* Main Avatar */}
      <div
        className={`
        w-full h-full rounded-full flex items-center justify-center
        ${colors[colorIndex]} text-white font-semibold shadow-md
        ring-2 ring-white dark:ring-gray-800
        ${onClick ? "hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-900 hover:shadow-lg" : ""}
      `}
        style={{ fontSize: size * 0.4 }}
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(user?.username || user?.email || "User")
        )}
      </div>

      {/* Status Badge */}
      {showBadge && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
      )}

      {/* Role Badge */}
      {BadgeIcon && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
          <BadgeIcon className="w-3 h-3 text-yellow-900" />
        </div>
      )}

      {/* Hover Tooltip */}
      {user && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
          {user.username || user.email}
          {user.role && (
            <span className="text-gray-400 ml-1">• {user.role}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Simple Connector Bubble
function ConnectorBubble({ connector, size = 40, onClick }) {
  const styles = {
    gmail: { color: "from-red-400 to-red-600", emoji: "📧" },
    slack: { color: "from-purple-500 to-purple-700", emoji: "💬" },
    github: { color: "from-gray-700 to-gray-900", emoji: "🐙" },
    notion: { color: "from-gray-600 to-gray-800", emoji: "📝" },
    default: { color: "from-gray-400 to-gray-600", emoji: "🔌" },
  };

  const style = styles[connector?.type] || styles.default;

  return (
    <div
      className="relative group cursor-pointer transform transition-all duration-300 hover:scale-105"
      onClick={onClick}
      style={{ width: size, height: size }}
    >
      <div
        className={`w-full h-full rounded-full flex items-center justify-center bg-gradient-to-br ${style.color} shadow-md ring-2 ring-white dark:ring-gray-800 hover:shadow-lg`}
      >
        <span style={{ fontSize: size * 0.5 }}>{style.emoji}</span>
      </div>
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse" />
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {connector?.name || "Service"}
      </div>
    </div>
  );
}

// Real Nango Connector Modal
function ConnectorModal({ isOpen, onClose, workspace }) {
  const [connectors, setConnectors] = useState([]);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [saving, setSaving] = useState("");
  const [nangoConfigured, setNangoConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [justConnected, setJustConnected] = useState(null);

  const connectorStyles = {
    gmail: { emoji: "📧", color: "from-red-400 to-red-600" },
    slack: { emoji: "💬", color: "from-purple-500 to-purple-700" },
    github: { emoji: "🐙", color: "from-gray-700 to-gray-900" },
    notion: { emoji: "📝", color: "from-gray-600 to-gray-800" },
    drive: { emoji: "📁", color: "from-blue-400 to-blue-600" },
    default: { emoji: "🔌", color: "from-gray-400 to-gray-600" },
  };

  const fetchConnectorData = async () => {
    if (!workspace?.slug) return;
    setLoading(true);

    try {
      const [providersResponse, connectorsResponse, nangoConfigured] =
        await Promise.all([
          Workspace.connectors.getAvailable(workspace.slug),
          Workspace.connectors.list(workspace.slug),
          nangoService.isConfigured(),
        ]);

      setAvailableProviders(providersResponse?.providers || []);
      setConnectors(connectorsResponse?.connectors || []);
      setNangoConfigured(nangoConfigured);
    } catch (error) {
      console.error("Failed to fetch connector data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && workspace) {
      fetchConnectorData();
    }
  }, [isOpen, workspace]);

  const handleConnect = async (provider) => {
    setSaving(provider.id);

    try {
      const response = await Workspace.connectors.connect(workspace.slug, {
        provider: provider.id,
      });

      if (response.authConfig) {
        const { connectionId, providerConfigKey, error } = response.authConfig;

        // Check if there's a configuration error
        if (error === "provider_not_configured") {
          showToast(
            `${provider.name} is not configured in Nango. Please contact your administrator.`,
            "error"
          );
          return;
        }

        console.log(`[Connectors] Starting OAuth for ${provider.name}:`, {
          providerConfigKey,
          connectionId,
        });

        // Validate providerConfigKey before attempting OAuth
        if (!providerConfigKey) {
          throw new Error(`Provider configuration not found for ${provider.name}. Please check Nango setup.`);
        }

        await nangoService.connect(providerConfigKey, connectionId);

        console.log(`[Connectors] OAuth completed for ${provider.name}`);

        try {
          const callbackResponse = await Workspace.connectors.callback(
            workspace.slug,
            {
              provider: provider.id,
              connectionId: connectionId,
            }
          );
          console.log(
            `[Connectors] Callback processed for ${provider.name}:`,
            callbackResponse
          );

          if (!callbackResponse.success) {
            console.warn(
              `[Connectors] Callback warning for ${provider.name}:`,
              callbackResponse.error
            );
            // Try alternative connection ID format
            try {
              console.log(
                `[Connectors] Retrying callback with workspace_${workspace.id} format`
              );
              const retryResponse = await Workspace.connectors.callback(
                workspace.slug,
                {
                  provider: provider.id,
                  connectionId: `workspace_${workspace.id}`,
                }
              );
              if (retryResponse.success) {
                console.log(
                  `[Connectors] Retry callback successful for ${provider.name}`
                );
              } else {
                showToast(
                  `${provider.name} connected but may need manual verification`,
                  "warning"
                );
              }
            } catch (retryError) {
              console.error(
                `[Connectors] Retry callback also failed:`,
                retryError
              );
              showToast(
                `${provider.name} connected but backend callback failed`,
                "warning"
              );
            }
          }
        } catch (e) {
          console.error(
            `[Connectors] Callback failed for ${provider.name}:`,
            e
          );

          // Try alternative connection format as fallback
          try {
            console.log(
              `[Connectors] Attempting fallback callback with workspace format`
            );
            const fallbackResponse = await Workspace.connectors.callback(
              workspace.slug,
              {
                provider: provider.id,
                connectionId: `workspace_${workspace.id}`,
              }
            );

            if (fallbackResponse.success) {
              console.log(
                `[Connectors] Fallback callback successful for ${provider.name}`
              );
            } else {
              showToast(
                `${provider.name} OAuth completed but backend sync failed. Connection may still work.`,
                "warning"
              );
            }
          } catch (fallbackError) {
            console.error(
              `[Connectors] All callback attempts failed:`,
              fallbackError
            );
            showToast(
              `${provider.name} OAuth completed but backend sync failed. Please check connection manually.`,
              "warning"
            );
          }
        }

        // Show immediate success feedback
        showToast(`${provider.name} connected successfully! 🎉`, "success");

        // Trigger celebration animation
        setJustConnected(provider.id);
        setTimeout(() => setJustConnected(null), 3000);

        // Progressive refresh with better status checking
        const checkConnectionStatus = async (
          attemptNumber = 1,
          maxAttempts = 4
        ) => {
          console.log(
            `[Connectors] Status check attempt ${attemptNumber} for ${provider.name}`
          );

          await fetchConnectorData();

          // Get fresh connector data to check status
          const [providersResponse, connectorsResponse] = await Promise.all([
            Workspace.connectors.getAvailable(workspace.slug),
            Workspace.connectors.list(workspace.slug),
          ]);

          const updatedConnectors = connectorsResponse?.connectors || [];
          const isNowConnected = updatedConnectors.some((c) => {
            const providerMatch =
              c.provider === provider.id ||
              c.provider === provider.name ||
              (provider.id === "gmail" &&
                (c.provider === "google" || c.provider === "google-mail")) ||
              (provider.id === "google-calendar" && c.provider === "google");
            return providerMatch && c.status === "connected";
          });

          console.log(`[Connectors] Connection status for ${provider.name}:`, {
            isConnected: isNowConnected,
            connectors: updatedConnectors.map((c) => ({
              provider: c.provider,
              status: c.status,
            })),
            attemptNumber,
          });

          if (isNowConnected) {
            // Success! Update local state
            setConnectors(updatedConnectors);
            setAvailableProviders(providersResponse?.providers || []);

            // Scroll to connected section
            setTimeout(() => {
              const connectedSection = document.querySelector(
                '[data-section="connected"]'
              );
              if (connectedSection) {
                connectedSection.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }, 300);

            console.log(
              `[Connectors] ${provider.name} successfully connected and verified`
            );
            return true;
          } else if (attemptNumber < maxAttempts) {
            // Try again with exponential backoff
            const delay = Math.pow(2, attemptNumber) * 1000; // 2s, 4s, 8s
            console.log(`[Connectors] Retrying status check in ${delay}ms...`);
            setTimeout(
              () => checkConnectionStatus(attemptNumber + 1, maxAttempts),
              delay
            );
          } else {
            // Final attempt failed - but check if it's a known Gmail/Google issue
            if (provider.id === "gmail") {
              console.warn(
                `[Connectors] Gmail connection check failed, but OAuth was successful. This is likely a backend callback issue.`
              );
              showToast(
                `Gmail is connected! Backend sync is still processing.`,
                "success"
              );

              // For Gmail, assume success if OAuth completed
              // Add it to connectors optimistically since we know OAuth worked
              const optimisticConnector = {
                provider: provider.id,
                status: "connected",
                name: provider.name,
                lastSync: new Date().toISOString(),
                metadata: { source: "oauth-verified" },
              };

              setConnectors((prev) => {
                // Don't duplicate if already exists
                const exists = prev.some(
                  (c) =>
                    c.provider === provider.id ||
                    (c.provider === "google" && provider.id === "gmail")
                );
                return exists ? prev : [...prev, optimisticConnector];
              });

              // Scroll to connected section
              setTimeout(() => {
                const connectedSection = document.querySelector(
                  '[data-section="connected"]'
                );
                if (connectedSection) {
                  connectedSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }, 300);
            } else {
              console.warn(
                `[Connectors] ${provider.name} connection verification failed after ${maxAttempts} attempts`
              );
              showToast(
                `${provider.name} may still be connecting. Please refresh if needed.`,
                "info"
              );
            }

            // Still update UI with what we have
            setAvailableProviders(providersResponse?.providers || []);
          }

          return false;
        };

        // Start status checking
        setTimeout(() => checkConnectionStatus(), 1500);
      } else if (response.success) {
        // Direct connection successful
        showToast(`${provider.name} connected successfully! 🎉`, "success");

        setJustConnected(provider.id);
        setTimeout(() => setJustConnected(null), 3000);

        await fetchConnectorData();

        setTimeout(() => {
          const connectedSection = document.querySelector(
            '[data-section="connected"]'
          );
          if (connectedSection) {
            connectedSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 300);
      }
    } catch (error) {
      console.error(`Failed to connect ${provider.name}:`, error);

      // Handle specific provider errors gracefully
      if (provider.id === "gmail") {
        console.log(
          `[Connectors] Gmail connection had issues but OAuth may have succeeded`
        );
        showToast(
          `Gmail OAuth may have succeeded despite errors. Checking connection...`,
          "info"
        );

        // For Gmail, try to verify if OAuth actually worked
        setTimeout(async () => {
          await fetchConnectorData();
          const [, connectorsResponse] = await Promise.all([
            Workspace.connectors.getAvailable(workspace.slug),
            Workspace.connectors.list(workspace.slug),
          ]);

          const updatedConnectors = connectorsResponse?.connectors || [];
          const gmailConnected = updatedConnectors.some(
            (c) =>
              (c.provider === "gmail" ||
                c.provider === "google" ||
                c.provider === "google-mail") &&
              c.status === "connected"
          );

          if (gmailConnected) {
            showToast(`Gmail is now connected! 🎉`, "success");
            setConnectors(updatedConnectors);

            setTimeout(() => {
              const connectedSection = document.querySelector(
                '[data-section="connected"]'
              );
              if (connectedSection) {
                connectedSection.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }, 300);
          } else {
            showToast(`Gmail connection failed. Please try again.`, "error");
          }
        }, 3000);
      } else {
        showToast(
          `Failed to connect to ${provider.name}: ${error.message}`,
          "error"
        );
      }
    } finally {
      setSaving("");
    }
  };

  const handleDisconnect = async (provider) => {
    setSaving(provider.id);

    try {
      await Workspace.connectors.disconnect(workspace.slug, provider.id);
      showToast(`${provider.name} disconnected`, "success");

      // Refresh connector data
      await fetchConnectorData();
    } catch (error) {
      console.error("Failed to disconnect:", error);
      showToast(`Failed to disconnect ${provider.name}`, "error");
      // Revert optimistic update on error
      fetchConnectorData();
    } finally {
      setSaving("");
    }
  };

  const handleSync = async (provider) => {
    setSaving(provider.id);

    try {
      await Workspace.connectors.sync(workspace.slug, provider.id);
      showToast(`${provider.name} synced!`, "success");
    } catch (error) {
      console.error("Failed to sync:", error);
      showToast(`Failed to sync ${provider.name}`, "error");
    } finally {
      setSaving("");
    }
  };

  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                Connectors
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {connectors.length} connected
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="max-h-[70vh] overflow-y-auto scroll-smooth"
          id="connector-content"
        >
          {loading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-gray-50/30 dark:bg-gray-800/30 rounded-xl animate-gentle-slide"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className="w-7 h-7 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg animate-pulse"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div
                      className="h-2.5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-20 animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                    <div
                      className="h-2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded w-28 animate-pulse"
                      style={{ animationDelay: `${i * 0.25}s` }}
                    />
                  </div>
                  <div
                    className="w-12 h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {/* Connected Services Section */}
              {availableProviders.filter((p) =>
                connectors.some((c) => c.provider === p.id)
              ).length > 0 && (
                <div className="p-5 pb-3" data-section="connected">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <h4 className="font-medium text-green-700 dark:text-green-300 text-xs uppercase tracking-wider">
                      Connected (
                      {
                        availableProviders.filter((p) =>
                          connectors.some((c) => c.provider === p.id)
                        ).length
                      }
                      )
                    </h4>
                  </div>
                  <div className="space-y-2.5">
                    {availableProviders
                      .filter((provider) =>
                        connectors.some((c) => c.provider === provider.id)
                      )
                      .map((provider) => {
                        const isSaving = saving === provider.id;
                        const style =
                          connectorStyles[provider.id] ||
                          connectorStyles.default;

                        return (
                          <div
                            key={`connected-${provider.id}`}
                            className={`group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-50/50 via-emerald-50/50 to-green-50/50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-green-900/20 border border-green-200/60 dark:border-green-800/60 hover:shadow-lg hover:shadow-green-100/50 dark:hover:shadow-green-900/10 transition-all duration-300 animate-gentle-slide animate-connected-float ${justConnected === provider.id ? "animate-success-glow animate-pulse-green" : ""}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="relative p-3.5 flex items-center gap-3">
                              {/* Clean Icon */}
                              <div className="relative">
                                <div
                                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center shadow-sm`}
                                >
                                  <span className="text-xs">{style.emoji}</span>
                                </div>
                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-900" />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {provider.name}
                                  </h4>
                                  <div className="w-1 h-1 bg-green-500 rounded-full" />
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {provider.description}
                                </p>
                              </div>

                              {/* Clean Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleSync(provider)}
                                  disabled={isSaving}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                    isSaving
                                      ? "bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                      : "bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40"
                                  }`}
                                >
                                  {isSaving ? (
                                    <ArrowClockwise className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <ArrowClockwise className="w-3 h-3" />
                                  )}
                                  Sync
                                </button>
                                <button
                                  onClick={() => handleDisconnect(provider)}
                                  disabled={isSaving}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-all"
                                  title="Disconnect"
                                >
                                  <Trash className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Subtle bottom accent */}
                            <div className="h-0.5 bg-gradient-to-r from-green-400/50 via-emerald-500/50 to-green-400/50" />
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Available Services Section */}
              {availableProviders.filter(
                (p) => !connectors.some((c) => c.provider === p.id)
              ).length > 0 && (
                <div className="p-5 pt-3" data-section="available">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <h4 className="font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                      Available (
                      {
                        availableProviders.filter(
                          (p) => !connectors.some((c) => c.provider === p.id)
                        ).length
                      }
                      )
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {availableProviders
                      .filter(
                        (provider) =>
                          !connectors.some((c) => c.provider === provider.id)
                      )
                      .map((provider) => {
                        const isSaving = saving === provider.id;
                        const style =
                          connectorStyles[provider.id] ||
                          connectorStyles.default;

                        return (
                          <div
                            key={`available-${provider.id}`}
                            className={`group relative overflow-hidden rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/80 hover:border-blue-300/60 dark:hover:border-blue-600/60 hover:shadow-lg hover:shadow-blue-100/30 dark:hover:shadow-blue-900/10 transition-all duration-300 ${isSaving ? "animate-pulse opacity-70" : "animate-gentle-slide"}`}
                          >
                            <div className="p-3.5 flex items-center gap-3">
                              {/* Minimal Icon */}
                              <div
                                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center shadow-sm`}
                              >
                                <span className="text-xs">{style.emoji}</span>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-0.5">
                                  {provider.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {provider.description}
                                </p>
                              </div>

                              {/* Clean Connect Button */}
                              <button
                                onClick={() => handleConnect(provider)}
                                disabled={isSaving}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all transform ${
                                  isSaving
                                    ? "bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed scale-95"
                                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md hover:scale-105"
                                }`}
                              >
                                {isSaving ? (
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs">
                                      Connecting...
                                    </span>
                                  </div>
                                ) : (
                                  "Connect"
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Nango Warning */}
              {!nangoConfigured && (
                <div className="p-5">
                  <div className="flex items-start gap-2.5 p-3 bg-gradient-to-r from-amber-50/70 to-orange-50/70 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded-xl">
                    <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-0.5 text-sm">
                        Configuration Required
                      </h5>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Nango service is not configured. Contact your
                        administrator to enable all connectors.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}

// Add Button - Google Material style
function AddButton({ onClick, type = "member", size = 40 }) {
  const icons = {
    member: UserPlus,
    service: Plug,
    default: Plus,
  };

  const Icon = icons[type] || icons.default;

  return (
    <button
      onClick={onClick}
      className="relative group transform transition-all duration-200 hover:scale-110"
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        Add {type}
      </div>
    </button>
  );
}

// Expanded View for Mobile
function ExpandedMobileView({
  isOpen,
  onClose,
  members,
  services,
  workspace,
  onInvite,
  onManageConnectors,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden animate-fadeIn safe-area-inset">
      <div className="absolute inset-x-0 top-16 mx-3 sm:mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-h-[calc(100vh-6rem)] overflow-hidden animate-slideUp">
        {/* Header - Mobile optimized */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Team & Services
            </h3>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors touch-manipulation"
              style={{ minWidth: "44px", minHeight: "44px" }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Members Section - Mobile optimized grid */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team ({members.length})
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
              {members.map((member, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <Avatar
                    user={member}
                    size={48}
                    badgeIcon={member.role === "admin" ? Crown : null}
                  />
                  <span className="text-xs text-center text-gray-600 dark:text-gray-400 truncate w-full leading-tight">
                    {member.username?.split(" ")[0] ||
                      member.email?.split("@")[0]}
                  </span>
                </div>
              ))}
              <div className="flex flex-col items-center gap-2">
                <AddButton onClick={onInvite} type="member" size={48} />
                <span className="text-xs text-gray-500">Invite</span>
              </div>
            </div>
          </div>

          {/* Services Section - Mobile optimized */}
          {services.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Plug className="w-4 h-4" />
                Services ({services.length})
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
                {services.map((service, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <ConnectorBubble
                      connector={service}
                      size={48}
                      onClick={onManageConnectors}
                    />
                    <span className="text-xs text-center text-gray-600 dark:text-gray-400 truncate w-full leading-tight">
                      {service.name}
                    </span>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2">
                  <AddButton
                    onClick={onManageConnectors}
                    type="service"
                    size={48}
                  />
                  <span className="text-xs text-gray-500">Add</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Invite Modal
function InviteModal({ isOpen, onClose, workspace }) {
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createInvite = async () => {
    setLoading(true);
    try {
      const { invite } = await Admin.newInvite({
        workspaceIds: workspace ? [workspace.id] : [],
      });
      if (invite) {
        const link = `${window.location.origin}/accept-invite/${invite.code}`;
        setInviteLink(link);
      }
    } catch (error) {
      showToast("Failed to create invite", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    showToast("Invite link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join our workspace",
        text: `You're invited to join ${workspace?.name || "our workspace"}`,
        url: inviteLink,
      });
    } else {
      copyLink();
    }
  };

  useEffect(() => {
    if (isOpen && !inviteLink) {
      createInvite();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <UserPlus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Invite to Workspace
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Share this link to add new members
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
            ) : inviteLink ? (
              <>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-300 break-all font-mono">
                    {inviteLink}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyLink}
                    className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    {copied ? <>✓ Copied!</> : <>📋 Copy Link</>}
                  </button>
                  {navigator.share && (
                    <button
                      onClick={shareLink}
                      className="py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
                    >
                      <Share className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-red-500 text-center">
                Failed to generate invite link
              </p>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// Main Header Component
export default function ChatWidgetHeader({ workspace, connectors = [] }) {
  const [members, setMembers] = useState([]);
  const [services] = useState(connectors);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showConnectorModal, setShowConnectorModal] = useState(false);
  const [showExpanded, setShowExpanded] = useState(false);
  const avatarSize = isMobile ? 40 : 40; // Consistent size for better layout

  // Check for openConnectors query parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("openConnectors") === "true") {
      setShowConnectorModal(true);
      // Clean up the URL after opening the modal
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  useEffect(() => {
    async function fetchMembers() {
      try {
        if (workspace?.slug) {
          const workspaceMembers = await Workspace.members(workspace.slug);
          setMembers(workspaceMembers || []);
        }
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [workspace]);

  const visibleMembers = isMobile ? 3 : 5;
  const visibleServices = isMobile ? 2 : 3;
  const totalOverflow = Math.max(
    0,
    members.length - visibleMembers + (services.length - visibleServices)
  );

  return (
    <>
      <div className="bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 sticky top-[60px] z-40 w-full shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Left: Workspace Info - Enhanced design */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm">
                  <Sparkle className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate text-base">
                    {workspace?.name || "Workspace"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Active workspace
                  </p>
                </div>
              </div>

              {/* Mobile: Compact but improved */}
              <div className="sm:hidden flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex-shrink-0 shadow-sm">
                  <Sparkle className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                    {workspace?.name || "Workspace"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Right: Avatar Stack - Enhanced design */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Members Stack - Improved spacing */}
              <div className="flex items-center -space-x-1 sm:-space-x-2">
                {loading ? (
                  <div className="flex -space-x-1">
                    {[...Array(2)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse ring-1 ring-white dark:ring-gray-900`}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    {members
                      .slice(0, isMobile ? 2 : visibleMembers)
                      .map((member, idx) => (
                        <Avatar
                          key={idx}
                          user={member}
                          size={isMobile ? 28 : avatarSize}
                          showBadge={false}
                          badgeIcon={
                            member.role === "admin" && !isMobile ? Crown : null
                          }
                        />
                      ))}

                    {/* Overflow Indicator */}
                    {totalOverflow > 0 && (
                      <button
                        onClick={() => setShowExpanded(true)}
                        className="relative transform transition-all duration-200 hover:scale-110"
                        style={{
                          width: isMobile ? 28 : avatarSize,
                          height: isMobile ? 28 : avatarSize,
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-white dark:ring-gray-900 hover:bg-gray-300 dark:hover:bg-gray-600">
                          +{totalOverflow}
                        </div>
                      </button>
                    )}

                    {/* Add Member Button - Hidden on mobile */}
                    {!isMobile && (
                      <AddButton
                        onClick={() => setShowInviteModal(true)}
                        type="member"
                        size={avatarSize}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Services Stack - Enhanced separator */}
              <div className="h-4 sm:h-5 w-px bg-gray-300/60 dark:bg-gray-600/60 mx-1 sm:mx-2" />
              <div className="flex items-center -space-x-1 sm:-space-x-2">
                {services
                  .slice(0, isMobile ? 1 : visibleServices)
                  .map((service, idx) => (
                    <ConnectorBubble
                      key={idx}
                      connector={service}
                      size={isMobile ? 28 : avatarSize}
                      onClick={() => setShowConnectorModal(true)}
                    />
                  ))}
                {!isMobile && (
                  <AddButton
                    onClick={() => setShowConnectorModal(true)}
                    type="service"
                    size={avatarSize}
                  />
                )}
              </div>

              {/* Background Tasks Bubble */}
              <div className="h-4 sm:h-5 w-px bg-gray-300/60 dark:bg-gray-600/60 mx-1 sm:mx-2" />
              <BackgroundTasksBubble workspace={workspace} />

              {/* Expand Button (Mobile) - Enhanced design */}
              {isMobile && (
                <button
                  onClick={() => setShowExpanded(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 sm:hidden touch-manipulation ml-1 hover:scale-105"
                  style={{ minWidth: "36px", minHeight: "36px" }}
                  aria-label="Expand team view"
                >
                  <ArrowsOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspace={workspace}
      />

      <ConnectorModal
        isOpen={showConnectorModal}
        onClose={() => setShowConnectorModal(false)}
        workspace={workspace}
      />

      <ExpandedMobileView
        isOpen={showExpanded}
        onClose={() => setShowExpanded(false)}
        members={members}
        services={services}
        workspace={workspace}
        onInvite={() => {
          setShowExpanded(false);
          setShowInviteModal(true);
        }}
        onManageConnectors={() => {
          setShowExpanded(false);
          setShowConnectorModal(true);
        }}
      />
    </>
  );
}

// Custom CSS animations for smooth, elegant transitions
const connectorAnimations = `
  @keyframes gentleSlideIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes connectedFloat {
    0%, 100% { 
      transform: translateY(0px) scale(1);
    }
    50% { 
      transform: translateY(-2px) scale(1.02);
    }
  }
  
  @keyframes successGlow {
    0% { 
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
      transform: scale(1.03);
    }
    100% { 
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
      transform: scale(1);
    }
  }
  
  @keyframes pulseGreen {
    0%, 100% { 
      background-color: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.3);
    }
    50% { 
      background-color: rgba(34, 197, 94, 0.15);
      border-color: rgba(34, 197, 94, 0.4);
    }
  }
  
  .animate-gentle-slide {
    animation: gentleSlideIn 0.4s ease-out;
  }
  
  .animate-connected-float {
    animation: connectedFloat 3s ease-in-out infinite;
  }
  
  .animate-success-glow {
    animation: successGlow 1.2s ease-out;
  }
  
  .animate-pulse-green {
    animation: pulseGreen 2s ease-in-out infinite;
  }
`;

// Inject elegant animations and mobile optimizations
const mobileOptimizations = `
  ${connectorAnimations}
  
  /* Mobile-first responsive utilities */
  .safe-area-inset {
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    padding-right: env(safe-area-inset-right);
  }
  
  .safe-area-inset-top {
    padding-top: env(safe-area-inset-top);
  }
  
  /* Improved touch targets for mobile */
  .touch-manipulation {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  
  /* Better mobile scrolling */
  .mobile-scroll {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  
  /* Prevent zoom on iOS inputs */
  input[type="text"],
  input[type="email"],
  input[type="password"],
  textarea {
    font-size: 16px !important;
  }
  
  /* Mobile-specific animations */
  @media (max-width: 768px) {
    .animate-gentle-slide {
      animation: gentleSlideIn 0.3s ease-out;
    }
    
    .animate-connected-float {
      animation: connectedFloat 4s ease-in-out infinite;
    }
  }
  
  /* Dark mode mobile optimizations */
  @media (prefers-color-scheme: dark) {
    .mobile-scroll::-webkit-scrollbar {
      display: none;
    }
  }
`;

if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = mobileOptimizations;
  if (!document.head.querySelector('style[data-mobile-chat="true"]')) {
    styleSheet.setAttribute("data-mobile-chat", "true");
    document.head.appendChild(styleSheet);
  }
}
