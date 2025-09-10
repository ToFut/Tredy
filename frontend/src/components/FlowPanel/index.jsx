import React, { useState, useEffect } from "react";
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
  ArrowsClockwise
} from "@phosphor-icons/react";
import WorkflowBuilder from "./WorkflowBuilder";
import AgentFlows from "@/models/agentFlows";
import showToast from "@/utils/toast";

export default function FlowPanel({ workspace, isVisible, sendCommand, onAutoOpen }) {
  const [flows, setFlows] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [previousFlowCount, setPreviousFlowCount] = useState(0);
  const [hasNewFlows, setHasNewFlows] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);

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
    const buildingFlow = flows.find(f => f.status === 'building');
    const shouldAutoOpen = flows.find(f => f.openFlowPanel === true);
    const shouldOpenBuilder = flows.find(f => f.openWorkflowBuilder === true);
    
    setIsCreatingWorkflow(!!buildingFlow);
    
    if (buildingFlow) {
      setIsExpanded(true); // Auto-expand when building
      
      // Auto-open panel if a workflow is being built
      if (!isVisible && onAutoOpen) {
        console.log('[FlowPanel] Auto-opening for building workflow:', buildingFlow.name);
        onAutoOpen();
      }
    }
    
    // Trigger auto-open if a flow has the openFlowPanel flag
    if (shouldAutoOpen) {
      console.log('[FlowPanel] Flow requesting auto-open:', shouldAutoOpen.name);
      
      // Always expand if we have this flag
      setIsExpanded(true);
      
      // Open panel if not visible
      if (!isVisible && onAutoOpen) {
        console.log('[FlowPanel] Opening panel for workflow:', shouldAutoOpen.name);
        onAutoOpen();
      }
      
      // Clear the flag after a delay
      setTimeout(() => {
        const updatedFlow = { ...shouldAutoOpen };
        delete updatedFlow.openFlowPanel;
        AgentFlows.saveFlow(updatedFlow.name, updatedFlow, updatedFlow.workflowUuid).catch(console.error);
      }, 2000);
    }
    
    // Open WorkflowBuilder if flag is set
    if (shouldOpenBuilder) {
      console.log('[FlowPanel] Opening WorkflowBuilder for:', shouldOpenBuilder.name);
      
      // Set the flow data for the builder
      setSelectedFlow({
        workflowData: {
          agentFlowConfig: shouldOpenBuilder
        }
      });
      setShowBuilder(true);
      
      // Clear the flag after opening
      setTimeout(() => {
        const updatedFlow = { ...shouldOpenBuilder };
        delete updatedFlow.openWorkflowBuilder;
        AgentFlows.saveFlow(updatedFlow.name, updatedFlow, updatedFlow.workflowUuid).catch(console.error);
      }, 1000);
    }
  }, [flows, isVisible, onAutoOpen]);

  const loadFlows = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setIsLoading(true);
    
    try {
      const { success, flows: flowList, error } = await AgentFlows.listFlows();
      if (success) {
        const newFlows = flowList || [];
        
        // Check for new flows
        if (previousFlowCount > 0 && newFlows.length > previousFlowCount) {
          setHasNewFlows(true);
          showToast(`${newFlows.length - previousFlowCount} new workflow(s) created!`, "success");
          
          // Auto-expand if collapsed and new flows detected
          if (!isExpanded) {
            setIsExpanded(true);
          }
        }
        
        setFlows(newFlows);
        setPreviousFlowCount(newFlows.length);
      } else {
        console.error('Failed to load flows:', error);
        if (showLoadingIndicator) showToast("Failed to load flows", "error");
      }
    } catch (error) {
      console.error('Error loading flows:', error);
      if (showLoadingIndicator) showToast("Error loading flows", "error");
    } finally {
      if (showLoadingIndicator) setIsLoading(false);
    }
  };

  const handleNewFlow = () => {
    setSelectedFlow(null);
    setShowBuilder(true);
  };

  const handleEditFlow = async (flow) => {
    try {
      const { success, flow: fullFlow, error } = await AgentFlows.getFlow(flow.uuid);
      if (success) {
        setSelectedFlow({
          workflowData: {
            agentFlowConfig: fullFlow
          }
        });
        setShowBuilder(true);
      } else {
        showToast(`Failed to load flow: ${error}`, "error");
      }
    } catch (error) {
      console.error('Error loading flow:', error);
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
      console.error('Error running flow:', error);
      showToast("Error running flow", "error");
    }
  };

  const handleToggleFlow = async (flow) => {
    try {
      const { success, error } = await AgentFlows.toggleFlow(flow.uuid, !flow.active);
      if (success) {
        await loadFlows(); // Reload to get updated status
        showToast(`Flow ${flow.active ? 'deactivated' : 'activated'}`, "success");
      } else {
        showToast(`Failed to toggle flow: ${error}`, "error");
      }
    } catch (error) {
      console.error('Error toggling flow:', error);
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
      console.error('Error deleting flow:', error);
      showToast("Error deleting flow", "error");
    }
  };

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
    <div className="h-full flex flex-col bg-theme-bg-secondary">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-theme-bg-primary/50 transition-colors border-b border-white/10"
        onClick={() => {
          setIsExpanded(!isExpanded);
          setHasNewFlows(false); // Clear new indicator when user interacts
        }}
      >
        <div className="flex items-center gap-3">
          <FlowArrow size={20} className="text-theme-text-primary" />
          <h2 className="text-lg font-semibold text-theme-text-primary">
            Agent Flows
            {isCreatingWorkflow && (
              <span className="ml-2 text-sm text-yellow-400 animate-pulse">
                🏗️ Creating...
              </span>
            )}
          </h2>
          <span className={`text-xs px-2 py-1 rounded-full transition-all ${
            hasNewFlows 
              ? 'bg-green-500 text-white animate-pulse' 
              : isCreatingWorkflow
              ? 'bg-yellow-500 text-white animate-pulse'
              : 'text-theme-text-secondary bg-theme-bg-primary'
          }`}>
            {flows.length} {hasNewFlows ? '🆕' : isCreatingWorkflow ? '⏳' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              loadFlows();
            }}
            className="p-1.5 hover:bg-theme-bg-primary rounded-lg transition-colors"
            title="Refresh flows"
            disabled={isLoading}
          >
            <ArrowsClockwise 
              size={16} 
              className={`text-theme-text-secondary hover:text-theme-text-primary ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewFlow();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary-button hover:opacity-80 text-black light:text-white rounded-lg text-sm font-medium transition-all"
          >
            <Plus size={16} />
            New
          </button>
          {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-theme-text-secondary">
              Loading flows...
            </div>
          ) : flows.length === 0 ? (
            <div className="p-4 text-center">
              <div className="text-theme-text-secondary mb-4">
                <FlowArrow size={48} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">No agent flows yet</p>
                <p className="text-xs mt-1">Create your first workflow to get started</p>
              </div>
              <button
                onClick={handleNewFlow}
                className="px-4 py-2 bg-primary-button hover:opacity-80 text-black light:text-white rounded-lg text-sm font-medium transition-all"
              >
                Create Flow
              </button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {flows.map((flow) => (
                <FlowItem
                  key={flow.uuid}
                  flow={flow}
                  onEdit={() => handleEditFlow(flow)}
                  onRun={() => handleRunFlow(flow)}
                  onToggle={() => handleToggleFlow(flow)}
                  onDelete={() => handleDeleteFlow(flow)}
                  formatLastUsed={formatLastUsed}
                />
              ))}
            </div>
          )}
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlowItem({ flow, onEdit, onRun, onToggle, onDelete, formatLastUsed }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(flow.status === 'building');
  const isBuilding = flow.status === 'building';
  const buildProgress = flow.buildProgress;
  const visualBlocks = flow.visualBlocks || [];

  return (
    <div className={`group transition-all duration-300 ${
      isBuilding 
        ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-l-4 border-yellow-500 shadow-lg' 
        : 'hover:bg-theme-bg-primary/30'
    }`}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {isBuilding ? (
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            ) : (
              <button
                onClick={onToggle}
                className={`w-3 h-3 rounded-full border-2 transition-all ${
                  flow.active
                    ? 'bg-green-500 border-green-500'
                    : 'bg-transparent border-gray-400 hover:border-gray-300'
                }`}
                title={flow.active ? 'Active' : 'Inactive'}
              />
            )}
            <h3 
              className="font-medium text-theme-text-primary truncate cursor-pointer hover:text-primary-button transition-colors"
              onClick={!isBuilding ? onEdit : undefined}
              title={flow.name}
            >
              {flow.name}
              {isBuilding && (
                <span className="ml-2 text-xs text-yellow-500 animate-pulse">
                  (Building...)
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-theme-text-secondary ml-6">
            {isBuilding && buildProgress ? (
              <>
                <span className="flex items-center gap-1 text-yellow-500">
                  <ArrowsClockwise size={12} className="animate-spin" />
                  {buildProgress.message}
                </span>
                <span className="text-yellow-500">
                  {buildProgress.current}/{buildProgress.total} blocks
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatLastUsed(flow.updatedAt || flow.createdAt)}
                </span>
                {flow.active && (
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle size={12} />
                    Active
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onRun}
            className="p-2 hover:bg-green-500/20 hover:text-green-400 rounded-lg transition-colors"
            title="Run flow"
          >
            <Play size={16} />
          </button>
          <button
            onClick={onEdit}
            className="p-2 hover:bg-theme-action-menu-bg rounded-lg transition-colors text-theme-text-secondary hover:text-theme-text-primary"
            title="Edit flow"
          >
            <Gear size={16} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-theme-action-menu-bg rounded-lg transition-colors text-theme-text-secondary hover:text-theme-text-primary"
              title="More options"
            >
              <span className="block w-1 h-4 relative">
                <span className="absolute top-0 left-0 w-1 h-1 bg-current rounded-full"></span>
                <span className="absolute top-1.5 left-0 w-1 h-1 bg-current rounded-full"></span>
                <span className="absolute top-3 left-0 w-1 h-1 bg-current rounded-full"></span>
              </span>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-theme-settings-input-bg border border-white/10 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Animated Visual Blocks */}
      {isBuilding && visualBlocks.length > 0 && (
        <div className="px-4 pb-4">
          <div className="ml-6 p-3 bg-black/20 rounded-lg">
            <div className="text-xs text-yellow-400 font-medium mb-2">🎨 Workflow Visualization</div>
            <div className="flex flex-wrap gap-2">
              {visualBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className="animate-slideIn"
                  style={{
                    animationDelay: `${index * 0.2}s`,
                    opacity: 0,
                    animationFillMode: 'forwards'
                  }}
                >
                  <div className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                    block.status === 'complete' 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400'
                      : block.status === 'building'
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 animate-pulse'
                      : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20 border border-gray-500/30 text-gray-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      {block.status === 'complete' ? (
                        <CheckCircle size={12} className="animate-bounce" />
                      ) : block.status === 'building' ? (
                        <ArrowsClockwise size={12} className="animate-spin" />
                      ) : (
                        <Clock size={12} />
                      )}
                      <span>{block.name}</span>
                    </div>
                    {block.description && (
                      <div className="text-[10px] mt-1 opacity-80">{block.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Connection Lines Animation */}
            {visualBlocks.length > 1 && (
              <div className="mt-2 flex items-center gap-1">
                {visualBlocks.map((block, index) => (
                  <React.Fragment key={`connection-${block.id}`}>
                    {index > 0 && (
                      <div 
                        className="h-0.5 flex-1 bg-gradient-to-r from-yellow-500/50 to-orange-500/50 animate-expand"
                        style={{
                          animationDelay: `${index * 0.3}s`,
                          transformOrigin: 'left',
                          transform: 'scaleX(0)',
                          animationFillMode: 'forwards'
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}