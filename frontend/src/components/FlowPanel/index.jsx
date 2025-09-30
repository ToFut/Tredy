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
  Wrench,
  CalendarBlank,
  Timer,
  Target,
  DotsThree,
  MagnifyingGlass,
  FunnelSimple,
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
  Star,
  Eye,
  EyeSlash,
  Copy,
  Trash,
} from "@phosphor-icons/react";
import WorkflowBuilder from "./WorkflowBuilder";
import AgentFlows from "@/models/agentFlows";
import AgentSchedule from "@/models/agentSchedule";
import ScheduleModal from "@/components/AgentScheduling/ScheduleModal";
import showToast from "@/utils/toast";

// Workflow Block Component
function WorkflowBlock({ block, isActive }) {
  const getBlockStatusColor = () => {
    switch (block.status) {
      case 'complete': return 'bg-green-500';
      case 'running': return 'bg-blue-500 animate-pulse';
      case 'error': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="relative group">
      <div className={`
        w-12 h-12 rounded-lg flex items-center justify-center
        transition-all duration-200
        ${isActive ? 'scale-110 shadow-lg' : ''}
        ${block.status === 'complete' ? 'bg-green-50' : ''}
        ${block.status === 'running' ? 'bg-blue-50' : ''}
        ${block.status === 'error' ? 'bg-red-50' : ''}
        ${block.status === 'pending' ? 'bg-gray-50' : ''}
        border-2 ${isActive ? 'border-blue-500' : 'border-gray-200'}
        hover:scale-105 cursor-pointer
      `}>
        <span className="text-lg">{block.icon || '📦'}</span>
      </div>

      {/* Status indicator */}
      <div className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full ${getBlockStatusColor()}`} />

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
          {block.name}
          {block.status === 'running' && ` (${block.progress || 0}%)`}
        </div>
      </div>
    </div>
  );
}

// Enhanced Workflow Item Component with comprehensive metadata
function WorkflowItem({
  flow,
  isSelected,
  onSelect,
  onEdit,
  onRun,
  onSchedule,
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [blocks, setBlocks] = useState([]);

  // Load workflow statistics and blocks
  useEffect(() => {
    if (flow.uuid) {
      loadWorkflowStats();
      loadWorkflowBlocks();
    }
  }, [flow.uuid]);

  const loadWorkflowBlocks = async () => {
    // Parse workflow config to extract blocks
    if (flow.config && flow.config.steps) {
      const workflowBlocks = flow.config.steps.map((step, index) => ({
        id: step.id || `step-${index}`,
        name: step.name || step.tool || 'Step',
        icon: getStepIcon(step.tool || step.type),
        status: getStepStatus(flow, index),
        progress: getStepProgress(flow, index),
        type: step.tool || step.type,
        data: step
      }));
      setBlocks(workflowBlocks);
    } else {
      // Default blocks for workflows without detailed config
      setBlocks([
        { id: 'trigger', name: 'Trigger', icon: '⚡', status: 'complete' },
        { id: 'process', name: 'Process', icon: '🔄', status: flow.active ? 'running' : 'pending' },
        { id: 'output', name: 'Output', icon: '📤', status: 'pending' }
      ]);
    }
  };

  const getStepIcon = (type) => {
    const iconMap = {
      'web-scraping': '🌐',
      'database-query': '🗄️',
      'api-call': '🔌',
      'data-transform': '✨',
      'email-send': '📧',
      'file-process': '📄',
      'ai-analysis': '🤖',
      'condition': '🔀',
      'loop': '🔁',
      'wait': '⏰',
      'trigger': '⚡',
      'output': '📤'
    };
    return iconMap[type] || '📦';
  };

  const getStepStatus = (flow, stepIndex) => {
    if (!flow.active) return 'pending';
    if (flow.status === 'error') return stepIndex === 0 ? 'error' : 'pending';
    if (flow.status === 'building') return stepIndex <= 1 ? 'running' : 'pending';
    if (flow.status === 'success') return 'complete';
    return 'pending';
  };

  const getStepProgress = (flow, stepIndex) => {
    if (flow.status === 'building' && stepIndex === 0) return 75;
    if (flow.status === 'running') return Math.min(100, (stepIndex + 1) * 33);
    return 0;
  };

  const loadWorkflowStats = async () => {
    // Stats loading disabled for now - requires workspace context
    // setLoadingStats(true);
    // try {
    //   const response = await fetch(`/api/workspace/${workspace?.slug}/agent-schedules/stats`);
    //   if (response.ok) {
    //     const data = await response.json();
    //     setStats(data);
    //   }
    // } catch (error) {
    //   console.error("Failed to load workflow stats:", error);
    // } finally {
    //   setLoadingStats(false);
    // }
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
  const currentBlockIndex = blocks.findIndex(b => b.status === 'running');

  const formatLastUsed = (dateString) => {
    if (!dateString) return "Never used";
    const date = new Date(dateString);
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

  // Compact workflow card
  return (
    <div
      className={`group relative transition-all duration-200 border rounded-lg hover:shadow-sm ${getStatusColor()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compact header row */}
      <div className="flex items-center gap-3 p-2.5" onClick={() => setIsExpanded(!isExpanded)}>
        {/* Expand indicator */}
        <CaretDown
          size={12}
          className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
        />

        {/* Status icon */}
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>

        {/* Compact flow info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">{flow.name}</h3>
            {/* Key metrics inline */}
            <div className="flex items-center gap-3 ml-auto text-xs text-gray-500">
              {blocks.length > 0 && (
                <span>{blocks.filter(b => b.status === 'complete').length}/{blocks.length}</span>
              )}
              {stats?.successRate && (
                <span>{Math.round(stats.successRate)}%</span>
              )}
              {flow.status === "running" && (
                <span className="text-blue-600">Running</span>
              )}
            </div>
          </div>

          {/* Mini block visualization - only show when not expanded */}
          {!isExpanded && blocks.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {blocks.slice(0, 6).map((block, idx) => (
                <div
                  key={block.id}
                  className={`w-1.5 h-1.5 rounded-full ${
                    block.status === 'complete' ? 'bg-green-400' :
                    block.status === 'running' ? 'bg-blue-400 animate-pulse' :
                    block.status === 'error' ? 'bg-red-400' :
                    'bg-gray-300'
                  }`}
                  title={block.name}
                />
              ))}
              {blocks.length > 6 && (
                <span className="text-xs text-gray-400">+{blocks.length - 6}</span>
              )}
            </div>
          )}
        </div>

        {/* Compact actions */}
        <div
          className={`flex items-center gap-1 transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onRun(flow)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Run"
          >
            <Play size={12} className="text-gray-600" weight="fill" />
          </button>
          <button
            onClick={() => onSchedule?.(flow)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Schedule"
          >
            <Clock size={12} className="text-gray-600" />
          </button>
          <button
            onClick={() => onEdit(flow)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Edit"
          >
            <Gear size={12} className="text-gray-600" />
          </button>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="More"
          >
            <DotsThree size={12} className="text-gray-600" />
          </button>
        </div>

        {/* Dropdown menu */}
        {showActions && (
          <div className="absolute right-2 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
            <button
              onClick={() => {
                onToggle(flow);
                setShowActions(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              {flow.active ? "Deactivate" : "Activate"}
            </button>
            <button
              onClick={() => {
                onSchedule?.(flow);
                setShowActions(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <Clock size={12} className="text-gray-600" />
              Schedule
            </button>
            <button
              onClick={() => {
                onDuplicate(flow);
                setShowActions(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              Duplicate
            </button>
            <hr className="my-0.5" />
            <button
              onClick={() => {
                onDelete(flow);
                setShowActions(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-600"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Expandable blocks section */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
          {/* Workflow blocks visualization */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">Workflow Blocks</span>
              <span className="text-xs text-gray-500">
                {blocks.filter(b => b.status === 'complete').length}/{blocks.length} completed
              </span>
            </div>

            {/* Blocks row with connections */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {blocks.map((block, index) => (
                <React.Fragment key={block.id}>
                  <WorkflowBlock
                    block={block}
                    isActive={index === currentBlockIndex}
                  />
                  {index < blocks.length - 1 && (
                    <div className="flex-shrink-0 w-8 h-0.5 bg-gray-300 relative">
                      <div
                        className="absolute inset-0 bg-blue-500 transition-all duration-500"
                        style={{
                          width: block.status === 'complete' ? '100%' : '0%'
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Current block details */}
            {currentBlockIndex >= 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">
                    Current: {blocks[currentBlockIndex].name}
                  </span>
                  <span className="text-xs text-blue-700">
                    {blocks[currentBlockIndex].progress}% complete
                  </span>
                </div>
                {stats && (
                  <div className="grid grid-cols-3 gap-2 text-xs text-blue-700">
                    <div>Processing: {stats.currentItem || 'N/A'}</div>
                    <div>Time: {formatDuration(stats.elapsedTime || 0)}</div>
                    <div>ETA: {formatDuration(stats.estimatedTime || 0)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onEdit(flow)}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                View Details →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FlowPanel({
  workspace,
  isVisible,
  sendCommand,
  onAutoOpen,
}) {
  const [flows, setFlows] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [previousFlowCount, setPreviousFlowCount] = useState(0);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'active', 'inactive', 'building', 'error'
  const [sortBy, setSortBy] = useState("name"); // 'name', 'created', 'modified', 'status', 'usage', 'tokens', 'success', 'complexity'
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc', 'desc'
  const [showFilters, setShowFilters] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [flowToSchedule, setFlowToSchedule] = useState(null);

  const searchInputRef = useRef(null);

  useEffect(() => {
    if (workspace?.slug && isVisible) {
      loadFlows();
    }
  }, [workspace?.slug, isVisible]);

  // Auto-refresh flows every 2 seconds when visible (faster during workflow creation)
  useEffect(() => {
    if (!isVisible) return;

    // Refresh more frequently when creating workflows
    const refreshInterval = isCreatingWorkflow ? 1000 : 3000;

    const interval = setInterval(() => {
      loadFlows(false); // Silent refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isVisible, isCreatingWorkflow]);

  // Check if any flows are being built or need to auto-open
  useEffect(() => {
    const buildingFlow = flows.find((f) => f.status === "building");
    const shouldAutoOpen = flows.find((f) => f.openFlowPanel === true);
    const shouldOpenBuilder = flows.find((f) => f.openWorkflowBuilder === true);

    setIsCreatingWorkflow(!!buildingFlow);

    if (buildingFlow) {
      setIsExpanded(true); // Auto-expand when building

      // Auto-open panel if a workflow is being built
      if (!isVisible && onAutoOpen) {
        console.log(
          "[FlowPanel] Auto-opening for building workflow:",
          buildingFlow.name
        );
        onAutoOpen();
      }
    }

    // Trigger auto-open if a flow has the openFlowPanel flag
    if (shouldAutoOpen) {
      console.log(
        "[FlowPanel] Flow requesting auto-open:",
        shouldAutoOpen.name
      );

      // Always expand if we have this flag
      setIsExpanded(true);

      // Open panel if not visible
      if (!isVisible && onAutoOpen) {
        console.log(
          "[FlowPanel] Opening panel for workflow:",
          shouldAutoOpen.name
        );
        onAutoOpen();
      }

      // Clear the flag after a delay
      setTimeout(() => {
        const updatedFlow = { ...shouldAutoOpen };
        delete updatedFlow.openFlowPanel;
        AgentFlows.saveFlow(
          updatedFlow.name,
          updatedFlow,
          updatedFlow.workflowUuid
        ).catch(console.error);
      }, 2000);
    }

    // Open WorkflowBuilder if flag is set
    if (shouldOpenBuilder) {
      console.log(
        "[FlowPanel] Opening WorkflowBuilder for:",
        shouldOpenBuilder.name
      );

      // Set the flow data for the builder
      setSelectedFlow({
        workflowData: {
          agentFlowConfig: shouldOpenBuilder,
        },
      });
      setShowBuilder(true);

      // Clear the flag after opening
      setTimeout(() => {
        const updatedFlow = { ...shouldOpenBuilder };
        delete updatedFlow.openWorkflowBuilder;
        AgentFlows.saveFlow(
          updatedFlow.name,
          updatedFlow,
          updatedFlow.workflowUuid
        ).catch(console.error);
      }, 1000);
    }
  }, [flows, isVisible, onAutoOpen]);

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

  // Simple filtering and sorting
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

      return matchesSearch && matchesStatusFilter;
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
  }, [flows, searchQuery, filterStatus, sortBy, sortOrder]);

  const handleNewFlow = () => {
    setSelectedFlow(null);
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
      showToast("Chat connection not available", "error");
      return;
    }

    try {
      const command = `@agent Execute the "${flow.name}" workflow`;
      await sendCommand({ text: command, autoSubmit: true });
      showToast(`Running "${flow.name}" workflow`, "info");
    } catch (error) {
      console.error("Error running flow:", error);
      showToast("Error running flow", "error");
    }
  };

  const handleToggleFlow = async (flow) => {
    try {
      const { success, error } = await AgentFlows.toggleFlow(
        flow.uuid,
        !flow.active
      );
      if (success) {
        await loadFlows(); // Reload to get updated status
        showToast(
          `Flow ${flow.active ? "deactivated" : "activated"}`,
          "success"
        );
      } else {
        showToast(`Failed to toggle flow: ${error}`, "error");
      }
    } catch (error) {
      console.error("Error toggling flow:", error);
      showToast("Error toggling flow", "error");
    }
  };

  const handleDeleteFlow = async (flow) => {
    if (!confirm(`Delete "${flow.name}"? This cannot be undone.`)) return;

    try {
      const { success, error } = await AgentFlows.deleteFlow(flow.uuid);
      if (success) {
        await loadFlows();
        showToast("Flow deleted", "success");
      } else {
        showToast(`Failed to delete flow: ${error}`, "error");
      }
    } catch (error) {
      console.error("Error deleting flow:", error);
      showToast("Error deleting flow", "error");
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

  const handleScheduleFlow = (flow) => {
    if (!workspace?.slug) {
      showToast("Workspace not available", "error");
      return;
    }
    setFlowToSchedule(flow);
    setShowScheduleModal(true);
  };





  if (showBuilder) {
    return (
      <WorkflowBuilder
        workspace={workspace}
        noteData={selectedFlow}
        onClose={() => {
          setShowBuilder(false);
          setSelectedFlow(null);
          loadFlows(); // Refresh flows when closing builder
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Compact Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Workflows</span>
          {flows.length > 0 && (
            <span className="text-xs text-gray-500">({flows.length})</span>
          )}
          {isCreatingWorkflow && (
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewFlow();
            }}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="New workflow"
          >
            <Plus size={14} className="text-gray-600" />
          </button>

          <CaretDown
            size={14}
            className={`text-gray-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Compact Search Bar */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <MagnifyingGlass size={12} className="text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm outline-none placeholder-gray-400"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1 rounded transition-colors ${
                  showFilters ? "bg-gray-200" : "hover:bg-gray-100"
                }`}
                title="Filters"
              >
                <FunnelSimple size={12} className="text-gray-500" />
              </button>
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
                    onClick={() => setFilterStatus("active")}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setFilterStatus("all")}
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

          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading flows...
              </div>
            ) : filteredAndSortedFlows.length === 0 ? (
              <div className="flex items-center justify-center h-full p-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">No workflows found</p>
                  <button
                    onClick={handleNewFlow}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Create workflow
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredAndSortedFlows.map((flow) => (
                  <WorkflowItem
                    key={flow.uuid}
                    flow={flow}
                    onEdit={handleEditFlow}
                    onRun={handleRunFlow}
                    onSchedule={handleScheduleFlow}
                    onToggle={handleToggleFlow}
                    onDelete={handleDeleteFlow}
                    onDuplicate={handleDuplicateFlow}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Help */}
      {isExpanded && (flows.length > 0 || isCreatingWorkflow) && (
        <div className="p-3 border-t border-white/10 bg-theme-bg-primary/30">
          {isCreatingWorkflow ? (
            <div className="text-xs text-yellow-400 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span>Workflow is being created...</span>
              </div>
              <div className="text-theme-text-secondary">
                Refreshing every second to show new blocks
              </div>
            </div>
          ) : (
            <div className="text-xs text-theme-text-secondary space-y-1">
              <div className="flex items-center gap-2">
                <Gear size={12} />
                <span>Edit workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <Play size={12} />
                <span>Run immediately</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <span>Schedule workflow</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && flowToSchedule && workspace && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false);
            setFlowToSchedule(null);
          }}
          onSave={() => {
            setShowScheduleModal(false);
            setFlowToSchedule(null);
            showToast("Schedule created successfully!", "success");
          }}
          workspace={workspace}
          agent={{
            id: flowToSchedule.uuid,
            name: flowToSchedule.name,
            type: "flow",
          }}
        />
      )}
    </div>
  );
}
