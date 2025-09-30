# How to Add Scheduling UI to Workflow Panel - Implementation Guide

## Summary

**All scheduling UI components already exist!** You just need to add a "Schedule" button to the workflow panel that opens the existing `ScheduleModal`.

---

## Implementation Steps

### **Option 1: Add Schedule Button to FlowPanel** (Simplest)

**File to modify:** `/frontend/src/pages/Admin/Agents/AgentFlows/FlowPanel.jsx`

```jsx
import React, { useState, useEffect } from "react";
import AgentFlows from "@/models/agentFlows";
import AgentSchedule from "@/models/agentSchedule"; // ADD THIS
import ScheduleModal from "@/components/AgentScheduling/ScheduleModal"; // ADD THIS
import showToast from "@/utils/toast";
import { FlowArrow, Gear, Clock } from "@phosphor-icons/react"; // ADD Clock icon
import { useNavigate } from "react-router-dom";
import paths from "@/utils/paths";

function ManageFlowMenu({ flow, onDelete, onSchedule }) { // ADD onSchedule prop
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
          {/* ADD THIS NEW BUTTON */}
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
          {/* END NEW BUTTON */}
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

export default function FlowPanel({ flow, toggleFlow, onDelete, workspace }) { // ADD workspace prop
  const [isActive, setIsActive] = useState(flow.active);
  const [showScheduleModal, setShowScheduleModal] = useState(false); // ADD THIS
  const [schedules, setSchedules] = useState([]); // ADD THIS
  const [loading, setLoading] = useState(false); // ADD THIS

  useEffect(() => {
    setIsActive(flow.active);
    loadSchedules(); // ADD THIS
  }, [flow.uuid, flow.active]);

  // ADD THIS FUNCTION
  const loadSchedules = async () => {
    if (!workspace?.slug) return;
    setLoading(true);
    try {
      const allSchedules = await AgentSchedule.list(workspace.slug);
      // Filter schedules for this specific flow
      const flowSchedules = allSchedules.filter(
        (s) => s.agent_id === flow.uuid && s.agent_type === "flow"
      );
      setSchedules(flowSchedules);
    } catch (error) {
      console.error("Failed to load schedules:", error);
    } finally {
      setLoading(false);
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

  // ADD THIS FUNCTION
  const handleScheduleSave = async () => {
    await loadSchedules();
    showToast("Schedule saved successfully", "success");
  };

  // CREATE AGENT OBJECT FOR MODAL
  const agentForScheduling = {
    id: flow.uuid,
    name: flow.name,
    type: "flow",
    hubId: flow.uuid,
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
              onSchedule={() => setShowScheduleModal(true)} // ADD THIS
            />
          </div>
          <p className="whitespace-pre-wrap text-white text-opacity-60 text-xs font-medium py-1.5">
            {flow.description || "No description provided"}
          </p>

          {/* ADD SCHEDULE INFO */}
          {schedules.length > 0 && !loading && (
            <div className="flex flex-col gap-y-2">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center gap-x-2 text-xs text-white/60"
                >
                  <Clock className="h-3 w-3" />
                  <span>
                    {schedule.enabled ? "🟢" : "⚪"}{" "}
                    {AgentSchedule.describeCronExpression(
                      schedule.cron_expression
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* END SCHEDULE INFO */}
        </div>
      </div>

      {/* ADD SCHEDULE MODAL */}
      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          onSave={handleScheduleSave}
          workspace={workspace}
          agent={agentForScheduling}
        />
      )}
      {/* END SCHEDULE MODAL */}
    </>
  );
}
```

---

### **Step 2: Update Parent Component to Pass Workspace**

**File to modify:** `/frontend/src/pages/Admin/Agents/AgentFlows/index.jsx`

You need to pass the `workspace` prop to `FlowPanel`. Find where `FlowPanel` is used and add:

```jsx
<FlowPanel
  flow={selectedFlow}
  toggleFlow={toggleFlow}
  onDelete={onDeleteFlow}
  workspace={workspace} // ADD THIS LINE
/>
```

If `workspace` doesn't exist in the parent component, you'll need to fetch it or get it from context:

