const { NativeEmbedder } = require("../../EmbeddingEngines/native");
const {
  handleDefaultStreamResponseV2,
} = require("../../helpers/chat/responses");
const {
  LLMPerformanceMonitor,
} = require("../../helpers/chat/LLMPerformanceMonitor");
const fs = require("fs");
const path = require("path");
const { safeJsonParse } = require("../../http");

const cacheFolder = path.resolve(
  process.env.STORAGE_DIR
    ? path.resolve(process.env.STORAGE_DIR, "models", "togetherAi")
    : path.resolve(__dirname, `../../../storage/models/togetherAi`)
);

async function togetherAiModels(apiKey = null) {
  const cacheModelPath = path.resolve(cacheFolder, "models.json");
  const cacheAtPath = path.resolve(cacheFolder, ".cached_at");

  // If cache exists and is less than 1 week old, use it
  if (fs.existsSync(cacheModelPath) && fs.existsSync(cacheAtPath)) {
    const now = Number(new Date());
    const timestampMs = Number(fs.readFileSync(cacheAtPath));
    if (now - timestampMs <= 6.048e8) {
      // 1 Week in MS
      return safeJsonParse(
        fs.readFileSync(cacheModelPath, { encoding: "utf-8" }),
        []
      );
    }
  }

  try {
    const { OpenAI: OpenAIApi } = require("openai");
    const openai = new OpenAIApi({
      baseURL: "https://api.together.xyz/v1",
      apiKey: apiKey || process.env.TOGETHER_AI_API_KEY || null,
    });

    const response = await openai.models.list();

    // Filter and transform models into the expected format
    // Only include chat models
    const validModels = response.body
      .filter((model) => ["chat"].includes(model.type))
      .map((model) => ({
        id: model.id,
        name: model.display_name || model.id,
        organization: model.organization || "Unknown",
        type: model.type,
        maxLength: model.context_length || 4096,
      }));

    // Cache the results
    if (!fs.existsSync(cacheFolder))
      fs.mkdirSync(cacheFolder, { recursive: true });
    fs.writeFileSync(cacheModelPath, JSON.stringify(validModels), {
      encoding: "utf-8",
    });
    fs.writeFileSync(cacheAtPath, String(Number(new Date())), {
      encoding: "utf-8",
    });

    return validModels;
  } catch (error) {
    console.error("Error fetching Together AI models:", error);
    // If cache exists but is stale, still use it as fallback
    if (fs.existsSync(cacheModelPath)) {
      return safeJsonParse(
        fs.readFileSync(cacheModelPath, { encoding: "utf-8" }),
        []
      );
    }
    return [];
  }
}

const {
  detectTaskType,
  getRecommendedModels,
  getAlternativeProviders,
  modelSupportsTask,
  getModelCapabilities
} = require("./modelCapabilities");

class TogetherAiLLM {
  constructor(embedder = null, modelPreference = null) {
    if (!process.env.TOGETHER_AI_API_KEY)
      throw new Error("No TogetherAI API key was set.");
    const { OpenAI: OpenAIApi } = require("openai");
    this.openai = new OpenAIApi({
      baseURL: "https://api.together.xyz/v1",
      apiKey: process.env.TOGETHER_AI_API_KEY ?? null,
    });
    this.model = modelPreference || process.env.TOGETHER_AI_MODEL_PREF;
    this.limits = {
      history: this.promptWindowLimit() * 0.15,
      system: this.promptWindowLimit() * 0.15,
      user: this.promptWindowLimit() * 0.7,
    };

    this.embedder = !embedder ? new NativeEmbedder() : embedder;
    this.defaultTemp = 0.7;
  }

