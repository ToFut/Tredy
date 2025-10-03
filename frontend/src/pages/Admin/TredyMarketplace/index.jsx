import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import TredyAdmin from "@/models/tredyAdmin";
import showToast from "@/utils/toast";

export default function TredyMarketplaceAdmin() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("items");
  const [items, setItems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createType, setCreateType] = useState("agent-skill");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [itemsRes, analyticsRes] = await Promise.all([
        TredyAdmin.listItems(),
        TredyAdmin.getAnalytics(),
      ]);

      if (itemsRes.success) {
        setItems(itemsRes.items);
      } else {
        showToast(itemsRes.error || "Failed to load items", "error");
      }

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showToast("Failed to load marketplace data", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(itemId) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const res = await TredyAdmin.deleteItem(itemId);
    if (res.success) {
      showToast("Item deleted successfully", "success");
      fetchData();
    } else {
      showToast(res.error || "Failed to delete item", "error");
    }
  }

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-sidebar flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-sidebar flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-main-gradient w-full h-full overflow-y-scroll"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          {/* Header */}
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white border-b-2 border-opacity-10">
            <div className="items-center flex gap-x-4">
              <p className="text-lg leading-6 font-bold text-white">
                Tredy Marketplace Admin
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-white text-opacity-60">
              Manage marketplace items, create paid skills, and view analytics
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-white border-opacity-10">
            <button
              onClick={() => setActiveTab("items")}
              className={`px-4 py-2 font-medium ${
                activeTab === "items"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-white text-opacity-60 hover:text-opacity-100"
              }`}
            >
              Marketplace Items ({items.length})
            </button>
            <button
              onClick={() => setActiveTab("create")}
              className={`px-4 py-2 font-medium ${
                activeTab === "create"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-white text-opacity-60 hover:text-opacity-100"
              }`}
            >
              Create New
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 font-medium ${
                activeTab === "analytics"
                  ? "text-white border-b-2 border-blue-500"
                  : "text-white text-opacity-60 hover:text-opacity-100"
              }`}
            >
              Analytics
            </button>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "items" && (
              <ItemsList items={items} onDelete={handleDelete} onRefresh={fetchData} />
            )}
            {activeTab === "create" && (
              <CreateForm onSuccess={() => {
                fetchData();
                setActiveTab("items");
              }} />
            )}
            {activeTab === "analytics" && <Analytics data={analytics} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Items List Component
function ItemsList({ items, onDelete, onRefresh }) {
  const [filter, setFilter] = useState("all");

  const filteredItems = items.filter((item) =>
    filter === "all" ? true : item.item_type === filter
  );

  return (
    <div>
      {/* Filter */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg ${
            filter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white bg-opacity-10 text-white text-opacity-60"
          }`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setFilter("agent-skill")}
          className={`px-4 py-2 rounded-lg ${
            filter === "agent-skill"
              ? "bg-blue-600 text-white"
              : "bg-white bg-opacity-10 text-white text-opacity-60"
          }`}
        >
          Agent Skills
        </button>
        <button
          onClick={() => setFilter("system-prompt")}
          className={`px-4 py-2 rounded-lg ${
            filter === "system-prompt"
              ? "bg-blue-600 text-white"
              : "bg-white bg-opacity-10 text-white text-opacity-60"
          }`}
        >
          System Prompts
        </button>
        <button
          onClick={() => setFilter("slash-command")}
          className={`px-4 py-2 rounded-lg ${
            filter === "slash-command"
              ? "bg-blue-600 text-white"
              : "bg-white bg-opacity-10 text-white text-opacity-60"
          }`}
        >
          Slash Commands
        </button>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length === 0 ? (
          <p className="text-white text-opacity-60 col-span-full text-center py-8">
            No items found. Create your first marketplace item to get started.
          </p>
        ) : (
          filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onDelete={onDelete} onRefresh={onRefresh} />
          ))
        )}
      </div>
    </div>
  );
}

