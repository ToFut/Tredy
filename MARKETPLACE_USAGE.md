# 🛍️ AnythingLLM Community Hub Marketplace

## Overview
The Community Hub Marketplace is now fully integrated into AnythingLLM, allowing you to browse, install, and manage agent skills, system prompts, and slash commands from the community.

## Access the Marketplace

### Web Interface
1. Open your browser and navigate to: http://localhost:8123
2. Log in to your AnythingLLM instance
3. Navigate to **Settings** → **Community Hub** → **Marketplace**

Direct URL: http://localhost:8123/settings/community-hub/marketplace

## Features

### 1. Browse & Discover
- View all available agent skills, system prompts, and slash commands
- Filter by category:
  - Agent Skills
  - System Prompts
  - Slash Commands
- Search for specific items
- Toggle between grid and list view

### 2. Install Items
- Click "Install" on any item card
- Agent skills are automatically downloaded and enabled
- System prompts and slash commands are applied immediately

### 3. Manage Installed Items
- Click the "Installed" tab to view all installed items
- **Enable/Disable**: Toggle items on/off without uninstalling
- **Configure**: Set up required parameters for agent skills
- **Uninstall**: Remove items completely

## API Endpoints

The marketplace exposes the following REST API endpoints:

### Get Available Items
```bash
GET /api/community-hub/explore
```

### Get Installed Items
```bash
GET /api/community-hub/installed
```

### Install an Item
```bash
POST /api/community-hub/import
Body: { "importId": "allm-community-id:agent-skill:item-id" }
```

### Toggle Item Status
```bash
POST /api/community-hub/toggle/:itemId
Body: { "active": true/false }
```

### Uninstall Item
```bash
DELETE /api/community-hub/uninstall/:itemId
```

## Using Installed Agent Skills

Once installed, agent skills are automatically available in your workspaces:

1. Go to any workspace
2. Open **Workspace Settings** → **Agent Configuration**
3. Your installed skills will appear in the available tools list
4. Enable the skills you want to use in that workspace

## File Structure

Installed items are stored in:
```
/server/storage/plugins/agent-skills/
├── skill-id-1/
│   ├── plugin.json    # Configuration
│   └── handler.js     # Skill code
└── skill-id-2/
    ├── plugin.json
    └── handler.js
```

## Testing the Marketplace

1. **Start the servers** (if not already running):
   ```bash
   # Terminal 1: Backend
   yarn dev:server
   
   # Terminal 2: Frontend
   cd frontend && yarn dev
   ```

2. **Access the marketplace**:
   - Open http://localhost:8123
   - Navigate to Settings → Community Hub → Marketplace

3. **Test installation**:
   - Find any agent skill
   - Click "Install"
   - Go to "Installed" tab to verify

4. **Test in workspace**:
   - Create or open a workspace
   - Go to Workspace Settings → Agent Configuration
   - Verify the installed skill appears

## Troubleshooting

### Port Already in Use
If you see "Port 3000 is in use", the frontend is using port 3003 instead.

### Authentication Required
Some endpoints require admin authentication. Make sure you're logged in as an admin user.

### Skills Not Showing in Workspace
1. Check if the skill is enabled in the "Installed" tab
2. Refresh the workspace settings page
3. Ensure the skill's `active` flag is set to `true`

## Development

To modify the marketplace:

### Frontend Components
- Main page: `/frontend/src/pages/GeneralSettings/CommunityHub/MarketplaceView/index.jsx`
- Skill card: `/frontend/src/pages/GeneralSettings/CommunityHub/MarketplaceView/SkillCard.jsx`
- Installed items: `/frontend/src/pages/GeneralSettings/CommunityHub/MarketplaceView/InstalledSkills.jsx`

### Backend Endpoints
- API routes: `/server/endpoints/communityHub.js`
- Model: `/server/models/communityHub.js`
- Plugin system: `/server/utils/agents/imported.js`

### Adding New Features
The marketplace is built on top of the existing CommunityHub infrastructure, so any new features should:
1. Extend the CommunityHub model
2. Use the existing ImportedPlugin system
3. Follow the existing authentication patterns

## Next Steps

### Future Enhancements
1. **Ratings & Reviews**: Add user feedback for items
2. **Version Management**: Update notifications and rollback
3. **Payment Integration**: Support for paid items
4. **Categories**: Better organization with subcategories
5. **Developer Tools**: Upload and manage your own items

## Summary

The Community Hub Marketplace is now fully functional with:
- ✅ Browse and search capabilities
- ✅ One-click installation
- ✅ Installed items management
- ✅ Enable/disable functionality
- ✅ Uninstall capability
- ✅ Integration with workspace agent configuration
- ✅ REST API for programmatic access

Access it at: **http://localhost:8123/settings/community-hub/marketplace**