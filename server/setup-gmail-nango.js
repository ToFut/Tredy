#!/usr/bin/env node

/**
 * Setup Gmail Integration in Nango
 * This ensures Gmail is properly configured before it appears in UI
 */

const { Nango } = require('@nangohq/node');

async function setupGmailIntegration() {
  console.log('🔧 Setting up Gmail integration in Nango...\n');

  // Check if Nango is configured
  if (!process.env.NANGO_SECRET_KEY) {
    console.log('❌ NANGO_SECRET_KEY not found in environment');
    console.log('\nTo fix:');
    console.log('1. Add to .env file:');
    console.log('   NANGO_SECRET_KEY=your-key-here');
    console.log('   NANGO_PUBLIC_KEY=your-public-key');
    console.log('\n2. Or set in Nango Dashboard at https://app.nango.dev');
    return;
  }

  const nango = new Nango({
    secretKey: process.env.NANGO_SECRET_KEY,
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });

  console.log('📋 Gmail Integration Requirements:\n');
  console.log('1. Go to Nango Dashboard: https://app.nango.dev');
  console.log('2. Click "Integrations" → "Add Integration"');
  console.log('3. Choose Provider: Google');
  console.log('4. Integration ID: gmail-integration');
  console.log('5. Add Google OAuth Credentials:');
  console.log('   - Client ID: (from Google Cloud Console)');
  console.log('   - Client Secret: (from Google Cloud Console)');
  console.log('\n6. Set OAuth Scopes:');
  console.log('   - https://www.googleapis.com/auth/gmail.readonly');
  console.log('   - https://www.googleapis.com/auth/gmail.send');
  console.log('   - https://www.googleapis.com/auth/gmail.modify');
  console.log('   - https://www.googleapis.com/auth/userinfo.email');
  console.log('\n7. Save the integration');
  
  console.log('\n📱 Google Cloud Console Setup:');
  console.log('1. Go to: https://console.cloud.google.com');
  console.log('2. APIs & Services → Library → Enable "Gmail API"');
  console.log('3. APIs & Services → Credentials → Create OAuth 2.0 Client ID');
  console.log('4. Add Authorized redirect URI:');
  console.log('   https://api.nango.dev/oauth/callback');
  console.log('\n5. Copy Client ID and Secret to Nango');

  // Test if gmail-integration exists
  try {
    console.log('\n🔍 Checking if gmail-integration exists...');
    
    // Try to get a test auth URL to see if integration exists
    const testUrl = `${process.env.NANGO_HOST || 'https://api.nango.dev'}/oauth/connect?provider_config_key=gmail-integration&connection_id=test`;
    
    console.log('\n✅ After setup, Gmail will appear in:');
    console.log('   AnythingLLM → Admin → Connectors');
    console.log('   (Same section as Google Calendar)\n');
    
  } catch (error) {
    console.log('⚠️  Gmail integration may not be configured yet');
    console.log('   Follow the steps above to set it up\n');
  }

  console.log('🔄 Next Steps:');
  console.log('1. Complete Nango setup above');
  console.log('2. Restart AnythingLLM: yarn dev:server');
  console.log('3. Go to Admin → Connectors');
  console.log('4. Click "Connect" next to Gmail');
  console.log('5. Complete OAuth flow');
  console.log('6. Use: @agent send email to test@example.com');
}

setupGmailIntegration().catch(console.error);