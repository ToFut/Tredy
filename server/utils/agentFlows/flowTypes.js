const FLOW_TYPES = {
  START: {
    type: "start",
    description: "Initialize flow variables",
    parameters: {
      variables: {
        type: "array",
        description: "List of variables to initialize",
      },
    },
  },
  API_CALL: {
    type: "apiCall",
    description: "Make an HTTP request to an API endpoint",
    parameters: {
      url: { type: "string", description: "The URL to make the request to" },
      method: { type: "string", description: "HTTP method (GET, POST, etc.)" },
      headers: {
        type: "array",
        description: "Request headers as key-value pairs",
      },
      bodyType: {
        type: "string",
        description: "Type of request body (json, form)",
      },
      body: {
        type: "string",
        description:
          "Request body content. If body type is json, always return a valid json object. If body type is form, always return a valid form data object.",
      },
      formData: { type: "array", description: "Form data as key-value pairs" },
      responseVariable: {
        type: "string",
        description: "Variable to store the response",
      },
      directOutput: {
        type: "boolean",
        description:
          "Whether to return the response directly to the user without LLM processing",
      },
    },
    examples: [
      {
        url: "https://api.example.com/data",
        method: "GET",
        headers: [{ key: "Authorization", value: "Bearer 1234567890" }],
      },
    ],
  },
  LLM_INSTRUCTION: {
    type: "llmInstruction",
    description: "Process data using LLM instructions",
    parameters: {
      instruction: {
        type: "string",
        description: "The instruction for the LLM to follow",
      },
      resultVariable: {
        type: "string",
        description: "Variable to store the processed result",
      },
    },
  },
  WEB_SCRAPING: {
    type: "webScraping",
    description: "Scrape content from a webpage",
    parameters: {
      url: {
        type: "string",
        description: "The URL of the webpage to scrape",
      },
      resultVariable: {
        type: "string",
        description: "Variable to store the scraped content",
      },
      directOutput: {
        type: "boolean",
        description:
          "Whether to return the scraped content directly to the user without LLM processing",
      },
    },
  },
  TOOL_CALL: {
    type: "toolCall",
    description: "Execute MCP/Agent tools and functions",
    parameters: {
      toolName: {
        type: "string",
        description:
          "The name of the tool/function to call (e.g., gmail_ws4-get_emails)",
      },
      parameters: {
        type: "object",
        description: "Parameters to pass to the tool as key-value pairs",
      },
      resultVariable: {
        type: "string",
        description: "Variable to store the tool result",
      },
      directOutput: {
        type: "boolean",
        description:
          "Whether to return the tool result directly without LLM processing",
      },
    },
    examples: [
      {
        toolName: "gmail_ws4-get_emails",
        parameters: { limit: 10, unread: true },
        resultVariable: "emails",
        directOutput: false,
      },
      {
        toolName: "gmail_ws4-send_email",
        parameters: {
          to: "user@example.com",
          subject: "Report",
          body: "Email content",
        },
        resultVariable: "sent_email",
        directOutput: true,
      },
    ],
  },
};

module.exports.FLOW_TYPES = FLOW_TYPES;
