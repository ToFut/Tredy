import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import showToast from "@/utils/toast";
import {
  Plug,
  Plus,
  Trash,
  ArrowsClockwise,
  CheckCircle,
  XCircle,
  Info,
  Link as LinkIcon,
} from "@phosphor-icons/react";
import ContextualSaveBar from "@/components/ContextualSaveBar";
import { FullScreenLoader } from "@/components/Preloader";
import UserConnector from "@/models/userConnector";
import ConnectorCard from "./ConnectorCard";
import AddConnectorModal from "./AddConnectorModal";
import { Tooltip } from "react-tooltip";

export default function UserConnectors() {
  const [loading, setLoading] = useState(true);
  const [connectors, setConnectors] = useState([]);
  const [availableConnectors, setAvailableConnectors] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [syncing, setSyncing] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const [userConnectors, available] = await Promise.all([
          UserConnector.list(),
          UserConnector.getAvailable(),
        ]);

        setConnectors(userConnectors);
        setAvailableConnectors(available);
      } catch (error) {
        showToast("Failed to load connectors", "error");
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAddConnector = async (provider) => {
    try {
      // Initialize OAuth flow
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
            refreshConnectors();
          }
        }, 1000);
      }
    } catch (error) {
      showToast("Failed to add connector", "error");
      console.error(error);
    }
  };

  const handleDeleteConnector = async (provider) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) {
      return;
    }

    try {
      await UserConnector.delete(provider);
      showToast("Connector disconnected successfully", "success");
      refreshConnectors();
    } catch (error) {
      showToast("Failed to delete connector", "error");
      console.error(error);
    }
  };

  const handleSyncConnector = async (provider) => {
    setSyncing({ ...syncing, [provider]: true });
    try {
      await UserConnector.sync(provider);
      showToast("Sync initiated successfully", "success");
    } catch (error) {
      showToast("Failed to sync connector", "error");
      console.error(error);
    } finally {
      setSyncing({ ...syncing, [provider]: false });
    }
  };

  const refreshConnectors = async () => {
    const userConnectors = await UserConnector.list();
    setConnectors(userConnectors);
  };

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-b-2 border-theme-sidebar-border">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl text-theme-text-primary font-semibold">
                My Connectors
              </h1>
              <Plug className="w-6 h-6 text-theme-text-secondary" />
            </div>
            <p className="text-sm text-theme-text-secondary">
              Connect your accounts and services to access data across all your
              workspaces. These integrations are available to you in every
              workspace you create or join.
            </p>
          </div>

          {/* Connected Integrations */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-theme-text-primary">
                Connected Integrations
              </h2>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-theme-bg-primary hover:bg-opacity-90 text-white rounded-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Add Connector
              </button>
            </div>

            {connectors.length === 0 ? (
              <div className="bg-theme-bg-primary/10 rounded-xl p-8 text-center">
                <Plug className="w-12 h-12 text-theme-text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-theme-text-primary mb-2">
                  No connectors configured
                </h3>
                <p className="text-sm text-theme-text-secondary mb-6">
                  Connect your first data source to start accessing external
                  data in your chats.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-theme-bg-primary text-white rounded-lg hover:bg-opacity-90 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Add Your First Connector
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connectors.map((connector) => (
                  <ConnectorCard
                    key={connector.provider}
                    connector={connector}
                    onDelete={() => handleDeleteConnector(connector.provider)}
                    onSync={() => handleSyncConnector(connector.provider)}
                    isSyncing={syncing[connector.provider]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-theme-text-primary mb-2">
                  About User Connectors
                </h3>
                <ul className="text-sm text-theme-text-secondary space-y-1">
                  <li>
                    • Connectors are tied to your user account, not individual
                    workspaces
                  </li>
                  <li>
                    • All your workspaces automatically have access to these
                    data sources
                  </li>
                  <li>• OAuth tokens are securely encrypted and stored</li>
                  <li>
                    • Data is synced automatically based on the connector type
                  </li>
                  <li>
                    • You can manage permissions and scopes for each connector
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Connector Modal */}
      {showAddModal && (
        <AddConnectorModal
          availableConnectors={availableConnectors}
          onAdd={handleAddConnector}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
