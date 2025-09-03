#!/usr/bin/env node

/**
 * Fix Gmail OAuth Scopes in Nango
 * This script helps configure the correct Gmail scopes
 */

console.log('📧 Gmail OAuth Scope Configuration Guide\n');
console.log('========================================\n');

console.log('The error "Request had insufficient authentication scopes" means');
console.log('your Google OAuth app needs Gmail API permissions.\n');

console.log('STEP 1: Update Nango Integration');
console.log('---------------------------------');
console.log('1. Go to: https://app.nango.dev');
console.log('2. Click "Integrations" in sidebar');
console.log('3. Find your integration (likely "google-mail" or "google")');
console.log('4. Click Edit/Configure');
console.log('5. In the "Scopes" section, ADD these exact scopes:\n');

const requiredScopes = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/userinfo.email'
];

requiredScopes.forEach(scope => {
  console.log(`   ✓ ${scope}`);
});

console.log('\n6. Save the integration\n');

console.log('STEP 2: Update Google Cloud Console (if needed)');
console.log('------------------------------------------------');
console.log('1. Go to: https://console.cloud.google.com');
console.log('2. APIs & Services → OAuth consent screen');
console.log('3. Click "Edit App"');
console.log('4. In "Scopes" section, add:\n');
console.log('   - Gmail API scopes');
console.log('   - .../auth/gmail.readonly');
console.log('   - .../auth/gmail.send');
console.log('   - .../auth/gmail.modify\n');

console.log('STEP 3: Clear Old Connection & Re-authenticate');
console.log('-----------------------------------------------');
console.log('1. In AnythingLLM → Workspace Settings → Connectors');
console.log('2. DISCONNECT Gmail');
console.log('3. Wait 5 seconds');
console.log('4. CONNECT Gmail again');
console.log('5. When Google OAuth opens, you should see:');
console.log('   "This app wants to:');
console.log('   • Read, compose, send, and permanently delete all your email from Gmail"');
console.log('   • See your primary Google Account email address\n');

console.log('⚠️  IMPORTANT: If you DON\'T see Gmail permissions in the OAuth screen,');
console.log('   the scopes aren\'t configured correctly in Nango.\n');

console.log('STEP 4: Test');
console.log('------------');
console.log('After re-connecting, test with:');
console.log('@agent what emails did I get today?\n');

console.log('Current Configuration:');
console.log('---------------------');
console.log('Nango Secret Key:', process.env.NANGO_SECRET_KEY ? '✓ Set' : '✗ Missing');
console.log('Nango Public Key:', process.env.NANGO_PUBLIC_KEY ? '✓ Set' : '✗ Missing');
console.log('Nango Host:', process.env.NANGO_HOST || 'https://api.nango.dev');

// Try to check current connection
const { Nango } = require('@nangohq/node');
const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
  host: process.env.NANGO_HOST || 'https://api.nango.dev'
});

(async () => {
  console.log('\nChecking current connection...');
  
  try {
    const connection = await nango.getConnection('google-mail', 'workspace_4');
    console.log('✓ Connection exists for workspace_4');
    console.log('  Created:', new Date(connection.created_at).toLocaleString());
    
    // The connection exists but lacks Gmail scopes
    console.log('\n⚠️  Connection exists but lacks Gmail API scopes.');
    console.log('   You MUST disconnect and reconnect after adding scopes in Nango!');
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✗ No connection found for workspace_4');
      console.log('  You need to connect Gmail in AnythingLLM first');
    } else {
      console.log('✗ Error checking connection:', error.message);
    }
  }
  
  console.log('\n========================================');
  console.log('Follow the steps above to fix Gmail access');
})();