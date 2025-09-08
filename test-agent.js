#!/usr/bin/env node

const WebSocket = require('ws');

// Generate a UUID for the agent invocation
const invocationUuid = require('crypto').randomUUID();

console.log('Testing agent with invocation UUID:', invocationUuid);

// Connect to the WebSocket endpoint
const ws = new WebSocket(`ws://localhost:3001/api/agent-invocation/${invocationUuid}`);

let messageCount = 0;

ws.on('open', () => {
  console.log('\n=== WebSocket Connected ===\n');
  
  // Send initial agent message
  const message = {
    type: 'awaitingFeedback',
    feedback: '@agent test message - please acknowledge'
  };
  
  console.log('Sending:', JSON.stringify(message, null, 2));
  ws.send(JSON.stringify(message));
});

ws.on('message', (data) => {
  messageCount++;
  const msg = JSON.parse(data.toString());
  
  console.log(`\n=== Message #${messageCount} ===`);
  console.log('Type:', msg.type);
  console.log('From:', msg.from);
  console.log('To:', msg.to);
  
  if (msg.content) {
    console.log('Content preview:', msg.content.substring(0, 100) + '...');
  }
  
  console.log('Full message:', JSON.stringify(msg, null, 2));
  
  // Auto-exit after receiving a few messages to see the pattern
  if (messageCount >= 5 || msg.type === 'wssFailure') {
    console.log('\n=== Test Complete ===');
    console.log('Total messages received:', messageCount);
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('\n=== WebSocket Closed ===');
  console.log('Total messages received:', messageCount);
  process.exit(0);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('\n=== Timeout after 10 seconds ===');
  console.log('Total messages received:', messageCount);
  ws.close();
  process.exit(0);
}, 10000);