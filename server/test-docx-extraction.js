#!/usr/bin/env node

/**
 * Test script for DOCX extraction - specifically for sales.docx
 */

const { Nango } = require('@nangohq/node');
const mammoth = require('mammoth');
const path = require('path');

// Load environment
require('dotenv').config({ path: path.join(__dirname, '.env.development') });

const FILE_ID = '1vsXURMGRMUMfU8Sac5vU1CoG8phdxxLi';
const FILE_NAME = 'sales.docx';
const WORKSPACE_ID = '150'; // Using workspace 150 - has valid Google Drive connection

console.log('========================================');
console.log('DOCX EXTRACTION TEST: sales.docx');
console.log('========================================');
console.log('File ID:', FILE_ID);
console.log('File Name:', FILE_NAME);
console.log('Workspace ID:', WORKSPACE_ID);
console.log('========================================\n');

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY,
  host: process.env.NANGO_HOST || 'https://api.nango.dev'
});

const providerConfigKey = 'google-drive-getting-started'; // Must match workspace 150 config
const connectionId = `workspace_${WORKSPACE_ID}`;

console.log('Nango Config:');
console.log('- Secret Key:', process.env.NANGO_SECRET_KEY?.substring(0, 10) + '...');
console.log('- Host:', process.env.NANGO_HOST);
console.log('- Provider Config Key:', providerConfigKey);
console.log('- Connection ID:', connectionId);
console.log('');

async function listConnections() {
  console.log('\n[TEST] Listing Nango Connections');
  try {
    const response = await nango.listConnections({
      providerConfigKey
    });

    console.log(`✓ Found ${response.connections.length} connection(s)`);
    response.connections.forEach(conn => {
      console.log(`  - Connection ID: ${conn.connectionId}`);
      console.log(`    Provider: ${conn.providerConfigKey}`);
      console.log(`    Created: ${conn.createdAt}`);
    });

    return response.connections;
  } catch (error) {
    console.log(`✗ Failed to list connections: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);
    }
    return [];
  }
}

async function testFetchBinary(method, config) {
  console.log(`\n[TEST] Method: ${method}`);
  console.log('Config:', JSON.stringify(config, null, 2));

  try {
    const response = await nango.get({
      endpoint: `/drive/v3/files/${FILE_ID}`,
      connectionId,
      providerConfigKey,
      ...config
    });

    console.log(`✓ Request succeeded`);
    console.log(`Response type: ${typeof response.data}`);
    console.log(`Is Buffer: ${Buffer.isBuffer(response.data)}`);
    console.log(`Is ArrayBuffer: ${response.data instanceof ArrayBuffer}`);

    if (typeof response.data === 'string') {
      console.log(`String length: ${response.data.length}`);
      console.log(`First 100 chars: ${response.data.substring(0, 100)}`);

      // Check corruption
      let unicodeCount = 0;
      for (let i = 0; i < Math.min(1000, response.data.length); i++) {
        if (response.data.charCodeAt(i) > 255) unicodeCount++;
      }
      console.log(`Unicode corruption: ${unicodeCount}/1000 = ${(unicodeCount/10).toFixed(2)}%`);
    }

    if (Buffer.isBuffer(response.data) || response.data instanceof ArrayBuffer) {
      const buffer = Buffer.isBuffer(response.data)
        ? response.data
        : Buffer.from(response.data);

      console.log(`Buffer size: ${buffer.length} bytes`);

      const firstBytes = Array.from(buffer.slice(0, 16))
        .map(b => '0x' + b.toString(16).padStart(2, '0'))
        .join(' ');
      console.log(`First 16 bytes: ${firstBytes}`);

      // Check ZIP signature
      const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
      console.log(`ZIP signature (PK): ${isZip ? '✓ YES' : '✗ NO'}`);

      return buffer;
    }

    if (typeof response.data === 'string') {
      // Try different encodings
      console.log('\nTrying different encodings:');

      const latin1Buffer = Buffer.from(response.data, 'latin1');
      console.log(`- latin1: ${latin1Buffer.length} bytes`);
      const latin1Zip = latin1Buffer[0] === 0x50 && latin1Buffer[1] === 0x4B;
      console.log(`  ZIP signature: ${latin1Zip ? '✓ YES' : '✗ NO'}`);

      // Check if base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      const isBase64Like = base64Regex.test(response.data.substring(0, 200));
      if (isBase64Like && response.data.length % 4 === 0) {
        try {
          const base64Buffer = Buffer.from(response.data, 'base64');
          console.log(`- base64: ${base64Buffer.length} bytes`);
          const base64Zip = base64Buffer[0] === 0x50 && base64Buffer[1] === 0x4B;
          console.log(`  ZIP signature: ${base64Zip ? '✓ YES' : '✗ NO'}`);

          if (base64Zip) {
            return base64Buffer;
          }
        } catch (err) {
          console.log(`- base64 decode failed: ${err.message}`);
        }
      }

      if (latin1Zip) {
        return latin1Buffer;
      }
    }

    return null;
  } catch (error) {
    console.log(`✗ Request failed: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);
    }
    return null;
  }
}

