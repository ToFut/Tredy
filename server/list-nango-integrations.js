#!/usr/bin/env node

/**
 * List all Nango integrations to find the correct Gmail key
 */

const https = require('https');

async function listNangoIntegrations() {
  console.log('🔍 Listing all Nango integrations...\n');

  const secretKey = process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91';
  const host = process.env.NANGO_HOST || 'https://api.nango.dev';

  // Try different API endpoints
  const endpoints = [
    '/config',
    '/config/list',
    '/integrations',
    '/integration',
    '/providers',
    '/provider-configs'
  ];

  for (const endpoint of endpoints) {
    console.log(`\nTrying endpoint: ${endpoint}`);
    
    try {
      const url = new URL(host);
      url.pathname = endpoint;
      
      const response = await new Promise((resolve, reject) => {
        https.get(url.toString(), {
          headers: {
            'Authorization': `Bearer ${secretKey}`,
            'Accept': 'application/json'
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const parsed = JSON.parse(data);
                resolve({ status: res.statusCode, data: parsed });
              } catch (e) {
                resolve({ status: res.statusCode, data: data });
              }
            } else {
              resolve({ status: res.statusCode, data: data });
            }
          });
        }).on('error', reject);
      });

      if (response.status === 200) {
        console.log(`✓ Found data at ${endpoint}:`);
        console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
      } else {
        console.log(`✗ ${endpoint} returned ${response.status}`);
      }
    } catch (error) {
      console.log(`✗ ${endpoint} failed: ${error.message}`);
    }
  }

  console.log('\n\n📋 Manual Check Instructions:');
  console.log('1. Go to Nango Dashboard: https://app.nango.dev');
  console.log('2. Click on "Integrations" in the sidebar');
  console.log('3. Find your Gmail integration');
  console.log('4. Look for the "Integration Unique Key" field');
  console.log('5. That\'s the exact key you need to use in the code');
  console.log('\nThe key is usually shown as:');
  console.log('- Integration Unique Key: [your-key-here]');
  console.log('- Or it might be called "Integration ID" or "Key"');
  console.log('\nCommon patterns:');
  console.log('- gmail');
  console.log('- gmail-oauth');  
  console.log('- gmail-integration');
  console.log('- google-gmail');
  console.log('- Or something custom you entered');
}

listNangoIntegrations().catch(console.error);