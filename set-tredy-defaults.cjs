#!/usr/bin/env node

// Script to set Tredy welcome messages as defaults
const { WelcomeMessages } = require('./server/models/welcomeMessages');

async function setTredyDefaults() {
  console.log('🚀 Setting Tredy welcome messages as defaults...');
  
  try {
    // Initialize defaults (will only set if no messages exist)
    await WelcomeMessages.initializeDefaults();
    
    // Get current message count
    const messages = await WelcomeMessages.getMessages();
    console.log(`✅ Tredy default messages are now active (${messages.length} messages)`);
    console.log('\n📝 Welcome messages preview:');
    messages.forEach((msg, i) => {
      console.log(`${i + 1}. User: "${msg.user}"`);
      console.log(`   Response: ${msg.response.substring(0, 100)}...`);
      console.log('');
    });
    
    console.log('🎉 Tredy welcome messages are now the default for new workspaces!');
    
  } catch (error) {
    console.error('❌ Error setting Tredy defaults:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  setTredyDefaults().then(() => process.exit(0));
}

module.exports = { setTredyDefaults };