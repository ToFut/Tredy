import React, { useEffect, useState } from "react";
import { default as WorkspaceChatContainer } from "@/components/WorkspaceChat";
import Sidebar, { SidebarMobileHeader } from "@/components/Sidebar";
import FlowPanel from "@/components/FlowPanel";
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
  const [showFlowPanel, setShowFlowPanel] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sendCommand, setSendCommand] = useState(null);
  
  // Wrap setSendCommand to avoid setState during render warning
  const handleSendCommandReady = React.useCallback((command) => {
    setSendCommand(() => command);
  }, []);


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
      <div className="w-screen h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-gray-50 flex pt-[60px] relative">
        {/* Enhanced Ambient lighting effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-gentleFloat" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-gentleFloat" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-pink-500/3 rounded-full blur-3xl animate-gentleFloat" style={{ animationDelay: '4s' }} />
        </div>
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
            {/* Left Sidebar - Enhanced */}
            <div className={`transition-all duration-500 ${showSidebar ? 'w-80' : 'w-0'} flex-shrink-0 relative z-10`}>
              <Sidebar />
            </div>
            
            {/* Main Content Area - Enhanced */}
            <div className="flex-1 min-w-0 flex flex-col bg-gradient-to-br from-gray-50/30 via-white/80 to-gray-100/30 backdrop-blur-sm relative z-10">
              
              {/* Enhanced Chat Container */}
              <div className="flex-1 overflow-hidden relative animate-fadeIn">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.02]" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '30px 30px'
                }} />
                
                <WorkspaceChatContainer 
                  loading={loading} 
                  workspace={workspace || workspaceData}
                  onSendCommandReady={handleSendCommandReady}
                />
              </div>
            </div>
            
            {/* Right Panel - AI Assistant */}
            <div className={`transition-all duration-300 ${showFlowPanel ? 'w-80' : 'w-0'} flex-shrink-0 bg-white/95 backdrop-blur-xl border-l border-gray-200/50`}>
              {showFlowPanel && (
                <div className="h-full flex flex-col">
                  {/* Panel Header */}
                  <div className="p-4 border-b border-gray-200/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">AI Assistant</h3>
                      <button 
                        onClick={() => setShowFlowPanel(false)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">Intelligent workflow automation</p>
                  </div>
                  
                  {/* Panel Content */}
                  <div className="flex-1 p-4">
                    <FlowPanel 
                      workspace={workspace || workspaceData}
                      isVisible={showFlowPanel}
                      sendCommand={sendCommand}
                      onAutoOpen={() => setShowFlowPanel(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
