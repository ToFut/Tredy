# Railway Environment Variables for MCP Servers

## ✅ Changes Pushed
The MCP server startup scripts have been pushed to your repository. Railway should now be rebuilding and deploying.

## 🔧 Required Environment Variables

Add these environment variables in your Railway dashboard at:
https://railway.app/project/[your-project-id]/settings/variables

### For Gmail/Email Connector
```
NANGO_SECRET_KEY=your-nango-secret-key-from-nango-dashboard
NANGO_HOST=https://api.nango.dev
```

To get your Nango secret key:
1. Go to https://app.nango.dev
2. Navigate to Settings → API Keys
3. Copy the Secret Key (starts with `prod-` or `dev-`)

### For Google Calendar (if needed)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://tredy-prod.up.railway.app/api/oauth/google/callback
```

### For LinkedIn (if needed)
```
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### For Google Drive (if needed)
```
GOOGLE_DRIVE_CLIENT_ID=your-google-drive-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-google-drive-client-secret
```

## 🚀 After Setting Variables

1. **Trigger Redeploy**: After adding variables, click "Deploy" in Railway to apply them
2. **Check Logs**: Look for these messages in Railway logs:
   - `[MCP] Starting MCP servers...`
   - `[MCP] Starting Gmail MCP server...`
   - `[MCP] Gmail MCP server started (PID: XXX)`

3. **Test Connectors**: Go to https://tredy-prod.up.railway.app/workspace/segev/settings/connectors
   - The 500/503 errors should be gone
   - You should be able to connect Gmail and other services

## 📝 Verification Checklist

- [ ] Pushed MCP server changes to GitHub ✅ (already done)
- [ ] Railway is rebuilding with new Docker configuration
- [ ] Added NANGO_SECRET_KEY environment variable
- [ ] Added NANGO_HOST environment variable  
- [ ] Redeployed after adding variables
- [ ] Checked logs for MCP server startup messages
- [ ] Tested connector functionality in UI

## 🐛 If Still Not Working

1. **Check Railway Logs**: 
   - Look for any error messages during startup
   - Ensure the Docker build completed successfully

2. **Verify Nango Integration**:
   - Ensure your Nango account is active
   - Check that the Gmail integration is configured in Nango dashboard

3. **Debug Environment Variables**:
   - In Railway, ensure variables are in the production environment
   - No quotes needed around values in Railway UI

4. **Force Redeploy**:
   - In Railway dashboard, click "Redeploy" on the latest deployment