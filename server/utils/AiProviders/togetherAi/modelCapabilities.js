/**
 * Together AI Model Capabilities and Recommendations
 * This module provides intelligent model selection based on task requirements
 */

const MODEL_CAPABILITIES = {
  // Vision Models (Together AI currently doesn't have vision models, but structure ready for future)
  vision: [],
  
  // Code Generation Models
  code: [
    {
      id: "deepseek-ai/DeepSeek-Coder-V2-Instruct",
      name: "DeepSeek Coder V2",
      strengths: ["code generation", "debugging", "code review", "multi-language"],
      costTier: 1, // 1=cheapest, 5=most expensive
      performance: 5,
      contextLength: 128000
    },
    {
      id: "Qwen/Qwen2.5-Coder-32B-Instruct",
      name: "Qwen 2.5 Coder 32B",
      strengths: ["code generation", "python", "javascript", "sql"],
      costTier: 2,
      performance: 4,
      contextLength: 32768
    },
    {
      id: "codellama/CodeLlama-70b-Instruct-hf",
      name: "CodeLlama 70B",
      strengths: ["code generation", "code completion", "refactoring"],
      costTier: 3,
      performance: 4,
      contextLength: 4096
    }
  ],
  
  // Reasoning & Analysis Models
  reasoning: [
    {
      id: "deepseek-ai/DeepSeek-R1",
      name: "DeepSeek R1",
      strengths: ["complex reasoning", "math", "logic", "step-by-step analysis"],
      costTier: 3,
      performance: 5,
      contextLength: 64000
    },
    {
      id: "Qwen/QwQ-32B-Preview",
      name: "QwQ 32B Preview",
      strengths: ["reasoning", "problem solving", "analysis"],
      costTier: 2,
      performance: 4,
      contextLength: 32768
    }
  ],
  
  // General Chat Models
  general: [
    {
      id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      name: "Llama 3.1 70B Turbo",
      strengths: ["general chat", "instruction following", "creative writing"],
      costTier: 2,
      performance: 4,
      contextLength: 131072
    },
    {
      id: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      name: "Llama 3.1 405B Turbo",
      strengths: ["complex tasks", "nuanced understanding", "professional writing"],
      costTier: 4,
      performance: 5,
      contextLength: 131072
    },
    {
      id: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      name: "Mixtral 8x7B",
      strengths: ["multilingual", "general chat", "efficiency"],
      costTier: 1,
      performance: 3,
      contextLength: 32768
    },
    {
      id: "mistralai/Mixtral-8x22B-Instruct-v0.1",
      name: "Mixtral 8x22B",
      strengths: ["advanced reasoning", "multilingual", "technical content"],
      costTier: 3,
      performance: 4,
      contextLength: 65536
    }
  ],
  
  // Creative & Writing Models
  creative: [
    {
      id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      name: "Llama 3.3 70B Turbo",
      strengths: ["creative writing", "storytelling", "content generation"],
      costTier: 2,
      performance: 4,
      contextLength: 131072
    },
    {
      id: "mistralai/Mistral-7B-Instruct-v0.3",
      name: "Mistral 7B v0.3",
      strengths: ["efficient", "creative tasks", "fast response"],
      costTier: 1,
      performance: 3,
      contextLength: 32768
    }
  ],
  
  // Math & Science Models
  math: [
    {
      id: "deepseek-ai/DeepSeek-R1",
      name: "DeepSeek R1",
      strengths: ["mathematics", "physics", "scientific reasoning"],
      costTier: 3,
      performance: 5,
      contextLength: 64000
    },
    {
      id: "Qwen/Qwen2.5-Math-72B-Instruct",
      name: "Qwen 2.5 Math 72B",
      strengths: ["mathematics", "problem solving", "proofs"],
      costTier: 3,
      performance: 5,
      contextLength: 4096
    }
  ]
};

/**
 * Detect task type from user input and attachments
 */
