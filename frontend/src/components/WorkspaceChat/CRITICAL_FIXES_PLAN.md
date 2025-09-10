# Critical Fixes Implementation Plan

## Priority 1: Fix Email Content Generation

### Problem
Agent sends emails with placeholder text `[Your Name]` instead of actual user information.

### Solution
```javascript
// server/utils/agents/aibitat/plugins/gmail-enhanced.js
class GmailEnhancedPlugin {
  constructor(workspace, user) {
    this.workspace = workspace;
    this.user = user;
    this.userName = user?.username || workspace?.name || 'Team Member';
  }

  async sendEmail({ to, subject, body }) {
    // Auto-replace placeholders
    const enhancedBody = body
      .replace(/\[Your Name\]/gi, this.userName)
      .replace(/\[Company\]/gi, this.workspace.name);
    
    // Add signature if not present
    if (!enhancedBody.includes('Best regards')) {
      enhancedBody += `\n\nBest regards,\n${this.userName}`;
    }
    
    return await this.gmailService.send({
      to,
      subject,
      body: enhancedBody
    });
  }
}
```

## Priority 2: Real-Time Tool Display in UI

### Current Flow (Broken)
```
User Message → 3 dots → "Thinking..." → Generic steps → Result
```

### Fixed Flow
```
User Message → Tool Recognition → Live Execution → Metrics → Result
```

### Implementation

#### 1. WebSocket Event Stream
```javascript
// server/endpoints/agentWebsocket.js
socket.on('agent_message', async (data) => {
  // Emit tool recognition immediately
  socket.emit('tool_recognized', {
    messageId: data.id,
    tools: detectedTools,
    timestamp: Date.now()
  });

  // Emit execution updates
  socket.emit('tool_executing', {
    messageId: data.id,
    tool: 'gmail:send_email',
    status: 'active',
    progress: 30
  });

  // Emit metrics after completion
  socket.emit('execution_complete', {
    messageId: data.id,
    metrics: {
      time: '2.1s',
      model: 'gpt-4o',
      cost: 0.024,
      confidence: 95
    }
  });
});
```

#### 2. Frontend Real-Time Updates
```jsx
// components/WorkspaceChat/ChatContainer/ChatHistory/LiveMessage.jsx
function LiveMessage({ message, workspace }) {
  const [tools, setTools] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [executionStage, setExecutionStage] = useState('initializing');

  useEffect(() => {
    const socket = getWebSocket();

    socket.on('tool_recognized', (data) => {
      if (data.messageId === message.id) {
        setTools(data.tools);
        setExecutionStage('recognized');
      }
    });

    socket.on('tool_executing', (data) => {
      if (data.messageId === message.id) {
        setTools(prev => prev.map(t => 
          t.name === data.tool 
            ? { ...t, status: data.status, progress: data.progress }
            : t
        ));
        setExecutionStage('executing');
      }
    });

    socket.on('execution_complete', (data) => {
      if (data.messageId === message.id) {
        setMetrics(data.metrics);
        setExecutionStage('complete');
      }
    });

    return () => {
      socket.off('tool_recognized');
      socket.off('tool_executing');
      socket.off('execution_complete');
    };
  }, [message.id]);

  return (
    <div className="message-wrapper">
      {/* Show live tool status */}
      {executionStage === 'recognized' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Preparing to use: {tools.map(t => t.name).join(', ')}</span>
        </div>
      )}

      {executionStage === 'executing' && (
        <div className="space-y-2">
          {tools.map(tool => (
            <ToolExecutionBar 
              key={tool.id}
              tool={tool}
              progress={tool.progress}
            />
          ))}
        </div>
      )}

      {/* Main message content */}
      <MessageContent content={message.content} />

      {/* Metrics bar (like landing page demo) */}
      {metrics && (
        <CompactMetricsBar 
          tools={tools}
          metrics={metrics}
        />
      )}
    </div>
  );
}
```

## Priority 3: Fix Database Timeout Issues

### Problem
Prisma connection timing out during agent invocation updates.

