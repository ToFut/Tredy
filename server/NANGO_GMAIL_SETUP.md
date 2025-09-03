# How to Create Gmail Integration in Nango

## Step 1: Login to Nango Dashboard
1. Go to: **https://app.nango.dev**
2. Login with your Nango account
3. You'll see the main dashboard

## Step 2: Navigate to Integrations
1. Click **"Integrations"** in the left sidebar
2. Click the **"Configure new integration"** button (usually a + or "Add" button)

## Step 3: Create Gmail Integration

### Basic Configuration:
1. **Choose Provider**: 
   - Search for **"Google"** in the provider list
   - Select **Google OAuth2**

2. **Integration Unique Key** (IMPORTANT - must be exact):
   ```
   gmail-integration
   ```
   ⚠️ This MUST match exactly what's in the code!

3. **Integration Display Name**:
   ```
   Gmail
   ```

### OAuth Credentials:
4. **Client ID**:
   - Get from Google Cloud Console (see below)
   - Example: `123456789-abcdef.apps.googleusercontent.com`

5. **Client Secret**:
   - Get from Google Cloud Console (see below)
   - Example: `GOCSPX-xxxxxxxxxxxxx`

### Scopes Configuration:
6. **OAuth Scopes** (Add ALL of these):
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/userinfo.email
   ```

7. **Save the Integration**

## Step 4: Get Google OAuth Credentials

### In Google Cloud Console:
1. Go to: **https://console.cloud.google.com**
2. Select your project (or create new one)

### Enable Gmail API:
3. Go to **"APIs & Services"** → **"Library"**
4. Search for **"Gmail API"**
5. Click on it and press **"Enable"**

### Create OAuth Credentials:
6. Go to **"APIs & Services"** → **"Credentials"**
7. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
8. Choose **"Web application"**
9. Add name: `AnythingLLM Gmail`

### Configure OAuth:
10. **Authorized JavaScript origins**:
    ```
    https://api.nango.dev
    http://localhost:3001
    ```

11. **Authorized redirect URIs** (IMPORTANT):
    ```
    https://api.nango.dev/oauth/callback
    ```

12. Click **"Create"**
13. **Copy the Client ID and Client Secret**
14. Go back to Nango and paste them

## Step 5: Test in Nango

1. In Nango Dashboard, find your `gmail-integration`
2. Click **"Test"** or **"Try Auth Flow"**
3. It should open Google OAuth
4. If successful, you're ready!

## Step 6: Use in AnythingLLM

1. **Restart AnythingLLM server**:
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   yarn dev:server
   ```

2. Go to **Workspace Settings → Connectors**
3. Gmail should now appear
4. Click **"Connect"**
5. Complete OAuth flow
6. Test with: `@agent send email to test@example.com`

## Troubleshooting

### "about:blank" Error
- Integration ID doesn't match exactly (`gmail-integration`)
- Client ID/Secret are incorrect
- Redirect URI not added in Google Console

### "Invalid Client" Error  
- Client Secret is wrong
- OAuth app not published/verified

### "Scope Error"
- Missing required scopes in Nango configuration
- Add all 4 Gmail scopes listed above

### Gmail Not Appearing
- Server needs restart after code changes
- Check browser console for errors
- Verify Nango keys in .env file

## Quick Checklist

- [ ] Google Cloud Console:
  - [ ] Gmail API enabled
  - [ ] OAuth 2.0 credentials created
  - [ ] Redirect URI added: `https://api.nango.dev/oauth/callback`
  - [ ] Client ID copied
  - [ ] Client Secret copied

- [ ] Nango Dashboard:
  - [ ] Integration created with ID: `gmail-integration`
  - [ ] Google OAuth credentials pasted
  - [ ] All 4 Gmail scopes added
  - [ ] Integration saved

- [ ] AnythingLLM:
  - [ ] Server restarted
  - [ ] Gmail appears in Connectors
  - [ ] OAuth flow completes
  - [ ] Agent can send emails

## Common Integration IDs

For reference, these are the standard integration IDs:
- Gmail: `gmail-integration`
- Google Calendar: `google-calendar-getting-started`
- Slack: `slack`
- GitHub: `github`
- Stripe: `stripe`

## Need Help?

1. Check Nango logs in dashboard
2. Check browser console for errors
3. Verify exact integration ID match
4. Ensure all scopes are included