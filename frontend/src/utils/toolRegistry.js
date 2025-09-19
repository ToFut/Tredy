/**
 * Generic Tool Registry System
 * Dynamically manages tool icons, metadata, and display templates
 */

import {
  Lightning,
  Globe,
  Database,
  Code,
  FileText,
  Gear,
  Cloud,
  Lock,
  Chart,
  Camera,
  Microphone,
  Play,
  Download,
  Upload,
  Search,
  Calendar,
  Clock,
  User,
  Users,
  ChatCircle,
  EnvelopeSimple,
  Phone,
  MapPin,
  House,
  ShoppingCart,
  CreditCard,
  Wallet,
  Bank,
  Calculator,
  Cpu,
  HardDrive,
  WifiHigh,
  BluetoothLogo,
  Package,
  Truck,
  Airplane,
  Car,
  Train,
  Boat,
  Rocket,
  Heart,
  Heartbeat,
  FirstAid,
  Pill,
  Syringe,
  Brain,
  Eye,
  Ear,
  Hand,
  Fingerprint,
  Shield,
  Warning,
  Info,
  Question,
  CheckCircle,
  XCircle,
  PlusCircle,
  MinusCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowsClockwise,
  Sparkle,
  Star,
  Sun,
  Moon,
  CloudRain,
  Snowflake,
  Fire,
  Drop,
  Wind,
  Mountains,
  Tree,
  Leaf,
  Flower,
  Bug,
  PawPrint,
  Fish,
  Bird,
  Butterfly,
} from "@phosphor-icons/react";

