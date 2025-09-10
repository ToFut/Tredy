# Unified Message Design Implementation Plan

## Current State Analysis

### Existing Loading/Display States
1. **DebugMessage.jsx** - Shows agent debug info with different states (attempt, execution, success, error)
2. **ProcessingIndicator** - Multiple stage indicators with different modes (research, create, analyze, smart)
3. **AgentThinking.jsx** - Step-by-step thinking animation with progress
4. **ThinkingMetrics** - Detailed metrics display with expandable timeline
5. **PromptReply** - Main message display with dot-falling loader
6. **AgentStatus/AgentIndicator** - Various agent state displays
7. **Three dots loading** - Simple loading animation

### Problems to Solve
- Multiple inconsistent loading UIs
- Debug messages are too verbose
- Metrics are spread across different components
- No unified tool display system
- Agent invocations have different UIs
- Loading states don't show progress clearly

## Proposed Unified Design System

### Core Components Structure

```
UnifiedMessage/
├── index.jsx                  # Main message wrapper
├── MessageContent.jsx         # Actual message content
├── MetricsBar.jsx            # Compact metrics line (like our demo)
├── ToolDisplay.jsx           # Tool logos and status
├── ThinkingLog.jsx           # Expandable thinking process
├── LoadingState.jsx          # Unified loading component
└── utils/
    ├── toolLogos.js          # Tool icon/logo mapping
    ├── messageParser.js      # Parse different message formats
    └── metricsCalculator.js # Calculate and format metrics
```

### 1. Unified Message Component

```jsx
// UnifiedMessage/index.jsx
export default function UnifiedMessage({ 
  message, 
  isLoading, 
  metrics, 
  tools, 
  thinking,
  error,
  workspace 
}) {
  return (
    <div className="unified-message">
      {/* Profile Image */}
      <WorkspaceProfileImage workspace={workspace} />
      
      {/* Message Container */}
      <div className="message-container">
        {/* Main Content */}
        <MessageContent 
          content={message}
          isLoading={isLoading}
          error={error}
        />
        
        {/* Compact Metrics Bar (only if has metrics) */}
        {(tools || metrics) && !isLoading && (
          <MetricsBar 
            tools={tools}
            metrics={metrics}
            thinking={thinking}
          />
        )}
      </div>
    </div>
  );
}
```

### 2. Compact Metrics Bar Design

```jsx
// MetricsBar.jsx
function MetricsBar({ tools, metrics, thinking }) {
  const [expandedThinking, setExpandedThinking] = useState(false);
  
  return (
    <>
      <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
        {/* Tool Logos */}
        <ToolLogos tools={tools} />
        
        {/* Separator */}
        <span className="text-gray-300">•</span>
        
        {/* Execution Time */}
        <MetricItem icon={Zap} value={metrics.time} />
        
        {/* Confidence Bar */}
        <ConfidenceBar value={metrics.confidence} />
        
        {/* Model */}
        <MetricItem icon={Cpu} value={metrics.model} />
        
        {/* Expandable Thinking */}
        {thinking && (
          <>
            <span className="text-gray-300">•</span>
            <button onClick={() => setExpandedThinking(!expandedThinking)}>
              <Brain className="w-3 h-3" />
              Details
              <ChevronRight className={expandedThinking ? 'rotate-90' : ''} />
            </button>
          </>
        )}
      </div>
      
      {/* Expanded Thinking Log */}
      {expandedThinking && <ThinkingLog steps={thinking} />}
    </>
  );
}
```

### 3. Unified Loading State

```jsx
// LoadingState.jsx
function LoadingState({ stage, progress, tools }) {
  return (
    <div className="loading-state">
      {/* Main loading message */}
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin" />
        <span>{stage || "Processing..."}</span>
      </div>
      
      {/* Tool indicators (if actively using tools) */}
      {tools && tools.length > 0 && (
        <div className="flex items-center gap-2 mt-2">
          {tools.map(tool => (
            <ToolIndicator 
              key={tool.id}
              tool={tool}
              status={tool.status} // 'pending', 'active', 'complete'
            />
          ))}
        </div>
      )}
      
      {/* Progress bar (if available) */}
      {progress && (
        <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
          <div 
            className="bg-purple-600 h-1 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

### 4. Tool Logos System

```javascript
// utils/toolLogos.js
export const TOOL_LOGOS = {
  // MCP Tools
  'gmail': '/icons/gmail.svg',
  'google-calendar': '/icons/google-calendar.svg',
  'google-drive': '/icons/google-drive.svg',
  'linkedin': '/icons/linkedin.svg',
  
  // Internal Tools
  'web-search': SearchIcon,
  'document-summarizer': DocumentIcon,
  'rag-memory': BrainIcon,
  'create-workflow': WorkflowIcon,
  
  // Fallback
  'default': ToolIcon
};

