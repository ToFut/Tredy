#!/usr/bin/env node

/**
 * Live test of @flow command through the actual chat system
 */

const { v4: uuidv4 } = require('uuid');

// Direct test through the server modules
async function testFlowCommand() {
  console.log('🧪 Testing @flow command...\n');
  
  // Import server modules
  const { streamChatWithWorkspace } = require('./server/utils/chats/stream');
  const { Workspace } = require('./server/models/workspace');
  
  // Get a workspace
  const workspaces = await Workspace.where();
  if (!workspaces.length) {
    console.log('❌ No workspaces found');
    return;
  }
  
  const workspace = workspaces[0];
  console.log(`📁 Using workspace: ${workspace.name}\n`);
  
  // Mock response object to capture output
  const chunks = [];
  const mockResponse = {
    write: (chunk) => {
      chunks.push(chunk);
      // Parse and log important events
      const lines = chunk.split('\n');
      lines.forEach(line => {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'agentInitWebsocketConnection') {
              console.log('✅ Agent WebSocket initialized');
            } else if (data.type === 'agentThinking') {
              console.log(`🤖 Agent: ${data.agentName || 'thinking'}`);
            } else if (data.textResponse) {
              console.log(`💬 ${data.textResponse}`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      });
    },
    end: () => console.log('\n✅ Response stream ended')
  };
  
  // Test the @flow command
  const flowMessage = '@flow send daily weather report email to team';
  console.log(`📝 Sending: "${flowMessage}"\n`);
  
  try {
    await streamChatWithWorkspace(
      mockResponse,
      workspace,
      flowMessage,
      'chat',
      null,  // user
      null   // thread
    );
    
    console.log('\n📊 Response chunks received:', chunks.length);
    
    // Check if workflow was created
    setTimeout(async () => {
      const { AgentFlows } = require('./server/utils/agentFlows');
      const flows = await AgentFlows.listFlows();
      console.log('\n🎯 Total workflows:', flows.length);
      
      const latest = flows[flows.length - 1];
      if (latest) {
        console.log('Latest workflow:', latest.name);
        console.log('Status:', latest.status);
        console.log('Visual blocks:', latest.visualBlocks?.length || 0);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testFlowCommand().catch(console.error);