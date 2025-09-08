# Test Workflow Creation in Chat

## Instructions for Testing

1. Open the frontend at http://localhost:8125/
2. Login with your credentials
3. Navigate to a workspace
4. In the chat, type messages starting with `@agent` to trigger the workflow creator

## Test Cases

### Test 1: Basic Workflow Creation
```
@agent create workflow send to segev@example.com news list and then to admin@example.com all mail summary from yesterday
```

### Test 2: Sequential Actions
```
@agent create workflow first send email to user@example.com then create a summary report
```

### Test 3: Simple Workflow
```
@agent create workflow send email then invite
```

### Test 4: Test Plugin Function
```
@agent test workflow plugin with message "Hello from chat"
```

### Test 5: List Workflows
```
@agent list my workflows
```

## Expected Behavior

1. The workflow creator plugin should intercept messages containing workflow-related keywords
2. A visual preview should be generated showing the workflow steps
3. Commands should be provided to save, edit, or cancel the workflow
4. The workflow should be parseable into distinct steps based on the description

## Console Logs to Monitor

In the server console, you should see:
- `🔧 [WorkflowCreator] Plugin file loaded successfully`
- `🔧 [WorkflowCreator] Setting up workflow creator plugin`
- `🔧 [WorkflowCreator] Intercepting message: [message preview]`
- `🔧 [WorkflowCreator] Is workflow request: true/false`
- `🔧 [WorkflowCreator] DETECTED workflow request, forcing workflow creation`
- `🔧 [WorkflowCreator] Handler called with: [parameters]`

## Troubleshooting

If the workflow creator is not triggering:
1. Check that the message starts with `@agent`
2. Verify the plugin is loaded in the agent skills
3. Check the browser console for WebSocket errors
4. Monitor the server logs for plugin initialization