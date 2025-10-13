# Development Quickstart

## Prerequisites
- Node.js 20+
- npm 9+
- ffmpeg (needed later for deterministic video stitching)

## Setup
```bash
npm install
```

## Useful Scripts
- `npm run build` — builds every workspace package (TypeScript compilation or stub commands where applicable).
- `npm run lint` — runs ESLint once lint wiring is added to each package.
- `npm run dev --workspace @arcanared/pipeline-coordinator` — starts the coordinator in watch mode (placeholder until service logic lands).

## Workspace Layout
- `packages/shared` — shared types for runs, steps, artifacts, manifests, and scoring.
- `packages/explorer-service` — Anthropic CUA integration plus redaction pipeline.
  - `src/index.ts` exposes `AnthropicComputerUseClient`, `ToolExecutor`, and streaming helpers.
- `packages/workflow-compiler` — converts Explorer trace to Workflow DSL draft.
- `packages/runner-service` — executes Workflow DSL via `ToolExecutor`, persists DOM snapshots, and aggregates artifacts for bundling.
- `packages/artifact-processor` — bundle manifest builder stub with hashing placeholders.
- `packages/score-service` — AgentScore timeline computation skeleton.
- `packages/policy-engine` — progressive friction rule evaluation stub.
- `packages/exporter-service` — evidence bundle exporter placeholder.
- `packages/observer-service` — audit/telemetry recorder stub.
- `packages/pipeline-coordinator` — end-to-end orchestrator wiring the components together.
- `packages/playback-viewer` — static viewer stub (to be replaced with interactive UI).
- `packages/tool-executor-playwright` — Playwright-based executor emitting DOM snapshots, screenshots, and tool results.
- `packages/demo-bank` — lightweight staging web app (login, dashboard, Zelle send) used for local demos.

## Immediate Next Engineering Tasks
1. Implement live Explorer run with Anthropic + Playwright executor (CLI scaffold ready).
2. Enhance `RunnerService` integrations once real selectors/flows are compiled from Explorer traces.
3. Extend `ArtifactProcessor` with bundle zipping + ffmpeg timeline once Playwright capture lands.
4. Implement `/score` HTTP API (likely in a new `score-service` server module) and integrate webhook triggers.
5. Add persistence layer interfaces (Postgres dynamo?) for runs, steps, artifacts, audit logs, and integrate Observer with append-only storage.
6. Replace playback viewer stub with static app reading `index.json` manifest and rendering timeline/video panels.

## Testing Philosophy
- Add unit tests per package as logic matures (Vitest/Jest TBD).
- Plan for deterministic replay validation suite (~5 consecutive runs) once Playwright integration lands.
- Include contract tests for mitigation YAML generator and policy engine thresholds as they evolve.

## Operational Notes
- Configure AWS resources (S3 Object Lock, KMS keys) via IaC before enabling artifact uploads.
- Maintain redaction rule registry per workflow; ensure secrets sourced from AWS Secrets Manager.
- Capture metrics (export latency, bundle size, signed URL usage) once telemetry stack is defined.

## Running the Pipeline
- `npm run dev --workspace @arcanared/demo-bank` — starts the demo bank staging app on `http://localhost:4000` (press `Ctrl+C` to stop).
- `npm run run:pipeline`
  - Builds the MVP service packages and executes the coordinator CLI.
  - With no `ANTHROPIC_API_KEY`, runs in mock mode (uses `MockComputerUseClient` + stub executor) and prints the pipeline summary JSON.
  - Provide `ANTHROPIC_API_KEY` (and optional `ANTHROPIC_MODEL`, `EXPLORER_WORKFLOW`, `EXPLORER_GOAL`, `DEMO_BANK_BASE_URL`, `DEMO_BANK_USERNAME`, `DEMO_BANK_PASSWORD`) to drive a real Explorer session with the Playwright executor against the demo bank.
  - Artifacts land under `tmp/explorer-artifacts/<run_id>/` by default; screenshots and DOM snapshots are referenced in the generated manifest.
