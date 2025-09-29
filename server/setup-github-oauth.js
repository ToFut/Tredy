#!/usr/bin/env node

/**
 * GitHub OAuth Setup Helper
 * 
 * Helps set up GitHub OAuth connection through Nango for testing
 */

const { Nango } = require('@nangohq/node');
const https = require('https');
const readline = require('readline');

class GitHubOAuthSetup {
  constructor() {
    this.setupEnvironment();
    this.nango = new Nango({
      secretKey: process.env.NANGO_SECRET_KEY,
      host: process.env.NANGO_HOST || 'https://api.nango.dev'
    });
  }

  /**
   * Setup environment variables
   */
  setupEnvironment() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const envPath = path.join(__dirname, '.env');
      const envContent = fs.readFileSync(envPath, 'utf8');
      
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.startsWith('#')) {
          process.env[key.trim()] = value.trim().replace(/"/g, '');
        }
      });
      
      console.log('✅ Environment variables loaded');
    } catch (error) {
      console.log('⚠️  Could not load .env file');
    }
  }

  /**
   * Check if GitHub connection exists
   */
  async checkExistingConnection() {
    console.log('🔍 Checking for existing GitHub connection...');
    
    try {
      const connection = await this.nango.getConnection({
        connectionId: 'workspace_1',
        providerConfigKey: 'github-getting-started'
      });
      
      console.log('✅ Existing GitHub connection found!');
      console.log(`   Connection ID: ${connection.connection_id}`);
      console.log(`   Provider: ${connection.provider}`);
      console.log(`   Status: ${connection.status}`);
      console.log(`   Created: ${connection.created_at}`);
      
      return connection;
    } catch (error) {
      if (error.message.includes('Connection not found')) {
        console.log('❌ No existing GitHub connection found');
        return null;
      } else {
        console.error('❌ Error checking connection:', error.message);
        return null;
      }
    }
  }

  /**
   * Get OAuth authorization URL
   */
  async getAuthorizationURL() {
    console.log('🔗 Getting GitHub OAuth authorization URL...');
    
    try {
      const authUrl = await this.nango.getAuthorizationURL({
        providerConfigKey: 'github-getting-started',
        connectionId: 'workspace_1',
        scopes: ['repo', 'user', 'read:org']
      });
      
      console.log('✅ Authorization URL generated');
      console.log(`🔗 Please visit: ${authUrl}`);
      
      return authUrl;
    } catch (error) {
      console.error('❌ Error getting authorization URL:', error.message);
      return null;
    }
  }

  /**
   * Test GitHub API with credentials
   */
  async testGitHubAPI(connection) {
    console.log('\n🌐 Testing GitHub API with credentials...');
    
    try {
      const result = await this.makeGitHubAPICall('/user', connection.credentials.access_token);
      
      if (result && result.login) {
        console.log('✅ GitHub API test successful!');
        console.log(`   Authenticated as: ${result.login}`);
        console.log(`   User ID: ${result.id}`);
        console.log(`   Public repos: ${result.public_repos}`);
        console.log(`   Followers: ${result.followers}`);
        return true;
      } else {
        console.log('❌ GitHub API test failed - unexpected response');
        return false;
      }
    } catch (error) {
      console.error('❌ GitHub API test failed:', error.message);
      return false;
    }
  }

  /**
   * Make GitHub API call
   */
  async makeGitHubAPICall(endpoint, token) {
    const url = `https://api.github.com${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Nango-MCP-Setup/1.0.0'
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, { headers }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Test GitHub MCP wrapper with real credentials
   */
  async testMCPWrapperWithCredentials(connection) {
    console.log('\n🔧 Testing MCP Wrapper with real credentials...');
    
    try {
      // Set up environment for the wrapper
      process.env.GITHUB_TOKEN = connection.credentials.access_token;
      
      // Import and test the wrapper
      const NangoTemplateMCP = require('./nango-template-mcp-wrapper.js');
      
      // Create a test instance
      const wrapper = new NangoTemplateMCP('github', {
        workspaceId: '1',
        serviceName: 'github'
      });
      
      // Override credentials for testing
      wrapper.credentials = connection.credentials;
      
      console.log('✅ MCP Wrapper initialized with credentials');
      
      // Test a simple action
      const result = await wrapper.executeAction('list-repos', { per_page: 3 });
      
      if (result && !result.includes('Error')) {
        console.log('✅ MCP Wrapper test successful!');
        console.log(`📊 Result preview: ${result.substring(0, 200)}...`);
        return true;
      } else {
        console.log('❌ MCP Wrapper test failed:', result);
        return false;
      }
    } catch (error) {
      console.error('❌ MCP Wrapper test failed:', error.message);
      return false;
    }
  }

  /**
   * Interactive OAuth setup
   */
  async interactiveSetup() {
    console.log('🚀 GitHub OAuth Setup for MCP Integration\n');
    console.log('=' .repeat(50));
    
    // Check for existing connection
    const existingConnection = await this.checkExistingConnection();
    
    if (existingConnection) {
      console.log('\n🔍 Testing existing connection...');
      
      const apiTest = await this.testGitHubAPI(existingConnection);
      const mcpTest = await this.testMCPWrapperWithCredentials(existingConnection);
      
      if (apiTest && mcpTest) {
        console.log('\n🎉 GitHub OAuth setup is complete and working!');
        console.log('✅ Ready for MCP integration testing');
        return true;
      } else {
        console.log('\n⚠️  Existing connection has issues, need to re-authenticate');
      }
    }
    
    // Get authorization URL
    const authUrl = await this.getAuthorizationURL();
    if (!authUrl) {
      console.log('❌ Failed to get authorization URL');
      return false;
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Visit the authorization URL above');
    console.log('2. Authorize the application');
    console.log('3. Copy the authorization code from the callback');
    console.log('4. Run this script again with the authorization code');
    
    return false;
  }

  /**
   * Complete OAuth flow with authorization code
   */
  async completeOAuthFlow(authCode) {
    console.log('🔄 Completing OAuth flow...');
    
    try {
      const result = await this.nango.exchangeCodeForToken({
        providerConfigKey: 'github-getting-started',
        connectionId: 'workspace_1',
        code: authCode
      });
      
      console.log('✅ OAuth flow completed successfully!');
      
      // Test the connection
      const connection = await this.checkExistingConnection();
      if (connection) {
        await this.testGitHubAPI(connection);
        await this.testMCPWrapperWithCredentials(connection);
      }
      
      return true;
    } catch (error) {
      console.error('❌ OAuth flow failed:', error.message);
      return false;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const setup = new GitHubOAuthSetup();
  
  const authCode = process.argv[2];
  
  if (authCode) {
    setup.completeOAuthFlow(authCode)
      .then(success => {
        process.exit(success ? 0 : 1);
      });
  } else {
    setup.interactiveSetup()
      .then(success => {
        process.exit(success ? 0 : 1);
      });
  }
}

module.exports = GitHubOAuthSetup;