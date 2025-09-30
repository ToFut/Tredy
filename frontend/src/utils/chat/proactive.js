// Proactive system for detecting integration needs and enhancing responses

// Provider detection patterns
const PROVIDER_KEYWORDS = {
  gmail: [
    "gmail",
    "google mail",
    "email",
    "send email",
    "check email",
    "inbox",
  ],
  "google-calendar": [
    "calendar",
    "google calendar",
    "schedule",
    "meeting",
    "appointment",
    "events",
  ],
  "google-drive": ["drive", "google drive", "document", "file", "sheet", "doc"],
  slack: ["slack", "message", "channel", "team communication"],
  outlook: ["outlook", "microsoft email", "office 365"],
  github: ["github", "repository", "code", "commit", "pull request"],
  dropbox: ["dropbox", "file storage", "cloud storage"],
  linkedin: ["linkedin", "professional network", "job", "career"],
};

// Connection status keywords
const CONNECTION_KEYWORDS = [
  "connect",
  "link",
  "integrate",
  "setup",
  "configure",
  "authorize",
  "oauth",
  "login",
  "authentication",
  "access",
  "permission",
];

/**
 * Detects if user message indicates need for a specific provider connection
 * @param {string} userMessage - The user's message
 * @returns {string[]} - Array of detected providers
 */
export function detectRequiredProviders(userMessage) {
  const message = userMessage.toLowerCase();
  const detectedProviders = [];

  Object.entries(PROVIDER_KEYWORDS).forEach(([provider, keywords]) => {
    const hasProviderKeyword = keywords.some((keyword) =>
      message.includes(keyword.toLowerCase())
    );

    if (hasProviderKeyword) {
      detectedProviders.push(provider);
    }
  });

  return detectedProviders;
}

/**
 * Checks if user message indicates they want to connect/integrate something
 * @param {string} userMessage - The user's message
 * @returns {boolean}
 */
export function isConnectionRequest(userMessage) {
  const message = userMessage.toLowerCase();
  return CONNECTION_KEYWORDS.some((keyword) =>
    message.includes(keyword.toLowerCase())
  );
}

/**
 * Enhances system prompt with proactive connection guidance
 * @param {string} userMessage - The user's message
 * @param {string} workspaceSlug - Current workspace slug
 * @returns {string} - Enhanced system prompt addition
 */
export function generateProactiveSystemPrompt(userMessage, workspaceSlug) {
  const requiredProviders = detectRequiredProviders(userMessage);
  const isConnectionReq = isConnectionRequest(userMessage);

  if (requiredProviders.length === 0 && !isConnectionReq) {
    return "";
  }

  let proactivePrompt = `

## PROACTIVE INTEGRATION GUIDANCE
The user's request may benefit from third-party integrations. Consider the following:

`;

  if (requiredProviders.length > 0) {
    proactivePrompt += `### Detected Integration Needs:
`;
    requiredProviders.forEach((provider) => {
      const providerName = provider
        .replace("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
      proactivePrompt += `- ${providerName}: Consider if the user needs to connect this service\n`;
    });

    proactivePrompt += `
### Connection Guidance:
- If the user needs to connect any of these services, include a connection button in your response
- Use the format [connect:provider-name] to generate interactive connection buttons
- Example: [connect:gmail] or [connect:google-calendar]
- Guide users through the OAuth flow with clear instructions
- Explain the benefits of connecting each service

`;
  }

  if (isConnectionReq) {
    proactivePrompt += `### Connection Request Detected:
The user appears to be asking about connecting or integrating a service. You should:
1. Identify which specific service they want to connect
2. Provide clear guidance on the integration process
3. Include interactive connection buttons using [connect:provider-name] format
4. Explain what capabilities will be unlocked after connection
5. Address any security or privacy concerns proactively

`;
  }

  proactivePrompt += `### Available Integration Patterns:
- [connect:gmail] - Gmail integration for email management
- [connect:google-calendar] - Google Calendar for scheduling
- [connect:google-drive] - Google Drive for document access
- [connect:slack] - Slack for team communication
- [connect:outlook] - Microsoft Outlook integration
- [connect:github] - GitHub for code repository access
- [connect:dropbox] - Dropbox for file storage
- [connect:linkedin] - LinkedIn for professional networking

Remember: Only suggest connections that are actually relevant to the user's request. Don't overwhelm them with unnecessary integration suggestions.
`;

  return proactivePrompt;
}

/**
 * Generates contextual connection suggestions based on user intent
 * @param {string} userMessage - The user's message
 * @param {string[]} connectedProviders - Already connected providers
 * @returns {Object} - Suggestion object with provider and reason
 */
export function generateConnectionSuggestions(
  userMessage,
  connectedProviders = []
) {
  const requiredProviders = detectRequiredProviders(userMessage);
  const suggestions = [];

  requiredProviders.forEach((provider) => {
    if (!connectedProviders.includes(provider)) {
      let reason = "";
      const providerName = provider
        .replace("-", " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      switch (provider) {
        case "gmail":
          reason =
            "to send, read, and manage your emails directly from the chat";
          break;
        case "google-calendar":
          reason =
            "to schedule meetings, check availability, and manage events";
          break;
        case "google-drive":
          reason = "to access, create, and manage your documents and files";
          break;
        case "slack":
          reason = "to send messages and interact with your team channels";
          break;
        case "outlook":
          reason = "to manage your Microsoft email and calendar";
          break;
        case "github":
          reason = "to access repositories, create issues, and manage code";
          break;
        default:
          reason = "to enable enhanced functionality for your requests";
      }

      suggestions.push({
        provider,
        providerName,
        reason,
        priority: requiredProviders.length === 1 ? "high" : "medium",
      });
    }
  });

  return suggestions;
}
