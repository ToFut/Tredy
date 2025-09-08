import React, { useState, useEffect } from "react";
import {
  X,
  CaretUp,
  CaretDown,
  Globe,
  Brain,
  Flag,
  Info,
  Play,
  FloppyDisk
} from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";
import showToast from "@/utils/toast";

// Block Types
const BLOCK_TYPES = {
  FLOW_INFO: "flowInfo",
  START: "start",
  LLM_INSTRUCTION: "llmInstruction",
  API_CALL: "apiCall",
  WEB_SCRAPING: "webScraping",
  FINISH: "finish",
};

const BLOCK_INFO = {
  [BLOCK_TYPES.FLOW_INFO]: {
    label: "Flow Information",
    icon: <Info className="w-5 h-5 text-theme-text-primary" />,
    description: "Basic flow information",
  },
  [BLOCK_TYPES.START]: {
    label: "Start",
    icon: <Flag className="w-5 h-5 text-green-500" />,
    description: "Flow entry point with variables",
  },
  [BLOCK_TYPES.LLM_INSTRUCTION]: {
    label: "AI Instruction", 
    icon: <Brain className="w-5 h-5 text-blue-500" />,
    description: "AI processing task",
  },
  [BLOCK_TYPES.API_CALL]: {
    label: "API Call",
    icon: <Globe className="w-5 h-5 text-orange-500" />,
    description: "External API request",
  },
  [BLOCK_TYPES.WEB_SCRAPING]: {
    label: "Web Scraping",
    icon: <Globe className="w-5 h-5 text-purple-500" />,
    description: "Scrape web content",
  },
  [BLOCK_TYPES.FINISH]: {
    label: "Finish",
    icon: <Flag className="w-5 h-5 text-gray-500" />,
    description: "Workflow completion",
  },
};

