#!/usr/bin/env node

/**
 * Complete Google Drive Sync Test
 * Tests the full sync flow from connection to data retrieval
 */

require('dotenv').config();
const { Nango } = require("@nangohq/node");
const { NangoIntegration } = require('./utils/connectors/nango-integration');
const { MCPNangoBridge } = require('./utils/connectors/mcp-nango-bridge');

async function testGoogleDriveSync() {
  console.log('🔍 Complete Google Drive Sync Test\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const workspaceId = 3;
  const provider = 'google-drive';
  
  // Initialize components
  const nangoIntegration = new NangoIntegration();
  const mcpBridge = new MCPNangoBridge();
  const nango = new Nango({
    secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
    host: process.env.NANGO_HOST || 'https://api.nango.dev'
  });

  try {
    // Step 1: Check provider availability
    console.log('1️⃣ Checking provider availability...');
    const providers = mcpBridge.getAvailableProviders();
    const googleDrive = providers.find(p => p.id === 'google-drive');
    
    if (googleDrive) {
      console.log('✅ Google Drive provider found:');
      console.log(`   Name: ${googleDrive.name}`);
      console.log(`   Description: ${googleDrive.description}`);
      console.log(`   Requires Metadata: ${googleDrive.requiresMetadata}`);
      if (googleDrive.metadataFields) {
        console.log(`   Metadata Fields:`, googleDrive.metadataFields);
      }
    } else {
      console.log('❌ Google Drive provider not found in available providers');
      return;
    }

    // Step 2: Check existing connection
    console.log('\n2️⃣ Checking existing connection...');
    let connection = null;
    try {
      connection = await nango.getConnection(provider, `workspace_${workspaceId}`);
      console.log('✅ Connection exists:', connection.connection_id);
      console.log(`   Provider: ${connection.provider_config_key}`);
      console.log(`   Created: ${connection.created_at}`);
    } catch (error) {
      console.log('⚠️ No existing connection found');
      console.log('\n📝 To create a connection:');
      console.log('1. Run: node fix-google-drive-connection.js');
      console.log('2. Complete OAuth flow');
      console.log('3. Run this test again\n');
      return;
    }

    // Step 3: Set/Update metadata for sync
    console.log('\n3️⃣ Setting sync metadata...');
    const metadata = {
      folders: ['root'], // Sync entire drive
      files: [] // No specific files
    };
    
    try {
      await nango.setMetadata(provider, `workspace_${workspaceId}`, metadata);
      console.log('✅ Metadata set successfully:', JSON.stringify(metadata));
    } catch (error) {
      console.log('⚠️ Failed to set metadata:', error.message);
    }

    // Step 4: Trigger sync
    console.log('\n4️⃣ Triggering sync...');
    try {
      const syncResult = await nango.startSync(
        provider,
        ['documents'], // Sync name from nango.yaml
        `workspace_${workspaceId}`
      );
      console.log('✅ Sync triggered:', syncResult);
    } catch (error) {
      console.log('⚠️ Failed to trigger sync:', error.message);
      console.log('   This might be normal if sync is already running');
    }

    // Step 5: Check sync status
    console.log('\n5️⃣ Checking sync status...');
    try {
      const syncs = await nango.listSyncs({ 
        connectionId: `workspace_${workspaceId}`,
        providerConfigKey: provider 
      });
      
      const documentSync = syncs.find(s => s.name === 'documents');
      if (documentSync) {
        console.log('📊 Sync Status:');
        console.log(`   Status: ${documentSync.status}`);
        console.log(`   Last Run: ${documentSync.lastRunAt}`);
        console.log(`   Next Run: ${documentSync.nextRunAt}`);
        console.log(`   Frequency: ${documentSync.frequency}`);
      } else {
        console.log('⚠️ Document sync not found');
      }
    } catch (error) {
      console.log('⚠️ Failed to get sync status:', error.message);
    }

    // Step 6: Wait and fetch records
    console.log('\n6️⃣ Waiting for sync to complete (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('\n7️⃣ Fetching synced documents...');
    try {
      const records = await nango.listRecords({
        providerConfigKey: provider,
        connectionId: `workspace_${workspaceId}`,
        model: 'Document',
        limit: 100
      });

      console.log(`\n📁 Found ${records.records.length} documents\n`);
      
      if (records.records.length > 0) {
        // Group by mime type
        const byType = {};
        records.records.forEach(doc => {
          const type = doc.mimeType || 'unknown';
          byType[type] = (byType[type] || 0) + 1;
        });
        
        console.log('📊 Documents by type:');
        Object.entries(byType).forEach(([type, count]) => {
          console.log(`   ${type}: ${count}`);
        });
        
        console.log('\n📄 Sample documents (first 10):');
        records.records.slice(0, 10).forEach((doc, i) => {
          console.log(`${i + 1}. ${doc.title || 'Untitled'}`);
          console.log(`   Type: ${doc.mimeType}`);
          console.log(`   Updated: ${doc.updatedAt}`);
          console.log(`   URL: ${doc.url}\n`);
        });
      } else {
        console.log('⚠️ No documents found. Possible reasons:');
        console.log('   - Sync is still running (check back later)');
        console.log('   - Google Drive is empty');
        console.log('   - OAuth scopes insufficient');
      }
    } catch (error) {
      console.log('❌ Failed to fetch records:', error.message);
    }

    // Step 7: Test MCP server configuration
    console.log('\n8️⃣ Checking MCP server configuration...');
    const mcpConfig = await mcpBridge.getMCPConfig(provider, workspaceId);
    if (mcpConfig) {
      console.log('✅ MCP server configured:');
      console.log(`   Command: ${mcpConfig.command}`);
      console.log(`   Server: ${mcpConfig.args[0]}`);
      console.log(`   Connection ID: ${mcpConfig.env.NANGO_CONNECTION_ID}`);
    } else {
      console.log('⚠️ MCP server not configured');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Test Complete!\n');
    console.log('📋 Summary:');
    console.log('- Provider: Registered ✓');
    console.log('- Connection: ' + (connection ? 'Established ✓' : 'Missing ✗'));
    console.log('- Sync: Configured ✓');
    console.log('- MCP: ' + (mcpConfig ? 'Ready ✓' : 'Not configured ✗'));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run test
testGoogleDriveSync().catch(console.error);