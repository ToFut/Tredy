import AgentWebSearchSelection from "./WebSearchSelection";
import AgentSQLConnectorSelection from "./SQLConnectorSelection";
import GenericSkillPanel from "./GenericSkillPanel";
import DefaultSkillPanel from "./DefaultSkillPanel";
import {
  Brain,
  File,
  Browser,
  ChartBar,
  FileMagnifyingGlass,
  ChartLine,
  Plugs,
  ListChecks,
  ShoppingCart,
} from "@phosphor-icons/react";
import RAGImage from "@/media/agents/rag-memory.png";
import SummarizeImage from "@/media/agents/view-summarize.png";
import ScrapeWebsitesImage from "@/media/agents/scrape-websites.png";
import GenerateChartsImage from "@/media/agents/generate-charts.png";
import GenerateSaveImages from "@/media/agents/generate-save-files.png";

export const defaultSkills = {
  "rag-memory": {
    title: "RAG & long-term memory",
    description:
      'Allow the agent to leverage your local documents to answer a query or ask the agent to "remember" pieces of content for long-term memory retrieval.',
    component: DefaultSkillPanel,
    icon: Brain,
    image: RAGImage,
    skill: "rag-memory",
  },
  "document-summarizer": {
    title: "View & summarize documents",
    description:
      "Allow the agent to list and summarize the content of workspace files currently embedded.",
    component: DefaultSkillPanel,
    icon: File,
    image: SummarizeImage,
    skill: "document-summarizer",
  },
  "web-scraping": {
    title: "Scrape websites",
    description: "Allow the agent to visit and scrape the content of websites.",
    component: DefaultSkillPanel,
    icon: Browser,
    image: ScrapeWebsitesImage,
    skill: "web-scraping",
  },
  "task-planner": {
    title: "Task Planning & Tracking",
    description:
      "Automatically creates and tracks to-do lists for complex multi-step requests, ensuring all requested actions are completed.",
    component: DefaultSkillPanel,
    icon: ListChecks,
    image: RAGImage,
    skill: "task-planner",
  },
  "flow-orchestrator": {
    title: "Workflow Orchestrator",
    description:
      "Automatically creates and executes workflows for multi-step requests. Ensures ALL actions complete in sequence. Can save workflows for reuse.",
    component: DefaultSkillPanel,
    icon: Plugs,
    image: RAGImage,
    skill: "flow-orchestrator",
  },
  "auto-workflow": {
    title: "Auto Workflow",
    description:
      "Automatically handles ANY action request by creating and executing workflows. Ensures complete task execution for emails, invites, calendar, and all multi-step tasks.",
    component: DefaultSkillPanel,
    icon: Brain,
    image: RAGImage,
    skill: "auto-workflow",
  },
  "summary-generator": {
    title: "Chat Summary Generator",
    description:
      "Generate comprehensive summaries of chat conversations including key topics, action items, and insights. Works with @summary command or agent requests.",
    component: DefaultSkillPanel,
    icon: File,
    image: SummarizeImage,
    skill: "summary-generator",
  },
  "workflow-creator": {
    title: "Workflow Creator",
    description:
      "Create and manage workflows directly from chat. Parse natural language descriptions into executable workflow steps with visual previews. Use '@agent create workflow' to get started.",
    component: DefaultSkillPanel,
    icon: Plugs,
    image: RAGImage,
    skill: "workflow-creator",
  },
};

export const configurableSkills = {
  "save-file-to-browser": {
    title: "Generate & save files to browser",
    description:
      "Enable the default agent to generate and write to files that can be saved to your computer.",
    component: GenericSkillPanel,
    skill: "save-file-to-browser",
    icon: FileMagnifyingGlass,
    image: GenerateSaveImages,
  },
  "create-chart": {
    title: "Generate charts",
    description:
      "Enable the default agent to generate various types of charts from data provided or given in chat.",
    component: GenericSkillPanel,
    skill: "create-chart",
    icon: ChartBar,
    image: GenerateChartsImage,
  },
  "stock-market": {
    title: "Stock Market Analyzer",
    description:
      "Enable real-time stock market data analysis including prices, company fundamentals, technical indicators (RSI, moving averages), and market insights.",
    component: GenericSkillPanel,
    skill: "stock-market",
    icon: ChartLine,
    image: GenerateChartsImage,
  },
  "web-browsing": {
    title: "Web Search",
    component: AgentWebSearchSelection,
    skill: "web-browsing",
  },
  "sql-agent": {
    title: "SQL Connector",
    component: AgentSQLConnectorSelection,
    skill: "sql-agent",
  },
  "universal-integrator": {
    title: "Universal Integrations",
    description:
      "Connect ANY external service through natural language. Automatically handles OAuth, syncs data, and provides tools for popular services like Slack, GitHub, Shopify, Salesforce, and more.",
    component: GenericSkillPanel,
    skill: "universal-integrator",
    icon: Plugs,
    image: ScrapeWebsitesImage,
  },
  "procurement-orchestrator": {
    title: "Procurement Workflow System",
    description:
      "Complete 11-stage procurement workflow from BOM extraction to delivery. Includes AI compliance analysis (CAL 117-2013, ADA), supplier matching with weighted scoring, RFQ management, bid comparison, contract generation, payment processing, and shipment tracking. Perfect for hotel/hospitality procurement.",
    component: GenericSkillPanel,
    skill: "procurement-orchestrator",
    icon: ShoppingCart,
    image: GenerateChartsImage,
  },
};
