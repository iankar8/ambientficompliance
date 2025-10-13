# Explorer Service Integration Notes

## Overview
The Explorer service orchestrates Anthropic Computer Use sessions to capture step-by-step agent behaviour: DOM actions, network traces, and reasoning breadcrumbs needed for exploit bundles. It consumes a `ComputerUseClient` that yields structured events; the default export now includes an `AnthropicComputerUseClient` ready for CLAUDE CUA once a tool executor is wired.

## Wiring Anthropic CUA
1. **Instantiate the client**
   ```ts
   import { AnthropicComputerUseClient, ExplorerService } from '@arcanared/explorer-service';

   const explorer = new ExplorerService(
     {
       workflow: 'zelle_send',
       goal: 'Send $5 to staged recipient',
       allowlistSelectors: ['#username', '#password', '#submit']
     },
     new AnthropicComputerUseClient({
       model: 'claude-3-5-sonnet-20241022',
       systemPrompt: 'You are ArcanaRed Explorer. Drive the target workflow deterministically.',
       apiKey: process.env.ANTHROPIC_API_KEY,
       maxTokens: 2048,
       maxSteps: 20
     })
   );
   ```

2. **Provide a tool executor** – The client expects a `ToolExecutor` that receives each `tool_use` block (action request) and performs it (e.g., via Playwright + custom instrumentation). The executor should:
   - Carry out the UI interaction.
   - Emit any extra `ComputerUseEvent`s (DOM snapshots, HAR paths, logs).
   - Return `tool_result` blocks so the conversation can continue.

   ```ts
   const executor: ToolExecutor = {
     async execute({ toolUse, input }) {
       const events: ComputerUseEvent[] = await runPlaywrightAction(toolUse.name, input);
       const toolResult = buildToolResult(toolUse.id, events);
       return { events, toolResult };
     }
   };
   ```

   Pass the executor into the client:
   ```ts
   new AnthropicComputerUseClient({
     ...config,
     toolExecutor: executor
   });
   ```

3. **Run and capture**
   ```ts
   const { trace, errors } = await explorer.run();
   // Persist trace events + DOM snapshots for downstream bundle builder
   ```

## Playwright Tool Executor

The package `@arcanared/tool-executor-playwright` ships a production-ready `PlaywrightToolExecutor` that
converts CUA tool calls into deterministic Playwright actions, DOM snapshots, and screenshots.

```ts
import { AnthropicComputerUseClient, ExplorerService } from '@arcanared/explorer-service';
import { PlaywrightToolExecutor } from '@arcanared/tool-executor-playwright';

const executor = new PlaywrightToolExecutor({
  captureDom: true,
  screenshotDirectory: '/tmp/explorer/screenshots',
  newPagePerAction: false
});

const explorer = new ExplorerService(
  config,
  new AnthropicComputerUseClient({
    ...cta,
    toolExecutor: executor
  })
);

const { trace } = await explorer.run();
// trace.artifacts => [{ type: 'screenshot', path, contentType: 'image/png' }, ...]
await executor.dispose();
```

### Supported actions (initial set)

`navigate`, `click`, `type`, `fill`, `press`, `select`, `wait_for_selector`, `wait_for_timeout`, `set_input_files`.

Each action expects the following inputs in the tool payload:

- `navigate`: `url`
- `click`: `selector`, optional `button`, `timeout`
- `type`/`fill`: `selector`, `value`
- `press`: `selector`, `key`
- `select`: `selector`, `value`
- `wait_for_selector`: `selector`, optional `state`, `timeout`
- `wait_for_timeout`: `timeout` (ms)
- `set_input_files`: `selector`, `files` (string[])

Success emits info logs plus optional DOM snapshots and screenshot logs. Failures propagate `ComputerUseEvent` errors and cause the tool result to be marked as `is_error`.

## Event Flow
- `content_block` events from Anthropic are converted to `ComputerUseEvent`s (actions, DOM snapshots, HAR references, logs).
- Redaction rules apply before persistence, ensuring selectors/params scrubbed of PII.
- Sessions halt once goals met, an error occurs, or `maxSteps` is reached.

## Defaults & Overrides
- Default tool definition (`record_action`) gathers `state`, `selector`, `action`, `params`, `result`.
- `AnthropicComputerUseClient` accepts:
  - `systemPrompt`, `model`, `maxTokens`, `maxSteps`.
  - Custom `tools` and `toolChoice` if specialised schemas are required.
  - `conversationPreamble` / `userMessageBuilder` for bespoke prompting per workflow.

## Mock Runs
Use the bundled mock client for deterministic dry-runs:
```ts
const explorer = new ExplorerService(config, new MockComputerUseClient([...events]));
const output = await explorer.run();
```
See `packages/explorer-service/examples/mockSession.ts` for a runnable snippet.

## Next Steps
- Implement a Playwright-based `ToolExecutor` that captures screenshots, HAR, and DOM snapshots per action.
- Feed executor output into Artifact Processor for bundle generation.
- Add regression tests once the executor contract stabilises (Vitest in root tooling backlog).
