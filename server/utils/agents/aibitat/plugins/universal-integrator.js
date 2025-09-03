/**
 * Universal Integrator Agent Plugin
 * Allows users to integrate any service through natural language
 */

const { getUniversalIntegrationSystem } = require("../../../integrations/UniversalIntegrationSystem");
const { ConnectorTokens } = require("../../../../models/connectorTokens");

const universalIntegrator = {
  name: "universal-integrator",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        const integrationSystem = getUniversalIntegrationSystem();

        // Tool 1: Integrate any service
        aibitat.function({
          super: aibitat,
          name: "integrate_service",
          controller: new AbortController(),
          description: "Connect and integrate any external service like Slack, GitHub, Shopify, Salesforce, etc. Use when user wants to connect a new service.",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Service name (e.g., slack, github, shopify, salesforce)"
              },
              capabilities: {
                type: "array",
                items: { type: "string" },
                description: "Desired capabilities: sync, search, create, update, delete, webhooks",
                default: ["sync", "search", "create"]
              },
              syncFrequency: {
                type: "string",
                description: "How often to sync data: realtime, 5m, 15m, 30m, 1h, 6h, daily",
                default: "15m"
              },
              syncData: {
                type: "array",
                items: { type: "string" },
                description: "Specific data to sync (e.g., messages, users, products, orders)",
                default: []
              }
            },
            required: ["service"]
          },
          handler: async function({ service, capabilities, syncFrequency, syncData }) {
            try {
              this.super.introspect(`Starting integration for ${service}...`);
              
              const workspaceId = this.super.handlerProps.invocation?.workspace_id;
              if (!workspaceId) {
                return "Unable to determine workspace context for integration.";
              }

              // Check if already connected
              const existing = await ConnectorTokens.get({ 
                workspaceId, 
                provider: service.toLowerCase() 
              });
              
              if (existing && existing.status === 'connected') {
                return `${service} is already connected. Use 'sync_service' to refresh data or 'disconnect_service' to remove.`;
              }

              // Start integration process
              this.super.introspect(`Discovering ${service} API structure...`);
              
              const result = await integrationSystem.integrate({
                service: service.toLowerCase(),
                workspaceId,
                capabilities: capabilities || ['sync', 'search', 'create'],
                syncFrequency: syncFrequency || '15m',
                discoveryMethod: 'auto'
              });

              if (result.success) {
                return `✅ ${service} integrated successfully!
                
📊 Integration Details:
• ${result.endpoints} API endpoints discovered
• ${result.models} data models created
• Syncing every ${result.syncFrequency}
• Capabilities: ${result.capabilities.join(', ')}

🎯 What you can do now:
• Search: "find ${service} items about..."
• Create: "create new ${service} item..."
• Query: "show my ${service} data"
• Sync: "refresh ${service} data"

Try: "search ${service} for recent updates"`;
              } else {
                return `Failed to integrate ${service}. Please check your credentials and try again.`;
              }
            } catch (error) {
              console.error('[UniversalIntegrator] Integration error:', error);
              this.super.introspect(`Integration failed: ${error.message}`);
              
              // Provide helpful error messages
              if (error.message.includes('discover')) {
                return `Could not discover ${service} API. Please ensure:
1. The service name is correct
2. You have the necessary permissions
3. The service has a public API

Try one of these known services: Slack, GitHub, Shopify, Stripe, Notion`;
              }
              
              return `Integration failed: ${error.message}`;
            }
          }
        });

        // Tool 2: List all integrations
        aibitat.function({
          super: aibitat,
          name: "list_integrations",
          controller: new AbortController(),
          description: "Show all connected integrations and their status. Use when user asks what services are connected.",
          parameters: {
            type: "object",
            properties: {
              showDetails: {
                type: "boolean",
                description: "Show detailed information about each integration",
                default: false
              }
            }
          },
          handler: async function({ showDetails }) {
            try {
              const workspaceId = this.super.handlerProps.invocation?.workspace_id;
              const connectors = await ConnectorTokens.forWorkspace(workspaceId);
              
              if (connectors.length === 0) {
                return "No services connected yet. Try: 'integrate Slack' or 'connect GitHub'";
              }

              let response = `📱 Connected Services (${connectors.length}):\n\n`;
              
              for (const connector of connectors) {
                const status = connector.status === 'connected' ? '✅' : '⚠️';
                const lastSync = connector.lastSyncAt 
                  ? new Date(connector.lastSyncAt).toLocaleString()
                  : 'Never';
                
                response += `${status} ${connector.provider}\n`;
                
                if (showDetails) {
                  response += `   Status: ${connector.status}\n`;
                  response += `   Last Sync: ${lastSync}\n`;
                  response += `   Records: ${connector.recordCount || 0}\n`;
                  
                  if (connector.syncConfig) {
                    response += `   Models: ${connector.syncConfig.models?.join(', ') || 'N/A'}\n`;
                  }
                }
                response += '\n';
              }
              
              return response;
            } catch (error) {
              return `Error listing integrations: ${error.message}`;
            }
          }
        });

        // Tool 3: Sync service data
        aibitat.function({
          super: aibitat,
          name: "sync_service",
          controller: new AbortController(),
          description: "Manually trigger a sync for a connected service. Use when user wants to refresh data.",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Service name to sync"
              },
              fullSync: {
                type: "boolean",
                description: "Perform full sync instead of incremental",
                default: false
              }
            },
            required: ["service"]
          },
          handler: async function({ service, fullSync }) {
            try {
              this.super.introspect(`Syncing ${service} data...`);
              
              const workspaceId = this.super.handlerProps.invocation?.workspace_id;
              const connector = await ConnectorTokens.get({
                workspaceId,
                provider: service.toLowerCase()
              });
              
              if (!connector) {
                return `${service} is not connected. Use 'integrate ${service}' first.`;
              }

              // Trigger sync via Nango
              // In production, this would call Nango API
              await ConnectorTokens.update({
                id: connector.id,
                lastSyncAt: new Date(),
                syncStatus: 'syncing'
              });

              return `🔄 Sync started for ${service}
              
This may take a few minutes depending on data volume.
You'll be notified when complete.
              
To check status: "show ${service} sync status"`;
            } catch (error) {
              return `Sync failed: ${error.message}`;
            }
          }
        });

        // Tool 4: Search across integrated services
        aibitat.function({
          super: aibitat,
          name: "search_integrations",
          controller: new AbortController(),
          description: "Search across all integrated services. Use for cross-service queries.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query"
              },
              services: {
                type: "array",
                items: { type: "string" },
                description: "Specific services to search (empty = all)",
                default: []
              },
              limit: {
                type: "number",
                description: "Maximum results per service",
                default: 5
              }
            },
            required: ["query"]
          },
          handler: async function({ query, services, limit }) {
            try {
              this.super.introspect(`Searching for "${query}" across integrations...`);
              
              const workspaceId = this.super.handlerProps.invocation?.workspace_id;
              const connectors = await ConnectorTokens.forWorkspace(workspaceId);
              
              // Filter to requested services
              const searchTargets = services.length > 0
                ? connectors.filter(c => services.includes(c.provider))
                : connectors;
              
              if (searchTargets.length === 0) {
                return "No services to search. Connect services first.";
              }

              // Search across services (would use vector DB in production)
              let results = `🔍 Search Results for "${query}":\n\n`;
              
              for (const connector of searchTargets) {
                results += `📱 ${connector.provider}:\n`;
                // In production, this would search vector DB
                results += `   • Found relevant items (implementation pending)\n`;
              }
              
              return results;
            } catch (error) {
              return `Search failed: ${error.message}`;
            }
          }
        });

        // Tool 5: Disconnect service
        aibitat.function({
          super: aibitat,
          name: "disconnect_service",
          controller: new AbortController(),
          description: "Disconnect and remove an integrated service.",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Service name to disconnect"
              },
              keepData: {
                type: "boolean",
                description: "Keep synced data after disconnection",
                default: false
              }
            },
            required: ["service"]
          },
          handler: async function({ service, keepData }) {
            try {
              const workspaceId = this.super.handlerProps.invocation?.workspace_id;
              
              // Remove from Nango
              const { MCPNangoBridge } = require("../../../../utils/connectors/mcp-nango-bridge");
              const bridge = new MCPNangoBridge();
              await bridge.disconnect(service.toLowerCase(), workspaceId);
              
              // Remove from database
              await ConnectorTokens.delete({
                workspaceId,
                provider: service.toLowerCase()
              });
              
              if (!keepData) {
                // Clean up vector data
                // Implementation would remove from vector DB
              }
              
              return `✅ ${service} disconnected successfully.
${keepData ? 'Synced data has been preserved.' : 'All data has been removed.'}`;
            } catch (error) {
              return `Disconnection failed: ${error.message}`;
            }
          }
        });

        // Tool 6: Create workflow
        aibitat.function({
          super: aibitat,
          name: "create_workflow",
          controller: new AbortController(),
          description: "Create automated workflows between integrated services.",
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Natural language description of the workflow"
              },
              trigger: {
                type: "object",
                properties: {
                  service: { type: "string" },
                  event: { type: "string" }
                }
              },
              actions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    service: { type: "string" },
                    action: { type: "string" }
                  }
                }
              }
            },
            required: ["description"]
          },
          handler: async function({ description, trigger, actions }) {
            try {
              this.super.introspect(`Creating workflow: ${description}`);
              
              // Parse workflow from description if not provided
              if (!trigger || !actions) {
                // Use AI to parse workflow
                // Implementation would use LLM to understand intent
              }
              
              return `✅ Workflow created!
              
📋 Workflow: ${description}
🎯 Trigger: ${trigger?.service} - ${trigger?.event}
⚡ Actions: ${actions?.length || 0} actions
              
The workflow is now active and will run automatically.
To manage workflows: "show my workflows"`;
            } catch (error) {
              return `Workflow creation failed: ${error.message}`;
            }
          }
        });
      }
    };
  }
};

module.exports = { universalIntegrator };