# Pipeline Fix Summary

## Problem Diagnosed

The agent was hitting Anthropic successfully, but Claude was responding with **text instead of tool calls**, causing the Explorer loop to exit immediately after the first response.

### Root Causes

1. **`tool_choice: { type: 'auto' }`** allowed Claude to choose whether to use tools—it was choosing to respond with text
2. **System prompt** mentioned tool usage but didn't enforce iterative behavior
3. **User message** listed all steps at once, encouraging a summary response rather than action-by-action execution

## Changes Made

### 1. Force Initial Tool Usage (`explorer-service/src/index.ts`)

```typescript
// Line 348: Force tool usage on first turn, then allow auto
const effectiveToolChoice = this.toolChoice ?? (step === 0 ? { type: 'any' } : { type: 'auto' });
```

**Impact:** Claude MUST call a tool on the first turn, preventing immediate text-only responses.

### 2. Enhanced System Prompt (`pipeline-coordinator/src/cli.ts`)

**Before:** Generic "use tools" instruction  
**After:** 7 explicit critical rules including:
- Call `record_action` for EVERY action
- Execute ONE action at a time
- Continue iteratively after each tool result
- No explanations or summaries

### 3. Improved User Message (`pipeline-coordinator/src/cli.ts`)

**Before:** Listed all 10 steps with "execute precisely"  
**After:** 
- Explicit instruction to "call record_action" for each step
- Detailed parameter examples for each action
- "After each successful tool result, call record_action again"
- Clear state transitions (initial → login_form → dashboard → zelle_form → confirmation)
- Fixed recipient ID to use correct value (`rec-001` not `1`)

### 4. Enhanced Debug Logging (`explorer-service/src/index.ts`)

Added detailed logs at critical decision points:
- `stop_reason` value
- Number of content blocks
- Number of resolved tools
- Clear EXIT/CONTINUE messages

## Testing Steps

### 1. Ensure Demo Bank is Running

```bash
# Terminal 1
npm run dev --workspace @arcanared/demo-bank
```

Should see: `Demo bank server listening on http://localhost:4000`

### 2. Verify Demo Bank Manually

Open browser to `http://localhost:4000/login`
- Username: `demouser`
- Password: `Demo1234!`
- Verify dashboard loads with "Start Zelle Payment" button

### 3. Enable Debug Logs and Run Pipeline

```bash
# Terminal 2
export EXPLORER_DEBUG_LOGS=true
npm run run:pipeline
```

### 4. What to Look For

**SUCCESS INDICATORS:**

✅ Debug log: `tool_choice: { type: 'any' }` on step 0  
✅ Log: `resolved tool input` with action details  
✅ Log: `emitting event` with type `action`  
✅ Log: `CONTINUE: will execute N tools and continue loop`  
✅ Multiple iterations (step 0, 1, 2, etc.)  
✅ Final output includes populated `trace.events` array  
✅ Artifacts array includes screenshots and DOM snapshots

**FAILURE INDICATORS (if still broken):**

❌ Log: `EXIT: stop_reason is not tool_use, breaking loop` on step 0  
❌ Only one iteration in logs  
❌ Empty `trace.events` array  
❌ Empty `artifacts` array

## Verification Commands

```bash
# Check if demo bank is running
curl http://localhost:4000/login

# Run with full debug output
EXPLORER_DEBUG_LOGS=true npm run run:pipeline 2>&1 | tee pipeline-output.log

# Search for key patterns
grep "stop_reason" pipeline-output.log
grep "record_action" pipeline-output.log
grep "emitting event" pipeline-output.log
```

## Expected Behavior After Fix

1. **Step 0:** Claude calls `record_action` with navigate action
2. **Playwright:** Executes navigate, returns DOM snapshot + screenshot
3. **Step 1:** Claude receives tool result, calls `record_action` with type action
4. **Iterations continue** for each workflow step
5. **Final output:** 10+ action events in trace, multiple artifacts

## Rollback Plan

If changes break the pipeline:

```bash
git checkout HEAD -- packages/explorer-service/src/index.ts
git checkout HEAD -- packages/pipeline-coordinator/src/cli.ts
npm run run:pipeline  # test with original code
```

## Additional Notes

- The `{ type: 'any' }` tool_choice forces Claude to use ANY available tool on first turn
- After first turn, switches to `{ type: 'auto' }` for natural conversation flow
- System prompt emphasizes "do NOT provide explanations" to prevent text responses
- User message provides complete parameter examples to reduce Claude guessing
