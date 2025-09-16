import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  ArrowRight, 
  Sparkle, 
  Zap, 
  Clock,
  TrendingUp,
  Users,
  Mail,
  Calendar,
  Briefcase,
  Target,
  Lightbulb
} from "@phosphor-icons/react";

// Search Categories and Quick Actions
const SEARCH_CATEGORIES = {
  analytics: {
    icon: TrendingUp,
    color: "text-blue-500",
    suggestions: [
      "Show Gmail analytics",
      "LinkedIn engagement metrics",
      "Shopify sales performance",
      "Stripe payment trends",
      "GitHub activity summary"
    ]
  },
  connections: {
    icon: Zap,
    color: "text-green-500",
    suggestions: [
      "Connect Google Calendar",
      "Sync Notion workspace",
      "Link LinkedIn account",
      "Connect Shopify store",
      "Integrate Stripe payments"
    ]
  },
  insights: {
    icon: Lightbulb,
    color: "text-purple-500",
    suggestions: [
      "What's my productivity trend?",
      "How are my sales performing?",
      "Show team collaboration metrics",
      "What are my top email contacts?",
      "Analyze my meeting patterns"
    ]
  },
  actions: {
    icon: Target,
    color: "text-orange-500",
    suggestions: [
      "Schedule a follow-up",
      "Send email campaign",
      "Update LinkedIn status",
      "Create calendar event",
      "Sync all connectors"
    ]
  }
};

// Recent Searches (simulated)
const RECENT_SEARCHES = [
  "Gmail analytics",
  "Connect Calendar",
  "Sales performance",
  "Team metrics"
];

export default function OneLineSearch({ 
  onSearch, 
  onQuickAction,
  connectors = [],
  className = ""
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (query.length > 0) {
      // Debounce search
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        generateSuggestions(query);
      }, 200);
    } else {
      setSuggestions([]);
      setSelectedCategory(null);
    }
  }, [query]);

  const generateSuggestions = (searchQuery) => {
    const allSuggestions = Object.values(SEARCH_CATEGORIES)
      .flatMap(category => category.suggestions)
      .filter(suggestion => 
        suggestion.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    setSuggestions(allSuggestions.slice(0, 6));
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (onSearch) {
        onSearch(searchQuery);
      }
      
      // Add to recent searches (simulate)
      if (!RECENT_SEARCHES.includes(searchQuery)) {
        RECENT_SEARCHES.unshift(searchQuery);
        if (RECENT_SEARCHES.length > 4) {
          RECENT_SEARCHES.pop();
        }
      }
      
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsProcessing(false);
      setQuery("");
      setIsFocused(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleQuickAction = (action) => {
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  const getCategoryIcon = (suggestion) => {
    for (const [category, config] of Object.entries(SEARCH_CATEGORIES)) {
      if (config.suggestions.some(s => s === suggestion)) {
        return config.icon;
      }
    }
    return Search;
  };

  const getCategoryColor = (suggestion) => {
    for (const [category, config] of Object.entries(SEARCH_CATEGORIES)) {
      if (config.suggestions.some(s => s === suggestion)) {
        return config.color;
      }
    }
    return "text-gray-500";
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {isProcessing ? (
            <div className="animate-spin">
              <Sparkle className="w-5 h-5 text-purple-500" />
            </div>
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Ask about your business data, connect services, or get insights..."
          className="w-full pl-12 pr-16 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all shadow-sm"
        />
        
        <button
          onClick={() => handleSearch()}
          disabled={!query.trim() || isProcessing}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {(isFocused || query) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
          {/* Recent Searches */}
          {!query && RECENT_SEARCHES.length > 0 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Recent Searches
                </span>
              </div>
              <div className="space-y-1">
                {RECENT_SEARCHES.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(search)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <Sparkle className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Suggestions
                </span>
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => {
                  const Icon = getCategoryIcon(suggestion);
                  const color = getCategoryColor(suggestion);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-3"
                    >
                      <Icon className={`w-4 h-4 ${color}`} />
                      <span>{suggestion}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          {!query && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Quick Actions
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: Mail, label: "Email Analytics", action: "email-analytics" },
                  { icon: Calendar, label: "Schedule Meeting", action: "schedule-meeting" },
                  { icon: Users, label: "Team Overview", action: "team-overview" },
                  { icon: Briefcase, label: "Business Metrics", action: "business-metrics" }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(item.action)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-gray-500" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Status */}
      {isProcessing && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="animate-spin">
              <Sparkle className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-sm text-purple-700 dark:text-purple-300">
              Processing your request...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}