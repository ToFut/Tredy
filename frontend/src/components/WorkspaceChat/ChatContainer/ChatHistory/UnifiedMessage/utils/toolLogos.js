import {
  Globe,
  Mail,
  Calendar,
  FileText,
  Database,
  Brain,
  Search,
  Code,
  Wrench,
  MessageSquare,
  GitBranch,
  Layers,
  Cloud,
  Image,
  Film,
  Music,
  MapPin,
  CreditCard,
  ShoppingCart,
  Users,
  Settings,
} from "lucide-react";

/**
 * Tool Logo Mapping
 * Maps tool names to their respective logos/icons
 * Uses actual service logos where available, falls back to icons
 */

// External service logos (using CDN or public URLs)
export const SERVICE_LOGOS = {
  // Google Services
  gmail:
    "https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg",
  "google-calendar":
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg",
  "google-drive":
    "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
  "google-docs":
    "https://upload.wikimedia.org/wikipedia/commons/0/01/Google_Docs_logo_%282014-2020%29.svg",
  "google-sheets":
    "https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg",
  youtube:
    "https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg",

  // Microsoft Services
  outlook:
    "https://upload.wikimedia.org/wikipedia/commons/d/df/Microsoft_Office_Outlook_%282018%E2%80%93present%29.svg",
  "microsoft-teams":
    "https://upload.wikimedia.org/wikipedia/commons/c/c9/Microsoft_Office_Teams_%282018%E2%80%93present%29.svg",
  onedrive:
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/Microsoft_Office_OneDrive_%282019%E2%80%93present%29.svg",

  // Development Tools
  github:
    "https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg",
  gitlab: "https://upload.wikimedia.org/wikipedia/commons/e/e1/GitLab_logo.svg",
  bitbucket:
    "https://upload.wikimedia.org/wikipedia/commons/0/0e/Bitbucket-blue-logomark-only.svg",
  jira: "https://upload.wikimedia.org/wikipedia/commons/8/8a/Jira_Logo.svg",
  confluence:
    "https://upload.wikimedia.org/wikipedia/commons/9/9a/Confluence-blue-logomark-only.svg",

  // Communication
  slack:
    "https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg",
  discord: "https://upload.wikimedia.org/wikipedia/en/9/98/Discord_logo.svg",
  zoom: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Zoom_Communications_Logo.svg",

  // Social Media
  linkedin:
    "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
  twitter:
    "https://upload.wikimedia.org/wikipedia/commons/6/6f/Logo_of_Twitter.svg",
  facebook:
    "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",

  // Productivity
  notion:
    "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
  trello: "https://upload.wikimedia.org/wikipedia/en/8/8c/Trello_logo.svg",
  asana: "https://upload.wikimedia.org/wikipedia/commons/3/3b/Asana_logo.svg",
  airtable:
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Airtable_Logo.svg",

  // Design Tools
  figma: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
  sketch: "https://upload.wikimedia.org/wikipedia/commons/5/59/Sketch_Logo.svg",
  canva:
    "https://upload.wikimedia.org/wikipedia/commons/0/08/Canva_icon_2021.svg",

  // Cloud Services
  aws: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg",
  azure:
    "https://upload.wikimedia.org/wikipedia/commons/f/fa/Microsoft_Azure.svg",
  gcp: "https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg",

  // Payment
  stripe:
    "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
  paypal: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg",

  // E-commerce
  shopify:
    "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg",
  woocommerce:
    "https://upload.wikimedia.org/wikipedia/commons/2/2a/WooCommerce_logo.svg",
};

// Icon-based tools (internal tools)
export const TOOL_ICONS = {
  // Search and Research
  "web-search": Search,
  web_search: Search,
  search: Search,
  research: Search,

  // Documents
  "document-summarizer": FileText,
  document_summarizer: FileText,
  "doc-summary": FileText,
  doc_summary: FileText,
  file: FileText,

  // Database
  "sql-query": Database,
  sql_query: Database,
  database: Database,
  query: Database,

  // Memory and AI
  "rag-memory": Brain,
  rag_memory: Brain,
  memory: Brain,
  ai: Brain,
  llm: Brain,

  // Code
  code: Code,
  execute: Code,
  run: Code,
  compile: Code,

  // Communication
  email: Mail,
  mail: Mail,
  message: MessageSquare,
  chat: MessageSquare,

  // Calendar
  calendar: Calendar,
  schedule: Calendar,
  event: Calendar,

  // Version Control
  git: GitBranch,
  version: GitBranch,
  branch: GitBranch,

  // Workflow
  workflow: Layers,
  flow: Layers,
  automation: Layers,

  // Media
  image: Image,
  photo: Image,
  video: Film,
  audio: Music,
  media: Film,

  // Location
  map: MapPin,
  location: MapPin,
  geo: MapPin,

  // Commerce
  payment: CreditCard,
  billing: CreditCard,
  cart: ShoppingCart,
  shop: ShoppingCart,

  // Team
  team: Users,
  users: Users,
  people: Users,

  // Settings
  settings: Settings,
  config: Settings,
  preferences: Settings,

  // Cloud
  cloud: Cloud,
  deploy: Cloud,
  hosting: Cloud,

  // Default
  default: Wrench,
  tool: Wrench,
  unknown: Wrench,
};

/**
 * Get tool logo for a given tool name
 * @param {string} toolName - Name of the tool
 * @returns {string|Component} - URL string for image or React component for icon
 */
export function getToolLogo(toolName) {
  if (!toolName) return TOOL_ICONS.default;

  // Normalize tool name
  const normalized = toolName
    .toLowerCase()
    .replace(/[_\s-]+/g, "-")
    .replace(/^mcp-/, "")
    .replace(/-mcp$/, "");

  // Check for service logo first
  if (SERVICE_LOGOS[normalized]) {
    return SERVICE_LOGOS[normalized];
  }

  // Check for icon match
  for (const [key, icon] of Object.entries(TOOL_ICONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return icon;
    }
  }

  // Default icon
  return TOOL_ICONS.default;
}

/**
 * Get multiple tool logos
 * @param {Array} tools - Array of tool names or tool objects
 * @returns {Array} - Array of logo references
 */
export function getToolLogos(tools) {
  return tools.map((tool) => {
    const toolName = typeof tool === "string" ? tool : tool.name;
    return {
      name: toolName,
      logo: getToolLogo(toolName),
      status: tool.status || "complete",
    };
  });
}

/**
 * Check if logo is an image URL
 * @param {any} logo - Logo reference
 * @returns {boolean} - True if logo is a URL string
 */
export function isImageLogo(logo) {
  return typeof logo === "string";
}

/**
 * Preload image logos for better performance
 * @param {Array} tools - Array of tool names
 */
export function preloadToolLogos(tools) {
  tools.forEach((tool) => {
    const logo = getToolLogo(tool);
    if (isImageLogo(logo)) {
      const img = new Image();
      img.src = logo;
    }
  });
}
