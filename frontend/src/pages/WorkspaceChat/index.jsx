import React, { useEffect, useState } from "react";
import { default as WorkspaceChatContainer } from "@/components/WorkspaceChat";
import Sidebar from "@/components/Sidebar";
import { useParams } from "react-router-dom";
import Workspace from "@/models/workspace";
import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { isMobile } from "react-device-detect";
import { FullScreenLoader } from "@/components/Preloader";

export default function WorkspaceChat() {
  const { loading, requiresAuth, mode } = usePasswordModal();

  if (loading) return <FullScreenLoader />;
  if (requiresAuth !== false) {
    return <>{requiresAuth !== null && <PasswordModal mode={mode} />}</>;
  }

  return <ShowWorkspaceChat />;
}

function ShowWorkspaceChat() {
  const { slug } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workspaceData, setWorkspaceData] = useState(null);

  useEffect(() => {
    async function getWorkspace() {
      if (!slug) return;
      
      const _workspace = await Workspace.bySlug(slug);
      if (!_workspace) {
        setLoading(false);
        return;
      }

      // Show workspace immediately with basic data
      setWorkspaceData(_workspace);

      // Load additional data in parallel without blocking initial render
      const [suggestedMessages, pfpUrl] = await Promise.all([
        Workspace.getSuggestedMessages(slug).catch(() => null),
        Workspace.fetchPfp(slug).catch(() => null)
      ]);

      setWorkspace({
        ..._workspace,
        suggestedMessages,
        pfpUrl,
      });
      setLoading(false);
    }
    getWorkspace();
  }, []);

  return (
    <>
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
        {!isMobile && <Sidebar />}
        <WorkspaceChatContainer 
          loading={loading} 
          workspace={workspace || workspaceData} 
        />
      </div>
    </>
  );
}
