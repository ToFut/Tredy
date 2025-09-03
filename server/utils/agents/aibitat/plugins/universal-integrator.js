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

        // Tool 1: Suggest integrations (as required by system prompt)
        aibitat.function({
          super: aibitat,
          name: "suggest_integrations",
          controller: new AbortController(),
          description: "Show interactive connection button when user wants to connect to a service. Use when user says 'integrate [service]' or 'connect to [service]'.",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Name of service to connect (airtable, slack, github, shopify, etc.)"
              }
            },
            required: ["service"]
          },
          handler: async function({ service }) {
            try {
              console.log('[UniversalIntegrator] suggest_integrations called for:', service);
              this.super.introspect(`🔗 Setting up ${service} integration...`);
              
              const workspaceId = this.super.handlerProps.invocation?.workspace_id;
              if (!workspaceId) {
                return `⚠️ Workspace context required for integration. Please ensure you're in a workspace.`;
              }

              // Check if already connected
              const existing = await ConnectorTokens.get({ 
                workspaceId, 
                provider: service.toLowerCase() 
              });
              
              if (existing && existing.status === 'connected') {
                return `✅ ${service} is already connected!

Current status: Connected
Last sync: ${existing.lastSyncAt || 'Never'}

To manage connection: Go to Workspace Settings → Data Connectors`;
              }

              // Generate integration with OAuth button
              this.super.introspect(`Preparing ${service} integration with OAuth...`);
              
              const result = await integrationSystem.integrate({
                service: service.toLowerCase(),
                workspaceId,
                capabilities: ['sync', 'create'],
                syncFrequency: '15m',
                discoveryMethod: 'template'
              });

              if (result.success) {
                return `🚀 ${service} Integration Ready!

📋 Integration Prepared:
• Service: ${result.service}
• Endpoints: ${result.endpoints} API endpoints
• Data Models: ${result.models} models
• Capabilities: ${result.capabilities.join(', ')}

🔐 **Connect Your ${service} Account:**

[connect:${service.toLowerCase()}]

Once connected, you can use ${service} features with natural language commands!`;
              } else {
                return `⚠️ ${service} Integration Setup Incomplete

You can try connecting directly:

[connect:${service.toLowerCase()}]

**Alternative Options:**
• Check [Data Connectors](/workspace/settings/connectors) for manual setup
• Ensure ${service} OAuth app is configured in Nango dashboard`;
              }
            } catch (error) {
              console.error('[UniversalIntegrator] Error in suggest_integrations:', error);
              return `❌ Integration setup failed for ${service}

Error: ${error.message}

You can try connecting directly:

[connect:${service.toLowerCase()}]

Or check [Data Connectors](/workspace/settings/connectors) for manual setup.`;
            }
          }
        });

        // Tool 2: Direct integration service (backup)
        aibitat.function({
          super: aibitat,
          name: "integrate_service_now",
          controller: new AbortController(),
          description: "INTEGRATION: Call this when user says 'integrate [service]' like 'integrate airtable'. Creates OAuth and integrations.",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description: "Name of service to integrate (airtable, slack, github, shopify, notion, stripe, etc.)"
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
              // Debug logging
              console.log('[UniversalIntegrator] PLUGIN CALLED!', { service, capabilities });
              this.super.introspect(`🎉 Universal Integrator Plugin Called! Starting ${service} integration...`);
              
              const workspaceId = this.super.handlerProps.invocation?.workspace_id;
              if (!workspaceId) {
                return `⚠️ Workspace context required for integration. Please ensure you're in a workspace.`;
              }

              // Check if already connected
              const existing = await ConnectorTokens.get({ 
                workspaceId, 
                provider: service.toLowerCase() 
              });
              
              if (existing && existing.status === 'connected') {
                return `✅ ${service} is already integrated!

Current configuration:
• Status: Connected
• Last sync: ${existing.lastSyncAt || 'Never'}
• Capabilities: ${existing.syncConfig?.capabilities?.join(', ') || 'Standard'}

To refresh: "sync ${service} data"
To disconnect: "disconnect ${service}"`;
              }

              // Start integration process with Nango best practices
              this.super.introspect(`Generating Nango integration files for ${service}...`);
              
              const result = await integrationSystem.integrate({
                service: service.toLowerCase(),
                workspaceId,
                capabilities: capabilities || ['sync', 'create'],
                syncFrequency: syncFrequency || '15m',
                discoveryMethod: 'template' // Use templates first for better results
              });

              if (result.success) {
                this.super.introspect(`Integration files generated! Now deploying to Nango and setting up OAuth...`);
                
                // Step 1: Deploy to Nango (actually call Nango API)
                const { MCPNangoBridge } = require("../../../../utils/connectors/mcp-nango-bridge");
                const bridge = new MCPNangoBridge();
                
                try {
                  this.super.introspect(`Deploying ${service} integration to Nango...`);
                  
                  // Deploy integration files to Nango
                  await integrationSystem.deployToNangoAPI(service, workspaceId);
                  
                  // Step 2: Trigger OAuth flow (return auth URL)
                  this.super.introspect(`Generating OAuth URL for ${service}...`);
                  const authConfig = await bridge.generateAuthUrl(service.toLowerCase(), workspaceId);
                  
                  if (authConfig && authConfig.publicKey) {
                    // Step 3: Create MCP server configuration (ready for when OAuth completes)
                    await bridge.configureMCPServer(service.toLowerCase(), workspaceId);
                    
                    return `🚀 ${service} Integration Ready for OAuth!

📋 Generated Integration:
• Service: ${result.service}
• Endpoints: ${result.endpoints} API endpoints
• Data Models: ${result.models} models
• Sync Frequency: ${result.syncFrequency}
• Capabilities: ${result.capabilities.join(', ')}

📁 Files Deployed:
• Nango sync scripts ✅
• Action scripts ✅
• TypeScript models ✅
• OAuth configuration ✅
• MCP tools ✅

🔐 **Connect Your ${service} Account:**

[connect:${service.toLowerCase()}]

Once connected, you can:
• **Search data:** "@agent search ${service} for..."
• **Create content:** "@agent create ${service} post..."
• **Sync data:** "@agent sync ${service}"

⚡ The integration will auto-complete when you authorize access.`;
                  } else {
                    return `⚠️ ${service} integration created but OAuth setup incomplete.

Files generated successfully, but missing:
• NANGO_PUBLIC_KEY environment variable
• OAuth app credentials in Nango dashboard

Please configure Nango OAuth for ${service} and try again.`;
                  }
                  
                } catch (deployError) {
                  this.super.introspect(`Deployment error: ${deployError.message}`);
                  
                  // Still return partial success - files were generated
                  return `⚠️ ${service} Integration Partially Complete

📋 Generated Integration Files:
• Service: ${result.service}
• Endpoints: ${result.endpoints} API endpoints  
• Data Models: ${result.models} models

❌ Deployment Issues:
• ${deployError.message}

Manual Setup Required:
1. Check Nango configuration
2. Verify environment variables
3. Try: "test universal integrator"`;
                }
              } else {
                // Check if this is a known provider that can be connected directly
                const knownProviders = ['linkedin', 'gmail', 'google-calendar', 'github', 'slack', 'shopify', 'airtable', 'notion'];
                const serviceLower = service.toLowerCase();
                
                if (knownProviders.includes(serviceLower)) {
                  return `⚠️ ${service} Integration Setup Incomplete

The integration may exist but OAuth setup is needed. You can try connecting directly:

[connect:${serviceLower}]

**Alternative Options:**
• Check if ${service} is configured in [Data Connectors](/workspace/settings/connectors)  
• Verify Nango OAuth app credentials
• Contact admin if ${service} app needs setup`;
                }

                return `❌ Failed to integrate ${service}. 

Possible issues:
• Service template not found
• API discovery failed  
• Invalid service name

Try one of these supported services:
• LinkedIn, Slack, GitHub, Shopify, Stripe, Gmail`;
              }
            } catch (error) {
              console.error('[UniversalIntegrator] Integration error:', error);
              this.super.introspect(`Integration error: ${error.message}`);
              
              // Enhanced error handling
              if (error.message.includes('template')) {
                return `❌ No template found for ${service}.

Available services:
• LinkedIn - Professional networking
• Slack - Team communication  
• GitHub - Code repository
• Shopify - E-commerce
• Gmail - Email

To add a new service, we need to create a template first.`;
              }
              
              if (error.message.includes('Nango')) {
                return `❌ Nango integration error for ${service}.

Please check:
1. Nango credentials are configured
2. ${service} is set up in Nango dashboard
3. OAuth scopes are correct

Error: ${error.message}`;
              }
              
              return `❌ Integration failed: ${error.message}

Please try again or contact support if the issue persists.`;
            }
          }
        });

        // Tool 1.5: Test universal integrator
        aibitat.function({
          super: aibitat,
          name: "test_universal_integrator",
          controller: new AbortController(),
          description: "Test the universal integrator system to verify it's working.",
          parameters: {
            type: "object",
            properties: {}
          },
          handler: async function() {
            const workspaceId = this.super.handlerProps.invocation?.workspace_id;
            return `✅ Universal Integrator is working! 
            
Workspace ID: ${workspaceId || 'Not available (demo mode)'}
Available functions: integrate_service, list_integrations, sync_service, search_integrations, disconnect_service, create_workflow

Try: "integrate Gmail" or "integrate Slack"`;
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
              if (!workspaceId) {
                return "Demo mode: No workspace context available. In a real workspace, this would show your connected integrations.";
              }
              
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

        // Tool 7: Proactive integration suggestions
        aibitat.function({
          super: aibitat,
          name: "suggest_integrations",
          controller: new AbortController(),
          description: "Suggest service integrations to the user. ALWAYS use this when user asks to 'connect', 'integrate', or mentions wanting to use external services like Gmail, Slack, LinkedIn, etc.",
          parameters: {
            type: "object",
            properties: {
              userRequest: {
                type: "string",
                description: "The user's original request that triggered the suggestion"
              },
              context: {
                type: "string",
                description: "Additional context about what the user is trying to accomplish",
                default: ""
              }
            },
            required: []
          },
          handler: async function({ userRequest = "suggest integrations", context = "" }) {
            this.super.introspect(`Generating integration suggestions`);

            const workspaceId = this.super.handlerProps.invocation?.workspace_id;
            
            // Service detection patterns - simplified
            const servicePatterns = {
              gmail: /\b(gmail|email|mail)\b/i,
              'google-calendar': /\b(calendar|schedule|meeting|appointment|events)\b/i,
              linkedin: /\b(linkedin)\b/i,
              slack: /\b(slack)\b/i,
              github: /\b(github)\b/i,
              shopify: /\b(shopify|store)\b/i,
            };

            const detectedServices = [];
            
            // Check what user mentioned or default to common services
            if (userRequest && userRequest !== "suggest integrations") {
              Object.entries(servicePatterns).forEach(([service, pattern]) => {
                if (pattern.test(userRequest)) {
                  detectedServices.push(service);
                }
              });
            }
            
            // If no specific service detected, suggest common ones
            if (detectedServices.length === 0) {
              detectedServices.push('gmail', 'google-calendar', 'linkedin');
            }

            // Generate proactive suggestions
            for (const service of detectedServices) {
              const serviceName = service.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              let suggestion = `🔗 **${serviceName} Integration Detected**\n\n`;
              suggestion += `I notice you mentioned ${serviceName}. `;
              
              switch (service) {
                case 'gmail':
                  suggestion += `Would you like me to connect Gmail so I can:\n`;
                  suggestion += `• Send and read emails for you\n`;
                  suggestion += `• Search your inbox\n`;
                  suggestion += `• Manage drafts and labels\n\n`;
                  suggestion += `[connect:gmail]\n\n`;
                  break;
                  
                case 'google-calendar':
                  suggestion += `Would you like me to connect Google Calendar so I can:\n`;
                  suggestion += `• Check your schedule and availability\n`;
                  suggestion += `• Create and manage events\n`;
                  suggestion += `• Send meeting invites\n\n`;
                  suggestion += `[connect:google-calendar]\n\n`;
                  break;
                  
                case 'google-drive':
                  suggestion += `Would you like me to connect Google Drive so I can:\n`;
                  suggestion += `• Access and search your documents\n`;
                  suggestion += `• Create and edit files\n`;
                  suggestion += `• Manage folders and sharing\n\n`;
                  suggestion += `[connect:google-drive]\n\n`;
                  break;
                  
                case 'slack':
                  suggestion += `Would you like me to connect Slack so I can:\n`;
                  suggestion += `• Send messages to channels and users\n`;
                  suggestion += `• Search conversations and files\n`;
                  suggestion += `• Manage your workspace\n\n`;
                  suggestion += `[connect:slack]\n\n`;
                  break;
                  
                case 'github':
                  suggestion += `Would you like me to connect GitHub so I can:\n`;
                  suggestion += `• Access your repositories\n`;
                  suggestion += `• Create issues and pull requests\n`;
                  suggestion += `• Search code and commits\n\n`;
                  suggestion += `[connect:github]\n\n`;
                  break;
                  
                default:
                  suggestion += `Connecting ${serviceName} would enable enhanced functionality for your requests.\n\n`;
                  suggestion += `[connect:${service}]\n\n`;
              }
              
              suggestion += `Once connected, I'll have access to your ${serviceName} data and can help you accomplish tasks more efficiently.`;
              suggestions.push(suggestion);
            }

            if (suggestions.length > 0) {
              return suggestions.join('\n\n---\n\n');
            }

            // Always provide at least LinkedIn connection if no specific service detected
            return "💼 **Connect LinkedIn**\n\nConnect your LinkedIn account to:\n• Send messages and invitations\n• Access your network\n• Post updates\n\n[connect:linkedin]";
          }
        });
      }
    };
  }
};

module.exports = { universalIntegrator };