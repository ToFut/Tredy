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
const { summaryGenerator } = require("./summary-generator.js");

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
  summaryGenerator,

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
  [summaryGenerator.name]: summaryGenerator,
};
