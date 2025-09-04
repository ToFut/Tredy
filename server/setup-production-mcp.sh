#!/bin/bash

# Setup MCP configuration for production (Railway)
echo "[MCP Setup] Configuring MCP servers for production..."

# Create plugins directory if it doesn't exist
mkdir -p /app/storage/plugins

# Check if production MCP config exists and copy it
if [ -f "/app/server/storage/plugins/anythingllm_mcp_servers_production.json" ]; then
  echo "[MCP Setup] Copying production MCP configuration..."
  cp /app/server/storage/plugins/anythingllm_mcp_servers_production.json /app/storage/plugins/anythingllm_mcp_servers.json
  echo "[MCP Setup] MCP configuration deployed successfully"
else
  echo "[MCP Setup] No production MCP configuration found, creating empty config..."
  echo '{"mcpServers": {}}' > /app/storage/plugins/anythingllm_mcp_servers.json
fi

# Replace environment variable placeholders
if [ ! -z "$NANGO_SECRET_KEY" ]; then
  sed -i "s/\${NANGO_SECRET_KEY}/$NANGO_SECRET_KEY/g" /app/storage/plugins/anythingllm_mcp_servers.json
fi

if [ ! -z "$NANGO_HOST" ]; then
  sed -i "s/\${NANGO_HOST}/$NANGO_HOST/g" /app/storage/plugins/anythingllm_mcp_servers.json
fi

echo "[MCP Setup] MCP configuration complete"