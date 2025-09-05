#!/usr/bin/env node

/**
 * Verify Google Drive sync status in AnythingLLM
 */

const { NangoIntegration } = require('./utils/connectors/nango-integration');
const { ConnectorTokens } = require('./models/connectorTokens');

async function verifyDriveSync() {
  const workspaceId = 3;
  
  console.log('🔍 Verifying Google Drive Sync Status\n');
  
  // 1. Check local database
  console.log('1️⃣ Local Database Status:');
  const localConnection = await ConnectorTokens.get({
    workspaceId,
    provider: 'google-drive'
  });
  
  if (localConnection) {
    console.log('✅ Found in local database:');
    console.log('  - Provider:', localConnection.provider);
    console.log('  - Status:', localConnection.status);
    console.log('  - Connection ID:', localConnection.nangoConnectionId);
    console.log('  - Last Sync:', localConnection.lastSync || 'Never synced');
  } else {
    console.log('❌ Not found in local database');
    return;
  }
  
  // 2. Check Nango connection
  console.log('\n2️⃣ Nango Cloud Status:');
  const nango = new NangoIntegration();
  
  if (!nango.nango) {
    console.log('❌ Nango not configured (check NANGO_SECRET_KEY)');
    return;
  }
  
  try {
    // Check what provider configs exist
    const integrations = await nango.nango.listIntegrations();
    console.log('\n📋 Available Nango integrations:');
    
    if (integrations.configs) {
      integrations.configs.forEach(config => {
        console.log(`  - ${config.unique_key} (${config.provider})`);
      });
    }
    
    // Try to get the connection with different provider keys
    const possibleKeys = ['google-drive', 'google-drive-getting-started', 'google'];
    let connection = null;
    let usedKey = null;
    
    for (const key of possibleKeys) {
      try {
        connection = await nango.nango.getConnection(key, 'workspace_3');
        usedKey = key;
        break;
      } catch (e) {
        // Continue trying
      }
    }
    
    if (connection) {
      console.log(`\n✅ Connection exists in Nango with key: ${usedKey}`);
      console.log('  - Created:', connection.created_at);
      console.log('  - Provider:', connection.provider_config_key);
      
      // 3. Check for synced data
      console.log('\n3️⃣ Checking for synced documents...');
      
      try {
        const records = await nango.nango.listRecords({
          providerConfigKey: usedKey,
          connectionId: 'workspace_3',
          model: 'Document',
          limit: 5
        });
        
        if (records.records && records.records.length > 0) {
          console.log(`✅ Found ${records.records.length} synced documents:`);
          records.records.forEach(doc => {
            console.log(`  - ${doc.title || doc.name} (${doc.mimeType})`);
          });
        } else {
          console.log('⚠️ No documents synced yet');
          console.log('\n💡 To start sync, Google Drive needs metadata (file/folder IDs)');
          console.log('   This is because Google Drive sync has auto_start: false');
        }
      } catch (e) {
        console.log('❌ Could not fetch records:', e.message);
      }
      
      // 4. Try to trigger sync
      console.log('\n4️⃣ Attempting to trigger sync...');
      try {
        // Set metadata for root folder
        await nango.nango.setMetadata(usedKey, 'workspace_3', {
          folders: ['root'] // Sync entire drive
        });
        console.log('✅ Metadata set to sync root folder');
        
        // Start the sync
        const syncResult = await nango.nango.startSync(
          usedKey,
          ['documents'],
          'workspace_3'
        );
        console.log('✅ Sync started!', syncResult);
        console.log('\n⏳ Check back in a few minutes for synced data');
      } catch (e) {
        console.log('❌ Could not start sync:', e.message);
      }
      
    } else {
      console.log('\n❌ Connection not found in Nango cloud');
      console.log('   The connection might need to be re-authenticated');
    }
    
  } catch (error) {
    console.error('❌ Error checking Nango:', error.message);
  }
  
  // 5. Check local sync cursors
  console.log('\n5️⃣ Local Sync Cursors:');
  const { SyncCursors } = require('./models/syncCursors');
  const cursors = await SyncCursors.getForWorkspace(workspaceId);
  const driveCursors = cursors.filter(c => c.provider.includes('drive'));
  
  if (driveCursors.length > 0) {
    console.log('✅ Found sync cursors:');
    driveCursors.forEach(cursor => {
      console.log(`  - ${cursor.provider}:${cursor.model}`);
      console.log(`    Last sync: ${cursor.lastSyncAt}`);
      console.log(`    Records: ${cursor.recordCount}`);
      console.log(`    Status: ${cursor.status}`);
    });
  } else {
    console.log('⚠️ No sync cursors found (sync hasn\'t run yet)');
  }
}

// Load environment variables
require('dotenv').config();

// Run verification
verifyDriveSync().catch(console.error);