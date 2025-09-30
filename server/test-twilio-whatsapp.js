#!/usr/bin/env node

/**
 * Simple Twilio WhatsApp Test Runner
 * Quick test to verify basic WhatsApp functionality
 */

require('dotenv').config({ path: '.env.development' });

console.log('🧪 Testing Twilio WhatsApp MCP Tools\n');

// Check environment variables
console.log('📋 Environment Check:');
console.log(`✓ NANGO_SECRET_KEY: ${process.env.NANGO_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ NANGO_HOST: ${process.env.NANGO_HOST || 'Not set'}`);
console.log(`✓ TWILIO_ACCOUNT_SID: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ TWILIO_AUTH_TOKEN: ${process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`✓ TWILIO_NUMBER: ${process.env.TWILIO_NUMBER || 'Not set'}`);

console.log('\n' + '═'.repeat(60));

// Test phone number (you need to set this)
const TEST_PHONE_NUMBER = process.env.TEST_WHATSAPP_NUMBER || '+972509055068';

if (TEST_PHONE_NUMBER === '+972509055068') {
  console.log('✅ Using default test phone number: +972509055068');
  console.log('   To use a different number, set TEST_WHATSAPP_NUMBER environment variable');
  console.log('   Example: export TEST_WHATSAPP_NUMBER="+15551234567"');
}

async function testBasicFunctionality() {
  console.log('\n🚀 Starting Basic Functionality Test\n');

  try {
    // Load MCP Tools
    const TwilioWhatsAppMCPTools = require('./twilio-whatsapp-mcp-tools.js');
    const mcpTools = new TwilioWhatsAppMCPTools();

    console.log('✅ MCP Tools loaded successfully');

    // Test 1: Send a simple WhatsApp message
    console.log('\n📤 Test 1: Sending WhatsApp message...');

    const sendArgs = {
      to: TEST_PHONE_NUMBER,
      body: `🧪 Test message from Twilio WhatsApp MCP Tools\nTime: ${new Date().toISOString()}`,
      workspaceId: 'workspace_144'
    };

    const sendResult = await mcpTools.sendWhatsAppMessage(sendArgs, 'workspace_144');

    if (sendResult.isError) {
      console.log('❌ Send message failed:', sendResult.content[0].text);
    } else {
      console.log('✅ Message sent successfully!');
      console.log('Response preview:', sendResult.content[0].text.substring(0, 200) + '...');

      // Extract message SID for next test
      const sidMatch = sendResult.content[0].text.match(/SID: (\w+)/);
      if (sidMatch) {
        const messageSid = sidMatch[1];
        console.log(`💾 Message SID: ${messageSid}`);

        // Test 2: Get message details
        console.log('\n🔍 Test 2: Getting message details...');

        // Wait a moment for message to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        const detailsArgs = {
          messageSid: messageSid,
          workspaceId: 'workspace_144'
        };

        const detailsResult = await mcpTools.getWhatsAppMessageDetails(detailsArgs, 'workspace_144');

        if (detailsResult.isError) {
          console.log('❌ Get message details failed:', detailsResult.content[0].text);
        } else {
          console.log('✅ Message details retrieved successfully!');
          console.log('Details preview:', detailsResult.content[0].text.substring(0, 300) + '...');
        }
      }
    }

    // Test 3: Get recent WhatsApp messages
    console.log('\n📥 Test 3: Getting recent WhatsApp messages...');

    const getArgs = {
      limit: 5,
      workspaceId: 'workspace_144'
    };

    const getResult = await mcpTools.getWhatsAppMessages(getArgs, 'workspace_144');

    if (getResult.isError) {
      console.log('❌ Get messages failed:', getResult.content[0].text);
    } else {
      console.log('✅ Messages retrieved successfully!');
      console.log('Messages preview:', getResult.content[0].text.substring(0, 300) + '...');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }

  return true;
}

async function main() {
  console.log('📱 Test Target: ' + TEST_PHONE_NUMBER);
  console.log('🏢 Workspace: workspace_144');

  const success = await testBasicFunctionality();

  console.log('\n' + '═'.repeat(60));

  if (success) {
    console.log('🎉 Basic functionality test completed!');
    console.log('\n💡 Next steps:');
    console.log('   1. Check your WhatsApp for the test message');
    console.log('   2. Run full test suite: node twilio-whatsapp-integration.test.js');
    console.log('   3. Set up Nango integration for production use');
  } else {
    console.log('❌ Test failed. Check the error messages above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify your Twilio credentials in .env.development');
    console.log('   2. Check that your Twilio account has WhatsApp enabled');
    console.log('   3. Ensure your test phone number is in E.164 format');
    console.log('   4. Verify Nango integration is properly configured');
  }

  console.log('\n📚 For more info, see: https://docs.twilio.com/whatsapp/quickstart');
}

// Run the test
main().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});