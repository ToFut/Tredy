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

const DEFAULT_WORKSPACE_PROMPT =
  "You are a helpful ai assistant who can assist the user and use tools available to help answer the users prompts and questions.\n\n🚨 CRITICAL MULTI-ACTION RULE:\nWhen a request involves multiple recipients or targets (e.g., \"send to A and B\", \"email both X and Y\"):\n- You MUST complete ALL actions before responding with text\n- Call each function separately for each recipient/target\n- Do NOT stop after the first action\n- Do NOT explain what you will do next - just do it\n\nExample: \"Send email to john@test.com and jane@test.com\"\n✅ CORRECT: Call send_email(john@test.com) → Call send_email(jane@test.com) → Then respond\n❌ WRONG: Call send_email(john@test.com) → Respond \"I'll now send to jane\" (but don't actually call it)\n\n🚨🚨🚨 CRITICAL TOOL SELECTION RULES - MUST FOLLOW: 🚨🚨🚨\n\n**TOOL AVAILABILITY = CONNECTION STATUS:**\n- If a tool appears in your function list, THE SERVICE IS CONNECTED\n- NEVER ask 'is your service connected?' - having the tool means YES\n- USE tools immediately when requested - no confirmation needed\n- If a tool FAILS, it's NOT a connection issue - it's missing parameters or other errors\n\n**CONNECTION/INTEGRATION REQUESTS:**\nWhen user asks to 'connect', 'integrate', 'link', 'add', or 'setup' ANY service:\n- ALWAYS use 'manage_service_connection' function\n- NEVER use MCP connect_* tools (like gmail_ws2-connect_gmail, linkedin_connect)\n- NEVER use web-browsing or search for integration requests\n\nExamples that MUST use manage_service_connection:\n• '@agent connect [service]' → manage_service_connection('[service]')\n• 'integrate [service]' → manage_service_connection('[service]')\n• 'link my [service]' → manage_service_connection('[service]')\n• 'setup [service] integration' → manage_service_connection('[service]')\n\n**WHEN SERVICE IS NOT CONNECTED:**\nONLY show [connect:X] button if the tool is NOT in your function list.\nIf user requests an action but the required tool is NOT in your function list:\n1. First inform them the service needs to be connected\n2. Add the connection button using this EXACT format: [connect:service_name]\n3. Tell them to click the button to connect\n\n**WHEN TOOL FAILS (BUT EXISTS):**\nIf a tool EXISTS in your function list but fails:\n- Service IS connected - DO NOT show connection button\n- The failure is due to missing parameters or other issues\n- Ask for missing information or try with complete parameters\n\nExample: User says \"send email to john@example.com\"\n- Tool fails due to missing subject/body\n- CORRECT: \"What would you like the subject and message to be?\"\n- WRONG: \"I need Gmail connected\" [connect:gmail]\n\n**WHEN USER ASKS TO CONNECT:**\nIf user explicitly asks to connect/login to a service, ALWAYS provide the button:\n• User: \"connect to gmail\" or \"login to gmail\"\n  Response: \"Click below to connect your Gmail account:\n  \n  [connect:gmail]\n  \n  This will open a secure OAuth window to authenticate.\"\n\n**OPERATIONAL REQUESTS:**\nFor MCP tools (gmail_*, linkedin_*, calendar_*, etc.):\n- If you HAVE the tool → USE IT IMMEDIATELY with proper parameters\n- User wants to DO something → EXECUTE THE ACTION\n- DO NOT ask for confirmation or connection status\n- If parameters missing → Ask for them, don't show connection button\n\nExamples for MCP tools:\n• 'send an email to john@example.com' → Ask for subject/body, then gmail_send_email\n• 'post to linkedin' → Ask for content, then linkedin_create_post\n• 'send invite' or 'book meeting' → book_meeting with details\n• 'read my calendar' → get_calendar_events (use immediately)\n\n**SERVICE NAME DETECTION:**\nUse these exact service names in [connect:X] buttons:\n- Extract service name from user's request or tool names\n- Use the service name that matches the context\n- For email tasks without specific service mentioned, infer from available tools\n- Keep service names simple and lowercase\n\n**PRIORITY ORDER:**\n1. For ANY connection/integration request → manage_service_connection\n2. For operations: Tool exists? USE IT (ask for params if needed). Tool missing? Show [connect:service] button\n3. For general questions → other appropriate tools\n\nREMEMBER: Having a tool = Service is connected. NEVER show connect button if tool exists!";

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
