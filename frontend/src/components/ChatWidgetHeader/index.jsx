import React, { useState, useEffect } from "react";
import { 
  Users, 
  Plus, 
  Plug,
  Gear,
  X,
  UserPlus,
  Link,
  Database,
  Bell,
  ChartBar,
  Clock,
  Share
} from "@phosphor-icons/react";
import useUser from "@/hooks/useUser";
import UserIcon from "../UserIcon";
import Admin from "@/models/admin";
import Workspace from "@/models/workspace";
import showToast from "@/utils/toast";
import ModalWrapper from "../ModalWrapper";

// Widget Components

// Members Widget - Shows workspace members
function MembersWidget({ workspace, onAddMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        // Fetch workspace members
        const workspaceMembers = await Workspace.members(workspace.slug);
        setMembers(workspaceMembers || []);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      } finally {
        setLoading(false);
      }
    }
    if (workspace?.slug) fetchMembers();
  }, [workspace]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Members:</span>
      
      {/* Member Avatars */}
      <div className="flex items-center -space-x-2">
        {loading ? (
          <div className="animate-pulse h-7 w-7 bg-gray-300 dark:bg-gray-600 rounded-full" />
        ) : (
          members.slice(0, 3).map((member, idx) => (
            <div 
              key={idx} 
              className="relative group"
              title={member.username || member.email}
            >
              <UserIcon 
                user={member} 
                size={28}
                className="ring-2 ring-white dark:ring-gray-800"
              />
            </div>
          ))
        )}
        {members.length > 3 && (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-gray-800">
            +{members.length - 3}
          </div>
        )}
      </div>

      {/* Add Member Button */}
      <button
        onClick={onAddMember}
        className="ml-1 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        title="Invite member"
      >
        <UserPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </button>
    </div>
  );
}

// Connectors Widget - Shows connected services
function ConnectorsWidget({ connectors = [], onAddConnector, onManageConnectors }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      <Plug className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Services:</span>
      
      {/* Service Icons */}
      <div className="flex items-center -space-x-1">
        {connectors.length === 0 ? (
          <span className="text-xs text-gray-500 dark:text-gray-400">None</span>
        ) : (
          <>
            {connectors.slice(0, 4).map((connector, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center"
                title={connector.name}
              >
                <span className="text-xs font-medium">
                  {connector.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {connectors.length > 4 && (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center justify-center">
                +{connectors.length - 4}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Connector Button */}
      <button
        onClick={onAddConnector}
        className="ml-1 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
        title="Add service"
      >
        <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
      </button>

      {connectors.length > 0 && (
        <button
          onClick={onManageConnectors}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Manage services"
        >
          <Gear className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
        </button>
      )}
    </div>
  );
}

// Stats Widget - Shows workspace statistics
function StatsWidget({ workspace }) {
  const [stats, setStats] = useState({ documents: 0, chats: 0 });

  useEffect(() => {
    // Fetch workspace stats
    if (workspace) {
      // Mock data - replace with actual API calls
      setStats({
        documents: workspace.documentCount || 0,
        chats: workspace.chatCount || 0
      });
    }
  }, [workspace]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1.5">
        <Database className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {stats.documents} docs
        </span>
      </div>
      <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
      <div className="flex items-center gap-1.5">
        <ChartBar className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {stats.chats} chats
        </span>
      </div>
    </div>
  );
}

// Activity Widget - Shows recent activity
function ActivityWidget({ workspace }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 rounded-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
      <Clock className="w-4 h-4 text-orange-500" />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        Last active: 2 mins ago
      </span>
    </div>
  );
}

// Share Widget - Quick share workspace
function ShareWidget({ workspace, onShare }) {
  return (
    <button
      onClick={onShare}
      className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
    >
      <Share className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Share</span>
    </button>
  );
}

// Invite Modal Component
function InviteModal({ isOpen, onClose, workspace }) {
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const createInvite = async () => {
    setLoading(true);
    try {
      const { invite } = await Admin.newInvite({
        workspaceIds: workspace ? [workspace.id] : [],
      });
      if (invite) {
        const link = `${window.location.origin}/accept-invite/${invite.code}`;
        setInviteLink(link);
      }
    } catch (error) {
      showToast("Failed to create invite", "error");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    showToast("Invite link copied!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (isOpen && !inviteLink) {
      createInvite();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <ModalWrapper isOpen={isOpen}>
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite Members
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ) : inviteLink ? (
              <>
                <div className="relative">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="w-full px-3 py-2 pr-20 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg"
                  />
                  <button
                    onClick={copyLink}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Share this link with people you want to invite. They'll automatically join as admin users.
                </p>
              </>
            ) : (
              <p className="text-sm text-red-500">Failed to generate invite link</p>
            )}
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}

// Main Widget Header Component
export default function ChatWidgetHeader({ 
  workspace,
  connectors = [],
  onConnectorClick,
  onManageConnectors,
  enabledWidgets = ["members", "connectors", "stats", "share"]
}) {
  const { user } = useUser();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleAddMember = () => {
    setShowInviteModal(true);
  };

  const handleAddConnector = () => {
    // Navigate to connector settings or show connector modal
    window.location.href = `/workspace/${workspace?.slug}/settings/connectors`;
  };

  const handleShare = () => {
    setShowInviteModal(true);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-thin">
            {/* Workspace Title */}
            <div className="flex-shrink-0 flex items-center gap-2 pr-3 border-r border-gray-300 dark:border-gray-600">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {workspace?.name || "Workspace"}
              </h2>
            </div>

            {/* Widget Container */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {enabledWidgets.includes("members") && (
                <MembersWidget 
                  workspace={workspace} 
                  onAddMember={handleAddMember}
                />
              )}
              
              {enabledWidgets.includes("connectors") && (
                <ConnectorsWidget 
                  connectors={connectors}
                  onAddConnector={handleAddConnector}
                  onManageConnectors={onManageConnectors}
                />
              )}
              
              {enabledWidgets.includes("stats") && (
                <StatsWidget workspace={workspace} />
              )}
              
              {enabledWidgets.includes("activity") && (
                <ActivityWidget workspace={workspace} />
              )}
              
              {enabledWidgets.includes("share") && (
                <ShareWidget 
                  workspace={workspace}
                  onShare={handleShare}
                />
              )}
            </div>

            {/* Right Actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                title="Settings"
                onClick={() => window.location.href = `/workspace/${workspace?.slug}/settings`}
              >
                <Gear className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal 
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspace={workspace}
      />
    </>
  );
}