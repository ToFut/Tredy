#!/usr/bin/env node

/**
 * Force clear Gmail connection to fix scope issues
 */

const { Nango } = require('@nangohq/node');

async function forceClearGmail() {
  console.log('🔧 Force-clearing Gmail connections...\n');

  const nango = new Nango({
    secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });

  const workspaces = ['workspace_2', 'workspace_3', 'workspace_4'];
  
  for (const workspace of workspaces) {
    try {
      console.log(`Checking ${workspace}...`);
      
      // Try to delete the connection
      await nango.deleteConnection('google-mail', workspace);
      console.log(`✓ Deleted Gmail connection for ${workspace}`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`- No Gmail connection found for ${workspace}`);
      } else {
        console.log(`- Error with ${workspace}:`, error.message);
      }
    }
  }

  console.log('\n✅ Gmail connections cleared!');
  console.log('\nNext steps:');
  console.log('1. Restart AnythingLLM server (Ctrl+C and yarn dev:server)');
  console.log('2. Go to Workspace Settings → Connectors');
  console.log('3. Click Connect on Gmail');
  console.log('4. Complete OAuth with Gmail permissions showing');
}

forceClearGmail().catch(console.error);