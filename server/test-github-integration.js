#!/usr/bin/env node

/**
 * Test GitHub Integration with Nango MCP Wrapper
 * 
 * Tests the GitHub integration to verify OAuth flow and API calls work properly
 */

const NangoTemplateMCP = require('./nango-template-mcp-wrapper.js');
const https = require('https');

class GitHubIntegrationTest {
  constructor() {
    this.testResults = [];
    this.githubWrapper = null;
    this.setupEnvironment();
  }

  /**
   * Setup environment variables for testing
   */
  setupEnvironment() {
    // Load environment variables from .env file
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
      
      console.log('✅ Environment variables loaded from .env file');
    } catch (error) {
      console.log('⚠️  Could not load .env file, using system environment');
    }
  }

  /**
   * Initialize the GitHub MCP wrapper
   */
  async initializeGitHubWrapper() {
    console.log('🔧 Initializing GitHub MCP Wrapper...');
    
    try {
      this.githubWrapper = new NangoTemplateMCP('github', {
        workspaceId: '1',
        serviceName: 'github'
      });
      
      console.log('✅ GitHub MCP Wrapper initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize GitHub wrapper:', error.message);
      return false;
    }
  }

  /**
   * Test OAuth credentials loading
   */
  async testOAuthCredentials() {
    console.log('\n🔐 Testing OAuth Credentials...');
    
    try {
      if (!this.githubWrapper.credentials || !this.githubWrapper.credentials.access_token) {
        console.log('⚠️  No OAuth credentials found - this is expected for first run');
        console.log('📋 To get credentials:');
        console.log('   1. Set up GitHub OAuth app in Nango');
        console.log('   2. Configure workspace_1 connection');
        console.log('   3. Complete OAuth flow');
        return false;
      }
      
      console.log('✅ OAuth credentials loaded successfully');
      console.log(`   Token type: ${this.githubWrapper.credentials.token_type || 'Bearer'}`);
      console.log(`   Token length: ${this.githubWrapper.credentials.access_token.length} characters`);
      return true;
    } catch (error) {
      console.error('❌ OAuth credentials test failed:', error.message);
      return false;
    }
  }

  /**
   * Test GitHub API connectivity
   */
  async testGitHubAPIConnectivity() {
    console.log('\n🌐 Testing GitHub API Connectivity...');
    
    try {
      const result = await this.makeGitHubAPICall('GET', '/user');
      
      if (result && result.login) {
        console.log('✅ GitHub API connectivity successful');
        console.log(`   Authenticated as: ${result.login}`);
        console.log(`   User ID: ${result.id}`);
        console.log(`   Public repos: ${result.public_repos}`);
        return true;
      } else {
        console.log('⚠️  GitHub API call returned unexpected result');
        return false;
      }
    } catch (error) {
      console.error('❌ GitHub API connectivity test failed:', error.message);
      return false;
    }
  }

  /**
   * Test GitHub actions/tools
   */
  async testGitHubActions() {
    console.log('\n🛠️  Testing GitHub Actions...');
    
    const actions = [
      {
        name: 'list-repos',
        args: { per_page: 5 },
        description: 'List user repositories'
      },
      {
        name: 'get-file',
        args: { owner: 'octocat', repo: 'Hello-World', path: 'README' },
        description: 'Get file content from public repo'
      }
    ];

    let successCount = 0;
    
    for (const action of actions) {
      try {
        console.log(`\n   Testing ${action.name}: ${action.description}`);
        
        const result = await this.githubWrapper.executeAction(action.name, action.args);
        
        if (result && !result.includes('Error')) {
          console.log(`   ✅ ${action.name} successful`);
          console.log(`   📊 Result length: ${result.length} characters`);
          successCount++;
        } else {
          console.log(`   ❌ ${action.name} failed: ${result}`);
        }
      } catch (error) {
        console.log(`   ❌ ${action.name} error: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Actions test summary: ${successCount}/${actions.length} successful`);
    return successCount === actions.length;
  }

  /**
   * Test MCP tool registration
   */
  async testMCPToolRegistration() {
    console.log('\n🔧 Testing MCP Tool Registration...');
    
    try {
      const tools = this.githubWrapper.tools;
      
      if (tools && tools.length > 0) {
        console.log(`✅ ${tools.length} GitHub tools registered successfully`);
        
        tools.forEach(tool => {
          console.log(`   📋 ${tool.name}: ${tool.description}`);
        });
        
        return true;
      } else {
        console.log('❌ No tools registered');
        return false;
      }
    } catch (error) {
      console.error('❌ Tool registration test failed:', error.message);
      return false;
    }
  }

  /**
   * Make GitHub API call
   */
  async makeGitHubAPICall(method, endpoint, body = null) {
    const url = `https://api.github.com${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.githubWrapper.credentials.access_token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Nango-MCP-Test/1.0.0'
    };

    return new Promise((resolve, reject) => {
      const options = { method, headers };
      const req = https.request(url, options, (res) => {
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

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  /**
   * Test GitHub integration end-to-end
   */
  async runFullTest() {
    console.log('🚀 Starting GitHub Integration Test\n');
    console.log('=' .repeat(50));
    
    const tests = [
      { name: 'Initialize Wrapper', fn: () => this.initializeGitHubWrapper() },
      { name: 'OAuth Credentials', fn: () => this.testOAuthCredentials() },
      { name: 'API Connectivity', fn: () => this.testGitHubAPIConnectivity() },
      { name: 'Tool Registration', fn: () => this.testMCPToolRegistration() },
      { name: 'GitHub Actions', fn: () => this.testGitHubActions() }
    ];

    let passedTests = 0;
    
    for (const test of tests) {
      try {
        const result = await test.fn();
        if (result) {
          passedTests++;
          this.testResults.push({ name: test.name, status: 'PASS', result: true });
        } else {
          this.testResults.push({ name: test.name, status: 'FAIL', result: false });
        }
      } catch (error) {
        console.error(`❌ ${test.name} test error:`, error.message);
        this.testResults.push({ name: test.name, status: 'ERROR', result: false, error: error.message });
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    
    this.testResults.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${test.name}: ${test.status}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${tests.length} tests passed`);
    
    if (passedTests === tests.length) {
      console.log('🎉 All tests passed! GitHub integration is working correctly.');
    } else if (passedTests >= 3) {
      console.log('⚠️  Most tests passed. OAuth setup may be needed for full functionality.');
    } else {
      console.log('❌ Multiple test failures. Check configuration and OAuth setup.');
    }
    
    return passedTests === tests.length;
  }

  /**
   * Generate test report
   */
  generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      integration: 'github',
      totalTests: this.testResults.length,
      passedTests: this.testResults.filter(t => t.status === 'PASS').length,
      results: this.testResults
    };
    
    const reportPath = './github-integration-test-report.json';
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Test report saved to: ${reportPath}`);
    
    return report;
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new GitHubIntegrationTest();
  
  test.runFullTest()
    .then(success => {
      test.generateTestReport();
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    });
}

module.exports = GitHubIntegrationTest;