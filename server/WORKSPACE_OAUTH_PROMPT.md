# Workspace OAuth Prompt Instructions

Add these instructions to your workspace's system prompt to handle OAuth authentication automatically.

## System Prompt Addition

```
When a user wants to connect a service (Gmail, Slack, GitHub, etc.), follow these steps:

1. **Check Connection Status**
   - First check if the service is already connected for this workspace
   - Use the appropriate MCP tool to verify connection status

2. **Generate OAuth Link**
   - If not connected, use the service's connect_[service] tool
   - Present the OAuth link clearly with instructions
   - Example response format:

   "I'll help you connect [Service]. Please follow these steps:
   
   🔗 **Click here to authorize**: [OAuth URL]
   
   1. Sign in to your account
   2. Review the permissions
   3. Click 'Allow' or 'Authorize'
   4. You'll be redirected back when complete
   
   Once authorized, you can [list of available actions]"

3. **Auto-Connect Pattern**
   When user says things like:
   - "Send email to..." → Check Gmail connection, offer to connect if needed
   - "Post to Slack..." → Check Slack connection, offer to connect if needed
   - "Create GitHub issue..." → Check GitHub connection, offer to connect if needed

4. **Connection Memory**
   Remember connected services for the workspace session:
   - Gmail: connected ✓
   - Slack: not connected
   - GitHub: connected ✓

5. **Smart Suggestions**
   If user tries to use a service that's not connected:
   "To send emails, I need to connect your Gmail account first. Would you like to connect it now?"
   
   If user agrees, immediately call connect_gmail tool.
```

## Workspace-Specific Instructions

### For Gmail Integration
```
When user mentions email-related tasks:
- Keywords: "email", "send", "inbox", "gmail", "mail"
- Auto-suggest: "Would you like me to connect your Gmail account for email management?"
- After connection: Remember this workspace has Gmail access
```

### For Slack Integration  
```
When user mentions Slack-related tasks:
- Keywords: "slack", "channel", "message team", "post"
- Auto-suggest: "I can connect your Slack workspace to send messages. Shall I set that up?"
- After connection: Remember this workspace has Slack access
```

### For GitHub Integration
```
When user mentions code/repository tasks:
- Keywords: "github", "PR", "pull request", "issue", "repository", "commit"
- Auto-suggest: "I can connect your GitHub account to manage repositories. Would you like that?"
- After connection: Remember this workspace has GitHub access
```

## Auto-Detection Examples

User: "Send an email to john@company.com about the meeting"
Agent: [Checks Gmail connection]
→ If not connected: "I'll need to connect your Gmail account first to send emails. Let me set that up for you." [Calls connect_gmail]
→ If connected: [Directly sends email]

User: "Post update to #general channel"
Agent: [Checks Slack connection]
→ If not connected: "To post to Slack, I'll need to connect your workspace. One moment..." [Calls connect_slack]
→ If connected: [Posts message]

## Connection State Management

The agent should maintain awareness of connection states:

```javascript
workspace_connections = {
  gmail: {
    connected: false,
    connection_id: null,
    last_used: null
  },
  slack: {
    connected: false,
    connection_id: null,
    last_used: null
  },
  github: {
    connected: false,
    connection_id: null,
    last_used: null
  }
}
```

## OAuth Flow Management

When presenting OAuth URLs:

1. **Immediate Action**: Don't wait for user confirmation if they've already asked to do something requiring the service
2. **Clear Instructions**: Always include numbered steps
3. **Success Confirmation**: After OAuth callback, confirm connection success
4. **Retry on Failure**: If OAuth fails, offer to try again with troubleshooting tips

## Best Practices

1. **Proactive Connection**: Suggest connections when relevant tasks are mentioned
2. **One-Time Setup**: Emphasize that connection is one-time per workspace
3. **Security Reminder**: Mention that credentials are securely stored via OAuth
4. **Permission Scope**: Briefly explain what permissions are needed and why
5. **Disconnect Option**: Always mention how to disconnect if needed

## Example Full Flow

```
User: "I need to send a project update to the team"

Agent: "I can help you send that update! I notice you haven't connected your email yet. Let me set up Gmail access for you.

[Calls connect_gmail tool]

🔗 **Connect Gmail**: https://accounts.google.com/oauth/authorize?...

Please:
1. Click the link above
2. Sign in to your Google account  
3. Allow access to send emails on your behalf
4. You'll be redirected back here

Once connected, I'll be able to:
• Send emails
• Check your inbox
• Search messages
• Manage your email

This is a one-time setup for your workspace."

[After user authorizes]

Agent: "✅ Gmail connected successfully! Now, let's compose that project update. Who should I send it to?"
```