```jsx
import { useParams } from "react-router-dom";
import Workspace from "@/models/workspace";

// Inside the component
const { slug } = useParams(); // If workspace slug is in URL
const [workspace, setWorkspace] = useState(null);

useEffect(() => {
  const loadWorkspace = async () => {
    const ws = await Workspace.bySlug(slug);
    setWorkspace(ws);
  };
  if (slug) loadWorkspace();
}, [slug]);
```

---

### **Option 2: Create Dedicated Workflow Scheduling Page** (More Complete)

If workflows are managed at the admin level (not workspace-specific), create a separate scheduling management page:

**File to create:** `/frontend/src/pages/Admin/Agents/AgentFlows/FlowScheduling.jsx`

```jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import AgentSchedule from "@/models/agentSchedule";
import Workspace from "@/models/workspace";
import ScheduleModal from "@/components/AgentScheduling/ScheduleModal";
import ScheduleList from "@/components/AgentScheduling/ScheduleList";

export default function FlowScheduling({ flow }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const ws = await Workspace.all();
      setWorkspaces(ws);
      if (ws.length > 0) setSelectedWorkspace(ws[0]);
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    }
  };

  if (!selectedWorkspace) {
    return <div>Loading workspaces...</div>;
  }

  const agentForScheduling = {
    id: flow.uuid,
    name: flow.name,
    type: "flow",
    hubId: flow.uuid,
  };

  return (
    <div className="flex flex-col gap-y-4 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-theme-text-primary">
          Schedule: {flow.name}
        </h2>

        <select
          value={selectedWorkspace.slug}
          onChange={(e) => {
            const ws = workspaces.find((w) => w.slug === e.target.value);
            setSelectedWorkspace(ws);
          }}
          className="px-3 py-2 bg-theme-bg-primary border border-theme-border rounded"
        >
          {workspaces.map((ws) => (
            <option key={ws.slug} value={ws.slug}>
              {ws.name}
            </option>
          ))}
        </select>
      </div>

      <ScheduleList workspace={selectedWorkspace} />

      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-primary-button text-white rounded hover:bg-primary-button-hover"
      >
        Create Schedule for This Flow
      </button>

      {showModal && (
        <ScheduleModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            // Refresh schedule list
          }}
          workspace={selectedWorkspace}
          agent={agentForScheduling}
        />
      )}
    </div>
  );
}
```

---

## **Quick Implementation (Minimal Changes)**

**If you just want a simple "Schedule" button in the workflow panel:**

### **1. Modify FlowPanel.jsx**

Add these imports at the top:
```jsx
import { Clock } from "@phosphor-icons/react";
import AgentSchedule from "@/models/agentSchedule";
import ScheduleModal from "@/components/AgentScheduling/ScheduleModal";
```

Add state and modal:
```jsx
const [showScheduleModal, setShowScheduleModal] = useState(false);

const agentForScheduling = {
  id: flow.uuid,
  name: flow.name,
  type: "flow",
};
```

Add button to ManageFlowMenu (inside the dropdown):
```jsx
<button
  type="button"
  onClick={() => setShowScheduleModal(true)}
  className="border-none flex items-center rounded-lg gap-x-2 hover:bg-theme-action-menu-item-hover py-1.5 px-2 transition-colors duration-200 w-full text-left"
>
  <Clock className="h-4 w-4" />
  <span className="text-sm">Schedule Flow</span>
</button>
```

Add modal at the end of the component:
```jsx
{showScheduleModal && workspace && (
  <ScheduleModal
    isOpen={showScheduleModal}
    onClose={() => setShowScheduleModal(false)}
    onSave={() => {
      setShowScheduleModal(false);
      showToast("Schedule created!", "success");
    }}
    workspace={workspace}
    agent={agentForScheduling}
  />
)}
```

### **2. Get Workspace Context**

If workspace isn't available in FlowPanel, you need to get it. Options:

**A. From URL params (if in workspace context):**
```jsx
import { useParams } from "react-router-dom";
const { slug } = useParams();
const [workspace, setWorkspace] = useState(null);

useEffect(() => {
  const loadWorkspace = async () => {
    const ws = await Workspace.bySlug(slug);
    setWorkspace(ws);
  };
  if (slug) loadWorkspace();
}, [slug]);
```

