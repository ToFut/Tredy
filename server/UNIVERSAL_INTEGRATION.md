# Universal Integration System Documentation

## Overview
The Universal Integration System allows AnythingLLM to connect to ANY external service automatically through natural language commands. It leverages Nango for OAuth management, creates MCP servers for tool access, and stores data in vector databases for semantic search.

## Quick Start

### Basic Integration
```
@agent integrate Slack
@agent connect GitHub  
@agent add Shopify store
```

### Advanced Integration
```
@agent integrate Salesforce with these capabilities:
- Sync contacts, opportunities every 30m
- Enable create lead, update contact operations  
- Store in vectors: name, email, description
- Webhooks for opportunity.closed
```

## Architecture

```
User Command → Agent Plugin → Integration System → Nango + MCP + Vector DB
```

### Components

1. **UniversalIntegrationSystem** (`/utils/integrations/UniversalIntegrationSystem.js`)
   - Core integration engine
   - API discovery
   - Script generation
   - Deployment orchestration

2. **Universal Integrator Plugin** (`/utils/agents/aibitat/plugins/universal-integrator.js`)
   - Natural language interface
   - Integration management commands
   - Cross-service search

3. **Universal Nango MCP** (`/universal-nango-mcp.js`)
   - Generic MCP server for any provider
   - Smart data routing (sync vs proxy)
   - Dynamic tool generation

4. **MCP Nango Bridge** (`/utils/connectors/mcp-nango-bridge.js`)
   - OAuth flow management
   - MCP configuration generation
   - Token management

## Supported Services

### Pre-built Templates (Instant Setup)
- Slack - Team communication
- GitHub - Code repositories
- Google Calendar - Events and scheduling
- Shopify - E-commerce
- Stripe - Payments
- Notion - Notes and databases
- Linear - Project management
- Salesforce - CRM
- HubSpot - Marketing automation

### Auto-Discovery (Any Service with API)
- OpenAPI/Swagger services
- GraphQL endpoints
- REST APIs
- SOAP services (limited)

## Commands

### Integration Management
| Command | Description | Example |
|---------|-------------|---------|
| `integrate_service` | Connect new service | `@agent integrate Slack` |
| `list_integrations` | Show connected services | `@agent show my integrations` |
| `sync_service` | Refresh service data | `@agent sync GitHub data` |
| `disconnect_service` | Remove integration | `@agent disconnect Shopify` |
| `search_integrations` | Search across services | `@agent find meetings about AI` |
| `create_workflow` | Automate between services | `@agent when GitHub issue created, post to Slack` |

### Service-Specific Operations
Once integrated, each service provides:
- Search: `@agent search Slack for product discussions`
- Create: `@agent create GitHub issue about bug`
- Update: `@agent update Salesforce contact email`
- Delete: `@agent delete old Shopify products`

## How It Works

### 1. Discovery Phase
```javascript
// System automatically discovers API structure
1. Check for OpenAPI/Swagger spec
2. Try GraphQL introspection
3. Probe common REST patterns
4. Use pre-built template
```

### 2. Generation Phase
```javascript
// Generates integration files
- sync.ts         // Nango sync script
- actions.ts      // API actions
- models.ts       // TypeScript models
- nango.yaml      // Configuration
- mcp-tools.json  // Tool definitions
```

### 3. Deployment Phase
```javascript
// Deploys to infrastructure
1. Upload to Nango
2. Configure MCP server
3. Setup vector storage
4. Enable webhooks
5. Start initial sync
```

### 4. Runtime Phase
```javascript
// Smart data routing
if (semantic_search) → Vector DB (fast)
else if (recent_data) → Direct API (fresh)
else if (bulk_data) → Synced Records (efficient)
else → Hybrid approach
```

## Configuration

### Environment Variables
```bash
# Required
NANGO_SECRET_KEY=your-nango-secret
NANGO_HOST=https://api.nango.dev

# Optional
NANGO_WEBHOOK_SECRET=webhook-verification-secret
VECTOR_DB=lancedb|pinecone|weaviate
EMBEDDING_ENGINE=openai|cohere|local
```

### Workspace Settings
```javascript
{
  "integrations": {
    "autoDiscovery": true,      // Enable API discovery
    "syncToVector": true,       // Store in vector DB
    "defaultSyncInterval": "15m", // Default sync frequency
    "maxSyncRecords": 10000     // Limit per sync
  }
}
```

