#!/usr/bin/env node

/**
 * Test Gmail Nango Integration Key
 */

const { Nango } = require('@nangohq/node');

async function testGmailKey() {
  console.log('🔍 Testing Gmail integration key in Nango...\n');

  const nango = new Nango({
    secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });

  const testKeys = ['gmail', 'gmail-integration'];
  
  for (const key of testKeys) {
    console.log(`Testing key: "${key}"`);
    
    try {
      // Try to get a connection with this key
      const testConnection = await nango.getConnection(key, 'test-connection');
      console.log(`✓ Key "${key}" works! Connection exists.`);
    } catch (error) {
      if (error.message?.includes('not found')) {
        // Connection doesn't exist, but the integration might
        console.log(`? Key "${key}" - No connection found (integration might exist)`);
        
        // Try to check if we can use proxy with it
        try {
          await nango.proxy({
            method: 'GET',
            endpoint: '/test',
            connectionId: 'test',
            providerConfigKey: key
          });
          console.log(`  └─ Integration "${key}" seems to exist`);
        } catch (proxyError) {
          if (proxyError.message?.includes('Provider Config')) {
            console.log(`  └─ ✗ Integration "${key}" does NOT exist`);
          } else {
            console.log(`  └─ ? Cannot verify: ${proxyError.message?.substring(0, 50)}`);
          }
        }
      } else {
        console.log(`! Error with "${key}": ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('\n📋 Summary:');
  console.log('If you see "Provider Config" errors, that integration key doesn\'t exist in Nango.');
  console.log('The correct key is the one that doesn\'t give a "Provider Config" error.\n');
  console.log('Your Nango Gmail integration should use one of these keys.');
  console.log('Update the code to use the working key.');
}

testGmailKey().catch(console.error);