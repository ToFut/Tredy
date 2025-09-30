#!/usr/bin/env node
/**
 * Simple Twilio Test using axios (no twilio SDK needed)
 */

require('dotenv').config({ path: '.env.development' });

async function testTwilio() {
  console.log('🧪 Testing Twilio API Directly\n');

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_NUMBER;
  const testNumber = process.env.TEST_WHATSAPP_NUMBER || '+972509055068';

  console.log('📋 Configuration:');
  console.log(`✓ Account SID: ${accountSid?.substring(0, 10)}...`);
  console.log(`✓ Auth Token: ${authToken ? '✅ Set' : '❌ Missing'}`);
  console.log(`✓ From Number: ${twilioNumber}`);
  console.log(`✓ Test Number: ${testNumber}\n`);

  if (!accountSid || !authToken) {
    console.error('❌ Missing Twilio credentials in .env.development');
    return;
  }

  try {
    const axios = require('axios');
    const querystring = require('querystring');

    const data = querystring.stringify({
      From: `whatsapp:${twilioNumber}`,
      To: `whatsapp:${testNumber}`,
      Body: `🚀 Hello from Tredy!\n\nThis is a test message from your Tredy AI assistant.\nTime: ${new Date().toLocaleString()}`
    });

    console.log('📤 Sending WhatsApp message via Twilio API...\n');

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      data,
      {
        auth: {
          username: accountSid,
          password: authToken
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('✅ Message sent successfully!');
    console.log(`📱 Message SID: ${response.data.sid}`);
    console.log(`📊 Status: ${response.data.status}`);
    console.log(`💰 Price: ${response.data.price || 'N/A'}`);
    console.log(`\n💡 Check ${testNumber} for the WhatsApp message!`);
    console.log('\n✅ Twilio integration is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.error('\n🔧 Authentication Error (401):');
      console.error('   1. Double-check TWILIO_ACCOUNT_SID in .env.development');
      console.error('   2. Double-check TWILIO_AUTH_TOKEN in .env.development');
      console.error('   3. Verify at: https://console.twilio.com/');
    } else if (error.response?.data?.code === 21606) {
      console.error('\n🔧 WhatsApp Not Enabled:');
      console.error('   Your number does not have WhatsApp enabled.');
      console.error('   Use Twilio Sandbox: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn');
    } else if (error.response?.data) {
      console.error('\n🔧 Twilio Error:');
      console.error(`   Code: ${error.response.data.code}`);
      console.error(`   Message: ${error.response.data.message}`);
      console.error(`   More info: ${error.response.data.more_info}`);
    }
  }
}

testTwilio();