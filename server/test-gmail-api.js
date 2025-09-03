#!/usr/bin/env node

const { Nango } = require('@nangohq/node');

async function testGmailAPI() {
  console.log('🔍 Testing Gmail API directly...\n');

  const nango = new Nango({
    secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });

  const connectionId = 'workspace_3';
  const providerConfigKey = 'google-mail';

  try {
    console.log('Testing different API endpoints:\n');
    
    // Test 1: Try the messages list endpoint
    console.log('1. Testing messages list endpoint...');
    try {
      const response = await nango.proxy({
        method: 'GET',
        endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        connectionId: connectionId,
        providerConfigKey: providerConfigKey,
        params: {
          maxResults: 5
        }
      });
      
      console.log('✓ Messages response:', JSON.stringify(response.data, null, 2).substring(0, 500));
    } catch (error) {
      console.log('✗ Messages error:', error.response?.data || error.message);
    }

    // Test 2: Try with different parameters
    console.log('\n2. Testing with labelIds=INBOX...');
    try {
      const response = await nango.proxy({
        method: 'GET',
        endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/messages',
        connectionId: connectionId,
        providerConfigKey: providerConfigKey,
        params: {
          maxResults: 5,
          labelIds: 'INBOX'
        }
      });
      
      console.log('✓ With INBOX:', JSON.stringify(response.data, null, 2).substring(0, 500));
    } catch (error) {
      console.log('✗ INBOX error:', error.response?.data || error.message);
    }

    // Test 3: Try profile endpoint to verify connection
    console.log('\n3. Testing profile endpoint...');
    try {
      const response = await nango.proxy({
        method: 'GET',
        endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
        connectionId: connectionId,
        providerConfigKey: providerConfigKey
      });
      
      console.log('✓ Profile:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('✗ Profile error:', error.response?.data || error.message);
    }

    // Test 4: Try labels endpoint
    console.log('\n4. Testing labels endpoint...');
    try {
      const response = await nango.proxy({
        method: 'GET',
        endpoint: 'https://gmail.googleapis.com/gmail/v1/users/me/labels',
        connectionId: connectionId,
        providerConfigKey: providerConfigKey
      });
      
      console.log('✓ Labels found:', response.data.labels?.length || 0);
      if (response.data.labels) {
        console.log('  Sample labels:', response.data.labels.slice(0, 5).map(l => l.name).join(', '));
      }
    } catch (error) {
      console.log('✗ Labels error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('General error:', error);
  }
}

testGmailAPI().catch(console.error);