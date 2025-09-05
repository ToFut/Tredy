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
const { agentScheduling } = require("./agent-scheduling-enhanced.js");
const { taskContinuity } = require("./task-continuity.js");

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
  agentScheduling,
  taskContinuity,

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
  [agentScheduling.name]: agentScheduling,
  [taskContinuity.name]: taskContinuity,
};
