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
  DotsThree,
  Trash,
  Calendar
} from "@phosphor-icons/react";
import WorkflowBuilder from "./WorkflowBuilder";
import AgentFlows from "@/models/agentFlows";
import showToast from "@/utils/toast";
import { baseHeaders } from "@/utils/request";
// import FlowItem from "./FlowItem";

export default function FlowPanel({ workspace, isVisible, sendCommand, onAutoOpen }) {
  const [flows, setFlows] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [previousFlowCount, setPreviousFlowCount] = useState(0);
  const [hasNewFlows, setHasNewFlows] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedFlowForSchedule, setSelectedFlowForSchedule] = useState(null);

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
      const { success, flows: flowList, error } = await AgentFlows.listFlows(workspace?.slug);
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

  const handleScheduleFlow = (flow) => {
    setSelectedFlowForSchedule(flow);
    setShowScheduleModal(true);
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

  const getCategoryColor = (category) => {
    const colors = {
      'Communication': 'bg-blue-100 text-blue-700',
      'Data Processing': 'bg-green-100 text-green-700',
      'Web Scraping': 'bg-orange-100 text-orange-700',
      'Automation': 'bg-purple-100 text-purple-700',
      'Integration': 'bg-indigo-100 text-indigo-700',
      'Analysis': 'bg-pink-100 text-pink-700',
      'Scheduled': 'bg-cyan-100 text-cyan-700',
      'General': 'bg-gray-100 text-gray-700'
    };
    return colors[category] || colors['General'];
  };

  const getAvailableCategories = () => {
    const categories = ['All', ...new Set(flows.map(flow => flow.category).filter(Boolean))];
    
    // Add "Scheduled" category if there are any scheduled flows
    if (flows.some(flow => flow.scheduled)) {
      categories.push('Scheduled');
    }
    
    return categories;
  };

  const getFilteredFlows = () => {
    if (selectedCategory === 'All') return flows;
    if (selectedCategory === 'Scheduled') return flows.filter(flow => flow.scheduled);
    return flows.filter(flow => flow.category === selectedCategory);
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
          
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {/* Minimal Flow Count */}
              <span className="flex items-center gap-1">
                <span className={`w-1 h-1 rounded-full ${
                  hasNewFlows ? 'bg-green-500' :
                  isCreatingWorkflow ? 'bg-amber-500 animate-pulse' :
                  'bg-gray-400'
                }`} />
                {flows.length}
              </span>
              
              {/* Building indicator */}
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
              className={`text-gray-600 group-hover:text-purple-600 transition-all ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'} duration-300`}
            />
            <div className="absolute inset-0 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNewFlow();
            }}
            className="p-1.5 hover:bg-purple-100 text-purple-600 hover:text-purple-700 rounded-lg transition-colors group"
            title="Create new flow"
          >
            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
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
            <div className="flex flex-col h-full">
              {/* Category Filter */}
              {flows.length > 0 && (
                <div className="p-3 border-b border-gray-200/30">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {getAvailableCategories().map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          selectedCategory === category
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Flows List */}
              <div className="p-1.5 space-y-1.5 overflow-y-auto flex-1" style={{ maxHeight: 'calc(100vh - 240px)' }}>
                {getFilteredFlows().map((flow, index) => (
                <div
                  key={flow.uuid}
                  className="group relative"
                >
                  {/* Minimal status indicator */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-lg ${
                    flow.status === 'building' ? 'bg-amber-400' :
                    flow.active ? 'bg-green-400' : 'bg-gray-300'
                  }`} />
                  
                  {/* Inline flow item rendering */}
                  <div className="bg-white/80 border border-gray-200/60 rounded-lg p-2.5 hover:bg-white hover:border-purple-200/60 transition-all duration-200 group shadow-sm hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <button 
                          onClick={() => handleToggleFlow(flow)} 
                          className="transition-transform hover:scale-110 flex-shrink-0"
                        >
                          {flow.active ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 
                              className="font-medium text-gray-800 hover:text-purple-600 transition-colors cursor-pointer text-sm truncate"
                              onClick={() => handleEditFlow(flow)}
                            >
                              {flow.name}
                            </h3>
                            {flow.scheduled && (
                              <Clock size={12} className="text-blue-500" title="Scheduled Flow" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {flow.category && (
                              <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(flow.category)}`}>
                                {flow.category}
                              </div>
                            )}
                            {flow.scheduled && flow.schedule?.nextRun && (
                              <div className="text-xs text-gray-500">
                                Next: {new Date(flow.schedule.nextRun).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          flow.active ? 'bg-green-400' : 'bg-gray-300'
                        }`} />
                      </div>
                      
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
                        <button
                          onClick={() => handleRunFlow(flow)}
                          className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition-all"
                          title="Run"
                        >
                          <Play size={12} weight="fill" />
                        </button>
                        <button
                          onClick={() => handleEditFlow(flow)}
                          className="p-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded transition-all"
                          title="Edit"
                        >
                          <Gear size={12} />
                        </button>
                        <button
                          onClick={() => handleScheduleFlow(flow)}
                          className="p-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded transition-all"
                          title="Schedule"
                        >
                          <Calendar size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteFlow(flow)}
                          className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-all"
                          title="Delete"
                        >
                          <Trash size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
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
              <div className="flex items-center gap-2">
                <Calendar size={12} />
                <span>Schedule workflow</span>
              </div>
              <div className="flex items-center gap-2">
                <Trash size={12} />
                <span>Delete workflow</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedFlowForSchedule && (
        <ScheduleModal
          flow={selectedFlowForSchedule}
          workspace={workspace}
          onClose={() => {
            setShowScheduleModal(false);
            setSelectedFlowForSchedule(null);
          }}
          onSchedule={() => {
            setShowScheduleModal(false);
            setSelectedFlowForSchedule(null);
            loadFlows(); // Refresh to show the new scheduled flow
          }}
        />
      )}
    </div>
  );
}

// Schedule Modal Component
function ScheduleModal({ flow, workspace, onClose, onSchedule }) {
  const [scheduleName, setScheduleName] = useState(flow.name);
  const [cronExpression, setCronExpression] = useState('0 9 * * *'); // Daily at 9 AM
  const [timezone, setTimezone] = useState('UTC');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const commonSchedules = [
    { label: 'Daily at 9 AM', cron: '0 9 * * *' },
    { label: 'Daily at 6 PM', cron: '0 18 * * *' },
    { label: 'Every Monday at 9 AM', cron: '0 9 * * 1' },
    { label: 'Every hour', cron: '0 * * * *' },
    { label: 'Every 30 minutes', cron: '*/30 * * * *' },
    { label: 'Weekly on Sunday at 10 AM', cron: '0 10 * * 0' }
  ];

  const handleSchedule = async () => {
    if (!scheduleName.trim()) {
      showToast("Schedule name is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/workspace/${workspace.slug}/agent-schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...baseHeaders(),
        },
        body: JSON.stringify({
          agentId: flow.uuid,
          agentType: 'flow',
          name: scheduleName,
          description: description || `Scheduled execution of ${flow.name}`,
          cronExpression: cronExpression,
          timezone: timezone,
          enabled: true,
          context: JSON.stringify({ flowUuid: flow.uuid })
        })
      });

      const result = await response.json();
      
      if (result.success) {
        showToast("Flow scheduled successfully!", "success");
        onSchedule();
      } else {
        showToast(`Failed to schedule flow: ${result.error}`, "error");
      }
    } catch (error) {
      console.error('Error scheduling flow:', error);
      showToast("Error scheduling flow", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Schedule Flow</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Flow Name
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <FlowArrow size={16} className="text-purple-600" />
                <span className="text-sm text-gray-600">{flow.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Name *
              </label>
              <input
                type="text"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter schedule name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Pattern
              </label>
              <select
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {commonSchedules.map((schedule) => (
                  <option key={schedule.cron} value={schedule.cron}>
                    {schedule.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Cron Expression
              </label>
              <input
                type="text"
                value={cronExpression}
                onChange={(e) => setCronExpression(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                placeholder="0 9 * * *"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format: minute hour day month day-of-week
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Describe this schedule..."
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSchedule}
              disabled={isSaving || !scheduleName.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Scheduling...' : 'Schedule Flow'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}