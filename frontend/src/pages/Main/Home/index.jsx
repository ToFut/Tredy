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
  Clock,
  EnvelopeSimple,
  Calendar,
  LinkedinLogo,
  GoogleDriveLogo,
  Robot,
  PlugsConnected,
  Info
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
  const [workspaces, setWorkspaces] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkspaceData() {
      // If no slug, fetch the first workspace or set loading to false
      if (!slug) {
        try {
          setLoading(true);
          const allWorkspaces = await Workspace.all();
          setWorkspaces(allWorkspaces || []);
          if (allWorkspaces && allWorkspaces.length > 0) {
            const firstWorkspace = allWorkspaces[0];
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
        const [workspaceData, allWorkspaces] = await Promise.all([
          Workspace.bySlug(slug),
          Workspace.all()
        ]);
        setWorkspaces(allWorkspaces || []);
        if (workspaceData) {
          setWorkspace(workspaceData);
          // Get documents as data sources
          const documents = workspaceData?.documents || [];
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
    // Navigate to workspace with pre-loaded context about this data source
    window.location.href = `/workspace/${workspace.slug}?source=${encodeURIComponent(dataSource.name)}`;
  };

  const handleAddSource = () => {
    if (workspace?.slug) {
      // Navigate to workspace with openConnectors parameter to trigger the connector popup
      window.location.href = `/workspace/${workspace.slug}?openConnectors=true`;
    } else {
      // If no workspace exists, still go to user connectors
      window.location.href = `/settings/user-connectors`;
    }
  };

  const handleStartChat = () => {
    if (workspace?.slug) {
      window.location.href = `/workspace/${workspace.slug}`;
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
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen overflow-y-auto pb-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        {/* Welcome Hero Header */}
        <div className="mb-6 sm:mb-12">
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-800 dark:via-blue-900/20 dark:to-purple-900/20 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex-shrink-0 shadow-lg">
                  <Brain className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-1">
                    {user?.username ? `Welcome back, ${user.username}!` : 'Welcome to AnythingLLM'}
                  </h1>
                  <h2 className="text-base sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {workspace?.name || 'Your AI Workspace'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg">
                    {workspace?.name 
                      ? `Ready to assist with intelligent analysis and automation` 
                      : 'Your intelligent AI assistant for documents, analysis, and automation'
                    }
                  </p>
                </div>
              </div>
              
              {/* Time-based greeting */}
              <div className="hidden sm:block">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return 'Good morning! ☀️';
                      if (hour < 17) return 'Good afternoon! ☀️';
                      return 'Good evening! 🌙';
                    })()}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quick Stats Row - Enhanced Mobile Optimized */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200/30 dark:border-blue-700/30 hover:shadow-md transition-all duration-200">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {workspaces.length || 0}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Workspaces</p>
                <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">Ready to use</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200/30 dark:border-green-700/30 hover:shadow-md transition-all duration-200">
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 dark:text-green-400">
                  {dataSources.length || 0}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Data Sources</p>
                <p className="text-xs text-green-500 dark:text-green-400 mt-1">Connected</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200/30 dark:border-purple-700/30 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-center mb-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">
                    Live
                  </p>
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">AI Status</p>
                <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">Online</p>
              </div>
            </div>
          </div>

          {/* AI Assistant Quick Actions */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-5 sm:p-8 mb-8 border border-blue-200/50 dark:border-blue-700/50 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <Robot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get started with these common tasks</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Ready</span>
                </div>
                <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-800 dark:to-indigo-800 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                  Start with @agent
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <button
                onClick={() => window.location.href = workspace?.slug ? `/workspace/${workspace.slug}?prompt=${encodeURIComponent('@agent send email to')}` : '/'}
                className="group relative bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <EnvelopeSimple className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Send Email</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Compose and send emails</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => window.location.href = workspace?.slug ? `/workspace/${workspace.slug}?prompt=${encodeURIComponent('@agent schedule meeting for')}` : '/'}
                className="group relative bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Schedule Meeting</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Book calendar events</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => window.location.href = workspace?.slug ? `/workspace/${workspace.slug}?prompt=${encodeURIComponent('@agent post to linkedin')}` : '/'}
                className="group relative bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-800/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <LinkedinLogo className="w-6 h-6 text-blue-700 dark:text-blue-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">LinkedIn Post</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Share content</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => window.location.href = workspace?.slug ? `/workspace/${workspace.slug}?prompt=${encodeURIComponent('@agent search my drive for')}` : '/'}
                className="group relative bg-white dark:bg-gray-800 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-yellow-300 dark:hover:border-yellow-600"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex flex-col items-center text-center gap-3">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl group-hover:bg-yellow-100 dark:group-hover:bg-yellow-900/50 transition-colors">
                    <GoogleDriveLogo className="w-6 h-6 text-yellow-600 dark:text-yellow-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">Search Drive</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Find documents</p>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-blue-100/60 via-indigo-100/60 to-purple-100/60 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30 rounded-xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-500 rounded-lg flex-shrink-0">
                  <Sparkle className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pro Tips for Better Results</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span>Start with <code className="bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">@agent</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full flex-shrink-0"></div>
                      <span>Be specific with your requests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <span>Include recipient emails/names</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full flex-shrink-0"></div>
                      <span><a href="/settings/agents" className="text-blue-600 dark:text-blue-400 hover:underline">Manage connections</a></span>
                    </div>
                  </div>
                </div>
              </div>
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
              icon={PlugsConnected}
              title="Connectors"
              value="Active"
              subtitle="Gmail, Calendar+"
              color="purple"
            />
            <StatsCard
              icon={Robot}
              title="Agent Model"
              value="Mixtral"
              subtitle={workspace?.agentProvider || "TogetherAI"}
              color="amber"
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
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:scale-105 text-sm sm:text-base w-full sm:w-auto"
              >
                <PlugsConnected className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Manage Connectors</span>
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
          // Welcome Empty State - More Inviting
          <div className="text-center py-8 sm:py-16 lg:py-20">
            <div className="max-w-2xl mx-auto px-4">
              {/* Hero Icon */}
              <div className="relative mb-8 sm:mb-12">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl sm:rounded-4xl flex items-center justify-center mx-auto shadow-2xl">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Brain className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>
                {/* Floating decorative elements */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                  <Sparkle className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-1 -left-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                  <Plus className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent mb-4 sm:mb-6">
                {user?.username ? `Welcome ${user.username}!` : 'Welcome to AnythingLLM'}
              </h2>
              
              <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 sm:mb-6">
                Your AI-Powered Workspace is Ready
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg lg:text-xl mb-8 sm:mb-12 leading-relaxed max-w-xl mx-auto">
                Connect data sources, chat with AI, send emails, schedule meetings, and automate your workflow. 
                <span className="block mt-2 font-medium text-blue-600 dark:text-blue-400">Let's get started!</span>
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-12">
                <button
                  onClick={handleAddSource}
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 w-full sm:w-auto overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Plus className="w-6 h-6 relative z-10" />
                  <span className="relative z-10">Add Data Source</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
                
                <button
                  onClick={handleStartChat}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold text-lg transition-all duration-300 hover:shadow-lg w-full sm:w-auto"
                >
                  <ChatCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Start Chatting</span>
                </button>
              </div>
              
              {/* Getting Started Tips */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 sm:p-8 max-w-xl mx-auto border border-blue-200/30 dark:border-blue-700/30">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4 text-lg">What you can do right now:</h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300">Try: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">@agent send email to someone@example.com</code></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300">Ask: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm">@agent schedule a meeting tomorrow</code></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300">Connect services in <a href="/settings/agents" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Settings</a></span>
                  </div>
                </div>
              </div>
              
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