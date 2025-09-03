# Add Gmail OAuth to Existing Google Integration

## Current Situation
- ✅ Google Calendar OAuth is working (via Nango)
- ✅ Connection ID: workspace_3
- ✅ Provider Config: google-calendar-getting-started
- ❌ Gmail scopes not included yet

## Steps to Add Gmail OAuth

### Option 1: Via Nango Dashboard (Manual)

1. **Login to Nango Dashboard**
   - Go to: https://app.nango.dev
   - Navigate to Integrations

2. **Find Google Integration**
   - Look for: "google-calendar-getting-started"
   - Click Edit/Configure

3. **Add Gmail Scopes**
   Current scopes (Calendar):
   ```
   https://www.googleapis.com/auth/calendar
   https://www.googleapis.com/auth/calendar.events
   ```
   
   ADD these Gmail scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/gmail.compose
   ```

4. **Save Changes**

5. **Re-authorize Connection**
   - Go to Connections
   - Find workspace_3
   - Click "Re-authorize" or "Refresh"
   - Complete OAuth flow with new permissions

### Option 2: Via Nango API (Programmatic)

```javascript
// update-google-oauth.js
const { Nango } = require('@nangohq/node');

const nango = new Nango({
  secretKey: '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91'
});

// Update integration configuration
async function addGmailScopes() {
  try {
    // Get current config
    const config = await nango.getIntegration({
      uniqueKey: 'google-calendar-getting-started'
    });
    
    // Add Gmail scopes
    const updatedScopes = [
      ...config.scopes,
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose'
    ];
    
    // Update integration
    await nango.updateIntegration({
      uniqueKey: 'google-calendar-getting-started',
      scopes: updatedScopes
    });
    
    console.log('✅ Gmail scopes added successfully');
    
    // Generate new auth URL
    const authUrl = await nango.getAuthorizationUrl({
      providerConfigKey: 'google-calendar-getting-started',
      connectionId: 'workspace_3'
    });
    
    console.log('\n🔗 Re-authorize here:', authUrl);
    
  } catch (error) {
    console.error('Error updating scopes:', error);
  }
}

addGmailScopes();
```

### Option 3: Direct OAuth URL (Immediate)

Since we know the configuration, generate the OAuth URL directly:

```
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_GOOGLE_CLIENT_ID&
  redirect_uri=https://api.nango.dev/oauth/callback&
  response_type=code&
  scope=https://www.googleapis.com/auth/calendar%20
        https://www.googleapis.com/auth/calendar.events%20
        https://www.googleapis.com/auth/gmail.readonly%20
        https://www.googleapis.com/auth/gmail.send%20
        https://www.googleapis.com/auth/gmail.modify&
  access_type=offline&
  prompt=consent&
  state=workspace_3
```

## Quick Test After OAuth

```javascript
// test-gmail-oauth.js
const { Nango } = require('@nangohq/node');

const nango = new Nango({
  secretKey: '7aac4fec-c1fa-4eba-9100-4b2ef9bc2b91'
});

async function testGmailAccess() {
  try {
    // Test Gmail API access
    const response = await nango.get({
      endpoint: '/gmail/v1/users/me/profile',
      connectionId: 'workspace_3',
      providerConfigKey: 'google-calendar-getting-started'
    });
    
    console.log('✅ Gmail Access Working!');
    console.log('Email:', response.data.emailAddress);
    console.log('Total Messages:', response.data.messagesTotal);
    
  } catch (error) {
    console.log('❌ Gmail Access Failed');
    console.log('Error:', error.response?.data || error.message);
    console.log('\nYou need to re-authorize with Gmail scopes');
  }
}

testGmailAccess();
```

## After OAuth is Updated

1. The existing Google connection will have Gmail access
2. Simple Gmail MCP will work immediately
3. Test with: `@agent send email to test@example.com`

## Important Notes

- Since Calendar already works, we're just ADDING scopes
- Same connection (workspace_3) will work for both services
- User only needs to re-authorize once to add Gmail permissions
- Both MCPs use same providerConfigKey