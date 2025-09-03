const { Nango } = require('@nangohq/node');

const nango = new Nango({
  secretKey: process.env.NANGO_SECRET_KEY || '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91',
  host: process.env.NANGO_HOST || 'https://api.nango.dev'
});

async function testGmailAccess() {
  console.log('Testing Gmail OAuth access...\n');
  
  try {
    // Test Gmail API access using same config as Calendar
    const response = await nango.get({
      endpoint: '/gmail/v1/users/me/profile',
      connectionId: 'workspace_3',
      providerConfigKey: 'gmail-integration'
    });
    
    console.log('✅ Gmail Access Working!');
    console.log('Email:', response.data.emailAddress);
    console.log('Total Messages:', response.data.messagesTotal);
    console.log('Total Threads:', response.data.threadsTotal);
    console.log('\nGmail is ready to use with the MCP server!');
    
    return true;
    
  } catch (error) {
    console.log('❌ Gmail Access Not Available');
    
    if (error.response?.status === 403) {
      console.log('\nIssue: Missing Gmail permissions');
      console.log('Solution: Add Gmail scopes to Google OAuth in Nango and re-authorize');
      console.log('\nRequired scopes to add:');
      console.log('- https://www.googleapis.com/auth/gmail.readonly');
      console.log('- https://www.googleapis.com/auth/gmail.send');
      console.log('- https://www.googleapis.com/auth/gmail.modify');
    } else if (error.response?.status === 401) {
      console.log('\nIssue: Connection not authenticated');
      console.log('Solution: Re-authorize Google connection in Nango');
    } else {
      console.log('\nError details:', error.response?.data || error.message);
    }
    
    console.log('\nNext steps:');
    console.log('1. Go to Nango Dashboard');
    console.log('2. Edit google-calendar-getting-started integration');
    console.log('3. Add Gmail scopes listed above');
    console.log('4. Re-authorize the connection');
    
    return false;
  }
}

// Run the test
testGmailAccess();