**B. From parent component (recommended):**
Pass workspace as prop from parent component that renders FlowPanel.

**C. Create workspace selector in modal:**
Modify ScheduleModal to accept workspace slug or show workspace selector.

---

## **User Flow**

### **Creating a Schedule for a Workflow:**

1. User navigates to Agent Flows page
2. Clicks gear icon on a workflow
3. Selects "Schedule Flow" from menu
4. ScheduleModal opens with:
   - Pre-filled flow name
   - Cron expression builder
   - Timezone selector
   - Context/prompt fields
5. User configures schedule
6. Clicks "Create Schedule"
7. Schedule is created with `agentType: "flow"` and `agentId: flow.uuid`
8. Scheduler will execute workflow according to cron expression

### **Viewing Schedules:**

Option 1: Show schedules in flow panel (inline)
Option 2: Add "View Schedules" button that opens ScheduleList
Option 3: Create dedicated scheduling page per workflow

---

## **Testing**

### **1. Test Schedule Creation**

```bash
# Open browser console and test:
const agent = {
  id: "flow-uuid-here",
  name: "Test Workflow",
  type: "flow"
};

const scheduleData = {
  agentId: agent.id,
  agentType: "flow",
  name: "Daily Test Workflow",
  cronExpression: "0 9 * * *",
  timezone: "UTC",
  enabled: true,
  context: { prompt: "Execute workflow" }
};

await AgentSchedule.create("workspace-slug", scheduleData);
```

### **2. Verify in Database**

```bash
sqlite3 server/storage/anythingllm.db "
  SELECT * FROM agent_schedules WHERE agent_type = 'flow';
"
```

### **3. Check Scheduler Logs**

```bash
tail -f server/server.log | grep -i "workflow\|flow\|schedule"
```

---

## **Common Issues & Solutions**

### **Issue 1: "Workspace not defined"**

**Solution:** Pass workspace prop from parent or fetch it in FlowPanel:
```jsx
const { slug } = useParams();
const [workspace, setWorkspace] = useState(null);

useEffect(() => {
  Workspace.bySlug(slug).then(setWorkspace);
}, [slug]);
```

### **Issue 2: "Flow not scheduling"**

**Check:**
1. Is schedule enabled? Check database
2. Is agent_type set to "flow"?
3. Is agent_id correct (matches flow.uuid)?
4. Is scheduler running? Check logs

**Debug:**
```bash
# Check schedules
sqlite3 server/storage/anythingllm.db "SELECT * FROM agent_schedules WHERE agent_type = 'flow';"

# Check execution history
sqlite3 server/storage/anythingllm.db "SELECT * FROM schedule_executions WHERE schedule_id IN (SELECT id FROM agent_schedules WHERE agent_type = 'flow');"
```

### **Issue 3: "Modal not opening"**

**Check:**
1. Is ScheduleModal imported?
2. Is showScheduleModal state working?
3. Is workspace object valid?

**Debug:**
```jsx
console.log("Show modal:", showScheduleModal);
console.log("Workspace:", workspace);
console.log("Agent:", agentForScheduling);
```

---

## **Summary**

### **What Already Exists:** ✅
- Schedule modal UI
- Schedule list UI
- Cron builder
- API client
- Backend scheduling system
- Database tables

### **What You Need to Do:** 📝
1. Add "Schedule" button to workflow panel gear menu
2. Add ScheduleModal to FlowPanel component
3. Pass workspace context to FlowPanel
4. Optionally: Show active schedules in panel

### **Minimal Implementation:** ⚡
```jsx
// In FlowPanel.jsx
import ScheduleModal from "@/components/AgentScheduling/ScheduleModal";

const [showSchedule, setShowSchedule] = useState(false);

// Add to gear menu:
<button onClick={() => setShowSchedule(true)}>Schedule Flow</button>

// Add modal:
{showSchedule && (
  <ScheduleModal
    isOpen={showSchedule}
    onClose={() => setShowSchedule(false)}
    workspace={workspace}
    agent={{ id: flow.uuid, name: flow.name, type: "flow" }}
  />
)}
```

**That's it! Everything else already works.** 🎉
