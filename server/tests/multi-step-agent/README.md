# Multi-Step Agent Tests

This folder contains tests for the multi-action handler plugin that ensures agents complete all parts of multi-action requests.

## Problem Being Solved

When users request multiple similar actions (e.g., "send email to A and B"), the agent was only completing the first action and then stopping. The multi-action handler ensures all actions are completed.

## Files

- `test-multi-action.js` - Unit tests with mocked components
- `integration-test.js` - Integration tests using the actual agent system
- `run-test.sh` - Shell script to run all tests

## Running Tests

### Unit Tests (Mocked)
```bash
cd server/tests/multi-step-agent
node test-multi-action.js
```

### Integration Tests
```bash
cd server/tests/multi-step-agent
node integration-test.js
```

### Run All Tests
```bash
cd server/tests/multi-step-agent
./run-test.sh
```

## Test Cases

1. **Multiple Email Recipients**
   - Input: "Send invite to john@example.com and jane@example.com"
   - Expected: 2 separate email function calls

2. **Multiple Calendar Invites**
   - Input: "Book meeting with A and B"
   - Expected: 2 separate booking function calls

3. **Three or More Recipients**
   - Input: "Send to A, B, and C"
   - Expected: 3 separate function calls

## How It Works

The multi-action handler plugin:

1. **Detects** multi-part requests by looking for:
   - Multiple email addresses
   - The word "and" with emails
   - Patterns suggesting multiple actions

2. **Tracks** progress:
   - Counts expected actions
   - Monitors completed actions
   - Shows progress (1/2, 2/2, etc.)

3. **Forces Continuation** when needed:
   - If LLM tries to return text mid-task
   - Adds system message to continue
   - Ensures all actions complete

## Expected Behavior

### Before Fix
```
User: "Send to A and B"
Agent: Sends to A
Agent: "I'll now send to B" (but doesn't actually do it)
Session ends
```

### After Fix
```
User: "Send to A and B"
Agent: Detects 2 actions needed
Agent: Sends to A (Progress: 1/2)
Agent: Forced to continue
Agent: Sends to B (Progress: 2/2)
Agent: "Completed all 2 actions!"
```

## Success Criteria

Tests pass when:
- All recipients receive their messages
- Progress updates are sent
- No early session termination
- Function calls match expected count