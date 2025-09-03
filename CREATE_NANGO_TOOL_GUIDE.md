# Creating a New Nango Tool Integration

This guide walks you through creating a new Nango tool integration for AnythingLLM.

## Method 1: Using the Universal Integration System (Recommended)

### Step 1: Create Integration Config
```javascript
const integrationConfig = {
  service: "your-service-name",        // e.g., "slack", "notion", "trello"
  workspaceId: "workspace-id",         // Target workspace
  capabilities: ['sync', 'search', 'create'], // What the tool can do
  syncFrequency: '15m',               // How often to sync data
  discoveryMethod: 'auto'             // Let system auto-discover API
};
```

### Step 2: Run Integration
```javascript
const { UniversalIntegrationSystem } = require('./server/utils/integrations/UniversalIntegrationSystem');

const system = new UniversalIntegrationSystem();
const result = await system.integrate(integrationConfig);
```

This automatically:
- 🔍 Discovers the API structure
- 📝 Generates Nango sync/action scripts
- ⚙️ Configures MCP tools
- 🗄️ Sets up vector storage
- 🔄 Starts syncing data

## Method 2: Manual Integration (Custom Control)

### Step 1: Configure Nango Provider

1. **Add to Nango Dashboard** (https://app.nango.dev):
   - Go to Integrations → Add Integration
   - Set provider name (e.g., `slack`)
   - Add OAuth credentials from the service
   - Set required scopes

### Step 2: Create Nango Sync Script

Create `/nango-integrations/[provider]/syncs/fetch-data.ts`:

```typescript
import type { NangoSync, SlackMessage } from './models';

export default async function fetchData(nango: NangoSync): Promise<void> {
    const connection = await nango.getConnection();
    let nextCursor = null;
    
    do {
        const response = await nango.get({
            endpoint: `/conversations.history?channel=general&cursor=${nextCursor || ''}`,
            retries: 3
        });

        const messages = response.data.messages || [];
        
        // Transform to standard format
        const records = messages.map(msg => ({
            id: msg.ts,
            text: msg.text,
            user: msg.user,
            timestamp: msg.ts,
            channel: 'general',
            metadata: msg
        }));

        await nango.batchSave(records, 'SlackMessage');
        
        nextCursor = response.data.response_metadata?.next_cursor;
        
    } while (nextCursor);
}
```

### Step 3: Create Integration YAML

Create `/nango-integrations/[provider]/nango.yaml`:

```yaml
integrations:
  slack-messages:
    runs: every 15 minutes
    description: Sync Slack messages for AI search
    output: SlackMessage
    sync_type: full
    endpoint: GET /conversations.history
    scopes:
      - channels:history
      - groups:history
      - im:history
```

### Step 4: Define Data Models

Create `/nango-integrations/[provider]/models.ts`:

```typescript
export interface SlackMessage {
    id: string;
    text: string;
    user: string;
    timestamp: string;
    channel: string;
    metadata?: any;
}

export interface SlackChannel {
    id: string;
    name: string;
    is_private: boolean;
    members?: string[];
}
```

### Step 5: Create Agent Plugin

Create `/server/utils/agents/aibitat/plugins/slack-connector.js`:

```javascript
const AgentPlugin = require("./AgentPlugin");

class SlackConnector extends AgentPlugin {
  name = "slack-connector";
  description = "Connect and query Slack data";
  
  setup() {
    this.functions = [
      {
        name: "search_slack_messages",
        description: "Search through synced Slack messages",
        parameters: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            channel: { type: "string", description: "Channel to search in" },
            limit: { type: "number", default: 10 }
          },
          required: ["query"]
        },
        handler: this.searchMessages.bind(this)
      },
      {
        name: "send_slack_message",
        description: "Send message to Slack channel",
        parameters: {
          type: "object", 
          properties: {
            channel: { type: "string", description: "Channel ID or name" },
            message: { type: "string", description: "Message to send" }
          },
          required: ["channel", "message"]
        },
        handler: this.sendMessage.bind(this)
      }
    ];
  }

  async searchMessages({ query, channel, limit = 10 }) {
    const { NangoIntegration } = require("../../../connectors/nango-integration");
    const nango = new NangoIntegration();
    
    try {
      // Search through synced data
      const results = await nango.searchSyncedData('slack', 'SlackMessage', {
        query,
        filters: channel ? { channel } : {},
        limit
      });
      
      return {
        success: true,
        messages: results,
        count: results.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendMessage({ channel, message }) {
    const { NangoIntegration } = require("../../../connectors/nango-integration");
    const nango = new NangoIntegration();
    
    try {
      const result = await nango.triggerAction('slack', 'send-message', {
        channel,
        text: message
      });
      
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = SlackConnector;
```

### Step 6: Register Plugin

Add to `/server/utils/agents/aibitat/plugins/index.js`:

```javascript
const SlackConnector = require("./slack-connector");

module.exports = {
  // ... other plugins
  "slack-connector": SlackConnector,
};
```

## Method 3: Using the Nango Generator

### Quick Generation
```javascript
const { NangoIntegrationGenerator } = require('./server/utils/connectors/nango-integration-generator');

const generator = new NangoIntegrationGenerator();
const integration = await generator.generateIntegration({
  provider: 'slack',
  integrationName: 'slack-messages',
  type: 'sync',
  description: 'Sync Slack messages for AI search',
  apiEndpoint: '/conversations.history',
  fieldMapping: {
    id: 'ts',
    name: 'user', 
    description: 'text',
    createdAt: 'ts'
  },
  workspaceId: 'your-workspace-id'
});
```

## Testing Your Integration

### 1. Test OAuth Connection
```bash
curl -X POST http://localhost:3001/api/workspace/your-slug/connectors/connect \
  -H "Content-Type: application/json" \
  -d '{"provider": "slack"}'
```

### 2. Test Agent Functions
In the chat interface:
```
"Search my Slack messages about project updates"
"Send a message to the team channel"
"What did John say yesterday in Slack?"
```

### 3. Check Sync Status
```bash
curl http://localhost:3001/api/workspace/your-slug/connectors
```

## Common Integration Patterns

### Sync Integration (Data Import)
- **Use for**: Importing data for AI search/analysis
- **Examples**: Messages, documents, tickets, products
- **Frequency**: Every 15 minutes to daily
- **Storage**: Vector database for semantic search

### Action Integration (Commands)
- **Use for**: Sending data or triggering actions
- **Examples**: Send message, create ticket, update status
- **Trigger**: On-demand via agent commands
- **Response**: Immediate feedback to user

### Webhook Integration (Real-time)
- **Use for**: Real-time updates and notifications
- **Setup**: Configure webhook URL in service
- **Handler**: Process incoming webhook data
- **Action**: Update vector storage or trigger actions

## Advanced Configurations

### Custom Field Mapping
```javascript
const fieldMapping = {
  id: 'custom_id',
  title: 'display_name', 
  content: 'body_text',
  timestamp: 'created_date',
  author: 'user.name'
};
```

### Multiple Endpoints
```yaml
integrations:
  service-messages:
    endpoints:
      - path: /messages
        method: GET
        output: Message
      - path: /channels  
        method: GET
        output: Channel
```

### Custom Scopes
```yaml
integrations:
  service-connector:
    scopes:
      - read:messages
      - write:channels
      - admin:workspace
```

## Troubleshooting

### OAuth Issues
- Verify redirect URLs match Nango configuration
- Check scopes are properly configured
- Ensure OAuth app is approved by service

### Sync Issues
- Check Nango logs for API errors
- Verify rate limits aren't exceeded
- Ensure field mappings are correct

### Agent Issues
- Verify plugin is registered in index.js
- Check function parameters match schema
- Test functions return proper format

## Next Steps

1. **Scale**: Add more endpoints and capabilities
2. **Optimize**: Implement delta syncs for large datasets  
3. **Monitor**: Set up alerts for sync failures
4. **Enhance**: Add custom preprocessing and enrichment
5. **Share**: Contribute successful integrations back to community

## Resources

- [Nango Documentation](https://docs.nango.dev)
- [AnythingLLM Agent Plugin Guide](https://docs.anythingllm.com/agent/plugins)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [OAuth Provider Documentation](https://oauth.net/code/)