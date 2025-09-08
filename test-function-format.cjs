/**
 * Test script to examine the exact function formatting and prompt generation
 * for the workflow-creator plugin in the UnTooled system
 */

console.log('🔧 Testing UnTooled function formatting for workflow-creator...\n');

// Mock the workflow-creator function definition as it would appear in the system
const workflowCreatorFunction = {
  name: "create_workflow_from_chat", 
  description: "PRIORITY FUNCTION: Use this when user mentions 'workflow' or 'create workflow' or describes sequential actions with 'then'. This creates a reusable automation workflow with visual preview. DO NOT execute individual actions when workflow is requested.",
  examples: [
    {
      prompt: "create workflow from chat: send email then invite",
      call: JSON.stringify({ description: "send email from chat then invite" })
    },
    {
      prompt: "create workflow from chat: send email from segev@sinosciences.com then invite to segev@futurixs.com",
      call: JSON.stringify({ description: "send email from segev@sinosciences.com then invite to segev@futurixs.com" })
    },
    {
      prompt: "create workflow: send notifications and create calendar events",
      call: JSON.stringify({ description: "send notifications and create calendar events" })
    }
  ],
  parameters: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Natural language description of what the workflow should do"
      },
      name: {
        type: "string",
        description: "Optional name for the workflow"
      }
    },
    required: ["description"]
  }
};

// Mock some other common functions to test against
const mockFunctions = [
  {
    name: "web_scraping",
    description: "Scrape content from a webpage",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL to scrape" }
      },
      required: ["url"]
    },
    examples: [
      {
        prompt: "scrape https://example.com",
        call: JSON.stringify({ url: "https://example.com" })
      }
    ]
  },
  workflowCreatorFunction,
  {
    name: "memory",
    description: "Store or retrieve information from memory",
    parameters: {
      type: "object", 
      properties: {
        action: { type: "string", description: "store or retrieve" },
        content: { type: "string", description: "Content to store or query" }
      },
      required: ["action", "content"]
    },
    examples: []
  }
];

console.log('=== Step 1: Testing showcaseFunctions output ===\n');

// Create a simple version of showcaseFunctions to test
function showcaseFunctions(functions = []) {
  let output = "";
  functions.forEach((def) => {
    let shotExample = `-----------
Function name: ${def.name}
Function Description: ${def.description}
Function parameters in JSON format:
${JSON.stringify(def.parameters.properties, null, 4)}\n`;

    if (Array.isArray(def.examples)) {
      def.examples.forEach(({ prompt, call }) => {
        shotExample += `Query: "${prompt}"\nJSON: ${JSON.stringify({
          name: def.name,
          arguments: JSON.parse(call),
        })}\n`;
      });
    }
    output += `${shotExample}-----------\n`;
  });
  return output;
}

const showcase = showcaseFunctions(mockFunctions);
console.log('📄 Complete function showcase:');
console.log(showcase);

console.log('\n=== Step 2: Testing complete prompt generation ===\n');

const systemPrompt = `You are a function selector. Analyze the user's request and determine if any function should be called.

CRITICAL RULES:
1. If the user wants to PERFORM AN ACTION (send email, book meeting, create post, etc.) → ALWAYS return JSON
2. If a function CAN help fulfill the request → ALWAYS return JSON
3. Only return plain text if the user is asking a question that needs no action

When selecting a function, respond ONLY with JSON in this exact format:
{"name": "function_name", "arguments": {...}}

Your task is to pick the MOST RELEVANT function for the user's request.

      All JSON responses should have two keys.
      'name': this is the name of the function name to call. eg: 'web-scraper', 'rag-memory', etc..
      'arguments': this is an object with the function properties to invoke the function.
      DO NOT INCLUDE ANY OTHER KEYS IN JSON RESPONSES.

      Here are the available tools you can use an examples of a query and response so you can understand how each one works.
      ${showcase}

      Now pick a function if there is an appropriate one to use given the last user message and the given conversation so far.`;

console.log('📋 Complete system prompt:');
console.log(systemPrompt);

console.log('\n=== Step 3: Testing specific user inputs ===\n');

const testInputs = [
  "create workflow",
  "create workflow to send email then book meeting",
  "@agent create workflow from chat: check calendar and send email",
  "I want to create a workflow",
  "help me automate sending emails and creating tasks"
];

testInputs.forEach((input, index) => {
  console.log(`Test ${index + 1}: "${input}"`);
  
  // Check if this would match workflow-creator patterns
  const patterns = [
    /workflow/i,
    /create.*workflow/i,
    /workflow.*create/i,
    /then/i,
    /automate/i
  ];
  
  const matches = patterns.some(pattern => pattern.test(input));
  console.log(`   Matches workflow patterns: ${matches ? '✅' : '❌'}`);
  
  // Check if it matches the function description keywords
  const descriptionKeywords = ['workflow', 'create workflow', 'then', 'sequential actions'];
  const hasKeywords = descriptionKeywords.some(keyword => input.toLowerCase().includes(keyword.toLowerCase()));
  console.log(`   Contains description keywords: ${hasKeywords ? '✅' : '❌'}`);
  
  console.log('');
});

console.log('=== Step 4: Analyzing potential issues ===\n');

console.log('🔍 Potential issues to investigate:');
console.log('1. Function description clarity - is "PRIORITY FUNCTION" confusing?');
console.log('2. Examples relevance - do examples match common user inputs?');
console.log('3. Keyword matching - does the LLM connect user input to function?');
console.log('4. Function competition - are other functions being selected instead?');
console.log('5. Parameter validation - are the required parameters clear?');

console.log('\n✅ Function formatting test complete!');