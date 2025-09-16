import React, { useState, useEffect } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  ArrowsClockwise,
  Plus,
  Gear,
  Link as LinkIcon,
  Building,
  Users,
  Briefcase,
  ChartLine,
  Globe,
  Shield,
  Lightning,
  Sparkle,
  Eye,
  ChatCircle,
  X
} from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import UserConnector from "@/models/userConnector";
import Workspace from "@/models/workspace";
import { useParams } from "react-router-dom";
import BusinessChat from "./BusinessChat";
import CustomizableDashboard from "./CustomizableDashboard";

// Industry Solutions connector configurations
const INDUSTRY_CONNECTORS = {
  // Communication & Collaboration
  gmail: { 
    name: "Gmail", 
    category: "Communication", 
    icon: "📧", 
    color: "from-red-400 to-red-600",
    description: "Email management and automation"
  },
  slack: { 
    name: "Slack", 
    category: "Communication", 
    icon: "💬", 
    color: "from-purple-400 to-purple-600",
    description: "Team communication and workflows"
  },
  
  // Productivity & Organization
  "google-drive": { 
    name: "Google Drive", 
    category: "Productivity", 
    icon: "📁", 
    color: "from-blue-400 to-blue-600",
    description: "Document storage and collaboration"
  },
  "google-calendar": { 
    name: "Google Calendar", 
    category: "Productivity", 
    icon: "📅", 
    color: "from-green-400 to-green-600",
    description: "Schedule management and automation"
  },
  notion: { 
    name: "Notion", 
    category: "Productivity", 
    icon: "📝", 
    color: "from-gray-400 to-gray-600",
    description: "Workspace and knowledge management"
  },
  
  // Business & Sales
  linkedin: { 
    name: "LinkedIn", 
    category: "Business", 
    icon: "💼", 
    color: "from-blue-500 to-blue-700",
    description: "Professional networking and outreach"
  },
  shopify: { 
    name: "Shopify", 
    category: "Business", 
    icon: "🛒", 
    color: "from-green-500 to-green-700",
    description: "E-commerce platform integration"
  },
  stripe: { 
    name: "Stripe", 
    category: "Business", 
    icon: "💳", 
    color: "from-indigo-400 to-indigo-600",
    description: "Payment processing and analytics"
  },
  
  // Development & Technical
  github: { 
    name: "GitHub", 
    category: "Development", 
    icon: "🐙", 
    color: "from-gray-600 to-gray-800",
    description: "Code repository and project management"
  },
  
  // Social & Marketing
  facebook: { 
    name: "Facebook", 
    category: "Marketing", 
    icon: "📘", 
    color: "from-blue-600 to-blue-800",
    description: "Social media management and advertising"
  },
  
  // Data & Analytics
  airtable: { 
    name: "Airtable", 
    category: "Data", 
    icon: "📊", 
    color: "from-purple-500 to-purple-700",
    description: "Database and workflow automation"
  }
};

// Category icons mapping
const CATEGORY_ICONS = {
  Communication: Users,
  Productivity: Briefcase,
  Business: ChartLine,
  Development: Gear,
  Marketing: Globe,
  Data: Shield
};

// Connector Circle Component - Google-style design
function ConnectorCircle({ 
  connector, 
  size = 40, 
  onClick, 
  onConnect,
  showStatus = true,
  className = "" 
}) {
  const config = INDUSTRY_CONNECTORS[connector?.provider] || {
    name: connector?.provider || 'Unknown',
    category: 'Other',
    icon: '🔗',
    color: 'from-gray-400 to-gray-600',
    description: 'External service integration'
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "syncing":
        return <ArrowsClockwise className="w-3 h-3 text-blue-500 animate-spin" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-500" />;
      case "pending":
        return <Clock className="w-3 h-3 text-yellow-500" />;
      default:
        return <XCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "ring-green-500 bg-green-50 dark:bg-green-900/20";
      case "syncing":
        return "ring-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "error":
        return "ring-red-500 bg-red-50 dark:bg-red-900/20";
      case "pending":
        return "ring-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
      default:
        return "ring-gray-300 bg-gray-50 dark:bg-gray-800";
    }
  };

  const connectorId = `connector-circle-${connector?.provider}-${Math.random().toString(36).substr(2, 9)}`;

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (connector?.status === "connected" && onClick) {
      onClick(connector);
    } else if (onConnect) {
      onConnect(connector?.provider || config.name.toLowerCase());
    }
  };

  return (
    <>
      <div
        id={connectorId}
        onClick={handleClick}
        className={`
          relative group cursor-pointer transform transition-all duration-300 hover:scale-110 hover:shadow-lg
          ${className}
        `}
        style={{ width: size, height: size }}
      >
        {/* Main Circle */}
        <div className={`
          w-full h-full rounded-full flex items-center justify-center
          bg-gradient-to-br ${config.color} shadow-md
          ring-2 ring-white dark:ring-gray-800
          hover:ring-4 hover:ring-blue-200 dark:hover:ring-blue-900
          transition-all duration-200
          ${showStatus ? getStatusColor(connector?.status) : ""}
        `}>
          <span style={{ fontSize: size * 0.4 }}>{config.icon}</span>
        </div>
        
        {/* Status Indicator */}
        {showStatus && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white dark:bg-gray-800 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
            {getStatusIcon(connector?.status)}
          </div>
        )}
        
        {/* Sync Animation */}
        {connector?.status === "syncing" && (
          <div className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-20" />
        )}
        
        {/* Hover Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
          <div className="font-medium">{config.name}</div>
          <div className="text-gray-400">{config.description}</div>
          {connector?.status && (
            <div className="text-gray-300 mt-1">
              Status: {connector.status}
            </div>
          )}
        </div>
      </div>

      {/* Tooltip */}
      <Tooltip
        anchorSelect={`#${connectorId}`}
        place="bottom"
        className="z-50"
      >
        <div className="text-center">
          <div className="font-medium">{config.name}</div>
          <div className="text-xs text-gray-400">{config.category}</div>
        </div>
      </Tooltip>
    </>
  );
}

