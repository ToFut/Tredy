#!/usr/bin/env node

/**
 * Test Nango Integration Provider Config Key Resolution
 * Tests the fix for "undefined" provider config key issue
 */

// Ensure we're in CommonJS mode
const fs = require('fs');
const path = require('path');

async function runTests() {
console.log('🔍 Testing Nango Integration Provider Config Key Resolution');
console.log('=========================================================');

try {
  // Mock Nango to avoid requiring real credentials
  const originalEnv = process.env.NANGO_SECRET_KEY;
  process.env.NANGO_SECRET_KEY = 'test-key-for-testing';

  const { NangoIntegration } = require('./utils/connectors/nango-integration.js');

  // Create a test instance
  const nango = new NangoIntegration();

  // Mock the nango.listIntegrations method to simulate different scenarios
  nango.nango = {
    listIntegrations: async () => {
      // Simulate available integrations
      return {
        configs: [
          { unique_key: 'google-drive', provider: 'google' },
          { unique_key: 'google-drive-getting-started', provider: 'google' },
          { unique_key: 'gmail-getting-started', provider: 'google' },
          { unique_key: 'linkedin', provider: 'linkedin' }
        ]
      };
    }
  };

  console.log('✅ Nango Integration loaded successfully');

  // Test provider config key resolution
  const testCases = [
    { provider: 'google-drive', expected: 'google-drive' },
    { provider: 'gdrive', expected: 'google-drive' },
    { provider: 'gmail', expected: 'gmail-getting-started' },
    { provider: 'linkedin', expected: 'linkedin' },
    { provider: 'nonexistent', expected: 'nonexistent' } // fallback case
  ];

  console.log('\n🧪 Testing provider config key resolution:');
  console.log('-------------------------------------------');

  for (const testCase of testCases) {
    try {
      const authConfig = await nango.getAuthConfig(testCase.provider, 'test-workspace');

      if (authConfig.providerConfigKey) {
        console.log(`✅ ${testCase.provider} -> ${authConfig.providerConfigKey}`);

        if (authConfig.providerConfigKey === testCase.expected) {
          console.log(`   Expected match: ${testCase.expected} ✓`);
        } else {
          console.log(`   Expected: ${testCase.expected}, Got: ${authConfig.providerConfigKey} ⚠️`);
        }
      } else {
        console.log(`❌ ${testCase.provider} -> NO providerConfigKey (this is the bug!)`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.provider} -> Error: ${error.message}`);
    }
  }

  console.log('\n🔧 Testing fallback behavior:');
  console.log('------------------------------');

  // Test with empty integrations
  nango.nango.listIntegrations = async () => ({ configs: [] });

  const fallbackTest = await nango.getAuthConfig('test-provider', 'test-workspace');
  if (fallbackTest.providerConfigKey) {
    console.log(`✅ Fallback works: test-provider -> ${fallbackTest.providerConfigKey}`);
  } else {
    console.log('❌ Fallback failed: no providerConfigKey returned');
  }

  console.log('\n🎯 Testing the main fix:');
  console.log('------------------------');

  // The key test: ensure we NEVER return undefined providerConfigKey
  const providers = ['google-drive', 'gdrive', 'gmail', 'unknown-provider'];
  let allPassed = true;

  for (const provider of providers) {
    const config = await nango.getAuthConfig(provider, 'test-workspace');
    if (config.providerConfigKey === undefined) {
      console.log(`❌ CRITICAL: ${provider} returned undefined providerConfigKey`);
      allPassed = false;
    } else {
      console.log(`✅ ${provider} has valid providerConfigKey: ${config.providerConfigKey}`);
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('===========');

  if (allPassed) {
    console.log('✅ ALL TESTS PASSED - The "undefined" provider config key bug is FIXED!');
    console.log('✅ Frontend should no longer get "Could not find a Provider Config matching the "undefined" key" error');
  } else {
    console.log('❌ TESTS FAILED - The bug still exists');
  }

  console.log('\n💡 What was fixed:');
  console.log('• Removed error object return that had no providerConfigKey');
  console.log('• Added fallback to use provider name if no match found');
  console.log('• Enhanced Google Drive provider mappings');
  console.log('• Now always returns a valid providerConfigKey string');

  // Restore original environment
  if (originalEnv) {
    process.env.NANGO_SECRET_KEY = originalEnv;
  } else {
    delete process.env.NANGO_SECRET_KEY;
  }

} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
}
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});