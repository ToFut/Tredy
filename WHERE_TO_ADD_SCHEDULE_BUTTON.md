# Where to Add Schedule Button - Quick Guide

## Question: Where do you see workflows?

### **Option 1: Admin Agents Page** (Most Common)
**URL:** `http://localhost:3000/admin/agents` or `/settings/agents`

**What you see:**
```
Left sidebar: List of workflows
Right panel: Selected workflow details
```

**File:** `/frontend/src/pages/Admin/Agents/AgentFlows/FlowPanel.jsx`
**This is the simple panel with toggle and description**

---

### **Option 2: Visual Workflow Builder** (Advanced)
**URL:** Workflow editor page

**What you see:**
```
Visual blocks and connections
Drag-and-drop interface
```

**File:** `/frontend/src/components/FlowPanel/index.jsx`
**This is the visual workflow builder**

---

## How to Test Which One You're Using

### **Step 1: Check Your Current URL**

Open your browser and look at the URL:

- If URL is like: `/admin/agents` or `/settings/agents`
  → You're using **Option 1** (AgentFlows/FlowPanel.jsx)

- If URL is like: `/workflow/builder` or shows visual blocks
  → You're using **Option 2** (components/FlowPanel)

### **Step 2: Open Browser Console**

Press `F12` or Right-click → Inspect

In console, type:
```javascript
console.log(window.location.pathname);
```

This will show exactly which page you're on.

---

## Quick Test: Add console.log to find the right file

### **Test Option 1:**

Edit: `/frontend/src/pages/Admin/Agents/AgentFlows/FlowPanel.jsx`

Add at line 73 (inside FlowPanel component):
```jsx
export default function FlowPanel({ flow, toggleFlow, onDelete, workspace }) {
  console.log("🔍 FlowPanel.jsx LOADED - flow:", flow.name); // ADD THIS LINE
  const [isActive, setIsActive] = useState(flow.active);
```

### **Test Option 2:**

Edit: `/frontend/src/components/FlowPanel/index.jsx`

Add around line 100:
```jsx
function WorkflowItem({ flow, isSelected, ... }) {
  console.log("🔍 FlowPanel/index.jsx LOADED - flow:", flow.name); // ADD THIS LINE
  const [isHovered, setIsHovered] = useState(false);
```

### **Check Console:**

Refresh your page and look at the browser console (F12).

You'll see either:
- `🔍 FlowPanel.jsx LOADED` → Use Option 1
- `🔍 FlowPanel/index.jsx LOADED` → Use Option 2

---

## Implementation for Each Option

### **Option 1: Simple List Panel** (AgentFlows/FlowPanel.jsx)

**Location of Play button:** Gear menu dropdown (lines 42-70)

**Add Schedule button in gear menu:**

```jsx
// In ManageFlowMenu component dropdown
<button
  type="button"
  onClick={() => navigate(paths.agents.editAgent(flow.uuid))}
  className="..."
>
  <span className="text-sm">Edit Flow</span>
</button>

{/* ⭐ ADD THIS */}
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
{/* ⭐ END */}

<button
  type="button"
  onClick={deleteFlow}
  className="..."
>
  <span className="text-sm">Delete Flow</span>
</button>
```

---

### **Option 2: Visual Builder** (components/FlowPanel/index.jsx)

**Location of Play button:** Lines 327-333 (hover actions)

**Add Schedule button next to Play:**

```jsx
<div className="flex items-center gap-1 ...">
  {/* Play button */}
  <button onClick={() => onRun(flow)} className="..." title="Run">
    <Play size={12} className="text-gray-600" weight="fill" />
  </button>

  {/* ⭐ ADD THIS */}
  <button onClick={() => onSchedule(flow)} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Schedule">
    <Clock size={12} className="text-gray-600" />
  </button>
  {/* ⭐ END */}

  {/* Edit button */}
  <button onClick={() => onEdit(flow)} className="..." title="Edit">
    <Gear size={12} className="text-gray-600" />
  </button>

  {/* More button */}
  <button onClick={() => setShowActions(!showActions)} className="..." title="More">
    <DotsThree size={12} className="text-gray-600" />
  </button>
</div>
```

---

## Debug: Button Not Showing?

### **Checklist:**

1. **Clock icon imported?**
```jsx
import { Clock } from "@phosphor-icons/react";
```

2. **onSchedule function defined?**
```jsx
const [showScheduleModal, setShowScheduleModal] = useState(false);

const handleSchedule = () => {
  setShowScheduleModal(true);
};
```

3. **onSchedule prop passed?**
```jsx
<ManageFlowMenu
  flow={flow}
  onDelete={onDelete}
  onSchedule={handleSchedule} // ← ADD THIS
/>
```

4. **ScheduleModal added?**
```jsx
{showScheduleModal && workspace && (
  <ScheduleModal
    isOpen={showScheduleModal}
    onClose={() => setShowScheduleModal(false)}
    workspace={workspace}
    agent={{ id: flow.uuid, name: flow.name, type: "flow" }}
  />
)}
```

5. **Frontend restarted?**
```bash
# Stop frontend (Ctrl+C)
cd /Users/segevbin/anything-llm
yarn dev:frontend
```

6. **Browser cache cleared?**
Press: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

---

## Screenshot Your Page

Take a screenshot showing:
1. The workflow list/panel you see
2. The URL in the browser
3. Where you expect to see the Schedule button

This will help me tell you exactly which file to edit!

---

## Quick Commands to Find Current Page

```bash
# 1. See what's currently rendering
cd /Users/segevbin/anything-llm/frontend
grep -r "Agent Flows\|Workflow" src/pages --include="*.jsx" -l

# 2. Check which FlowPanel is imported
grep -r "import.*FlowPanel" src/pages --include="*.jsx"

# 3. Find the main agents page
cat src/pages/Admin/Agents/index.jsx | head -50
```

---

## Next Steps

1. Tell me which URL you're on when viewing workflows
2. Or run the console.log test above
3. Or share a screenshot

Then I can give you the EXACT line numbers to add the Schedule button! 🎯
