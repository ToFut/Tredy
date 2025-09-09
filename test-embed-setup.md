# Testing AnythingLLM Embedded Chat Widget

## Quick Setup Guide

### 1. Start AnythingLLM Server
```bash
# In the AnythingLLM root directory
yarn dev:server    # Starts backend on port 3001
yarn dev:frontend  # Starts frontend on port 3000 (in another terminal)
```

### 2. Create an Embed Configuration
1. Open AnythingLLM in your browser: `http://localhost:3000`
2. Go to **Settings** → **Chat Embed Widgets**
3. Click **"New Embed"** 
4. Configure:
   - **Name**: "Test Widget"
   - **Workspace**: Select any workspace with documents
   - **Enabled**: ✅ 
   - **Chat Mode**: Query or Chat
   - **Permissions**: Configure as needed

5. **Save** and copy the **Embed ID** (UUID)

### 3. Update Test Page
1. Open `test-embed-widget.html`
2. Replace `data-embed-id="demo-embed-id"` with your actual embed ID
3. Save the file

### 4. Test the Widget
1. Open `test-embed-widget.html` in your browser
2. You should see a chat bubble appear (bottom-right corner)
3. Click it and try asking questions about your workspace documents

## Customization Options

The test page includes these customization examples:

```html
<script
  data-embed-id="your-actual-embed-id"
  data-base-api-url="http://localhost:3001/api/embed"
  data-chat-icon="support"              <!-- Icon: plus, chatBubble, support -->
  data-button-color="#667eea"           <!-- Chat button color -->
  data-chat-bubble-color="#764ba2"      <!-- Chat bubble background -->
  data-text-color="#ffffff"            <!-- Text color -->
  data-assistant-name="Your Bot"        <!-- Assistant name -->
  data-greeting="Hi! How can I help?"   <!-- Welcome message -->
  data-support-email="help@yoursite.com" <!-- Support email link -->
  data-window-height="600px"           <!-- Chat window height -->
  data-window-width="400px"            <!-- Chat window width -->
  data-position="bottom-right"         <!-- Position: bottom-right, bottom-left, etc -->
  src="http://localhost:3000/embed/anythingllm-chat-widget.min.js">
</script>
```

## Troubleshooting

**Widget not appearing?**
- Check browser console for errors
- Verify AnythingLLM server is running
- Confirm embed ID is correct
- Check CORS settings if hosting on different domain

**Widget appears but doesn't respond?**
- Verify workspace has documents uploaded
- Check embed configuration allows the domain
- Ensure workspace has proper LLM provider configured

**Chat gives generic responses?**
- Make sure workspace has documents embedded
- Check if chat mode is set to "Query" vs "Chat"
- Verify similarity threshold settings

## Production Notes

For production deployment:
1. Replace localhost URLs with your actual domain
2. Set proper CORS policies
3. Configure rate limiting
4. Set domain allowlists in embed config
5. Monitor usage via the embed chats dashboard