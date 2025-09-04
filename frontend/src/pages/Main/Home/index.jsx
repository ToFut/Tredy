import React, { useState, useEffect } from "react";
import QuickLinks from "./QuickLinks";
import ExploreFeatures from "./ExploreFeatures";
import Resources from "./Resources";
import Checklist from "./Checklist";
import { isMobile } from "react-device-detect";
import { 
  Database, 
  ChatCircle, 
  FileText,
  Globe,
  Brain,
  Plus,
  ArrowRight,
  Sparkle,
  TrendUp,
  Users,
  Clock
} from "@phosphor-icons/react";
import useUser from "@/hooks/useUser";
import Workspace from "@/models/workspace";
import { useParams } from "react-router-dom";

// Real data sources based on workspace configuration
const getDataSourceIcon = (type) => {
  const icons = {
    'database': Database,
    'file': FileText,
    'web': Globe,
    'communication': ChatCircle,
    'default': FileText
  };
  return icons[type] || icons.default;
};

const getDataSourceType = (filename) => {
  if (filename?.includes('database') || filename?.includes('.sql')) return 'database';
  if (filename?.includes('slack') || filename?.includes('discord')) return 'communication';
  if (filename?.includes('http') || filename?.includes('website')) return 'web';
  return 'file';
};

function DataSourceCard({ dataSource, onClick }) {
  const IconComponent = getDataSourceIcon(getDataSourceType(dataSource.name));
  
  return (
    <div
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-4 sm:p-5 lg:p-6">
        <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="p-2 sm:p-2.5 lg:p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg sm:rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors flex-shrink-0">
            <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-base sm:text-lg">
              {dataSource.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {dataSource.vectorCount || 0} vectors • {getDataSourceType(dataSource.name)}
            </p>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500 dark:text-gray-400">Ready to analyze</span>
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transform translate-x-1 group-hover:translate-x-0 transition-all duration-200" />
        </div>
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, title, value, subtitle, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 text-blue-700 bg-blue-50 dark:bg-blue-900/30",
    green: "from-green-500 to-green-600 text-green-700 bg-green-50 dark:bg-green-900/30",
    purple: "from-purple-500 to-purple-600 text-purple-700 bg-purple-50 dark:bg-purple-900/30",
    amber: "from-amber-500 to-amber-600 text-amber-700 bg-amber-50 dark:bg-amber-900/30"
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
        <div className={`p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl ${colorClasses[color]}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useUser();
  const { slug } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkspaceData() {
      // If no slug, fetch the first workspace or set loading to false
      if (!slug) {
        try {
          setLoading(true);
          const workspaces = await Workspace.all();
          if (workspaces && workspaces.length > 0) {
            const firstWorkspace = workspaces[0];
            setWorkspace(firstWorkspace);
            const documents = firstWorkspace?.documents || [];
            setDataSources(documents);
          }
        } catch (error) {
          console.error('Error fetching workspaces:', error);
        } finally {
          setLoading(false);
        }
        return;
      }
      
      try {
        setLoading(true);
        const workspace = await Workspace.bySlug(slug);
        if (workspace) {
          setWorkspace(workspace);
          // Get documents as data sources
          const documents = workspace?.documents || [];
          setDataSources(documents);
        }
      } catch (error) {
        console.error('Error fetching workspace data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchWorkspaceData();
  }, [slug]);

  const handleDataSourceClick = (dataSource) => {
    // Navigate to chat with pre-loaded context about this data source
    window.location.href = `/workspace/${workspace.slug}/chat?source=${encodeURIComponent(dataSource.name)}`;
  };

  const handleAddSource = () => {
    if (workspace?.slug) {
      // Navigate to user connectors instead of workspace connectors
      window.location.href = `/settings/user-connectors`;
    } else {
      // If no workspace exists, still go to user connectors
      window.location.href = `/settings/user-connectors`;
    }
  };

  const handleStartChat = () => {
    if (workspace?.slug) {
      window.location.href = `/workspace/${workspace.slug}/chat`;
    } else {
      // If no workspace exists, redirect to home
      window.location.href = `/`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Hero Header */}
        <div className="mb-8 sm:mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex-shrink-0">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent break-words">
                {workspace?.name || 'Tredy Workspace'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg">
                AI-powered data analysis and insights platform
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon={Database}
              title="Data Sources"
              value={dataSources.length}
              subtitle="Connected"
              color="blue"
            />
            <StatsCard
              icon={TrendUp}
              title="Analytics"
              value="Ready"
              subtitle="AI-powered"
              color="green"
            />
            <StatsCard
              icon={Users}
              title="Workspace"
              value="Active"
              subtitle="Collaborative"
              color="purple"
            />
            <StatsCard
              icon={Clock}
              title="24/7"
              value="Available"
              subtitle="Always ready"
              color="amber"
            />
          </div>
        </div>

        {/* Main Content */}
        {dataSources.length > 0 ? (
          <div className="mb-12">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
              <div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3">
                  <Sparkle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 flex-shrink-0" />
                  <span className="break-words">Your Connected Data Sources</span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
                  Click any source to start analyzing with AI
                </p>
              </div>
              <button
                onClick={handleAddSource}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Add New Source</span>
              </button>
            </div>
            
            {/* Data Sources Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {dataSources.map((dataSource, index) => (
                <DataSourceCard
                  key={dataSource.id || index}
                  dataSource={dataSource}
                  onClick={() => handleDataSourceClick(dataSource)}
                />
              ))}
            </div>

            {/* AI Assistant CTA */}
            <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-700 rounded-2xl sm:rounded-3xl border border-blue-200 dark:border-gray-600 p-6 sm:p-8">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 mb-6">
                  <Brain className="w-8 h-8 text-white" />
                  <Sparkle className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Ready to Analyze Your Data with AI?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Your data sources are connected and ready. Start a conversation with our AI assistant to get insights, answer questions, and discover patterns in your data.
                </p>
                <button
                  onClick={handleStartChat}
                  className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base lg:text-lg transition-all duration-200 hover:shadow-xl hover:scale-105 w-full sm:w-auto"
                >
                  <ChatCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Start AI Analysis</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Enhanced Empty State
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <div className="max-w-md mx-auto px-4">
              <div className="relative mb-6 sm:mb-8">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto">
                  <Database className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                Welcome to Your Tredy Workspace
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 leading-relaxed">
                Connect your first data source to unlock AI-powered insights and analysis. Transform your data into actionable intelligence.
              </p>
              
              <button
                onClick={handleAddSource}
                className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base lg:text-lg transition-all duration-200 hover:shadow-xl hover:scale-105 mb-4 sm:mb-6 w-full sm:w-auto"
              >
                <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Connect Your First Data Source</span>
              </button>
              
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Supports databases, files, APIs, and more
              </p>
            </div>
          </div>
        )}

        {/* Additional sections for completeness */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-12 lg:mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendUp className="w-5 h-5 text-green-500" />
              Getting Started
            </h3>
            <Checklist />
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-purple-500" />
              Quick Actions
            </h3>
            <QuickLinks />
          </div>
        </div>
      </div>
    </div>
  );
}