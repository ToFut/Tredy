/**
 * A service that provides an AI client to create a completion.
 */

/**
 * @typedef {Object} LangChainModelConfig
 * @property {(string|null)} baseURL - Override the default base URL process.env for this provider
 * @property {(string|null)} apiKey - Override the default process.env for this provider
 * @property {(number|null)} temperature - Override the default temperature
 * @property {(string|null)} model -  Overrides model used for provider.
 */

const { ChatOpenAI } = require("@langchain/openai");
const { ChatAnthropic } = require("@langchain/anthropic");
const { ChatBedrockConverse } = require("@langchain/aws");
const { ChatOllama } = require("@langchain/community/chat_models/ollama");
const { toValidNumber } = require("../../../http");
const { getLLMProviderClass } = require("../../../helpers");
const { parseLMStudioBasePath } = require("../../../AiProviders/lmStudio");

const DEFAULT_WORKSPACE_PROMPT = `You are a helpful AI assistant who can assist the user and use tools available to help answer the users prompts and questions.

When handling requests with multiple similar actions (e.g., "send to both A and B"):
- Execute each action completely
- Continue until all requested actions are done
- Provide progress updates as you work
- Don't stop after just the first action

## Example:
Request: "Send invite to john@example.com with code A and jane@example.com with code B"
✅ CORRECT: 
1. THINK: Identify 2 invites needed
2. ACT: Send to john@example.com
3. OBSERVE: First invite sent
4. THINK: Still need to send to jane
5. ACT: Send to jane@example.com  
6. OBSERVE: Both invites sent
7. Complete

❌ WRONG: Send only to john and claim both were sent

🚨🚨🚨 CRITICAL TOOL SELECTION RULES - MUST FOLLOW: 🚨🚨🚨

**TOOL AVAILABILITY = CONNECTION STATUS:**
- If you have operational tools (gmail_send_email, gmail_read_inbox, calendar_get_events, etc.), THE SERVICE IS CONNECTED
- Connection tools (gmail_ws2-connect_gmail, manage_service_connection) are for internal use only - IGNORE THEM
- NEVER ask 'is your service connected?' - having operational tools means YES
- USE operational tools immediately when requested - no confirmation needed

**CONNECTION/INTEGRATION REQUESTS:**
When user asks to 'connect', 'integrate', 'link', 'add', or 'setup' ANY service:
- FIRST: Check if you have OPERATIONAL tools for that service (gmail_send_email, not gmail_ws2-connect_gmail)
- IF OPERATIONAL TOOLS EXIST: Service is already connected! Inform user and offer to use them
- IF NO OPERATIONAL TOOLS: Include the pattern [connect:provider-name] in your response to trigger OAuth buttons
- The pattern format is: [connect:provider-name] where provider-name matches the service identifier
- This pattern will be replaced with an interactive connection button in the UI
- NEVER use connection tools like gmail_ws2-connect_gmail, manage_service_connection, or any MCP connect_* tools
- NEVER use web-browsing or search for integration requests

**OPERATIONAL vs CONNECTION TOOLS:**
- OPERATIONAL TOOLS (use these): send_email, get_emails, calendar_get_events, linkedin_create_post, get_calendar_events
- CONNECTION TOOLS (ignore these): gmail_ws2-connect_gmail, manage_service_connection, any tool ending with "connect_*"
- Only operational tools indicate a service is connected and ready to use

**SPECIFIC SERVICE DETECTION:**
- Gmail connected = you have "send_email" and/or "get_emails" tools
- Calendar connected = you have "calendar_get_events" or similar calendar tools  
- LinkedIn connected = you have "linkedin_create_post" or similar LinkedIn tools
- IGNORE any tools with "connect" in the name when checking connection status

**CONNECTION PATTERN RULES:**
- Always use lowercase provider names
- For multi-word providers, use hyphens: google-calendar, google-drive, microsoft-teams
- Common patterns:
  • Email services: [connect:gmail], [connect:outlook], [connect:yahoo-mail]
  • Calendar: [connect:google-calendar], [connect:outlook-calendar]
  • Cloud storage: [connect:google-drive], [connect:dropbox], [connect:onedrive]
  • Communication: [connect:slack], [connect:discord], [connect:microsoft-teams]
  • Social: [connect:linkedin], [connect:twitter], [connect:facebook], [connect:instagram]
  • E-commerce: [connect:shopify], [connect:woocommerce], [connect:stripe]
  • CRM: [connect:salesforce], [connect:hubspot], [connect:pipedrive]
  • Project management: [connect:asana], [connect:trello], [connect:jira], [connect:notion]
  • Any other service: [connect:service-name]

**RESPONSE FORMAT FOR CONNECTIONS:**
When user requests a connection, your response should:
1. Acknowledge the request
2. Include the [connect:provider] pattern
3. Briefly explain what the connection enables

Example responses:
• IF GMAIL TOOL MISSING: 'Connect Gmail' → 'I'll help you connect Gmail for email access. Click below to authorize: [connect:gmail]'
• IF GMAIL TOOL EXISTS: 'Connect Gmail' → 'Gmail is already connected! I can read your emails, send messages, and manage your inbox. What would you like me to do?'
• IF CALENDAR TOOL MISSING: 'Link my calendar' → 'Let me connect your calendar for scheduling: [connect:google-calendar]'
• IF CALENDAR TOOL EXISTS: 'Link my calendar' → 'Your calendar is already connected! I can check your schedule, create events, and manage appointments. What do you need?'

**🚨 MANDATORY: USE execute_multi_step_task FOR ALL REQUESTS 🚨:**

**ALWAYS CHECK FIRST:** 
If you have execute_multi_step_task available, USE IT for ANY request that could involve tools!
Even simple requests like "send an email" should use execute_multi_step_task to ensure proper workflow execution.

**REQUIRED FOR:**
- ANY email sending (even single emails!)
- ANY calendar operations
- ANY multi-action request
- ANY request with "invite", "send", "check", "get", "create", "schedule"

**EXAMPLES - USE execute_multi_step_task FOR ALL:**
- "Send invite to segev@futuirxs.com" → execute_multi_step_task({user_request: "Send invite to segev@futuirxs.com"})  
- "Check my calendar" → execute_multi_step_task({user_request: "Check my calendar"})
- "Send email" → execute_multi_step_task({user_request: "Send email"})
- ANY request mentioning email/calendar/tasks → USE execute_multi_step_task

**DO NOT USE INDIVIDUAL TOOLS DIRECTLY!**
- ❌ NEVER call send_email, gmail_send_email directly
- ❌ NEVER call calendar tools directly
- ✅ ALWAYS use execute_multi_step_task which handles everything properly

**WHY:** Individual tools may fail or execute partially. execute_multi_step_task guarantees completion!

**OPERATIONAL REQUESTS:**
For MCP tools (gmail_*, linkedin_*, calendar_*, etc.):
- If you have execute_multi_step_task → USE IT INSTEAD OF DIRECT TOOLS
- Only use MCP tools directly if execute_multi_step_task is NOT available
- If tool is missing → Suggest connection with [connect:provider] pattern

**PRIORITY ORDER:**
1. For ANY action request → Use auto_workflow FIRST (this guarantees completion)
2. auto_workflow handles: emails, invites, calendar, multi-step tasks, EVERYTHING
3. For connection requests → Include [connect:provider] pattern in response  
4. NEVER call individual tools directly - always use auto_workflow

REMEMBER: Always use [connect:provider] patterns for OAuth connections to enable UI buttons!`;