// Tool Registry Class
class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.iconCache = new Map();
    this.defaultIcons = this.initializeDefaultIcons();
    this.colorSchemes = this.initializeColorSchemes();
    this.templates = new Map();

    // Initialize with some common tools
    this.registerDefaultTools();
  }

  /**
   * Initialize default icon mappings
   */
  initializeDefaultIcons() {
    return {
      // Communication
      email: EnvelopeSimple,
      gmail: EnvelopeSimple,
      mail: EnvelopeSimple,
      phone: Phone,
      call: Phone,
      chat: ChatCircle,
      message: ChatCircle,

      // Calendar & Time
      calendar: Calendar,
      schedule: Calendar,
      event: Calendar,
      time: Clock,
      clock: Clock,

      // Social
      linkedin: Globe, // Will be replaced with actual LinkedIn SVG
      twitter: Globe,
      facebook: Globe,
      instagram: Camera,
      youtube: Play,

      // Data & Storage
      database: Database,
      sql: Database,
      query: Search,
      storage: HardDrive,
      cloud: Cloud,
      backup: Cloud,

      // Development
      code: Code,
      script: Code,
      api: Globe,
      webhook: Lightning,
      function: Gear,
      debug: Bug,

      // Files
      file: FileText,
      document: FileText,
      pdf: FileText,
      image: Camera,
      video: Play,
      audio: Microphone,
      download: Download,
      upload: Upload,

      // Analytics
      analytics: Chart,
      chart: Chart,
      report: Chart,
      metrics: Chart,

      // Security
      auth: Lock,
      security: Shield,
      encrypt: Lock,
      decrypt: Lock,
      fingerprint: Fingerprint,

      // Finance
      payment: CreditCard,
      wallet: Wallet,
      bank: Bank,
      transaction: CreditCard,
      invoice: FileText,

      // Health
      health: Heart,
      medical: FirstAid,
      emergency: Heartbeat,
      prescription: Pill,

      // AI & ML
      ai: Brain,
      ml: Brain,
      neural: Brain,
      vision: Eye,
      speech: Microphone,
      nlp: ChatCircle,

      // Location
      location: MapPin,
      map: MapPin,
      gps: MapPin,
      address: House,

      // Transport
      shipping: Truck,
      delivery: Package,
      flight: Airplane,
      travel: Car,

      // Weather
      weather: CloudRain,
      temperature: Sun,
      forecast: Cloud,

      // Nature
      environment: Tree,
      eco: Leaf,
      green: Leaf,
      nature: Flower,

      // Default
      default: Lightning,
      tool: Gear,
      plugin: Package,
      extension: PlusCircle,
      integration: ArrowsClockwise,
      workflow: ArrowRight,
      automation: Sparkle,
    };
  }

  /**
   * Initialize color schemes for different tool categories
   */
  initializeColorSchemes() {
    return {
      communication: {
        primary: "#4285F4",
        secondary: "#E3F2FD",
        border: "#90CAF9",
        text: "#1976D2",
      },
      social: {
        primary: "#0077B5",
        secondary: "#E1F5FE",
        border: "#4FC3F7",
        text: "#0288D1",
      },
      data: {
        primary: "#6B7280",
        secondary: "#F3F4F6",
        border: "#D1D5DB",
        text: "#4B5563",
      },
      development: {
        primary: "#8B5CF6",
        secondary: "#F3E8FF",
        border: "#C084FC",
        text: "#7C3AED",
      },
      file: {
        primary: "#F59E0B",
        secondary: "#FEF3C7",
        border: "#FCD34D",
        text: "#D97706",
      },
      analytics: {
        primary: "#10B981",
        secondary: "#D1FAE5",
        border: "#6EE7B7",
        text: "#059669",
      },
      security: {
        primary: "#EF4444",
        secondary: "#FEE2E2",
        border: "#FCA5A5",
        text: "#DC2626",
      },
      finance: {
        primary: "#14B8A6",
        secondary: "#CCFBF1",
        border: "#5EEAD4",
        text: "#0D9488",
      },
      health: {
        primary: "#EC4899",
        secondary: "#FCE7F3",
        border: "#F9A8D4",
        text: "#DB2777",
      },
      ai: {
        primary: "#6366F1",
        secondary: "#EEF2FF",
        border: "#A5B4FC",
        text: "#4F46E5",
      },
      default: {
        primary: "#6B7280",
        secondary: "#F9FAFB",
        border: "#E5E7EB",
        text: "#374151",
      },
    };
  }

  /**
   * Register default tools that come with the system
   */
  registerDefaultTools() {
    // Gmail
    this.registerTool("gmail-send_email", {
      name: "Send Email",
      category: "communication",
      description: "Send emails via Gmail",
      icon: "email",
      provider: "Gmail",
    });

    // LinkedIn
    this.registerTool("linkedin-create_post", {
      name: "Create Post",
      category: "social",
      description: "Create a LinkedIn post",
      icon: "linkedin",
      provider: "LinkedIn",
    });

    // Calendar
    this.registerTool("calendar-create_event", {
      name: "Create Event",
      category: "communication",
      description: "Create a calendar event",
      icon: "calendar",
      provider: "Google Calendar",
    });
  }

  /**
   * Register a new tool with metadata
   * @param {string} toolId - Unique tool identifier
   * @param {Object} metadata - Tool metadata including name, icon, category, etc.
   */
  registerTool(toolId, metadata) {
    const tool = {
      id: toolId,
      name: metadata.name || toolId,
      category: metadata.category || "default",
      description: metadata.description || "",
      icon: metadata.icon || null,
      svgIcon: metadata.svgIcon || null,
      customIcon: metadata.customIcon || null,
      provider: metadata.provider || "Unknown",
      color: metadata.color || null,
      template: metadata.template || "default",
      capabilities: metadata.capabilities || [],
      params: metadata.params || {},
      ...metadata,
    };

    this.tools.set(toolId, tool);

    // Cache custom SVG if provided
    if (metadata.svgIcon) {
      this.iconCache.set(toolId, metadata.svgIcon);
    }

    return tool;
  }

  /**
   * Register multiple tools at once
   * @param {Array} tools - Array of tool definitions
   */
  registerTools(tools) {
    tools.forEach((tool) => {
      this.registerTool(tool.id || tool.name, tool);
    });
  }

  /**
   * Get tool metadata by ID
   * @param {string} toolId - Tool identifier
   */
  getTool(toolId) {
    return this.tools.get(toolId) || this.inferToolFromName(toolId);
  }

  /**
   * Infer tool metadata from name if not registered
   * @param {string} toolName - Tool name to infer from
   */
  inferToolFromName(toolName) {
    const lowerName = toolName.toLowerCase();

    // Try to match category based on keywords
    let category = "default";
    let icon = "default";

    // Check for category keywords
    if (lowerName.includes("email") || lowerName.includes("mail")) {
      category = "communication";
      icon = "email";
    } else if (lowerName.includes("calendar") || lowerName.includes("event")) {
      category = "communication";
      icon = "calendar";
    } else if (lowerName.includes("linkedin") || lowerName.includes("social")) {
      category = "social";
      icon = "linkedin";
    } else if (lowerName.includes("database") || lowerName.includes("sql")) {
      category = "data";
      icon = "database";
    } else if (lowerName.includes("code") || lowerName.includes("script")) {
      category = "development";
      icon = "code";
    } else if (lowerName.includes("file") || lowerName.includes("document")) {
      category = "file";
      icon = "file";
    } else if (lowerName.includes("api") || lowerName.includes("webhook")) {
      category = "development";
      icon = "api";
    }

    return {
      id: toolName,
      name: this.formatToolName(toolName),
      category,
      icon,
      inferred: true,
    };
  }

  /**
   * Format tool name for display
   * @param {string} name - Raw tool name
   */
  formatToolName(name) {
    return name
      .replace(/[-_]/g, " ")
      .replace(/([A-Z])/g, " $1")
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Get icon component for a tool
   * @param {string} toolId - Tool identifier
   */
  getIcon(toolId) {
    const tool = this.getTool(toolId);

    // Return custom SVG if available
    if (tool.svgIcon) {
      return () => <div dangerouslySetInnerHTML={{ __html: tool.svgIcon }} />;
    }

    // Return custom component if available
    if (tool.customIcon) {
      return tool.customIcon;
    }

    // Return icon by name
    const iconName = tool.icon || "default";
    return this.defaultIcons[iconName] || this.defaultIcons.default;
  }

  /**
   * Get color scheme for a tool
   * @param {string} toolId - Tool identifier
   */
  getColorScheme(toolId) {
    const tool = this.getTool(toolId);

    // Return custom color if specified
    if (tool.color) {
      return {
        primary: tool.color,
        secondary: tool.color + "10",
        border: tool.color + "40",
        text: tool.color,
      };
    }

    // Return category color scheme
    return this.colorSchemes[tool.category] || this.colorSchemes.default;
  }

  /**
   * Register a custom icon SVG
   * @param {string} toolId - Tool identifier
   * @param {string} svgString - SVG string
   */
  registerIcon(toolId, svgString) {
    this.iconCache.set(toolId, svgString);

    // Update tool if it exists
    if (this.tools.has(toolId)) {
      const tool = this.tools.get(toolId);
      tool.svgIcon = svgString;
    }
  }

  /**
   * Register a display template for a tool type
   * @param {string} templateName - Template name
   * @param {Function} templateComponent - React component for the template
   */
  registerTemplate(templateName, templateComponent) {
    this.templates.set(templateName, templateComponent);
  }

  /**
   * Get template component for a tool
   * @param {string} toolId - Tool identifier
   */
  getTemplate(toolId) {
    const tool = this.getTool(toolId);
    return this.templates.get(tool.template) || this.templates.get("default");
  }

  /**
   * Search tools by query
   * @param {string} query - Search query
   */
  searchTools(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values()).filter(
      (tool) =>
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.description.toLowerCase().includes(lowerQuery) ||
        tool.category.toLowerCase().includes(lowerQuery) ||
        tool.provider.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get all tools by category
   * @param {string} category - Category name
   */
  getToolsByCategory(category) {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.category === category
    );
  }

  /**
   * Get all registered categories
   */
  getCategories() {
    const categories = new Set();
    this.tools.forEach((tool) => categories.add(tool.category));
    return Array.from(categories);
  }

  /**
   * Export tool registry as JSON
   */
  export() {
    return {
      tools: Array.from(this.tools.entries()),
      icons: Array.from(this.iconCache.entries()),
      templates: Array.from(this.templates.keys()),
    };
  }

  /**
   * Import tool registry from JSON
   * @param {Object} data - Exported registry data
   */
  import(data) {
    if (data.tools) {
      data.tools.forEach(([id, tool]) => this.tools.set(id, tool));
    }
    if (data.icons) {
      data.icons.forEach(([id, svg]) => this.iconCache.set(id, svg));
    }
  }

  /**
   * Clear all registered tools
   */
  clear() {
    this.tools.clear();
    this.iconCache.clear();
    this.registerDefaultTools();
  }

  /**
   * Get statistics about registered tools
   */
  getStats() {
    const stats = {
      total: this.tools.size,
      byCategory: {},
      byProvider: {},
      withCustomIcons: 0,
    };

    this.tools.forEach((tool) => {
      // Count by category
      stats.byCategory[tool.category] =
        (stats.byCategory[tool.category] || 0) + 1;

      // Count by provider
      stats.byProvider[tool.provider] =
        (stats.byProvider[tool.provider] || 0) + 1;

      // Count custom icons
      if (tool.svgIcon || tool.customIcon) {
        stats.withCustomIcons++;
      }
    });

    return stats;
  }
}

// Create singleton instance
const toolRegistry = new ToolRegistry();

// Export for use in React components
export default toolRegistry;

// Export utility functions
export const registerTool = (id, metadata) =>
  toolRegistry.registerTool(id, metadata);
export const getTool = (id) => toolRegistry.getTool(id);
export const getIcon = (id) => toolRegistry.getIcon(id);
export const getColorScheme = (id) => toolRegistry.getColorScheme(id);
export const searchTools = (query) => toolRegistry.searchTools(query);
export const getToolsByCategory = (category) =>
  toolRegistry.getToolsByCategory(category);
