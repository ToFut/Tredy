import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Sparkle, 
  Gear, 
  Palette, 
  ChartLine, 
  GitBranch, 
  Search,
  Plus,
  ArrowRight,
  Lightbulb,
  Target,
  Lightning,
  Brain,
  Eye,
  Wand
} from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

// Dashboard Customization Prompts
const DASHBOARD_PROMPTS = [
  {
    id: "workflow-mirror",
    title: "Mirror My Workflow",
    description: "Tailored dashboard reflecting YOUR daily workflow patterns",
    icon: GitBranch,
    prompt: "Analyze my workflow patterns and create a dashboard that mirrors my daily tasks and processes",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "insights-focused",
    title: "Key Insights Focus",
    description: "Highlight YOUR most important metrics and insights",
    icon: ChartLine,
    prompt: "Design a dashboard focused on key business insights and performance metrics",
    color: "from-green-500 to-green-600"
  },
  {
    id: "connector-status",
    title: "Your Platform Health",
    description: "Monitor YOUR connected services and their status",
    icon: Lightning,
    prompt: "Create a dashboard that monitors the health and status of all connected services",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "ai-assistant",
    title: "AI Assistant View",
    description: "AI-powered dashboard tailored to YOUR business",
    icon: Brain,
    prompt: "Design an AI-powered dashboard with smart recommendations and automated insights",
    color: "from-indigo-500 to-indigo-600"
  }
];

// Quick Search Suggestions
const SEARCH_SUGGESTIONS = [
  "Show me my Gmail analytics",
  "What's my LinkedIn engagement?",
  "How are my Shopify sales performing?",
  "Connect my Google Calendar",
  "Sync my Notion workspace",
  "Check Stripe payments",
  "Analyze GitHub activity"
];

export default function IndustrySolutionsBusinessChat({ 
  isOpen, 
  onClose, 
  connectors = [],
  onConnectorAction 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState({
    layout: "workflow-mirror",
    widgets: [],
    insights: []
  });
  
  const chatRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => {
        searchRef.current?.focus();
      }, 300);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Simulate AI processing
    setTimeout(() => {
      console.log("Processing search:", query);
    }, 500);
  };

  const handlePromptSelect = (prompt) => {
    setSelectedPrompt(prompt);
    setIsCustomizing(true);
  };

  const handleDashboardCustomize = () => {
    setIsCustomizing(true);
  };

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Chat Interface */}
      <div 
        ref={chatRef}
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500 rounded-xl shadow-lg">
              <Sparkle className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Industry Solutions
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                AI-Powered Business Intelligence Platform
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Connected to {connectors.filter(c => c.status === 'connected').length} platforms
                </span>
              </div>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-white/60 dark:bg-gray-800/60 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {connectors.filter(c => c.status === 'connected').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Active
                </div>
              </div>
              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {connectors.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                Business Intelligence Dashboard
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
              <span>Last updated: 2 min ago</span>
              <span>•</span>
              <span>Real-time sync active</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full">
          {/* Search Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Ask about your business data, connect services, or customize your dashboard..."
                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
              <button
                onClick={() => handleSearch(searchQuery)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Suggestions */}
            {searchQuery && filteredSuggestions.length > 0 && (
              <div className="mt-3 space-y-1">
                {filteredSuggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dashboard Customization Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Customize Dashboard
                </h3>
              </div>
              <button
                onClick={handleDashboardCustomize}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
              >
                <Wand className="w-4 h-4" />
                Customize
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {DASHBOARD_PROMPTS.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handlePromptSelect(prompt)}
                  className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg group ${
                    selectedPrompt?.id === prompt.id 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 bg-gradient-to-br ${prompt.color} rounded-lg`}>
                      <prompt.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {prompt.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {prompt.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Your Data Sources Section */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightning className="w-5 h-5 text-green-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Your Data Sources
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>{connectors.filter(c => c.status === 'connected').length} platforms connected</span>
              </div>
            </div>
            
            <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                🎯 Your personalized dashboard draws data from these connected platforms
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Every insight is tailored to your workflows and business needs
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {connectors.slice(0, 6).map((connector, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 transition-colors cursor-pointer group"
                  onClick={() => onConnectorAction && onConnectorAction(connector)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      connector.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {connector.name || connector.provider}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {connector.status === 'connected' ? 'Feeding your dashboard' : 'Not connected'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights Section */}
          <div className="flex-1 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Insights
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                      Workflow Optimization
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Your Gmail and Calendar integration could be optimized for better productivity
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100 text-sm">
                      Business Growth
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      LinkedIn engagement is up 23% this week. Consider expanding your network
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}