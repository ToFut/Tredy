#!/usr/bin/env node

/**
 * Deploy Google Drive Integration to Nango
 * Based on Nango best practices
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Deploying Google Drive Integration to Nango\n');

// Check if Nango CLI is installed
try {
  execSync('npx nango version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Nango CLI not found. Installing...');
  execSync('npm install -g @nangohq/cli', { stdio: 'inherit' });
}

const integrationPath = path.join(__dirname, 'nango-integrations', 'google-drive');

// Check if integration directory exists
if (!fs.existsSync(integrationPath)) {
  console.error(`❌ Integration directory not found: ${integrationPath}`);
  process.exit(1);
}

console.log('📁 Integration directory:', integrationPath);

// Deploy to Nango
console.log('\n🔧 Deploying integration to Nango...');
try {
  process.chdir(integrationPath);
  execSync('npx nango deploy', { stdio: 'inherit' });
  console.log('✅ Integration deployed successfully!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('\n📋 Next Steps:');
console.log('1. Go to Nango Dashboard: https://app.nango.dev');
console.log('2. Navigate to Integrations > google-drive');
console.log('3. Configure OAuth with Google Cloud Console:');
console.log('   a. Create a new project or select existing');
console.log('   b. Enable Google Drive API');
console.log('   c. Create OAuth 2.0 credentials');
console.log('   d. Add authorized redirect URI from Nango');
console.log('   e. Add scopes: https://www.googleapis.com/auth/drive.readonly');
console.log('4. Save the Client ID and Client Secret in Nango');
console.log('5. Test the connection in AnythingLLM');

console.log('\n🔍 Testing Instructions:');
console.log('1. Run: node test-google-drive-sync.js');
console.log('2. Or use AnythingLLM UI: Workspace Settings > Connections > Google Drive');