import { ChatCenteredDots, FileArrowDown, Plus } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import { useManageWorkspaceModal } from "@/components/Modals/ManageWorkspace";
import ManageWorkspace from "@/components/Modals/ManageWorkspace";
import { useState } from "react";
import { useNewWorkspaceModal } from "@/components/Modals/NewWorkspace";
import NewWorkspaceModal from "@/components/Modals/NewWorkspace";
import showToast from "@/utils/toast";
import { useTranslation } from "react-i18next";

export default function QuickLinks() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showModal } = useManageWorkspaceModal();
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();

  const sendChat = async () => {
    const workspaces = await Workspace.all();
    if (workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      navigate(paths.workspace.chat(firstWorkspace.slug));
    } else {
      showToast(t("main-page.noWorkspaceError"), "warning", {
        clear: true,
      });
      showNewWsModal();
    }
  };

  const embedDocument = async () => {
    const workspaces = await Workspace.all();
    if (workspaces.length > 0) {
      const firstWorkspace = workspaces[0];
      setSelectedWorkspace(firstWorkspace);
      showModal();
    } else {
      showToast(t("main-page.noWorkspaceError"), "warning", {
        clear: true,
      });
      showNewWsModal();
    }
  };

  const createWorkspace = () => {
    showNewWsModal();
  };

  return (
    <div className="animate-fadeIn">
      <h1 className="text-theme-home-text uppercase text-sm font-bold mb-6 tracking-wide">
        {t("main-page.quickLinks.title")}
      </h1>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={sendChat}
          className="group h-[60px] text-sm font-semibold glass-effect rounded-2xl text-theme-home-button-secondary-text flex items-center justify-center gap-x-3 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg border border-theme-sidebar-border hover:border-purple-500/30 animate-slideInLeft"
          style={{ animationDelay: '0.1s' }}
        >
          <ChatCenteredDots size={20} className="group-hover:animate-pulse" />
          {t("main-page.quickLinks.sendChat")}
        </button>
        <button
          onClick={embedDocument}
          className="group h-[60px] text-sm font-semibold glass-effect rounded-2xl text-theme-home-button-secondary-text flex items-center justify-center gap-x-3 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg border border-theme-sidebar-border hover:border-blue-500/30 animate-slideInLeft"
          style={{ animationDelay: '0.2s' }}
        >
          <FileArrowDown size={20} className="group-hover:animate-bounce" />
          {t("main-page.quickLinks.embedDocument")}
        </button>
        <button
          onClick={createWorkspace}
          className="group h-[60px] text-sm font-semibold glass-effect rounded-2xl text-theme-home-button-secondary-text flex items-center justify-center gap-x-3 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-lg border border-theme-sidebar-border hover:border-green-500/30 animate-slideInLeft"
          style={{ animationDelay: '0.3s' }}
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          {t("main-page.quickLinks.createWorkspace")}
        </button>
      </div>

      {selectedWorkspace && (
        <ManageWorkspace
          providedSlug={selectedWorkspace.slug}
          hideModal={() => {
            setSelectedWorkspace(null);
          }}
        />
      )}

      {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
    </div>
  );
}
