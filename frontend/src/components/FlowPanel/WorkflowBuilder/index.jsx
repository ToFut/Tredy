import React, { useState, useEffect, useRef } from "react";
import {
  CaretDown,
  CaretUp,
  Plus,
  CaretLeft,
  X,
  Globe,
  Brain,
  Flag,
  Info,
  BracketsCurly,
  Plugs,
  Wrench,
  Play,
  FloppyDisk,
  Upload,
  Trash,
  CheckCircle,
  Warning,
  Copy,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import AnythingInfinityLogo from "@/media/logo/Tredy Full.png";
import { Tooltip } from "react-tooltip";
import showToast from "@/utils/toast";
import AgentFlows from "@/models/agentFlows";

// Block Types - Only supported types from backend
const BLOCK_TYPES = {
  FLOW_INFO: "flowInfo", // UI only - not saved to backend
  START: "start",
  API_CALL: "apiCall",
  LLM_INSTRUCTION: "llmInstruction", 
  WEB_SCRAPING: "webScraping",
  FINISH: "finish", // UI only - not saved to backend
};

const BLOCK_INFO = {
  [BLOCK_TYPES.FLOW_INFO]: {
    label: "Flow Information",
    icon: <Info className="w-5 h-5 text-theme-text-primary" />,
    description: "Basic flow information",
    defaultConfig: {
      name: "",
      description: "",
    },
    getSummary: (config) => config.name || "Untitled Flow",
  },
  [BLOCK_TYPES.START]: {
    label: "Flow Variables", 
    icon: <BracketsCurly className="w-5 h-5 text-theme-text-primary" />,
    description: "Configure agent variables and settings",
    defaultConfig: {
      variables: [{ name: "", value: "" }],
    },
    getSummary: (config) => {
      const varCount = config.variables?.filter((v) => v.name)?.length || 0;
      return `${varCount} variable${varCount !== 1 ? "s" : ""} defined`;
    },
  },
  [BLOCK_TYPES.API_CALL]: {
    label: "API Call",
    icon: <Globe className="w-5 h-5 text-theme-text-primary" />,
    description: "Make an HTTP request",
    defaultConfig: {
      url: "",
      method: "GET", 
      headers: [],
      bodyType: "json",
      body: "",
      formData: [],
      responseVariable: "",
      directOutput: false,
    },
    getSummary: (config) =>
      `${config.method || "GET"} ${config.url || "(no URL)"}`,
  },
  [BLOCK_TYPES.LLM_INSTRUCTION]: {
    label: "LLM Instruction",
    icon: <Brain className="w-5 h-5 text-theme-text-primary" />,
    description: "Send instructions to the AI model", 
    defaultConfig: {
      instruction: "",
      resultVariable: "",
      directOutput: false,
    },
    getSummary: (config) => {
      if (!config.instruction) return "No instruction provided";
      return config.instruction.length > 50
        ? config.instruction.substring(0, 50) + "..."
        : config.instruction;
    },
  },
  [BLOCK_TYPES.WEB_SCRAPING]: {
    label: "Web Scraping",
    icon: <Globe className="w-5 h-5 text-theme-text-primary" />,
    description: "Extract content from websites",
    defaultConfig: {
      url: "",
      resultVariable: "",
      directOutput: false,
    },
    getSummary: (config) => config.url || "No URL specified",
  },
  [BLOCK_TYPES.FINISH]: {
    label: "Flow Complete",
    icon: <Flag className="w-5 h-5 text-theme-text-primary" />,
    description: "End the workflow",
    defaultConfig: {},
    getSummary: () => "Flow will end here",
  },
};

const DEFAULT_BLOCKS = [
  {
    id: "flow_info",
    type: BLOCK_TYPES.FLOW_INFO,
    config: {
      name: "",
      description: "",
    },
    isExpanded: true,
  },
  {
    id: "start",
    type: BLOCK_TYPES.START,
    config: {
      variables: [{ name: "", value: "" }],
    },
    isExpanded: true,
  },
  {
    id: "finish",
    type: BLOCK_TYPES.FINISH,
    config: {},
    isExpanded: false,
  },
];

function HeaderMenu({
  flowName,
  availableFlows = [],
  onNewFlow,
  onSaveFlow,
  onRunFlow,
  onPublishFlow,
  onClearFlow,
  onClose,
  isSaving,
  isRunning,
  lastSaved,
  hasUnsavedChanges,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const saved = new Date(lastSaved);
    const diffMs = now - saved;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Saved just now";
    if (diffMins === 1) return "Saved 1 minute ago";
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "Saved 1 hour ago";
    if (diffHours < 24) return `Saved ${diffHours} hours ago`;
    
    return `Saved on ${saved.toLocaleDateString()}`;
  };

  return (
    <div className="bg-theme-bg-secondary border-b border-white/10">
      {/* Top Bar with Logo and Flow Name */}
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center gap-x-3">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-settings-input-bg border border-white/10 hover:bg-theme-action-menu-bg transition-colors duration-300"
          >
            <CaretLeft
              weight="bold"
              className="w-5 h-5 text-theme-text-primary"
            />
          </button>
          
          <div className="flex items-center gap-x-2">
            <img
              src={AnythingInfinityLogo}
              alt="logo"
              className="w-[20px] light:invert"
            />
            <span className="text-theme-text-primary text-sm uppercase tracking-widest font-medium">
              Workflow Builder
            </span>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div
            className="relative"
            ref={dropdownRef}
          >
            <button
              className="flex items-center gap-x-2 text-theme-text-primary hover:bg-theme-action-menu-bg px-3 py-1.5 rounded-lg transition-colors duration-300"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span
                className={`text-sm font-medium ${
                  flowName ? "text-theme-text-primary" : "text-theme-text-secondary"
                }`}
              >
                {flowName || "Untitled Flow"}
              </span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Unsaved changes" />
              )}
              <CaretDown size={12} className="text-theme-text-secondary" />
            </button>
            
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-theme-settings-input-bg border border-white/10 rounded-lg shadow-lg z-50 animate-fadeUpIn">
                <div className="p-2">
                  <div className="text-xs text-theme-text-secondary px-2 py-1 uppercase tracking-wider">
                    Recent Flows
                  </div>
                  {availableFlows.length > 0 ? (
                    availableFlows.slice(0, 5).map((flow) => (
                      <button
                        key={flow?.uuid || Math.random()}
                        onClick={() => {
                          console.log("Switch to flow:", flow);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-2 py-2 text-sm text-theme-text-primary hover:bg-theme-action-menu-bg rounded transition-colors duration-200 flex items-center justify-between group"
                      >
                        <span className="truncate">{flow?.name || "Untitled Flow"}</span>
                        <span className="text-xs text-theme-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                          Load
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-2 py-3 text-sm text-theme-text-secondary text-center">
                      No other flows available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status and Info */}
        <div className="flex items-center gap-x-4">
          {lastSaved && (
            <div className="flex items-center gap-x-2 text-xs text-theme-text-secondary">
              <CheckCircle size={14} className="text-green-500" />
              <span>{formatLastSaved()}</span>
            </div>
          )}
          
          <a
            href="https://docs.anythingllm.com/agent-flows/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-theme-text-secondary text-xs hover:text-cta-button flex items-center gap-x-1 transition-colors"
          >
            Documentation
            <span className="text-[10px]">↗</span>
          </a>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-4 py-2 bg-theme-bg-primary/50 flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          {/* Primary Actions */}
          <button
            onClick={onRunFlow}
            disabled={isRunning}
            className="flex items-center gap-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-sm"
          >
            {isRunning ? (
              <>
                <ArrowsClockwise size={16} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} weight="fill" />
                Run Flow
              </>
            )}
          </button>

          <button
            onClick={onSaveFlow}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-x-2 px-4 py-2 bg-primary-button hover:bg-primary-button/90 disabled:opacity-50 text-black light:text-white rounded-lg text-sm font-medium transition-all duration-300 shadow-sm"
          >
            {isSaving ? (
              <>
                <ArrowsClockwise size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDisk size={16} />
                Save
              </>
            )}
          </button>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* Secondary Actions */}
          <button
            onClick={onPublishFlow}
            className="flex items-center gap-x-2 px-3 py-2 border border-white/10 hover:bg-theme-action-menu-bg text-theme-text-primary rounded-lg text-sm font-medium transition-all duration-300"
          >
            <Upload size={16} />
            Publish
          </button>

          <button
            onClick={onNewFlow}
            className="flex items-center gap-x-2 px-3 py-2 border border-white/10 hover:bg-theme-action-menu-bg text-theme-text-primary rounded-lg text-sm font-medium transition-all duration-300"
          >
            <Plus size={16} />
            New
          </button>

          <button
            onClick={onClearFlow}
            className="flex items-center gap-x-2 px-3 py-2 hover:bg-red-500/10 hover:text-red-400 text-theme-text-secondary rounded-lg text-sm font-medium transition-all duration-300"
          >
            <Trash size={16} />
            Clear
          </button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        <div className="flex items-center gap-x-3 text-xs text-theme-text-secondary">
          <span className="flex items-center gap-x-1">
            <kbd className="px-1.5 py-0.5 bg-theme-bg-secondary rounded text-[10px] font-mono">⌘S</kbd>
            Save
          </span>
          <span className="flex items-center gap-x-1">
            <kbd className="px-1.5 py-0.5 bg-theme-bg-secondary rounded text-[10px] font-mono">⌘↵</kbd>
            Run
          </span>
        </div>
      </div>
    </div>
  );
}

function BlockNode({ 
  block, 
  updateBlockConfig, 
  removeBlock, 
  toggleBlockExpansion,
  duplicateBlock,
  executionStatus,
  validationErrors 
}) {
  const blockInfo = BLOCK_INFO[block.type];
  if (!blockInfo) return null;

  const hasErrors = validationErrors && validationErrors.length > 0;
  const isExecuting = executionStatus === 'executing';
  const isCompleted = executionStatus === 'completed';
  const isFailed = executionStatus === 'failed';

  const renderBlockContent = () => {
    switch (block.type) {
      case BLOCK_TYPES.FLOW_INFO:
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                Flow Name *
              </label>
              <input
                type="text"
                value={block.config.name || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { name: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                placeholder="Enter flow name..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                Description *
              </label>
              <textarea
                value={block.config.description || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { description: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                placeholder="Describe what this flow does..."
                rows={3}
              />
            </div>
          </div>
        );

      case BLOCK_TYPES.START:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-theme-text-primary">
                Variables
              </label>
              <button
                onClick={() => {
                  const variables = [...(block.config.variables || [])];
                  variables.push({ name: "", value: "" });
                  updateBlockConfig(block.id, { variables });
                }}
                className="text-xs px-2 py-1 bg-primary-button text-black light:text-white rounded hover:opacity-80"
              >
                Add Variable
              </button>
            </div>
            {(block.config.variables || []).map((variable, index) => (
              <div key={index} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={variable.name || ""}
                  onChange={(e) => {
                    const variables = [...block.config.variables];
                    variables[index] = { ...variables[index], name: e.target.value };
                    updateBlockConfig(block.id, { variables });
                  }}
                  className="flex-1 border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2"
                  placeholder="Variable name"
                />
                <input
                  type="text"
                  value={variable.value || ""}
                  onChange={(e) => {
                    const variables = [...block.config.variables];
                    variables[index] = { ...variables[index], value: e.target.value };
                    updateBlockConfig(block.id, { variables });
                  }}
                  className="flex-1 border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2"
                  placeholder="Default value"
                />
                <button
                  onClick={() => {
                    const variables = [...block.config.variables];
                    variables.splice(index, 1);
                    updateBlockConfig(block.id, { variables });
                  }}
                  className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        );

      case BLOCK_TYPES.LLM_INSTRUCTION:
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                Instruction *
              </label>
              <textarea
                value={block.config.instruction || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { instruction: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                placeholder="Enter AI instruction..."
                rows={4}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                Result Variable
              </label>
              <input
                type="text"
                value={block.config.resultVariable || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { resultVariable: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                placeholder="Variable to store result"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block.config.directOutput || false}
                onChange={(e) =>
                  updateBlockConfig(block.id, { directOutput: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label className="text-xs text-theme-text-primary">
                Direct output (bypass further LLM processing)
              </label>
            </div>
          </div>
        );

      case BLOCK_TYPES.API_CALL:
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                API URL *
              </label>
              <input
                type="url"
                value={block.config.url || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { url: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                Method
              </label>
              <select
                value={block.config.method || "GET"}
                onChange={(e) =>
                  updateBlockConfig(block.id, { method: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                Response Variable
              </label>
              <input
                type="text"
                value={block.config.responseVariable || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { responseVariable: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                placeholder="Variable to store response"
              />
            </div>
          </div>
        );

      case BLOCK_TYPES.WEB_SCRAPING:
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                URL to Scrape *
              </label>
              <input
                type="url"
                value={block.config.url || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { url: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-theme-text-primary">
                Result Variable
              </label>
              <input
                type="text"
                value={block.config.resultVariable || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { resultVariable: e.target.value })
                }
                className="w-full border-none bg-theme-bg-primary text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
                placeholder="Variable to store scraped content"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block.config.directOutput || false}
                onChange={(e) =>
                  updateBlockConfig(block.id, { directOutput: e.target.checked })
                }
                className="w-4 h-4"
              />
              <label className="text-xs text-theme-text-primary">
                Direct output (return content directly to chat)
              </label>
            </div>
          </div>
        );

      case BLOCK_TYPES.FINISH:
        return (
          <div className="text-sm text-theme-text-secondary">
            This block marks the end of the workflow. All results will be collected and returned.
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`
      bg-theme-settings-input-bg rounded-lg border transition-all duration-300
      ${isExecuting ? 'border-blue-500 animate-pulse shadow-lg shadow-blue-500/20' : ''}
      ${isCompleted ? 'border-green-500 shadow-lg shadow-green-500/20' : ''}
      ${isFailed ? 'border-red-500 shadow-lg shadow-red-500/20' : ''}
      ${hasErrors ? 'border-yellow-500' : 'border-white/10'}
      ${!isExecuting && !isCompleted && !isFailed && !hasErrors ? 'hover:border-white/20' : ''}
    `}>
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3 relative">
          {/* Status Indicator */}
          {(isExecuting || isCompleted || isFailed) && (
            <div className="absolute -left-8">
              {isExecuting && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
              {isCompleted && <CheckCircle size={20} className="text-green-500" />}
              {isFailed && <Warning size={20} className="text-red-500" />}
            </div>
          )}
          
          <div className="w-8 h-8 rounded-full bg-theme-bg-primary border border-white/10 flex items-center justify-center">
            {blockInfo.icon}
          </div>
          <div>
            <h4 className="text-theme-text-primary font-medium flex items-center gap-2">
              {blockInfo.label}
              {hasErrors && (
                <Warning 
                  size={14} 
                  className="text-yellow-500" 
                  data-tooltip-id="validation-error-tooltip"
                  data-tooltip-content={validationErrors?.join(', ')}
                />
              )}
            </h4>
            <p className="text-theme-text-secondary text-xs mt-0.5">
              {blockInfo.getSummary(block.config)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {duplicateBlock && !["flow_info", "start", "finish"].includes(block.id) && (
            <button
              onClick={() => duplicateBlock(block.id)}
              className="p-1.5 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-action-menu-bg rounded transition-colors"
              title="Duplicate block"
            >
              <Copy size={14} />
            </button>
          )}
          {removeBlock && !["flow_info", "start", "finish"].includes(block.id) && (
            <button
              onClick={() => removeBlock(block.id)}
              className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Remove block"
            >
              <X size={14} />
            </button>
          )}
          <button
            onClick={() => toggleBlockExpansion(block.id)}
            className="p-1.5 text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-action-menu-bg rounded transition-colors"
          >
            {block.isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>
        </div>
      </div>

      {block.isExpanded && (
        <div className="px-4 pb-4 border-t border-white/10">
          <div className="mt-4">{renderBlockContent()}</div>
        </div>
      )}
    </div>
  );
}

function AddBlockMenu({ blocks, addBlock }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showMenu]);

  const availableBlocks = Object.entries(BLOCK_INFO).filter(
    ([type]) =>
      ![BLOCK_TYPES.FLOW_INFO, BLOCK_TYPES.START, BLOCK_TYPES.FINISH].includes(type)
  );

  const finishBlockIndex = blocks.findIndex((b) => b.type === BLOCK_TYPES.FINISH);
  const canAddBlock = finishBlockIndex > 0;

  if (!canAddBlock) return null;

  return (
    <div className="relative mt-4">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-theme-text-secondary hover:border-white/40 hover:text-theme-text-primary hover:bg-theme-action-menu-bg/50 transition-all duration-300 flex items-center justify-center gap-2 group"
      >
        <Plus size={20} className="group-hover:scale-110 transition-transform" />
        <span className="font-medium">Add Block</span>
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 right-0 mt-2 bg-theme-settings-input-bg border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden animate-fadeUpIn"
        >
          <div className="p-2">
            <div className="text-xs text-theme-text-secondary px-2 py-1 uppercase tracking-wider">
              Available Blocks
            </div>
            {availableBlocks.map(([type, info]) => (
              <button
                key={type}
                onClick={() => {
                  addBlock(type);
                  setShowMenu(false);
                }}
                className="w-full text-left px-2 py-2 hover:bg-theme-action-menu-bg rounded transition-colors duration-200 flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-theme-bg-primary border border-white/10 flex items-center justify-center group-hover:border-primary-button transition-colors">
                  {info.icon}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-theme-text-primary">
                    {info.label}
                  </div>
                  <div className="text-xs text-theme-text-secondary">
                    {info.description}
                  </div>
                </div>
                <Plus size={16} className="text-theme-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutionPanel({ isOpen, onClose, executionResults, executionStatus }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-theme-bg-secondary border-l border-white/10 shadow-2xl z-40 animate-slideInRight">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-medium text-theme-text-primary flex items-center gap-2">
            <Play size={20} />
            Execution Results
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-theme-action-menu-bg rounded transition-colors"
          >
            <X size={20} className="text-theme-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {executionStatus === 'idle' && (
            <div className="text-center text-theme-text-secondary py-8">
              <Play size={48} className="mx-auto mb-4 opacity-20" />
              <p>Click "Run Flow" to execute the workflow</p>
            </div>
          )}

          {executionStatus === 'running' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ArrowsClockwise size={20} className="animate-spin text-blue-500" />
                <span className="text-theme-text-primary">Executing workflow...</span>
              </div>
              {executionResults.map((result, index) => (
                <div key={index} className="bg-theme-bg-primary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {result.status === 'completed' && <CheckCircle size={16} className="text-green-500" />}
                    {result.status === 'running' && <ArrowsClockwise size={16} className="animate-spin text-blue-500" />}
                    {result.status === 'failed' && <Warning size={16} className="text-red-500" />}
                    <span className="text-sm font-medium text-theme-text-primary">{result.blockName}</span>
                  </div>
                  {result.output && (
                    <pre className="text-xs text-theme-text-secondary bg-black/20 rounded p-2 overflow-x-auto">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {executionStatus === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500 mb-4">
                <CheckCircle size={20} />
                <span className="font-medium">Workflow completed successfully</span>
              </div>
              {executionResults.map((result, index) => (
                <div key={index} className="bg-theme-bg-primary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm font-medium text-theme-text-primary">{result.blockName}</span>
                  </div>
                  {result.output && (
                    <pre className="text-xs text-theme-text-secondary bg-black/20 rounded p-2 overflow-x-auto">
                      {JSON.stringify(result.output, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {executionStatus === 'failed' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-500 mb-4">
                <Warning size={20} />
                <span className="font-medium">Workflow execution failed</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">Error details will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkflowBuilder({ workspace, noteData, onClose }) {
  const [blocks, setBlocks] = useState([]);
  const [availableFlows, setAvailableFlows] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExecutionPanel, setShowExecutionPanel] = useState(false);
  const [executionResults, setExecutionResults] = useState([]);
  const [executionStatus, setExecutionStatus] = useState('idle'); // idle, running, completed, failed
  const [blockExecutionStatus, setBlockExecutionStatus] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  
  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // Initialize workflow
  useEffect(() => {
    console.log("[WorkflowBuilder] Initializing with noteData:", noteData);

    if (noteData?.workflowData?.agentFlowConfig) {
      const agentBlocks = convertAgentFlowBlocks(
        noteData.workflowData.agentFlowConfig
      );
      console.log("[WorkflowBuilder] Converted agent blocks:", agentBlocks);
      setBlocks(agentBlocks);
    } else if (noteData?.workflowData?.blocks) {
      console.log(
        "[WorkflowBuilder] Using existing blocks:",
        noteData.workflowData.blocks
      );
      setBlocks(noteData.workflowData.blocks);
    } else {
      console.log("[WorkflowBuilder] No workflow data found, using default blocks");
      setBlocks(DEFAULT_BLOCKS);
    }

    loadAvailableFlows();
  }, [noteData]);

  // Track unsaved changes
  useEffect(() => {
    if (blocks.length > 0) {
      setHasUnsavedChanges(true);
      
      // Auto-save after 30 seconds of inactivity
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (hasUnsavedChanges) {
          saveFlow(true); // Auto-save silently
        }
      }, 30000);
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [blocks]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveFlow();
      }
      // Cmd+Enter or Ctrl+Enter to run
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runFlow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [blocks]);

  const loadAvailableFlows = async () => {
    try {
      const { success, flows } = await AgentFlows.listFlows();
      if (success) {
        setAvailableFlows(flows);
      }
    } catch (error) {
      console.error("Failed to load flows:", error);
    }
  };

  const convertAgentFlowBlocks = (agentFlow) => {
    const steps = agentFlow?.config?.steps || agentFlow?.steps || [];

    if (!steps || steps.length === 0) {
      console.log("[WorkflowBuilder] No steps found in flow:", agentFlow);
      return DEFAULT_BLOCKS;
    }

    console.log("[WorkflowBuilder] Found steps:", steps);

    const convertedBlocks = [
      {
        id: "flow_info",
        type: BLOCK_TYPES.FLOW_INFO,
        config: {
          name: agentFlow?.config?.name || agentFlow?.name || "",
          description:
            agentFlow?.config?.description || agentFlow?.description || "",
        },
        isExpanded: true,
      },
    ];

    steps.forEach((step, index) => {
      const blockId = step.type === "start" ? "start" : `block_${index}`;
      const block = {
        id: blockId,
        type: step.type,
        config: { ...step.config },
        isExpanded: index < 2, // Expand first few blocks
      };
      convertedBlocks.push(block);
    });

    // Add finish block if not present
    if (!steps.find((s) => s.type === "finish")) {
      convertedBlocks.push({
        id: "finish",
        type: BLOCK_TYPES.FINISH,
        config: {},
        isExpanded: false,
      });
    }

    return convertedBlocks;
  };

  const validateBlocks = () => {
    const errors = {};
    
    blocks.forEach(block => {
      const blockErrors = [];
      
      if (block.type === BLOCK_TYPES.FLOW_INFO) {
        if (!block.config.name?.trim()) blockErrors.push("Flow name is required");
        if (!block.config.description?.trim()) blockErrors.push("Description is required");
      }
      
      if (block.type === BLOCK_TYPES.LLM_INSTRUCTION) {
        if (!block.config.instruction?.trim()) blockErrors.push("Instruction is required");
      }
      
      if (block.type === BLOCK_TYPES.API_CALL) {
        if (!block.config.url?.trim()) blockErrors.push("API URL is required");
      }
      
      if (block.type === BLOCK_TYPES.WEB_SCRAPING) {
        if (!block.config.url?.trim()) blockErrors.push("URL is required");
      }
      
      if (blockErrors.length > 0) {
        errors[block.id] = blockErrors;
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const updateBlockConfig = (blockId, config) => {
    setBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? { ...block, config: { ...block.config, ...config } }
          : block
      )
    );
  };

  const removeBlock = (blockId) => {
    if (["flow_info", "start", "finish"].includes(blockId)) return;
    setBlocks(blocks.filter((block) => block.id !== blockId));
  };

  const duplicateBlock = (blockId) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const blockToDuplicate = blocks[blockIndex];
    const newBlock = {
      ...blockToDuplicate,
      id: `block_${Date.now()}`,
      config: { ...blockToDuplicate.config }
    };
    
    const newBlocks = [...blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    setBlocks(newBlocks);
    
    showToast("Block duplicated", "success");
  };

  const toggleBlockExpansion = (blockId) => {
    setBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? { ...block, isExpanded: !block.isExpanded }
          : block
      )
    );
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `block_${Date.now()}`,
      type,
      config: { ...BLOCK_INFO[type].defaultConfig },
      isExpanded: true,
    };

    // Insert before finish block
    const finishIndex = blocks.findIndex((b) => b.type === BLOCK_TYPES.FINISH);
    const newBlocks = [...blocks];
    newBlocks.splice(finishIndex, 0, newBlock);
    setBlocks(newBlocks);
  };

  const saveFlow = async (isAutoSave = false) => {
    if (!validateBlocks()) {
      showToast("Please fix validation errors before saving", "error");
      return;
    }

    const flowInfoBlock = blocks.find(
      (block) => block.type === BLOCK_TYPES.FLOW_INFO
    );
    const name = flowInfoBlock?.config?.name;
    const description = flowInfoBlock?.config?.description;

    if (!name?.trim() || !description?.trim()) {
      if (!flowInfoBlock.isExpanded) {
        toggleBlockExpansion("flow_info");
      }

      if (!name?.trim()) {
        nameRef.current?.focus();
      } else if (!description?.trim()) {
        descriptionRef.current?.focus();
      }

      showToast(
        "Please provide both a name and description for your flow",
        "error",
        { clear: true }
      );
      return;
    }

    const flowConfig = {
      name,
      description,
      active: true,
      steps: blocks
        .filter(
          (block) =>
            // Only include backend-supported block types
            block.type !== BLOCK_TYPES.FINISH &&
            block.type !== BLOCK_TYPES.FLOW_INFO &&
            [BLOCK_TYPES.START, BLOCK_TYPES.API_CALL, BLOCK_TYPES.LLM_INSTRUCTION, BLOCK_TYPES.WEB_SCRAPING].includes(block.type)
        )
        .map((block) => ({
          type: block.type,
          config: block.config,
        })),
    };

    setIsSaving(true);
    try {
      const { success, error } = await AgentFlows.saveFlow(name, flowConfig);
      if (!success) throw new Error(error);

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      if (!isAutoSave) {
        showToast("Flow saved successfully!", "success", { clear: true });
      }
      
      await loadAvailableFlows();
    } catch (error) {
      console.error("Save error:", error);
      showToast(`Failed to save flow: ${error.message}`, "error", {
        clear: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const runFlow = async () => {
    if (!validateBlocks()) {
      showToast("Please fix validation errors before running", "error");
      return;
    }

    setIsRunning(true);
    setShowExecutionPanel(true);
    setExecutionStatus('running');
    setExecutionResults([]);
    setBlockExecutionStatus({});

    // Simulate workflow execution
    const executableBlocks = blocks.filter(
      b => b.type !== BLOCK_TYPES.FLOW_INFO && b.type !== BLOCK_TYPES.FINISH
    );

    for (let i = 0; i < executableBlocks.length; i++) {
      const block = executableBlocks[i];
      
      // Update block status to executing
      setBlockExecutionStatus(prev => ({
        ...prev,
        [block.id]: 'executing'
      }));

      // Add to execution results
      setExecutionResults(prev => [...prev, {
        blockName: BLOCK_INFO[block.type].label,
        status: 'running',
        output: null
      }]);

      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update block status to completed
      setBlockExecutionStatus(prev => ({
        ...prev,
        [block.id]: 'completed'
      }));

      // Update execution results
      setExecutionResults(prev => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          status: 'completed',
          output: { 
            success: true, 
            data: `Result from ${BLOCK_INFO[block.type].label}` 
          }
        };
        return updated;
      });
    }

    setExecutionStatus('completed');
    setIsRunning(false);
    showToast("Workflow executed successfully!", "success");

    // Clear execution status after 5 seconds
    setTimeout(() => {
      setBlockExecutionStatus({});
    }, 5000);
  };

  const clearFlow = () => {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to clear the flow?")) {
        return;
      }
    }
    setBlocks(DEFAULT_BLOCKS);
    setHasUnsavedChanges(false);
    showToast("Flow cleared", "info");
  };

  const publishFlow = () => {
    showToast("Publishing feature coming soon", "info");
  };

  const flowInfoBlock = blocks.find(
    (block) => block.type === BLOCK_TYPES.FLOW_INFO
  );
  const flowName = flowInfoBlock?.config?.name || "";

  return (
    <div
      className="w-full h-full flex flex-col bg-theme-bg-primary relative"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 0)",
        backgroundSize: "20px 20px",
        backgroundPosition: "-10px -10px",
      }}
    >
      <HeaderMenu
        flowName={flowName}
        availableFlows={availableFlows}
        onNewFlow={clearFlow}
        onSaveFlow={() => saveFlow(false)}
        onRunFlow={runFlow}
        onPublishFlow={publishFlow}
        onClearFlow={clearFlow}
        onClose={onClose}
        isSaving={isSaving}
        isRunning={isRunning}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-3">
              {blocks.map((block) => (
                <BlockNode
                  key={block.id}
                  block={block}
                  updateBlockConfig={updateBlockConfig}
                  removeBlock={removeBlock}
                  duplicateBlock={duplicateBlock}
                  toggleBlockExpansion={toggleBlockExpansion}
                  executionStatus={blockExecutionStatus[block.id]}
                  validationErrors={validationErrors[block.id]}
                  refs={
                    block.type === BLOCK_TYPES.FLOW_INFO
                      ? { nameRef, descriptionRef }
                      : {}
                  }
                />
              ))}
            </div>

            <AddBlockMenu
              blocks={blocks}
              addBlock={addBlock}
            />
          </div>
        </div>
      </div>

      <ExecutionPanel
        isOpen={showExecutionPanel}
        onClose={() => setShowExecutionPanel(false)}
        executionResults={executionResults}
        executionStatus={executionStatus}
      />

      <Tooltip
        id="content-summarization-tooltip"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      >
        <p className="text-sm">
          When enabled, long webpage content will be automatically summarized to
          reduce token usage.
          <br />
          <br />
          Note: This may affect data quality and remove specific details from the
          original content.
        </p>
      </Tooltip>
      
      <Tooltip
        id="validation-error-tooltip"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99 max-w-xs"
      />
    </div>
  );
}