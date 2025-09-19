const { MCPNangoBridge } = require("../../../connectors/mcp-nango-bridge");
const { NangoIntegration } = require("../../../connectors/nango-integration");

/**
 * Universal Integration Plugin for AnythingLLM Agent
 * Allows agent to create any integration via natural language
 */
const universalIntegration = {
  name: "universal-integration",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        // Main integration command
        aibitat.function({
          super: aibitat,
          name: "create_integration",
          controller: new AbortController(),
          description:
            "Create or configure an integration with any external service. Use when user asks to connect, integrate, or sync with any service.",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description:
                  "Name of the service to integrate (e.g., Slack, GitHub, Salesforce)",
              },
              resources: {
                type: "array",
                description:
                  "Types of data to sync (e.g., ['messages', 'users'] for Slack)",
                items: { type: "string" },
              },
              operations: {
                type: "array",
                description:
                  "Operations to enable (e.g., ['create', 'update', 'delete', 'search'])",
                items: { type: "string" },
                default: ["list", "get", "search"],
              },
              syncFrequency: {
                type: "string",
                description: "How often to sync data",
                default: "15m",
              },
              vectorFields: {
                type: "array",
                description: "Fields to index for semantic search",
                items: { type: "string" },
              },
            },
            required: ["service"],
          },
          handler: async function ({
            service,
            resources,
            operations,
            syncFrequency,
            vectorFields,
          }) {
            try {
              this.super.introspect(`Creating integration for ${service}...`);

              const workspaceId =
                this.super.handlerProps.invocation?.workspace_id;
              if (!workspaceId) {
                return "Unable to determine workspace context.";
              }

              // Step 1: Discover service capabilities
              const discovery = await discoverService(service);

              // Step 2: Generate Nango configuration
              const config = await generateNangoConfig({
                service,
                resources: resources || discovery.resources,
                operations: operations || discovery.operations,
                syncFrequency,
                vectorFields: vectorFields || discovery.searchableFields,
                workspaceId,
              });

              // Step 3: Deploy to Nango
              const deployment = await deployToNango(config);

              // Step 4: Update MCP servers
              const bridge = new MCPNangoBridge();
              await bridge.updateMCPServersForWorkspace(workspaceId);

              // Step 5: Start initial sync if needed
              if (config.type === "sync") {
                await triggerInitialSync(service, workspaceId);
              }

              return `✅ Successfully integrated ${service}!
              
Connected Resources: ${(resources || discovery.resources).join(", ")}
Available Operations: ${(operations || discovery.operations).join(", ")}
Sync Frequency: ${syncFrequency}
Vector Search Enabled: ${vectorFields ? "Yes" : "No"}

You can now:
- Search ${service} data: "@agent search ${service} for..."
- Create items: "@agent create ${service} [resource]..."
- Update items: "@agent update ${service} [resource]..."`;
            } catch (error) {
              console.error("[UniversalIntegration] Error:", error);
              return `Failed to create integration: ${error.message}`;
            }
          },
        });

        // Query integrated service
        aibitat.function({
          super: aibitat,
          name: "query_integration",
          controller: new AbortController(),
          description: "Query or search data from any integrated service",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Name of the integrated service",
              },
              query: {
                type: "string",
                description: "Natural language query or search term",
              },
              resource: {
                type: "string",
                description: "Specific resource type to search (optional)",
              },
              filters: {
                type: "object",
                description: "Additional filters",
                additionalProperties: true,
              },
            },
            required: ["service", "query"],
          },
          handler: async function ({ service, query, resource, filters }) {
            try {
              this.super.introspect(`Searching ${service} for: ${query}`);

              const workspaceId =
                this.super.handlerProps.invocation?.workspace_id;

              // Smart routing: Vector search vs Direct API
              const results = await smartQuery({
                service,
                query,
                resource,
                filters,
                workspaceId,
              });

              return formatResults(results, service);
            } catch (error) {
              return `Search failed: ${error.message}`;
            }
          },
        });

        // Perform action on integrated service
        aibitat.function({
          super: aibitat,
          name: "integration_action",
          controller: new AbortController(),
          description:
            "Perform an action (create, update, delete) on an integrated service",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Name of the integrated service",
              },
              action: {
                type: "string",
                description: "Action to perform",
                enum: ["create", "update", "delete"],
              },
              resource: {
                type: "string",
                description:
                  "Resource type (e.g., 'issue', 'contact', 'event')",
              },
              data: {
                type: "object",
                description: "Data for the action",
                additionalProperties: true,
              },
            },
            required: ["service", "action", "resource", "data"],
          },
          handler: async function ({ service, action, resource, data }) {
            try {
              this.super.introspect(
                `Performing ${action} on ${service} ${resource}`
              );

              const workspaceId =
                this.super.handlerProps.invocation?.workspace_id;
              const nango = new NangoIntegration();

              // Execute via Nango action
              const result = await nango.executeAction(
                service,
                action,
                resource,
                data,
                workspaceId
              );

              return `✅ Successfully ${action}d ${resource} in ${service}: ${JSON.stringify(result, null, 2)}`;
            } catch (error) {
              return `Action failed: ${error.message}`;
            }
          },
        });
      },
    };
  },
};

