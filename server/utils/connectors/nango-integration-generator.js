const { NangoIntegration } = require("./nango-integration");
const fs = require("fs");
const path = require("path");

/**
 * Nango Integration Generator
 * Generates custom Nango sync/action scripts based on user prompts
 * Integrates with existing MCP and vector storage systems
 */
class NangoIntegrationGenerator {
  constructor() {
    this.nango = new NangoIntegration();
    this.templatesPath = path.join(__dirname, "../../templates/nango");
  }

  /**
   * Generate a Nango integration from user prompt
   * @param {Object} config - Integration configuration
   * @returns {Object} Generated integration details
   */
  async generateIntegration(config) {
    const {
      provider,
      integrationName,
      type, // 'sync' or 'action'
      outputSchema,
      fieldMapping,
      apiEndpoint,
      workspaceId,
      description,
    } = config;

    // Generate the Nango script
    const script = this.generateNangoScript(config);

    // Generate the integration.yaml
    const integrationYaml = this.generateIntegrationYaml(config);

    // Update MCP configuration to include new integration
    await this.updateMCPConfig(provider, integrationName, workspaceId);

    // Configure vector sync if it's a sync integration
    if (type === "sync") {
      await this.configureVectorSync(provider, integrationName, workspaceId);
    }

    return {
      script,
      integrationYaml,
      integrationName,
      provider,
      type,
    };
  }

  /**
   * Generate Nango script for sync or action
   */
  generateNangoScript(config) {
    const { type, provider, apiEndpoint, fieldMapping, outputSchema } = config;

    if (type === "sync") {
      return `
import type { NangoSync, ${provider}Record } from './models';

export default async function fetchData(nango: NangoSync): Promise<void> {
    const connection = await nango.getConnection();
    const pageSize = 100;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await nango.get({
            endpoint: \`${apiEndpoint}?page=\${page}&limit=\${pageSize}\`,
            retries: 3
        });

        const records = response.data.items || response.data || [];
        
        // Transform records according to field mapping
        const mappedRecords = records.map(record => ({
            id: record.${fieldMapping.id || "id"},
            name: record.${fieldMapping.name || "name"},
            description: record.${fieldMapping.description || "description"},
            createdAt: record.${fieldMapping.createdAt || "created_at"},
            updatedAt: record.${fieldMapping.updatedAt || "updated_at"},
            metadata: record
        }));

        // Save to Nango
        await nango.batchSave(mappedRecords, '${provider}Record');
        
        // Send webhook to AnythingLLM for vector storage
        await nango.log(\`Synced \${records.length} records from page \${page}\`);
        
        hasMore = records.length === pageSize;
        page++;
    }
}`;
    } else {
      // Action script
      return `
import type { NangoAction, ${provider}Input, ${provider}Output } from './models';

export default async function runAction(nango: NangoAction): Promise<${provider}Output> {
    const input = nango.input as ${provider}Input;
    
    const response = await nango.${input.method || "post"}({
        endpoint: \`${apiEndpoint}\`,
        data: input.data
    });

    return {
        success: true,
        data: response.data,
        message: 'Action completed successfully'
    };
}`;
    }
  }

  /**
   * Generate integration.yaml configuration
   */
  generateIntegrationYaml(config) {
    const { integrationName, type, provider, description, outputSchema } =
      config;

    if (type === "sync") {
      return `
integrations:
  ${integrationName}:
    runs: every 15 minutes
    description: ${description}
    output: ${provider}Record
    sync_type: full
    endpoint: GET ${config.apiEndpoint}
    scopes: ${config.scopes || []}
`;
    } else {
      return `
integrations:
  ${integrationName}:
    description: ${description}
    input: ${provider}Input
    output: ${provider}Output
    endpoint: ${config.method || "POST"} ${config.apiEndpoint}
    scopes: ${config.scopes || []}
`;
    }
  }

  /**
   * Update MCP configuration to include new integration
   */
  async updateMCPConfig(provider, integrationName, workspaceId) {
    const { MCPNangoBridge } = require("./mcp-nango-bridge");
    const bridge = new MCPNangoBridge();

    // Register the new integration with MCP
    await bridge.updateMCPServersForWorkspace(workspaceId);

    console.log(
      `[NangoGenerator] Updated MCP config for ${provider}:${integrationName}`
    );
  }

  /**
   * Configure vector sync for the integration
   */
  async configureVectorSync(provider, integrationName, workspaceId) {
    const { Workspace } = require("../../models/workspace");
    const workspace = await Workspace.get({ id: workspaceId });

    // Update workspace settings to enable vector sync for this integration
    const syncConfig = {
      provider,
      integrationName,
      syncToVector: true,
      vectorFields: ["name", "description", "content"],
      webhookUrl: `${process.env.SERVER_URL}/api/webhooks/nango`,
    };

    // Store sync configuration
    await workspace.updateVectorSyncConfig(syncConfig);

    console.log(
      `[NangoGenerator] Configured vector sync for ${provider}:${integrationName}`
    );
  }

  /**
   * Generate MCP tools from Nango integration
   */
  generateMCPTools(integration) {
    const tools = [];

    if (integration.type === "sync") {
      // Generate search tool for synced data
      tools.push({
        name: `search_${integration.provider}_records`,
        description: `Search ${integration.provider} records from synced data`,
        parameters: {
          query: { type: "string", description: "Search query" },
          limit: { type: "number", default: 10 },
        },
      });

      // Generate get tool for specific record
      tools.push({
        name: `get_${integration.provider}_record`,
        description: `Get specific ${integration.provider} record by ID`,
        parameters: {
          id: { type: "string", description: "Record ID" },
        },
      });
    } else {
      // Generate action tool
      tools.push({
        name: `${integration.integrationName}_action`,
        description: integration.description,
        parameters: integration.inputSchema || {},
      });
    }

    return tools;
  }

  /**
   * Test the generated integration
   */
  async testIntegration(integrationName, connectionId, input = null) {
    const command = input
      ? `nango dryrun ${integrationName} ${connectionId} --validation --input '${JSON.stringify(input)}'`
      : `nango dryrun ${integrationName} ${connectionId} --validation`;

    const { exec } = require("child_process");
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  }
}

module.exports = { NangoIntegrationGenerator };
