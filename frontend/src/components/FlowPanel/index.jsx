import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, Robot, FlowArrow, Clock, Tag, Gear } from "@phosphor-icons/react";
import WorkflowBuilder from "./WorkflowBuilder";
import AgentFlows from "@/models/agentFlows";
import AgentFlowsList from "@/pages/Admin/Agents/AgentFlows";
import FlowDetailsPanel from "@/pages/Admin/Agents/AgentFlows/FlowPanel";

export default function FlowPanel({ workspace, isVisible, sendCommand }) {
  const [agentFlows, setAgentFlows] = useState([]);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [flowCategories, setFlowCategories] = useState({});
  const [isLoadingFlows, setIsLoadingFlows] = useState(false);
  const [currentlyWritingFlow, setCurrentlyWritingFlow] = useState(null);

  // Load AgentFlows on component mount
  useEffect(() => {
    if (workspace?.slug) {
      loadAgentFlows();
    }
  }, [workspace?.slug]);

  // Load AgentFlows from backend
  const loadAgentFlows = async () => {
    setIsLoadingFlows(true);
    try {
      const response = await AgentFlows.listFlows();
      if (response.success) {
        setAgentFlows(response.flows || []);
        categorizeFlows(response.flows || []);
      }
    } catch (error) {
      console.error('Failed to load agent flows:', error);
    } finally {
      setIsLoadingFlows(false);
    }
  };

  // Categorize flows automatically
  const categorizeFlows = (flows) => {
    const categories = flows.reduce((acc, flow) => {
      let category = 'General';
      
      // Auto-detect category from flow name/description
      const text = (flow.name + ' ' + (flow.description || '')).toLowerCase();
      if (text.includes('email') || text.includes('mail')) category = 'Email';
      else if (text.includes('calendar') || text.includes('schedule') || text.includes('meeting')) category = 'Calendar';
      else if (text.includes('data') || text.includes('chart') || text.includes('analysis')) category = 'Data';
      else if (text.includes('web') || text.includes('scrape') || text.includes('fetch')) category = 'Web';
      
      if (!acc[category]) acc[category] = [];
      acc[category].push(flow);
      return acc;
    }, {});
    
    setFlowCategories(categories);
  };

  // Listen for real-time flow writing events
  useEffect(() => {
    const handleFlowWriting = (event) => {
      const { flowId, step, stepIndex, totalSteps, isComplete } = event.detail;
      
      if (isComplete) {
        // Flow writing complete - reload flows and show final result
        setCurrentlyWritingFlow(null);
        loadAgentFlows();
        
        // Auto-select the newly created flow
        setTimeout(() => {
          const newFlow = agentFlows.find(f => f.uuid === flowId);
          if (newFlow) {
            openFlowInBuilder(newFlow);
          }
        }, 500);
      } else {
        // Update live writing animation
        setCurrentlyWritingFlow({
          id: flowId,
          currentStep: stepIndex,
          totalSteps,
          step: {
            type: step.type,
            title: step.title || `Step ${stepIndex + 1}`,
            description: step.description || step.config?.instruction || 'Processing...',
            status: 'writing'
          },
          progress: Math.round((stepIndex / totalSteps) * 100)
        });
      }
    };

    window.addEventListener('flowWriting', handleFlowWriting);
    
    return () => {
      window.removeEventListener('flowWriting', handleFlowWriting);
    };
  }, [agentFlows]);

  const createNewWorkflow = () => {
    const newWorkflow = {
      id: Date.now(),
      title: "New Workflow",
      content: "",
      timestamp: new Date().toISOString(),
      type: "workflow",
      workflowData: {
        nodes: [],
        edges: [],
        triggers: []
      }
    };
    setActiveFlow(newWorkflow);
    setShowWorkflowBuilder(true);
    setIsCreatingWorkflow(true);
  };

  const updateSelectedFlow = (updates) => {
    if (!selectedFlow?.workflowNote) return;
    
    const updatedNote = { 
      ...selectedFlow.workflowNote, 
      ...updates, 
      timestamp: new Date().toISOString() 
    };
    setSelectedFlow({ ...selectedFlow, workflowNote: updatedNote });
  };

  // Handle flow selection (just select, don't open builder)
  const handleFlowClick = (flow) => {
    setSelectedFlow(flow);
    setShowWorkflowBuilder(false); // Close builder when selecting different flow
  };

  const handleToggleFlow = (flowUuid) => {
    // Update the flow status in our local state
    setAgentFlows(prevFlows => 
      prevFlows.map(flow => 
        flow.uuid === flowUuid 
          ? { ...flow, active: !flow.active }
          : flow
      )
    );
    
    // Update selected flow if it's the one being toggled
    if (selectedFlow?.uuid === flowUuid) {
      setSelectedFlow(prev => ({ ...prev, active: !prev.active }));
    }
  };

  const handleDeleteFlow = (flowUuid) => {
    // Remove from flows list
    setAgentFlows(prevFlows => prevFlows.filter(flow => flow.uuid !== flowUuid));
    
    // Clear selection if the deleted flow was selected
    if (selectedFlow?.uuid === flowUuid) {
      setSelectedFlow(null);
    }
    
    // Reload flows to ensure consistency
    loadAgentFlows();
  };

  // Open selected flow in WorkflowBuilder
  const openFlowInBuilder = async (flow) => {
    try {
      // Fetch the complete flow data with steps
      const response = await AgentFlows.getFlow(flow.uuid);
      
      if (!response.success) {
        console.error('Failed to fetch flow:', response.error);
        return;
      }
      
      const fullFlow = response.flow;
      console.log('[FlowPanel] Full flow data loaded:', fullFlow);
      
      // Create workflow note with the complete flow data
      const workflowNote = {
        id: `flow_${flow.uuid}`,
        title: fullFlow.name || fullFlow.config?.name,
        content: fullFlow.config?.description || fullFlow.description || '',
        timestamp: new Date().toISOString(),
        type: 'workflow',
        isAgentFlow: true,
        uuid: flow.uuid,
        workflowData: {
          // Pass the full flow - WorkflowBuilder will handle the structure
          agentFlowConfig: fullFlow
        }
      };
      
      console.log('[FlowPanel] Created workflow note:', workflowNote);
      setSelectedFlow({ ...flow, workflowNote });
      setShowWorkflowBuilder(true);
      
    } catch (error) {
      console.error('Error opening flow in builder:', error);
    }
  };

  // Convert AgentFlow steps to WorkflowBuilder blocks
  const convertFlowToBlocks = (flow) => {
    if (!flow.steps || !Array.isArray(flow.steps)) {
      return [];
    }
    
    const BLOCK_TYPES = {
      START: 'start',
      INSTRUCTION: 'instruction', 
      API_CALL: 'api-call',
      WEB_SCRAPING: 'web-scraping',
      FINISH: 'finish'
    };
    
    const blocks = flow.steps.map((step, index) => {
      let blockType = BLOCK_TYPES.INSTRUCTION;
      let title = `Step ${index + 1}`;
      let description = 'AI Processing';
      let config = step.config || {};
      
      // Handle different AgentFlow step types
      switch (step.type) {
        case 'start':
          blockType = BLOCK_TYPES.START;
          title = 'Start';
          description = 'Workflow entry point';
          config = {
            variables: step.config?.variables || []
          };
          break;
          
        case 'llmInstruction':
          blockType = BLOCK_TYPES.INSTRUCTION;
          title = `AI Task ${index}`;
          description = step.config?.instruction?.substring(0, 80) + '...' || 'AI Processing Task';
          config = {
            instruction: step.config?.instruction || '',
            resultVariable: step.config?.resultVariable || `step_${index}_result`
          };
          break;
          
        case 'apiCall':
          blockType = BLOCK_TYPES.API_CALL;
          title = `API Call ${index}`;
          description = `API request to ${step.config?.url || 'external service'}`;
          break;
          
        case 'webScraping':
          blockType = BLOCK_TYPES.WEB_SCRAPING;
          title = `Web Scraping ${index}`;
          description = `Scrape content from ${step.config?.url || 'web page'}`;
          break;
          
        default:
          // Keep as instruction by default
          description = step.config?.instruction || step.type || 'Processing step';
      }
      
      return {
        id: index === 0 ? 'start' : `step_${index}`,
        type: blockType,
        title,
        description,
        config
      };
    });
    
    // Add finish block if not present
    const hasFinish = blocks.some(block => block.type === BLOCK_TYPES.FINISH);
    if (!hasFinish) {
      blocks.push({
        id: 'finish',
        type: BLOCK_TYPES.FINISH,
        title: 'Finish',
        description: 'Workflow completion',
        config: {}
      });
    }
    
    return blocks;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full bg-white/95 backdrop-blur-sm border-l border-gray-200/50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200/50 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Robot className="w-5 h-5" />
            Flows ({agentFlows.length})
          </h2>
          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <Gear className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={createNewWorkflow}
            className="flex-1 flex items-center gap-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Create Flow
          </button>
          <button
            onClick={loadAgentFlows}
            className="flex items-center gap-2 p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <FlowArrow className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Flows List */}
      <div className="flex-1 flex flex-col min-h-0">
        {agentFlows.length === 0 && !currentlyWritingFlow ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4">
            <Robot className="w-12 h-12 mb-3 text-gray-300" />
            <p className="text-center text-sm">
              Your AI workflows will appear here. Create flows by describing multi-step tasks in chat.
            </p>
          </div>
        ) : (
          <>
            {/* Live Writing Animation */}
            {currentlyWritingFlow && (
              <div className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Robot className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span className="text-sm font-medium text-blue-800">Creating Workflow...</span>
                    <span className="text-xs text-blue-600">{currentlyWritingFlow.progress}%</span>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">
                        {currentlyWritingFlow.step.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        Step {currentlyWritingFlow.currentStep + 1}/{currentlyWritingFlow.totalSteps}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      {currentlyWritingFlow.step.description}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-2 bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${currentlyWritingFlow.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AgentFlows by Category - Keep current UI */}
            {Object.keys(flowCategories).length > 0 && (
              <div className="flex-1 overflow-y-auto">
                {Object.entries(flowCategories).map(([category, flows]) => (
                  <div key={category}>
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 sticky top-0">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {category} ({flows.length})
                        </span>
                      </div>
                    </div>
                    {flows.map((flow) => (
                      <div
                        key={flow.uuid}
                        onClick={() => handleFlowClick(flow)}
                        className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                          selectedFlow?.uuid === flow.uuid ? 'bg-blue-100 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Robot className="w-3 h-3 text-blue-600" />
                              <h3 className="font-medium text-sm text-gray-800 truncate">
                                {flow.name}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {flow.active ? 'Active' : 'Inactive'}
                            </p>
                            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                              Agent Flow
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openFlowInBuilder(flow);
                            }}
                            className="p-1.5 hover:bg-blue-100 rounded transition-colors"
                            title="Edit in Workflow Builder"
                          >
                            <Gear className="w-4 h-4 text-blue-500" />
                          </button>
                        </div>
                        {flow.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {flow.description.substring(0, 60)}...
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* WorkflowBuilder - Shows below flow list when a flow is selected */}
      {showWorkflowBuilder && selectedFlow?.workflowNote && (
        <div className="border-t border-gray-200/50 bg-white">
          <WorkflowBuilder 
            note={selectedFlow.workflowNote}
            onUpdate={updateSelectedFlow}
            isCreating={isCreatingWorkflow}
            workspace={workspace}
            sendCommand={sendCommand}
          />
        </div>
      )}
    </div>
  );
}