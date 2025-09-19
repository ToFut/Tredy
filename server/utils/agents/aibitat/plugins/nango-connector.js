const { NangoIntegration } = require("../../../connectors/nango-integration");

/**
 * Nango Connector Plugin for Agents
 * Allows agents to interact with connected services through Nango
 */
const nangoConnector = {
  name: "nango-connector",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: "nango-connector",
      setup: function (aibitat) {
        const nango = new NangoIntegration();

        // List connected services
        aibitat.function({
          super: aibitat,
          name: "list-connected-services",
          description:
            "List all connected external services for this workspace",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {},
            required: [],
          },
          handler: async function () {
            try {
              const workspaceId =
                this.super.handlerProps.invocation.workspace_id;
              const connections = await nango.listConnections(workspaceId);

              if (connections.length === 0) {
                return "No services connected. Ask the user to connect services in workspace settings.";
              }

              return `Connected services:\n${connections
                .map((c) => `- ${c.provider_config_key}: ${c.connection_id}`)
                .join("\n")}`;
            } catch (error) {
              return `Error listing connections: ${error.message}`;
            }
          },
        });

        // Query Google Calendar
        aibitat.function({
          super: aibitat,
          name: "google-calendar-query",
          description: "Query Google Calendar events or create new events",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["list", "create"],
                description: "Action to perform",
              },
              data: {
                type: "object",
                description: "Data for the action (event details for create)",
              },
            },
            required: ["action"],
          },
          handler: async function ({ action, data = {} }) {
            try {
              const workspaceId =
                this.super.handlerProps.invocation.workspace_id;

              if (action === "list") {
                // List upcoming events
                const response = await nango.proxyRequest({
                  provider: "google-calendar",
                  workspaceId,
                  method: "GET",
                  endpoint: "/calendar/v3/calendars/primary/events",
                  data: {
                    maxResults: 10,
                    orderBy: "startTime",
                    singleEvents: true,
                    timeMin: new Date().toISOString(),
                  },
                });

                const events = response.items || [];
                if (events.length === 0) {
                  return "No upcoming events found.";
                }

                return `Upcoming events:\n${events
                  .map(
                    (e) =>
                      `- ${e.summary}: ${e.start?.dateTime || e.start?.date}`
                  )
                  .join("\n")}`;
              }

              if (action === "create") {
                // Create new event
                const response = await nango.proxyRequest({
                  provider: "google-calendar",
                  workspaceId,
                  method: "POST",
                  endpoint: "/calendar/v3/calendars/primary/events",
                  data: {
                    summary: data.summary || "New Event",
                    description: data.description || "Created by AnythingLLM",
                    start: data.start || {
                      dateTime: new Date(Date.now() + 86400000).toISOString(),
                    },
                    end: data.end || {
                      dateTime: new Date(Date.now() + 90000000).toISOString(),
                    },
                  },
                });

                return `Event created: ${response.summary} at ${response.start?.dateTime}`;
              }

              return "Invalid action. Use 'list' or 'create'.";
            } catch (error) {
              return `Error with Google Calendar: ${error.message}`;
            }
          },
        });

        // Query Shopify
        aibitat.function({
          super: aibitat,
          name: "shopify-query",
          description: "Query Shopify store data (products, orders, customers)",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              resource: {
                type: "string",
                enum: ["products", "orders", "customers"],
                description: "Resource to query",
              },
              limit: {
                type: "number",
                description: "Number of items to return",
                default: 10,
              },
            },
            required: ["resource"],
          },
          handler: async function ({ resource, limit = 10 }) {
            try {
              const workspaceId =
                this.super.handlerProps.invocation.workspace_id;

              const response = await nango.proxyRequest({
                provider: "shopify",
                workspaceId,
                method: "GET",
                endpoint: `/admin/api/2024-01/${resource}.json`,
                data: { limit },
              });

              const items = response[resource] || [];
              if (items.length === 0) {
                return `No ${resource} found.`;
              }

              switch (resource) {
                case "products":
                  return `Products:\n${items
                    .map(
                      (p) =>
                        `- ${p.title}: ${p.variants?.[0]?.price} ${p.currency}`
                    )
                    .join("\n")}`;

                case "orders":
                  return `Recent orders:\n${items
                    .map(
                      (o) =>
                        `- Order #${o.order_number}: ${o.total_price} ${o.currency} (${o.financial_status})`
                    )
                    .join("\n")}`;

                case "customers":
                  return `Customers:\n${items
                    .map((c) => `- ${c.first_name} ${c.last_name}: ${c.email}`)
                    .join("\n")}`;

                default:
                  return JSON.stringify(items, null, 2);
              }
            } catch (error) {
              return `Error querying Shopify: ${error.message}`;
            }
          },
        });

        // GitHub operations
        aibitat.function({
          super: aibitat,
          name: "github-query",
          description: "Query GitHub repositories, issues, or pull requests",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["list-repos", "list-issues", "create-issue"],
                description: "Action to perform",
              },
              repo: {
                type: "string",
                description: "Repository name (owner/repo format)",
              },
              data: {
                type: "object",
                description: "Additional data for the action",
              },
            },
            required: ["action"],
          },
          handler: async function ({ action, repo, data = {} }) {
            try {
              const workspaceId =
                this.super.handlerProps.invocation.workspace_id;

              switch (action) {
                case "list-repos":
                  const repos = await nango.proxyRequest({
                    provider: "github",
                    workspaceId,
                    method: "GET",
                    endpoint: "/user/repos",
                    data: { per_page: 10, sort: "updated" },
                  });

                  return `Repositories:\n${repos
                    .map(
                      (r) =>
                        `- ${r.full_name}: ${r.description || "No description"}`
                    )
                    .join("\n")}`;

                case "list-issues":
                  if (!repo)
                    return "Repository name required for listing issues.";

                  const issues = await nango.proxyRequest({
                    provider: "github",
                    workspaceId,
                    method: "GET",
                    endpoint: `/repos/${repo}/issues`,
                    data: { state: "open", per_page: 10 },
                  });

                  return `Open issues in ${repo}:\n${issues
                    .map((i) => `- #${i.number}: ${i.title}`)
                    .join("\n")}`;

                case "create-issue":
                  if (!repo)
                    return "Repository name required for creating issue.";

                  const issue = await nango.proxyRequest({
                    provider: "github",
                    workspaceId,
                    method: "POST",
                    endpoint: `/repos/${repo}/issues`,
                    data: {
                      title: data.title || "New Issue",
                      body: data.body || "Created by AnythingLLM",
                      labels: data.labels || [],
                    },
                  });

                  return `Issue created: #${issue.number} - ${issue.title}\nURL: ${issue.html_url}`;

                default:
                  return "Invalid action.";
              }
            } catch (error) {
              return `Error with GitHub: ${error.message}`;
            }
          },
        });

        // Generic API request through Nango
        aibitat.function({
          super: aibitat,
          name: "nango-api-request",
          description:
            "Make authenticated API request to any connected service",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              provider: {
                type: "string",
                description:
                  "Provider key (e.g., 'shopify', 'google-calendar', 'github')",
              },
              method: {
                type: "string",
                enum: ["GET", "POST", "PUT", "DELETE"],
                description: "HTTP method",
              },
              endpoint: {
                type: "string",
                description: "API endpoint path",
              },
              data: {
                type: "object",
                description: "Request body or query parameters",
              },
            },
            required: ["provider", "method", "endpoint"],
          },
          handler: async function ({ provider, method, endpoint, data }) {
            try {
              const workspaceId =
                this.super.handlerProps.invocation.workspace_id;

              const response = await nango.proxyRequest({
                provider,
                workspaceId,
                method,
                endpoint,
                data,
              });

              return JSON.stringify(response, null, 2);
            } catch (error) {
              return `API request failed: ${error.message}`;
            }
          },
        });

        // Get synced data
        aibitat.function({
          super: aibitat,
          name: "get-synced-data",
          description: "Get data that has been synced from a connected service",
          parameters: {
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            properties: {
              provider: {
                type: "string",
                description: "Provider key",
              },
              syncName: {
                type: "string",
                description: "Name of the sync (e.g., 'contacts', 'products')",
              },
            },
            required: ["provider", "syncName"],
          },
          handler: async function ({ provider, syncName }) {
            try {
              const workspaceId =
                this.super.handlerProps.invocation.workspace_id;

              const records = await nango.getSyncedData(
                provider,
                workspaceId,
                syncName
              );

              if (!records || records.length === 0) {
                return `No synced data found for ${syncName} from ${provider}.`;
              }

              return `Found ${records.length} synced records:\n${JSON.stringify(records.slice(0, 5), null, 2)}`;
            } catch (error) {
              return `Error getting synced data: ${error.message}`;
            }
          },
        });
      },
    };
  },
};

module.exports = { nangoConnector };
