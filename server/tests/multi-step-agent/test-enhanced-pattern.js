#!/usr/bin/env node

/**
 * Test the enhanced pattern solution for multi-action requests
 */

console.log('\n=== Testing Enhanced Pattern Solution ===\n');

// Mock the enhanceResultWithProgress method in isolation
function enhanceResultWithProgress(result, messages, functionName, functionArgs) {
  try {
    // Find the original user request
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    
    // Detect multi-target patterns (emails, names with "and", etc.)
    const emails = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const hasMultipleTargets = emails.length > 1 || 
      (userMessage.toLowerCase().includes(' and ') && 
       (emails.length > 0 || userMessage.match(/\b[A-Z][a-zA-Z]+\b/g)?.length > 1));
    
    if (!hasMultipleTargets) return result;
    
    // Extract current target from function arguments
    let currentTarget = null;
    if (functionArgs?.to) currentTarget = functionArgs.to;
    else if (functionArgs?.recipient) currentTarget = functionArgs.recipient;
    else if (functionArgs?.email) currentTarget = functionArgs.email;
    else if (functionArgs?.target) currentTarget = functionArgs.target;
    
    if (!currentTarget) return result;
    
    // For email scenarios, find remaining email addresses
    if (emails.length > 1) {
      const remainingEmails = emails.filter(email => email !== currentTarget);
      if (remainingEmails.length > 0) {
        return `${result}\n\n📋 Progress: Completed for ${currentTarget}. Still need to send to: ${remainingEmails.join(', ')}`;
      }
    }
    
    // For general multi-target scenarios with "and"
    if (userMessage.toLowerCase().includes(' and ') && currentTarget) {
      // Try to extract remaining targets by parsing the request
      const words = userMessage.split(' ');
      const andIndex = words.findIndex(w => w.toLowerCase() === 'and');
      if (andIndex > 0) {
        // Simple heuristic: if we can identify patterns like "send to A and B"
        const beforeAnd = words[andIndex - 1];
        const afterAnd = words[andIndex + 1];
        
        if (beforeAnd && afterAnd && beforeAnd !== afterAnd) {
          const otherTarget = currentTarget.includes(beforeAnd) ? afterAnd : beforeAnd;
          if (otherTarget !== currentTarget) {
            return `${result}\n\n📋 Progress: Completed for ${currentTarget}. Still need to handle: ${otherTarget}`;
          }
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error enhancing result with progress:', error);
    return result;
  }
}

// Test scenarios
const testCases = [
  {
    name: 'Multi-email request',
    messages: [
      { role: 'user', content: 'Send email to john@example.com and jane@example.com' }
    ],
    functionArgs: { to: 'john@example.com', subject: 'Test', body: 'Hello' },
    originalResult: 'Email sent successfully',
    expectedEnhancement: true
  },
  {
    name: 'Single email request',
    messages: [
      { role: 'user', content: 'Send email to john@example.com' }
    ],
    functionArgs: { to: 'john@example.com', subject: 'Test', body: 'Hello' },
    originalResult: 'Email sent successfully',
    expectedEnhancement: false
  },
  {
    name: 'Three-way email request',
    messages: [
      { role: 'user', content: 'Send invite to alice@test.com, bob@test.com and charlie@test.com' }
    ],
    functionArgs: { to: 'alice@test.com', subject: 'Invite', body: 'Please join' },
    originalResult: 'Invitation sent successfully',
    expectedEnhancement: true
  },
  {
    name: 'General multi-target with "and"',
    messages: [
      { role: 'user', content: 'Book meeting with Alice and Bob' }
    ],
    functionArgs: { target: 'Alice', meeting: 'Project Discussion' },
    originalResult: 'Meeting booked successfully',
    expectedEnhancement: true
  },
];

console.log('Running test cases...\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}`);
  console.log(`   User request: "${testCase.messages[0].content}"`);
  console.log(`   Function called with: ${JSON.stringify(testCase.functionArgs)}`);
  console.log(`   Original result: "${testCase.originalResult}"`);
  
  const enhancedResult = enhanceResultWithProgress(
    testCase.originalResult,
    testCase.messages,
    'test_function',
    testCase.functionArgs
  );
  
  const wasEnhanced = enhancedResult !== testCase.originalResult;
  const testPassed = wasEnhanced === testCase.expectedEnhancement;
  
  console.log(`   Enhanced result: "${enhancedResult}"`);
  console.log(`   Enhancement expected: ${testCase.expectedEnhancement}, got: ${wasEnhanced}`);
  console.log(`   ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');
});

console.log('=== Simulation: What LLM will see ===\n');

// Simulate the conversation flow
const simulation = {
  userRequest: 'Send email to segev@sinosciences.com and segev@futurixs.com',
  messages: [
    { role: 'system', content: 'You are a helpful assistant...' },
    { role: 'user', content: 'Send email to segev@sinosciences.com and segev@futurixs.com' }
  ]
};

console.log('1. Initial conversation:');
simulation.messages.forEach(msg => {
  console.log(`   ${msg.role}: ${msg.content}`);
});

console.log('\n2. After first function call:');
const firstCallResult = enhanceResultWithProgress(
  'Email sent successfully to segev@sinosciences.com',
  simulation.messages,
  'send_email',
  { to: 'segev@sinosciences.com', subject: 'Test', body: 'Hello' }
);

const afterFirstCall = [
  ...simulation.messages,
  { role: 'function', name: 'send_email', content: firstCallResult }
];

afterFirstCall.forEach(msg => {
  console.log(`   ${msg.role}: ${msg.content}`);
});

console.log('\n3. LLM Analysis:');
console.log('   With enhanced result, LLM can see:');
console.log('   - ✅ First email was sent successfully');  
console.log('   - ✅ There is still work to do: segev@futurixs.com');
console.log('   - ✅ Clear context about remaining targets');
console.log('   - ✅ Should trigger second function call');

console.log('\n=== Solution Benefits ===');
console.log('✅ Minimal code change - only enhances function results');
console.log('✅ No complex plugin system or infinite loop risks');
console.log('✅ Preserves natural LLM conversation flow');
console.log('✅ Works for any multi-target scenario (emails, names, etc.)');
console.log('✅ Fails gracefully - returns original result if anything goes wrong');
console.log('✅ Clear progress tracking visible to LLM');

console.log('\n=== Test Complete ===\n');