#!/usr/bin/env node

/**
 * Enhanced MCP Loader
 * Supports three types of MCP servers:
 * 1. NPM packages (via npx)
 * 2. GitHub repositories (clone & run)
 * 3. Custom local scripts
 */

const { spawn } = require('child_process');
const { Nango } = require('@nangohq/node');
const { GitHubMCPManager } = require('./utils/MCP/github-mcp-manager');
const fs = require('fs');
const path = require('path');

class EnhancedMCPLoader {
  constructor() {
    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
    this.githubManager = new GitHubMCPManager();
    this.registryPath = path.join(__dirname, 'mcp-registry-enhanced.json');
  }

  /**
   * Load the enhanced registry
   */
  loadRegistry() {
    if (!fs.existsSync(this.registryPath)) {
      console.error(`Registry not found: ${this.registryPath}`);
      return { mcpServers: {} };
    }
    return JSON.parse(fs.readFileSync(this.registryPath, 'utf8'));
  }

  /**
   * Generate MCP configuration based on server type
   */
  async generateMCPConfig(serverName, workspaceId = null) {
    const registry = this.loadRegistry();
    const serverDef = registry.mcpServers[serverName];
    
    if (!serverDef) {
      console.error(`Unknown server: ${serverName}`);
      return null;
    }

    const baseConfig = {
      type: "stdio",
      anythingllm: {
        autoStart: true,
        description: serverDef.description,
        toolPrefix: serverName
      }
    };

    // Handle different server types
    switch (serverDef.type) {
      case 'npm':
        return {
          ...baseConfig,
          command: serverDef.command,
          args: serverDef.args,
          env: await this.buildEnvForAuth(serverDef.auth, workspaceId)
        };

      case 'github':
        const githubConfig = await this.githubManager.createGitHubMCPConfig(
          serverName,
          serverDef.repository,
          {
            env: await this.buildEnvForAuth(serverDef.auth, workspaceId),
            description: serverDef.description
          }
        );
        return githubConfig ? { ...baseConfig, ...githubConfig } : null;

      case 'custom':
        return {
          ...baseConfig,
          command: serverDef.command,
          args: serverDef.args,
          env: await this.buildEnvForAuth(serverDef.auth, workspaceId)
        };

      default:
        console.error(`Unknown server type: ${serverDef.type}`);
        return null;
    }
  }

  /**
   * Build environment variables based on auth type
   */
  async buildEnvForAuth(auth, workspaceId) {
    const env = { ...process.env };

    if (!auth || auth === 'none') {
      return env;
    }

    if (auth.startsWith('nango:')) {
      // OAuth via Nango
      const provider = auth.replace('nango:', '');
      if (workspaceId) {
        try {
          const connection = await this.nango.getConnection({
            connectionId: `workspace_${workspaceId}`,
            providerConfigKey: provider
          });
          
          env.ACCESS_TOKEN = connection.credentials.access_token;
          if (connection.credentials.refresh_token) {
            env.REFRESH_TOKEN = connection.credentials.refresh_token;
          }
          
          // Pass Nango config for dynamic refresh
          env.NANGO_SECRET_KEY = process.env.NANGO_SECRET_KEY;
          env.NANGO_HOST = process.env.NANGO_HOST || 'https://api.nango.dev';
          env.NANGO_CONNECTION_ID = `workspace_${workspaceId}`;
          env.NANGO_PROVIDER_CONFIG_KEY = provider;
        } catch (error) {
          console.warn(`No ${provider} connection for workspace ${workspaceId}`);
        }
      }
    } else if (auth.startsWith('api_key:') || auth.startsWith('token:')) {
      // API key or token from environment
      const keyName = auth.replace(/^(api_key:|token:)/, '');
      if (process.env[keyName]) {
        env[keyName] = process.env[keyName];
      } else {
        console.warn(`Missing environment variable: ${keyName}`);
      }
    } else if (auth === 'connection_string') {
      // Database connection strings
      // These should be configured per workspace or globally
      console.log('Connection string auth - configure in environment');
    }

    return env;
  }

  /**
   * Update AnythingLLM's MCP config file
   */
  async updateAnythingLLMConfig(workspaceId = null) {
    const registry = this.loadRegistry();
    const configPath = path.join(
      __dirname,
      'storage/plugins/anythingllm_mcp_servers.json'
    );

    let config = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Generate configs for all servers
    for (const [serverName, serverDef] of Object.entries(registry.mcpServers)) {
      const mcpConfig = await this.generateMCPConfig(serverName, workspaceId);
      if (mcpConfig) {
        const configName = workspaceId 
          ? `${serverName}_ws${workspaceId}` 
          : serverName;
        config.mcpServers[configName] = mcpConfig;
      }
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`Updated MCP config with ${Object.keys(config.mcpServers).length} servers`);
  }

  /**
   * Test a specific MCP server
   */
  async testServer(serverName, workspaceId = null) {
    console.log(`Testing MCP server: ${serverName}`);
    
    const config = await this.generateMCPConfig(serverName, workspaceId);
    if (!config) {
      console.error(`Failed to generate config for ${serverName}`);
      return false;
    }

    console.log(`Starting ${serverName} with command: ${config.command} ${config.args.join(' ')}`);
    
    const serverProcess = spawn(config.command, config.args, { 
      env: config.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Monitor output
    serverProcess.stdout.on('data', (data) => {
      console.log(`[${serverName}] ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`[${serverName}] ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error(`[${serverName}] Process error:`, error);
    });

    serverProcess.on('exit', (code) => {
      console.log(`[${serverName}] Process exited with code ${code}`);
    });

    // Give it time to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if still running
    if (serverProcess.killed) {
      console.error(`${serverName} failed to start`);
      return false;
    }

    console.log(`${serverName} appears to be running`);
    serverProcess.kill();
    return true;
  }
}

// CLI interface
if (require.main === module) {
  const loader = new EnhancedMCPLoader();
  const command = process.argv[2];
  const serverName = process.argv[3];
  const workspaceId = process.argv[4];

  switch (command) {
    case 'update':
      loader.updateAnythingLLMConfig(workspaceId).catch(console.error);
      break;
    
    case 'test':
      if (!serverName) {
        console.error('Usage: node enhanced-mcp-loader.js test <server-name> [workspace-id]');
        process.exit(1);
      }
      loader.testServer(serverName, workspaceId).catch(console.error);
      break;
    
    case 'list':
      const registry = loader.loadRegistry();
      console.log('Available MCP servers:');
      for (const [name, def] of Object.entries(registry.mcpServers)) {
        console.log(`- ${name} (${def.type}): ${def.description}`);
      }
      break;
    
    default:
      console.log('Usage:');
      console.log('  node enhanced-mcp-loader.js update [workspace-id]');
      console.log('  node enhanced-mcp-loader.js test <server-name> [workspace-id]');
      console.log('  node enhanced-mcp-loader.js list');
  }
}

module.exports = EnhancedMCPLoader;