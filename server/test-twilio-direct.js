#!/usr/bin/env node
/**
 * Direct Twilio Test (No Nango Required)
 * Tests Twilio credentials directly
 */

require('dotenv').config({ path: '.env.development' });

async function testTwilioDirect() {
  console.log('🧪 Testing Twilio Directly\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_NUMBER;
  const testNumber = process.env.TEST_WHATSAPP_NUMBER || '+972509055068';

  console.log('📋 Configuration:');
  console.log(`✓ Account SID: ${accountSid?.substring(0, 10)}...`);
  console.log(`✓ Auth Token: ${authToken ? 'Set (hidden)' : '❌ Missing'}`);
  console.log(`✓ From Number: ${twilioNumber}`);
  console.log(`✓ Test Number: ${testNumber}\n`);

  if (!accountSid || !authToken) {
    console.error('❌ Missing Twilio credentials');
    return;
  }

  try {
    // Use Twilio SDK directly
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    console.log('📤 Sending test WhatsApp message...\n');

    const message = await client.messages.create({
      from: `whatsapp:${twilioNumber}`,
      to: `whatsapp:${testNumber}`,
      body: `🧪 Test message from AnythingLLM\nTime: ${new Date().toISOString()}`
    });

    console.log('✅ Message sent successfully!');
    console.log(`📱 Message SID: ${message.sid}`);
    console.log(`📊 Status: ${message.status}`);
    console.log(`💰 Price: ${message.price || 'N/A'} ${message.priceUnit || ''}`);
    console.log(`\n💡 Check ${testNumber} for the message!`);

    // Test getting message details
    console.log('\n📥 Fetching message details...');
    const messageDetails = await client.messages(message.sid).fetch();
    console.log(`✅ Status: ${messageDetails.status}`);
    console.log(`📅 Sent: ${messageDetails.dateSent}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.status === 401) {
      console.error('\n🔧 Authentication failed. Check:');
      console.error('   1. TWILIO_ACCOUNT_SID is correct');
      console.error('   2. TWILIO_AUTH_TOKEN matches your Account SID');
      console.error('   3. Visit: https://console.twilio.com/');
    } else if (error.code === 21606) {
      console.error('\n🔧 WhatsApp not enabled. Check:');
      console.error('   1. Your Twilio number has WhatsApp enabled');
      console.error('   2. Or use sandbox: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn');
    } else {
      console.error('Full error:', error);
    }
  }
}

// Check if twilio is installed
try {
  require.resolve('twilio');
  testTwilioDirect();
} catch (e) {
  console.log('📦 Installing Twilio SDK...');
  require('child_process').execSync('npm install twilio', { stdio: 'inherit' });
  testTwilioDirect();
}