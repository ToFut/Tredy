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
```

## Architecture Overview

**AnythingLLM** is a full-stack document-aware AI chat platform with three main services:

1. **Server** (`/server`) - Express API with Prisma ORM, handles auth, workspaces, chat, and LLM integrations
2. **Frontend** (`/frontend`) - React SPA with Vite, provides multi-user chat interface with workspace management  
3. **Collector** (`/collector`) - Document processing service for ingesting and chunking various file formats

### Key Architectural Patterns

- **Workspace Isolation**: Each workspace has isolated documents, chats, and settings
- **Plugin Architecture**: Swappable LLM providers, vector databases, and embedders via `/server/utils/` modules
- **Agent System**: Custom AI agents with tool capabilities in `/server/utils/agents/`
- **Event-Driven**: WebSocket support for real-time chat and updates
- **Multi-tenancy**: User/role-based permissions with JWT authentication

### Database Schema

- **Primary**: SQLite with Prisma ORM (PostgreSQL optional)
- **Vector Storage**: LanceDB default, multiple options available
- **Key Models**: User, Workspace, WorkspaceChat, Document, SystemSettings
- **Migrations**: Managed via Prisma in `/server/prisma/migrations/`

### File Organization

```
server/
├── endpoints/          # REST API routes organized by feature
├── utils/             # Core business logic and integrations
│   ├── AiProviders/   # LLM provider implementations
│   ├── vectorDbProviders/  # Vector database integrations
│   └── agents/        # AI agent system
├── models/            # Database models and business logic
└── prisma/            # Database schema and migrations

frontend/
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/         # Route-based page components
│   ├── hooks/         # Custom React hooks
│   └── utils/         # Frontend utilities and API client
```

## Development Guidelines

### API Patterns
- RESTful endpoints with `/api/` prefix
- JWT authentication via Bearer tokens
- Multitenancy via workspace slugs in routes
- Response format: `{ success: boolean, data/error: ... }`

### Frontend Patterns
- React functional components with hooks
- Tailwind CSS for styling with custom theme
- API calls via `/frontend/src/utils/api/` modules
- Real-time updates via WebSocket connections

### Adding New Features

#### New LLM Provider
1. Create provider class in `/server/utils/AiProviders/`
2. Implement required methods (chat, embeddings)
3. Register in `/server/utils/helpers/selectLLMProvider.js`
4. Add frontend settings UI in `/frontend/src/pages/GeneralSettings/LLMPreference/`

#### New Vector Database
1. Implement interface in `/server/utils/vectorDbProviders/`
2. Add configuration in system settings
3. Update frontend vector DB selector

#### New Document Type
1. Add processor in `/collector/processers/`
2. Update `/collector/utils/constants.js` with mime types
3. Add frontend upload validation

### Environment Variables
- Copy `.env.example` files in each service directory
- Required: `JWT_SECRET`, `AUTH_TOKEN`, `STORAGE_DIR`
- LLM providers need respective API keys
- See `/server/.env.example` for all options

## Common Tasks

### Database Operations
```bash
# Reset database
yarn prisma:setup --force

# Create new migration
cd server && npx prisma migrate dev --name <migration-name>

# View database
cd server && npx prisma studio
```

### Debugging
- Server logs: Check console output or `/server/storage/logs/`
- Frontend: Browser DevTools + React DevTools
- API testing: Use built-in Swagger at `/api/docs` (if enabled)
- WebSocket: Monitor via browser Network tab

### Docker Development
```bash
# Build and run locally
docker-compose -f docker/docker-compose.yml up --build

# Production build
docker build -t anything-llm -f docker/Dockerfile .
```

## Important Considerations

- **File Storage**: Documents stored in `STORAGE_DIR` (default: `/server/storage/`)
- **Vector Cache**: Cached embeddings in workspace folders
- **Session Management**: JWT tokens with configurable expiry
- **Rate Limiting**: Implemented on chat endpoints
- **File Size Limits**: Default 3GB per upload, configurable
- **Workspace Limits**: Configurable document count and user limits
- **Background Jobs**: Document processing runs async via collector service