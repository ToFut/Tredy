# 📋 Complete Plan: Procurement as Visual Flow System

## 🎯 Goal
Convert the 11-stage procurement workflow into a **visual flow system** that:
1. ✅ Shows as blocks in the Flow Panel UI
2. ✅ Auto-executes in background when triggered by agent skill
3. ✅ Displays real-time progress through visual blocks
4. ✅ Stores results and allows re-running individual stages

---

## 🔍 Current System Analysis

### How Flows Work in AnythingLLM

```
┌─────────────────────────────────────────────────────────────┐
│  FLOW SYSTEM ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. FLOW STORAGE                                             │
│     Location: /server/storage/plugins/agent-flows/           │
│     Format: {uuid}.json                                      │
│     Structure:                                               │
│     {                                                         │
│       "name": "Workflow Name",                               │
│       "description": "What it does",                         │
│       "active": true,                                        │
│       "steps": [                                             │
│         { "type": "start", "config": {...} },                │
│         { "type": "toolCall", "config": {...} },             │
│         { "type": "llmInstruction", "config": {...} }        │
│       ],                                                     │
│       "visualBlocks": [                                      │
│         { "id": "step_1", "icon": "🚀", "status": "complete" } │
│       ]                                                      │
│     }                                                         │
│                                                              │
│  2. FLOW EXECUTION                                           │
│     - FlowExecutor reads JSON                                │
│     - Executes steps sequentially                            │
│     - Supports: toolCall, llmInstruction, apiCall, webScraping │
│     - Stores results in variables                            │
│     - Returns final output                                   │
│                                                              │
│  3. AUTO-LOADING AS PLUGIN                                   │
│     - AgentFlows.activeFlowPlugins() → ["@@flow_{uuid}"]    │
│     - Each flow becomes an agent function                    │
│     - Agent can call: flow_{uuid}(parameters)                │
│     - Triggers automatic execution                           │
│                                                              │
│  4. UI DISPLAY                                               │
│     - FlowPanel component (frontend)                         │
│     - Shows visual blocks with icons                         │
│     - Real-time status updates (pending/running/complete)    │
│     - Progress indicators                                    │
│     - Can open WorkflowBuilder for editing                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Procurement Flow Architecture

### Visual Flow Structure

```
┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐
│ 🚀  │ -> │ 📄  │ -> │ ✅  │ -> │ 🏢  │ -> │ 📧  │ -> │ 📊  │
│START│    │EXTRACT│  │COMPLY│   │MATCH│    │ RFQ │    │ BID │
└─────┘    └─────┘    └─────┘    └─────┘    └─────┘    └─────┘
              │            │          │          │          │
              v            v          v          v          v
         [30 items]  [12 issues] [5 suppliers] [3 sent]  [winner]

┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐    ┌─────┐
│ 📝  │ -> │ 💰  │ -> │ 🚚  │ -> │ ✅  │ -> │ 🔍  │
│CONTRACT│ │  PO │    │TRACK│    │DELIVER│  │  QC │
└─────┘    └─────┘    └─────┘    └─────┘    └─────┘
```

---

## 🏗️ Implementation Plan

### **Phase 1: Create Procurement Flow JSON Structure**

**File**: `/server/storage/plugins/agent-flows/procurement-11-stage.json`

**Structure**:
```json
{
  "name": "Hotel Procurement Workflow (11 Stages)",
  "description": "Complete automated procurement from BOM extraction through delivery and quality control. Handles compliance analysis, supplier matching, RFQ management, bid comparison, contracts, payments, and shipment tracking.",
  "active": true,
  "status": "ready",
  "created_via": "system",
  "created_at": "2025-09-30T00:00:00.000Z",

  "steps": [
    {
      "type": "start",
      "config": {
        "variables": [
          { "name": "buyerLocation", "description": "Buyer's city and state", "default": "Los Angeles, CA" },
          { "name": "itemCount", "description": "Number of items to generate in demo mode", "default": 30 },
          { "name": "useDemo", "description": "Generate demo data or use uploaded files", "default": true }
        ]
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "extract_procurement_items",
        "parameters": {
          "generateDemo": "{{useDemo}}",
          "itemCount": "{{itemCount}}"
        },
        "resultVariable": "extractedItems",
        "directOutput": false,
        "stepId": "stage_1_extraction",
        "stepName": "Stage 1: Extract Items",
        "stepDescription": "Extract procurement items from BOM or generate demo data"
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "analyze_compliance",
        "parameters": {},
        "resultVariable": "complianceIssues",
        "directOutput": false,
        "stepId": "stage_2_compliance",
        "stepName": "Stage 2: Compliance Analysis",
        "stepDescription": "AI-powered compliance checking (CAL 117-2013, ADA, moisture, electrical)"
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "match_suppliers",
        "parameters": {
          "buyerLocation": "{{buyerLocation}}"
        },
        "resultVariable": "supplierMatches",
        "directOutput": false,
        "stepId": "stage_3_matching",
        "stepName": "Stage 3: Supplier Matching",
        "stepDescription": "Match suppliers using weighted algorithm (30/20/10/40)"
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "create_rfq",
        "parameters": {},
        "resultVariable": "rfqResults",
        "directOutput": false,
        "stepId": "stage_4_rfq",
        "stepName": "Stage 4: Create RFQ",
        "stepDescription": "Generate and send RFQ documents to suppliers"
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "compare_bids",
        "parameters": {},
        "resultVariable": "bidComparison",
        "directOutput": false,
        "stepId": "stage_5_comparison",
        "stepName": "Stage 5: Bid Comparison",
        "stepDescription": "Compare supplier bids with weighted scoring matrix"
      }
    },

    {
      "type": "llmInstruction",
      "config": {
        "instruction": "Based on the bid comparison results ({{bidComparison}}), automatically select the highest-scoring supplier bid and accept it. Return the supplier name.",
        "resultVariable": "acceptedSupplier",
        "stepId": "stage_6_accept",
        "stepName": "Stage 6: Accept Bid",
        "stepDescription": "Accept winning supplier bid"
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "generate_contract",
        "parameters": {},
        "resultVariable": "contract",
        "directOutput": false,
        "stepId": "stage_7_contract",
        "stepName": "Stage 7: Generate Contract",
        "stepDescription": "AI-powered contract generation"
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "create_purchase_order",
        "parameters": {
          "paymentMethod": "ach"
        },
        "resultVariable": "purchaseOrder",
        "directOutput": false,
        "stepId": "stage_8_po",
        "stepName": "Stage 8: Purchase Order",
        "stepDescription": "Create PO and process payment (Stripe)"
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "track_shipment",
        "parameters": {},
        "resultVariable": "shipmentTracking",
        "directOutput": false,
        "stepId": "stage_9_tracking",
        "stepName": "Stage 9: Shipment Tracking",
        "stepDescription": "Track delivery via DHL integration"
      }
    },

    {
      "type": "toolCall",
      "config": {
        "toolName": "confirm_delivery",
        "parameters": {
          "receivedQuantity": "{{itemCount}}"
        },
        "resultVariable": "deliveryConfirmation",
        "directOutput": false,
        "stepId": "stage_10_delivery",
        "stepName": "Stage 10: Confirm Delivery",
        "stepDescription": "Record delivery confirmation"
      }
    },

    {
      "type": "llmInstruction",
      "config": {
        "instruction": "Summarize the complete procurement workflow results including: items processed ({{extractedItems}}), compliance issues ({{complianceIssues}}), suppliers matched ({{supplierMatches}}), winning bid ({{acceptedSupplier}}), PO number ({{purchaseOrder}}), and delivery status ({{deliveryConfirmation}}). Create a comprehensive summary report.",
        "resultVariable": "finalReport",
        "directOutput": true,
        "stepId": "stage_11_summary",
        "stepName": "Stage 11: Final Report",
        "stepDescription": "Generate complete workflow summary"
      }
    }
  ],

  "visualBlocks": [
    {
      "id": "start",
      "type": "start",
      "name": "🚀 Start",
      "description": "Initialize procurement workflow",
      "status": "pending",
      "icon": "🚀",
      "tool": "Start"
    },
    {
      "id": "stage_1_extraction",
      "type": "toolCall",
      "name": "📄 Extract Items",
      "description": "Stage 1: BOM Extraction",
      "status": "pending",
      "icon": "📄",
      "tool": "extract_procurement_items"
    },
    {
      "id": "stage_2_compliance",
      "type": "toolCall",
      "name": "✅ Compliance",
      "description": "Stage 2: AI Compliance Analysis",
      "status": "pending",
      "icon": "✅",
      "tool": "analyze_compliance"
    },
    {
      "id": "stage_3_matching",
      "type": "toolCall",
      "name": "🏢 Match Suppliers",
      "description": "Stage 3: Supplier Matching Algorithm",
      "status": "pending",
      "icon": "🏢",
      "tool": "match_suppliers"
    },
    {
      "id": "stage_4_rfq",
      "type": "toolCall",
      "name": "📧 Create RFQ",
      "description": "Stage 4: RFQ Generation & Sending",
      "status": "pending",
      "icon": "📧",
      "tool": "create_rfq"
    },
    {
      "id": "stage_5_comparison",
      "type": "toolCall",
      "name": "📊 Compare Bids",
      "description": "Stage 5: Bid Comparison Matrix",
      "status": "pending",
      "icon": "📊",
      "tool": "compare_bids"
    },
    {
      "id": "stage_6_accept",
      "type": "llmInstruction",
      "name": "🤝 Accept Bid",
      "description": "Stage 6: Accept Winning Bid",
      "status": "pending",
      "icon": "🤝",
      "tool": "AI Decision"
    },
    {
      "id": "stage_7_contract",
      "type": "toolCall",
      "name": "📝 Contract",
      "description": "Stage 7: Generate Contract",
      "status": "pending",
      "icon": "📝",
      "tool": "generate_contract"
    },
    {
      "id": "stage_8_po",
      "type": "toolCall",
      "name": "💰 Purchase Order",
      "description": "Stage 8: Create PO & Payment",
      "status": "pending",
      "icon": "💰",
      "tool": "create_purchase_order"
    },
    {
      "id": "stage_9_tracking",
      "type": "toolCall",
      "name": "🚚 Track Shipment",
      "description": "Stage 9: DHL Tracking",
      "status": "pending",
      "icon": "🚚",
      "tool": "track_shipment"
    },
    {
      "id": "stage_10_delivery",
      "type": "toolCall",
      "name": "✅ Delivery",
      "description": "Stage 10: Confirm Delivery",
      "status": "pending",
      "icon": "✅",
      "tool": "confirm_delivery"
    },
    {
      "id": "stage_11_summary",
      "type": "llmInstruction",
      "name": "📋 Final Report",
      "description": "Stage 11: Complete Summary",
      "status": "pending",
      "icon": "📋",
      "tool": "AI Summary"
    },
    {
      "id": "complete",
      "type": "complete",
      "name": "🎉 Complete",
      "description": "Procurement workflow finished!",
      "status": "pending",
      "icon": "🎉",
      "tool": "Complete"
    }
  ],

  "openFlowPanel": true,
  "openWorkflowBuilder": false,
  "workflowUuid": "procurement-11-stage",

  "metadata": {
    "category": "procurement",
    "tags": ["procurement", "hotel", "sourcing", "compliance", "RFQ"],
    "estimatedDuration": "5-10 minutes",
    "complexity": "advanced",
    "autoTrigger": true,
    "triggerKeywords": ["procurement", "BOM", "sourcing", "purchase", "supplier", "hotel renovation"]
  }
}
```

---

### **Phase 2: Auto-Trigger Integration**

**Modify**: `/server/utils/agents/aibitat/plugins/procurement-orchestrator.js`

Add smart detection function:

```javascript
// Add to top of setup()
aibitat.function({
  name: "procurement_workflow_detector",
  description: "Automatically detects when user needs procurement workflow and triggers the visual flow. Use when user mentions: procurement, BOM, sourcing, purchasing, supplier management, hotel renovation materials, RFQ, bidding, contract management.",
  parameters: {
    type: "object",
    properties: {
      userQuery: {
        type: "string",
        description: "The user's original query about procurement"
      },
      buyerLocation: {
        type: "string",
        description: "Buyer's location if mentioned, otherwise 'Los Angeles, CA'"
      }
    }
  },
  handler: async function({ userQuery, buyerLocation = "Los Angeles, CA" }) {
    // Trigger the visual flow
    const flowUuid = "procurement-11-stage";

    this.super.introspect(`Detected procurement workflow request. Triggering visual flow: ${flowUuid}`);

    // Execute the flow
    const { AgentFlows } = require("../../../agentFlows");
    const result = await AgentFlows.executeFlow(
      flowUuid,
      {
        buyerLocation: buyerLocation,
        itemCount: 30,
        useDemo: true
      },
      this.super
    );

    // Open flow panel in UI
    this.super.websocket?.send({
      type: "open_flow_panel",
      flowUuid: flowUuid,
      status: "running"
    });

    return `🚀 Procurement workflow started! View progress in the Flow Panel →`;
  }
});
```

---

### **Phase 3: Real-Time Status Updates**

**Modify**: `/server/utils/agentFlows/executor.js`

Add websocket status broadcasting:

```javascript
// In FlowExecutor.executeStep()
async executeStep(step, variables, aibitat) {
  // Send status update before execution
  if (aibitat?.websocket) {
    aibitat.websocket.send({
      type: "flow_step_status",
      stepId: step.config.stepId,
      status: "running",
      progress: 0
    });
  }

  // Execute step...
  const result = await this.executeStepType(step, variables, aibitat);

  // Send completion update
  if (aibitat?.websocket) {
    aibitat.websocket.send({
      type: "flow_step_status",
      stepId: step.config.stepId,
      status: "complete",
      progress: 100,
      result: result
    });
  }

  return result;
}
```

---

### **Phase 4: Frontend Flow Panel Integration**

**Modify**: `/frontend/src/components/FlowPanel/index.jsx`

Add procurement-specific visual enhancements:

```javascript
const getStepIcon = (type, tool) => {
  // Procurement-specific icons
  if (tool === 'extract_procurement_items') return '📄';
  if (tool === 'analyze_compliance') return '✅';
  if (tool === 'match_suppliers') return '🏢';
  if (tool === 'create_rfq') return '📧';
  if (tool === 'compare_bids') return '📊';
  if (tool === 'generate_contract') return '📝';
  if (tool === 'create_purchase_order') return '💰';
  if (tool === 'track_shipment') return '🚚';
  if (tool === 'confirm_delivery') return '✅';

  // Default icons...
  return '📦';
};
```

---

## 🎯 User Experience Flow

### Scenario: User Starts Procurement

```
User: "@agent I need to source furniture for a hotel in Los Angeles"