// Industry Solutions Component
export default function IndustrySolutions({ 
  className = "",
  onConnectorClick,
  onConnectConnector,
  maxVisible = 8,
  showCategories = true,
  compact = false
}) {
  const { slug } = useParams();
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showBusinessChat, setShowBusinessChat] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    loadConnectors();
  }, [slug]);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      let userConnectors = [];
      let workspaceConnectors = [];

      // Load user-level connectors
      try {
        userConnectors = await UserConnector.list();
      } catch (error) {
        console.error("Failed to load user connectors:", error);
      }

      // Load workspace-level connectors if in a workspace
      if (slug) {
        try {
          const workspaceData = await Workspace.connectors.list(slug);
          workspaceConnectors = workspaceData.connectors || [];
        } catch (error) {
          console.error("Failed to load workspace connectors:", error);
        }
      }

      // Combine and deduplicate connectors
      const allConnectors = [...userConnectors, ...workspaceConnectors];
      const uniqueConnectors = allConnectors.reduce((acc, connector) => {
        if (!acc.find(c => c.provider === connector.provider)) {
          acc.push(connector);
        }
        return acc;
      }, []);

      setConnectors(uniqueConnectors);
    } catch (error) {
      console.error("Error loading connectors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider) => {
    try {
      if (slug) {
        // Connect to workspace
        const result = await Workspace.connectors.connect(slug, { provider });
        if (result.success) {
          loadConnectors(); // Refresh the list
        }
      } else {
        // Connect to user account
        await UserConnector.initOAuth(provider);
        loadConnectors(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  // Group connectors by category
  const groupedConnectors = Object.entries(INDUSTRY_CONNECTORS).reduce((acc, [provider, config]) => {
    const connector = connectors.find(c => c.provider === provider);
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push({
      provider,
      ...config,
      ...connector,
      status: connector?.status || 'disconnected'
    });
    return acc;
  }, {});

  const visibleConnectors = showAll 
    ? Object.values(groupedConnectors).flat()
    : Object.values(groupedConnectors).flat().slice(0, maxVisible);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          ))}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
        {/* Label - Hidden in compact mode */}
        {!compact && (
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              Industry Solutions:
            </span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:hidden">
              Solutions:
            </span>
          </div>
        )}

        {/* Connector Circles */}
        <div className="flex items-center gap-1">
          {visibleConnectors.map((connector, index) => (
            <ConnectorCircle
              key={`${connector.provider}-${index}`}
              connector={connector}
              size={compact ? 28 : 32}
              onClick={onConnectorClick}
              onConnect={handleConnect}
              showStatus={true}
              className="hover:z-10"
            />
          ))}
          
          {/* Show More/Less Button - Hidden in compact mode */}
          {!compact && Object.values(groupedConnectors).flat().length > maxVisible && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              title={showAll ? "Show less" : "Show more"}
            >
              <Plus className="w-3 h-3 text-gray-500" />
            </button>
          )}

          {/* Business Chat Button */}
          {!compact && (
            <button
              onClick={() => setShowBusinessChat(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all"
              title="Open Business Chat"
            >
              <ChatCircle className="w-3 h-3" />
            </button>
          )}

          {/* Dashboard Button */}
          {!compact && (
            <button
              onClick={() => setShowDashboard(true)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all"
              title="Open Dashboard"
            >
              <Eye className="w-3 h-3" />
            </button>
          )}

          {/* Add New Connector Button */}
          <button
            onClick={() => onConnectConnector && onConnectConnector()}
            className={`${compact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all`}
            title="Add new connector"
          >
            <Plus className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`} />
          </button>
        </div>

        {/* Status Summary - Hidden in compact mode */}
        {!compact && connectors.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hidden lg:flex">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{connectors.filter(c => c.status === 'connected').length} active</span>
          </div>
        )}
      </div>

      {/* Business Chat Modal */}
      <BusinessChat
        isOpen={showBusinessChat}
        onClose={() => setShowBusinessChat(false)}
        connectors={connectors}
        onConnectorAction={(connector) => {
          console.log("Connector action:", connector);
          // Handle connector actions
        }}
      />

      {/* Dashboard Modal */}
      {showDashboard && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Your Business Platform
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tailored to you • From all your platforms • Fit to your eyes
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                    Personalized dashboard with your connected data sources
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDashboard(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Dashboard Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <CustomizableDashboard
                layout="workflow-mirror"
                connectors={connectors}
                onCustomize={() => {
                  console.log("Customize dashboard");
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}