## Advanced Features

### Cross-Service Workflows
```
@agent when Stripe payment received, 
       create Shopify order and 
       send Slack notification to #sales
```

### Semantic Search
```
@agent find all customer interactions about refunds
// Searches: Slack, Email, Support tickets, etc.
```

### Data Relationships
```
@agent show customer journey for john@example.com
// Links: Shopify orders → Stripe payments → Support tickets
```

### Bulk Operations
```
@agent sync all Salesforce contacts to Mailchimp
```

## Troubleshooting

### Integration Fails
1. Check service name spelling
2. Verify API is accessible
3. Ensure OAuth credentials in Nango
4. Check workspace permissions

### Sync Not Working
1. Verify webhook URL is accessible
2. Check Nango sync configuration
3. Review sync logs: `@agent show sync logs`
4. Ensure vector DB has space

### Tools Not Appearing
1. Restart MCP server
2. Check MCP configuration file
3. Verify agent provider is configured
4. Review tool generation logs

## API Reference

### Integration Config
```typescript
interface IntegrationConfig {
  service: string;
  workspaceId: number;
  capabilities?: ('sync' | 'search' | 'create' | 'update' | 'delete')[];
  syncFrequency?: '5m' | '15m' | '30m' | '1h' | '6h' | 'daily';
  discoveryMethod?: 'auto' | 'openapi' | 'graphql' | 'manual';
  syncData?: string[]; // Specific models to sync
  webhooks?: boolean;
  vectorFields?: string[]; // Fields to index
}
```

### Integration Result
```typescript
interface IntegrationResult {
  success: boolean;
  service: string;
  endpoints: number;
  models: number;
  capabilities: string[];
  syncFrequency: string;
  status: 'active' | 'pending' | 'error';
  error?: string;
}
```

## Performance

### Sync Performance
- Initial sync: 100-1000 records/second
- Incremental sync: 500-5000 records/second
- Vector indexing: 50-200 records/second

### Query Performance
- Vector search: <100ms
- Direct API: 200-2000ms (depends on service)
- Synced records: <50ms

### Storage Requirements
- Base: ~1KB per record
- With vectors: ~5KB per record
- Indexes: +20% overhead

## Security

### Data Protection
- OAuth tokens encrypted at rest
- API keys stored in secure vault
- Webhook signatures verified
- Data encrypted in transit

### Access Control
- Workspace-level isolation
- User permission checks
- Rate limiting per service
- Audit logging

## Extending the System

### Adding New Templates
1. Create folder: `/templates/integrations/[service-name]/`
2. Add files:
   - `sync.ts` - Data sync logic
   - `actions.ts` - API operations
   - `config.json` - Service metadata
3. Register in template registry

### Custom Discovery Engine
```javascript
class CustomDiscovery {
  async discover(service) {
    // Your discovery logic
    return {
      endpoints: [...],
      models: [...],
      capabilities: [...]
    };
  }
}
```

### Vector Field Optimization
```javascript
// Customize what gets indexed
{
  "vectorFields": ["title", "description", "content"],
  "excludeFields": ["id", "timestamps", "internal_data"],
  "customExtractor": "extractSearchableContent"
}
```

## Roadmap

### Phase 1 ✅ (Complete)
- Core infrastructure
- Basic integrations
- Manual configuration

### Phase 2 ✅ (Complete)
- Popular service templates
- Agent plugin
- Vector storage

### Phase 3 ✅ (Complete)
- API discovery
- Auto-generation
- Smart routing

### Phase 4 ✅ (Complete)
- Cross-service search
- Workflow automation
- Learning system

### Phase 5 (Future)
- Visual workflow builder
- Custom transformations
- Data lineage tracking
- Advanced analytics

## Support

### Getting Help
```
@agent help with integrations
@agent show integration docs
@agent troubleshoot [service]
```

### Reporting Issues
1. Check existing integrations: `@agent list integrations`
2. View logs: `@agent show integration logs`
3. Test connection: `@agent test [service] connection`
4. Report: Create issue with logs

## License
MIT - Part of AnythingLLM

## Credits
Built with:
- Nango - OAuth & sync management
- MCP - Tool protocol
- LanceDB - Vector storage
- AnythingLLM - Agent framework