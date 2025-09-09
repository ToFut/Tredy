#!/usr/bin/env node

/**
 * Test script for @flow command functionality
 * This simulates a user sending a @flow command to test the visual workflow builder
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testFlowCommand() {
  console.log('🧪 Testing @flow command implementation...\n');
  
  try {
    // First, get workspace info
    console.log('1. Getting workspace info...');
    const workspacesResponse = await axios.get(`${API_BASE}/workspaces`);
    const workspaces = workspacesResponse.data.workspaces || [];
    
    if (workspaces.length === 0) {
      console.log('❌ No workspaces found. Please create a workspace first.');
      return;
    }
    
    const workspace = workspaces[0];
    console.log(`✅ Using workspace: ${workspace.name} (${workspace.slug})\n`);
    
    // Test 1: Simple flow command
    console.log('2. Testing simple @flow command...');
    const simpleFlowMessage = '@flow send email to segev@sinosciences.com with Hello';
    console.log(`   Message: "${simpleFlowMessage}"`);
    
    const simpleResponse = await axios.post(
      `${API_BASE}/workspace/${workspace.slug}/chat`,
      {
        message: simpleFlowMessage,
        mode: 'chat'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   Response received:', simpleResponse.status === 200 ? '✅' : '❌');
    
    // Wait a bit for workflow to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 2: Complex flow command
    console.log('\n3. Testing complex @flow command...');
    const complexFlowMessage = '@flow analyze sales data then generate charts and send report';
    console.log(`   Message: "${complexFlowMessage}"`);
    
    const complexResponse = await axios.post(
      `${API_BASE}/workspace/${workspace.slug}/chat`,
      {
        message: complexFlowMessage,
        mode: 'chat'
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('   Response received:', complexResponse.status === 200 ? '✅' : '❌');
    
    // Wait for workflow creation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if workflows were created
    console.log('\n4. Checking created workflows...');
    const flowsResponse = await axios.get(`${API_BASE}/workspace/${workspace.slug}/agent-flows`);
    const flows = flowsResponse.data.flows || [];
    
    console.log(`   Found ${flows.length} workflow(s)`);
    
    if (flows.length > 0) {
      console.log('\n   Recent workflows:');
      flows.slice(-2).forEach(flow => {
        console.log(`   - ${flow.name}: ${flow.description || 'No description'}`);
        console.log(`     Status: ${flow.status || 'unknown'}`);
        console.log(`     Blocks: ${flow.visualBlocks ? flow.visualBlocks.length : 0}`);
      });
    }
    
    console.log('\n✅ Test completed!');
    console.log('Check the Flow Panel in the UI to see the visual workflow builder in action.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testFlowCommand();