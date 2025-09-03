const { useSwagger } = require("../../swagger/utils");
const { apiAdminEndpoints } = require("./admin");
const { apiAuthEndpoints } = require("./auth");
const { apiDocumentEndpoints } = require("./document");
const { apiSystemEndpoints } = require("./system");
const { apiWorkspaceEndpoints } = require("./workspace");
const { apiWorkspaceConnectorEndpoints } = require("./workspace/connectors");
const { apiWorkspaceThreadEndpoints } = require("./workspaceThread");
const { apiUserManagementEndpoints } = require("./userManagement");
const { apiOpenAICompatibleEndpoints } = require("./openai");
const { apiEmbedEndpoints } = require("./embed");
const { nangoWebhookEndpoints } = require("./webhooks/nango");
const { oauthCallbackEndpoints } = require("./oauth/callback");

// All endpoints must be documented and pass through the validApiKey Middleware.
// How to JSDoc an endpoint
// https://www.npmjs.com/package/swagger-autogen#openapi-3x
function developerEndpoints(app, router) {
  if (!router) return;
  useSwagger(app);
  apiAuthEndpoints(router);
  apiAdminEndpoints(router);
  apiSystemEndpoints(router);
  apiWorkspaceEndpoints(router);
  apiWorkspaceConnectorEndpoints(router);
  apiDocumentEndpoints(router);
  apiWorkspaceThreadEndpoints(router);
  apiUserManagementEndpoints(router);
  apiOpenAICompatibleEndpoints(router);
  apiEmbedEndpoints(router);
  nangoWebhookEndpoints(app);
  oauthCallbackEndpoints(app);
}

module.exports = { developerEndpoints };
