# 📋 Implementation Plan: Data Connectors for AnythingLLM
## Leveraging Existing Structure & Patterns

---

## 🎯 Strategy: Minimal Changes, Maximum Impact

We'll integrate connectors by **following existing patterns** in AnythingLLM:
- Use the **same model pattern** as `systemSettings.js`, `workspace.js`, `documents.js`
- Follow the **agent plugin pattern** for tools
- Extend **existing UI tabs** in workspace settings
- Use **existing MCP infrastructure** for execution
- Leverage **existing background workers** for sync

---

## 📁 File Structure (Following Existing Patterns)

```
server/
├── models/
│   └── connectorTokens.js         # NEW: Like systemSettings.js pattern
│
├── utils/
│   ├── agents/
│   │   └── aibitat/
│   │       └── plugins/
│   │           └── data-connector.js  # NEW: Like sql-agent plugin
│   │
│   └── connectors/                # NEW: Like vectorDbProviders/ pattern
│       ├── index.js               # Factory pattern
│       ├── providers/
│       │   ├── shopify.js
│       │   ├── google.js
│       │   └── stripe.js
│       └── authManager.js         # Handles OAuth/API keys
│
├── endpoints/
│   └── api/
│       └── workspace/
│           └── connectors.js      # NEW: API endpoints
│
└── jobs/
    └── sync-connectors.js         # NEW: Background job

frontend/
└── src/
    └── pages/
        └── WorkspaceSettings/
            └── Connectors/         # NEW: UI tab
                ├── index.jsx
                └── ConnectorCard.jsx
```

---

## 🔧 Implementation Steps

### **Phase 1: Backend Foundation (Day 1)**

#### 1.1 Database Schema
```prisma
// Add to existing schema.prisma
model connector_tokens {
  id            Int      @id @default(autoincrement())
  workspaceId   Int
  provider      String   // shopify, google, stripe
  authMethod    String   // oauth, apikey
  encryptedData String   // Encrypted credentials
  status        String   @default("connected")
  lastSync      DateTime?
  lastError     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  workspace     workspaces @relation(fields: [workspaceId], references: [id])
  
  @@unique([workspaceId, provider])
}
```

#### 1.2 Model (Following SystemSettings Pattern)
```javascript
// server/models/connectorTokens.js
const ConnectorTokens = {
  // Follows EXACT same pattern as SystemSettings
  upsert: async function({ workspaceId, provider, credentials }) {
    // Store encrypted like SystemSettings stores sensitive data
  },
  
  get: async function({ workspaceId, provider }) {
    // Retrieve and decrypt
  },
  
  forWorkspace: async function(workspaceId) {
    // List all connections for workspace
  }
}
```

#### 1.3 Auth Manager (Following VectorDB Provider Pattern)
```javascript
// server/utils/connectors/index.js
function getConnectorProvider({ provider, authMethod = "apikey" }) {
  // Follows same pattern as getVectorDbClass()
  switch(provider) {
    case "shopify":
      return require("./providers/shopify");
    case "google":
      return require("./providers/google");
    default:
      throw new Error(`Unknown provider ${provider}`);
  }
}
```

---

### **Phase 2: Agent Integration (Day 2)**

#### 2.1 Agent Plugin (Following SQL Agent Pattern)
```javascript
// server/utils/agents/aibitat/plugins/data-connector.js
const dataConnector = {
  name: "data-connector",
  startupConfig: {
    params: {},
  },
  plugin: [
    // Sub-plugins like sql-agent
    ConnectorList,      // List connected services
    ConnectorQuery,     // Query data from service
    ConnectorSync,      // Trigger sync
    ConnectorConnect    // Connect new service
  ],
};
```

#### 2.2 MCP Wrapper (Using Existing MCP System)
```javascript
// server/storage/mcp-wrappers/connector-wrapper.js
// This wraps MCP servers with credentials from ConnectorTokens
async function wrapWithCredentials(provider, workspaceId) {
  const token = await ConnectorTokens.get({ workspaceId, provider });
  
  return {
    command: "npx",
    args: [`${provider}-mcp-server`],
    env: {
      ACCESS_TOKEN: token.credentials.accessToken
    }
  };
}
```

---

### **Phase 3: UI Integration (Day 3)**

#### 3.1 Add Tab to Workspace Settings
```javascript
// frontend/src/pages/WorkspaceSettings/index.jsx
// ADD to existing TABS object
const TABS = {
  "general-appearance": GeneralAppearance,
  "chat-settings": ChatSettings,
  "vector-database": VectorDatabase,
  "members": Members,
  "agent-config": WorkspaceAgentConfiguration,
  "connectors": WorkspaceConnectors,  // NEW
};

// ADD TabItem in the render
<TabItem
  title="Connectors"
  icon={<Plug className="h-6 w-6" />}
  to={paths.workspace.settings.connectors(slug)}
/>
```

#### 3.2 Connector Component (Following Members/AgentConfig Pattern)
```javascript
// frontend/src/pages/WorkspaceSettings/Connectors/index.jsx
export default function WorkspaceConnectors({ workspace }) {
  // Follows EXACT same pattern as Members or AgentConfig
  const [connectors, setConnectors] = useState([]);
  const [saving, setSaving] = useState(false);
  
  return (
    <div className="flex flex-col gap-y-4">
      <div className="bg-theme-bg-secondary rounded-lg p-4">
        <div className="flex items-center gap-x-4">
          {/* Grid of connector cards */}
        </div>
      </div>
    </div>
  );
}
```

