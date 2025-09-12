import React, { useEffect, useRef, useState, Suspense, lazy } from "react";
import { List, Plus, House, Gear, MagnifyingGlass, Brain, Funnel } from "@phosphor-icons/react";
import { useNewWorkspaceModal } from "../Modals/NewWorkspace";
import ActiveWorkspaces from "./ActiveWorkspaces";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import Footer from "../Footer";
import SettingsButton from "../SettingsButton";
import { Link, useParams } from "react-router-dom";
import paths from "@/utils/paths";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import { useTranslation } from "react-i18next";
import { useSidebarToggle, ToggleSidebarButton } from "./SidebarToggle";
import SearchBox from "./SearchBox";

// Lazy load the modal since it's only needed when creating a workspace
const NewWorkspaceModal = lazy(() => import("../Modals/NewWorkspace").then(module => ({ default: module.default })));

export default function Sidebar() {
  const { user } = useUser();
  const { logo } = useLogo();
  const { slug } = useParams();
  const sidebarRef = useRef(null);
  const { showSidebar, setShowSidebar, canToggleSidebar } = useSidebarToggle();
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { t } = useTranslation();

  const handleCreateTredy = async () => {
    console.log("Creating Tredy - slug:", slug);
    
    if (!slug) {
      showToast("No workspace selected", "error");
      return;
    }
    
    try {
      showToast("Creating new Tredy...", "info");
      const { thread, error } = await Workspace.threads.new(slug);
      console.log("Thread creation result:", { thread, error });
      
      if (error) {
        showToast(`Could not create Tredy - ${error}`, "error");
        return;
      }
      
      if (thread && thread.slug) {
        showToast("Tredy created successfully!", "success");
        window.location.replace(paths.workspace.thread(slug, thread.slug));
      } else if (thread) {
        // Thread exists but no slug, navigate to workspace instead
        showToast("Tredy created, opening workspace...", "success");
        window.location.replace(`/workspace/${slug}`);
      } else {
        showToast("Failed to create Tredy - no thread returned", "error");
      }
    } catch (error) {
      console.error("Error creating Tredy:", error);
      showToast(`Failed to create Tredy - ${error.message}`, "error");
    }
  };

  return (
    <>
      {/* Top Header Bar - Improved Design */}
      <div className="fixed top-0 left-0 right-0 h-[60px] bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-sm z-50">
        <div className="flex items-center justify-between h-full px-6">
          {/* Left: Tredy Logo with Menu */}
          <div className="flex items-center gap-4">
            <Link to={paths.home()} aria-label="Home" className="flex items-center gap-2">
              <img
                src="/tredy_logo_name_slogan_purple.PNG"
                alt="Tredy"
                className="h-[36px] object-contain"
              />
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            {canToggleSidebar && (
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all group"
                title={showSidebar ? "Hide Sidebar" : "Show Sidebar"}
              >
                <List className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
              </button>
            )}
          </div>
          
          {/* Center: Enhanced Search */}
          <div className="flex-1 max-w-3xl mx-8">
            <div className="relative group">
              <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search conversations, documents, or ask a question..."
                className="w-full pl-12 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent focus:bg-white transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-all"
                  title="Advanced Search"
                >
                  <Funnel size={16} className="text-gray-500" />
                </button>
                <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded border border-gray-200">
                  <span className="text-[10px]">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>
          
          {/* Right: User Actions */}
          <div className="flex items-center gap-3">
            <button 
              className="p-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-all relative group animate-slideInRight animate-stagger-1"
              title="AI Assistant"
            >
              <Brain className="w-5 h-5 text-gray-600 group-hover:text-purple-600 group-hover:scale-110 transition-all" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse group-hover:animate-bounce" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-all group animate-slideInRight animate-stagger-2">
              <Gear className="w-5 h-5 text-gray-600 group-hover:rotate-90 group-hover:scale-110 transition-all duration-300" />
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-2 animate-slideInRight animate-stagger-3">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-medium text-gray-700">{user?.username || 'User'}</p>
                <p className="text-[10px] text-gray-500">
                  {user?.role === 'admin' ? 'Admin' : user?.role === 'manager' ? 'Manager' : 'Member'} Plan
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm interactive-scale hover:animate-glowPulse transition-all cursor-pointer">
                {(user?.username || 'U').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sidebar - Adjusted for fixed header */}
      <div
        style={{
          width: showSidebar ? "292px" : "72px",
          paddingLeft: showSidebar ? "0px" : "8px",
          marginTop: "60px", // Account for fixed header
        }}
        className="transition-all duration-500 relative"
      >
        <div
          ref={sidebarRef}
          className={`relative ${showSidebar ? "m-4" : "m-2"} rounded-3xl bg-gradient-to-b from-white/98 to-white/95 backdrop-blur-2xl border border-gray-200/40 shadow-xl ${showSidebar ? "min-w-[300px] p-5" : "w-[60px] p-3"} h-[calc(100vh-92px)] transition-all duration-500 hover:shadow-2xl hover:border-purple-200/50`}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(32px)',
            borderImage: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05)) 1',
          }}
        >
          <div className="flex flex-col h-full overflow-x-hidden">
            {/* Enhanced Workspace Actions */}
            {showSidebar ? (
              <div className="space-y-3 mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-purple-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={handleCreateTredy}
                    className="relative w-full px-5 py-3 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl font-semibold group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Plus size={20} weight="bold" className="group-hover:rotate-180 transition-transform duration-300 relative z-10" />
                    <span className="relative z-10 text-base">New Tredy</span>
                    <div className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                    </div>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="px-3 py-2.5 bg-gradient-to-br from-gray-50/80 to-gray-100/60 hover:from-purple-50 hover:to-purple-100/80 border border-gray-200/60 hover:border-purple-200 rounded-xl transition-all flex items-center justify-center gap-2 text-sm text-gray-700 hover:text-purple-700 font-medium group backdrop-blur-sm"
                    title="Browse Templates"
                  >
                    <House size={16} className="group-hover:scale-110 group-hover:text-purple-600 transition-all" />
                    <span>Templates</span>
                  </button>
                  <button
                    className="px-3 py-2.5 bg-gradient-to-br from-gray-50/80 to-gray-100/60 hover:from-blue-50 hover:to-blue-100/80 border border-gray-200/60 hover:border-blue-200 rounded-xl transition-all flex items-center justify-center gap-2 text-sm text-gray-700 hover:text-blue-700 font-medium group backdrop-blur-sm"
                    title="Recent Chats"
                  >
                    <List size={16} className="group-hover:scale-110 group-hover:text-blue-600 transition-all" />
                    <span>Recent</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-4 items-center">
                <button
                  onClick={handleCreateTredy}
                  className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all shadow-sm"
                  title="New Tredy"
                >
                  <Plus size={16} weight="bold" />
                </button>
                <button
                  className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
                  title="Browse Templates"
                >
                  <House size={16} className="text-gray-600" />
                </button>
              </div>
            )}

            <div className={`flex-grow flex flex-col ${showSidebar ? "min-w-[260px]" : "min-w-[40px]"} overflow-hidden`}>
              <div className="relative h-full flex flex-col w-full">
                <div className="flex flex-col gap-y-3 pb-[60px] overflow-y-auto custom-scrollbar">
                  <ActiveWorkspaces />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 pt-4 pb-3 rounded-b-2xl bg-gradient-to-t from-white/95 to-transparent backdrop-blur-xl z-10">
                <Footer />
              </div>
            </div>
          </div>
        </div>
        {showingNewWsModal && (
          <Suspense fallback={<div>Loading...</div>}>
            <NewWorkspaceModal hideModal={hideNewWsModal} />
          </Suspense>
        )}
      </div>
    </>
  );
}

