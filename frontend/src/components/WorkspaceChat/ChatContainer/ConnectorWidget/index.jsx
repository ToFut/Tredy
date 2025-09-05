import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Plug } from "@phosphor-icons/react";
import { getDataConnectors } from "@/pages/WorkspaceSettings/Connectors";
import { QuickConnectModal } from "@/components/ChatConnectorHeader";
import UserConnector from "@/models/userConnector";

export default function ConnectorWidget({ workspace }) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const DATA_CONNECTORS = getDataConnectors(t);
  const availableConnectors = Object.keys(DATA_CONNECTORS);

  const handleConnect = async (provider) => {
    try {
      await UserConnector.create({
        provider,
        workspaceId: workspace.id,
      });
      // Optionally refresh the workspace data or show a success message
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded-lg hover:bg-theme-hover"
      >
        <Plug className="h-4 w-4" />
        <span>{t("connectors.connect")}</span>
      </button>

      <QuickConnectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        availableConnectors={availableConnectors}
        onConnect={handleConnect}
      />
    </>
  );
}