function detectTaskType(userPrompt, attachments = []) {
  const prompt = userPrompt.toLowerCase();
  
  // Check for image attachments
  if (attachments.some(att => att.mime?.includes('image'))) {
    return 'vision';
  }
  
  // Code-related keywords
  const codeKeywords = ['code', 'function', 'debug', 'error', 'implement', 'algorithm', 'program', 'script', 'api', 'class', 'method', 'variable', 'syntax', 'compile'];
  if (codeKeywords.some(keyword => prompt.includes(keyword))) {
    return 'code';
  }
  
  // Math/Science keywords
  const mathKeywords = ['calculate', 'solve', 'equation', 'formula', 'math', 'integral', 'derivative', 'proof', 'theorem', 'physics', 'chemistry'];
  if (mathKeywords.some(keyword => prompt.includes(keyword))) {
    return 'math';
  }
  
  // Reasoning keywords
  const reasoningKeywords = ['analyze', 'reason', 'logic', 'explain why', 'think through', 'step by step', 'problem solving', 'decision'];
  if (reasoningKeywords.some(keyword => prompt.includes(keyword))) {
    return 'reasoning';
  }
  
  // Creative keywords
  const creativeKeywords = ['write', 'story', 'creative', 'poem', 'fiction', 'narrative', 'describe', 'imagine', 'fantasy'];
  if (creativeKeywords.some(keyword => prompt.includes(keyword))) {
    return 'creative';
  }
  
  return 'general';
}

/**
 * Get recommended models based on task type and requirements
 */
function getRecommendedModels(taskType, options = {}) {
  const {
    maxCost = 5,
    minPerformance = 3,
    requireLongContext = false,
    preferFast = false
  } = options;
  
  let candidates = MODEL_CAPABILITIES[taskType] || MODEL_CAPABILITIES.general;
  
  // Filter by cost and performance requirements
  candidates = candidates.filter(model => 
    model.costTier <= maxCost && 
    model.performance >= minPerformance
  );
  
  // Filter by context length if needed
  if (requireLongContext) {
    candidates = candidates.filter(model => model.contextLength >= 32768);
  }
  
  // Sort by cost-effectiveness (performance/cost ratio)
  candidates.sort((a, b) => {
    const ratioA = a.performance / a.costTier;
    const ratioB = b.performance / b.costTier;
    
    if (preferFast) {
      // Prefer cheaper, faster models
      return a.costTier - b.costTier;
    }
    
    // Default: best performance per cost
    return ratioB - ratioA;
  });
  
  return candidates;
}

/**
 * Get alternative providers for unsupported capabilities
 */
function getAlternativeProviders(capability) {
  const alternatives = {
    vision: [
      { provider: 'openai', models: ['gpt-4o', 'gpt-4o-mini'], features: 'Best vision understanding' },
      { provider: 'anthropic', models: ['claude-3-5-sonnet', 'claude-3-5-haiku'], features: 'Excellent visual analysis' },
      { provider: 'google', models: ['gemini-1.5-pro', 'gemini-1.5-flash'], features: 'Strong multimodal support' },
      { provider: 'groq', models: ['llama-3.2-90b-vision', 'llama-3.2-11b-vision'], features: 'Fast vision processing' }
    ],
    audio: [
      { provider: 'openai', models: ['whisper', 'tts-1'], features: 'Speech-to-text and text-to-speech' }
    ],
    realtime: [
      { provider: 'openai', models: ['gpt-4o-realtime'], features: 'Real-time voice conversations' }
    ]
  };
  
  return alternatives[capability] || [];
}

/**
 * Check if current model supports the task
 */
function modelSupportsTask(modelId, taskType) {
  const taskModels = MODEL_CAPABILITIES[taskType] || [];
  return taskModels.some(model => model.id === modelId);
}

/**
 * Get model capabilities
 */
function getModelCapabilities(modelId) {
  for (const [taskType, models] of Object.entries(MODEL_CAPABILITIES)) {
    const model = models.find(m => m.id === modelId);
    if (model) {
      return {
        taskType,
        ...model,
        supportsVision: false,
        supportsAudio: false,
        supportsFunctionCalling: true // Together AI supports function calling
      };
    }
  }
  
  // Unknown model - return basic capabilities
  return {
    taskType: 'general',
    supportsVision: false,
    supportsAudio: false,
    supportsFunctionCalling: true,
    strengths: ['general tasks']
  };
}

module.exports = {
  MODEL_CAPABILITIES,
  detectTaskType,
  getRecommendedModels,
  getAlternativeProviders,
  modelSupportsTask,
  getModelCapabilities
};