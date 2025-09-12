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
  ArrowsClockwise,
  Wrench,
  CalendarBlank,
  Timer,
  Target,
  DotsThree
} from "@phosphor-icons/react";
import WorkflowBuilder from "./WorkflowBuilder";
import AgentFlows from "@/models/agentFlows";
import showToast from "@/utils/toast";
import FlowItem from "./FlowItem";

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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50/30 via-white/95 to-purple-50/20">
      {/* Modern Header with Glass Effect */}
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
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent">
                AI Workflows
              </h2>
              {isCreatingWorkflow && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium">Building</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 font-medium">Intelligent automation & AI agents</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-semibold text-sm transition-all ${
              hasNewFlows 
                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-sm ring-2 ring-green-200/50 animate-pulse' 
                : isCreatingWorkflow
                ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 shadow-sm ring-2 ring-amber-200/50'
                : 'bg-gray-100/80 text-gray-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                hasNewFlows ? 'bg-green-500 animate-pulse' :
                isCreatingWorkflow ? 'bg-amber-500 animate-pulse' :
                'bg-gray-400'
              }`} />
              {flows.length} {flows.length === 1 ? 'Flow' : 'Flows'}
            </span>
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
              className={`text-gray-600 group-hover:text-purple-600 transition-all ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'} duration-300`}
            />
            <div className="absolute inset-0 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewFlow();
            }}
            className="relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Plus size={16} weight="bold" className="relative z-10 group-hover:rotate-90 transition-transform duration-200" />
            <span className="relative z-10">Create</span>
          </button>
          
          <div className="p-2">
            <div className={`transition-all duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              <CaretDown size={18} className="text-gray-500 group-hover:text-purple-600 transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-4 text-center text-theme-text-secondary">
              Loading flows...
            </div>
          ) : flows.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="relative mb-8">
                  {/* Animated background circles */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-100/50 to-purple-200/30 rounded-full animate-pulse" />
                    <div className="absolute w-24 h-24 bg-gradient-to-br from-purple-200/30 to-purple-300/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </div>
                  
                  {/* Main icon */}
                  <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl">
                    <FlowArrow size={36} className="text-white" />
                    <div className="absolute inset-0 rounded-3xl bg-white/20 animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent">
                    Ready to Automate?
                  </h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium">Create intelligent AI workflows</p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      Connect tools, automate repetitive tasks, and let AI handle the complex logic for you.
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={handleNewFlow}
                    className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 hover:from-purple-600 hover:via-purple-700 hover:to-purple-800 text-white rounded-2xl font-semibold transition-all shadow-lg hover:shadow-xl group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <div className="relative flex items-center justify-center gap-3">
                      <Plus size={20} weight="bold" className="group-hover:rotate-180 transition-transform duration-300" />
                      <span className="text-base">Create Your First Workflow</span>
                    </div>
                  </button>
                  
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
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2 overflow-y-auto h-full" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {flows.map((flow, index) => (
                <div
                  key={flow.uuid}
                  className={`group relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                    flow.status === 'building' ? 'ring-1 ring-amber-200' : ''
                  }`}
                >
                  {/* Status indicator line */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${
                    flow.status === 'building' ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                    flow.active ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                    'bg-gradient-to-r from-gray-300 to-gray-400'
                  }`} />
                  
                  <div className="relative z-10">
                    <FlowItem
                      flow={flow}
                      onEdit={() => handleEditFlow(flow)}
                      onRun={() => handleRunFlow(flow)}
                      onToggle={() => handleToggleFlow(flow)}
                      onDelete={() => handleDeleteFlow(flow)}
                      formatLastUsed={formatLastUsed}
                    />
                  </div>
                </div>
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