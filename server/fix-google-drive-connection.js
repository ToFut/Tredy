#!/usr/bin/env node

/**
 * Fix Google Drive connection by properly establishing it in Nango
 */

const { NangoIntegration } = require('./utils/connectors/nango-integration');

async function fixGoogleDriveConnection() {
  console.log('🔧 Fixing Google Drive Connection\n');
  
  const nango = new NangoIntegration();
  const workspaceId = 3;
  const provider = 'google-drive';
  
  try {
    // 1. Delete old connection if exists
    console.log('1️⃣ Cleaning up old connection...');
    try {
      await nango.deleteConnection(provider, workspaceId);
      console.log('✅ Old connection removed');
    } catch (e) {
      console.log('⚠️ No existing connection to remove');
    }
    
    // 2. Get OAuth URL for re-authentication
    console.log('\n2️⃣ Getting new OAuth configuration...');
    const authConfig = await nango.getAuthConfig(provider, workspaceId);
    
    if (authConfig.error) {
      console.log('❌ Provider not configured:', authConfig.message);
      return;
    }
    
    console.log('✅ OAuth config ready:');
    console.log('  - Provider Key:', authConfig.providerConfigKey);
    console.log('  - Connection ID:', authConfig.connectionId);
    console.log('  - Public Key:', authConfig.publicKey?.substring(0, 8) + '...');
    
    // 3. Generate the OAuth URL
    console.log('\n3️⃣ OAuth Authentication Required:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔗 Please visit this URL to authenticate:');
    
    const authUrl = `${authConfig.host}/oauth/connect?` + 
      `public_key=${authConfig.publicKey}&` +
      `integration_id=${authConfig.providerConfigKey}&` +
      `connection_id=${authConfig.connectionId}`;
    
    console.log('\n' + authUrl);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n📝 After authentication:');
    console.log('1. The connection will be established in Nango');
    console.log('2. Run "node verify-drive-sync.js" to trigger sync');
    console.log('3. Documents will appear in your workspace');
    
    // 4. Alternative: Use frontend flow
    console.log('\n💡 Alternative: Use AnythingLLM Frontend');
    console.log('1. Go to Workspace Settings > Connections');
    console.log('2. Click "Connect" for Google Drive');
    console.log('3. Complete OAuth flow');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Load environment
require('dotenv').config();

// Run fix
fixGoogleDriveConnection().catch(console.error);