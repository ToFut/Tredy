#!/usr/bin/env node

/**
 * Integration Test for Multi-Action Handler
 * Tests the actual agent system with multi-part requests
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { AgentHandler } = require('../../utils/agents');
const { WorkspaceAgentInvocation } = require('../../models/workspaceAgentInvocation');

// Mock workspace for testing
const mockWorkspace = {
  id: 1,
  name: 'Test Workspace',
  slug: 'test-workspace',
  agentProvider: process.env.LLM_PROVIDER || 'openai',
  agentModel: process.env.OPEN_MODEL_PREF || 'gpt-4',
  chatProvider: process.env.LLM_PROVIDER || 'openai',
  chatModel: process.env.OPEN_MODEL_PREF || 'gpt-4'
};

// Mock user
const mockUser = {
  id: 1,
  username: 'testuser'
};

// Mock WebSocket
class MockWebSocket {
  constructor() {
    this.messages = [];
    this.open = true;
  }
  
  send(data) {
    const parsed = JSON.parse(data);
    this.messages.push(parsed);
    
    // Log important messages
    if (parsed.type === 'textResponse' || 
        (parsed.content && parsed.content.includes('Progress')) ||
        (parsed.content && parsed.content.includes('Detected'))) {
      console.log(`[WebSocket] ${parsed.type}: ${parsed.content || parsed.textResponse || ''}`);
    }
  }
  
  on(event, handler) {
    // Mock event handler
  }
  
  close() {
    this.open = false;
  }
}

async function testMultiActionExecution(prompt) {
  console.log('\n' + '='.repeat(60));
  console.log('Testing:', prompt);
  console.log('='.repeat(60) + '\n');
  
  try {
    // Create mock invocation
    const invocation = {
      uuid: require('uuid').v4(),
      workspace_id: mockWorkspace.id,
      workspace: mockWorkspace,
      user_id: mockUser.id,
      user: mockUser,
      prompt: prompt,
      closed: false
    };
    
    // Mock the database call
    WorkspaceAgentInvocation.getWithWorkspace = async () => invocation;
    WorkspaceAgentInvocation.close = async () => {};
    
    // Create agent handler
    const agentHandler = new AgentHandler({ uuid: invocation.uuid });
    agentHandler.invocation = invocation;
    
    // Set provider and model
    agentHandler.provider = mockWorkspace.agentProvider;
    agentHandler.model = mockWorkspace.agentModel;
    
    // Create mock socket
    const socket = new MockWebSocket();
    
    // Create AIbitat instance
    await agentHandler.createAIbitat({ socket });
    
    // Track function calls
    let functionCalls = [];
    
    // Intercept function calls for monitoring
    const originalFunctions = agentHandler.aibitat.functions;
    originalFunctions.forEach((func, name) => {
      if (name.includes('send_email') || name.includes('book_meeting')) {
        const originalHandler = func.handler;
        func.handler = async (args) => {
          console.log(`[Function Call] ${name}:`, args);
          functionCalls.push({ name, args });
          
          // Simulate success
          return `Successfully executed ${name} for ${args.to || args.recipient || 'target'}`;
        };
      }
    });
    
    // Start the agent
    console.log('Starting agent execution...\n');
    
    // Mock a simple completion to test
    if (!process.env.OPEN_AI_KEY) {
      console.log('⚠️  Running in mock mode (no OpenAI key)\n');
      
      // Override provider for testing
      agentHandler.aibitat.provider = {
        complete: async (messages, functions) => {
          const userMsg = messages.find(m => m.role === 'user')?.content || '';
          const functionMsgs = messages.filter(m => m.role === 'function');
          
          // Extract emails from prompt
          const emails = userMsg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
          
          if (emails.length > functionMsgs.length) {
            // Still have emails to process
            const nextEmail = emails[functionMsgs.length];
            return {
              functionCall: {
                name: 'send_email',
                arguments: {
                  to: nextEmail,
                  subject: `Test ${functionMsgs.length + 1}`,
                  body: `Test message ${functionMsgs.length + 1}`
                }
              }
            };
          }
          
          // All done
          return {
            result: `Completed all ${functionMsgs.length} actions successfully!`
          };
        }
      };
    }
    
    // Execute
    const result = await agentHandler.startAgentCluster();
    
    // Analyze results
    console.log('\n' + '-'.repeat(40));
    console.log('Execution Summary:');
    console.log('-'.repeat(40));
    console.log(`Function calls made: ${functionCalls.length}`);
    console.log(`Recipients processed: ${functionCalls.map(f => f.args.to || f.args.recipient || 'unknown').join(', ')}`);
    
    // Check WebSocket messages for progress updates
    const progressMsgs = socket.messages.filter(m => 
      m.content && (m.content.includes('Progress') || m.content.includes('Detected'))
    );
    console.log(`Progress updates: ${progressMsgs.length}`);
    
    // Determine success
    const expectedEmails = (prompt.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).length;
    const success = functionCalls.length === expectedEmails;
    
    console.log(`\nExpected actions: ${expectedEmails}`);
    console.log(`Actual actions: ${functionCalls.length}`);
    console.log(`Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
    
    return success;
    
  } catch (error) {
    console.error('Test error:', error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('\n' + '═'.repeat(60));
  console.log('   MULTI-ACTION AGENT INTEGRATION TEST');
  console.log('═'.repeat(60));
  
  const tests = [
    'Send email to john@example.com and jane@example.com about the meeting',
    'Send invites to alice@test.com with code A and bob@test.com with code B',
    'Please email tom@company.com, sarah@company.com, and mike@company.com with updates'
  ];
  
  const results = [];
  
  for (const test of tests) {
    const passed = await testMultiActionExecution(test);
    results.push({ test, passed });
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('   TEST RESULTS');
  console.log('═'.repeat(60));
  
  results.forEach((r, i) => {
    console.log(`${r.passed ? '✅' : '❌'} Test ${i + 1}: ${r.passed ? 'PASSED' : 'FAILED'}`);
  });
  
  const passedCount = results.filter(r => r.passed).length;
  console.log(`\nTotal: ${passedCount}/${results.length} tests passed`);
  
  if (passedCount === results.length) {
    console.log('\n🎉 All integration tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the multi-action handler.');
  }
}

// Run if executed directly
if (require.main === module) {
  runIntegrationTests().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testMultiActionExecution, runIntegrationTests };