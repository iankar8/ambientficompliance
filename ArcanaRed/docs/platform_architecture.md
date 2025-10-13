# Platform Architecture Overview (MVP → v1)

## Component Map
- Explorer Service (CUA)
  - Launches Anthropic Computer Use Agent with restricted toolset and workflow-specific goal.
  - Streams actions into Trace Bus, applies inline redaction (regex + selector-based masks), records reasoning summaries.
  - Outputs: action log JSONL, DOM snapshots, network metadata, status events.
- Workflow Compiler
  - Consumes Explorer traces, normalizes selectors (role/name/css priority), identifies states, transitions, guards, parameters.
  - Emits DSL document with metadata (version, checksum, UI revision, risk scenario tag).
  - Stores DSL in Workflow Registry (Postgres) with diff history and Validator CI.
- Deterministic Runner (Playwright)
  - Loads DSL, executes in hardened container (single browser context, deterministic timeouts).
  - Enables Playwright tracing (screenshots, snapshots), stores raw artifacts to local scratch.
  - Emits per-step telemetry to Metrics Collector; halts on deviations and signals Repair Agent flow.
- Artifact Processor
  - Post-run job: converts screenshots to MP4 (ffmpeg, 10 fps, CRF 28, 720p), zips DOM snapshots, redacts HAR bodies, salts sensitive trace params.
  - Builds `index.json` manifest with metadata (size, SHA-256, content-type, step mapping) and top-level bundle hash.
  - Uploads `exploit_bundle.zip` to S3 (Object Lock, SSE-KMS) under `customers/{cid}/runs/{run_id}/bundle_v1.zip`.
- Agent Score Engine
  - Feature modules: behavior (timings, retries), device fingerprint, network fingerprint, semantic cues, graph anomalies.
  - Weighted additive scoring with explainability; API `/score` returns value, top contributing signals, rationale snippet, evidence link.
  - Feeds Policy Engine thresholds and webhook triggers.
- Policy Engine
  - YAML-defined rules per tenant; maps Agent Score + scenario labels to actions (soft challenge, step-up, hold, review).
  - Integrates with adapters (auth provider, payouts hold, ticketing, fraud orchestration).
- Exporter & Mitigation Generator
  - Derives mitigation templates (YAML/PR) from scenario, signal insights, and best-practice playbooks.
  - Uses Claude Code SDK to draft code or configuration changes.
- Observer & Audit
  - Immutable audit log (append-only, hashed) stored in DynamoDB with Streams into S3 WORM archive.
  - Metrics emitter → Prometheus/Grafana or CloudWatch (capture/export latency, replay determinism, signed URL usage).
  - Alerting on capture failures, large bundle variance, download anomalies.
- Playback Experience
  - Static HTML (S3/CloudFront) referencing manifest; video player with timeline markers, step table with Agent Score deltas, HAR/DOM/trace tabs, mitigation downloads.
  - Authentication via signed URL/cookie ≤ 24 hours; logs view events.

## Data Flow
1. Explorer run triggered for workflow version.
2. Actions streamed → Trace Bus; DOM snapshots/HAR recorded; inline redaction applied.
3. Compiler builds DSL (state machine + selectors + guard conditions) and stores version (v0.1 for Zelle).
4. Runner executes DSL via Playwright; collects screenshots, HAR, DOM, trace; logs metrics.
5. Artifact Processor redacts, stitches, hashes; builds exploit bundle and uploads to S3.
6. Agent Score Engine computes score timeline; stores step records, emits `/score` response and webhook event if thresholds exceeded.
7. Policy Engine processes webhook (e.g., recommend hold) and writes mitigation YAML template.
8. Observer records audit entries and metrics; playback viewer accesses artifacts via signed URL.

## Storage & Schemas
- `runs` table: `id`, `customer_id`, `workflow`, `persona`, timestamps, status, score, pattern label, `bundle_url`, `bundle_sha256`.
- `steps` table: `id`, `run_id`, index, timestamp, state, action, selector, result, score_delta, `redacted` flag.
- `artifacts` table: `run_id`, type (`har`, `dom`, `video`, `trace`, `mitigation`, `signals`), URL, SHA-256, size bytes.
- `access_log` table: `artifact_id`, actor_id, timestamp, IP, success flag.
- `audit_log` append table: `run_id`, step index, actor (`CUA`|`Runner`|`System`), action summary, redaction applied, previous hash, current hash.

## Security & Compliance Controls
- All persistent artifacts encrypted with SSE-KMS; optional customer-managed keys for unredacted vault (off by default).
- Inline redaction pipeline supports regex bank (`email`, `phone`, `acct`, `otp`, `name`) and DOM selector registry per workflow.
- Secrets handled via AWS Secrets Manager; never logged.
- Kill switch service to disable Explorer or Runner per workflow or tenant.
- Multi-tenant isolation enforced at execution and storage layers (namespaced S3 prefixes, IAM conditions, workload identity).

## Scaling Considerations
- Container orchestration (K8s or ECS) for Explorer/Runner pods with per-run isolation.
- Queue-based orchestration (e.g., SQS) triggers Artifact Processor; ensures stateless services.
- Lifecycle policies automatically transition bundles to infrequent access/Glacier per retention agreements.
- Introduce caching layer for AgentConfidence API (Redis) at v1 to meet SLA.<500 ms.

## Future Enhancements (v1+)
- Continuous Scheduler for nightly replays; integrates with Validator CI and Repair Agent autopatching.
- Scenario Library enabling param sweeps (amounts, recipients, IP rotations) and benchmark dataset contributions.
- Transparency log for bundle hashes (public/permissioned ledger) to strengthen chain-of-custody.
- Dataset/Signature feed generation with anonymized attack patterns and mitigations.
- SOC2 readiness: logging, access reviews, change management, runbooks.
