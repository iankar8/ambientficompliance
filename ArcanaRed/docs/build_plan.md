# AI Adversarial Testing Platform — Build Plan

## 1. Product Narrative Snapshot
- Mission: simulate and detect AI-driven abuse of financial and commerce workflows, then ship progressive defenses with replay-grade evidence.
- Hybrid engine: Explorer (Anthropic CUA) discovers or repairs flows; Compiler produces Workflow DSL; Deterministic Runner (Playwright) replays deterministically; Exporter emits exploit bundles and mitigation-as-code; Observer guarantees recording, auditability, and chain of custody.

## 2. System Architecture (MVP baseline)
- Explorer Service: orchestrates Anthropic CUA sessions, captures raw trace (DOM, HAR, action stream), enforces action allowlist, redacts inline, and pushes events to the Trace Bus.
- Workflow Compiler: consumes trace JSONL, normalizes selectors, derives state machine (DSL v0.1), stores in Workflow Registry with versioning.
- Deterministic Runner: Playwright-based executor that reads DSL, runs replay env with tracing enabled, captures screenshots, HAR, console logs, and network metadata.
- Artifact Processor: stitches screenshots into deterministic MP4 via ffmpeg, performs HAR/body redaction, stores DOM snapshots, trace, AgentScore signals, rationale, mitigation YAML, and produces `index.json` with per-file hashes.
- Agent Score Engine: feature extractors → weighted additive aggregator with explanation metadata; exposes `/score` API and high-severity webhook emitter.
- Policy Engine: stores progressive-friction rules, triggers step-up, holds, reviews, ticketing adapters.
- Storage Layer: S3 with Object Lock + KMS; lifecycle hot → infrequent → Glacier; manifest-driven bundle uploads.
- Audit & Observability: append-only audit log (S3/DynamoDB), metrics pipeline (capture success, bundle latency/size, score latency), anomaly alerts.
- Playback UI: static viewer (HTML/JS) served via signed URL; loads manifest, video, HAR, DOM, trace, signals, mitigation details.

## 3. MVP Delivery Plan (Weeks 0–2)
### Week 1: Capture, Replay, Evidence
1. Integrate Explorer (CUA) into Zelle staging flow, enabling 1-shot trace capture with guardrails and inline redaction.
2. Implement Trace→DSL compiler (states, selectors, guards, params) with versioned storage and diff tooling.
3. Stand up Deterministic Runner (Playwright) with tracing and screenshot timeline; confirm deterministic replays across 5 dry runs.
4. Build Artifact Processor: screenshot→video stitcher (ffmpeg 10 fps, CRF 28, 720p), HAR capture + redaction, DOM snapshot capture, trace serialization, AgentScore signals, rationale and mitigation templates.
5. Assemble exploit bundle (`exploit_bundle.zip`) with manifest + SHA-256 checksums; upload to S3 bucket (Object Lock, SSE-KMS, lifecycle rules) and emit signed URL.

### Week 2: Automation, Policy, Packaging
1. Implement Mitigation-as-Code generator (new-beneficiary step-up + device velocity) using Claude Code templates; create optional PR stub.
2. Deploy `/score` API (p95 ≤ 500 ms) and high-severity webhook service (recommends hold/step-up actions).
3. Wire policy engine MVP (YAML config) to integrate with webhook; stub adapters for auth hold and ticketing.
4. Ship static playback viewer with timeline markers, HAR/DOM/trace panels, rationale display, and mitigation download links.
5. Instrument structured audit log + metrics exporter (capture success, export latency/size, signed-URL usage, playback errors); alert on capture failures.
6. Package pilot deliverables (exploit bundle, mitigation-as-code, `/score` API docs, webhook runbook) and rehearse 2-minute demo.

## 4. Execution Backlog (MVP → v1)
- `Capture & Redaction`
  - Playwright trace + screenshot timeline (DONE when deterministic replays pass 5-run test).
  - Redaction filters (regex + selector bank); integrate blur/mask + salted hashes for trace params.
  - HAR capture with selective body redaction and PII masking.
- `Export & Storage`
  - ffmpeg stitcher service with deterministic encoding presets.
  - Bundle composer with manifest + SHA-256; signed upload to S3 with Object Lock + lifecycle.
  - Signed URL issuance service with TTL + audit logging.
- `Playback`
  - Static viewer (video + timeline + HAR/DOM/trace panels) with score deltas and rationale context.
- `Observability & Audit`
  - Append-only audit log writer; metrics for capture/export latencies, artifact sizes, failures.
  - Access log for artifact downloads; anomaly detection on burst downloads.
- `CUA Hybrid`
  - Explorer run logging (action + reasoning stream to redacted JSONL).
  - Compiler (trace → DSL) with schema validation and diff tooling.
  - Repair flow on replay failure (CUA suggests selector patch → human approval).

## 5. Phase Progression
- Phase 0–1 (0–2 weeks): Ship MVP (Zelle DSL, runner, evidence bundle, `/score`, webhook, mitigation YAML, signed pilot).
- Phase 2 (3–8 weeks): Make repeatable (Trace→DSL ingestor, Validator CI, repair agent, policy adapters, commerce staging flow).
- Phase 3 (3–6 months): Productize (scheduler, config UI, tenant weights, AgentConfidence API hardening, benchmark v0, auditor certificate).
- Phase 4 (6–12 months): Moat (dataset/signature feed, insurer & processor partnerships, SOC2 path, trust center).

## 6. Data & Compliance Guardrails
- Default redaction (PII/OTP/secrets) before persistence; unredacted vault only under customer-managed KMS per DPA.
- Staging-only testing unless explicit written authorization; kill switch for Explorer and Runner.
- Immutable audit logs + bundle hash recorded in platform DB and optional transparency log.
- Access enforcement with short-lived signed URLs, role-based access, and full access logging.

## 7. Metrics & KPIs
- Capture success ≥ 99%; bundle p95 export < 2 minutes; replay determinism ≥ 95%; bundle size 10–30 MB.
- `/score` latency p95 ≤ 500 ms; pilot→subscription ≥ 30%; continuous tier adoption ≥ 2 customers by v1.
- Track Agent Score distribution for true incidents, mitigations accepted, dollar exposure avoided, onboarding time ≤ 90 minutes, repair MTTR ≤ 48 hours.

## 8. Team & Hiring Plan (first 3 heads)
1. Senior Infra/Automation (Playwright, K8s, secure runners, artifact pipeline owner).
2. LLM/Agents Engineer (CUA prompts, compiler, repair agent orchestration, DSL evolution).
3. Fraud/AML SME (scenario design, mitigation playbooks, customer credibility, go-to-market liaison).

## 9. Risks & Mitigations
- Flakiness: enforce DSL compilation, role/name selectors, Validator CI, repair agent gating.
- False positives: conservative score thresholds, human-in-the-loop on blocking actions, `/feedback` calibration.
- Integration friction: staged environments, containerized runners, adapters for auth/payout/ticketing stacks.
- Security theater objection: produce loss-avoidance metrics and accepted mitigations; avoid CVE framing.
- Copycat risk: protect dataset + benchmark, share methodology but not raw signatures.

## 10. Next Actions
1. Stand up minimal Explorer → Compiler → Runner loop on Zelle staging with inline redaction and trace capture.
2. Implement deterministic artifact export + bundle hashing + S3 storage; validate via 5-run dry test; collect metrics.
3. Finalize mitigation templates, `/score` API, webhook, playback UI; prep pilot collateral and outreach.
