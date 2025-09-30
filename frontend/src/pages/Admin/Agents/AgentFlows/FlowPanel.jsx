import React, { useState, useEffect, useRef } from "react";
import AgentFlows from "@/models/agentFlows";
import AgentSchedule from "@/models/agentSchedule";
import ScheduleModal from "@/components/AgentScheduling/ScheduleModal";
import showToast from "@/utils/toast";
import { FlowArrow, Gear, Clock, X } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import paths from "@/utils/paths";

function ManageFlowMenu({ flow, onDelete, onSchedule }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  async function deleteFlow() {
    if (
      !window.confirm(
        "Are you sure you want to delete this flow? This action cannot be undone."
      )
    )
      return;
    const { success, error } = await AgentFlows.deleteFlow(flow.uuid);
    if (success) {
      showToast("Flow deleted successfully.", "success");
      onDelete(flow.uuid);
    } else {
      showToast(error || "Failed to delete flow.", "error");
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-white hover:bg-theme-action-menu-item-hover transition-colors duration-300"
      >
        <Gear className="h-5 w-5" weight="bold" />
      </button>
      {open && (
        <div className="absolute w-[140px] -top-1 left-7 mt-1 border-[1.5px] border-white/40 rounded-lg bg-theme-action-menu-bg flex flex-col shadow-[0_4px_14px_rgba(0,0,0,0.25)] text-white z-99 md:z-10">
          <button
            type="button"
            onClick={() => navigate(paths.agents.editAgent(flow.uuid))}
            className="border-none flex items-center rounded-lg gap-x-2 hover:bg-theme-action-menu-item-hover py-1.5 px-2 transition-colors duration-200 w-full text-left"
          >
            <span className="text-sm">Edit Flow</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onSchedule();
              setOpen(false);
            }}
            className="border-none flex items-center rounded-lg gap-x-2 hover:bg-theme-action-menu-item-hover py-1.5 px-2 transition-colors duration-200 w-full text-left"
          >
            <Clock className="h-4 w-4" />
            <span className="text-sm">Schedule Flow</span>
          </button>
          <button
            type="button"
            onClick={deleteFlow}
            className="border-none flex items-center rounded-lg gap-x-2 hover:bg-theme-action-menu-item-hover py-1.5 px-2 transition-colors duration-200 w-full text-left"
          >
            <span className="text-sm">Delete Flow</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function FlowPanel({ flow, toggleFlow, onDelete }) {
  const [isActive, setIsActive] = useState(flow.active);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [allSchedules, setAllSchedules] = useState([]);

  useEffect(() => {
    setIsActive(flow.active);
    loadWorkspacesAndSchedules();
  }, [flow.uuid, flow.active]);

  const loadWorkspacesAndSchedules = async () => {
    try {
      // Dynamically import Workspace model
      const { default: Workspace } = await import("@/models/workspace");
      const fetchedWorkspaces = await Workspace.all();
      setWorkspaces(fetchedWorkspaces);

      // Load schedules from all workspaces for this flow
      const schedulePromises = fetchedWorkspaces.map(async (ws) => {
        try {
          const schedules = await AgentSchedule.list(ws.slug);
          return schedules
            .filter((s) => s.agent_id === flow.uuid && s.agent_type === "flow")
            .map((s) => ({ ...s, workspaceSlug: ws.slug, workspaceName: ws.name }));
        } catch (error) {
          console.error(`Failed to load schedules for ${ws.slug}:`, error);
          return [];
        }
      });

      const schedulesArrays = await Promise.all(schedulePromises);
      const flatSchedules = schedulesArrays.flat();
      setAllSchedules(flatSchedules);
    } catch (error) {
      console.error("Failed to load workspaces and schedules:", error);
    }
  };

  const handleToggle = async () => {
    try {
      const { success, error } = await AgentFlows.toggleFlow(
        flow.uuid,
        !isActive
      );
      if (!success) throw new Error(error);
      setIsActive(!isActive);
      toggleFlow(flow.uuid);
      showToast("Flow status updated successfully", "success", { clear: true });
    } catch (error) {
      console.error("Failed to toggle flow:", error);
      showToast("Failed to toggle flow", "error", { clear: true });
    }
  };

  return (
    <>
      <div className="p-2">
        <div className="flex flex-col gap-y-[18px] max-w-[500px]">
          <div className="flex items-center gap-x-2">
            <FlowArrow size={24} weight="bold" className="text-white" />
            <label htmlFor="name" className="text-white text-md font-bold">
              {flow.name}
            </label>
            <label className="border-none relative inline-flex items-center ml-auto cursor-pointer">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={isActive}
                onChange={handleToggle}
              />
              <div className="peer-disabled:opacity-50 pointer-events-none peer h-6 w-11 rounded-full bg-[#CFCFD0] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:shadow-xl after:border-none after:bg-white after:box-shadow-md after:transition-all after:content-[''] peer-checked:bg-[#32D583] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-transparent"></div>
              <span className="ml-3 text-sm font-medium"></span>
            </label>
            <ManageFlowMenu
              flow={flow}
              onDelete={onDelete}
              onSchedule={() => {
                // Auto-select first workspace if available
                if (workspaces.length > 0) {
                  setSelectedWorkspace(workspaces[0]);
                }
                setShowScheduleModal(true);
              }}
            />
          </div>
          <p className="whitespace-pre-wrap text-white text-opacity-60 text-xs font-medium py-1.5">
            {flow.description || "No description provided"}
          </p>
          {allSchedules.length > 0 && (
            <div className="flex flex-col gap-y-1 mt-2">
              {allSchedules.slice(0, 2).map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center gap-x-2 text-xs text-white/60"
                >
                  <Clock className="h-3 w-3" />
                  <span>
                    {schedule.enabled ? "🟢" : "⚪"}{" "}
                    {schedule.workspaceName && `[${schedule.workspaceName}] `}
                    {AgentSchedule.describeCronExpression(
                      schedule.cron_expression
                    )}
                  </span>
                </div>
              ))}
              {allSchedules.length > 2 && (
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="text-xs text-primary-button hover:underline text-left"
                >
                  +{allSchedules.length - 2} more schedules
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-bg-secondary rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Schedule Workflow</h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Workspace Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Select Workspace
                </label>
                <select
                  value={selectedWorkspace?.slug || ""}
                  onChange={(e) => {
                    const ws = workspaces.find((w) => w.slug === e.target.value);
                    setSelectedWorkspace(ws);
                  }}
                  className="w-full px-4 py-2 bg-theme-bg-primary text-white rounded-lg border border-white/10 focus:border-primary-button focus:outline-none"
                >
                  <option value="">Choose a workspace...</option>
                  {workspaces.map((ws) => (
                    <option key={ws.slug} value={ws.slug}>
                      {ws.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-white/60 mt-1">
                  The workflow will be scheduled in this workspace
                </p>
              </div>

              {selectedWorkspace ? (
                <ScheduleModal
                  isOpen={true}
                  onClose={() => setShowScheduleModal(false)}
                  onSave={async () => {
                    setShowScheduleModal(false);
                    await loadWorkspacesAndSchedules();
                    showToast("Schedule created successfully!", "success");
                  }}
                  workspace={selectedWorkspace}
                  agent={{
                    id: flow.uuid,
                    name: flow.name,
                    type: "flow",
                  }}
                />
              ) : (
                <div className="text-center py-8 text-white/60">
                  Please select a workspace to continue
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