async function testMammothExtraction(buffer) {
  console.log(`\n[TEST] Mammoth Extraction`);
  console.log(`Buffer size: ${buffer.length} bytes`);

  try {
    const result = await mammoth.extractRawText({ buffer });
    console.log(`✓ Mammoth extraction succeeded`);
    console.log(`Extracted text length: ${result.value.length} characters`);
    console.log(`First 200 chars: ${result.value.substring(0, 200)}`);
    return result.value;
  } catch (error) {
    console.log(`✗ Mammoth extraction failed: ${error.message}`);
    console.log(`Stack:`, error.stack);
    return null;
  }
}

async function testGoogleDocsConversion() {
  console.log(`\n[TEST] Google Docs Conversion`);

  let tempDocId = null;
  try {
    // Step 1: Copy and convert to Google Doc
    console.log('Step 1: Creating Google Doc copy...');
    const copyResponse = await nango.post({
      endpoint: `/drive/v3/files/${FILE_ID}/copy`,
      connectionId,
      providerConfigKey,
      data: {
        name: `test_conversion_${FILE_NAME}`,
        mimeType: 'application/vnd.google-apps.document'
      },
      headers: { 'Content-Type': 'application/json' }
    });

    tempDocId = copyResponse.data.id;
    console.log(`✓ Created temp Google Doc: ${tempDocId}`);

    // Step 2: Export as text
    console.log('Step 2: Exporting as text...');
    const exportResponse = await nango.get({
      endpoint: `/drive/v3/files/${tempDocId}/export`,
      connectionId,
      providerConfigKey,
      params: { mimeType: 'text/plain' }
    });

    const textContent = String(exportResponse.data);
    console.log(`✓ Exported text: ${textContent.length} characters`);
    console.log(`First 200 chars: ${textContent.substring(0, 200)}`);

    // Step 3: Cleanup
    console.log('Step 3: Cleaning up...');
    await nango.delete({
      endpoint: `/drive/v3/files/${tempDocId}`,
      connectionId,
      providerConfigKey
    });
    console.log(`✓ Deleted temp file`);

    return textContent;
  } catch (error) {
    console.log(`✗ Google Docs conversion failed: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, JSON.stringify(error.response.data, null, 2));
    }

    // Cleanup
    if (tempDocId) {
      try {
        await nango.delete({
          endpoint: `/drive/v3/files/${tempDocId}`,
          connectionId,
          providerConfigKey
        });
        console.log(`✓ Cleanup successful`);
      } catch (cleanupError) {
        console.log(`⚠ Cleanup failed: ${cleanupError.message}`);
      }
    }

    return null;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('STARTING TESTS');
  console.log('========================================');

  // First check connections
  await listConnections();

  // Test 1: Fetch with responseType arraybuffer
  let buffer = await testFetchBinary('Method 1: responseType arraybuffer', {
    params: { alt: 'media' },
    headers: { 'Accept': 'application/octet-stream' },
    responseType: 'arraybuffer'
  });

  if (!buffer || buffer.length === 0) {
    // Test 2: Fetch with binary headers only
    buffer = await testFetchBinary('Method 2: Binary headers only', {
      params: { alt: 'media' },
      headers: { 'Accept': 'application/octet-stream' }
    });
  }

  if (!buffer || buffer.length === 0) {
    // Test 3: Fetch without special headers
    buffer = await testFetchBinary('Method 3: No special headers', {
      params: { alt: 'media' }
    });
  }

  if (buffer && buffer.length > 0) {
    console.log('\n========================================');
    console.log('VALID BUFFER OBTAINED - TESTING MAMMOTH');
    console.log('========================================');

    const text = await testMammothExtraction(buffer);

    if (text) {
      console.log('\n✅ MAMMOTH EXTRACTION SUCCESSFUL');
    } else {
      console.log('\n❌ MAMMOTH EXTRACTION FAILED');
    }
  } else {
    console.log('\n❌ FAILED TO GET VALID BUFFER FROM ALL METHODS');
  }

  // Test 4: Google Docs conversion
  console.log('\n========================================');
  console.log('TESTING GOOGLE DOCS CONVERSION');
  console.log('========================================');

  const convertedText = await testGoogleDocsConversion();

  if (convertedText) {
    console.log('\n✅ GOOGLE DOCS CONVERSION SUCCESSFUL');
  } else {
    console.log('\n❌ GOOGLE DOCS CONVERSION FAILED');
  }

  console.log('\n========================================');
  console.log('ALL TESTS COMPLETED');
  console.log('========================================');
}

runTests().catch(error => {
  console.error('\n❌ TEST SCRIPT FAILED:', error);
  console.error(error.stack);
  process.exit(1);
});