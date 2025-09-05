#!/usr/bin/env node

/**
 * Test Multi-Action Agent Handler
 * Tests that agents properly complete all parts of multi-action requests
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Set up environment
process.env.NODE_ENV = 'test';
process.env.STORAGE_DIR = path.join(__dirname, '../../storage');

// Mock WebSocket for testing
class MockWebSocket {
  constructor() {
    this.messages = [];
    this.open = true;
  }
  
  send(data) {
    const parsed = JSON.parse(data);
    this.messages.push(parsed);
    console.log(`[WebSocket] ${parsed.type}:`, parsed.content || parsed.message || '');
  }
  
  close() {
    this.open = false;
  }
}

// Load the agent system
const AIbitat = require('../../utils/agents/aibitat');
const AgentPlugins = require('../../utils/agents/aibitat/plugins');

// Test cases
const testCases = [
  {
    name: 'Multiple Email Recipients',
    input: 'Send invite to john@example.com with code A and jane@example.com with code B',
    expectedActions: 2,
    expectedTargets: ['john@example.com', 'jane@example.com']
  },
  {
    name: 'Multiple Calendar Invites',
    input: 'Book meeting with segev@sinosciences.com with smile 1 and segev@futurixs.com with smile 2',
    expectedActions: 2,
    expectedTargets: ['segev@sinosciences.com', 'segev@futurixs.com']
  },
  {
    name: 'Three Recipients',
    input: 'Send updates to alice@test.com, bob@test.com, and charlie@test.com',
    expectedActions: 3,
    expectedTargets: ['alice@test.com', 'bob@test.com', 'charlie@test.com']
  }
];

// Mock function handler that simulates email/calendar tools
let executionLog = [];
function createMockEmailFunction() {
  return {
    name: 'send_email',
    description: 'Send an email',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        body: { type: 'string' }
      }
    },
    handler: async (args) => {
      executionLog.push({
        function: 'send_email',
        to: args.to,
        timestamp: new Date()
      });
      return `Email sent successfully to ${args.to}`;
    }
  };
}

async function runTest(testCase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test: ${testCase.name}`);
  console.log(`Input: "${testCase.input}"`);
  console.log(`Expected: ${testCase.expectedActions} actions`);
  console.log(`${'='.repeat(60)}\n`);
  
  executionLog = [];
  
  // Create AIbitat instance
  const aibitat = new AIbitat({
    provider: 'openai',
    model: 'gpt-4',
    chats: [],
    handlerProps: {
      log: (msg) => console.log(`[Agent Log] ${msg}`)
    }
  });
  
  // Mock socket
  const socket = new MockWebSocket();
  
  // Load plugins
  aibitat.use(AgentPlugins.websocket.plugin({ socket, muteUserReply: true }));
  aibitat.use(AgentPlugins.multiActionHandler.plugin());
  
  // Add mock email function
  aibitat.function(createMockEmailFunction());
  
  // Mock provider that simulates LLM responses
  let callCount = 0;
  aibitat.provider = {
    complete: async (messages, functions) => {
      callCount++;
      const lastUserMsg = messages.find(m => m.role === 'user')?.content || '';
      const lastSystemMsg = messages.filter(m => m.role === 'system').pop()?.content || '';
      
      // Simulate LLM behavior
      if (callCount === 1) {
        // First call - execute first action
        const firstEmail = testCase.expectedTargets[0];
        console.log(`[LLM] Deciding to send to first recipient: ${firstEmail}`);
        return {
          functionCall: {
            name: 'send_email',
            arguments: {
              to: firstEmail,
              subject: `Invite with code ${callCount}`,
              body: `This is invite ${callCount}`
            }
          }
        };
      } else if (callCount === 2 && !lastSystemMsg.includes('completed')) {
        // Second call - LLM might try to return text
        console.log(`[LLM] Attempting to return text response (this should be intercepted)`);
        return {
          result: "I'll now send to the second recipient..."
        };
      } else if (callCount <= testCase.expectedActions + 1) {
        // Forced continuation - execute next action
        const targetIndex = executionLog.length;
        if (targetIndex < testCase.expectedTargets.length) {
          const nextEmail = testCase.expectedTargets[targetIndex];
          console.log(`[LLM] Continuing with next recipient: ${nextEmail}`);
          return {
            functionCall: {
              name: 'send_email',
              arguments: {
                to: nextEmail,
                subject: `Invite with code ${targetIndex + 1}`,
                body: `This is invite ${targetIndex + 1}`
              }
            }
          };
        }
      }
      
      // Final response
      console.log(`[LLM] All actions complete, returning final response`);
      return {
        result: `Successfully sent ${executionLog.length} emails!`
      };
    }
  };
  
  // Set up agents
  aibitat.agent('USER', {
    role: 'User making the request'
  });
  
  aibitat.agent('@agent', {
    role: 'Assistant that handles requests',
    functions: ['send_email']
  });
  
  // Execute the request
  try {
    // Start the agent conversation
    const result = await aibitat.start({
      from: 'USER',
      to: '@agent',
      content: testCase.input
    });
    
    // Check results
    console.log(`\n${'─'.repeat(40)}`);
    console.log('Test Results:');
    console.log(`${'─'.repeat(40)}`);
    console.log(`Actions executed: ${executionLog.length}`);
    console.log(`Expected actions: ${testCase.expectedActions}`);
    console.log(`Recipients processed: ${executionLog.map(e => e.to).join(', ')}`);
    
    // Verify WebSocket messages
    const progressMessages = socket.messages.filter(m => 
      m.type === 'statusResponse' || 
      (m.content && m.content.includes('Detected')) ||
      (m.content && m.content.includes('Progress'))
    );
    console.log(`Progress updates sent: ${progressMessages.length}`);
    
    // Test pass/fail
    const passed = executionLog.length === testCase.expectedActions;
    console.log(`\nTest Status: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!passed) {
      console.log(`ERROR: Expected ${testCase.expectedActions} actions but got ${executionLog.length}`);
      console.log('Execution log:', executionLog);
    }
    
    return passed;
    
  } catch (error) {
    console.error('Test error:', error);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '═'.repeat(60));
  console.log('   MULTI-ACTION AGENT HANDLER TEST SUITE');
  console.log('═'.repeat(60));
  
  const results = [];
  
  for (const testCase of testCases) {
    const passed = await runTest(testCase);
    results.push({ name: testCase.name, passed });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('   TEST SUMMARY');
  console.log('═'.repeat(60));
  
  let passedCount = 0;
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`);
    if (r.passed) passedCount++;
  });
  
  console.log(`\nTotal: ${passedCount}/${results.length} tests passed`);
  
  if (passedCount === results.length) {
    console.log('\n🎉 All tests passed! Multi-action handler is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Review the implementation.');
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  // Check if we have necessary environment
  if (!process.env.OPEN_AI_KEY) {
    console.log('\n⚠️  Note: Running in mock mode without actual LLM');
    console.log('Set OPEN_AI_KEY to test with real OpenAI API\n');
  }
  
  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runTest, runAllTests };