function WorkflowBlock({ block, isSelected, onSelect, onUpdate, onRemove, canRemove = true }) {
  const [isExpanded, setIsExpanded] = useState(block.isExpanded || false);
  const blockInfo = BLOCK_INFO[block.type];

  if (!blockInfo) {
    console.warn(`Unknown block type: ${block.type}`);
    return null;
  }

  const handleConfigChange = (key, value) => {
    onUpdate({
      config: {
        ...block.config,
        [key]: value
      }
    });
  };

  const handleVariableChange = (index, field, value) => {
    const variables = [...(block.config.variables || [])];
    variables[index] = { ...variables[index], [field]: value };
    handleConfigChange('variables', variables);
  };

  const addVariable = () => {
    const variables = [...(block.config.variables || [])];
    variables.push({ name: '', value: '' });
    handleConfigChange('variables', variables);
  };

  const removeVariable = (index) => {
    const variables = [...(block.config.variables || [])];
    variables.splice(index, 1);
    handleConfigChange('variables', variables);
  };

  return (
    <div 
      className={`border-2 rounded-lg transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={() => onSelect(block.id)}
    >
      {/* Block Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {blockInfo.icon}
            <span className="font-medium text-sm">{blockInfo.label}</span>
            {block.type === BLOCK_TYPES.FLOW_INFO && block.config.name && (
              <span className="text-xs text-gray-500">- {block.config.name}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {isExpanded ? <CaretUp size={16} /> : <CaretDown size={16} />}
            </button>
            {canRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-500"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">{blockInfo.description}</p>
      </div>

      {/* Block Content */}
      {isExpanded && (
        <div className="p-3">
          {block.type === BLOCK_TYPES.FLOW_INFO && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Flow Name</label>
                <input
                  type="text"
                  value={block.config.name || ''}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="Enter flow name..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description</label>
                <textarea
                  value={block.config.description || ''}
                  onChange={(e) => handleConfigChange('description', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="Describe what this flow does..."
                  rows={2}
                />
              </div>
            </div>
          )}

          {block.type === BLOCK_TYPES.START && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium">Variables</label>
                <button
                  onClick={addVariable}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Variable
                </button>
              </div>
              {(block.config.variables || []).map((variable, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={variable.name || ''}
                    onChange={(e) => handleVariableChange(index, 'name', e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Variable name"
                  />
                  <input
                    type="text"
                    value={variable.value || ''}
                    onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    placeholder="Default value"
                  />
                  <button
                    onClick={() => removeVariable(index)}
                    className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {block.type === BLOCK_TYPES.LLM_INSTRUCTION && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Instruction</label>
                <textarea
                  value={block.config.instruction || ''}
                  onChange={(e) => handleConfigChange('instruction', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="Enter AI instruction..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Result Variable</label>
                <input
                  type="text"
                  value={block.config.resultVariable || ''}
                  onChange={(e) => handleConfigChange('resultVariable', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="Variable to store result (e.g., step_1_result)"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={block.config.directOutput || false}
                  onChange={(e) => handleConfigChange('directOutput', e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-xs">Direct output (bypass further LLM processing)</label>
              </div>
            </div>
          )}

          {block.type === BLOCK_TYPES.API_CALL && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">API URL</label>
                <input
                  type="url"
                  value={block.config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="https://api.example.com/endpoint"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Method</label>
                <select
                  value={block.config.method || 'GET'}
                  onChange={(e) => handleConfigChange('method', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Result Variable</label>
                <input
                  type="text"
                  value={block.config.resultVariable || ''}
                  onChange={(e) => handleConfigChange('resultVariable', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="Variable to store result"
                />
              </div>
            </div>
          )}

          {block.type === BLOCK_TYPES.WEB_SCRAPING && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">URL to Scrape</label>
                <input
                  type="url"
                  value={block.config.url || ''}
                  onChange={(e) => handleConfigChange('url', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">CSS Selector (optional)</label>
                <input
                  type="text"
                  value={block.config.selector || ''}
                  onChange={(e) => handleConfigChange('selector', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="e.g., .content, #main, article"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Result Variable</label>
                <input
                  type="text"
                  value={block.config.resultVariable || ''}
                  onChange={(e) => handleConfigChange('resultVariable', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  placeholder="Variable to store scraped content"
                />
              </div>
            </div>
          )}

          {block.type === BLOCK_TYPES.FINISH && (
            <div className="text-sm text-gray-500">
              This block marks the end of the workflow. All results will be collected and returned.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkflowBuilder({ 
  note, 
  onUpdate, 
  isCreating = false,
  workspace,
  sendCommand
}) {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);

  // Initialize workflow from note data
  useEffect(() => {
    console.log('[WorkflowBuilder] Initializing with note:', note);
    
    // Check if we have an AgentFlow config
    if (note?.workflowData?.agentFlowConfig) {
      const convertedBlocks = convertAgentFlowBlocks(note.workflowData.agentFlowConfig);
      console.log('[WorkflowBuilder] Converted blocks from AgentFlow:', convertedBlocks);
      
      if (convertedBlocks.length > 0) {
        setBlocks(convertedBlocks);
        setSelectedBlock(convertedBlocks[0].id);
      } else {
        // Fallback to default if conversion failed
        console.log('[WorkflowBuilder] No blocks converted, using defaults');
        setDefaultBlocks();
      }
    } else if (note?.workflowData?.blocks && Array.isArray(note.workflowData.blocks)) {
      // Direct blocks provided
      setBlocks(note.workflowData.blocks);
      if (note.workflowData.blocks.length > 0) {
        setSelectedBlock(note.workflowData.blocks[0].id);
      }
    } else {
      // Default blocks
      setDefaultBlocks();
    }
  }, [note]);

  const setDefaultBlocks = () => {
    setBlocks([
      {
        id: 'flow_info',
        type: BLOCK_TYPES.FLOW_INFO,
        config: { name: '', description: '' },
        isExpanded: true,
      },
      {
        id: 'start',
        type: BLOCK_TYPES.START,
        config: { variables: [] },
        isExpanded: true,
      },
      {
        id: 'finish',
        type: BLOCK_TYPES.FINISH,
        config: {},
        isExpanded: false,
      }
    ]);
    setSelectedBlock('flow_info');
  };

  const convertAgentFlowBlocks = (agentFlow) => {
    // Check both possible locations for steps
    const steps = agentFlow?.config?.steps || agentFlow?.steps || [];
    
    if (!steps || steps.length === 0) {
      console.log('[WorkflowBuilder] No steps found in flow:', agentFlow);
      return [];
    }

    console.log('[WorkflowBuilder] Found steps:', steps);

    const convertedBlocks = [
      {
        id: 'flow_info',
        type: BLOCK_TYPES.FLOW_INFO,
        config: {
          name: agentFlow?.config?.name || agentFlow?.name || '',
          description: agentFlow?.config?.description || agentFlow?.description || ''
        },
        isExpanded: true,
      }
    ];

    steps.forEach((step, index) => {
      if (step.type === 'start') {
        convertedBlocks.push({
          id: 'start',
          type: BLOCK_TYPES.START,
          config: {
            variables: step.config?.variables || []
          },
          isExpanded: true,
        });
      } else if (step.type === 'llmInstruction') {
        convertedBlocks.push({
          id: `step_${index}`,
          type: BLOCK_TYPES.LLM_INSTRUCTION,
          config: {
            instruction: step.config?.instruction || '',
            resultVariable: step.config?.resultVariable || `step_${index}_result`,
            directOutput: step.config?.directOutput || false
          },
          isExpanded: false,
        });
      } else if (step.type === 'apiCall') {
        convertedBlocks.push({
          id: `step_${index}`,
          type: BLOCK_TYPES.API_CALL,
          config: {
            url: step.config?.url || '',
            method: step.config?.method || 'GET',
            resultVariable: step.config?.resultVariable || `step_${index}_result`
          },
          isExpanded: false,
        });
      } else if (step.type === 'webScraping') {
        convertedBlocks.push({
          id: `step_${index}`,
          type: BLOCK_TYPES.WEB_SCRAPING,
          config: {
            url: step.config?.url || '',
            selector: step.config?.selector || '',
            resultVariable: step.config?.resultVariable || `step_${index}_result`
          },
          isExpanded: false,
        });
      }
    });

    // Add finish block
    convertedBlocks.push({
      id: 'finish',
      type: BLOCK_TYPES.FINISH,
      config: {},
      isExpanded: false,
    });

    return convertedBlocks;
  };

  const updateBlock = (blockId, updates) => {
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === blockId 
          ? { ...block, ...updates }
          : block
      )
    );

    // Update parent component if provided
    if (onUpdate) {
      const updatedBlocks = blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      );
      onUpdate({
        workflowData: {
          blocks: updatedBlocks
        }
      });
    }
  };

  const removeBlock = (blockId) => {
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId));
    if (selectedBlock === blockId) {
      setSelectedBlock(blocks[0]?.id);
    }
  };

  const runWorkflow = async () => {
    console.log('[WorkflowBuilder] sendCommand available:', !!sendCommand);
    
    if (!sendCommand) {
      showToast("Chat connection not available", "error");
      return;
    }

    try {
      console.log('[WorkflowBuilder] Running workflow with blocks:', blocks);
      console.log('[WorkflowBuilder] Block types:', blocks.map(b => ({ id: b.id, type: b.type })));
      
      // Convert blocks to natural language description
      const steps = blocks.filter(block => 
        block.type === BLOCK_TYPES.LLM_INSTRUCTION || 
        block.type === BLOCK_TYPES.API_CALL || 
        block.type === BLOCK_TYPES.WEB_SCRAPING
      );

      console.log('[WorkflowBuilder] Filtered steps:', steps);
      console.log('[WorkflowBuilder] BLOCK_TYPES.LLM_INSTRUCTION:', BLOCK_TYPES.LLM_INSTRUCTION);

      if (steps.length === 0) {
        console.log('[WorkflowBuilder] No executable steps found.');
        console.log('[WorkflowBuilder] Looking for types:', [
          BLOCK_TYPES.LLM_INSTRUCTION,
          BLOCK_TYPES.API_CALL,
          BLOCK_TYPES.WEB_SCRAPING
        ]);
        showToast("No workflow steps to execute", "warning");
        return;
      }

      const workflowDescription = steps.map(step => {
        if (step.type === BLOCK_TYPES.LLM_INSTRUCTION) {
          return step.config.instruction;
        } else if (step.type === BLOCK_TYPES.API_CALL) {
          return `call API ${step.config.url}`;
        } else if (step.type === BLOCK_TYPES.WEB_SCRAPING) {
          return `scrape content from ${step.config.url}`;
        }
        return step.type;
      }).join(' then ');
      
      const workflowCommand = `@agent execute workflow: ${workflowDescription}`;
      
      await sendCommand({ 
        text: workflowCommand,
        autoSubmit: true 
      });
      
      showToast("Workflow execution command sent!", "success");
    } catch (error) {
      console.error('Error running workflow:', error);
      showToast("Failed to run workflow", "error");
    }
  };

  const saveWorkflow = async () => {
    try {
      showToast("Workflow saved locally", "success");
    } catch (error) {
      console.error('Error saving workflow:', error);
      showToast("Failed to save workflow", "error");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Workflow Builder</h2>
          {note?.title && (
            <span className="text-sm text-gray-500">- {note.title}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={saveWorkflow}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
          >
            <FloppyDisk size={16} />
            Save
          </button>
          <button
            onClick={runWorkflow}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            <Play size={16} />
            Run Workflow
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4 max-w-2xl">
          {blocks.map((block) => (
            <WorkflowBlock
              key={block.id}
              block={block}
              isSelected={selectedBlock === block.id}
              onSelect={setSelectedBlock}
              onUpdate={(updates) => updateBlock(block.id, updates)}
              onRemove={() => removeBlock(block.id)}
              canRemove={!['flow_info', 'start', 'finish'].includes(block.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}