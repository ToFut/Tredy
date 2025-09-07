#!/usr/bin/env node

/**
 * Simple MCP Loader
 * Just spawns MCP servers from npm packages with proper auth
 */

const { spawn } = require('child_process');
const { Nango } = require('@nangohq/node');
const registry = require('./mcp-registry.json');

class SimpleMCPLoader {
  constructor() {
    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
  }

  /**
   * Start an MCP server
   * @param {string} serverName - Name from registry (e.g., 'slack', 'github')
   * @param {number} workspaceId - Workspace ID for auth
   */
  async startMCPServer(serverName, workspaceId) {
    const config = registry.mcpServers[serverName];
    if (!config) {
      throw new Error(`Unknown MCP server: ${serverName}`);
    }

    // Build environment variables based on auth type
    const env = { ...process.env };
    
    if (config.auth.startsWith('nango:')) {
      // OAuth via Nango
      const provider = config.auth.replace('nango:', '');
      try {
        const connection = await this.nango.getConnection({
          connectionId: `workspace_${workspaceId}`,
          providerConfigKey: provider
        });
        
        // Pass tokens to MCP server
        env.ACCESS_TOKEN = connection.credentials.access_token;
        if (connection.credentials.refresh_token) {
          env.REFRESH_TOKEN = connection.credentials.refresh_token;
        }
        
        // Pass any metadata (like page_id, account_id, etc.)
        Object.assign(env, connection.metadata || {});
      } catch (error) {
        console.error(`No ${provider} connection for workspace ${workspaceId}`);
        return null;
      }
    } else if (config.auth.startsWith('api_key:')) {
      // API key from environment
      const keyName = config.auth.replace('api_key:', '');
      if (!process.env[keyName]) {
        console.error(`Missing API key: ${keyName}`);
        return null;
      }
      env[keyName] = process.env[keyName];
    } else if (config.auth.startsWith('token:')) {
      // Token from environment
      const tokenName = config.auth.replace('token:', '');
      if (!process.env[tokenName]) {
        console.error(`Missing token: ${tokenName}`);
        return null;
      }
      env[tokenName] = process.env[tokenName];
    }
    // For 'none', 'local', 'qr_code' - no additional env needed

    // Spawn the MCP server
    const args = [...config.args];
    
    // Add workspace ID to args if needed
    if (config.auth !== 'none' && config.auth !== 'local') {
      args.push('--workspace', workspaceId.toString());
    }

    console.log(`Starting MCP server: ${serverName} for workspace ${workspaceId}`);
    const serverProcess = spawn(config.command, args, { env });

    // Handle stdout/stderr
    serverProcess.stdout.on('data', (data) => {
      console.log(`[${serverName}] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[${serverName}] ${data}`);
    });

    return serverProcess;
  }

  /**
   * Generate MCP server configuration for anythingllm_mcp_servers.json
   */
  generateMCPConfig(serverName, workspaceId) {
    const config = registry.mcpServers[serverName];
    if (!config) return null;

    const serverKey = workspaceId ? `${serverName}_ws${workspaceId}` : serverName;

    return {
      [serverKey]: {
        type: "stdio",
        command: config.command,
        args: config.args,
        env: this.buildEnvObject(config, workspaceId),
        anythingllm: {
          autoStart: true,
          workspaceAware: !!workspaceId,
          description: config.description,
          toolPrefix: serverName
        }
      }
    };
  }

  buildEnvObject(config, workspaceId) {
    const env = {};
    
    if (config.auth.startsWith('nango:')) {
      env.NANGO_SECRET_KEY = "${NANGO_SECRET_KEY}";
      env.NANGO_HOST = "${NANGO_HOST}";
      env.NANGO_CONNECTION_ID = `workspace_${workspaceId}`;
    } else if (config.auth.startsWith('api_key:')) {
      const keyName = config.auth.replace('api_key:', '');
      env[keyName] = `\${${keyName}}`;
    } else if (config.auth.startsWith('token:')) {
      const tokenName = config.auth.replace('token:', '');
      env[tokenName] = `\${${tokenName}}`;
    }
    
    return env;
  }

  /**
   * Add all MCP servers to AnythingLLM config
   */
  async addAllToConfig() {
    const fs = require('fs');
    const path = require('path');
    
    const configPath = path.join(__dirname, 'storage/plugins/anythingllm_mcp_servers.json');
    let config = { mcpServers: {} };
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Add all servers from registry
    for (const [serverName, serverConfig] of Object.entries(registry.mcpServers)) {
      // Add generic version (no workspace)
      Object.assign(config.mcpServers, this.generateMCPConfig(serverName, null));
      
      // For OAuth servers, they'll be added dynamically when workspace connects
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Added ${Object.keys(registry.mcpServers).length} MCP servers to config`);
  }
}

// If run directly, add all servers to config
if (require.main === module) {
  const loader = new SimpleMCPLoader();
  loader.addAllToConfig().catch(console.error);
}

module.exports = SimpleMCPLoader;