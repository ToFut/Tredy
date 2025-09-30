const { webBrowsing } = require("./web-browsing.js");
const { webScraping } = require("./web-scraping.js");
const { websocket } = require("./websocket.js");
const { docSummarizer } = require("./summarize.js");
const { saveFileInBrowser } = require("./save-file-browser.js");
const { chatHistory } = require("./chat-history.js");
const { memory } = require("./memory.js");
const { rechart } = require("./rechart.js");
const { sqlAgent } = require("./sql-agent/index.js");
const { stockMarket } = require("./stock-market.js");
const { nangoCalendar } = require("./nango-calendar.js");
const { universalIntegrator } = require("./universal-integrator.js");
const { multiActionHandler } = require("./multi-action-handler.js");
const { unifiedWorkflow } = require("./unified-workflow.js");
const { workflowCreator } = require("./workflow-creator.js");
const { createWorkflow } = require("./create-workflow.js");
const { summaryGenerator } = require("./summary-generator.js");
const { procurementOrchestrator } = require("./procurement-orchestrator.js");
// const { simpleWorkflow } = require("./simple-workflow.js"); // Disabled in favor of workflowCreator

module.exports = {
  webScraping,
  webBrowsing,
  websocket,
  docSummarizer,
  saveFileInBrowser,
  chatHistory,
  memory,
  rechart,
  sqlAgent,
  stockMarket,
  nangoCalendar,
  universalIntegrator,
  multiActionHandler,
  unifiedWorkflow,
  workflowCreator,
  createWorkflow,
  summaryGenerator,
  procurementOrchestrator,
  // simpleWorkflow, // Disabled in favor of workflowCreator

  // Plugin name aliases so they can be pulled by slug as well.
  [webScraping.name]: webScraping,
  [webBrowsing.name]: webBrowsing,
  [websocket.name]: websocket,
  [docSummarizer.name]: docSummarizer,
  [saveFileInBrowser.name]: saveFileInBrowser,
  [chatHistory.name]: chatHistory,
  [memory.name]: memory,
  [rechart.name]: rechart,
  [sqlAgent.name]: sqlAgent,
  [stockMarket.name]: stockMarket,
  [nangoCalendar.name]: nangoCalendar,
  [universalIntegrator.name]: universalIntegrator,
  [multiActionHandler.name]: multiActionHandler,
  [unifiedWorkflow.name]: unifiedWorkflow,
  [workflowCreator.name]: workflowCreator,
  [createWorkflow.name]: createWorkflow,
  [summaryGenerator.name]: summaryGenerator,
  [procurementOrchestrator.name]: procurementOrchestrator,
  // [simpleWorkflow.name]: simpleWorkflow, // Disabled in favor of workflowCreator
};
