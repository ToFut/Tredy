# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Test Commands

### Development
```bash
# Initial setup (installs deps & creates .env files)
yarn setup
yarn prisma:setup

# Run services
yarn dev:server     # Backend API on port 3001
yarn dev:frontend   # React app on port 3000  
yarn dev:collector  # Document processor on port 8888
yarn dev:all        # All services concurrently

# Production builds
yarn prod:server
yarn prod:frontend
```

### Testing & Quality
```bash
yarn lint           # ESLint across all services
npm test           # Jest tests (limited coverage)
yarn prisma:generate  # Regenerate Prisma client after schema changes
yarn prisma:migrate   # Apply database migrations
yarn prisma:reset     # Reset database (truncates and re-migrates)
yarn verify:translations  # Verify frontend translation files
```

## Architecture Overview

**AnythingLLM** is a full-stack document-aware AI chat platform with three main services:

1. **Server** (`/server`) - Express API with Prisma ORM, handles auth, workspaces, chat, and LLM integrations
2. **Frontend** (`/frontend`) - React SPA with Vite, provides multi-user chat interface with workspace management  
3. **Collector** (`/collector`) - Document processing service for ingesting and chunking various file formats

### Key Architectural Patterns

- **Workspace Isolation**: Each workspace has isolated documents, chats, and settings with configurable `agentProvider` and `agentModel`
- **Agent Invocation**: Messages must start with `@agent` to trigger agent mode (parsed in `/server/models/workspaceAgentInvocation.js`)
- **MCP Integration**: Full Model Context Protocol compatibility for external tools (Gmail, Calendar, LinkedIn, etc.)
- **Plugin Architecture**: Swappable LLM providers, vector databases, and embedders via `/server/utils/` modules
- **WebSocket Communication**: Agent interactions use WebSocket at `/agent-invocation/:uuid` endpoint
- **UnTooled Providers**: TogetherAI, LMStudio use natural language function calling via UnTooled helper
- **Agent Flow System**: No-code workflow builder with directOutput support for bypassing LLM processing

### Database Schema

- **Primary**: SQLite at `storage/anythingllm.db` (PostgreSQL optional via DATABASE_URL)
- **Vector Storage**: LanceDB default, multiple options available
- **Key Models**: User, Workspace, WorkspaceChat, Document, SystemSettings, WorkspaceAgentInvocation
- **Agent Config**: Workspace table includes `agentProvider` and `agentModel` columns

### Critical Agent System Details

**Agent Triggering**
- Messages MUST start with `@agent` to invoke agent mode
- Agent detection: `/server/models/workspaceAgentInvocation.js::parseAgents()`
- WebSocket endpoint: `/server/endpoints/agentWebsocket.js`

**Provider Function Calling Support**
- **Native**: OpenAI, Anthropic, Google Gemini
- **UnTooled** (less reliable): TogetherAI, LMStudio, Ollama
- Default system prompt: `/server/utils/agents/aibitat/providers/ai-provider.js::DEFAULT_WORKSPACE_PROMPT`

**MCP Server Integration**
- Config: `/server/storage/plugins/anythingllm_mcp_servers_production.json`
- Universal Gmail: `/server/universal-gmail-mcp.js`
- Workspace detection priority: args.workspaceId > MCP_SERVER_NAME > NANGO_CONNECTION_ID

## Common Development Tasks

### Database Operations
```bash
# Query workspace agent settings
sqlite3 storage/anythingllm.db "SELECT slug, agentProvider, agentModel FROM workspaces;"

# Update workspace agent model
sqlite3 storage/anythingllm.db "UPDATE workspaces SET agentProvider='openai', agentModel='gpt-4o' WHERE slug='workspace-name';"

# Reset database
yarn prisma:setup --force

# View database in browser
cd server && npx prisma studio
```

### Agent Configuration

