# Railway MCP Server Configuration

## Overview
MCP (Model Context Protocol) servers need to be running in production for connectors to work. This guide explains how to configure MCP servers in Railway.

## Required Environment Variables

Add these to your Railway environment variables:

### For Gmail Integration
```
NANGO_SECRET_KEY=your-nango-secret-key
NANGO_HOST=https://api.nango.dev  # or your self-hosted Nango URL
```

### For Google Calendar
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-redirect-uri
```

### For LinkedIn
```
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### For Google Drive
```
GOOGLE_DRIVE_CLIENT_ID=your-google-drive-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-drive-client-secret
```

## What Was Fixed

1. Created `/docker/start-mcp-servers.sh` - Script to start MCP servers based on environment variables
2. Modified `/docker/docker-entrypoint.sh` - Added call to start MCP servers
3. Updated `/docker/Dockerfile` - Added the MCP startup script to the container

## How It Works

1. When the Docker container starts, it runs `docker-entrypoint.sh`
2. The entrypoint script now checks for and runs `start-mcp-servers.sh`
3. Each MCP server starts only if its required environment variables are present
4. MCP servers run as background processes alongside the main server and collector

## Deployment Steps

1. Push these changes to your repository
2. Railway will automatically rebuild and deploy
3. Add the required environment variables in Railway dashboard
4. MCP servers will start automatically on the next deployment

## Verifying MCP Servers Are Running

After deployment, you can check if MCP servers are running by:
1. Checking Railway logs for "[MCP] Starting..." messages
2. Testing connector functionality in the UI
3. Monitoring for 500/503 errors should disappear

## Troubleshooting

If connectors still show errors:
- Verify environment variables are set correctly in Railway
- Check Railway logs for MCP startup errors
- Ensure Nango integration is configured correctly
- Verify OAuth app configurations for each service