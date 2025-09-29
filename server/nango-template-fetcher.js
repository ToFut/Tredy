#!/usr/bin/env node

/**
 * Nango Integration Templates Fetcher
 * Downloads and analyzes Nango integration templates for MCP server generation
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class NangoTemplateFetcher {
  constructor() {
    this.baseUrl = 'https://api.github.com/repos/NangoHQ/integration-templates/contents';
    this.templatesDir = path.join(__dirname, 'storage', 'nango-templates');
    this.ensureTemplatesDir();
  }

  ensureTemplatesDir() {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
    }
  }

  async fetchJson(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
  }

  async fetchFileContent(url) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  async getIntegrationList() {
    console.log('📋 Fetching integration list...');
    const integrations = await this.fetchJson(`${this.baseUrl}/integrations`);
    return integrations
      .filter(item => item.type === 'dir' && !item.name.startsWith('.'))
      .map(item => item.name)
      .sort();
  }

  async analyzeIntegration(integrationName) {
    console.log(`🔍 Analyzing ${integrationName}...`);
    
    try {
      const files = await this.fetchJson(`${this.baseUrl}/integrations/${integrationName}`);
      
      const analysis = {
        name: integrationName,
        hasActions: files.some(f => f.name === 'actions'),
        hasSyncs: files.some(f => f.name === 'syncs'),
        hasModels: files.some(f => f.name === 'models.ts'),
        hasTypes: files.some(f => f.name === 'types.ts'),
        hasSchema: files.some(f => f.name === 'schema.zod.ts'),
        hasTests: files.some(f => f.name === 'tests'),
        files: files.map(f => f.name)
      };

      // Try to get the main index.ts to understand the integration
      const indexFile = files.find(f => f.name === 'index.ts');
      if (indexFile && indexFile.download_url) {
        try {
          const content = await this.fetchFileContent(indexFile.download_url);
          analysis.indexContent = content;
          analysis.hasOAuth = content.includes('oauth') || content.includes('OAuth');
          analysis.hasAPI = content.includes('api') || content.includes('API');
        } catch (e) {
          console.warn(`⚠️  Could not fetch index.ts for ${integrationName}: ${e.message}`);
        }
      }

      return analysis;
    } catch (error) {
      console.error(`❌ Error analyzing ${integrationName}: ${error.message}`);
      return {
        name: integrationName,
        error: error.message
      };
    }
  }

  async fetchAllIntegrations() {
    const integrations = await this.getIntegrationList();
    console.log(`📦 Found ${integrations.length} integrations`);
    
    const analyses = [];
    for (const integration of integrations) {
      const analysis = await this.analyzeIntegration(integration);
      analyses.push(analysis);
      
      // Small delay to be respectful to GitHub API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return analyses;
  }

  async generateMCPConfig(analyses) {
    console.log('⚙️  Generating MCP server configurations...');
    
    const mcpServers = {};
    const priorityIntegrations = [
      'slack', 'github', 'notion', 'google-mail', 'google-calendar', 
      'google-drive', 'salesforce', 'hubspot', 'jira', 'asana',
      'linear', 'confluence', 'dropbox', 'zoom', 'microsoft-teams'
    ];

    for (const analysis of analyses) {
      if (analysis.error) continue;

      const serverName = analysis.name.replace(/-/g, '_');
      const isPriority = priorityIntegrations.includes(analysis.name);
      
      mcpServers[serverName] = {
        type: "stdio",
        command: "node",
        args: [
          `/Users/segevbin/anything-llm/server/nango-mcp-servers/${serverName}-server.js`
        ],
        env: {
          NANGO_SECRET_KEY: "${NANGO_SECRET_KEY}",
          NANGO_HOST: "${NANGO_HOST}",
          NANGO_PROVIDER_CONFIG_KEY: `${analysis.name}-getting-started`,
          MCP_SERVICE_NAME: analysis.name
        },
        anythingllm: {
          autoStart: isPriority,
          workspaceAware: true,
          description: `${analysis.name} integration via Nango`,
          toolPrefix: analysis.name,
          priority: isPriority ? 'high' : 'normal',
          capabilities: {
            hasActions: analysis.hasActions,
            hasSyncs: analysis.hasSyncs,
            hasOAuth: analysis.hasOAuth,
            hasAPI: analysis.hasAPI
          }
        }
      };
    }

    return mcpServers;
  }

  async saveAnalysis(analyses) {
    const analysisFile = path.join(this.templatesDir, 'integration-analysis.json');
    fs.writeFileSync(analysisFile, JSON.stringify(analyses, null, 2));
    console.log(`💾 Saved analysis to ${analysisFile}`);
  }

  async saveMCPConfig(mcpServers) {
    const configFile = path.join(this.templatesDir, 'nango-mcp-servers.json');
    const config = { mcpServers };
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    console.log(`⚙️  Saved MCP config to ${configFile}`);
  }

  async generatePriorityList(analyses) {
    const priorityIntegrations = [
      'slack', 'github', 'notion', 'google-mail', 'google-calendar', 
      'google-drive', 'salesforce', 'hubspot', 'jira', 'asana',
      'linear', 'confluence', 'dropbox', 'zoom', 'microsoft-teams',
      'stripe-app', 'shopify', 'zendesk', 'intercom', 'pipedrive'
    ];

    const priorityList = analyses
      .filter(a => !a.error && priorityIntegrations.includes(a.name))
      .sort((a, b) => priorityIntegrations.indexOf(a.name) - priorityIntegrations.indexOf(b.name));

    const priorityFile = path.join(this.templatesDir, 'priority-integrations.json');
    fs.writeFileSync(priorityFile, JSON.stringify(priorityList, null, 2));
    console.log(`⭐ Saved priority list to ${priorityFile}`);
  }

  async run() {
    try {
      console.log('🚀 Starting Nango Integration Templates Analysis...\n');
      
      const analyses = await this.fetchAllIntegrations();
      await this.saveAnalysis(analyses);
      
      const mcpServers = await this.generateMCPConfig(analyses);
      await this.saveMCPConfig(mcpServers);
      
      await this.generatePriorityList(analyses);
      
      console.log('\n✅ Analysis complete!');
      console.log(`📊 Total integrations analyzed: ${analyses.length}`);
      console.log(`⚙️  MCP servers configured: ${Object.keys(mcpServers).length}`);
      console.log(`⭐ Priority integrations: ${analyses.filter(a => !a.error && ['slack', 'github', 'notion'].includes(a.name)).length}`);
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fetcher = new NangoTemplateFetcher();
  fetcher.run();
}

module.exports = NangoTemplateFetcher;