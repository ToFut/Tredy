import React, { useState, useEffect } from "react";
import {
  ChartLine,
  Users,
  Calendar,
  Envelope,
  Briefcase,
  Clock,
  Target,
  Lightning,
  Eye,
  Gear,
  ArrowClockwise,
  Plus,
  Minus,
  ArrowsOut,
  ArrowsIn
} from "@phosphor-icons/react";

// Widget Types
const WIDGET_TYPES = {
  'workflow-metrics': {
    title: 'Workflow Metrics',
    color: 'from-blue-500 to-blue-600',
    description: 'Track your daily workflow efficiency'
  },
  'connector-health': {
    title: 'Connector Health',
    icon: Lightning,
    color: 'from-green-500 to-green-600',
    description: 'Monitor all connected services'
  },
  'business-insights': {
    title: 'Business Insights',
    icon: ChartLine,
    color: 'from-purple-500 to-purple-600',
    description: 'Key performance indicators'
  },
  'communication-summary': {
    title: 'Communication Summary',
    icon: Envelope,
    color: 'from-orange-500 to-orange-600',
    description: 'Email and messaging overview'
  },
  'calendar-overview': {
    title: 'Calendar Overview',
    icon: Calendar,
    color: 'from-indigo-500 to-indigo-600',
    description: 'Schedule and meeting insights'
  },
  'team-activity': {
    title: 'Team Activity',
    icon: Users,
    color: 'from-pink-500 to-pink-600',
    description: 'Team collaboration metrics'
  }
};

// Sample Data Generator
const generateWidgetData = (type) => {
  const data = {
    'workflow-metrics': {
      efficiency: 87,
      tasksCompleted: 23,
      avgTaskTime: '2.3h',
      trend: '+12%'
    },
    'connector-health': {
      totalConnectors: 8,
      activeConnectors: 7,
      lastSync: '2 min ago',
      status: 'healthy'
    },
    'business-insights': {
      revenue: '$12,450',
      growth: '+18%',
      customers: 156,
      satisfaction: '94%'
    },
    'communication-summary': {
      emailsSent: 45,
      emailsReceived: 78,
      responseTime: '1.2h',
      unreadCount: 12
    },
    'calendar-overview': {
      meetingsToday: 4,
      freeTime: '2.5h',
      nextMeeting: 'Sales Call',
      productivity: 'High'
    },
    'team-activity': {
      activeMembers: 8,
      projects: 12,
      collaboration: 'High',
      lastActivity: '5 min ago'
    }
  };
  return data[type] || {};
};

