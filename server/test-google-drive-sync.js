#!/usr/bin/env node

/**
 * Test Google Drive Sync with Nango
 * Based on Nango sample app patterns
 */

const { Nango } = require("@nangohq/node");

async function testGoogleDriveSync() {
  const nango = new Nango({
    secretKey: process.env.NANGO_SECRET_KEY || '',
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });

  const connectionId = 'workspace_3'; // Your workspace connection
  
  // Try different possible provider keys
  const possibleProviders = ['google-drive', 'google-drive-getting-started', 'google_drive', 'drive'];
  let provider = 'google-drive';
  let connection = null;

  try {
    console.log('🔍 Testing Google Drive Sync...\n');

    // Step 1: Check if connection exists
    console.log('1️⃣ Checking connection...');
    
    // Try to find the correct provider key
    for (const providerKey of possibleProviders) {
      try {
        connection = await nango.getConnection(providerKey, connectionId);
        provider = providerKey;
        console.log(`✅ Connection found with provider key: ${provider}`);
        break;
      } catch (err) {
        console.log(`  ❌ Not found with ${providerKey}`);
      }
    }
    
    if (!connection) {
      console.log('\n❌ No Google Drive connection found for workspace_3');
      console.log('Available connections might be under a different provider key.');
      
      // List all connections to see what's actually there
      try {
        const allConnections = await nango.listConnections();
        console.log('\n📋 All connections:');
        allConnections.forEach(conn => {
          console.log(`  - ${conn.provider_config_key}: ${conn.connection_id}`);
        });
      } catch (e) {
        console.log('Could not list connections');
      }
      return;
    }
    
    console.log('✅ Connection details:', connection.connection_id);

    // Step 2: Set metadata (required for Google Drive)
    console.log('\n2️⃣ Setting metadata for sync...');
    
    // Option A: Sync entire Drive (root folder)
    const metadata = {
      folders: ['root'] // 'root' is the special ID for the root folder
    };
    
    // Option B: Sync specific folders/files (uncomment to use)
    // const metadata = {
    //   folders: ['folder-id-here'],
    //   files: ['file-id-here']
    // };

    await nango.setMetadata(provider, connectionId, metadata);
    console.log('✅ Metadata set:', JSON.stringify(metadata));

    // Step 3: Start the sync manually (since auto_start is false)
    console.log('\n3️⃣ Starting sync...');
    const syncResult = await nango.startSync(
      provider,
      ['documents'], // The sync name from nango.yaml
      connectionId
    );
    console.log('✅ Sync started:', syncResult);

    // Step 4: Check sync status
    console.log('\n4️⃣ Checking sync status...');
    const syncs = await nango.listSyncs({ connectionId });
    const driveSync = syncs.find(s => s.name === 'documents');
    
    if (driveSync) {
      console.log('📊 Sync Status:');
      console.log('  - Status:', driveSync.status);
      console.log('  - Last Run:', driveSync.lastRunAt);
      console.log('  - Frequency:', driveSync.frequency);
    }

    // Step 5: Get synced records (may take time for sync to complete)
    console.log('\n5️⃣ Fetching synced records...');
    setTimeout(async () => {
      try {
        const records = await nango.listRecords({
          providerConfigKey: provider,
          connectionId: connectionId,
          model: 'Document'
        });
        
        console.log(`\n📁 Found ${records.records.length} documents`);
        if (records.records.length > 0) {
          console.log('\nFirst 5 documents:');
          records.records.slice(0, 5).forEach(doc => {
            console.log(`  - ${doc.title} (${doc.mimeType})`);
          });
        }
      } catch (error) {
        console.log('⏳ Sync may still be running. Check again in a minute.');
      }
    }, 5000); // Wait 5 seconds before checking

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Details:', error.response.data);
    }
  }
}

// Run the test
console.log('🚀 Google Drive Sync Test\n');
console.log('Make sure to set NANGO_SECRET_KEY environment variable\n');

testGoogleDriveSync();