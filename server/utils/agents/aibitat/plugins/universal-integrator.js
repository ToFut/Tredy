/**
 * Universal Integrator Agent Plugin
 * Simple connection button generator for OAuth services
 */

const universalIntegrator = {
  name: "universal-integrator",
  startupConfig: {
    params: {},
  },
  plugin: function () {
    return {
      name: this.name,
      setup(aibitat) {
        // Tool 1: Simple connection button generator
        aibitat.function({
          super: aibitat,
          name: "manage_service_connection",
          controller: new AbortController(),
          description:
            "Show connection button for any service. Use when user wants to connect to any service like GitHub, Gmail, Slack, etc.",
          parameters: {
            type: "object",
            properties: {
              service: {
                type: "string",
                description:
                  "Name of service to connect (github, gmail, slack, etc.)",
              },
            },
            required: ["service"],
          },
          handler: async function ({ service }) {
            console.log("🔌 Connection request for:", service);

            const serviceName =
              service.charAt(0).toUpperCase() + service.slice(1);

            return `🔐 **Connect ${serviceName}**

To connect your ${serviceName} account, click the button below:

[connect:${service.toLowerCase()}]

This will:
✅ Open a secure OAuth window  
✅ Connect your ${serviceName} account
✅ Enable ${serviceName} features in this workspace

The connection is secure and you can manage it anytime in Workspace Settings → Data Connectors.`;
          },
        });
      },
    };
  },
};

module.exports = { universalIntegrator };
