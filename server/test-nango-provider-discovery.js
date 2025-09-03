#!/usr/bin/env node

/**
 * Test Nango Provider Discovery
 * Tests the dynamic provider config key detection
 */

const { NangoIntegration } = require('./utils/connectors/nango-integration');

async function testNangoProviderDiscovery() {
  console.log('🧪 Testing Nango Provider Discovery\n');

  try {
    if (!process.env.NANGO_SECRET_KEY) {
      console.log('⚠️  NANGO_SECRET_KEY not set - this will test fallback behavior only\n');
    }

    console.log('Step 1: Initialize Nango Integration');
    const nango = new NangoIntegration();
    console.log('✅ Nango integration initialized\n');

    console.log('Step 2: Test Provider Config Key Discovery');
    
    const testProviders = ['gmail', 'linkedin', 'slack', 'github', 'shopify'];
    
    for (const provider of testProviders) {
      console.log(`Testing ${provider}:`);
      try {
        const authConfig = await nango.getAuthConfig(provider, 'test-workspace');
        console.log(`  ✅ Provider Config Key: ${authConfig.providerConfigKey}`);
        console.log(`  ✅ Connection ID: ${authConfig.connectionId}`);
        console.log(`  ✅ Has Public Key: ${!!authConfig.publicKey}`);
        console.log(`  ✅ Auth URL: ${authConfig.authUrl}\n`);
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}\n`);
      }
    }

    console.log('Step 3: Test Provider Config Key Helper Method');
    
    if (nango.nango) {
      for (const provider of testProviders) {
        try {
          const providerConfigKey = await nango.getProviderConfigKey(provider);
          console.log(`${provider} → ${providerConfigKey}`);
        } catch (error) {
          console.log(`${provider} → Error: ${error.message}`);
        }
      }
    } else {
      console.log('Nango not initialized - cannot test provider config key discovery');
    }

    console.log('\n🎉 Nango Provider Discovery Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
if (require.main === module) {
  testNangoProviderDiscovery();
}

module.exports = { testNangoProviderDiscovery };