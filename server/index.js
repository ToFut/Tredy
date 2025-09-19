process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

// Auto-enable authentication for Railway deployments if not configured
if (
  process.env.RAILWAY_ENVIRONMENT &&
  !process.env.AUTH_TOKEN &&
  !process.env.DISABLE_AUTH
) {
  console.log(
    "[Railway] Production deployment detected - enabling authentication"
  );
  process.env.AUTH_TOKEN =
    process.env.AUTH_TOKEN || "changeThisPasswordInRailway";
  console.log(
    "[Railway] AUTH_TOKEN has been set. Change it in Railway environment variables!"
  );
}

require("./utils/logger")();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { reqBody } = require("./utils/http");
const { systemEndpoints } = require("./endpoints/system");
const { workspaceEndpoints } = require("./endpoints/workspaces");
const { chatSummaryEndpoints } = require("./endpoints/workspaces/chatSummary");
const { chatEndpoints } = require("./endpoints/chat");
const { embeddedEndpoints } = require("./endpoints/embed");
const { embedManagementEndpoints } = require("./endpoints/embedManagement");
const { getVectorDbClass } = require("./utils/helpers");
const { adminEndpoints } = require("./endpoints/admin");
const { inviteEndpoints } = require("./endpoints/invite");
const { utilEndpoints } = require("./endpoints/utils");
const { developerEndpoints } = require("./endpoints/api");
const { extensionEndpoints } = require("./endpoints/extensions");
const { bootHTTP, bootSSL } = require("./utils/boot");
const { workspaceThreadEndpoints } = require("./endpoints/workspaceThreads");
const { documentEndpoints } = require("./endpoints/document");
const { agentWebsocket } = require("./endpoints/agentWebsocket");
const { experimentalEndpoints } = require("./endpoints/experimental");
const { browserExtensionEndpoints } = require("./endpoints/browserExtension");
const { communityHubEndpoints } = require("./endpoints/communityHub");
const { agentScheduleEndpoints } = require("./endpoints/agentSchedule");
const { agentFlowEndpoints } = require("./endpoints/agentFlows");
const { mcpServersEndpoints } = require("./endpoints/mcpServers");
const { mobileEndpoints } = require("./endpoints/mobile");
const {
  supabaseIntegrationEndpoints,
} = require("./endpoints/supabaseIntegration");
const { supabaseAuthEndpoints } = require("./endpoints/supabaseAuth");
const { threadSharingEndpoints } = require("./endpoints/threadSharing");
const { userConnectorEndpoints } = require("./endpoints/user/connectors");
const {
  apiWorkspaceConnectorEndpoints,
} = require("./endpoints/api/workspace/connectors");
const { waitlistEndpoints } = require("./endpoints/waitlist");
const { WelcomeMessages } = require("./models/welcomeMessages");
const { initializeDatabase } = require("./utils/database/init");
const app = express();
const apiRouter = express.Router();
const FILE_LIMIT = "3GB";

app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: FILE_LIMIT }));
app.use(bodyParser.json({ limit: FILE_LIMIT }));
app.use(
  bodyParser.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

if (!!process.env.ENABLE_HTTPS) {
  bootSSL(app, process.env.SERVER_PORT || process.env.PORT || 3001);
} else {
  require("@mintplex-labs/express-ws").default(app); // load WebSockets in non-SSL mode.
}

app.use("/api", apiRouter);
systemEndpoints(apiRouter);
extensionEndpoints(apiRouter);
workspaceEndpoints(apiRouter);
workspaceThreadEndpoints(apiRouter);
chatSummaryEndpoints(apiRouter);
chatEndpoints(apiRouter);
adminEndpoints(apiRouter);
inviteEndpoints(apiRouter);
embedManagementEndpoints(apiRouter);
utilEndpoints(apiRouter);
documentEndpoints(apiRouter);
agentWebsocket(apiRouter);
experimentalEndpoints(apiRouter);
developerEndpoints(app, apiRouter);
communityHubEndpoints(apiRouter);
agentScheduleEndpoints(apiRouter);
agentFlowEndpoints(apiRouter);
mcpServersEndpoints(apiRouter);
mobileEndpoints(apiRouter);
supabaseIntegrationEndpoints(apiRouter);
supabaseAuthEndpoints(apiRouter);
threadSharingEndpoints(apiRouter);
userConnectorEndpoints(apiRouter);
apiWorkspaceConnectorEndpoints(apiRouter);
waitlistEndpoints(app);

// Externally facing embedder endpoints
embeddedEndpoints(apiRouter);

// Externally facing browser extension endpoints
browserExtensionEndpoints(apiRouter);

if (process.env.NODE_ENV !== "development") {
  const { MetaGenerator } = require("./utils/boot/MetaGenerator");
  const IndexPage = new MetaGenerator();

  // Serve static frontend files from the correct location
  const frontendDistPath = process.env.FRONTEND_BUILD_DIR
    ? path.resolve(process.env.FRONTEND_BUILD_DIR)
    : path.resolve(__dirname, "../frontend/dist");

  app.use(
    express.static(frontendDistPath, {
      extensions: ["js"],
      setHeaders: (res) => {
        // Disable I-framing of entire site UI
        res.removeHeader("X-Powered-By");
        res.setHeader("X-Frame-Options", "DENY");
      },
    })
  );

  app.use("/", function (_, response) {
    IndexPage.generate(response);
    return;
  });

  app.get("/robots.txt", function (_, response) {
    response.type("text/plain");
    response.send("User-agent: *\nDisallow: /").end();
  });
} else {
  // Debug route for development connections to vectorDBs
  apiRouter.post("/v/:command", async (request, response) => {
    try {
      const VectorDb = getVectorDbClass();
      const { command } = request.params;
      if (!Object.getOwnPropertyNames(VectorDb).includes(command)) {
        response.status(500).json({
          message: "invalid interface command",
          commands: Object.getOwnPropertyNames(VectorDb),
        });
        return;
      }

      try {
        const body = reqBody(request);
        const resBody = await VectorDb[command](body);
        response.status(200).json({ ...resBody });
      } catch (e) {
        // console.error(e)
        console.error(JSON.stringify(e));
        response.status(500).json({ error: e.message });
      }
      return;
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });
}

app.all("*", function (_, response) {
  response.sendStatus(404);
});

// Initialize database and default data
(async () => {
  try {
    // Initialize database schema first
    await initializeDatabase();

    // Then initialize default welcome messages
    await WelcomeMessages.initializeDefaults();

    // Initialize MCP servers for production (Railway/non-Docker deployments)
    if (
      process.env.NODE_ENV === "production" ||
      process.env.RAILWAY_ENVIRONMENT
    ) {
      const {
        startMCPServersForProduction,
      } = require("./utils/MCP/railway-startup");
      await startMCPServersForProduction();
    }
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
})();

// In non-https mode we need to boot at the end since the server has not yet
// started and is `.listen`ing.
if (!process.env.ENABLE_HTTPS)
  bootHTTP(app, process.env.SERVER_PORT || process.env.PORT || 3001);
