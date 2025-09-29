#!/bin/bash

# Nango MCP Server Deployment Script
# Deploys all Nango integration templates as MCP servers

echo "🚀 Deploying Nango MCP Servers..."

# Copy priority configurations to production
cp storage/nango-mcp-configs/nango-mcp-priority.json storage/plugins/anythingllm_mcp_servers_production.json

# Restart MCP servers
echo "🔄 Restarting MCP servers..."
# Add your restart command here

echo "✅ Deployment complete!"
echo "📊 Priority integrations deployed: $(jq '.mcpServers | keys | length' storage/nango-mcp-configs/nango-mcp-priority.json)"