---

### **Phase 4: Background Worker (Day 4)**

#### 4.1 Add Sync Job (Following existing BackgroundWorkers)
```javascript
// server/jobs/sync-connectors.js
module.exports = async function() {
  // Follows same pattern as sync-watched-documents.js
  const connections = await ConnectorTokens.all();
  
  for (const connection of connections) {
    const provider = getConnectorProvider(connection);
    const data = await provider.fetchLatest();
    await vectorizeAndStore(data, connection.workspaceId);
  }
};
```

#### 4.2 Register Job
```javascript
// server/utils/BackgroundWorkers/index.js
// ADD to jobs array
{
  name: "sync-connectors",
  interval: "30m",
  timeout: "5m"
}
```

---

### **Phase 5: API Endpoints (Day 4)**

#### 5.1 Add Connector Endpoints
```javascript
// server/endpoints/api/workspace/connectors.js
function apiWorkspaceConnectorEndpoints(app) {
  // GET /v1/workspace/:slug/connectors
  app.get("/v1/workspace/:slug/connectors", [validApiKey], async (req, res) => {
    // List connections
  });
  
  // POST /v1/workspace/:slug/connectors/connect
  app.post("/v1/workspace/:slug/connectors/connect", [validApiKey], async (req, res) => {
    // Connect new service
  });
  
  // DELETE /v1/workspace/:slug/connectors/:provider
  app.delete("/v1/workspace/:slug/connectors/:provider", [validApiKey], async (req, res) => {
    // Disconnect service
  });
}
```

#### 5.2 Register Routes
```javascript
// server/endpoints/api/index.js
// ADD import and registration
apiWorkspaceConnectorEndpoints(app);
```

---

## 🔌 OAuth Options (Modular)

### Option A: Nango (Drop-in)
```javascript
// .env
CONNECTOR_AUTH_METHOD=nango
NANGO_SECRET_KEY=xxx

// Auto-handles OAuth for 250+ providers
```

### Option B: Built-in (Simple)
```javascript
// .env
CONNECTOR_AUTH_METHOD=builtin

// Manual OAuth implementation per provider
```

### Option C: Direct (Simplest)
```javascript
// .env
CONNECTOR_AUTH_METHOD=direct

// Users paste API keys directly
```

---

## ✅ What We're Reusing

1. **EncryptionManager** - For storing credentials (already used for API keys)
2. **Prisma patterns** - Same as all other models
3. **Agent plugin system** - Like sql-agent
4. **MCP infrastructure** - Already handles external tools
5. **Background workers** - Bree already configured
6. **UI components** - Same styling as other settings tabs
7. **API patterns** - Same as other workspace endpoints
8. **WebSocket** - For real-time sync status

---

## 🚀 Minimal Viable Product (MVP)

**Week 1 Goal:**
1. One provider (Shopify)
2. Direct API key auth
3. Basic UI in settings
4. Agent can query data
5. Manual sync button

**Week 2 Additions:**
1. OAuth via Nango
2. Google Calendar
3. Auto-sync every 30min
4. Webhook support

**Week 3 Polish:**
1. 5+ providers
2. Visual sync status
3. Error handling
4. Rate limiting

---

## 🎯 Key Benefits of This Approach

1. **No major refactoring** - Uses all existing patterns
2. **Modular** - Each provider is independent
3. **Secure** - Uses existing encryption
4. **Scalable** - Can add providers easily
5. **User-friendly** - Fits existing UI
6. **Agent-ready** - Works with current agent system
7. **Future-proof** - Ready for enterprise features

---

## 📊 Testing Plan

1. **Unit Tests** - Test each provider independently
2. **Integration Tests** - Test with agent system
3. **E2E Tests** - Test full flow from UI to data query
4. **Security Tests** - Verify encryption and isolation
5. **Performance Tests** - Test with large datasets

---

## 🔐 Security Considerations

1. **Credential Storage** - Use existing EncryptionManager
2. **Workspace Isolation** - Each workspace has separate tokens
3. **Token Refresh** - Handle expiry gracefully
4. **Audit Logging** - Use existing EventLogs
5. **Rate Limiting** - Use existing middleware

---

## 📝 Documentation Needed

1. **User Guide** - How to connect services
2. **Developer Guide** - How to add new providers
3. **API Docs** - Endpoint documentation
4. **Security Guide** - Best practices

---

## ⏱️ Timeline

**Total: 2 weeks for production-ready MVP**

- **Days 1-2**: Backend foundation
- **Days 3-4**: Agent integration
- **Days 5-6**: UI implementation
- **Days 7-8**: Background workers & sync
- **Days 9-10**: Testing & polish
- **Days 11-12**: Documentation
- **Days 13-14**: Buffer & deployment

This plan ensures we:
- ✅ Use ALL existing patterns
- ✅ Don't break anything
- ✅ Ship incrementally
- ✅ Stay modular
- ✅ Remain extensible