// Individual Widget Component
function DashboardWidget({ 
  type, 
  size = 'medium', 
  isDraggable = false,
  onRemove,
  onResize 
}) {
  const config = WIDGET_TYPES[type];
  const data = generateWidgetData(type);
  
  if (!config) return null;

  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2'
  };

  const Icon = config.icon;

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 
        hover:shadow-lg transition-all duration-200 group
        ${isDraggable ? 'cursor-move' : ''}
      `}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-2 bg-gradient-to-br ${config.color} rounded-lg`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {config.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {config.description}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onResize && (
            <>
              <button
                onClick={() => onResize(type, 'small')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Small"
              >
                <ArrowsIn className="w-3 h-3 text-gray-500" />
              </button>
              <button
                onClick={() => onResize(type, 'large')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Large"
              >
                <ArrowsOut className="w-3 h-3 text-gray-500" />
              </button>
            </>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(type)}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
              title="Remove"
            >
              <Minus className="w-3 h-3 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="space-y-2">
        {Object.entries(data).map(([key, value], index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className={`text-sm font-medium ${
              key === 'trend' || key === 'growth' 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-900 dark:text-white'
            }`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Widget Footer */}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Updated 2 min ago
          </span>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <ArrowClockwise className="w-3 h-3 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Connector Status Bar Component
function ConnectorStatusBar({ connectors }) {
  const activeConnectors = connectors.filter(c => c.status === 'connected');
  const totalConnectors = connectors.length;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <Lightning className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
              Your Connected Platforms
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Data sources powering your personalized dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-blue-700 dark:text-blue-300 font-medium">
            {activeConnectors.length}/{totalConnectors} Active
          </span>
        </div>
      </div>
      
      {/* Connector Circles */}
      <div className="flex items-center gap-2">
        {activeConnectors.slice(0, 8).map((connector, index) => (
          <div
            key={index}
            className="relative group"
            title={`${connector.name || connector.provider} - Connected`}
          >
            <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-green-500 flex items-center justify-center shadow-sm">
              <span className="text-xs">
                {connector.name ? connector.name.charAt(0).toUpperCase() : connector.provider.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white dark:border-gray-800" />
          </div>
        ))}
        
        {activeConnectors.length > 8 && (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              +{activeConnectors.length - 8}
            </span>
          </div>
        )}
        
        {activeConnectors.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <span>Connect your platforms to see personalized data</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function CustomizableDashboard({ 
  layout = 'workflow-mirror',
  connectors = [],
  onCustomize,
  className = ""
}) {
  const [widgets, setWidgets] = useState([]);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [availableWidgets, setAvailableWidgets] = useState([]);

  useEffect(() => {
    initializeDashboard(layout);
  }, [layout]);

  const initializeDashboard = (layoutType) => {
    let defaultWidgets = [];
    
    switch (layoutType) {
      case 'workflow-mirror':
        defaultWidgets = [
          { type: 'workflow-metrics', size: 'large' },
          { type: 'connector-health', size: 'medium' },
          { type: 'communication-summary', size: 'medium' },
          { type: 'calendar-overview', size: 'medium' },
          { type: 'team-activity', size: 'medium' }
        ];
        break;
      case 'insights-focused':
        defaultWidgets = [
          { type: 'business-insights', size: 'large' },
          { type: 'workflow-metrics', size: 'medium' },
          { type: 'connector-health', size: 'medium' },
          { type: 'communication-summary', size: 'medium' }
        ];
        break;
      case 'connector-status':
        defaultWidgets = [
          { type: 'connector-health', size: 'large' },
          { type: 'workflow-metrics', size: 'medium' },
          { type: 'business-insights', size: 'medium' },
          { type: 'communication-summary', size: 'medium' }
        ];
        break;
      case 'ai-assistant':
        defaultWidgets = [
          { type: 'business-insights', size: 'large' },
          { type: 'workflow-metrics', size: 'medium' },
          { type: 'team-activity', size: 'medium' },
          { type: 'connector-health', size: 'medium' }
        ];
        break;
      default:
        defaultWidgets = [
          { type: 'workflow-metrics', size: 'medium' },
          { type: 'connector-health', size: 'medium' }
        ];
    }
    
    setWidgets(defaultWidgets);
    setAvailableWidgets(Object.keys(WIDGET_TYPES).filter(
      type => !defaultWidgets.some(w => w.type === type)
    ));
  };

  const addWidget = (type) => {
    const newWidget = { type, size: 'medium' };
    setWidgets([...widgets, newWidget]);
    setAvailableWidgets(availableWidgets.filter(t => t !== type));
  };

  const removeWidget = (type) => {
    setWidgets(widgets.filter(w => w.type !== type));
    setAvailableWidgets([...availableWidgets, type]);
  };

  const resizeWidget = (type, newSize) => {
    setWidgets(widgets.map(w => 
      w.type === type ? { ...w, size: newSize } : w
    ));
  };

  const toggleCustomization = () => {
    setIsCustomizing(!isCustomizing);
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 rounded-xl p-6 ${className}`}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Your Business Platform
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tailored to you • From all your platforms • Fit to your eyes
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
              {layout.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Layout
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={toggleCustomization}
            className={`px-3 py-2 rounded-lg transition-colors ${
              isCustomizing 
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Gear className="w-4 h-4" />
          </button>
          {onCustomize && (
            <button
              onClick={onCustomize}
              className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Connector Status Bar */}
      <ConnectorStatusBar connectors={connectors} />

      {/* Customization Panel */}
      {isCustomizing && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            Available Widgets
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {availableWidgets.map(type => {
              const config = WIDGET_TYPES[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => addWidget(type)}
                  className="flex items-center gap-2 p-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className={`p-1 bg-gradient-to-br ${config.color} rounded`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {config.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-4 gap-4 auto-rows-min">
        {widgets.map((widget, index) => (
          <DashboardWidget
            key={`${widget.type}-${index}`}
            type={widget.type}
            size={widget.size}
            isDraggable={isCustomizing}
            onRemove={isCustomizing ? removeWidget : undefined}
            onResize={isCustomizing ? resizeWidget : undefined}
          />
        ))}
      </div>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No widgets configured
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add widgets to start monitoring your business data
          </p>
          <button
            onClick={toggleCustomization}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            Add Widgets
          </button>
        </div>
      )}
    </div>
  );
}