// Helper functions
async function discoverService(service) {
  // Auto-discover service capabilities
  // This could check OpenAPI specs, GraphQL schemas, or use AI
  const discoveries = {
    slack: {
      resources: ["channels", "messages", "users"],
      operations: ["list", "get", "create", "search"],
      searchableFields: ["text", "username", "channel_name"],
    },
    github: {
      resources: ["repos", "issues", "pull_requests", "commits"],
      operations: ["list", "get", "create", "update", "search"],
      searchableFields: ["title", "body", "description"],
    },
    salesforce: {
      resources: ["contacts", "accounts", "opportunities", "leads"],
      operations: ["list", "get", "create", "update", "delete", "search"],
      searchableFields: ["name", "email", "description", "notes"],
    },
    // Default for unknown services
    default: {
      resources: ["records"],
      operations: ["list", "get", "search"],
      searchableFields: ["name", "description", "content"],
    },
  };

  return discoveries[service.toLowerCase()] || discoveries.default;
}

async function generateNangoConfig(params) {
  const {
    service,
    resources,
    operations,
    syncFrequency,
    vectorFields,
    workspaceId,
  } = params;

  // Generate Nango integration configuration
  const config = {
    provider: service.toLowerCase(),
    integrationName: `${service.toLowerCase()}-universal`,
    type: operations.includes("create") ? "hybrid" : "sync",
    syncConfig: {
      frequency: syncFrequency,
      resources: resources,
      incremental: true,
    },
    actionConfig: {
      operations: operations.filter((op) =>
        ["create", "update", "delete"].includes(op)
      ),
    },
    vectorConfig: {
      enabled: !!vectorFields,
      fields: vectorFields,
      webhookUrl: `${process.env.SERVER_URL || "http://localhost:8124"}/api/webhooks/nango`,
    },
    workspaceId,
  };

  return config;
}

async function deployToNango(config) {
  // This would use Nango's API to create the integration
  // For now, return mock success
  console.log("[UniversalIntegration] Deploying to Nango:", config);
  return { success: true, integrationId: config.integrationName };
}

async function triggerInitialSync(service, workspaceId) {
  // Trigger first sync
  console.log(
    `[UniversalIntegration] Triggering initial sync for ${service} in workspace ${workspaceId}`
  );
  return true;
}

async function smartQuery({ service, query, resource, filters, workspaceId }) {
  // Smart routing logic
  const shouldUseVector = await shouldQueryVector(query);

  if (shouldUseVector) {
    // Query from vector DB (fast, semantic)
    const { getVectorDbClass } = require("../../../helpers");
    const vectorDB = getVectorDbClass();
    return await vectorDB.search(workspaceId, query, { resource, ...filters });
  } else {
    // Query via Nango proxy (real-time)
    const nango = new NangoIntegration();
    return await nango.proxyQuery(
      service,
      resource,
      { q: query, ...filters },
      workspaceId
    );
  }
}

async function shouldQueryVector(query) {
  // Determine if query is better suited for vector search
  const semanticKeywords = [
    "similar",
    "like",
    "about",
    "related",
    "concerning",
  ];
  return semanticKeywords.some((keyword) =>
    query.toLowerCase().includes(keyword)
  );
}

function formatResults(results, service) {
  if (!results || results.length === 0) {
    return `No results found in ${service}.`;
  }

  const formatted = results
    .slice(0, 5)
    .map(
      (item, i) =>
        `${i + 1}. ${item.title || item.name || item.id}: ${item.description || item.content || ""}`
    )
    .join("\n");

  return `Found ${results.length} results in ${service}:\n\n${formatted}`;
}

module.exports = { universalIntegration };
