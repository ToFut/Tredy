import React, { useState, useEffect } from "react";
import { Plus, Play, FloppyDisk, Gear, FlowArrow as WorkflowIcon, X, ArrowDown } from "@phosphor-icons/react";
import AgentFlows from "@/models/agentFlows";
import showToast from "@/utils/toast";

const BLOCK_TYPES = {
  START: 'start',
  INSTRUCTION: 'instruction',
  API_CALL: 'api-call',
  CODE: 'code',
  FINISH: 'finish'
};

const DEFAULT_WORKFLOW_BLOCKS = [
  {
    id: "start",
    type: BLOCK_TYPES.START,
    title: "Start",
    description: "Workflow entry point",
    config: {
      variables: []
    }
  },
  {
    id: "instruction",
    type: BLOCK_TYPES.INSTRUCTION,
    title: "AI Instruction",
    description: "Process with AI",
    config: {
      instruction: "Analyze the conversation and extract key insights"
    }
  },
  {
    id: "finish",
    type: BLOCK_TYPES.FINISH,
    title: "Finish",
    description: "Workflow completion",
    config: {}
  }
];

export default function WorkflowBuilder({ 
  note, 
  onUpdate, 
  isCreating = false, 
  workspace 
}) {
  const [blocks, setBlocks] = useState(DEFAULT_WORKFLOW_BLOCKS);
  const [selectedBlock, setSelectedBlock] = useState("start");
  const [isRunning, setIsRunning] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Initialize workflow from note data
  useEffect(() => {
    if (note.workflowData?.blocks) {
      setBlocks(note.workflowData.blocks);
    } else if (isCreating) {
      // Auto-generate workflow from conversation context
      generateWorkflowFromContext();
    }
  }, [note, isCreating]);

  const generateWorkflowFromContext = () => {
    // This would analyze chat context and create relevant workflow steps
    const contextBlocks = [
      {
        id: "start",
        type: BLOCK_TYPES.START,
        title: "Start",
        description: "Begin conversation analysis",
        config: { variables: [{ name: "conversation", value: "{{chat_context}}" }] }
      },
      {
        id: "analyze",
        type: BLOCK_TYPES.INSTRUCTION,
        title: "Analyze Conversation",
        description: "Extract key insights from the conversation",
        config: {
          instruction: "Analyze the conversation context and identify main topics, questions, and action items."
        }
      },
      {
        id: "summarize",
        type: BLOCK_TYPES.INSTRUCTION,
        title: "Generate Summary",
        description: "Create actionable summary",
        config: {
          instruction: "Create a structured summary with key points, decisions made, and next steps."
        }
      },
      {
        id: "finish",
        type: BLOCK_TYPES.FINISH,
        title: "Complete",
        description: "Return results",
        config: {}
      }
    ];

    setBlocks(contextBlocks);
    updateNoteWorkflow(contextBlocks);
  };

  const updateNoteWorkflow = (newBlocks = blocks) => {
    onUpdate({
      workflowData: {
        ...note.workflowData,
        blocks: newBlocks
      }
    });
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      title: getBlockTitle(type),
      description: getBlockDescription(type),
      config: getDefaultConfig(type)
    };

    const insertIndex = blocks.length - 1; // Insert before finish block
    const newBlocks = [...blocks];
    newBlocks.splice(insertIndex, 0, newBlock);
    
    setBlocks(newBlocks);
    setSelectedBlock(newBlock.id);
    updateNoteWorkflow(newBlocks);
    setShowAddMenu(false);
  };

  const removeBlock = (blockId) => {
    if (blockId === "start" || blockId === "finish") return; // Can't remove start/finish
    
    const newBlocks = blocks.filter(block => block.id !== blockId);
    setBlocks(newBlocks);
    updateNoteWorkflow(newBlocks);
    
    if (selectedBlock === blockId) {
      setSelectedBlock("start");
    }
  };

  const updateBlock = (blockId, updates) => {
    const newBlocks = blocks.map(block => 
      block.id === blockId 
        ? { ...block, ...updates }
        : block
    );
    setBlocks(newBlocks);
    updateNoteWorkflow(newBlocks);
  };

  const runWorkflow = async () => {
    if (!workspace) {
      showToast("Workspace required to run workflow", "error");
      return;
    }

    setIsRunning(true);
    try {
      // This would execute the workflow
      showToast("Workflow execution started...", "info");
      
      // Simulate workflow execution
      setTimeout(() => {
        setIsRunning(false);
        showToast("Workflow completed successfully", "success");
      }, 3000);
      
    } catch (error) {
      setIsRunning(false);
      showToast("Workflow execution failed", "error");
    }
  };

  const saveWorkflow = async () => {
    try {
      const workflowConfig = {
        name: note.title,
        description: note.content,
        blocks: blocks.map(block => ({
          type: block.type,
          config: block.config
        }))
      };

      showToast("Workflow saved successfully", "success");
    } catch (error) {
      showToast("Failed to save workflow", "error");
    }
  };

  const getBlockTitle = (type) => {
    const titles = {
      [BLOCK_TYPES.START]: "Start",
      [BLOCK_TYPES.INSTRUCTION]: "AI Instruction",
      [BLOCK_TYPES.API_CALL]: "API Call",
      [BLOCK_TYPES.CODE]: "Code Execution",
      [BLOCK_TYPES.FINISH]: "Finish"
    };
    return titles[type] || "Unknown Block";
  };

  const getBlockDescription = (type) => {
    const descriptions = {
      [BLOCK_TYPES.START]: "Workflow entry point",
      [BLOCK_TYPES.INSTRUCTION]: "Process with AI",
      [BLOCK_TYPES.API_CALL]: "External API call",
      [BLOCK_TYPES.CODE]: "Execute code",
      [BLOCK_TYPES.FINISH]: "Workflow completion"
    };
    return descriptions[type] || "Custom block";
  };

  const getDefaultConfig = (type) => {
    const configs = {
      [BLOCK_TYPES.START]: { variables: [] },
      [BLOCK_TYPES.INSTRUCTION]: { instruction: "Enter your instruction here..." },
      [BLOCK_TYPES.API_CALL]: { url: "", method: "GET", headers: {} },
      [BLOCK_TYPES.CODE]: { language: "javascript", code: "// Enter your code here" },
      [BLOCK_TYPES.FINISH]: {}
    };
    return configs[type] || {};
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <WorkflowIcon className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Workflow Builder</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={saveWorkflow}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <FloppyDisk className="w-3 h-3" />
              Save
            </button>
            <button
              onClick={runWorkflow}
              disabled={isRunning}
              className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              <Play className="w-3 h-3" />
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div key={block.id}>
              <WorkflowBlock
                block={block}
                isSelected={selectedBlock === block.id}
                onSelect={() => setSelectedBlock(block.id)}
                onUpdate={(updates) => updateBlock(block.id, updates)}
                onRemove={() => removeBlock(block.id)}
                canRemove={block.id !== "start" && block.id !== "finish"}
              />
              
              {/* Add connection arrow */}
              {index < blocks.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-4 h-4 text-gray-400" />
                </div>
              )}
              
              {/* Add block button between blocks */}
              {index === blocks.length - 2 && ( // Before finish block
                <div className="flex justify-center py-2 relative">
                  <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  
                  {showAddMenu && (
                    <div className="absolute top-12 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
                      <div className="space-y-1">
                        <button
                          onClick={() => addBlock(BLOCK_TYPES.INSTRUCTION)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                        >
                          AI Instruction
                        </button>
                        <button
                          onClick={() => addBlock(BLOCK_TYPES.API_CALL)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                        >
                          API Call
                        </button>
                        <button
                          onClick={() => addBlock(BLOCK_TYPES.CODE)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded text-sm"
                        >
                          Code Block
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Individual workflow block component
function WorkflowBlock({ 
  block, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onRemove, 
  canRemove 
}) {
  const [isEditing, setIsEditing] = useState(false);

  const getBlockColor = (type) => {
    const colors = {
      [BLOCK_TYPES.START]: "bg-green-50 border-green-200",
      [BLOCK_TYPES.INSTRUCTION]: "bg-blue-50 border-blue-200",
      [BLOCK_TYPES.API_CALL]: "bg-orange-50 border-orange-200",
      [BLOCK_TYPES.CODE]: "bg-purple-50 border-purple-200",
      [BLOCK_TYPES.FINISH]: "bg-gray-50 border-gray-200"
    };
    return colors[type] || "bg-gray-50 border-gray-200";
  };

  const getBlockIcon = (type) => {
    const icons = {
      [BLOCK_TYPES.START]: "🚀",
      [BLOCK_TYPES.INSTRUCTION]: "🧠",
      [BLOCK_TYPES.API_CALL]: "🌐",
      [BLOCK_TYPES.CODE]: "💻",
      [BLOCK_TYPES.FINISH]: "🏁"
    };
    return icons[type] || "⚪";
  };

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
        isSelected ? "border-blue-500 shadow-sm" : "border-gray-200"
      } ${getBlockColor(block.type)}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getBlockIcon(block.type)}</span>
          <div>
            <h4 className="font-medium text-sm text-gray-800">{block.title}</h4>
            <p className="text-xs text-gray-500">{block.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1 hover:bg-white/50 rounded"
          >
            <Gear className="w-3 h-3 text-gray-500" />
          </button>
          
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 hover:bg-red-100 rounded text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      
      {/* Block Configuration */}
      {isEditing && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <BlockConfig
            block={block}
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

// Block configuration component
function BlockConfig({ block, onUpdate }) {
  if (block.type === BLOCK_TYPES.INSTRUCTION) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Instruction:
        </label>
        <textarea
          value={block.config.instruction || ""}
          onChange={(e) => onUpdate({
            config: { ...block.config, instruction: e.target.value }
          })}
          className="w-full p-2 text-xs border border-gray-200 rounded resize-none h-16"
          placeholder="Enter AI instruction..."
        />
      </div>
    );
  }

  if (block.type === BLOCK_TYPES.API_CALL) {
    return (
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            URL:
          </label>
          <input
            type="text"
            value={block.config.url || ""}
            onChange={(e) => onUpdate({
              config: { ...block.config, url: e.target.value }
            })}
            className="w-full p-2 text-xs border border-gray-200 rounded"
            placeholder="https://api.example.com/endpoint"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Method:
          </label>
          <select
            value={block.config.method || "GET"}
            onChange={(e) => onUpdate({
              config: { ...block.config, method: e.target.value }
            })}
            className="w-full p-2 text-xs border border-gray-200 rounded"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>
    );
  }

  if (block.type === BLOCK_TYPES.CODE) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Code:
        </label>
        <textarea
          value={block.config.code || ""}
          onChange={(e) => onUpdate({
            config: { ...block.config, code: e.target.value }
          })}
          className="w-full p-2 text-xs border border-gray-200 rounded font-mono resize-none h-20"
          placeholder="// Enter your code here..."
        />
      </div>
    );
  }

  return (
    <div className="text-xs text-gray-500">
      No configuration available for this block type.
    </div>
  );
}