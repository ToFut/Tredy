import React, { useEffect, useRef, useState, Suspense, lazy } from "react";
import { List, Plus, House, Gear, MagnifyingGlass, Sparkle, Brain } from "@phosphor-icons/react";
import { useNewWorkspaceModal } from "../Modals/NewWorkspace";
import ActiveWorkspaces from "./ActiveWorkspaces";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import Footer from "../Footer";
import SettingsButton from "../SettingsButton";
import { Link } from "react-router-dom";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
import { useSidebarToggle, ToggleSidebarButton } from "./SidebarToggle";
import SearchBox from "./SearchBox";

// Lazy load the modal since it's only needed when creating a workspace
const NewWorkspaceModal = lazy(() => import("../Modals/NewWorkspace").then(module => ({ default: module.default })));

export default function Sidebar() {
  const { user } = useUser();
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const { showSidebar, setShowSidebar, canToggleSidebar } = useSidebarToggle();
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { t } = useTranslation();

  return (
    <>
      <div
        style={{
          width: showSidebar ? "292px" : "0px",
          paddingLeft: showSidebar ? "0px" : "16px",
        }}
        className="transition-all duration-500"
      >
        <div className="flex shrink-0 w-full justify-center my-[18px]">
          <div className="flex justify-between w-[250px] min-w-[250px]">
            <Link to={paths.home()} aria-label="Home">
              <img
                src={logo}
                alt="Logo"
                className={`rounded max-h-[48px] object-contain transition-opacity duration-500 ${showSidebar ? "opacity-100" : "opacity-0"}`}
              />
            </Link>
            {canToggleSidebar && (
              <ToggleSidebarButton
                showSidebar={showSidebar}
                setShowSidebar={setShowSidebar}
              />
            )}
          </div>
        </div>
        <div
          ref={sidebarRef}
          className="relative m-[16px] rounded-[20px] bg-theme-bg-sidebar backdrop-blur-xl border border-theme-sidebar-border shadow-xl min-w-[250px] p-[12px] h-[calc(100%-76px)] transition-all duration-300 hover:shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex flex-col h-full overflow-x-hidden">
            <div className="flex-grow flex flex-col min-w-[235px]">
              <div className="relative h-[calc(100%-60px)] flex flex-col w-full justify-between pt-[10px] overflow-y-scroll no-scroll">
                <div className="flex flex-col gap-y-2 pb-[60px] gap-y-[14px] overflow-y-scroll no-scroll">
                  <SearchBox user={user} showNewWsModal={showNewWsModal} />
                  <ActiveWorkspaces />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 pt-4 pb-3 rounded-b-[20px] bg-gradient-to-t from-theme-bg-sidebar to-transparent backdrop-blur-xl z-10">
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
    // Darkens the rest of the screen
    // when sidebar is open.
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
      <div
        aria-label="Show sidebar"
        className="fixed top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-3 backdrop-blur-xl border-b shadow-lg transition-all duration-300"
        style={{ 
          height: 'var(--app-header-height, 64px)',
          background: 'rgba(255, 255, 255, 0.01)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(139, 92, 246, 0.1)'
        }}
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="rounded-2xl p-3 flex items-center justify-center bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 active:scale-95 transition-all duration-200 shadow-md hover:shadow-lg"
          style={{ minWidth: '48px', minHeight: '48px' }}
        >
          <List className="h-6 w-6 text-purple-500" weight="bold" />
        </button>
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg animate-pulse">
            <Brain className="h-6 w-6 text-white" weight="bold" />
          </div>
          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">AnythingLLM</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
            <span className="text-xs text-green-500 font-medium">Active</span>
          </div>
          <Sparkle className="h-5 w-5 text-purple-500 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      </div>
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
          }  duration-500 fixed top-0 left-0 bg-theme-bg-secondary bg-opacity-75 w-screen h-screen`}
          onClick={() => setShowSidebar(false)}
        />
        <div
          ref={sidebarRef}
          className="relative h-[100vh] fixed top-0 left-0 bg-white dark:bg-gray-900 w-[85%] max-w-[320px] shadow-2xl"
        >
          <div className="w-full h-full flex flex-col overflow-x-hidden">
            {/* Enhanced Mobile Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" weight="bold" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white">AnythingLLM</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">AI Workspace</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {(!user || user?.role !== "default") && (
                <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl">
                  <MagnifyingGlass className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search workspaces..."
                    className="flex-1 text-sm bg-transparent outline-none text-gray-700 dark:text-gray-300"
                  />
                </div>
              )}
            </div>

            {/* Enhanced Navigation Body */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Quick Actions */}
              <div className="p-4">
                <NewWorkspaceButton
                  user={user}
                  showNewWsModal={showNewWsModal}
                />
              </div>
              
              {/* Workspaces List */}
              <div className="flex-1 overflow-y-auto px-4">
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Workspaces</p>
                  <ActiveWorkspaces />
                </div>
              </div>
              
              {/* Bottom Navigation */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                    <House className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Home</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                    <MagnifyingGlass className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Search</span>
                  </button>
                  <button className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors">
                    <Gear className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Settings</span>
                  </button>
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
      className="w-full flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
    >
      <Plus className="h-5 w-5" weight="bold" />
      <span className="font-semibold">{t("new-workspace.title")}</span>
      <Sparkle className="h-4 w-4 animate-pulse" />
    </button>
  );
}
