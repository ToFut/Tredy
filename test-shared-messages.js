#!/usr/bin/env node

/**
 * Test script to verify that messages are shared between users in the same workspace
 * Run this after the server is started
 */

const API_BASE = 'http://localhost:3001/api';

async function testSharedMessages() {
  console.log('Testing shared workspace messages...\n');
  
  // You need to have two users logged in to test this
  // Replace these with actual tokens from two different logged-in users
  const user1Token = 'YOUR_USER1_TOKEN_HERE'; // Admin token
  const user2Token = 'YOUR_USER2_TOKEN_HERE'; // Default user token
  const workspaceSlug = 'YOUR_WORKSPACE_SLUG_HERE'; // Workspace slug both users have access to
  
  if (user1Token === 'YOUR_USER1_TOKEN_HERE' || user2Token === 'YOUR_USER2_TOKEN_HERE') {
    console.log('⚠️  Please update the tokens in this script with actual JWT tokens from two logged-in users');
    console.log('You can get these from the browser\'s localStorage after logging in');
    console.log('Look for: localStorage.getItem("anythingllm_authToken")');
    return;
  }
  
  try {
    // 1. User1 sends a message
    console.log('1. User1 sending a message...');
    const sendResponse = await fetch(`${API_BASE}/workspace/${workspaceSlug}/stream-chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${user1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello from User1! This is a test message.'
      })
    });
    
    if (!sendResponse.ok) {
      console.error('Failed to send message as User1:', sendResponse.status);
      return;
    }
    console.log('✅ Message sent by User1');
    
    // 2. User2 fetches chat history
    console.log('\n2. User2 fetching chat history...');
    const historyResponse = await fetch(`${API_BASE}/workspace/${workspaceSlug}/chats`, {
      headers: {
        'Authorization': `Bearer ${user2Token}`,
      }
    });
    
    if (!historyResponse.ok) {
      console.error('Failed to fetch history as User2:', historyResponse.status);
      return;
    }
    
    const { history } = await historyResponse.json();
    console.log(`✅ User2 received ${history.length} messages`);
    
    // 3. Check if User2 can see User1's message
    const user1Message = history.find(msg => 
      msg.prompt?.includes('Hello from User1')
    );
    
    if (user1Message) {
      console.log('✅ SUCCESS: User2 can see User1\'s message!');
      console.log('Message details:', {
        prompt: user1Message.prompt,
        user: user1Message.user,
        timestamp: user1Message.createdAt
      });
    } else {
      console.log('❌ FAILED: User2 cannot see User1\'s message');
      console.log('Messages User2 can see:', history.map(h => ({
        prompt: h.prompt?.substring(0, 50) + '...',
        user: h.user
      })));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Instructions
console.log('='.repeat(60));
console.log('SHARED WORKSPACE MESSAGE TEST');
console.log('='.repeat(60));
console.log('\nPrerequisites:');
console.log('1. Have two users created in the system');
console.log('2. Both users must have access to the same workspace');
console.log('3. Get JWT tokens for both users from browser localStorage');
console.log('4. Update the tokens and workspace slug in this script');
console.log('='.repeat(60));
console.log('\n');

testSharedMessages();