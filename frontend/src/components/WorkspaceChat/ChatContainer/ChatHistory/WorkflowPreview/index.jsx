import React, { useState } from "react";
import { CaretRight, Check, Pencil, X, Copy } from "@phosphor-icons/react";

export default function WorkflowPreview({ 
  workflowData = {},
  onSave = () => {},
  onTest = () => {},
  onEdit = () => {},
  onCancel = () => {}
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [saveName, setSaveName] = useState(workflowData.workflow?.name || "");
  const [showSaveInput, setShowSaveInput] = useState(false);

  if (!workflowData.workflow) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Invalid workflow data</p>
      </div>
    );
  }

  const { workflow, preview, actions = [], workflowId } = workflowData;

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSave(workflowId, saveName);
    setShowSaveInput(false);
  };

  const copyWorkflowId = () => {
    navigator.clipboard.writeText(workflowId);
  };

  return (
    <div className="bg-theme-bg-secondary border border-theme-border rounded-lg p-4 my-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm">📋</span>
          </div>
          <div>
            <h3 className="text-theme-text-primary font-semibold text-lg">
              Workflow Preview
            </h3>
            <p className="text-theme-text-secondary text-sm">
              {workflow.description}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-theme-sidebar-item-hover rounded-lg transition-colors"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            ▶️
          </span>
        </button>
      </div>

      {isExpanded && (
        <>
          {/* Workflow Preview */}
          <div className="bg-theme-bg-primary border border-theme-border rounded-lg p-4 mb-4">
            <pre className="text-theme-text-primary font-mono text-sm whitespace-pre-wrap overflow-x-auto">
              {preview}
            </pre>
          </div>

          {/* Workflow Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-theme-bg-primary rounded-lg p-3 border border-theme-border">
              <h4 className="text-theme-text-primary font-medium mb-2">Details</h4>
              <div className="space-y-1 text-sm">
                <p className="text-theme-text-secondary">
                  <span className="font-medium">Steps:</span> {workflow.stepsCount}
                </p>
                <p className="text-theme-text-secondary">
                  <span className="font-medium">Status:</span> Draft
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-theme-text-secondary">ID:</span>
                  <code className="text-xs bg-theme-bg-secondary px-2 py-1 rounded">
                    {workflowId.substring(0, 8)}...
                  </code>
                  <button
                    onClick={copyWorkflowId}
                    className="p-1 hover:bg-theme-sidebar-item-hover rounded"
                    title="Copy full ID"
                  >
                    <Copy className="w-3 h-3 text-theme-text-secondary" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-theme-bg-primary rounded-lg p-3 border border-theme-border">
              <h4 className="text-theme-text-primary font-medium mb-2">Steps Overview</h4>
              <div className="space-y-1 text-xs">
                {workflow.steps?.filter(s => s.type !== 'start').map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span className="text-theme-text-secondary truncate">
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Save Input */}
          {showSaveInput && (
            <div className="bg-theme-bg-primary border border-theme-border rounded-lg p-4 mb-4">
              <h4 className="text-theme-text-primary font-medium mb-2">Save Workflow</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Enter workflow name..."
                  className="flex-1 bg-theme-bg-secondary border border-theme-border rounded-lg px-3 py-2 text-theme-text-primary placeholder-theme-text-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveInput(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSaveInput(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              <Check className="w-4 h-4" />
              Save Workflow
            </button>
            
            <button
              onClick={() => onTest(workflowId)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <CaretRight className="w-4 h-4" />
              Test Run
            </button>
            
            <button
              onClick={() => onEdit(workflowId)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium"
            >
              <Pencil className="w-4 h-4" />
              Edit Steps
            </button>
            
            <button
              onClick={() => onCancel(workflowId)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>

          {/* Command Examples */}
          {actions.length > 0 && (
            <div className="mt-4 p-3 bg-theme-bg-primary border border-theme-border rounded-lg">
              <h4 className="text-theme-text-primary font-medium mb-2 text-sm">
                💬 Chat Commands:
              </h4>
              <div className="space-y-1">
                {actions.map((action, index) => (
                  <code key={index} className="block text-xs text-theme-text-secondary bg-theme-bg-secondary px-2 py-1 rounded">
                    {action}
                  </code>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}