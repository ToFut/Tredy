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
  Lightning,
  Sparkle,
  Lightbulb,
  Robot,
  MagicWand,
  Target,
  ChartLine,
  Eye,
  EyeSlash,
} from "@phosphor-icons/react";
import AnythingInfinityLogo from "@/media/logo/Tredy Full.png";
import { Tooltip } from "react-tooltip";
import showToast from "@/utils/toast";
import AgentFlows from "@/models/agentFlows";

// AI Assistant Component for Workflow Builder
function AIAssistant({ blocks, onSuggestion, onOptimize, onValidate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeWorkflow = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const analysis = [
        {
          type: "suggestion",
          icon: <Lightbulb size={16} className="text-yellow-500" />,
          title: "Add Error Handling",
          description: "Consider adding error handling blocks after API calls",
          action: () => onSuggestion("error_handling"),
        },
        {
          type: "optimization",
          icon: <ChartLine size={16} className="text-green-500" />,
          title: "Optimize Token Usage",
          description:
            "Your LLM instruction could be more concise to save tokens",
          action: () => onOptimize("token_optimization"),
        },
        {
          type: "validation",
          icon: <CheckCircle size={16} className="text-blue-500" />,
          title: "Missing Variables",
          description: "Some blocks reference undefined variables",
          action: () => onValidate("variables"),
        },
      ];

      setSuggestions(analysis);
    } catch (error) {
      console.error("AI analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (blocks.length > 0) {
      analyzeWorkflow();
    }
  }, [blocks]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`bg-white border border-gray-200 rounded-2xl shadow-xl transition-all duration-300 ${
          isOpen ? "w-80 h-96" : "w-16 h-16"
        }`}
      >
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all group relative overflow-hidden"
          >
            <Robot
              size={24}
              className="group-hover:scale-110 transition-transform"
            />
            {suggestions.length > 0 && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                {suggestions.length}
              </div>
            )}
          </button>
        ) : (
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Robot size={20} className="text-purple-600" />
                <h3 className="font-semibold text-gray-800">AI Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {isAnalyzing ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Analyzing workflow...</span>
                  </div>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={suggestion.action}
                  >
                    <div className="flex items-start gap-2">
                      {suggestion.icon}
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800 mb-1">
                          {suggestion.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Sparkle size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No suggestions yet</p>
                  <p className="text-xs">Add more blocks to get AI insights</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={analyzeWorkflow}
                disabled={isAnalyzing}
                className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <MagicWand size={14} />
                {isAnalyzing ? "Analyzing..." : "Re-analyze"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
    icon: Info,
    description: "Basic flow information",
    defaultConfig: {
      name: "",
      description: "",
    },
    getSummary: (config) => config.name || "Untitled Flow",
  },
  [BLOCK_TYPES.START]: {
    label: "Flow Variables",
    icon: BracketsCurly,
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
    icon: Globe,
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
    icon: Brain,
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
    icon: Globe,
    description: "Extract content from websites",
    defaultConfig: {
      url: "",
      resultVariable: "",
      directOutput: false,
    },
    getSummary: (config) => config.url || "No URL specified",
  },
  [BLOCK_TYPES.TOOL_CALL]: {
    label: "Tool Call",
    icon: Lightning,
    description: "Execute MCP/Agent tools and functions",
    defaultConfig: {
      toolName: "",
      parameters: {},
      resultVariable: "",
      directOutput: false,
    },
    getSummary: (config) => config.toolName || "No tool specified",
  },
  [BLOCK_TYPES.FINISH]: {
    label: "Flow Complete",
    icon: Flag,
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

// Unified Modern Header Component
function UnifiedHeader({
  flowName,
  blockCount,
  onClose,
  onSaveFlow,
  onRunFlow,
  onClearFlow,
  isSaving,
  isRunning,
  hasUnsavedChanges,
  lastSaved,
  showAIAssistant,
  onToggleAIAssistant,
}) {
  const [showActions, setShowActions] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    const now = new Date();
    const saved = new Date(lastSaved);
    const diffMs = now - saved;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Saved just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} min ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1h ago";
    if (diffHours < 24) return `${diffHours}h ago`;

    return saved.toLocaleDateString();
  };

  return (
    <div className="relative bg-white/95 backdrop-blur-md border-b border-gray-200/40 shadow-sm">
      {/* Elegant gradient accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />

      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Navigation & Flow Info */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle */}
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100/80 rounded-xl transition-all duration-200 hover:scale-105 group"
            title="Back to Flow Panel"
          >
            <CaretLeft
              size={18}
              className="text-gray-600 group-hover:text-purple-600 transition-colors"
            />
          </button>

          {/* Flow Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200/70 rounded-xl flex items-center justify-center shadow-sm">
              <Wrench size={18} className="text-purple-700" />
            </div>

            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-tight">
                {flowName || "New Workflow"}
              </h1>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                  {blockCount} blocks
                </span>
                {lastSaved && (
                  <span className="flex items-center gap-1">
                    <CheckCircle size={12} className="text-green-500" />
                    {formatLastSaved()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200/60 rounded-lg">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-amber-700">
                Unsaved
              </span>
            </div>
          )}

          {/* AI Assistant Toggle */}
          <button
            onClick={onToggleAIAssistant}
            className={`p-2.5 rounded-xl transition-all duration-200 hover:scale-105 group ${
              showAIAssistant
                ? "bg-purple-100 text-purple-600"
                : "hover:bg-gray-100/80 text-gray-600"
            }`}
            title={showAIAssistant ? "Hide AI Assistant" : "Show AI Assistant"}
          >
            <Robot
              size={18}
              className="group-hover:scale-110 transition-transform"
            />
          </button>

          {/* Primary Actions */}
          <button
            onClick={onRunFlow}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-green-200/50 disabled:hover:shadow-none"
          >
            {isRunning ? (
              <>
                <ArrowsClockwise size={16} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={16} weight="fill" />
                Run
              </>
            )}
          </button>

          <button
            onClick={onSaveFlow}
            disabled={isSaving || !hasUnsavedChanges}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-purple-200/50 disabled:hover:shadow-none"
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

          {/* More Actions */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
              title="More actions"
            >
              <CaretDown
                size={16}
                className={`transition-transform duration-200 ${showActions ? "rotate-180" : ""}`}
              />
            </button>

            {showActions && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white/95 backdrop-blur-md border border-gray-200/60 rounded-xl shadow-xl z-50 overflow-hidden">
                <button
                  onClick={() => {
                    onClearFlow();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50/80 transition-colors flex items-center gap-3"
                >
                  <Trash size={16} />
                  Clear Flow
                </button>
              </div>
            )}
          </div>
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
  validationErrors,
  isFirst,
  isLast,
}) {
  const blockInfo = BLOCK_INFO[block.type];
  if (!blockInfo) return null;

  const hasErrors = validationErrors && validationErrors.length > 0;
  const isExecuting = executionStatus === "executing";
  const isCompleted = executionStatus === "completed";
  const isFailed = executionStatus === "failed";

  // Determine block color based on type
  const getBlockColor = () => {
    switch (block.type) {
      case BLOCK_TYPES.API_CALL:
        return "from-blue-500 to-blue-600";
      case BLOCK_TYPES.LLM_INSTRUCTION:
        return "from-purple-500 to-purple-600";
      case BLOCK_TYPES.WEB_SCRAPING:
        return "from-green-500 to-green-600";
      case BLOCK_TYPES.TOOL_CALL:
        return "from-orange-500 to-orange-600";
      case BLOCK_TYPES.START:
        return "from-gray-500 to-gray-600";
      case BLOCK_TYPES.FINISH:
        return "from-red-500 to-red-600";
      case BLOCK_TYPES.FLOW_INFO:
        return "from-indigo-500 to-indigo-600";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  const getStatusColor = () => {
    if (isExecuting) return "ring-4 ring-blue-400 ring-opacity-50 animate-pulse";
    if (isCompleted) return "ring-4 ring-green-400 ring-opacity-50";
    if (isFailed) return "ring-4 ring-red-400 ring-opacity-50";
    if (hasErrors) return "ring-4 ring-amber-400 ring-opacity-50";
    return "";
  };

  const renderBlockContent = () => {
    switch (block.type) {
      case BLOCK_TYPES.FLOW_INFO:
        return (
          <div className="space-y-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-700">
                  Flow Name *
                </label>
                <button
                  onClick={() => suggestFlowName()}
                  className="text-xs text-purple-600 hover:text-purple-700 font-medium hover:underline"
                  title="Suggest name based on workflow blocks"
                >
                  Suggest Name
                </button>
              </div>
              <input
                type="text"
                value={block.config.name || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { name: e.target.value })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="Enter flow name..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Description *
              </label>
              <textarea
                value={block.config.description || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { description: e.target.value })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="Describe what this flow does..."
                rows={2}
              />
            </div>
          </div>
        );

      case BLOCK_TYPES.START:
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-gray-700">
                Variables
              </label>
              <button
                onClick={() => {
                  const variables = [...(block.config.variables || [])];
                  variables.push({ name: "", value: "" });
                  updateBlockConfig(block.id, { variables });
                }}
                className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
              >
                Add Variable
              </button>
            </div>
            {(block.config.variables || []).map((variable, index) => (
              <div key={index} className="flex gap-1.5 items-center">
                <input
                  type="text"
                  value={variable.name || ""}
                  onChange={(e) => {
                    const variables = [...block.config.variables];
                    variables[index] = {
                      ...variables[index],
                      name: e.target.value,
                    };
                    updateBlockConfig(block.id, { variables });
                  }}
                  className="flex-1 border border-gray-200 bg-white text-gray-800 text-sm rounded-lg focus:outline-none focus:border-purple-400 p-1.5"
                  placeholder="Variable name"
                />
                <input
                  type="text"
                  value={variable.value || ""}
                  onChange={(e) => {
                    const variables = [...block.config.variables];
                    variables[index] = {
                      ...variables[index],
                      value: e.target.value,
                    };
                    updateBlockConfig(block.id, { variables });
                  }}
                  className="flex-1 border border-gray-200 bg-white text-gray-800 text-sm rounded-lg focus:outline-none focus:border-purple-400 p-1.5"
                  placeholder="Default value"
                />
                <button
                  onClick={() => {
                    const variables = [...block.config.variables];
                    variables.splice(index, 1);
                    updateBlockConfig(block.id, { variables });
                  }}
                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        );

      case BLOCK_TYPES.LLM_INSTRUCTION:
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Instruction *
              </label>
              <textarea
                value={block.config.instruction || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { instruction: e.target.value })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="Enter AI instruction..."
                rows={3}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Result Variable
              </label>
              <input
                type="text"
                value={block.config.resultVariable || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, {
                    resultVariable: e.target.value,
                  })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="Variable to store result"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block.config.directOutput || false}
                onChange={(e) =>
                  updateBlockConfig(block.id, {
                    directOutput: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <label className="text-xs text-gray-700">
                Direct output (bypass further LLM processing)
              </label>
            </div>
          </div>
        );

      case BLOCK_TYPES.API_CALL:
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                API URL *
              </label>
              <input
                type="url"
                value={block.config.url || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { url: e.target.value })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Method
              </label>
              <select
                value={block.config.method || "GET"}
                onChange={(e) =>
                  updateBlockConfig(block.id, { method: e.target.value })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Response Variable
              </label>
              <input
                type="text"
                value={block.config.responseVariable || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, {
                    responseVariable: e.target.value,
                  })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="Variable to store response"
              />
            </div>
          </div>
        );

      case BLOCK_TYPES.WEB_SCRAPING:
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                URL to Scrape *
              </label>
              <input
                type="url"
                value={block.config.url || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { url: e.target.value })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="https://example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Result Variable
              </label>
              <input
                type="text"
                value={block.config.resultVariable || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, {
                    resultVariable: e.target.value,
                  })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="Variable to store scraped content"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block.config.directOutput || false}
                onChange={(e) =>
                  updateBlockConfig(block.id, {
                    directOutput: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <label className="text-xs text-gray-700">
                Direct output (return content directly to chat)
              </label>
            </div>
          </div>
        );

      case BLOCK_TYPES.TOOL_CALL:
        return (
          <div className="space-y-2">
            {/* Show metadata if available */}
            {block.metadata && (
              <div className="p-2 bg-theme-bg-primary/50 rounded-lg text-xs text-theme-text-secondary mb-3">
                <div className="flex items-center gap-2">
                  {block.metadata.icon && <span>{block.metadata.icon}</span>}
                  {block.metadata.name && (
                    <span className="font-medium">{block.metadata.name}</span>
                  )}
                </div>
                {block.metadata.description && (
                  <div className="mt-1 text-[10px] opacity-80">
                    {block.metadata.description}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Tool Name *
              </label>
              <input
                type="text"
                value={block.config.toolName || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, { toolName: e.target.value })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="e.g., gmail_ws6-send_email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Parameters (JSON)
              </label>
              <textarea
                value={JSON.stringify(block.config.parameters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const params = JSON.parse(e.target.value);
                    updateBlockConfig(block.id, { parameters: params });
                  } catch (error) {
                    // Invalid JSON, don't update
                  }
                }}
                className="w-full border border-gray-200 bg-white text-gray-800 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2 font-mono"
                rows={3}
                placeholder='{"to": "user@example.com", "body": "Message"}'
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-700">
                Result Variable
              </label>
              <input
                type="text"
                value={block.config.resultVariable || ""}
                onChange={(e) =>
                  updateBlockConfig(block.id, {
                    resultVariable: e.target.value,
                  })
                }
                className="w-full border border-gray-200 bg-white text-gray-800 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 p-2"
                placeholder="Variable to store tool result"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={block.config.directOutput || false}
                onChange={(e) =>
                  updateBlockConfig(block.id, {
                    directOutput: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
              <label className="text-xs text-gray-700">
                Direct output (bypass LLM processing)
              </label>
            </div>
          </div>
        );

      case BLOCK_TYPES.FINISH:
        return (
          <div className="text-sm text-gray-600">
            This block marks the end of the workflow. All results will be
            collected and returned.
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Connection line from previous block */}
      {!isFirst && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
          <div className="w-0.5 h-8 bg-gradient-to-b from-gray-200 to-gray-400" />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          </div>
        </div>
      )}

      {/* Main node container */}
      <div className="relative group">
        <div
          className={`
            relative bg-white rounded-2xl shadow-lg transition-all duration-200
            hover:shadow-xl hover:scale-[1.01] ${getStatusColor()}
          `}
        >
          {/* Node header with gradient background */}
          <div className={`rounded-t-2xl bg-gradient-to-r ${getBlockColor()} p-1`}>
            <div className="bg-white bg-opacity-95 rounded-t-xl px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Icon with colored background */}
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getBlockColor()} flex items-center justify-center text-white shadow-md`}>
                    {React.createElement(blockInfo.icon, { size: 16, className: "text-white" })}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">
                      {block.metadata?.name || blockInfo.label}
                    </h4>
                    {/* Quick summary pill */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {blockInfo.getSummary(block.config)}
                      </span>
                      {hasErrors && (
                        <Warning size={12} className="text-amber-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  {duplicateBlock && !["flow_info", "start", "finish"].includes(block.id) && (
                    <button
                      onClick={() => duplicateBlock(block.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Duplicate"
                    >
                      <Copy size={14} className="text-gray-500" />
                    </button>
                  )}
                  {removeBlock && !["flow_info", "start", "finish"].includes(block.id) && (
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove"
                    >
                      <X size={14} className="text-red-500" />
                    </button>
                  )}
                  <button
                    onClick={() => toggleBlockExpansion(block.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {block.isExpanded ? (
                      <CaretUp size={14} className="text-gray-600" />
                    ) : (
                      <CaretDown size={14} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Node body - expandable content */}
          {block.isExpanded && (
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="text-sm">
                {renderBlockContent()}
              </div>
            </div>
          )}

          {/* Status indicators */}
          {(isExecuting || isCompleted || isFailed) && (
            <div className="absolute -right-2 -top-2">
              {isExecuting && (
                <div className="w-6 h-6 bg-blue-500 rounded-full animate-ping" />
              )}
              {isCompleted && (
                <CheckCircle size={20} className="text-green-500 bg-white rounded-full" />
              )}
              {isFailed && (
                <Warning size={20} className="text-red-500 bg-white rounded-full" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Connection line to next block */}
      {!isLast && (
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
          <div className="w-0.5 h-8 bg-gradient-to-b from-gray-400 to-gray-200" />
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
      ![BLOCK_TYPES.FLOW_INFO, BLOCK_TYPES.START, BLOCK_TYPES.FINISH].includes(
        type
      )
  );

  const finishBlockIndex = blocks.findIndex(
    (b) => b.type === BLOCK_TYPES.FINISH
  );
  const canAddBlock = finishBlockIndex > 0;

  if (!canAddBlock) return null;

  return (
    <div className="relative mt-4">
      {/* Connection line from last block */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
        <div className="w-0.5 h-8 bg-gradient-to-b from-gray-200 to-transparent" />
      </div>

      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-24 h-24 mx-auto flex items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
      >
        <Plus size={24} className="text-gray-400 group-hover:text-purple-600 group-hover:scale-110 transition-all" />
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          className="absolute top-full left-1/2 transform -translate-x-1/2 mt-4 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden min-w-[320px]"
        >
          <div className="p-3">
            <div className="text-xs font-semibold text-gray-500 px-2 pb-2 border-b border-gray-100 mb-2">
              CHOOSE BLOCK TYPE
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availableBlocks.map(([type, info]) => {
                const getBlockColor = () => {
                  switch (type) {
                    case BLOCK_TYPES.API_CALL:
                      return "from-blue-500 to-blue-600";
                    case BLOCK_TYPES.LLM_INSTRUCTION:
                      return "from-purple-500 to-purple-600";
                    case BLOCK_TYPES.WEB_SCRAPING:
                      return "from-green-500 to-green-600";
                    case BLOCK_TYPES.TOOL_CALL:
                      return "from-orange-500 to-orange-600";
                    default:
                      return "from-gray-400 to-gray-500";
                  }
                };

                return (
                  <button
                    key={type}
                    onClick={() => {
                      addBlock(type);
                      setShowMenu(false);
                    }}
                    className="flex flex-col items-center gap-2 p-4 hover:bg-gray-50 rounded-lg transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getBlockColor()} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                      {React.createElement(info.icon, { size: 20, className: "text-white" })}
                    </div>
                    <div className="text-xs font-medium text-gray-700 text-center">
                      {info.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExecutionPanel({
  isOpen,
  onClose,
  executionResults,
  executionStatus,
}) {
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
          {executionStatus === "idle" && (
            <div className="text-center text-theme-text-secondary py-8">
              <Play size={48} className="mx-auto mb-4 opacity-20" />
              <p>Click "Run Flow" to execute the workflow</p>
            </div>
          )}

          {executionStatus === "running" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ArrowsClockwise
                  size={20}
                  className="animate-spin text-blue-500"
                />
                <span className="text-theme-text-primary">
                  Executing workflow...
                </span>
              </div>
              {executionResults.map((result, index) => (
                <div key={index} className="bg-theme-bg-primary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {result.status === "completed" && (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                    {result.status === "running" && (
                      <ArrowsClockwise
                        size={16}
                        className="animate-spin text-blue-500"
                      />
                    )}
                    {result.status === "failed" && (
                      <Warning size={16} className="text-red-500" />
                    )}
                    <span className="text-sm font-medium text-theme-text-primary">
                      {result.blockName}
                    </span>
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

          {executionStatus === "completed" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-500 mb-4">
                <CheckCircle size={20} />
                <span className="font-medium">
                  Workflow completed successfully
                </span>
              </div>
              {executionResults.map((result, index) => (
                <div key={index} className="bg-theme-bg-primary rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span className="text-sm font-medium text-theme-text-primary">
                      {result.blockName}
                    </span>
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

          {executionStatus === "failed" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-500 mb-4">
                <Warning size={20} />
                <span className="font-medium">Workflow execution failed</span>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">
                  Error details will appear here
                </p>
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
  const [executionStatus, setExecutionStatus] = useState("idle"); // idle, running, completed, failed
  const [blockExecutionStatus, setBlockExecutionStatus] = useState({});
  const [validationErrors, setValidationErrors] = useState({});
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [smartSuggestions, setSmartSuggestions] = useState([]);

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
      console.log(
        "[WorkflowBuilder] No workflow data found, using default blocks"
      );
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
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveFlow();
      }
      // Cmd+Enter or Ctrl+Enter to run
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runFlow();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
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
    console.log("[WorkflowBuilder] Converting agent flow:", agentFlow);

    // Check for visualBlocks first (new format with better metadata)
    if (agentFlow?.visualBlocks && Array.isArray(agentFlow.visualBlocks)) {
      console.log(
        "[WorkflowBuilder] Using visualBlocks:",
        agentFlow.visualBlocks
      );

      const convertedBlocks = [
        {
          id: "flow_info",
          type: BLOCK_TYPES.FLOW_INFO,
          config: {
            name: agentFlow?.name || "",
            description: agentFlow?.description || "",
          },
          isExpanded: true,
        },
      ];

      // Convert visual blocks, filtering out start/complete blocks
      agentFlow.visualBlocks.forEach((vBlock, index) => {
        if (vBlock.type === "start" || vBlock.type === "complete") {
          return; // Skip start and complete blocks
        }

        // Map visual block type to WorkflowBuilder block type
        let blockType = BLOCK_TYPES.LLM_INSTRUCTION; // default
        if (vBlock.type === "toolCall") {
          blockType = BLOCK_TYPES.TOOL_CALL;
        } else if (vBlock.type === "apiCall") {
          blockType = BLOCK_TYPES.API_CALL;
        } else if (vBlock.type === "webScraping") {
          blockType = BLOCK_TYPES.WEB_SCRAPING;
        } else if (vBlock.type === "llmInstruction") {
          blockType = BLOCK_TYPES.LLM_INSTRUCTION;
        }

        // Find corresponding step config
        const stepIndex = parseInt(vBlock.id.replace("step_", "")) - 1;
        const step = agentFlow.steps?.[stepIndex + 1]; // +1 to skip start step

        const block = {
          id: vBlock.id || `block_${index}`,
          type: blockType,
          config: step?.config || {},
          metadata: {
            name: vBlock.name,
            description: vBlock.description,
            icon: vBlock.icon,
            tool: vBlock.tool,
            status: vBlock.status,
          },
          isExpanded: index < 2, // Expand first few blocks
        };

        convertedBlocks.push(block);
      });

      // Add finish block
      convertedBlocks.push({
        id: "finish",
        type: BLOCK_TYPES.FINISH,
        config: {},
        isExpanded: false,
      });

      console.log(
        "[WorkflowBuilder] Converted blocks from visualBlocks:",
        convertedBlocks
      );
      return convertedBlocks;
    }

    // Fallback to steps array
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
      // Skip start step
      if (step.type === "start") return;

      // Map step type to block type
      let blockType = BLOCK_TYPES.LLM_INSTRUCTION; // default
      if (step.type === "toolCall") {
        blockType = BLOCK_TYPES.TOOL_CALL;
      } else if (step.type === "apiCall") {
        blockType = BLOCK_TYPES.API_CALL;
      } else if (step.type === "webScraping") {
        blockType = BLOCK_TYPES.WEB_SCRAPING;
      } else if (step.type === "llmInstruction") {
        blockType = BLOCK_TYPES.LLM_INSTRUCTION;
      }

      const block = {
        id: `block_${index}`,
        type: blockType,
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

    console.log(
      "[WorkflowBuilder] Converted blocks from steps:",
      convertedBlocks
    );
    return convertedBlocks;
  };

  const validateBlocks = () => {
    const errors = {};

    blocks.forEach((block) => {
      const blockErrors = [];

      if (block.type === BLOCK_TYPES.FLOW_INFO) {
        if (!block.config.name?.trim())
          blockErrors.push("Flow name is required");
        if (!block.config.description?.trim())
          blockErrors.push("Description is required");
      }

      if (block.type === BLOCK_TYPES.LLM_INSTRUCTION) {
        if (!block.config.instruction?.trim())
          blockErrors.push("Instruction is required");
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
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) return;

    const blockToDuplicate = blocks[blockIndex];
    const newBlock = {
      ...blockToDuplicate,
      id: `block_${Date.now()}`,
      config: { ...blockToDuplicate.config },
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
    
    // Auto-suggest name if flow info block is empty
    suggestFlowName(newBlocks);
  };

  const suggestFlowName = (blocksToAnalyze = blocks) => {
    const flowInfoBlock = blocksToAnalyze.find(block => block.type === BLOCK_TYPES.FLOW_INFO);
    if (!flowInfoBlock || flowInfoBlock.config.name.trim()) return;
    
    const suggestedName = generateSmartFlowName(blocksToAnalyze);
    if (suggestedName) {
      setBlocks(prevBlocks => 
        prevBlocks.map(block => 
          block.type === BLOCK_TYPES.FLOW_INFO 
            ? { ...block, config: { ...block.config, name: suggestedName } }
            : block
        )
      );
    }
  };

  const generateSmartFlowName = (blocksToAnalyze) => {
    const nonInfoBlocks = blocksToAnalyze.filter(block => 
      block.type !== BLOCK_TYPES.FLOW_INFO && block.type !== BLOCK_TYPES.FINISH
    );
    
    if (nonInfoBlocks.length === 0) return null;
    
    // Analyze block types to determine category and action
    const blockTypes = nonInfoBlocks.map(block => block.type);
    const hasApiCall = blockTypes.includes(BLOCK_TYPES.API_CALL);
    const hasWebScraping = blockTypes.includes(BLOCK_TYPES.WEB_SCRAPING);
    const hasLLMInstruction = blockTypes.includes(BLOCK_TYPES.LLM_INSTRUCTION);
    
    // Generate name based on block composition
    if (hasWebScraping && hasLLMInstruction) {
      return "Website Data Analysis";
    }
    
    if (hasWebScraping) {
      return "Web Scraping Automation";
    }
    
    if (hasApiCall && hasLLMInstruction) {
      return "API Data Processing";
    }
    
    if (hasApiCall) {
      return "API Integration Workflow";
    }
    
    if (hasLLMInstruction) {
      return "AI Content Processing";
    }
    
    // Default based on number of blocks
    if (nonInfoBlocks.length === 1) {
      return "Simple Automation";
    } else if (nonInfoBlocks.length <= 3) {
      return "Multi-Step Workflow";
    } else {
      return "Complex Automation Pipeline";
    }
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
            [
              BLOCK_TYPES.START,
              BLOCK_TYPES.API_CALL,
              BLOCK_TYPES.LLM_INSTRUCTION,
              BLOCK_TYPES.WEB_SCRAPING,
            ].includes(block.type)
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
    setExecutionStatus("running");
    setExecutionResults([]);
    setBlockExecutionStatus({});

    // Simulate workflow execution
    const executableBlocks = blocks.filter(
      (b) => b.type !== BLOCK_TYPES.FLOW_INFO && b.type !== BLOCK_TYPES.FINISH
    );

    for (let i = 0; i < executableBlocks.length; i++) {
      const block = executableBlocks[i];

      // Update block status to executing
      setBlockExecutionStatus((prev) => ({
        ...prev,
        [block.id]: "executing",
      }));

      // Add to execution results
      setExecutionResults((prev) => [
        ...prev,
        {
          blockName: BLOCK_INFO[block.type].label,
          status: "running",
          output: null,
        },
      ]);

      // Simulate execution delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update block status to completed
      setBlockExecutionStatus((prev) => ({
        ...prev,
        [block.id]: "completed",
      }));

      // Update execution results
      setExecutionResults((prev) => {
        const updated = [...prev];
        updated[i] = {
          ...updated[i],
          status: "completed",
          output: {
            success: true,
            data: `Result from ${BLOCK_INFO[block.type].label}`,
          },
        };
        return updated;
      });
    }

    setExecutionStatus("completed");
    setIsRunning(false);
    showToast("Workflow executed successfully!", "success");

    // Clear execution status after 5 seconds
    setTimeout(() => {
      setBlockExecutionStatus({});
    }, 5000);
  };

  const clearFlow = () => {
    if (hasUnsavedChanges) {
      if (
        !confirm(
          "You have unsaved changes. Are you sure you want to clear the flow?"
        )
      ) {
        return;
      }
    }
    setBlocks(DEFAULT_BLOCKS);
    setHasUnsavedChanges(false);
    showToast("Flow cleared", "info");
  };

  // AI Assistant handlers
  const handleAISuggestion = (suggestionType) => {
    switch (suggestionType) {
      case "error_handling":
        // Add error handling block after API calls
        const apiCallBlocks = blocks.filter(
          (block) => block.type === BLOCK_TYPES.API_CALL
        );
        if (apiCallBlocks.length > 0) {
          showToast("Adding error handling blocks...", "info");
          // Implementation would add error handling blocks
        }
        break;
      case "token_optimization":
        // Optimize LLM instructions
        const llmBlocks = blocks.filter(
          (block) => block.type === BLOCK_TYPES.LLM_INSTRUCTION
        );
        if (llmBlocks.length > 0) {
          showToast(
            "Optimizing LLM instructions for token efficiency...",
            "info"
          );
          // Implementation would optimize instructions
        }
        break;
      case "variables":
        // Check for undefined variables
        showToast("Checking variable references...", "info");
        // Implementation would validate variables
        break;
      default:
        showToast("AI suggestion applied", "success");
    }
  };

  const handleAIOptimize = (optimizationType) => {
    showToast(`Applying ${optimizationType} optimization...`, "info");
    // Implementation would apply optimizations
  };

  const handleAIValidate = (validationType) => {
    showToast(`Running ${validationType} validation...`, "info");
    // Implementation would run validation
  };

  const publishFlow = () => {
    showToast("Publishing feature coming soon", "info");
  };

  const flowInfoBlock = blocks.find(
    (block) => block.type === BLOCK_TYPES.FLOW_INFO
  );
  const flowName = flowInfoBlock?.config?.name || "";

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-gray-50/30 via-white/95 to-purple-50/20 relative">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "30px 30px",
        }}
      />
      <UnifiedHeader
        flowName={flowName}
        blockCount={blocks.length}
        onClose={onClose}
        onSaveFlow={() => saveFlow(false)}
        onRunFlow={runFlow}
        onClearFlow={clearFlow}
        isSaving={isSaving}
        isRunning={isRunning}
        lastSaved={lastSaved}
        hasUnsavedChanges={hasUnsavedChanges}
        showAIAssistant={showAIAssistant}
        onToggleAIAssistant={() => setShowAIAssistant(!showAIAssistant)}
      />

      <div className="flex-1 flex overflow-hidden">
        <div
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          <div className="max-w-3xl mx-auto p-4">
            <div className="space-y-2">
              {blocks.map((block, index) => (
                <BlockNode
                  key={block.id}
                  block={block}
                  updateBlockConfig={updateBlockConfig}
                  removeBlock={removeBlock}
                  duplicateBlock={duplicateBlock}
                  toggleBlockExpansion={toggleBlockExpansion}
                  executionStatus={blockExecutionStatus[block.id]}
                  validationErrors={validationErrors[block.id]}
                  isFirst={index === 0}
                  isLast={index === blocks.length - 1}
                  refs={
                    block.type === BLOCK_TYPES.FLOW_INFO
                      ? { nameRef, descriptionRef }
                      : {}
                  }
                />
              ))}
            </div>

            <AddBlockMenu blocks={blocks} addBlock={addBlock} />
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
          Note: This may affect data quality and remove specific details from
          the original content.
        </p>
      </Tooltip>

      <Tooltip
        id="validation-error-tooltip"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99 max-w-xs"
      />

      {/* AI Assistant */}
      {showAIAssistant && (
        <AIAssistant
          blocks={blocks}
          onSuggestion={handleAISuggestion}
          onOptimize={handleAIOptimize}
          onValidate={handleAIValidate}
        />
      )}
    </div>
  );
}