### Solution
```javascript
// server/models/workspaceAgentInvocation.js
const { PrismaClient } = require('@prisma/client');

// Create a dedicated client with longer timeout
const prismaAgent = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Increase timeout for agent operations
  connectionTimeout: 20000, // 20 seconds
  queryTimeout: 30000, // 30 seconds
});

// Use connection pooling
const pool = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  acquireTimeoutMillis: 30000
};

// Implement queue for updates
class InvocationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  async add(invocationId, data) {
    this.queue.push({ invocationId, data });
    if (!this.processing) {
      this.process();
    }
  }

  async process() {
    this.processing = true;
    while (this.queue.length > 0) {
      const { invocationId, data } = this.queue.shift();
      try {
        await this.updateInvocation(invocationId, data);
      } catch (error) {
        console.error(`Failed to update invocation ${invocationId}:`, error);
        // Store in fallback storage
        await this.storeFallback(invocationId, data);
      }
    }
    this.processing = false;
  }

  async updateInvocation(id, data) {
    return await prismaAgent.workspace_agent_invocations.update({
      where: { id },
      data: {
        ...data,
        closed: true,
        closedAt: new Date()
      }
    });
  }

  async storeFallback(id, data) {
    // Write to file as backup
    const fs = require('fs').promises;
    const fallbackPath = `./storage/invocation_fallback/${id}.json`;
    await fs.writeFile(fallbackPath, JSON.stringify({ id, data, timestamp: Date.now() }));
  }
}

const invocationQueue = new InvocationQueue();
```

## Priority 4: Unified Message Display Component

### Replace Current Components
```
REMOVE:
- DebugMessage.jsx (too verbose)
- AgentThinking.jsx (generic steps)
- ProcessingIndicator (multiple modes)
- ThinkingMetrics (separate component)

ADD:
- UnifiedMessage/index.jsx (single source of truth)
```

### Unified Component Structure
```jsx
// components/WorkspaceChat/ChatContainer/ChatHistory/UnifiedMessage/index.jsx
export default function UnifiedMessage({ 
  message, 
  workspace,
  isLive = false 
}) {
  const [stage, setStage] = useState('idle');
  const [tools, setTools] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);

  // Single source for all message states
  const renderContent = () => {
    switch(stage) {
      case 'initializing':
        return <InitializingState />;
      
      case 'tool_detection':
        return <ToolDetectionState tools={tools} />;
      
      case 'executing':
        return <ExecutionState tools={tools} progress={progress} />;
      
      case 'complete':
        return (
          <>
            <MessageContent content={message.content} />
            <MetricsBar tools={tools} metrics={metrics} />
          </>
        );
      
      case 'error':
        return <ErrorState error={message.error} />;
      
      default:
        return <MessageContent content={message.content} />;
    }
  };

  return (
    <div className="unified-message">
      <WorkspaceProfileImage workspace={workspace} />
      <div className="message-body">
        {renderContent()}
        {debugInfo.length > 0 && (
          <DebugAccordion items={debugInfo} />
        )}
      </div>
    </div>
  );
}
```

## Priority 5: Debug Information Display

### Convert Debug Logs to User-Friendly Display
```javascript
// utils/debugParser.js
export function parseDebugLog(log) {
  const patterns = {
    toolAttempt: /\[debug\]: @agent is attempting to call `(.+)` tool/,
    toolExecution: /Executing MCP server: (.+) with/,
    toolComplete: /MCP server: (.+) completed successfully/,
    cost: /cost: ([\d.]+)/,
    model: /::(\w+):(.+)$/
  };

  if (patterns.toolAttempt.test(log)) {
    const tool = log.match(patterns.toolAttempt)[1];
    return {
      type: 'tool_attempt',
      display: `Preparing ${tool.replace(/_/g, ' ')}`,
      icon: '🔧',
      status: 'pending'
    };
  }

  if (patterns.toolExecution.test(log)) {
    const tool = log.match(patterns.toolExecution)[1];
    return {
      type: 'tool_execution',
      display: `Running ${tool}`,
      icon: '⚡',
      status: 'active'
    };
  }

  if (patterns.toolComplete.test(log)) {
    return {
      type: 'tool_complete',
      display: 'Operation completed',
      icon: '✅',
      status: 'complete'
    };
  }

  // Hide verbose logs from user
  return null;
}
```

## Implementation Timeline

### Week 1: Core Fixes
- [ ] Fix email placeholder replacement
- [ ] Implement WebSocket event streaming
- [ ] Fix database timeout issues

### Week 2: UI Components
- [ ] Build UnifiedMessage component
- [ ] Implement real-time tool display
- [ ] Add metrics bar to all messages

### Week 3: Integration
- [ ] Replace all message components with UnifiedMessage
- [ ] Connect WebSocket events to UI
- [ ] Test with all agent providers

### Week 4: Polish
- [ ] Add animations and transitions
- [ ] Optimize performance
- [ ] Add user preferences for debug display

## Success Metrics
1. **No placeholders** in sent emails
2. **Real-time tool display** within 100ms
3. **Zero database timeouts**
4. **Unified UI** across all message types
5. **Metrics visible** on every agent response

## Configuration
```javascript
// config/agent.js
module.exports = {
  display: {
    showDebugInfo: false, // Hide by default
    showMetrics: true,
    showTools: true,
    animationSpeed: 'normal'
  },
  database: {
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000
  },
  websocket: {
    emitInterval: 100, // ms between updates
    batchUpdates: true
  }
};
```