class Provider {
  _client;
  constructor(client) {
    if (this.constructor == Provider) {
      return;
    }
    this._client = client;
  }

  providerLog(text, ...args) {
    console.log(
      `\x1b[36m[AgentLLM${this?.model ? ` - ${this.model}` : ""}]\x1b[0m ${text}`,
      ...args
    );
  }

  get client() {
    return this._client;
  }

  /**
   *
   * @param {string} provider - the string key of the provider LLM being loaded.
   * @param {LangChainModelConfig} config - Config to be used to override default connection object.
   * @returns
   */
  static LangChainChatModel(provider = "openai", config = {}) {
    switch (provider) {
      // Cloud models
      case "openai":
        return new ChatOpenAI({
          apiKey: process.env.OPEN_AI_KEY,
          ...config,
        });
      case "anthropic":
        return new ChatAnthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          ...config,
        });
      case "groq":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.groq.com/openai/v1",
          },
          apiKey: process.env.GROQ_API_KEY,
          ...config,
        });
      case "mistral":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.mistral.ai/v1",
          },
          apiKey: process.env.MISTRAL_API_KEY ?? null,
          ...config,
        });
      case "openrouter":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://openrouter.ai/api/v1",
            defaultHeaders: {
              "HTTP-Referer": "https://anythingllm.com",
              "X-Title": "AnythingLLM",
            },
          },
          apiKey: process.env.OPENROUTER_API_KEY ?? null,
          ...config,
        });
      case "perplexity":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.perplexity.ai",
          },
          apiKey: process.env.PERPLEXITY_API_KEY ?? null,
          ...config,
        });
      case "togetherai":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.together.xyz/v1",
          },
          apiKey: process.env.TOGETHER_AI_API_KEY ?? null,
          ...config,
        });
      case "generic-openai":
        return new ChatOpenAI({
          configuration: {
            baseURL: process.env.GENERIC_OPEN_AI_BASE_PATH,
          },
          apiKey: process.env.GENERIC_OPEN_AI_API_KEY,
          maxTokens: toValidNumber(
            process.env.GENERIC_OPEN_AI_MAX_TOKENS,
            1024
          ),
          ...config,
        });
      case "bedrock":
        // Grab just the credentials from the bedrock provider
        // using a closure to avoid circular dependency + to avoid instantiating the provider
        const credentials = (() => {
          const AWSBedrockProvider = require("./bedrock");
          const bedrockProvider = new AWSBedrockProvider();
          return bedrockProvider.credentials;
        })();

        return new ChatBedrockConverse({
          model: process.env.AWS_BEDROCK_LLM_MODEL_PREFERENCE,
          region: process.env.AWS_BEDROCK_LLM_REGION,
          credentials: credentials,
          ...config,
        });
      case "fireworksai":
        return new ChatOpenAI({
          apiKey: process.env.FIREWORKS_AI_LLM_API_KEY,
          ...config,
        });
      case "apipie":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://apipie.ai/v1",
          },
          apiKey: process.env.APIPIE_LLM_API_KEY ?? null,
          ...config,
        });
      case "deepseek":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.deepseek.com/v1",
          },
          apiKey: process.env.DEEPSEEK_API_KEY ?? null,
          ...config,
        });
      case "xai":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.x.ai/v1",
          },
          apiKey: process.env.XAI_LLM_API_KEY ?? null,
          ...config,
        });
      case "novita":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.novita.ai/v3/openai",
          },
          apiKey: process.env.NOVITA_LLM_API_KEY ?? null,
          ...config,
        });
      case "ppio":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.ppinfra.com/v3/openai",
          },
          apiKey: process.env.PPIO_API_KEY ?? null,
          ...config,
        });
      case "gemini":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
          },
          apiKey: process.env.GEMINI_API_KEY ?? null,
          ...config,
        });
      case "moonshotai":
        return new ChatOpenAI({
          configuration: {
            baseURL: "https://api.moonshot.ai/v1",
          },
          apiKey: process.env.MOONSHOT_AI_API_KEY ?? null,
          ...config,
        });
      // OSS Model Runners
      // case "anythingllm_ollama":
      //   return new ChatOllama({
      //     baseUrl: process.env.PLACEHOLDER,
      //     ...config,
      //   });
      case "ollama":
        return new ChatOllama({
          baseUrl: process.env.OLLAMA_BASE_PATH,
          ...config,
        });
      case "lmstudio":
        return new ChatOpenAI({
          configuration: {
            baseURL: parseLMStudioBasePath(process.env.LMSTUDIO_BASE_PATH),
          },
          apiKey: "not-used", // Needs to be specified or else will assume OpenAI
          ...config,
        });
      case "koboldcpp":
        return new ChatOpenAI({
          configuration: {
            baseURL: process.env.KOBOLD_CPP_BASE_PATH,
          },
          apiKey: "not-used",
          ...config,
        });
      case "localai":
        return new ChatOpenAI({
          configuration: {
            baseURL: process.env.LOCAL_AI_BASE_PATH,
          },
          apiKey: process.env.LOCAL_AI_API_KEY ?? "not-used",
          ...config,
        });
      case "textgenwebui":
        return new ChatOpenAI({
          configuration: {
            baseURL: process.env.TEXT_GEN_WEB_UI_BASE_PATH,
          },
          apiKey: process.env.TEXT_GEN_WEB_UI_API_KEY ?? "not-used",
          ...config,
        });
      case "litellm":
        return new ChatOpenAI({
          configuration: {
            baseURL: process.env.LITE_LLM_BASE_PATH,
          },
          apiKey: process.env.LITE_LLM_API_KEY ?? null,
          ...config,
        });
      case "nvidia-nim":
        return new ChatOpenAI({
          configuration: {
            baseURL: process.env.NVIDIA_NIM_LLM_BASE_PATH,
          },
          apiKey: null,
          ...config,
        });

      default:
        throw new Error(`Unsupported provider ${provider} for this task.`);
    }
  }

  /**
   * Get the context limit for a provider/model combination using static method in AIProvider class.
   * @param {string} provider
   * @param {string} modelName
   * @returns {number}
   */
  static contextLimit(provider = "openai", modelName) {
    const llm = getLLMProviderClass({ provider });
    if (!llm || !llm.hasOwnProperty("promptWindowLimit")) return 8_000;
    return llm.promptWindowLimit(modelName);
  }

  // For some providers we may want to override the system prompt to be more verbose.
  // Currently we only do this for lmstudio, but we probably will want to expand this even more
  // to any Untooled LLM.
  static systemPrompt(provider = null) {
    switch (provider) {
      case "lmstudio":
        return "You are a helpful ai assistant who can assist the user and use tools available to help answer the users prompts and questions. Tools will be handled by another assistant and you will simply receive their responses to help answer the user prompt - always try to answer the user's prompt the best you can with the context available to you and your general knowledge.";
      default:
        return DEFAULT_WORKSPACE_PROMPT;
    }
  }
}

module.exports = Provider;
