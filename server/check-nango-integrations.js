#!/usr/bin/env node

const { Nango } = require('@nangohq/node');

async function checkNangoIntegrations() {
  console.log('🔍 Checking Nango Integrations...\n');

  const nango = new Nango({
    secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });

  try {
    // Try to list integrations (this might not work with all Nango versions)
    console.log('Nango Configuration:');
    console.log('- Secret Key:', process.env.NANGO_SECRET_KEY ? '✓ Set' : '✗ Missing');
    console.log('- Public Key:', process.env.NANGO_PUBLIC_KEY ? '✓ Set' : '✗ Missing');
    console.log('- Host:', process.env.NANGO_HOST || 'https://api.nango.dev');
    console.log('\n');

    // Test known integrations
    const testIntegrations = [
      'gmail-integration',
      'google-calendar-getting-started',
      'gmail',
      'google',
      'google-oauth'
    ];

    console.log('Testing integration keys:\n');
    for (const key of testIntegrations) {
      try {
        // Try to get auth URL as a way to test if integration exists
        const authUrl = `${process.env.NANGO_HOST || 'https://api.nango.dev'}/oauth/connect?provider_config_key=${key}`;
        console.log(`- ${key}: Check in Nango dashboard`);
      } catch (error) {
        console.log(`- ${key}: Not found`);
      }
    }

    console.log('\n📋 Next Steps:\n');
    console.log('1. Go to Nango Dashboard: https://app.nango.dev');
    console.log('2. Check if you see any Google integrations');
    console.log('3. If not, create one with EXACTLY this key: gmail-integration');
    console.log('\nOR if you have a Google integration with a different key:');
    console.log('Tell me the exact key name and I\'ll update the code to match!');
    
  } catch (error) {
    console.error('Error checking integrations:', error.message);
  }
}

checkNangoIntegrations();