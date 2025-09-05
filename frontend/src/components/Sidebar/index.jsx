import React, { useEffect, useRef, useState, Suspense, lazy } from "react";
import { List, Plus, House, Gear, MagnifyingGlass, Brain } from "@phosphor-icons/react";
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
        className="fixed top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700"
        style={{ height: '48px' }}
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <List className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
        
        <div className="flex items-center gap-1.5">
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
              <div className="flex-1 overflow-y-auto px-4 py-4">
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