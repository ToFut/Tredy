#!/bin/bash

# Setup MCP configuration for production (Railway)
echo "[MCP Setup] Configuring MCP servers for production..."

# Set default Nango values if not provided
export NANGO_SECRET_KEY="${NANGO_SECRET_KEY:-7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91}"
export NANGO_HOST="${NANGO_HOST:-https://api.nango.dev}"

echo "[MCP Setup] Using NANGO_HOST: $NANGO_HOST"
echo "[MCP Setup] Using NANGO_SECRET_KEY: ${NANGO_SECRET_KEY:0:10}..."

# Create plugins directory if it doesn't exist
mkdir -p /app/storage/plugins

# Check if production MCP config exists and copy it
if [ -f "/app/server/storage/plugins/anythingllm_mcp_servers_production.json" ]; then
  echo "[MCP Setup] Copying production MCP configuration..."
  cp /app/server/storage/plugins/anythingllm_mcp_servers_production.json /app/storage/plugins/anythingllm_mcp_servers.json
  
  # Replace environment variable placeholders using envsubst or sed
  echo "[MCP Setup] Replacing environment variables in config..."
  
  # Use sed with proper escaping
  sed -i "s|\${NANGO_SECRET_KEY}|${NANGO_SECRET_KEY}|g" /app/storage/plugins/anythingllm_mcp_servers.json
  sed -i "s|\${NANGO_HOST}|${NANGO_HOST}|g" /app/storage/plugins/anythingllm_mcp_servers.json
  
  echo "[MCP Setup] MCP configuration deployed successfully"
else
  echo "[MCP Setup] No production MCP configuration found, creating empty config..."
  echo '{"mcpServers": {}}' > /app/storage/plugins/anythingllm_mcp_servers.json
fi

echo "[MCP Setup] MCP configuration complete"