// Item Card Component
function ItemCard({ item, onDelete, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState((item.price_cents || 0) / 100);

  async function handleUpdatePrice() {
    const res = await TredyAdmin.updateItem(item.id, {
      price_cents: parseInt(price * 100),
    });

    if (res.success) {
      showToast("Price updated successfully", "success");
      setEditing(false);
      onRefresh();
    } else {
      showToast(res.error || "Failed to update price", "error");
    }
  }

  return (
    <div className="bg-white bg-opacity-10 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg">{item.name}</h3>
          <p className="text-white text-opacity-60 text-sm">{item.item_type}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs ${
            item.visibility === "public"
              ? "bg-green-600 text-white"
              : "bg-yellow-600 text-white"
          }`}
        >
          {item.visibility}
        </span>
      </div>

      <p className="text-white text-opacity-80 text-sm mb-3 line-clamp-2">
        {item.description}
      </p>

      {/* Price */}
      <div className="mb-3">
        {editing ? (
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 px-2 py-1 bg-zinc-900 text-white rounded text-sm"
              placeholder="Price ($)"
            />
            <button
              onClick={handleUpdatePrice}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-lg">
              {item.price_cents > 0 ? `$${((item.price_cents || 0) / 100).toFixed(2)}` : "Free"}
            </span>
            <button
              onClick={() => setEditing(true)}
              className="text-blue-400 text-sm hover:underline"
            >
              Edit Price
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDelete(item.id)}
          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// Create Form Component
function CreateForm({ onSuccess }) {
  const [type, setType] = useState("agent-skill");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("0");
  const [visibility, setVisibility] = useState("public");
  const [file, setFile] = useState(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Workflow-specific fields
  const [isScheduled, setIsScheduled] = useState(false);
  const [cronExpression, setCronExpression] = useState("");
  const [cronPreset, setCronPreset] = useState("* * * * *"); // Default: every minute
  const [customCron, setCustomCron] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState([]);

  // Selection mode: "create" or "existing"
  const [selectionMode, setSelectionMode] = useState("create");
  const [existingWorkflows, setExistingWorkflows] = useState([]);
  const [existingSkills, setExistingSkills] = useState([]);
  const [selectedExistingId, setSelectedExistingId] = useState("");

  // Load existing items when switching to agent-skill or workflow
  useEffect(() => {
    if (type === "workflow" && selectionMode === "existing") {
      loadExistingWorkflows();
    } else if (type === "agent-skill" && selectionMode === "existing") {
      loadExistingSkills();
    }
  }, [type, selectionMode]);

  async function loadExistingWorkflows() {
    const res = await TredyAdmin.listExistingWorkflows();
    if (res.success) {
      setExistingWorkflows(res.workflows || []);
    }
  }

  async function loadExistingSkills() {
    const res = await TredyAdmin.listExistingAgentSkills();
    if (res.success) {
      setExistingSkills(res.skills || []);
    }
  }

  // Auto-fill form when existing item is selected
  function handleExistingItemSelect(id) {
    setSelectedExistingId(id);

    if (type === "workflow") {
      const workflow = existingWorkflows.find(w => w.id === id);
      if (workflow) {
        setName(workflow.name || "");
        setDescription(workflow.description || "");
        // Load full workflow details if available
        loadWorkflowDetails(id);
      }
    } else if (type === "agent-skill") {
      const skill = existingSkills.find(s => s.id === id);
      if (skill) {
        setName(skill.name || "");
        setDescription(skill.description || "");
        // Auto-fill version and author info if available
        if (skill.version) {
          setCategory(skill.author ? `By ${skill.author}` : "");
        }
      }
    }
  }

  async function loadWorkflowDetails(workflowId) {
    try {
      const fs = require("fs");
      const path = require("path");
      const storageDir = process.env.STORAGE_DIR || "/Users/segevbin/anything-llm/server/storage";
      const workflowPath = path.join(storageDir, `plugins/agent-flows/${workflowId}.json`);

      // Note: In production, this should be an API call
      // For now, the description from the list is sufficient
    } catch (error) {
      console.error("Error loading workflow details:", error);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      let result;

      if (type === "agent-skill") {
        // Validate based on selection mode
        if (selectionMode === "create") {
          if (!file) {
            showToast("Please select a ZIP file", "error");
            setSubmitting(false);
            return;
          }

          const formData = new FormData();
          formData.append("name", name);
          formData.append("description", description);
          formData.append("category", category);
          formData.append("tags", tags);
          formData.append("priceCents", parseInt(parseFloat(price) * 100));
          formData.append("visibility", visibility);
          formData.append("skillZip", file);

          result = await TredyAdmin.createSkill(formData);
        } else {
          // Using existing agent skill
          if (!selectedExistingId) {
            showToast("Please select an existing agent skill", "error");
            setSubmitting(false);
            return;
          }

          const selectedSkill = existingSkills.find(s => s.id === selectedExistingId);
          result = await TredyAdmin.createItem({
            name,
            description,
            itemType: "agent-skill",
            category,
            tags,
            priceCents: parseInt(parseFloat(price) * 100),
            visibility,
            metadata: {
              existingSkillId: selectedExistingId,
              existingSkillFolder: selectedSkill?.folder,
              source: "existing",
            },
          });
        }
      } else if (type === "workflow") {
        // Workflow creation or selection
        if (selectionMode === "existing") {
          if (!selectedExistingId) {
            showToast("Please select an existing workflow", "error");
            setSubmitting(false);
            return;
          }
        }

        // Determine final cron expression (use preset if not custom, otherwise use custom input)
        const finalCronExpression = isScheduled
          ? (customCron ? cronExpression : cronPreset)
          : null;

        result = await TredyAdmin.createItem({
          name,
          description,
          itemType: "agent-flow",
          category,
          tags,
          priceCents: parseInt(parseFloat(price) * 100),
          visibility,
          content: {
            workflow: content,
            isScheduled,
            cronExpression: finalCronExpression,
            steps: workflowSteps,
          },
          metadata: selectionMode === "existing" ? {
            existingWorkflowId: selectedExistingId,
            source: "existing",
          } : {
            source: "new",
          },
        });
      } else {
        // Create system-prompt or slash-command
        result = await TredyAdmin.createItem({
          name,
          description,
          itemType: type,
          category,
          tags,
          priceCents: parseInt(parseFloat(price) * 100),
          visibility,
          content: { prompt: content, command: content },
        });
      }

      if (result.success) {
        showToast("Item created successfully!", "success");
        onSuccess();
      } else {
        showToast(result.error || "Failed to create item", "error");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showToast("Failed to create item", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="space-y-4">
        {/* Type Selection */}
        <div>
          <label className="block text-white text-sm mb-2">Item Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
            required
          >
            <option value="agent-skill">Agent Skill (ZIP Upload)</option>
            <option value="workflow">Workflow / Agent Flow</option>
            <option value="system-prompt">System Prompt</option>
            <option value="slash-command">Slash Command</option>
          </select>
          <p className="text-xs text-white text-opacity-60 mt-1">
            {type === "agent-skill" && "Upload a ZIP file with plugin.json and handler.js"}
            {type === "workflow" && "Create a workflow with multiple steps (can be scheduled)"}
            {type === "system-prompt" && "A system prompt template for AI conversations"}
            {type === "slash-command" && "A reusable slash command for quick actions"}
          </p>
        </div>

        {/* Selection Mode (only for agent-skill and workflow) */}
        {(type === "agent-skill" || type === "workflow") && (
          <div>
            <label className="block text-white text-sm mb-2">Source</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  checked={selectionMode === "create"}
                  onChange={() => {
                    setSelectionMode("create");
                    setSelectedExistingId("");
                  }}
                  className="w-4 h-4"
                />
                <span>Create New</span>
              </label>
              <label className="flex items-center gap-2 text-white cursor-pointer">
                <input
                  type="radio"
                  checked={selectionMode === "existing"}
                  onChange={() => setSelectionMode("existing")}
                  className="w-4 h-4"
                />
                <span>Choose Existing</span>
              </label>
            </div>
            <p className="text-xs text-white text-opacity-60 mt-1">
              {selectionMode === "create"
                ? type === "workflow"
                  ? "Create a new workflow from scratch or use @flow in chat"
                  : "Upload a new agent skill ZIP file"
                : type === "workflow"
                  ? "Select from your existing workflows"
                  : "Select from your existing agent skills"
              }
            </p>
          </div>
        )}

        {/* Existing Item Selector */}
        {selectionMode === "existing" && type === "workflow" && (
          <div>
            <label className="block text-white text-sm mb-2">Select Existing Workflow</label>
            <select
              value={selectedExistingId}
              onChange={(e) => handleExistingItemSelect(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
              required
            >
              <option value="">-- Choose a workflow --</option>
              {existingWorkflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} ({wf.steps} steps)
                </option>
              ))}
            </select>
            <p className="text-xs text-white text-opacity-60 mt-1">
              Workflows created via @flow in chat
            </p>
          </div>
        )}

        {selectionMode === "existing" && type === "agent-skill" && (
          <div>
            <label className="block text-white text-sm mb-2">Select Existing Agent Skill</label>
            <select
              value={selectedExistingId}
              onChange={(e) => handleExistingItemSelect(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
              required
            >
              <option value="">-- Choose a skill --</option>
              {existingSkills.map((skill) => (
                <option key={skill.id} value={skill.id}>
                  {skill.name} - {skill.author}
                </option>
              ))}
            </select>
            <p className="text-xs text-white text-opacity-60 mt-1">
              Agent skills from Community Hub or custom uploads
            </p>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-white text-sm mb-2">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
            placeholder="My Amazing Skill"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-white text-sm mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
            rows="3"
            placeholder="Describe what this item does..."
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-white text-sm mb-2">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
            placeholder="Productivity, Data Analysis, etc."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-white text-sm mb-2">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
            placeholder="automation, api, integration"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-white text-sm mb-2">Price ($)</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
            placeholder="0.00"
            required
          />
          <p className="text-xs text-white text-opacity-60 mt-1">
            Set to 0 for free items
          </p>
        </div>

        {/* Visibility */}
        <div>
          <label className="block text-white text-sm mb-2">Visibility</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="unlisted">Unlisted</option>
          </select>
        </div>

        {/* File Upload for Agent Skills - Only when creating new */}
        {type === "agent-skill" && selectionMode === "create" && (
          <div>
            <label className="block text-white text-sm mb-2">
              ZIP File (must contain plugin.json and handler.js)
            </label>
            <input
              type="file"
              accept=".zip"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
              required={selectionMode === "create"}
            />
          </div>
        )}

        {/* Show skill info when using existing agent skill */}
        {type === "agent-skill" && selectionMode === "existing" && selectedExistingId && (
          <div className="bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-2">🔧 Selected Agent Skill</h4>
            {existingSkills.find(s => s.id === selectedExistingId) && (
              <div className="text-white text-opacity-80 text-sm space-y-1">
                <p><strong>Name:</strong> {existingSkills.find(s => s.id === selectedExistingId).name}</p>
                <p><strong>Author:</strong> {existingSkills.find(s => s.id === selectedExistingId).author}</p>
                <p><strong>Version:</strong> {existingSkills.find(s => s.id === selectedExistingId).version}</p>
                <p className="mt-2 text-white text-opacity-60">
                  ℹ️ This skill is already installed. Just set the price and visibility for marketplace listing.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Workflow Builder */}
        {type === "workflow" && (
          <>
            <div>
              <label className="block text-white text-sm mb-2">
                Workflow Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="radio"
                    checked={!isScheduled}
                    onChange={() => setIsScheduled(false)}
                    className="w-4 h-4"
                  />
                  <span>Manual (on-demand)</span>
                </label>
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="radio"
                    checked={isScheduled}
                    onChange={() => setIsScheduled(true)}
                    className="w-4 h-4"
                  />
                  <span>Scheduled (auto-run)</span>
                </label>
              </div>
            </div>

            {isScheduled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-white text-sm mb-2">
                    Schedule Frequency
                  </label>
                  <select
                    value={customCron ? "custom" : cronPreset}
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setCustomCron(true);
                        setCronExpression("");
                      } else {
                        setCustomCron(false);
                        setCronPreset(e.target.value);
                        setCronExpression(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
                    required={isScheduled}
                  >
                    <option value="* * * * *">Every minute</option>
                    <option value="*/5 * * * *">Every 5 minutes</option>
                    <option value="*/15 * * * *">Every 15 minutes</option>
                    <option value="*/30 * * * *">Every 30 minutes</option>
                    <option value="0 * * * *">Every hour</option>
                    <option value="0 */6 * * *">Every 6 hours</option>
                    <option value="0 9 * * *">Daily at 9 AM</option>
                    <option value="0 12 * * *">Daily at 12 PM</option>
                    <option value="0 0 * * *">Daily at midnight</option>
                    <option value="0 9 * * 1">Every Monday at 9 AM</option>
                    <option value="0 9 1 * *">Monthly on 1st at 9 AM</option>
                    <option value="custom">Custom cron expression...</option>
                  </select>
                  {!customCron && (
                    <p className="text-xs text-white text-opacity-60 mt-1">
                      Cron: <span className="font-mono">{cronPreset}</span>
                    </p>
                  )}
                </div>

                {customCron && (
                  <div>
                    <label className="block text-white text-sm mb-2">
                      Custom Cron Expression
                    </label>
                    <input
                      type="text"
                      value={cronExpression}
                      onChange={(e) => setCronExpression(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg font-mono text-sm"
                      placeholder="* * * * * (minute hour day month weekday)"
                      required={isScheduled && customCron}
                    />
                    <p className="text-xs text-white text-opacity-60 mt-1">
                      Format: minute hour day month weekday<br />
                      Example: "0 9 * * *" = Every day at 9 AM
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Only show JSON editor if creating new workflow, not selecting existing */}
            {selectionMode === "create" && (
              <div>
                <label className="block text-white text-sm mb-2">
                  Workflow Definition (JSON)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg font-mono text-sm"
                  rows="10"
                  placeholder={`{
  "name": "Email Workflow",
  "description": "Collect and summarize emails",
  "steps": [
    {
      "id": "fetch_emails",
      "type": "action",
      "action": "fetch_gmail",
      "params": { "query": "is:unread" }
    },
    {
      "id": "summarize",
      "type": "llm",
      "prompt": "Summarize these emails: {{fetch_emails.output}}"
    },
    {
      "id": "send_email",
      "type": "action",
      "action": "send_email",
      "params": {
        "to": "segev@futurixs.com",
        "subject": "Email Summary",
        "body": "{{summarize.output}}"
      }
    }
  ]
}`}
                  required={selectionMode === "create"}
                />
                <p className="text-xs text-white text-opacity-60 mt-1">
                  Define your workflow as JSON with steps and actions
                </p>
              </div>
            )}

            {/* Show workflow info when using existing */}
            {selectionMode === "existing" && selectedExistingId && (
              <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">📋 Selected Workflow</h4>
                {existingWorkflows.find(w => w.id === selectedExistingId) && (
                  <div className="text-white text-opacity-80 text-sm space-y-1">
                    <p><strong>Name:</strong> {existingWorkflows.find(w => w.id === selectedExistingId).name}</p>
                    <p><strong>Steps:</strong> {existingWorkflows.find(w => w.id === selectedExistingId).steps} workflow steps</p>
                    <p><strong>Created:</strong> {new Date(existingWorkflows.find(w => w.id === selectedExistingId).created_at).toLocaleDateString()}</p>
                    <p className="mt-2 text-white text-opacity-60">
                      ℹ️ The workflow definition is already saved. Just set the price and visibility for marketplace listing.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Content for System Prompts/Commands */}
        {type === "system-prompt" && (
          <div>
            <label className="block text-white text-sm mb-2">
              Prompt Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg font-mono text-sm"
              rows="6"
              placeholder="Enter your system prompt here..."
              required
            />
          </div>
        )}

        {type === "slash-command" && (
          <div>
            <label className="block text-white text-sm mb-2">
              Command Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg font-mono text-sm"
              rows="6"
              placeholder="Enter your slash command content..."
              required
            />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          {submitting ? "Creating..." : "Create Item"}
        </button>
      </div>
    </form>
  );
}

// Analytics Component
function Analytics({ data }) {
  if (!data) {
    return (
      <p className="text-white text-opacity-60">No analytics data available</p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Purchases"
          value={data.totalPurchases}
          icon="🛒"
        />
        <StatCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toFixed(2)}`}
          icon="💰"
        />
        <StatCard
          title="Total Installations"
          value={data.totalInstallations}
          icon="📥"
        />
        <StatCard
          title="Avg. Purchase Value"
          value={`$${data.totalPurchases > 0 ? (data.totalRevenue / data.totalPurchases).toFixed(2) : "0.00"}`}
          icon="📊"
        />
      </div>

      {/* By Item Type */}
      <div className="bg-white bg-opacity-10 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">Revenue by Type</h3>
        <div className="space-y-3">
          {Object.entries(data.byItemType || {}).map(([type, stats]) => (
            <div
              key={type}
              className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded"
            >
              <span className="text-white capitalize">
                {type.replace("-", " ")}
              </span>
              <div className="flex gap-4">
                <span className="text-white text-opacity-60">
                  {stats.count} purchases
                </span>
                <span className="text-white font-bold">
                  ${(stats.revenue / 100).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-white bg-opacity-10 rounded-lg p-6">
        <h3 className="text-white font-bold text-lg mb-4">Recent Purchases</h3>
        <div className="space-y-2">
          {data.recentPurchases && data.recentPurchases.length > 0 ? (
            data.recentPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between p-3 bg-white bg-opacity-5 rounded text-sm"
              >
                <div>
                  <span className="text-white">{purchase.hubId}</span>
                  <span className="text-white text-opacity-60 ml-2">
                    ({purchase.itemType})
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <span className="text-white">
                    ${((purchase.amountPaidCents || 0) / 100).toFixed(2)}
                  </span>
                  <span className="text-white text-opacity-60 text-xs">
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-white text-opacity-60 text-center py-4">
              No purchases yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white bg-opacity-10 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-opacity-60 text-sm">{title}</p>
          <p className="text-white text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
