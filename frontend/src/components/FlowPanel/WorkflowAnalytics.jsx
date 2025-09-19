import React, { useState, useEffect } from "react";
import {
  ChartBar,
  Clock,
  CheckCircle,
  XCircle,
  Lightning,
  Timer,
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Play,
  Gear,
  X,
} from "@phosphor-icons/react";

// Mock data - in a real implementation, this would come from the backend
const MOCK_ANALYTICS = {
  totalRuns: 1247,
  successRate: 94.2,
  averageExecutionTime: 2.3,
  totalFlows: 12,
  activeFlows: 8,
  recentRuns: [
    {
      id: 1,
      name: "Data Processor",
      status: "success",
      duration: 1.8,
      timestamp: "2024-01-15T10:30:00Z",
      user: "admin",
    },
    {
      id: 2,
      name: "Email Automation",
      status: "success",
      duration: 0.9,
      timestamp: "2024-01-15T10:25:00Z",
      user: "admin",
    },
    {
      id: 3,
      name: "Web Scraper",
      status: "error",
      duration: 5.2,
      timestamp: "2024-01-15T10:20:00Z",
      user: "admin",
    },
    {
      id: 4,
      name: "File Organizer",
      status: "success",
      duration: 3.1,
      timestamp: "2024-01-15T10:15:00Z",
      user: "admin",
    },
    {
      id: 5,
      name: "Content Generator",
      status: "success",
      duration: 4.7,
      timestamp: "2024-01-15T10:10:00Z",
      user: "admin",
    },
  ],
  flowStats: [
    {
      name: "Data Processor",
      runs: 245,
      successRate: 96.3,
      avgDuration: 1.8,
      lastRun: "2024-01-15T10:30:00Z",
    },
    {
      name: "Email Automation",
      runs: 189,
      successRate: 98.9,
      avgDuration: 0.9,
      lastRun: "2024-01-15T10:25:00Z",
    },
    {
      name: "Web Scraper",
      runs: 156,
      successRate: 87.2,
      avgDuration: 3.2,
      lastRun: "2024-01-15T10:20:00Z",
    },
    {
      name: "File Organizer",
      runs: 134,
      successRate: 95.5,
      avgDuration: 2.1,
      lastRun: "2024-01-15T10:15:00Z",
    },
    {
      name: "Content Generator",
      runs: 98,
      successRate: 92.9,
      avgDuration: 4.7,
      lastRun: "2024-01-15T10:10:00Z",
    },
  ],
  dailyStats: [
    { date: "2024-01-09", runs: 45, successRate: 93.3 },
    { date: "2024-01-10", runs: 52, successRate: 96.2 },
    { date: "2024-01-11", runs: 38, successRate: 89.5 },
    { date: "2024-01-12", runs: 67, successRate: 95.5 },
    { date: "2024-01-13", runs: 41, successRate: 90.2 },
    { date: "2024-01-14", runs: 58, successRate: 94.8 },
    { date: "2024-01-15", runs: 23, successRate: 91.3 },
  ],
};

function StatCard({ title, value, subtitle, icon, trend, trendValue }) {
  const getTrendIcon = () => {
    if (trend === "up") return <ArrowUp size={16} className="text-green-500" />;
    if (trend === "down")
      return <ArrowDown size={16} className="text-red-500" />;
    return <Minus size={16} className="text-gray-500" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-600";
    if (trend === "down") return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function RecentRunsTable({ runs }) {
  const getStatusIcon = (status) => {
    if (status === "success")
      return <CheckCircle size={16} className="text-green-500" />;
    if (status === "error")
      return <XCircle size={16} className="text-red-500" />;
    return <Clock size={16} className="text-yellow-500" />;
  };

  const formatDuration = (duration) => {
    return `${duration}s`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity size={20} className="text-purple-500" />
          Recent Runs
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workflow
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Gear size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {run.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getStatusIcon(run.status)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">
                      {run.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(run.duration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTimestamp(run.timestamp)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {run.user}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FlowStatsTable({ stats }) {
  const getSuccessRateColor = (rate) => {
    if (rate >= 95) return "text-green-600 bg-green-100";
    if (rate >= 85) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const formatDuration = (duration) => {
    return `${duration}s`;
  };

  const formatLastRun = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ChartBar size={20} className="text-purple-500" />
          Flow Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workflow
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Runs
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Success Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Run
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.map((stat, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Gear size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {stat.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {stat.runs}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSuccessRateColor(stat.successRate)}`}
                  >
                    {stat.successRate}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDuration(stat.avgDuration)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatLastRun(stat.lastRun)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DailyChart({ data }) {
  const maxRuns = Math.max(...data.map((d) => d.runs));
  const maxSuccessRate = Math.max(...data.map((d) => d.successRate));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <TrendingUp size={20} className="text-purple-500" />
        Daily Activity (Last 7 Days)
      </h3>

      <div className="space-y-4">
        {/* Runs Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Total Runs
            </span>
            <span className="text-sm text-gray-500">{maxRuns} max</span>
          </div>
          <div className="flex items-end gap-2 h-20">
            {data.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t transition-all hover:from-purple-600 hover:to-purple-500"
                  style={{ height: `${(day.runs / maxRuns) * 100}%` }}
                  title={`${day.runs} runs`}
                />
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Success Rate Chart */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Success Rate
            </span>
            <span className="text-sm text-gray-500">{maxSuccessRate}% max</span>
          </div>
          <div className="flex items-end gap-2 h-20">
            {data.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:from-green-600 hover:to-green-500"
                  style={{
                    height: `${(day.successRate / maxSuccessRate) * 100}%`,
                  }}
                  title={`${day.successRate}% success rate`}
                />
                <span className="text-xs text-gray-500 mt-1">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowAnalytics({ onClose }) {
  const [analytics, setAnalytics] = useState(MOCK_ANALYTICS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // In a real implementation, this would fetch data from the backend
    setIsLoading(true);
    setTimeout(() => {
      setAnalytics(MOCK_ANALYTICS);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-700">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <ChartBar size={28} className="text-purple-500" />
                Workflow Analytics
              </h2>
              <p className="text-gray-600 mt-1">
                Track performance and usage metrics
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Runs"
              value={analytics.totalRuns.toLocaleString()}
              subtitle="All time"
              icon={<Play size={20} className="text-white" />}
              trend="up"
              trendValue="+12%"
            />
            <StatCard
              title="Success Rate"
              value={`${analytics.successRate}%`}
              subtitle="Last 30 days"
              icon={<CheckCircle size={20} className="text-white" />}
              trend="up"
              trendValue="+2.1%"
            />
            <StatCard
              title="Avg Duration"
              value={`${analytics.averageExecutionTime}s`}
              subtitle="Per workflow"
              icon={<Timer size={20} className="text-white" />}
              trend="down"
              trendValue="-0.3s"
            />
            <StatCard
              title="Active Flows"
              value={`${analytics.activeFlows}/${analytics.totalFlows}`}
              subtitle="Currently enabled"
              icon={<Lightning size={20} className="text-white" />}
              trend="up"
              trendValue="+1"
            />
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DailyChart data={analytics.dailyStats} />
            <div className="space-y-6">
              <RecentRunsTable runs={analytics.recentRuns} />
            </div>
          </div>

          {/* Flow Performance Table */}
          <FlowStatsTable stats={analytics.flowStats} />
        </div>
      </div>
    </div>
  );
}
