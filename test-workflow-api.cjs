const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Test configuration
const API_BASE = 'http://localhost:3001';
const WS_BASE = 'ws://localhost:3001';
const WORKSPACE_SLUG = 'test-workspace';

async function getAuthToken() {
  // For development, using basic auth
  const authResponse = await fetch(`${API_BASE}/api/request-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin'
    })
  });
  
  if (!authResponse.ok) {
    console.log('Auth failed, trying without token');
    return null;
  }
  
  const data = await authResponse.json();
  return data.token;
}

async function testWorkflowCreation() {
  console.log('🚀 Starting workflow creation test...\n');
  
  const token = await getAuthToken();
  const sessionId = uuidv4();
  
  // Connect to WebSocket for agent invocation
  const wsUrl = `${WS_BASE}/api/agent-invocation/${sessionId}`;
  console.log(`📡 Connecting to WebSocket: ${wsUrl}\n`);
  
  const ws = new WebSocket(wsUrl, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  
  return new Promise((resolve, reject) => {
    let messageCount = 0;
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected\n');
      
      // Test cases
      const testMessages = [
        {
          type: 'workflow_creation',
          message: '@agent create workflow send to segev@example.com news list and then to admin@example.com all mail summary from yesterday',
          description: 'Testing sequential email workflow'
        },
        {
          type: 'simple_workflow',
          message: '@agent create workflow send email then invite to meeting',
          description: 'Testing simple workflow with two steps'
        },
        {
          type: 'test_plugin',
          message: '@agent test workflow plugin with message "Hello from API test"',
          description: 'Testing plugin function directly'
        },
        {
          type: 'list_workflows',
          message: '@agent list my workflows',
          description: 'Testing workflow listing'
        }
      ];
      
      // Send first test message
      const firstTest = testMessages[0];
      console.log(`📤 Test 1: ${firstTest.description}`);
      console.log(`   Message: "${firstTest.message}"\n`);
      
      ws.send(JSON.stringify({
        type: 'chat',
        workspaceSlug: WORKSPACE_SLUG,
        message: firstTest.message,
        sessionId: sessionId,
        userId: 'test-user'
      }));
    });
    
    ws.on('message', (data) => {
      messageCount++;
      try {
        const response = JSON.parse(data.toString());
        
        console.log(`📥 Response #${messageCount}:`);
        console.log('   Type:', response.type || 'unknown');
        
        if (response.type === 'workflowPreview') {
          console.log('   ✨ Workflow Preview Received!');
          console.log('   Workflow ID:', response.workflowId);
          console.log('   Workflow Name:', response.workflow?.name);
          console.log('   Steps Count:', response.workflow?.stepsCount);
          console.log('\n   Preview:');
          console.log(response.preview);
        } else if (response.type === 'agent_response') {
          console.log('   Agent says:', response.message?.substring(0, 100) + '...');
        } else if (response.type === 'function_call') {
          console.log('   Function called:', response.function);
          console.log('   Parameters:', JSON.stringify(response.parameters, null, 2));
        } else {
          console.log('   Content:', JSON.stringify(response, null, 2).substring(0, 200) + '...');
        }
        
        console.log('\n' + '─'.repeat(60) + '\n');
        
        // Close after receiving enough responses
        if (messageCount >= 5) {
          console.log('✅ Test completed successfully!');
          ws.close();
          resolve();
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
        console.log('   Raw data:', data.toString().substring(0, 200));
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket disconnected');
      resolve();
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
      console.log('⏱️ Test timeout reached, closing connection...');
      ws.close();
      resolve();
    }, 30000);
  });
}

// Run the test
testWorkflowCreation()
  .then(() => {
    console.log('\n🎉 All tests completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });