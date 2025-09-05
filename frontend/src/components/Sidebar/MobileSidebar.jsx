import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Home,
  MessageSquare,
  Search,
  Settings,
  Plus,
  X,
  ChevronRight,
  Users,
  FileText,
  Brain,
  Sparkles,
  Clock,
  Star,
  Folder,
  LogOut,
  HelpCircle,
  Menu
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import paths from "@/utils/paths";
import useUser from "@/hooks/useUser";
import useLogo from "@/hooks/useLogo";
import Workspace from "@/models/workspace";

export function MobileBottomNavigation({ onMenuClick }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('chat');
  
  useEffect(() => {
    // Determine active tab based on current path
    if (location.pathname.includes('/chat')) setActiveTab('chat');
    else if (location.pathname.includes('/search')) setActiveTab('search');
    else if (location.pathname.includes('/settings')) setActiveTab('settings');
    else setActiveTab('home');
  }, [location]);

  const tabs = [
    { id: 'home', icon: Home, label: 'Home', path: paths.home() },
    { id: 'chat', icon: MessageSquare, label: 'Chat', path: '#', action: onMenuClick },
    { id: 'search', icon: Search, label: 'Search', path: paths.search() },
    { id: 'settings', icon: Settings, label: 'Settings', path: paths.settings() },
  ];

  const handleTabClick = (tab, e) => {
    navigator.vibrate?.([10]);
    setActiveTab(tab.id);
    
    if (tab.action) {
      e.preventDefault();
      tab.action();
    }
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              onClick={(e) => handleTabClick(tab, e)}
              className="flex-1 flex flex-col items-center gap-1 py-2 transition-all touch-manipulation"
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform`}>
                <Icon 
                  className={`w-6 h-6 ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                />
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -inset-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </div>
              <span className={`text-xs ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-medium' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function MobileSlideOutSidebar({ isOpen, onClose }) {
  const { user } = useUser();
  const { logo } = useLogo();
  const [workspaces, setWorkspaces] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);

  useEffect(() => {
    async function fetchWorkspaces() {
      const ws = await Workspace.all();
      setWorkspaces(ws);
      if (ws.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(ws[0]);
      }
    }
    if (isOpen) {
      fetchWorkspaces();
    }
  }, [isOpen]);

  const handleDrag = (event, info) => {
    // Close sidebar if dragged left more than 100px
    if (info.offset.x < -100) {
      onClose();
    }
  };

  const handleWorkspaceClick = (workspace) => {
    navigator.vibrate?.([10]);
    setSelectedWorkspace(workspace);
    window.location.href = `/workspace/${workspace.slug}/chat`;
  };

  const filteredWorkspaces = workspaces.filter(ws => 
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentWorkspaces = workspaces.slice(0, 3);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDrag}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white dark:bg-gray-900 shadow-2xl z-50"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Logo" className="h-10 w-10 rounded-xl" />
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      AnythingLLM
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.username || 'Guest'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search workspaces..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-behavior-contain p-4">
              {/* Quick Actions */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      navigator.vibrate?.([10]);
                      window.location.href = paths.workspace.new();
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl hover:shadow-md transition-all active:scale-98"
                  >
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      New Workspace
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.vibrate?.([10]);
                      window.location.href = '/settings/user-connectors';
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-98"
                  >
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                      <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      Data Sources
                    </span>
                  </button>
                </div>
              </div>

              {/* Recent Workspaces */}
              {recentWorkspaces.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                    Recent
                  </h3>
                  <div className="space-y-2">
                    {recentWorkspaces.map((workspace) => (
                      <button
                        key={workspace.id}
                        onClick={() => handleWorkspaceClick(workspace)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-98 ${
                          selectedWorkspace?.id === workspace.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${
                          selectedWorkspace?.id === workspace.id
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            {workspace.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {workspace.threads?.length || 0} threads
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* All Workspaces */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                  All Workspaces
                </h3>
                <div className="space-y-2">
                  {filteredWorkspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceClick(workspace)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-98 ${
                        selectedWorkspace?.id === workspace.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${
                        selectedWorkspace?.id === workspace.id
                          ? 'bg-blue-100 dark:bg-blue-900/30'
                          : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <Folder className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {workspace.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Last active {workspace.lastActive || 'recently'}
                        </div>
                      </div>
                      {workspace.pinned && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-8">
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = paths.settings.appearance()}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/help'}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-all"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Help & Support</span>
                  </button>
                  
                  {user && (
                    <button
                      onClick={() => {
                        navigator.vibrate?.([10]);
                        window.location.href = paths.logout();
                      }}
                      className="w-full flex items-center gap-3 p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-600 dark:text-red-400">Logout</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function MobileSidebarWrapper({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {children}
      <MobileBottomNavigation onMenuClick={() => setSidebarOpen(true)} />
      <MobileSlideOutSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
    </>
  );
}