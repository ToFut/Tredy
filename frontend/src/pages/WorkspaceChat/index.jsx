import React, { useEffect, useState } from "react";
import { default as WorkspaceChatContainer } from "@/components/WorkspaceChat";
import Sidebar, { SidebarMobileHeader } from "@/components/Sidebar";
import NotesPanel from "@/components/NotesPanel";
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
  const [showNotesPanel, setShowNotesPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

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
      <div className="w-screen h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 flex">
        {isMobile ? (
          <>
            <SidebarMobileHeader />
            <div className="w-full h-full">
              <WorkspaceChatContainer 
                loading={loading} 
                workspace={workspace || workspaceData} 
              />
            </div>
          </>
        ) : (
          <>
            {/* Left Sidebar - Files/Workspaces */}
            <div className={`transition-all duration-300 ${showSidebar ? 'w-80' : 'w-0'} flex-shrink-0`}>
              <Sidebar />
            </div>
            
            {/* Main Chat Area */}
            <div className="flex-1 min-w-0 flex flex-col bg-white/80 backdrop-blur-sm border-x border-gray-200/50">
              {/* Header with toggle controls */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 bg-white/90 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowSidebar(!showSidebar)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <h1 className="text-lg font-semibold text-gray-800">
                    {(workspace || workspaceData)?.name || 'Research Workspace'}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Jump Straight Into the Conversation</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">New</span>
                  <button 
                    onClick={() => setShowNotesPanel(!showNotesPanel)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Chat Container */}
              <div className="flex-1 overflow-hidden">
                <WorkspaceChatContainer 
                  loading={loading} 
                  workspace={workspace || workspaceData} 
                />
              </div>
            </div>
            
            {/* Right Sidebar - Notes Panel */}
            <div className={`transition-all duration-300 ${showNotesPanel ? 'w-80' : 'w-0'} flex-shrink-0`}>
              <NotesPanel 
                workspace={workspace || workspaceData}
                isVisible={showNotesPanel}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
