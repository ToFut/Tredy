#!/usr/bin/env node

// Debug SSE connection issue with Zapier MCP
import fetch from 'node-fetch';

const servers = [
  {
    name: 'Zapier',
    url: 'https://mcp.zapier.com/api/mcp/s/NTdlYTE1NGYtYzI5OS00NmVhLTg2N2EtZjA3YWZiZDdjN2E1Ojg3MjNkNGFjLTI2MjItNDU0NS04MmE4LWRmNzg5ZDJhYTgzMQ==/mcp'
  }
];

async function debugSSEConnection(serverConfig) {
  console.log(`🔍 Debugging SSE connection to ${serverConfig.name}...`);
  console.log(`📡 URL: ${serverConfig.url}`);

  try {
    // Test 1: Basic HTTP request
    console.log('\n📋 Test 1: Basic HTTP request...');
    const basicResponse = await fetch(serverConfig.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MCP-Debug/1.0)',
      }
    });
    console.log(`Status: ${basicResponse.status} ${basicResponse.statusText}`);
    const basicText = await basicResponse.text();
    console.log(`Response: ${basicText.slice(0, 200)}...`);

    // Test 2: SSE headers but no connection
    console.log('\n📋 Test 2: SSE headers request...');
    const sseResponse = await fetch(serverConfig.url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Mozilla/5.0 (compatible; MCP-Debug/1.0)',
      }
    });
    console.log(`Status: ${sseResponse.status} ${sseResponse.statusText}`);
    console.log('Headers:', Object.fromEntries(sseResponse.headers));

    // Test 3: Try to read first few bytes of SSE stream with timeout
    console.log('\n📋 Test 3: Reading SSE stream with timeout...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    try {
      const streamResponse = await fetch(serverConfig.url, {
        method: 'GET',
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'User-Agent': 'Mozilla/5.0 (compatible; MCP-Debug/1.0)',
        },
        signal: controller.signal
      });
      
      if (!streamResponse.ok) {
        throw new Error(`HTTP ${streamResponse.status}: ${streamResponse.statusText}`);
      }
      
      console.log('✅ SSE stream opened');
      console.log('Content-Type:', streamResponse.headers.get('content-type'));
      
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let receivedData = '';
      
      // Try to read first chunk
      const readResult = await reader.read();
      if (!readResult.done) {
        const chunk = decoder.decode(readResult.value, { stream: true });
        receivedData += chunk;
        console.log('📨 First chunk received:', chunk.slice(0, 200));
      }
      
      reader.releaseLock();
      clearTimeout(timeoutId);
      
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.log('⏱️  SSE stream timed out (expected - server may be waiting for initial message)');
      } else {
        console.log('❌ SSE stream error:', error.message);
      }
    }

    // Test 4: Try sending an initial MCP message
    console.log('\n📋 Test 4: Testing MCP initialization...');
    
    const initMessage = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'debug-client',
          version: '1.0.0'
        }
      }
    };

    try {
      const mcpResponse = await fetch(serverConfig.url, {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (compatible; MCP-Debug/1.0)',
        },
        body: JSON.stringify(initMessage),
        signal: AbortSignal.timeout(5000)
      });
      
      console.log(`MCP Init Status: ${mcpResponse.status} ${mcpResponse.statusText}`);
      const mcpText = await mcpResponse.text();
      console.log(`MCP Response: ${mcpText.slice(0, 300)}...`);
      
    } catch (error) {
      console.log('⚠️  MCP initialization error:', error.message);
    }

  } catch (error) {
    console.log('❌ Debug test failed:', error.message);
  }
}

// Run debug test
debugSSEConnection(servers[0])
  .then(() => {
    console.log('\n✅ Debug test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal debug error:', error);
    process.exit(1);
  });