export function getToolLogo(toolName) {
  // Normalize tool name
  const normalized = toolName.toLowerCase().replace(/_/g, '-');
  return TOOL_LOGOS[normalized] || TOOL_LOGOS.default;
}
```

## Implementation Strategy

### Phase 1: Create Base Components (Week 1)
1. Create UnifiedMessage component structure
2. Build MetricsBar with tool logos
3. Implement LoadingState component
4. Create tool logo mapping system

### Phase 2: Integration (Week 2)
1. Replace PromptReply rendering with UnifiedMessage
2. Convert debug messages to use MetricsBar
3. Integrate with WebSocket for real-time updates
4. Handle backward compatibility

### Phase 3: Migration (Week 3)
1. Update AgentThinking to use LoadingState
2. Merge ProcessingIndicator into LoadingState
3. Consolidate ThinkingMetrics into MetricsBar
4. Remove redundant components

### Phase 4: Polish (Week 4)
1. Add animations and transitions
2. Optimize performance
3. Add error states
4. Test with different providers

## WebSocket Integration

```javascript
// Handle real-time updates
socket.on('agent_status', (data) => {
  updateMessage({
    id: data.messageId,
    tools: data.tools,
    metrics: {
      time: data.executionTime,
      confidence: data.confidence,
      model: data.model
    },
    thinking: data.thinking
  });
});

socket.on('tool_update', (data) => {
  updateToolStatus({
    messageId: data.messageId,
    toolId: data.toolId,
    status: data.status, // 'pending', 'active', 'complete', 'error'
    result: data.result
  });
});
```

## Backward Compatibility

### Message Format Adapter
```javascript
// utils/messageAdapter.js
export function adaptLegacyMessage(message) {
  // Convert old format to new unified format
  if (message.type === 'debug') {
    return {
      content: parseDebugContent(message.content),
      tools: extractToolsFromDebug(message),
      metrics: extractMetricsFromDebug(message)
    };
  }
  
  if (message.agentStatus) {
    return {
      content: message.text,
      tools: message.agentStatus.tools,
      metrics: {
        time: message.agentStatus.duration,
        model: message.agentStatus.model
      }
    };
  }
  
  // Default passthrough
  return message;
}
```

## Configuration

```javascript
// config/messageDisplay.js
export const MESSAGE_CONFIG = {
  // Feature flags for gradual rollout
  enableUnifiedDesign: true,
  enableToolLogos: true,
  enableCompactMetrics: true,
  enableThinkingLog: true,
  
  // Display options
  showDebugMessages: false, // Hide debug by default
  autoExpandThinking: false,
  maxToolsDisplay: 5,
  
  // Animation settings
  loadingAnimationSpeed: 'normal', // 'slow', 'normal', 'fast'
  enableTransitions: true
};
```

## CSS Classes (Tailwind)

```css
/* Compact metrics bar */
.metrics-bar {
  @apply flex items-center gap-3 text-xs text-gray-600 px-1 mt-2;
}

/* Tool logo container */
.tool-logo {
  @apply w-5 h-5 rounded relative group;
}

/* Confidence bar */
.confidence-bar {
  @apply w-12 bg-gray-200 rounded-full h-1.5;
}

/* Loading state */
.loading-pulse {
  @apply animate-pulse bg-gradient-to-r from-purple-100 to-purple-50;
}
```

## Benefits of This Approach

1. **Consistency**: Single design system for all message types
2. **Performance**: Reduced re-renders with unified state
3. **Maintainability**: Clear component separation
4. **Extensibility**: Easy to add new tools/metrics
5. **User Experience**: Clean, professional interface
6. **Developer Experience**: Clear API and documentation

## Migration Checklist

- [ ] Create UnifiedMessage component
- [ ] Implement MetricsBar with tool logos
- [ ] Build LoadingState component
- [ ] Create tool logo mapping
- [ ] Update PromptReply to use UnifiedMessage
- [ ] Convert DebugMessage to metrics format
- [ ] Integrate WebSocket updates
- [ ] Add message format adapter
- [ ] Update AgentThinking component
- [ ] Merge ProcessingIndicator
- [ ] Consolidate ThinkingMetrics
- [ ] Add animations
- [ ] Test with all providers
- [ ] Update documentation
- [ ] Remove deprecated components

## Testing Strategy

1. **Unit Tests**: Each component in isolation
2. **Integration Tests**: Message flow with WebSocket
3. **Visual Regression**: Screenshot comparisons
4. **Performance Tests**: Render time and memory usage
5. **Provider Tests**: Test with each LLM provider
6. **Edge Cases**: Error states, long messages, many tools

## Rollout Plan

1. **Alpha**: Internal testing with feature flag
2. **Beta**: Gradual rollout to 10% of users
3. **GA**: Full rollout with fallback option
4. **Cleanup**: Remove old components after 30 days

This implementation plan provides a clear path to unify the message display system while maintaining backward compatibility and improving the user experience.