┌─────────────────────────────────────────────────┐
│  SYSTEM DETECTS: procurement keywords           │
│  ↓                                               │
│  procurement_workflow_detector() triggered      │
│  ↓                                               │
│  Loads flow: procurement-11-stage.json          │
│  ↓                                               │
│  FlowExecutor starts execution                  │
│  ↓                                               │
│  Flow Panel opens in UI →                       │
└─────────────────────────────────────────────────┘

FLOW PANEL DISPLAY:

┌─────────────────────────────────────────┐
│  Hotel Procurement Workflow (11 Stages) │
├─────────────────────────────────────────┤
│                                          │
│  🚀 Start           [●] Complete         │
│  📄 Extract Items   [●] Running... 45%   │
│  ✅ Compliance      [○] Pending          │
│  🏢 Match Suppliers [○] Pending          │
│  📧 Create RFQ      [○] Pending          │
│  📊 Compare Bids    [○] Pending          │
│  🤝 Accept Bid      [○] Pending          │
│  📝 Contract        [○] Pending          │
│  💰 Purchase Order  [○] Pending          │
│  🚚 Track Shipment  [○] Pending          │
│  ✅ Delivery        [○] Pending          │
│  📋 Final Report    [○] Pending          │
│  🎉 Complete        [○] Pending          │
│                                          │
│  Progress: 1/11 stages (9%)              │
│  Estimated: 8 minutes remaining          │
└─────────────────────────────────────────┘

Real-time updates as each stage completes ✅
```

---

## 📋 Implementation Checklist

### Phase 1: Create Flow JSON ✅
- [ ] Create `procurement-11-stage.json` with all 11 steps
- [ ] Define visual blocks with proper icons
- [ ] Add step parameters and variable passing
- [ ] Configure directOutput for final stage
- [ ] Add metadata for auto-trigger

### Phase 2: Auto-Trigger ✅
- [ ] Add `procurement_workflow_detector` function to plugin
- [ ] Integrate with FlowExecutor
- [ ] Add websocket trigger for opening flow panel
- [ ] Test detection with various keywords

### Phase 3: Real-Time Updates ✅
- [ ] Modify FlowExecutor to broadcast status
- [ ] Add websocket events (running, complete, error)
- [ ] Include progress percentages
- [ ] Pass results between steps

### Phase 4: Frontend Integration ✅
- [ ] Add procurement icons to FlowPanel
- [ ] Update getStepIcon() mapping
- [ ] Style procurement flow blocks
- [ ] Add progress indicators
- [ ] Test real-time visual updates

### Phase 5: Testing ✅
- [ ] Test auto-trigger with "I need procurement help"
- [ ] Verify flow panel opens automatically
- [ ] Check real-time status updates
- [ ] Test complete 11-stage execution
- [ ] Verify final report generation

---

## 🎉 Expected Result

When user says **ANY** of these:
- "I need procurement help"
- "Source items for hotel"
- "Process this BOM file"
- "Find suppliers for furniture"
- "Start procurement workflow"

**System will**:
1. ✅ Detect procurement intent automatically
2. ✅ Load visual flow (11 blocks)
3. ✅ Open Flow Panel showing progress
4. ✅ Execute all stages in background
5. ✅ Update block status in real-time (pending → running → complete)
6. ✅ Return comprehensive final report

**Visual Progress**:
```
Step 1: 📄 Extract Items      [●] Complete → 30 items extracted
Step 2: ✅ Compliance          [●] Running... → Analyzing 12 issues
Step 3: 🏢 Match Suppliers     [○] Pending
...
```

---

## 💡 Benefits of This Approach

1. **Visual Feedback**: User sees exactly what's happening in real-time
2. **Background Execution**: Workflow runs without blocking chat
3. **Reusable**: Flow can be re-run with different parameters
4. **Editable**: Can open WorkflowBuilder to customize
5. **Shareable**: Flow JSON can be exported/imported
6. **Auto-Trigger**: No manual commands needed - just natural language
7. **Progress Tracking**: Visual blocks show completion status
8. **Professional**: Looks like enterprise workflow automation

---

## 🚀 Next Steps

1. **Create the JSON file** (procurement-11-stage.json)
2. **Add auto-trigger function** to procurement-orchestrator.js
3. **Test the flow** with "@agent help with procurement"
4. **Watch Flow Panel** open automatically with visual progress
5. **Enjoy automated procurement!** 🎉

This transforms procurement from 11 manual commands into **one natural language request with visual flow execution**! 🎯