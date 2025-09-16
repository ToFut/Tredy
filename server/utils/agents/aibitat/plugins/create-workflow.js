/**
 * Simple Create Workflow Plugin
 * Minimal implementation to test visual workflow building
 */

const { v4: uuidv4 } = require("uuid");
const { AgentFlows } = require("../../../agentFlows");

const createWorkflow = {
  name: "create-workflow",
  startupConfig: {
    params: {},
  },
  plugin: function (agent) {
    return {
      name: "create-workflow", // This name will be visible to UnTooled
      setup(aibitat) {
        console.log("🔧 [CreateWorkflow] Setting up create-workflow plugin");
        
        // Register with the PLUGIN NAME, not a custom function name
        aibitat.function({
          name: "create-workflow", // MUST match plugin name for UnTooled
          description: "Creates automated workflows from natural language. Use when user wants to create a workflow or describes multiple steps.",
          examples: [
            {
              prompt: "create a workflow to fetch weather and send email",
              call: JSON.stringify({ description: "fetch weather and send email" })
            }
          ],
          parameters: {
            type: "object",
            properties: {
              description: {
                type: "string",
                description: "Natural language description of the workflow"
              }
            },
            required: ["description"]
          },
          handler: async function ({ description }) {
            try {
              console.log("🎉 [CreateWorkflow] Handler called with:", description);
              
              const workflowName = `Workflow ${Date.now()}`;
              const workflowUuid = uuidv4();
              
              // Parse description into logical workflow steps using AI
              async function parseIntoSteps(desc, availableTools = [], aibitat) {
                console.log('🚀 [CreateWorkflow] === PARSING WORKFLOW ===');
                console.log('🚀 [CreateWorkflow] Input description:', desc);
                console.log('🚀 [CreateWorkflow] Available tools count:', availableTools.length);
                console.log('🚀 [CreateWorkflow] Available tools:', availableTools.slice(0, 10));
                
                // Try intelligent decomposition first for complex tasks
                let actions = [];
                
                // Always try intelligent decomposition first for any multi-action task
                const hasMultipleActions = desc.length > 50 || 
                                          desc.includes('then') || 
                                          desc.includes('and') ||
                                          desc.includes('summary') || 
                                          desc.includes('send') ||
                                          desc.includes('check') ||
                                          desc.includes('identify');
                
                // Debug: Log aibitat structure
                console.log('🔍 [CreateWorkflow] Debugging aibitat structure:');
                console.log('🔍 [CreateWorkflow] aibitat keys:', aibitat ? Object.keys(aibitat) : 'null');
                console.log('🔍 [CreateWorkflow] aibitat.provider value:', aibitat?.provider);
                console.log('🔍 [CreateWorkflow] aibitat.provider type:', typeof aibitat?.provider);
                console.log('🔍 [CreateWorkflow] aibitat.defaultProvider:', aibitat?.defaultProvider);
                console.log('🔍 [CreateWorkflow] aibitat.defaultProvider type:', typeof aibitat?.defaultProvider);
                console.log('🔍 [CreateWorkflow] aibitat.defaultProvider keys:', aibitat?.defaultProvider ? Object.keys(aibitat.defaultProvider) : 'null');
                console.log('🔍 [CreateWorkflow] aibitat.defaultProvider.complete:', typeof aibitat?.defaultProvider?.complete);
                console.log('🔍 [CreateWorkflow] aibitat.getChatCompletion:', !!aibitat?.getChatCompletion);
                console.log('🔍 [CreateWorkflow] aibitat.completion:', !!aibitat?.completion);
                console.log('🔍 [CreateWorkflow] aibitat.llm:', !!aibitat?.llm);
                
                // Check if provider has complete method like other plugins use
                let providerHasComplete = false;
                try {
                  // Debug the provider structure more deeply
                  console.log('🔍 [CreateWorkflow] aibitat.provider type:', typeof aibitat.provider);
                  console.log('🔍 [CreateWorkflow] aibitat.provider isArray:', Array.isArray(aibitat.provider));
                  if (aibitat.provider && typeof aibitat.provider === 'object') {
                    console.log('🔍 [CreateWorkflow] aibitat.provider[0]:', aibitat.provider[0] ? Object.keys(aibitat.provider[0]) : 'null');
                    console.log('🔍 [CreateWorkflow] aibitat.provider[0].complete:', typeof aibitat.provider[0]?.complete);
                    console.log('🔍 [CreateWorkflow] aibitat.provider.complete again:', typeof aibitat.provider.complete);
                  }
                  
                  // Test if provider.complete exists despite being array
                  const canUseProviderComplete = aibitat.provider && typeof aibitat.provider.complete === 'function';
                  console.log('🔍 [CreateWorkflow] Can use provider.complete:', canUseProviderComplete);
                  
                  // Test accessing first element if it's an array
                  const firstProviderComplete = aibitat.provider && aibitat.provider[0] && typeof aibitat.provider[0].complete === 'function';
                  console.log('🔍 [CreateWorkflow] First provider has complete:', firstProviderComplete);
                  
                  providerHasComplete = canUseProviderComplete || firstProviderComplete;
                  
                  // Test if we can access it the same way simple-workflow does
                  try {
                    console.log('🔍 [CreateWorkflow] Testing provider access like simple-workflow...');
                    const testCall = aibitat.provider?.complete;
                    console.log('🔍 [CreateWorkflow] aibitat.provider?.complete:', typeof testCall);
                  } catch (testError) {
                    console.log('🔍 [CreateWorkflow] Provider test call failed:', testError.message);
                  }
                } catch (e) {
                  console.log('🔍 [CreateWorkflow] Provider complete test failed:', e.message);
                }
                
                // Check if we have any way to call the LLM using official method
                const hasLLMAccess = aibitat && (
                  aibitat.getChatCompletion || 
                  aibitat.completion || 
                  aibitat.llm?.chat ||
                  // Use the official getProviderForConfig method like agent flows do
                  (aibitat.getProviderForConfig && aibitat.defaultProvider)
                );
                
                console.log('🔍 [CreateWorkflow] hasLLMAccess final result:', hasLLMAccess);
                
                if (hasMultipleActions && hasLLMAccess) {
                  console.log('🤖 [CreateWorkflow] Multi-action task detected, using AI decomposition');
                  console.log('🤖 [CreateWorkflow] aibitat available:', !!aibitat);
                  console.log('🤖 [CreateWorkflow] LLM access available:', hasLLMAccess);
                  
                  try {
                    actions = await intelligentDecomposition(desc, availableTools, aibitat);
                    console.log(`🤖 [CreateWorkflow] AI decomposition returned ${actions.length} actions`);
                  } catch (error) {
                    console.log('⚠️ [CreateWorkflow] AI decomposition failed:', error.message);
                  }
                } else {
                  console.log('📝 [CreateWorkflow] Simple task or AI not available');
                  console.log('📝 [CreateWorkflow] hasMultipleActions:', hasMultipleActions);
                  console.log('📝 [CreateWorkflow] aibitat:', !!aibitat);
                  console.log('📝 [CreateWorkflow] aibitat.llm:', !!aibitat?.llm);
                }
                
                // Fallback to simple pattern extraction if AI fails or not available
                if (actions.length === 0) {
                  console.log('📝 [CreateWorkflow] Using pattern extraction');
                  actions = extractSimpleActions(desc);
                }
                
                if (actions.length === 0) {
                  console.log('⚠️ [CreateWorkflow] No actions found, using fallback');
                  actions = fallbackExtraction(desc);
                }
                
                console.log('🚀 [CreateWorkflow] Extracted actions count:', actions.length);
                console.log('🚀 [CreateWorkflow] Extracted actions:', JSON.stringify(actions, null, 2));
                
                if (actions.length === 0) {
                  // Fallback to single LLM instruction if no specific actions found
                  return createFallbackSteps(desc, availableTools);
                }
                
              // Convert web scraping actions to Puppeteer workflows for better reliability
              const processedActions = actions.map((action, index) => {
                if (action.type === 'web' && action.action?.includes('scrape')) {
                  // Convert single web scraping action to multi-step Puppeteer workflow
                  return convertWebScrapingToPuppeteerWorkflow(action, index);
                }
                return action;
              }).flat(); // Flatten in case we created multiple actions
              
              console.log('🚀 [CreateWorkflow] Processed actions count:', processedActions.length);
              
              // Create TOOL_CALL steps for each action
              const steps = processedActions.map((action, index) => {
                  // Check if AI already provided a specific tool
                  let bestTool = action.tool;
                  
                  // If no tool from AI or tool not available, try to find one
                  if (!bestTool || !availableTools.includes(bestTool)) {
                    bestTool = findBestTool(action, availableTools);
                  }
                  
                  console.log(`🎯 [CreateWorkflow] Action ${index + 1}:`, action.type, 'target:', action.target, '| Tool:', bestTool);
                  
                  if (bestTool) {
                    // Use AI-provided parameters if available, otherwise extract them
                    let params = (action.parameters && Object.keys(action.parameters).length > 0) 
                                  ? action.parameters 
                                  : extractParameters(action);
                    
                    // Normalize variable references to use correct step variable names
                    params = normalizeVariableReferences(params, index, actions);
                    
                    // Validate and clean parameters for the specific tool
                    params = validateToolParameters(bestTool, params);
                    
                    // Use AI-provided resultVariable if available
                    const resultVar = action.resultVariable || `step_${index + 1}_result`;
                    
                    console.log(`✅ [CreateWorkflow] Creating TOOL_CALL for ${bestTool} with normalized params:`, params);
                    console.log(`✅ [CreateWorkflow] Result will be saved to: ${resultVar}`);
                    
                    return {
                      type: 'toolCall',
                      config: {
                        toolName: bestTool,
                        parameters: params,
                        resultVariable: resultVar,
                        directOutput: false  // Allow workflow to continue to next steps
                      }
                    };
                  } else if (action.type === 'process' || action.action?.includes('summarize') || action.action?.includes('chart')) {
                    // For processing/summarization tasks, use LLM instruction
                    console.log(`📊 [CreateWorkflow] Creating LLM instruction for processing:`, action.text || action.action);
                    
                    // Use AI-provided instruction if available in parameters, otherwise build one
                    let instruction;
                    if (action.parameters && action.parameters.instruction) {
                      instruction = action.parameters.instruction;
                    } else {
                      // Build instruction with reference to required steps from AI analysis
                      instruction = action.text || action.action || 'Process data';
                      if (action.requires && action.requires.length > 0) {
                        const requiredVars = action.requires.map(stepNum => `{{step_${stepNum}_result}}`);
                        instruction += `\n\nUse the data from: ${requiredVars.join(', ')}`;
                      }
                    }
                    
                    const resultVar = action.resultVariable || `step_${index + 1}_result`;
                    console.log(`📊 [CreateWorkflow] LLM instruction will save to: ${resultVar}`);
                    
                    return {
                      type: 'llmInstruction',
                      config: {
                        instruction: instruction,
                        resultVariable: resultVar,
                        directOutput: false
                      }
                    };
                  } else {
                    console.log(`⚠️ [CreateWorkflow] No tool found, creating LLM instruction for:`, action.text || action.action);
                    // Fallback to LLM instruction for complex actions
                    return {
                      type: 'llmInstruction',
                      config: {
                        instruction: `Complete this specific task: ${action.text || action.action}\n\nAvailable tools: ${availableTools.slice(0, 10).join(', ')}\n\nUse the appropriate tool to complete this task.`,
                        resultVariable: `step_${index + 1}_result`,
                        directOutput: false
                      }
                    };
                  }
                });
                
                // Create visual blocks
                const visualBlocks = actions.map((action, index) => ({
                  id: `step_${index + 1}`,
                  type: steps[index].type,
                  name: getStepName(action),
                  description: getStepDescription(action),
                  status: 'pending',
                  icon: getStepIcon(action),
                  tool: steps[index].type === 'toolCall' ? steps[index].config.toolName : 'AI Processing'
                }));
                
                console.log('🏁 [CreateWorkflow] Final result - Steps:', steps.length, 'Visual blocks:', visualBlocks.length);
                console.log('🏁 [CreateWorkflow] Steps:', steps.map(s => s.type));
                
                return { steps, visualBlocks };
              }
              
              // Simple pattern-based extraction for common actions
              function extractSimpleActions(text) {
                const actions = [];
                const processedTexts = new Set();
                
                // Check for "read emails" pattern first
                const readEmailPattern = /read\s+(?:my\s+)?(?:last\s+)?(\d+)?\s*email/gi;
                const readEmailMatch = text.match(readEmailPattern);
                if (readEmailMatch && !processedTexts.has(readEmailMatch[0])) {
                  actions.push({
                    type: 'email',
                    action: 'get emails',
                    target: '',
                    content: readEmailMatch[0],
                    text: readEmailMatch[0]
                  });
                  processedTexts.add(readEmailMatch[0]);
                }
                
                // Summarize/chart pattern
                const summarizePattern = /(?:summary|summarize|chart)[^,]*(?:urgency|action\s+items)?[^,]*/gi;
                const summarizeMatch = text.match(summarizePattern);
                if (summarizeMatch && !processedTexts.has(summarizeMatch[0])) {
                  actions.push({
                    type: 'process',
                    action: 'summarize and chart',
                    target: '',
                    content: summarizeMatch[0],
                    text: summarizeMatch[0]
                  });
                  processedTexts.add(summarizeMatch[0]);
                }
                
                // Email pattern: "send mail/email to X with Y" or "sent to X"
                const emailPattern = /(?:send\s+)?(?:mail|email|sent)\s+to\s+([^\s]+@[^\s]+)(?:\s+with\s+([^,]+?))?(?=\s+and|\s+then|$)/gi;
                const emailMatches = [...text.matchAll(emailPattern)];
                
                for (const match of emailMatches) {
                  if (!processedTexts.has(match[0])) {
                    actions.push({
                      type: 'email',
                      action: 'send email',
                      target: match[1],
                      content: match[2]?.trim() || 'Email content',
                      text: match[0]
                    });
                    processedTexts.add(match[0]);
                  }
                }
                
                // More flexible email pattern for "send another X to Y"
                const anotherEmailPattern = /send\s+another\s+(?:mail|email|invite)\s+to\s+([^\s]+@[^\s]+)/gi;
                const anotherMatches = [...text.matchAll(anotherEmailPattern)];
                
                for (const match of anotherMatches) {
                  if (!processedTexts.has(match[0])) {
                    actions.push({
                      type: 'email',
                      action: 'send email',
                      target: match[1],
                      content: 'Invitation',
                      text: match[0]
                    });
                    processedTexts.add(match[0]);
                  }
                }
                
                // Confirmation email pattern
                const confirmPattern = /confirm.*by\s+(?:another\s+)?(?:mail|email)/gi;
                const confirmMatch = text.match(confirmPattern);
                if (confirmMatch && !processedTexts.has(confirmMatch[0])) {
                  actions.push({
                    type: 'email',
                    action: 'send confirmation',
                    target: '',
                    content: 'Confirmation email',
                    text: confirmMatch[0]
                  });
                  processedTexts.add(confirmMatch[0]);
                }
                
                // LinkedIn pattern: "send invite in linkedin to X"
                const linkedinPattern = /send\s+invite\s+(?:in|on)\s+(?:linkedin|linkdin)\s+to\s+([^,]+?)(?=\s+and|$|\s+with)/gi;
                const linkedinMatches = [...text.matchAll(linkedinPattern)];
                
                for (const match of linkedinMatches) {
                  if (!processedTexts.has(match[0])) {
                    actions.push({
                      type: 'linkedin',
                      action: 'linkedin connect',
                      target: match[1].trim(),
                      content: '',
                      text: match[0]
                    });
                    processedTexts.add(match[0]);
                  }
                }
                
                return actions;
              }
              
              // Intelligent decomposition for complex multi-step tasks
              async function intelligentDecomposition(desc, availableTools, aibitat) {
                console.log('🧠 [IntelligentDecomposition] Breaking down complex task');
                
                try {
                  // Get ALL available tools, not just filtered ones
                  const allTools = availableTools.map(t => `- ${t}`).join('\n');
                  
                  const decompositionPrompt = `You are an expert at understanding user intent and breaking down complex requests into executable workflow steps.

USER REQUEST: "${desc}"

AVAILABLE TOOLS:
${allTools}

Your task is to understand what the user REALLY wants to accomplish and create a step-by-step workflow that achieves their goal.

CRITICAL ANALYSIS REQUIRED:
1. What is the user's ultimate goal?
2. What data needs to be collected/processed?
3. What transformations or analysis are needed?
4. Who are the recipients and what should they receive?
5. What follow-up actions are needed?

For the given request, think through:
- If they mention "read emails" - they want to fetch emails using a get_emails tool
- If they mention "summary/summarize" - they want LLM processing to analyze and condense information
- If they mention "chart/visualize" - they want data formatted in a visual/structured way
- If they mention "urgency" - they want prioritization or categorization
- If they mention "action items" - they want extracted todos or next steps
- If they mention "send to X" - they want results delivered to specific recipients
- If they mention "invite" - they may want calendar invites or email invitations
- If they mention "confirm" - they want acknowledgment or verification sent

Create a workflow where:
1. Each step has a clear purpose
2. Data flows logically between steps (earlier steps produce data for later steps)
3. Use specific tools when available, LLM processing when needed
4. Include ALL actions the user requested, even if implicit

Return a JSON array where each step has:
{
  "action": "specific action verb (get, send, analyze, etc.)",
  "tool": "exact tool name from list OR null for LLM",
  "type": "email|calendar|linkedin|process|file|web",
  "parameters": {
    // Tool-specific parameters with CORRECT variable references
    // For emails: to, subject, body (use {{step_X_result}} where X is the step number that produces the data)
    // For get_emails: num_emails
    // For analysis steps: reference previous step data as {{step_X_result}}
    // etc.
  },
  "description": "What this step accomplishes",
  "requires": [1, 2], // Array of step numbers this depends on
  "output": "what this step produces for other steps",
  "resultVariable": "step_X_result" // The variable name this step will save its output to
}

CRITICAL: When a step needs data from a previous step, use the EXACT variable reference {{step_X_result}} in parameters.
For example:
- Step 1 gets emails → saves to "step_1_result" 
- Step 2 analyzes emails → instruction: "Analyze these emails: {{step_1_result}}" 
- Step 3 sends summary → body: "{{step_2_result}}"

Be INTELLIGENT - understand the user's intent, not just keywords.`;

                  // Try to call LLM using official method from agent flows
                  let response;
                  try {
                    // First try the official getProviderForConfig method (like llm-instruction.js)
                    if (aibitat.getProviderForConfig && aibitat.defaultProvider) {
                      console.log('🤖 [IntelligentDecomposition] Using official aibitat.getProviderForConfig() method');
                      console.log('🤖 [IntelligentDecomposition] Default provider config:', aibitat.defaultProvider);
                      
                      const provider = aibitat.getProviderForConfig(aibitat.defaultProvider);
                      console.log('🤖 [IntelligentDecomposition] Provider instance created:', !!provider);
                      
                      const completion = await provider.complete([{
                        role: "user",
                        content: decompositionPrompt
                      }]);
                      
                      response = completion.result || completion.content || completion;
                      console.log('🤖 [IntelligentDecomposition] LLM response received, length:', response ? response.length : 'null');
                    }
                    // Fallback to other methods
                    else if (aibitat.getChatCompletion) {
                      console.log('🤖 [IntelligentDecomposition] Using getChatCompletion fallback');
                      response = await aibitat.getChatCompletion([{
                        role: "user",
                        content: decompositionPrompt
                      }], { temperature: 0.1 });
                    } 
                    // Then try completion method
                    else if (aibitat.completion) {
                      console.log('🤖 [IntelligentDecomposition] Using completion fallback');
                      const result = await aibitat.completion({
                        messages: [{ role: "user", content: decompositionPrompt }],
                        temperature: 0.1
                      });
                      response = result.text || result;
                    }
                    // Finally try llm.chat if available
                    else if (aibitat.llm && aibitat.llm.chat) {
                      console.log('🤖 [IntelligentDecomposition] Using llm.chat fallback');
                      response = await aibitat.llm.chat([{
                        role: "user",
                        content: decompositionPrompt
                      }], { temperature: 0.1 });
                    } else {
                      console.log('⚠️ [IntelligentDecomposition] No compatible LLM method found');
                      return [];
                    }
                  } catch (llmError) {
                    console.log('⚠️ [IntelligentDecomposition] LLM call failed:', llmError.message);
                    console.log('⚠️ [IntelligentDecomposition] Error details:', llmError.stack);
                    return [];
                  }
                  
                  // Extract JSON from response
                  const jsonMatch = response.match(/\[[\s\S]*\]/);
                  if (!jsonMatch) {
                    console.log('⚠️ [IntelligentDecomposition] No JSON found in response');
                    return [];
                  }
                  
                  const aiActions = JSON.parse(jsonMatch[0]);
                  console.log(`✅ [IntelligentDecomposition] AI extracted ${aiActions.length} actions`);
                  
                  // Convert to our action format with enhanced dependency info
                  return aiActions.map((item, index) => ({
                    type: item.type || 'generic',
                    action: item.action,
                    tool: item.tool,
                    parameters: item.parameters || {},
                    text: item.description,
                    target: item.parameters?.to || '',
                    content: item.parameters?.body || item.description || '',
                    requires: item.requires || [], // Step dependencies
                    resultVariable: item.resultVariable || `step_${index + 1}_result`, // Variable name for this step's output
                    output: item.output || item.description
                  }));
                  
                } catch (error) {
                  console.log('⚠️ [IntelligentDecomposition] Failed:', error.message);
                  return [];
                }
              }
              
              // AI-powered task decomposition - no hardcoded patterns
              async function extractActionsFromText(text, availableTools, aibitat) {
                console.log('🤖 [AI-ExtractActions] Using AI to decompose task:', text);
                
                try {
                  // Use LLM to intelligently break down ANY task into actionable steps
                  const decompositionPrompt = `You are a workflow decomposition expert. Break down this task into discrete, actionable steps:

"${text}"

Available tools: ${availableTools.slice(0, 15).join(', ')}

For each step, identify:
1. The specific action (what needs to be done)
2. The target (who/what it's directed at) 
3. Any content or parameters needed
4. The best matching tool from the available tools

Return ONLY a JSON array with this exact format:
[
  {
    "action": "send email",
    "target": "user@example.com",
    "content": "message content",
    "tool": "gmail_ws6-send_email",
    "parameters": {"to": "user@example.com", "body": "message content", "subject": "Subject"}
  }
]

Do NOT include explanations, markdown, or any other text. Only return the JSON array.`;
                  
                  console.log('🤖 [AI-ExtractActions] Requesting LLM decomposition...');
                  // Try to call LLM through available methods
                  let response;
                  try {
                    // First try the direct getChatCompletion method
                    if (aibitat.getChatCompletion) {
                      response = await aibitat.getChatCompletion([{
                        role: "user",
                        content: decompositionPrompt
                      }], { temperature: 0.1 });
                    } 
                    // Then try completion method
                    else if (aibitat.completion) {
                      const result = await aibitat.completion({
                        messages: [{ role: "user", content: decompositionPrompt }],
                        temperature: 0.1
                      });
                      response = result.text || result;
                    }
                    // Finally try llm.chat if available
                    else if (aibitat.llm && aibitat.llm.chat) {
                      response = await aibitat.llm.chat([{
                        role: "user",
                        content: decompositionPrompt
                      }], { temperature: 0.1 });
                    } else {
                      console.log('⚠️ [IntelligentDecomposition] No compatible LLM method found');
                      return [];
                    }
                  } catch (llmError) {
                    console.log('⚠️ [IntelligentDecomposition] LLM call failed:', llmError.message);
                    return [];
                  }
                  
                  // Extract and parse JSON from response
                  const jsonMatch = response.match(/\[[\s\S]*\]/);
                  if (!jsonMatch) {
                    console.log('⚠️ [AI-ExtractActions] No JSON array found in LLM response');
                    return fallbackExtraction(text);
                  }
                  
                  const actions = JSON.parse(jsonMatch[0]);
                  console.log(`✅ [AI-ExtractActions] AI extracted ${actions.length} actions:`, actions);
                  
                  // Validate and clean up actions
                  return actions.map(action => ({
                    type: inferActionType(action.action),
                    action: action.action || 'process',
                    target: action.target || '',
                    content: action.content || '',
                    tool: action.tool || '',
                    parameters: action.parameters || {},
                    text: text // Keep original for reference
                  }));
                  
                } catch (error) {
                  console.log('⚠️ [AI-ExtractActions] LLM parsing failed:', error.message);
                  return fallbackExtraction(text);
                }
              }
              
              // Fallback for when AI fails
              function fallbackExtraction(text) {
                console.log('🔄 [FallbackExtraction] Using simple text splitting');
                const parts = text.split(/\s+(?:and|then)\s+/i).map(p => p.trim()).filter(p => p.length > 0);
                
                if (parts.length <= 1) {
                  return [{
                    type: 'generic',
                    action: 'process task',
                    target: '',
                    content: text,
                    text: text,
                    tool: '',
                    parameters: {}
                  }];
                }
                
                return parts.map(part => ({
                  type: 'generic',
                  action: 'process',
                  target: '',
                  content: part,
                  text: part,
                  tool: '',
                  parameters: {}
                }));
              }
              
              // Infer action type from action text
              function inferActionType(actionText) {
                const lower = (actionText || '').toLowerCase();
                if (lower.includes('email') || lower.includes('mail')) return 'email';
                if (lower.includes('linkedin') || lower.includes('connect') || lower.includes('invite')) return 'linkedin';
                if (lower.includes('calendar') || lower.includes('meeting') || lower.includes('schedule')) return 'calendar';
                if (lower.includes('file') || lower.includes('read') || lower.includes('write')) return 'file';
                if (lower.includes('web') || lower.includes('scrape') || lower.includes('browse')) return 'web';
                return 'generic';
              }
              
              // AI-powered tool mapping - no hardcoded rules
              function findBestTool(action, availableTools) {
                // If the AI already suggested a tool, validate it exists and use it
                if (action.tool && availableTools.includes(action.tool)) {
                  console.log(`✅ [ToolMapping] Using AI-suggested tool: ${action.tool}`);
                  return action.tool;
                }
                
                // Dynamic tool matching based on action semantics
                const actionText = (action.action || action.text || '').toLowerCase();
                const actionType = action.type;
                
                console.log(`🔍 [ToolMapping] Finding tool for: ${actionText} (type: ${actionType})`);
                
                // Score each tool based on semantic similarity to the action
                const toolScores = availableTools.map(tool => ({
                  tool,
                  score: calculateToolScore(actionText, actionType, tool)
                }));
                
                // Sort by score and get the best match
                toolScores.sort((a, b) => b.score - a.score);
                
                if (toolScores.length > 0 && toolScores[0].score > 0) {
                  console.log(`🏆 [ToolMapping] Best match: ${toolScores[0].tool} (score: ${toolScores[0].score})`);
                  return toolScores[0].tool;
                }
                
                console.log(`⚠️ [ToolMapping] No suitable tool found for: ${actionText}`);
                return null;
              }
              
              // Calculate semantic similarity score between action and tool
              function calculateToolScore(actionText, actionType, toolName) {
                let score = 0;
                const toolLower = toolName.toLowerCase();
                
                // Direct keyword matching
                const keywords = actionText.split(/\s+/);
                keywords.forEach(keyword => {
                  if (toolLower.includes(keyword)) score += 10;
                });
                
                // Action type matching
                if (actionType === 'email' && (toolLower.includes('gmail') || toolLower.includes('mail'))) {
                  score += 20;
                  if (actionText.includes('send') && toolLower.includes('send')) score += 15;
                  if ((actionText.includes('get') || actionText.includes('read')) && toolLower.includes('get')) score += 15;
                }
                
                if (actionType === 'linkedin' && toolLower.includes('linkedin')) {
                  score += 20;
                  if (actionText.includes('connect') && toolLower.includes('connect')) score += 15;
                  if (actionText.includes('invite') && toolLower.includes('connect')) score += 10;
                }
                
                if (actionType === 'calendar' && (toolLower.includes('calendar') || toolLower.includes('meeting'))) {
                  score += 20;
                }
                
                if (actionType === 'file' && toolLower.includes('file')) {
                  score += 20;
                }
                
                if (actionType === 'web' && (toolLower.includes('web') || toolLower.includes('scrape') || toolLower.includes('puppeteer'))) {
                  score += 20;
                  // Prefer puppeteer tools over web-scraping for reliability
                  if (toolLower.includes('puppeteer')) score += 10;
                }
                
                return score;
              }
              
              // Fix variable references in parameters to use correct step variable names
              function normalizeVariableReferences(parameters, stepIndex, allActions) {
                if (!parameters || typeof parameters !== 'object') return parameters;
                
                const normalizedParams = { ...parameters };
                
                // Create a mapping of step dependencies to correct variable names
                for (const [key, value] of Object.entries(normalizedParams)) {
                  if (typeof value === 'string' && value.includes('{{') && value.includes('}}')) {
                    // Find all variable references in the value
                    const variableMatches = value.match(/\{\{([^}]+)\}\}/g);
                    if (variableMatches) {
                      let normalizedValue = value;
                      
                      variableMatches.forEach(match => {
                        const varName = match.slice(2, -2); // Remove {{ }}
                        
                        // If it's not already in step_X_result format, try to map it
                        if (!varName.match(/^step_\d+_result$/)) {
                          // Look for which previous step this might reference
                          // This is a simple heuristic - in practice, the AI should provide dependency info
                          for (let i = 0; i < stepIndex; i++) {
                            const previousAction = allActions[i];
                            // If the variable name suggests it's from this step's result
                            if (varName.includes('summary') && previousAction.action?.includes('analyz')) {
                              normalizedValue = normalizedValue.replace(match, `{{step_${i + 1}_result}}`);
                              console.log(`🔧 [VarNormalization] Mapped ${match} -> {{step_${i + 1}_result}}`);
                              break;
                            } else if (varName.includes('email') && previousAction.action?.includes('search')) {
                              normalizedValue = normalizedValue.replace(match, `{{step_${i + 1}_result}}`);
                              console.log(`🔧 [VarNormalization] Mapped ${match} -> {{step_${i + 1}_result}}`);
                              break;
                            }
                          }
                        }
                      });
                      
                      normalizedParams[key] = normalizedValue;
                    }
                  }
                }
                
                return normalizedParams;
              }

              // Convert web scraping action to reliable Puppeteer workflow
              function convertWebScrapingToPuppeteerWorkflow(action, baseIndex) {
                const urlMatch = action.text?.match(/https?:\/\/[^\s]+/);
                const url = urlMatch ? urlMatch[0] : 'https://news.ycombinator.com/';
                
                return [
                  {
                    type: 'web',
                    action: 'navigate',
                    tool: 'puppeteer-puppeteer_navigate',
                    parameters: { url },
                    text: `Navigate to ${url}`,
                    target: url,
                    content: `Navigate to ${url}`,
                    resultVariable: `step_${baseIndex + 1}_result`
                  },
                  {
                    type: 'web',
                    action: 'extract_content',
                    tool: 'puppeteer-puppeteer_evaluate',
                    parameters: { 
                      script: `return {
                        title: document.title,
                        content: document.body.innerText,
                        links: Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent, href: a.href })).slice(0, 10),
                        headlines: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent).slice(0, 5)
                      }`
                    },
                    text: `Extract content from ${url}`,
                    target: '',
                    content: `Extract content from ${url}`,
                    requires: [baseIndex + 1],
                    resultVariable: `step_${baseIndex + 2}_result`
                  }
                ];
              }

              // Validate and clean parameters for specific tools
              function validateToolParameters(toolName, params) {
                const cleanedParams = { ...params };
                
                // Web scraping tool only accepts 'url' parameter
                if (toolName === 'web-scraping') {
                  const validParams = {};
                  if (cleanedParams.url) {
                    validParams.url = cleanedParams.url;
                  }
                  console.log(`🔧 [ParamValidation] Cleaned web-scraping params:`, validParams);
                  return validParams;
                }
                
                // Gmail send_email tool parameters
                if (toolName === 'gmail-send_email') {
                  const validParams = {};
                  if (cleanedParams.to) validParams.to = cleanedParams.to;
                  if (cleanedParams.subject) validParams.subject = cleanedParams.subject;
                  if (cleanedParams.body) validParams.body = cleanedParams.body;
                  if (cleanedParams.cc) validParams.cc = cleanedParams.cc;
                  if (cleanedParams.bcc) validParams.bcc = cleanedParams.bcc;
                  console.log(`🔧 [ParamValidation] Cleaned gmail-send_email params:`, validParams);
                  return validParams;
                }
                
                // Gmail get_emails tool parameters
                if (toolName === 'gmail-get_emails') {
                  const validParams = {};
                  if (cleanedParams.num_emails) validParams.num_emails = cleanedParams.num_emails;
                  if (cleanedParams.query) validParams.query = cleanedParams.query;
                  console.log(`🔧 [ParamValidation] Cleaned gmail-get_emails params:`, validParams);
                  return validParams;
                }
                
                // Calendar book_meeting tool parameters
                if (toolName === 'gcalendar-book_meeting') {
                  const validParams = {};
                  if (cleanedParams.attendees) validParams.attendees = cleanedParams.attendees;
                  if (cleanedParams.start_time) validParams.start_time = cleanedParams.start_time;
                  if (cleanedParams.end_time) validParams.end_time = cleanedParams.end_time;
                  if (cleanedParams.description) validParams.description = cleanedParams.description;
                  if (cleanedParams.title) validParams.title = cleanedParams.title;
                  console.log(`🔧 [ParamValidation] Cleaned gcalendar-book_meeting params:`, validParams);
                  return validParams;
                }
                
                // Puppeteer tools parameters
                if (toolName === 'puppeteer-puppeteer_navigate') {
                  const validParams = {};
                  if (cleanedParams.url) validParams.url = cleanedParams.url;
                  console.log(`🔧 [ParamValidation] Cleaned puppeteer-navigate params:`, validParams);
                  return validParams;
                }
                
                if (toolName === 'puppeteer-puppeteer_evaluate') {
                  const validParams = {};
                  if (cleanedParams.script) validParams.script = cleanedParams.script;
                  console.log(`🔧 [ParamValidation] Cleaned puppeteer-evaluate params:`, validParams);
                  return validParams;
                }
                
                // For other tools, return params as-is
                return cleanedParams;
              }

              function extractParameters(action) {
                // If AI already provided parameters, use them but normalize variable references
                if (action.parameters && Object.keys(action.parameters).length > 0) {
                  console.log(`✅ [ParamExtraction] Using AI-provided parameters:`, action.parameters);
                  return action.parameters; // Will be normalized later in step creation
                }
                
                // Dynamic parameter extraction based on action type and content
                const params = {};
                
                // Email parameters
                if (action.type === 'email') {
                  // Check if it's a "get emails" action
                  if (action.action.includes('get')) {
                    // Extract number of emails if specified
                    const numMatch = action.text?.match(/(\d+)\s*email/);
                    if (numMatch) {
                      params.num_emails = parseInt(numMatch[1]);
                    } else {
                      params.num_emails = 5; // Default to 5 emails
                    }
                  } else {
                    // Send email parameters
                    if (action.target) params.to = action.target;
                    
                    // Check if this is sending results from previous steps
                    if (action.content?.includes('{{') || action.description?.includes('summary') || action.description?.includes('result')) {
                      // Reference previous step results
                      params.body = action.content || `Results from previous analysis:\n\n{{step_${Math.max(1, action.parameters?.referenceStep || 1)}_result}}`;
                      params.subject = action.parameters?.subject || 'Analysis Results';
                    } else {
                      params.body = action.content || 'Email content';
                      params.subject = action.content?.length > 50 ? action.content.substring(0, 50) + '...' : action.content;
                    }
                  }
                }
                
                // LinkedIn parameters
                else if (action.type === 'linkedin') {
                  if (action.target) params.name = action.target;
                  if (action.content) params.message = action.content;
                }
                
                // Calendar parameters
                else if (action.type === 'calendar') {
                  if (action.target) params.title = action.target;
                  if (action.content) params.description = action.content;
                }
                
                // File parameters
                else if (action.type === 'file') {
                  if (action.target) params.path = action.target;
                  if (action.content) params.content = action.content;
                }
                
                // Web scraping parameters - use Puppeteer for reliability
                else if (action.type === 'web') {
                  // Extract URL from action text or use a default news source
                  const urlMatch = action.text?.match(/https?:\/\/[^\s]+/);
                  if (urlMatch) {
                    params.url = urlMatch[0];
                  } else {
                    // Default to a reliable news source
                    params.url = 'https://news.ycombinator.com/';
                  }
                }
                
                // Generic parameters for other types
                else {
                  if (action.target) params.target = action.target;
                  if (action.content) params.input = action.content;
                }
                
                console.log(`📝 [ParamExtraction] Extracted parameters:`, params);
                return params;
              }
              
              function getStepName(action) {
                if (action.type === 'email') {
                  if (action.action.includes('get')) return `📧 Get Emails`;
                  if (action.action.includes('confirmation')) return `📧 Send Confirmation`;
                  return `📧 Send Email`;
                }
                if (action.type === 'linkedin') return `🔗 LinkedIn Connect`;
                if (action.type === 'process') return `📊 ${action.action || 'Process'}`;
                return `⚡ ${action.action || 'Process'}`;
              }
              
              function getStepDescription(action) {
                if (action.type === 'email') {
                  if (action.action.includes('get')) return action.text || 'Get recent emails';
                  if (action.target) return `To: ${action.target}`;
                  return action.content || 'Send email';
                }
                if (action.type === 'linkedin') return `Connect with: ${action.target}`;
                if (action.type === 'process') return action.content || action.text || 'Process data';
                return action.content || action.text || 'Process task';
              }
              
              function getStepIcon(action) {
                if (action.type === 'email') return '📧';
                if (action.type === 'linkedin') return '🔗';
                if (action.type === 'process') return '📊';
                return '⚡';
              }
              
              function createFallbackSteps(desc, availableTools) {
                const steps = [{
                  type: 'llmInstruction',
                  config: {
                    instruction: `Complete this task: ${desc}\n\nAvailable tools: ${availableTools.slice(0, 15).join(', ')}\n\nUse the appropriate tools to complete this task.`,
                    resultVariable: 'step_1_result',
                    directOutput: false
                  }
                }];
                
                const visualBlocks = [{
                  id: 'step_1',
                  type: 'llmInstruction',
                  name: '🔧 Smart Processing',
                  description: desc.substring(0, 60) + (desc.length > 60 ? '...' : ''),
                  status: 'pending',
                  icon: '🔧',
                  tool: 'AI + Tools'
                }];
                
                return { steps, visualBlocks };
              }
              
              // Get available tools from aibitat context
              let availableTools = [];
              try {
                if (aibitat && aibitat.functions) {
                  availableTools = Array.from(aibitat.functions.keys())
                    .filter(name => !name.startsWith('flow_') && name !== 'create-workflow') // Filter out workflow functions
                    .slice(0, 30); // Limit to prevent prompt bloat
                  console.log(`[CreateWorkflow] Found ${availableTools.length} available tools`);
                }
              } catch (error) {
                console.warn('[CreateWorkflow] Could not load available tools:', error.message);
              }
              
              const { steps: workflowSteps, visualBlocks: parsedBlocks } = await parseIntoSteps(description, availableTools, aibitat);
              
              // Create initial workflow with building status
              let config = {
                name: workflowName,
                description: `Created: ${description}`,
                active: false,
                status: 'building',
                created_via: "chat",
                created_at: new Date().toISOString(),
                steps: [],
                visualBlocks: [],
                buildProgress: {
                  current: 0,
                  total: parsedBlocks.length + 2, // +2 for start and complete blocks
                  message: 'Starting workflow creation...'
                },
                // Signal to open Flow Panel AND WorkflowBuilder
                openFlowPanel: true,
                openWorkflowBuilder: true,
                workflowUuid: workflowUuid
              };
              
              // Save initial state
              console.log('💾 [CreateWorkflow] Saving initial workflow state...');
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              console.log('💾 [CreateWorkflow] Initial state saved successfully');
              aibitat.introspect(`🏗️ Creating workflow: "${workflowName}"`);
              
              // Simulate progressive building
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Add start block
              config.steps.push({
                type: "start",
                config: { variables: [] }
              });
              config.visualBlocks.push({
                id: 'start',
                type: 'start',
                name: '🚀 Start',
                description: 'Workflow entry point',
                status: 'complete',
                icon: '🚀',
                tool: 'Start'
              });
              config.buildProgress = {
                current: 1,
                total: parsedBlocks.length + 2,
                message: 'Initializing workflow...'
              };
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              aibitat.introspect(`🚀 Building workflow with ${parsedBlocks.length} steps...`);
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Add each parsed block with animation
              for (let i = 0; i < parsedBlocks.length; i++) {
                const block = parsedBlocks[i];
                
                // Mark previous blocks as complete
                if (i > 0) {
                  config.visualBlocks[config.visualBlocks.length - 1].status = 'complete';
                }
                
                // Add current block as building
                block.status = 'building';
                config.visualBlocks.push(block);
                
                // Add corresponding step
                config.steps.push(workflowSteps[i]);
                
                config.buildProgress = {
                  current: i + 2,
                  total: parsedBlocks.length + 2,
                  message: `Adding: ${block.tool}...`
                };
                
                console.log(`💾 [CreateWorkflow] Saving workflow with ${config.steps.length} steps...`);
                await AgentFlows.saveFlow(config.name, config, workflowUuid);
                console.log(`💾 [CreateWorkflow] Saved step ${i + 1}/${parsedBlocks.length}`);
                aibitat.introspect(`${block.icon} Adding ${block.tool}: ${block.description.substring(0, 30)}...`);
                
                await new Promise(resolve => setTimeout(resolve, 1200));
              }
              
              // Mark last block as complete
              if (config.visualBlocks.length > 1) {
                config.visualBlocks[config.visualBlocks.length - 1].status = 'complete';
              }
              
              // Add complete block
              config.visualBlocks.push({
                id: 'complete',
                type: 'complete',
                name: '✅ Complete',
                description: 'Workflow ready!',
                status: 'complete',
                icon: '✅',
                tool: 'Complete'
              });
              
              // Complete workflow
              config.active = true;
              config.status = 'complete';
              config.buildProgress = {
                current: parsedBlocks.length + 2,
                total: parsedBlocks.length + 2,
                message: '🎉 Workflow complete!'
              };
              console.log(`🏁 [CreateWorkflow] Final save - ${config.steps.length} total steps, ${parsedBlocks.length} visual blocks`);
              console.log(`🏁 [CreateWorkflow] Final config:`, JSON.stringify({steps: config.steps.length, blocks: config.visualBlocks.length}, null, 2));
              await AgentFlows.saveFlow(config.name, config, workflowUuid);
              console.log(`🏁 [CreateWorkflow] Workflow ${workflowUuid} saved successfully!`);
              
              // Clean up progress after 2 seconds
              setTimeout(async () => {
                delete config.buildProgress;
                await AgentFlows.saveFlow(config.name, config, workflowUuid);
              }, 2000);
              
              aibitat.introspect(`🎉 Workflow "${workflowName}" created with ${parsedBlocks.length} steps!`);
              
              // Return a string message instead of object to avoid chat system errors
              return `✅ Workflow "${workflowName}" created with ${parsedBlocks.length} steps!\n\nSteps:\n${parsedBlocks.map((b, i) => `${i+1}. ${b.icon} ${b.tool}`).join('\n')}\n\nThe workflow is now visible in your Flow Panel and ready to use!`;
              
            } catch (error) {
              console.error("❌ [CreateWorkflow] Error:", error);
              // Return error as string to avoid chat system errors
              return `Failed to create workflow: ${error.message}`;
            }
          }
        });
        
        console.log("✅ [CreateWorkflow] Plugin setup complete");
      }
    };
  }
};

module.exports = {
  createWorkflow,
  "create-workflow": createWorkflow // Also export with dash name
};