export function SidebarMobileHeader() {
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { user } = useUser();
  const { t } = useTranslation();

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
      {/* Compact Mobile Header */}
      <div
        aria-label="Show sidebar"
        className="fixed top-0 left-0 right-0 z-10 flex items-center px-2 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
        style={{ height: '48px' }}
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-1"
        >
          <List className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        
        <div className="flex items-center gap-1">
          <img src={logo} alt="Logo" className="h-7 w-7 rounded" />
          <span className="font-medium text-gray-900 dark:text-white text-sm">Tredy</span>
        </div>
      </div>

      {/* Mobile Sidebar */}
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
            {/* Clean Mobile Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg" />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">Tredy</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">AI Workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
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

            {/* Navigation Body */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Actions */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <NewWorkspaceButton
                  user={user}
                  showNewWsModal={showNewWsModal}
                />
              </div>
              
              {/* Workspaces List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
                <ActiveWorkspaces />
              </div>
              
              {/* Bottom Navigation */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Link 
                    to={paths.home()} 
                    onClick={() => setShowSidebar(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <House className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Home</span>
                  </Link>
                  <button 
                    onClick={() => {
                      // Scroll to search box in sidebar
                      const searchInput = sidebarRef.current?.querySelector('input[type="text"]');
                      if (searchInput) {
                        searchInput.focus();
                      }
                    }}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MagnifyingGlass className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Search</span>
                  </button>
                  <Link 
                    to={user?.role === 'admin' || user?.role === 'manager' ? paths.settings.users() : paths.settings.interface()} 
                    onClick={() => setShowSidebar(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Gear className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Settings</span>
                  </Link>
                </div>
                <Footer />
              </div>
            </div>
          </div>
        </div>
        {showingNewWsModal && (
          <Suspense fallback={<div>Loading...</div>}>
            <NewWorkspaceModal hideModal={hideNewWsModal} />
          </Suspense>
        )}
      </div>
    </>
  );
}

function NewWorkspaceButton({ user, showNewWsModal }) {
  const { t } = useTranslation();
  if (!!user && user?.role === "default") return null;

  return (
    <button
      onClick={showNewWsModal}
      className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Plus className="h-4 w-4" />
      <span className="font-medium">{t("new-workspace.title")}</span>
    </button>
  );
}