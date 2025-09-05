#!/usr/bin/env node

/**
 * Start Webhook Proxy for Nango
 * Exposes local webhook endpoint via ngrok for Nango webhooks
 */

const { spawn } = require('child_process');
const axios = require('axios');

async function startWebhookProxy() {
  console.log('🚀 Starting Webhook Proxy for Nango\n');
  
  const PORT = process.env.SERVER_PORT || 3001;
  
  // Check if server is running
  try {
    await axios.get(`http://localhost:${PORT}/api/ping`);
    console.log(`✅ Server is running on port ${PORT}`);
  } catch (error) {
    console.log(`⚠️ Server doesn't appear to be running on port ${PORT}`);
    console.log('Start the server first with: yarn dev:server\n');
  }
  
  // Start ngrok
  console.log(`\n📡 Starting ngrok tunnel to localhost:${PORT}...`);
  
  const ngrok = spawn('ngrok', ['http', PORT.toString()], {
    stdio: 'inherit'
  });
  
  ngrok.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('\n❌ ngrok not found. Install it with:');
      console.error('   macOS: brew install ngrok');
      console.error('   or download from: https://ngrok.com/download\n');
    } else {
      console.error('❌ Error starting ngrok:', err);
    }
    process.exit(1);
  });
  
  // Wait a moment for ngrok to start
  setTimeout(() => {
    console.log('\n📋 Ngrok Started! Check the terminal for your webhook URL.');
    console.log('\n🔗 Your webhook URL will be something like:');
    console.log('   https://[random-id].ngrok-free.app/webhooks-from-nango\n');
    console.log('📝 To configure in Nango:');
    console.log('1. Go to Nango Dashboard > Settings > Environment');
    console.log('2. Set Webhook URL to: https://[your-ngrok-url]/webhooks-from-nango');
    console.log('3. Save the settings\n');
    console.log('✅ Webhook endpoint is ready at:');
    console.log(`   POST /webhooks-from-nango`);
    console.log('\n🛑 Press Ctrl+C to stop the proxy\n');
  }, 3000);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping webhook proxy...');
    ngrok.kill();
    process.exit(0);
  });
}

startWebhookProxy().catch(console.error);