**Changing Agent Model for Workspace**
```sql
-- Common providers: openai, anthropic, togetherai, ollama
-- OpenAI models: gpt-4o, gpt-4o-mini, gpt-3.5-turbo
-- TogetherAI models: mistralai/Mixtral-8x7B-Instruct-v0.1
UPDATE workspaces SET agentProvider='provider', agentModel='model' WHERE slug='workspace-slug';
```

**Adding New Agent Plugin**
1. Create plugin in `/server/utils/agents/aibitat/plugins/`
2. Register in `/server/utils/agents/aibitat/plugins/index.js`
3. Add to DEFAULT_SKILLS in `/server/utils/agents/defaults.js` if default-enabled

### Adding New Features

#### New LLM Provider
1. Create provider class in `/server/utils/AiProviders/`
2. Implement required methods (chat, embeddings)
3. Register in `/server/utils/helpers/selectLLMProvider.js`
4. Add agent provider in `/server/utils/agents/aibitat/providers/`
5. Add frontend settings UI in `/frontend/src/pages/GeneralSettings/LLMPreference/`

#### New MCP Server
1. Create MCP server file following `/server/universal-gmail-mcp.js` pattern
2. Register in `/server/storage/plugins/anythingllm_mcp_servers_production.json`
3. Implement workspace ID detection logic
4. Add Nango integration if needed for OAuth

#### New Agent Flow/Workflow
1. Create flow definition in `/server/storage/plugins/agent-flows/` as JSON
2. Use FlowExecutor class from `/server/utils/agentFlows/executor.js`
3. Flows loaded as plugins with `@@flow_{uuid}` format
4. Set `directOutput: true` in step config to return results without LLM processing

### Environment Variables
- Copy `.env.example` files in each service directory
- Required: 
  - `JWT_SECRET` - Random string ≥12 chars for JWT signing
  - `SIG_KEY` - Passphrase ≥32 chars for signatures
  - `SIG_SALT` - Salt ≥32 chars for signatures
- Agent-specific:
  - `TOGETHER_AI_API_KEY` - For TogetherAI models
  - `OPEN_AI_KEY` - For OpenAI models  
  - `NANGO_SECRET_KEY` - For MCP OAuth integrations
- Storage: `STORAGE_DIR` (default: `/server/storage/`)

## Debugging

### Agent Issues
- Check message starts with `@agent`
- Verify workspace agent settings in database
- Monitor WebSocket connection in browser Network tab
- Check server logs for `[AgentHandler]` entries
- Verify MCP server is running: `ps aux | grep universal-gmail`

### Common Agent Problems
1. **"No auth token found"**: Normal for unauthenticated requests
2. **Agent not triggered**: Message must START with `@agent`
3. **Function not called**: Check if provider supports function calling
4. **MCP fails**: Check workspace ID detection and Nango connection
5. **Duplicate messages**: Often caused by multiple WebSocket connections or plugin duplication; check WebSocket cleanup and plugin loading logic

### Docker Development
```bash
# Build and run locally
docker-compose -f docker/docker-compose.yml up --build

# Production build
docker build -t anything-llm -f docker/Dockerfile .
```

## Important Implementation Notes

- **File Storage**: Documents stored in `STORAGE_DIR` (default: `/server/storage/`)
- **Vector Cache**: Cached embeddings in workspace folders
- **Session Management**: JWT tokens with configurable expiry (default 30d)
- **Rate Limiting**: Implemented on chat endpoints
- **File Size Limits**: Default 3GB per upload, configurable
- **Background Jobs**: Document processing runs async via collector service
- **Node Version**: Requires Node.js ≥18
- **Telemetry**: Anonymous usage tracking (disable with `DISABLE_TELEMETRY`)
- **Agent Session**: Uses UUID-based invocation tracking
- **WebSocket Timeout**: 5 minutes (300 seconds) for agent sessions
- **Plugin Duplication**: WebSocket and chat-history plugins are added as standard plugins; avoid adding them again via skills to prevent duplicates
- **Agent Interrupts**: USER agent has `interrupt: "NEVER"` to prevent message duplication from interrupt/continue cycles