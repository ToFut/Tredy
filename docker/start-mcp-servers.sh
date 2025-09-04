#!/bin/bash

# Start MCP servers for production deployment
# This script starts all MCP servers defined in the configuration

echo "[MCP] Starting MCP servers..."

# Start Gmail MCP server if Nango is configured
if [ ! -z "$NANGO_SECRET_KEY" ]; then
  echo "[MCP] Starting Gmail MCP server..."
  node /app/server/gmail-mcp-server.js &
  echo "[MCP] Gmail MCP server started (PID: $!)"
fi

# Start Google Calendar MCP if configured
if [ ! -z "$GOOGLE_CLIENT_ID" ] && [ ! -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "[MCP] Starting Google Calendar MCP server..."
  node /app/server/simple-google-calendar-mcp.js &
  echo "[MCP] Google Calendar MCP server started (PID: $!)"
fi

# Start LinkedIn MCP if configured
if [ ! -z "$LINKEDIN_CLIENT_ID" ] && [ ! -z "$LINKEDIN_CLIENT_SECRET" ]; then
  echo "[MCP] Starting LinkedIn MCP server..."
  node /app/server/linkedin-mcp.js &
  echo "[MCP] LinkedIn MCP server started (PID: $!)"
fi

# Start Google Drive MCP if configured
if [ ! -z "$GOOGLE_DRIVE_CLIENT_ID" ] && [ ! -z "$GOOGLE_DRIVE_CLIENT_SECRET" ]; then
  echo "[MCP] Starting Google Drive MCP server..."
  node /app/server/google-drive-generated-mcp.js &
  echo "[MCP] Google Drive MCP server started (PID: $!)"
fi

echo "[MCP] MCP servers startup complete"