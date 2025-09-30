import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  FlowArrow,
  CaretDown,
  CaretUp,
  Plus,
  Gear,
  Play,
  Clock,
  CheckCircle,
  X,
  ArrowsClockwise,
  Wrench,
  CalendarBlank,
  Timer,
  Target,
  DotsThree,
  MagnifyingGlass,
  FunnelSimple,
  Trash,
  Export,
  Copy,
  Star,
  Eye,
  EyeSlash,
  SortAscending,
  SortDescending,
  List,
  GridFour,
  Lightning,
  ChartBar,
  Warning,
  CheckCircle as SuccessIcon,
  XCircle as ErrorIcon,
  Clock as PendingIcon,
  BracketsCurly,
  Sparkle,
} from "@phosphor-icons/react";
import WorkflowBuilder from "./WorkflowBuilder";
import WorkflowTemplates from "./WorkflowTemplates";
import WorkflowAnalytics from "./WorkflowAnalytics";
import AgentFlows from "@/models/agentFlows";
import showToast from "@/utils/toast";

// Enhanced Workflow Item Component with comprehensive metadata
function WorkflowItem({
  flow,
  isSelected,
  onSelect,
  onEdit,
  onRun,
  onToggle,
  onDelete,
  onDuplicate,
  onFavorite,
  onCompare,
  viewMode = "list", // 'list' or 'grid'
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Load workflow statistics
  useEffect(() => {
    if (flow.uuid) {
      loadWorkflowStats();
    }
  }, [flow.uuid]);

  const loadWorkflowStats = async () => {
    setLoadingStats(true);
    try {
      // This would call the existing schedule execution stats
      const response = await fetch(`/api/workspace/${workspaceSlug}/agent-schedules/stats`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to load workflow stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const getStatusIcon = () => {
    if (flow.status === "building")
      return <PendingIcon size={14} className="text-amber-500 animate-pulse" />;
    if (flow.status === "error")
      return <ErrorIcon size={14} className="text-red-500" />;
    if (flow.status === "success")
      return <SuccessIcon size={14} className="text-green-500" />;
    return flow.active ? (
      <CheckCircle size={14} className="text-green-500" />
    ) : (
      <X size={14} className="text-gray-400" />
    );
  };

  const getStatusColor = () => {
    if (flow.status === "building") return "border-amber-200 bg-amber-50";
    if (flow.status === "error") return "border-red-200 bg-red-50";
    if (flow.status === "success") return "border-green-200 bg-green-50";
    return flow.active
      ? "border-green-200 bg-green-50"
      : "border-gray-200 bg-gray-50";
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (ms) => {
    if (!ms) return "0s";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getComplexityLevel = (stepCount) => {
    if (!stepCount)
      return { level: "Simple", color: "text-green-600", bg: "bg-green-100" };
    if (stepCount <= 5)
      return { level: "Simple", color: "text-green-600", bg: "bg-green-100" };
    if (stepCount <= 15)
      return { level: "Medium", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (stepCount <= 50)
      return {
        level: "Complex",
        color: "text-orange-600",
        bg: "bg-orange-100",
      };
    return { level: "Advanced", color: "text-red-600", bg: "bg-red-100" };
  };

  const complexity = getComplexityLevel(flow.stepCount || 0);

  if (viewMode === "grid") {
    return (
      <div
        className={`relative group cursor-pointer transition-all duration-200 ${getStatusColor()} border rounded-xl p-4 hover:shadow-lg hover:scale-[1.02]`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Selection checkbox */}
        <div className="absolute top-3 left-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(flow.uuid, e.target.checked)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
        </div>

        {/* Favorite star */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(flow.uuid);
            }}
            className="text-gray-400 hover:text-yellow-500 transition-colors"
          >
            {flow.favorite ? (
              <Star size={16} className="text-yellow-500" />
            ) : (
              <Star size={16} />
            )}
          </button>
        </div>

        {/* Status indicator with complexity */}
        <div className="flex items-center justify-center mb-3">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <FlowArrow size={24} className="text-white" />
            </div>
            {/* Complexity badge */}
            <div
              className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${complexity.bg} ${complexity.color}`}
            >
              {complexity.level}
            </div>
          </div>
        </div>

        {/* Flow info */}
        <div className="text-center">
          <h3 className="font-semibold text-gray-800 mb-1 truncate">
            {flow.name}
          </h3>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">
            {flow.description || "No description"}
          </p>

          {/* Status */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {getStatusIcon()}
            <span className="text-xs font-medium">
              {flow.status === "building"
                ? "Building"
                : flow.status === "error"
                  ? "Error"
                  : flow.status === "success"
                    ? "Success"
                    : flow.active
                      ? "Active"
                      : "Inactive"}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <Play size={10} />
              <span>
                {loadingStats
                  ? "..."
                  : formatNumber(stats?.totalExecutions || 0)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <Lightning size={10} />
              <span>
                {loadingStats
                  ? "..."
                  : formatNumber(stats?.totalTokensUsed || 0)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <Timer size={10} />
              <span>
                {loadingStats
                  ? "..."
                  : formatDuration(stats?.averageDuration * 1000 || 0)}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1 text-gray-600">
              <CheckCircle size={10} />
              <span>
                {loadingStats
                  ? "..."
                  : `${Math.round(stats?.successRate || 0)}%`}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div
            className={`flex items-center justify-center gap-1 transition-opacity ${showActions || isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRun(flow);
              }}
              className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              title="Run workflow"
            >
              <Play size={12} weight="fill" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(flow);
              }}
              className="p-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              title="Edit workflow"
            >
              <Gear size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCompare && onCompare(flow);
              }}
              className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title="Compare workflow"
            >
              <ChartBar size={12} />
            </button>
          </div>
        </div>

        {/* Hover overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/5 rounded-xl" />
        )}
      </div>
    );
  }

  // Enhanced List view with comprehensive metadata
  return (
    <div
      className={`group relative transition-all duration-200 ${getStatusColor()} border rounded-lg p-4 hover:shadow-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-4">
        {/* Selection checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(flow.uuid, e.target.checked)}
          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
        />

        {/* Workflow icon with complexity */}
        <div className="flex-shrink-0 relative">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-sm">
            <FlowArrow size={16} className="text-white" />
          </div>
          <div
            className={`absolute -top-1 -right-1 px-1 py-0.5 rounded-full text-xs font-medium ${complexity.bg} ${complexity.color}`}
          >
            {complexity.level}
          </div>
        </div>

        {/* Flow info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-gray-800 truncate">{flow.name}</h3>
            {flow.favorite && (
              <Star size={14} className="text-yellow-500 flex-shrink-0" />
            )}
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className="text-xs text-gray-500">
                {flow.status === "building"
                  ? "Building"
                  : flow.status === "error"
                    ? "Error"
                    : flow.status === "success"
                      ? "Success"
                      : flow.active
                        ? "Active"
                        : "Inactive"}
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 truncate mb-2">
            {flow.description || "No description"}
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Play size={10} />
              <span>
                {loadingStats
                  ? "..."
                  : formatNumber(stats?.totalExecutions || 0)}{" "}
                runs
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Lightning size={10} />
              <span>
                {loadingStats
                  ? "..."
                  : formatNumber(stats?.totalTokensUsed || 0)}{" "}
                tokens
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Timer size={10} />
              <span>
                {loadingStats
                  ? "..."
                  : formatDuration(stats?.averageDuration * 1000 || 0)}{" "}
                avg
              </span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle size={10} />
              <span>
                {loadingStats
                  ? "..."
                  : `${Math.round(stats?.successRate || 0)}% success`}
              </span>
            </div>
            {flow.stepCount && (
              <div className="flex items-center gap-1">
                <BracketsCurly size={10} />
                <span>{flow.stepCount} steps</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className={`flex items-center gap-1 transition-opacity ${showActions || isHovered ? "opacity-100" : "opacity-0"}`}
        >
          <button
            onClick={() => onRun(flow)}
            className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
            title="Run workflow"
          >
            <Play size={12} weight="fill" />
          </button>
          <button
            onClick={() => onEdit(flow)}
            className="p-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
            title="Edit workflow"
          >
            <Gear size={12} />
          </button>
          <button
            onClick={() => onCompare && onCompare(flow)}
            className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            title="Compare workflow"
          >
            <ChartBar size={12} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="More actions"
            >
              <DotsThree size={12} />
            </button>
            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                <button
                  onClick={() => {
                    onToggle(flow);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  {flow.active ? <EyeSlash size={14} /> : <Eye size={14} />}
                  {flow.active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    onDuplicate(flow);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Copy size={14} />
                  Duplicate
                </button>
                <button
                  onClick={() => {
                    onFavorite(flow.uuid);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  {flow.favorite ? (
                    <Star size={14} className="text-yellow-500" />
                  ) : (
                    <Star size={14} />
                  )}
                  {flow.favorite ? "Unfavorite" : "Favorite"}
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    onDelete(flow);
                    setShowActions(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                >
                  <Trash size={14} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Bulk Actions Component
function BulkActions({
  selectedCount,
  onBulkDelete,
  onBulkToggle,
  onBulkExport,
  onClearSelection,
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-50">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">
          {selectedCount} workflow{selectedCount > 1 ? "s" : ""} selected
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onBulkToggle}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
          >
            Toggle Status
          </button>
          <button
            onClick={onBulkExport}
            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
          >
            Export
          </button>
          <button
            onClick={onBulkDelete}
            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors"
          >
            Delete
          </button>
          <button
            onClick={onClearSelection}
            className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

// Main NextGenFlowPanel Component
export default function NextGenFlowPanel({
  workspace,
  isVisible,
  sendCommand,
  onAutoOpen,
}) {
  const [flows, setFlows] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [selectedFlows, setSelectedFlows] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive', 'building', 'error'
  const [filterComplexity, setFilterComplexity] = useState("all"); // 'all', 'simple', 'medium', 'complex', 'advanced'
  const [sortBy, setSortBy] = useState("name"); // 'name', 'created', 'modified', 'status', 'usage', 'tokens', 'success', 'complexity'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc', 'desc'
  const [viewMode, setViewMode] = useState("list"); // 'list', 'grid'
  const [showFilters, setShowFilters] = useState(false);
  const [previousFlowCount, setPreviousFlowCount] = useState(0);
  const [hasNewFlows, setHasNewFlows] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);

  const searchInputRef = useRef(null);

  // Load flows
  const loadFlows = useCallback(
    async (showLoadingIndicator = true) => {
      if (showLoadingIndicator) setIsLoading(true);

      try {
        const {
          success,
          flows: flowList,
          error,
        } = await AgentFlows.listFlows();
        if (success) {
          const newFlows = flowList || [];

          // Check for new flows
          if (previousFlowCount > 0 && newFlows.length > previousFlowCount) {
            setHasNewFlows(true);
            showToast(
              `${newFlows.length - previousFlowCount} new workflow(s) created!`,
              "success"
            );

            // Auto-expand if collapsed and new flows detected
            if (!isExpanded) {
              setIsExpanded(true);
            }
          }

          setFlows(newFlows);
          setPreviousFlowCount(newFlows.length);
        } else {
          console.error("Failed to load flows:", error);
          if (showLoadingIndicator) showToast("Failed to load flows", "error");
        }
      } catch (error) {
        console.error("Error loading flows:", error);
        if (showLoadingIndicator) showToast("Error loading flows", "error");
      } finally {
        if (showLoadingIndicator) setIsLoading(false);
      }
    },
    [previousFlowCount, isExpanded]
  );

  // Auto-refresh flows
  useEffect(() => {
    if (workspace?.slug && isVisible) {
      loadFlows();
    }
  }, [workspace?.slug, isVisible, loadFlows]);

  useEffect(() => {
    if (!isVisible) return;

    const refreshInterval = isCreatingWorkflow ? 1000 : 3000;

    const interval = setInterval(() => {
      loadFlows(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isVisible, isCreatingWorkflow, loadFlows]);

  // Enhanced filtering and sorting with metadata
  const filteredAndSortedFlows = useMemo(() => {
    let filtered = flows.filter((flow) => {
      const matchesSearch =
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (flow.description &&
          flow.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatusFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && flow.active) ||
        (filterStatus === "inactive" && !flow.active) ||
        (filterStatus === "building" && flow.status === "building") ||
        (filterStatus === "error" && flow.status === "error");

      // Complexity filter
      const getComplexityLevel = (stepCount) => {
        if (!stepCount) return "simple";
        if (stepCount <= 5) return "simple";
        if (stepCount <= 15) return "medium";
        if (stepCount <= 50) return "complex";
        return "advanced";
      };

      const matchesComplexityFilter =
        filterComplexity === "all" ||
        getComplexityLevel(flow.stepCount) === filterComplexity;

      return matchesSearch && matchesStatusFilter && matchesComplexityFilter;
    });

    // Enhanced sorting with metadata
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "created":
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case "modified":
          aValue = new Date(a.modifiedAt || 0);
          bValue = new Date(b.modifiedAt || 0);
          break;
        case "status":
          aValue = a.active ? 1 : 0;
          bValue = b.active ? 1 : 0;
          break;
        case "usage":
          aValue = a.totalExecutions || 0;
          bValue = b.totalExecutions || 0;
          break;
        case "tokens":
          aValue = a.totalTokensUsed || 0;
          bValue = b.totalTokensUsed || 0;
          break;
        case "success":
          aValue = a.successRate || 0;
          bValue = b.successRate || 0;
          break;
        case "complexity":
          aValue = a.stepCount || 0;
          bValue = b.stepCount || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [flows, searchQuery, filterStatus, filterComplexity, sortBy, sortOrder]);

  // Event handlers
  const handleNewFlow = () => {
    setSelectedFlow(null);
    setShowBuilder(true);
  };

  const handleShowTemplates = () => {
    setShowTemplates(true);
  };

  const handleShowAnalytics = () => {
    setShowAnalytics(true);
  };

  const handleTemplateSelect = (workflowConfig) => {
    setShowTemplates(false);
    setSelectedFlow({
      workflowData: {
        agentFlowConfig: workflowConfig,
      },
    });
    setShowBuilder(true);
  };

  const handleEditFlow = async (flow) => {
    try {
      const {
        success,
        flow: fullFlow,
        error,
      } = await AgentFlows.getFlow(flow.uuid);
      if (success) {
        setSelectedFlow({
          workflowData: {
            agentFlowConfig: fullFlow,
          },
        });
        setShowBuilder(true);
      } else {
        showToast(`Failed to load flow: ${error}`, "error");
      }
    } catch (error) {
      console.error("Error loading flow:", error);
      showToast("Error loading flow", "error");
    }
  };

  const handleRunFlow = async (flow) => {
    if (!sendCommand) {
      showToast(
        "Chat connection not available. Please ensure you're connected to the workspace.",
        "error"
      );
      return;
    }

    if (!flow.active) {
      showToast(
        `"${flow.name}" is currently inactive. Please activate it first before running.`,
        "warning"
      );
      return;
    }

    try {
      const command = `@agent Execute the "${flow.name}" workflow`;
      await sendCommand({ text: command, autoSubmit: true });
      showToast(`"${flow.name}" workflow is now running...`, "info");
    } catch (error) {
      console.error("Error running flow:", error);
      showToast(
        `Failed to run "${flow.name}". Please check your connection and try again.`,
        "error"
      );
    }
  };

  const handleToggleFlow = async (flow) => {
    try {
      const { success, error } = await AgentFlows.toggleFlow(
        flow.uuid,
        !flow.active
      );
      if (success) {
        await loadFlows();
        showToast(
          `"${flow.name}" has been ${flow.active ? "deactivated" : "activated"}`,
          "success"
        );
      } else {
        showToast(
          `Failed to ${flow.active ? "deactivate" : "activate"} "${flow.name}": ${error || "Unknown error occurred"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error toggling flow:", error);
      showToast(
        `Network error: Unable to ${flow.active ? "deactivate" : "activate"} "${flow.name}". Please check your connection and try again.`,
        "error"
      );
    }
  };

  const handleDeleteFlow = async (flow) => {
    if (!confirm(`Delete "${flow.name}"? This cannot be undone.`)) return;

    try {
      const { success, error } = await AgentFlows.deleteFlow(flow.uuid);
      if (success) {
        await loadFlows();
        showToast(`"${flow.name}" has been deleted successfully`, "success");
      } else {
        showToast(
          `Failed to delete "${flow.name}": ${error || "Unknown error occurred"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting flow:", error);
      showToast(
        `Network error: Unable to delete "${flow.name}". Please check your connection and try again.`,
        "error"
      );
    }
  };

  const handleDuplicateFlow = async (flow) => {
    try {
      const {
        success,
        flow: fullFlow,
        error,
      } = await AgentFlows.getFlow(flow.uuid);
      if (success) {
        const duplicatedFlow = {
          ...fullFlow,
          name: `${fullFlow.name} (Copy)`,
          active: false,
        };
        const { success: saveSuccess, error: saveError } =
          await AgentFlows.saveFlow(duplicatedFlow.name, duplicatedFlow.config);
        if (saveSuccess) {
          await loadFlows();
          showToast("Workflow duplicated", "success");
        } else {
          showToast(`Failed to duplicate workflow: ${saveError}`, "error");
        }
      } else {
        showToast(`Failed to load workflow: ${error}`, "error");
      }
    } catch (error) {
      console.error("Error duplicating workflow:", error);
      showToast("Error duplicating workflow", "error");
    }
  };

  const handleFavoriteFlow = async (uuid) => {
    // This would need to be implemented in the backend
    showToast("Favorite functionality coming soon", "info");
  };

  const handleCompareFlow = (flow) => {
    // Add to comparison or open comparison view
    showToast(`Comparing "${flow.name}" workflow`, "info");
    // This would open a comparison modal or add to comparison list
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (
      !confirm(
        `Delete ${selectedFlows.size} workflow(s)? This cannot be undone.`
      )
    )
      return;

    const deletePromises = Array.from(selectedFlows).map((uuid) =>
      AgentFlows.deleteFlow(uuid)
    );
    try {
      await Promise.all(deletePromises);
      await loadFlows();
      setSelectedFlows(new Set());
      showToast(`${selectedFlows.size} workflow(s) deleted`, "success");
    } catch (error) {
      console.error("Error bulk deleting workflows:", error);
      showToast("Error deleting workflows", "error");
    }
  };

  const handleBulkToggle = async () => {
    // Implementation for bulk toggle
    showToast("Bulk toggle functionality coming soon", "info");
  };

  const handleBulkExport = async () => {
    // Implementation for bulk export
    showToast("Bulk export functionality coming soon", "info");
  };

  const handleClearSelection = () => {
    setSelectedFlows(new Set());
  };

  const handleSelectFlow = (uuid, selected) => {
    const newSelected = new Set(selectedFlows);
    if (selected) {
      newSelected.add(uuid);
    } else {
      newSelected.delete(uuid);
    }
    setSelectedFlows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFlows.size === filteredAndSortedFlows.length) {
      setSelectedFlows(new Set());
    } else {
      setSelectedFlows(
        new Set(filteredAndSortedFlows.map((flow) => flow.uuid))
      );
    }
  };

  if (showBuilder) {
    return (
      <WorkflowBuilder
        workspace={workspace}
        noteData={selectedFlow}
        onClose={() => {
          setShowBuilder(false);
          setSelectedFlow(null);
          loadFlows();
        }}
      />
    );
  }

  if (showTemplates) {
    return (
      <WorkflowTemplates
        onClose={() => setShowTemplates(false)}
        onTemplateSelect={handleTemplateSelect}
      />
    );
  }

  if (showAnalytics) {
    return <WorkflowAnalytics onClose={() => setShowAnalytics(false)} />;
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50/30 via-white/95 to-purple-50/20">
      {/* Modern Header */}
      <div
        className="relative flex items-center justify-between p-5 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-transparent transition-all duration-300 border-b border-gray-200/30 backdrop-blur-xl group"
        onClick={() => {
          setIsExpanded(!isExpanded);
          setHasNewFlows(false);
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" />
        <div className="relative flex items-center gap-4 flex-1">
          <div className="relative">
            <div className="p-3 bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-2xl shadow-lg group-hover:shadow-xl transition-all">
              <FlowArrow size={20} className="text-white" />
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {isCreatingWorkflow && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white animate-bounce">
                <div className="w-full h-full bg-amber-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span
                  className={`w-1 h-1 rounded-full ${
                    hasNewFlows
                      ? "bg-green-500"
                      : isCreatingWorkflow
                        ? "bg-amber-500 animate-pulse"
                        : "bg-gray-400"
                  }`}
                />
                {flows.length}
              </span>

              {isCreatingWorkflow && (
                <span className="text-amber-600">building...</span>
              )}
            </div>
          </div>
        </div>
        <div className="relative flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadFlows();
            }}
            className="p-2.5 hover:bg-white/80 hover:shadow-sm rounded-xl transition-all group relative"
            title="Refresh workflows"
            disabled={isLoading}
          >
            <ArrowsClockwise
              size={18}
              className={`text-gray-600 group-hover:text-purple-600 transition-all ${isLoading ? "animate-spin" : "group-hover:rotate-180"} duration-300`}
            />
            <div className="absolute inset-0 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShowAnalytics();
            }}
            className="p-1.5 hover:bg-green-100 text-green-600 hover:text-green-700 rounded-lg transition-colors group"
            title="View analytics"
          >
            <ChartBar
              size={16}
              className="group-hover:scale-110 transition-transform duration-200"
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShowTemplates();
            }}
            className="p-1.5 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg transition-colors group"
            title="Browse templates"
          >
            <Sparkle
              size={16}
              className="group-hover:rotate-12 transition-transform duration-200"
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewFlow();
            }}
            className="p-1.5 hover:bg-purple-100 text-purple-600 hover:text-purple-700 rounded-lg transition-colors group"
            title="Create new flow"
          >
            <Plus
              size={16}
              className="group-hover:rotate-90 transition-transform duration-200"
            />
          </button>

          <div className="p-2">
            <div
              className={`transition-all duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}
            >
              <CaretDown
                size={18}
                className="text-gray-500 group-hover:text-purple-600 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search and Filter Bar */}
          <div className="p-4 border-b border-gray-200/30 bg-white/50">
            <div className="flex items-center gap-3 mb-3">
              {/* Search */}
              <div className="relative flex-1">
                <MagnifyingGlass
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search workflows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Filter button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Filters"
              >
                <FunnelSimple size={16} />
              </button>

              {/* View mode toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-white shadow-sm text-purple-600"
                      : "text-gray-600"
                  }`}
                  title="List view"
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-white shadow-sm text-purple-600"
                      : "text-gray-600"
                  }`}
                  title="Grid view"
                >
                  <GridFour size={14} />
                </button>
              </div>
            </div>

            {/* Enhanced Filters */}
            {showFilters && (
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-gray-600 font-medium">Status:</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="building">Building</option>
                      <option value="error">Error</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-gray-600 font-medium">
                      Complexity:
                    </label>
                    <select
                      value={filterComplexity}
                      onChange={(e) => setFilterComplexity(e.target.value)}
                      className="px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All</option>
                      <option value="simple">Simple (≤5 steps)</option>
                      <option value="medium">Medium (6-15 steps)</option>
                      <option value="complex">Complex (16-50 steps)</option>
                      <option value="advanced">Advanced (50+ steps)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-gray-600 font-medium">
                      Sort by:
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-3 py-1 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="name">Name</option>
                      <option value="created">Created</option>
                      <option value="modified">Modified</option>
                      <option value="status">Status</option>
                      <option value="usage">Usage Count</option>
                      <option value="tokens">Token Usage</option>
                      <option value="success">Success Rate</option>
                      <option value="complexity">Complexity</option>
                    </select>
                  </div>

                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                  >
                    {sortOrder === "asc" ? (
                      <SortAscending size={14} />
                    ) : (
                      <SortDescending size={14} />
                    )}
                  </button>
                </div>

                {/* Quick filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">
                    Quick filters:
                  </span>
                  <button
                    onClick={() => {
                      setFilterStatus("active");
                      setFilterComplexity("all");
                    }}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterComplexity("simple");
                    }}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                  >
                    Simple Workflows
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("usage");
                      setSortOrder("desc");
                    }}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                  >
                    Most Used
                  </button>
                  <button
                    onClick={() => {
                      setFilterStatus("all");
                      setFilterComplexity("all");
                      setSortBy("name");
                      setSortOrder("asc");
                    }}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Workflows List/Grid */}
          {isLoading ? (
            <div className="p-4 text-center text-theme-text-secondary">
              Loading flows...
            </div>
          ) : filteredAndSortedFlows.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-100/50 to-purple-200/30 rounded-full animate-pulse" />
                    <div
                      className="absolute w-24 h-24 bg-gradient-to-br from-purple-200/30 to-purple-300/20 rounded-full animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    />
                  </div>

                  <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl">
                    <FlowArrow size={36} className="text-white" />
                    <div className="absolute inset-0 rounded-3xl bg-white/20 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent">
                    {searchQuery ? "No workflows found" : "Ready to Automate?"}
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium">
                      {searchQuery
                        ? "Try adjusting your search or filters"
                        : "Create intelligent AI workflows"}
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {searchQuery
                        ? "No workflows match your current search criteria."
                        : "Connect tools, automate repetitive tasks, and let AI handle the complex logic for you."}
                    </p>
                  </div>
                </div>

                {!searchQuery && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleShowTemplates}
                        className="px-6 py-4 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <div className="relative flex items-center justify-center gap-3">
                          <Sparkle
                            size={20}
                            weight="bold"
                            className="group-hover:rotate-12 transition-transform duration-300"
                          />
                          <span className="text-base">Browse Templates</span>
                        </div>
                      </button>

                      <button
                        onClick={handleNewFlow}
                        className="px-6 py-4 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <div className="relative flex items-center justify-center gap-3">
                          <Plus
                            size={20}
                            weight="bold"
                            className="group-hover:rotate-180 transition-transform duration-300"
                          />
                          <span className="text-base">Create Custom</span>
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span>Templates</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full" />
                        <span>Drag & Drop</span>
                      </div>
                      <div className="w-1 h-1 bg-gray-300 rounded-full" />
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full" />
                        <span>AI Powered</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Select All */}
              {filteredAndSortedFlows.length > 0 && (
                <div className="p-3 border-b border-gray-200/30 bg-white/30">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedFlows.size === filteredAndSortedFlows.length
                      }
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-600">
                      Select all ({filteredAndSortedFlows.length} workflow
                      {filteredAndSortedFlows.length > 1 ? "s" : ""})
                    </span>
                  </div>
                </div>
              )}

              {/* Workflows */}
              <div
                className={`p-3 ${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}`}
              >
                {filteredAndSortedFlows.map((flow) => (
                  <WorkflowItem
                    key={flow.uuid}
                    flow={flow}
                    isSelected={selectedFlows.has(flow.uuid)}
                    onSelect={handleSelectFlow}
                    onEdit={handleEditFlow}
                    onRun={handleRunFlow}
                    onToggle={handleToggleFlow}
                    onDelete={handleDeleteFlow}
                    onDuplicate={handleDuplicateFlow}
                    onFavorite={handleFavoriteFlow}
                    onCompare={handleCompareFlow}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedFlows.size}
        onBulkDelete={handleBulkDelete}
        onBulkToggle={handleBulkToggle}
        onBulkExport={handleBulkExport}
        onClearSelection={handleClearSelection}
      />
    </div>
  );
}