  #appendContext(contextTexts = []) {
    if (!contextTexts || !contextTexts.length) return "";
    return (
      "\nContext:\n" +
      contextTexts
        .map((text, i) => {
          return `[CONTEXT ${i}]:\n${text}\n[END CONTEXT ${i}]\n\n`;
        })
        .join("")
    );
  }

  #generateContent({ userPrompt, attachments = [] }) {
    if (!attachments.length) {
      return userPrompt;
    }

    // Detect task type and check model capabilities
    const taskType = detectTaskType(userPrompt, attachments);
    const modelCapabilities = getModelCapabilities(this.model);
    
    // Check if current model supports the detected task
    if (taskType === 'vision' || attachments.some(att => att.mime?.includes('image'))) {
      // Together AI doesn't support vision, provide intelligent recommendations
      const alternatives = getAlternativeProviders('vision');
      const recommendationText = this.#generateRecommendation('vision', alternatives, attachments.length);
      return userPrompt + recommendationText;
    }
    
    // For non-vision attachments, just note them
    const attachmentTypes = [...new Set(attachments.map(a => a.mime?.split('/')[0] || 'file'))];
    const attachmentNote = `\n[Note: User uploaded ${attachments.length} ${attachmentTypes.join('/')}(s). Current model: ${this.model}]`;
    
    return userPrompt + attachmentNote;
  }
  
  #generateRecommendation(capability, alternatives, attachmentCount) {
    let recommendation = `\n\n⚠️ **Model Capability Notice**\n`;
    recommendation += `You uploaded ${attachmentCount} image(s), but the current model (${this.model}) doesn't support image analysis.\n\n`;
    
    if (alternatives && alternatives.length > 0) {
      recommendation += `**Recommended Vision-Capable Models:**\n`;
      alternatives.forEach(alt => {
        recommendation += `• **${alt.provider.toUpperCase()}**: ${alt.models.join(', ')} - ${alt.features}\n`;
      });
      recommendation += `\nPlease switch to one of these models in your workspace settings for image analysis.`;
    }
    
    // Also suggest best Together AI model for the text portion of the task
    const taskType = detectTaskType(this.model, []);
    const bestModels = getRecommendedModels(taskType, { maxCost: 3, preferFast: true });
    
    if (bestModels.length > 0) {
      recommendation += `\n\n**Best Together AI Models for Text Tasks:**\n`;
      bestModels.slice(0, 3).forEach(model => {
        recommendation += `• **${model.name}**: ${model.strengths.join(', ')} (Cost: ${'$'.repeat(model.costTier)})\n`;
      });
    }
    
    return recommendation;
  }

  async allModelInformation() {
    const models = await togetherAiModels();
    return models.reduce((acc, model) => {
      acc[model.id] = model;
      return acc;
    }, {});
  }

  streamingEnabled() {
    return "streamGetChatCompletion" in this;
  }

  static async promptWindowLimit(modelName) {
    const models = await togetherAiModels();
    const model = models.find((m) => m.id === modelName);
    return model?.maxLength || 4096;
  }

  async promptWindowLimit() {
    const models = await togetherAiModels();
    const model = models.find((m) => m.id === this.model);
    return model?.maxLength || 4096;
  }

  async isValidChatCompletionModel(model = "") {
    const models = await togetherAiModels();
    const foundModel = models.find((m) => m.id === model);
    return foundModel && foundModel.type === "chat";
  }

  constructPrompt({
    systemPrompt = "",
    contextTexts = [],
    chatHistory = [],
    userPrompt = "",
    attachments = [],
  }) {
    const prompt = {
      role: "system",
      content: `${systemPrompt}${this.#appendContext(contextTexts)}`,
    };
    return [
      prompt,
      ...chatHistory,
      {
        role: "user",
        content: this.#generateContent({ userPrompt, attachments }),
      },
    ];
  }

  async getChatCompletion(messages = null, { temperature = 0.7 }) {
    // Check if the last message might need a different model
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (typeof lastMessage.content === 'string') {
        const taskType = detectTaskType(lastMessage.content, []);
        const modelCapabilities = getModelCapabilities(this.model);
        
        // Log recommendation if model might not be optimal
        if (!modelSupportsTask(this.model, taskType)) {
          const recommended = getRecommendedModels(taskType, { maxCost: 3 });
          if (recommended.length > 0) {
            console.log(`[TogetherAI] Task type '${taskType}' detected. Consider using: ${recommended[0].name}`);
          }
        }
      }
    }
    
    if (!(await this.isValidChatCompletionModel(this.model)))
      throw new Error(
        `TogetherAI chat: ${this.model} is not valid for chat completion!`
      );

    const result = await LLMPerformanceMonitor.measureAsyncFunction(
      this.openai.chat.completions
        .create({
          model: this.model,
          messages,
          temperature,
        })
        .catch((e) => {
          throw new Error(e.message);
        })
    );

    if (
      !result.output.hasOwnProperty("choices") ||
      result.output.choices.length === 0
    )
      return null;

    return {
      textResponse: result.output.choices[0].message.content,
      metrics: {
        prompt_tokens: result.output.usage?.prompt_tokens || 0,
        completion_tokens: result.output.usage?.completion_tokens || 0,
        total_tokens: result.output.usage?.total_tokens || 0,
        outputTps: result.output.usage?.completion_tokens / result.duration,
        duration: result.duration,
      },
    };
  }

  async streamGetChatCompletion(messages = null, { temperature = 0.7 }) {
    if (!(await this.isValidChatCompletionModel(this.model)))
      throw new Error(
        `TogetherAI chat: ${this.model} is not valid for chat completion!`
      );

    const measuredStreamRequest = await LLMPerformanceMonitor.measureStream(
      this.openai.chat.completions.create({
        model: this.model,
        stream: true,
        messages,
        temperature,
      }),
      messages,
      false
    );
    return measuredStreamRequest;
  }

  handleStream(response, stream, responseProps) {
    return handleDefaultStreamResponseV2(response, stream, responseProps);
  }

  // Simple wrapper for dynamic embedder & normalize interface for all LLM implementations
  async embedTextInput(textInput) {
    return await this.embedder.embedTextInput(textInput);
  }
  async embedChunks(textChunks = []) {
    return await this.embedder.embedChunks(textChunks);
  }

  async compressMessages(promptArgs = {}, rawHistory = []) {
    const { messageArrayCompressor } = require("../../helpers/chat");
    const messageArray = this.constructPrompt(promptArgs);
    return await messageArrayCompressor(this, messageArray, rawHistory);
  }
}

module.exports = {
  TogetherAiLLM,
  togetherAiModels,
};
