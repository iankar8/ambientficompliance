# Agentic Commerce Merchant Acceptance - MVP Specification v1.0

**Date:** October 22, 2025  
**Product:** Agent-Ready in 1 Day  
**Mission:** Enable e-commerce merchants to accept AI agent orders without changing PSPs or fraud tools

---

## Executive Summary

### The Problem
AI agents (ChatGPT, Claude, etc.) are starting to make purchases on behalf of users, but merchants lack:
- Protocol orchestration (Visa TAP, Mastercard Agent Pay, OpenAI ACP, Google AP2)
- LLM-readable content feeds
- Evidence collection for disputes
- Returns management for agent-initiated transactions
- Real-time visibility and controls

### The Solution
A neutral merchant acceptance layer that:
1. **Abstracts all protocols** behind one stable API
2. **Makes stores legible** to agents via /agent.json feeds
3. **Captures evidence** (mandates, SPC/3DS, policy snapshots) for dispute defense
4. **Manages returns** via RMA tokens
5. **Provides real-time observability** and policy controls

### Time to Value
**Agent-Ready in 1 Day** - merchants can accept their first agent order within 24 hours with zero PSP changes.

---

## Product Vision & Strategy

### Positioning
"The merchant acceptance layer for agentic commerce - turn on the agent channel in 1 day, keep your checkout, keep your bank."

### Core Principles
1. **Adapters > Bets** - Support all protocols (TAP/ACP/AP2/Agent Pay) behind stable API
2. **Evidence is Trust** - Package mandates + auth artifacts to win disputes
3. **Legibility = Conversion** - LLM-readable feeds unlock agent sales
4. **No Rip-and-Replace** - Work with existing PSPs, fraud tools, platforms

### Wedge Strategy
**Holiday 2025 Focus:** "Hook up AI Agent commerce before the holidays"
- Target: Shopify Plus & Stripe merchants ($30-300M GMV)
- Pain: Can't add new channels without risk; January returns chaos
- Value: Incremental revenue + evidence hardening + returns relief

---

## Target Customer (ICP)

### Company Profile
- **Platform:** Shopify Plus, BigCommerce, headless DTC (SFCC/Adobe/commercetools)
- **GMV:** $30M - $300M annually
- **Employees:** 50 - 1,000
- **Industries:** Consumer Electronics, Apparel, Home & Garden, Tickets/Events, Health/Beauty
- **Tech Stack:** Stripe/Adyen/Braintree + Loop/Narvar/Happy Returns

### Buyer Personas

#### 1. Economic Buyer - VP/Director eCommerce
- **KPIs:** GMV growth, checkout conversion, return rate, chargeback rate
- **Pain:** Can't add channels without risk; platform changes take weeks
- **Message:** "New agent sales channel live tomorrow, zero rip-and-replace"

#### 2. Product/Payments Owner - Head of Payments
- **KPIs:** Auth rate, PSP fees, 3DS friction, decline/retry lifts
- **Pain:** Multiple specs (TAP/AP2/ACP); dev dependencies; evidence gaps
- **Message:** "One API for all protocols; keep Stripe/Adyen; bundle evidence"

#### 3. Technical Evaluator - Director of Engineering (Web)
- **KPIs:** Lead time to prod, error budgets, incident rate
- **Pain:** Unknown specs, SDK quality, rollback risk
- **Message:** "2-4 endpoints; feature-flagged; env-var rollback in minutes"

#### 4. Risk/Ops Champion - Director Fraud/Returns Ops
- **KPIs:** Dispute win-rate, time-to-resolution, appeasement cost
- **Pain:** Messy evidence, policy disputes, January surge
- **Message:** "RMA token + Evidence Pack pre-fills issuer rails"

---

## Product Architecture

### System Overview

```
Agent → Verify → Mandate → Checkout Intent → Pay URL → Confirm → Evidence Pack → Returns → Console
```

### Core Components

1. **Agent-Acceptance API** - Stable REST endpoints
2. **Protocol Adapters** - TAP, ACP, AP2, Agent Pay (pluggable)
3. **Content Kit** - /agent.json generator
4. **Checkout Adapters** - Shopify & Stripe pay URL creation
5. **Evidence Engine** - Mandate + SPC/3DS + policy snapshot packager
6. **Returns Engine** - RMA token minting & label webhooks
7. **Policy Engine** - Allowlists, rate/spend caps, step-up triggers
8. **Console** - Real-time sessions, controls, evidence viewer
9. **SDKs** - Node (primary), Python (stub), CLI tools

---

## MVP Deliverables

### 1. Agent-Acceptance API (Core)

**What:** Stable REST endpoints for all merchant interactions

**Endpoints:**
- `POST /agents/verify` - Normalize agent identity → agent_id, trust_tier
- `POST /mandates/create` - Store user↔agent↔merchant consent
- `POST /checkout/intent` - Create checkout → pay_url
- `POST /checkout/confirm` - Finalize order + attach evidence
- `POST /returns/authorize` - Mint RMA token
- `GET /observability/sessions` - Real-time agent session stream
- `POST /policy/apply` - Update allowlist/caps/rules

**Tech Stack:**
- Node.js / Express or Fastify
- PostgreSQL (orders, mandates, evidence, policies)
- Redis (sessions, rate limiting, policy cache)
- S3 (evidence artifacts, policy snapshots)

**SLOs:**
- 99.9% uptime
- p95 intent latency < 200ms
- Evidence completeness ≥ 95%

---

### 2. /agent.json Content Kit

**What:** LLM-readable merchant feed (catalog, policies, inventory)

**Schema:**
```json
{
  "merchant": {
    "name": "string",
    "url": "string",
    "currency": "USD"
  },
  "products": [{
    "sku": "string",
    "name": "string",
    "price": {"value": 0, "currency": "USD"},
    "inventory": {"available": 0, "updated_at": "ISO8601"},
    "category": "string",
    "attributes": {}
  }],
  "policies": {
    "returns": {
      "window_days": 30,
      "conditions": [],
      "restock_fee": 0,
      "non_returnables": []
    },
    "shipping": {
      "methods": [],
      "cutoff": "13:00"
    },
    "warranty": {}
  }
}
```

**Sources:**
- **Shopify:** Products API + store policies
- **Stripe:** Product feed/CSV upload
- **Headless:** Merchant product service API

**Features:**
- Auto-generation from platform data
- TTL 300s (5 min cache)
- Validator CLI tool
- Health check endpoint

---

### 3. Checkout Adapters

#### A. Shopify Adapter

**Flow:**
1. Merchant installs Shopify app
2. App auto-publishes /agent.json from Products API
3. `POST /checkout/intent` → creates Draft Order → Invoice URL
4. Returns `pay_url` to agent
5. Listens to `orders/paid` webhook → calls `/checkout/confirm`

**Scopes Required:**
- `read_products`
- `read_shop`
- `write_draft_orders`
- `read_orders`

**Rollback:** Uninstall app or `DISABLE_ACCEPTANCE=true` env var

#### B. Stripe Adapter

**Flow:**
1. Merchant provides Stripe API key
2. Content Kit generates /agent.json from feed/CSV
3. `POST /checkout/intent` → creates Payment Link or Checkout Session
4. Returns `pay_url` to agent
5. Listens to `checkout.session.completed` → calls `/checkout/confirm`

**Webhooks:**
- `checkout.session.completed`
- `charge.succeeded`
- `payment_intent.succeeded`

**Rollback:** Revoke API key or env var toggle

---

### 4. Attestation & Trust Tiers

**Attestation-Lite (Day 1):**
```
Headers:
  X-Agent-Name: "ShopBuddy"
  X-Agent-Key: "ak_live_123"
  X-Agent-Signature: "hmac256:..."
```

**Trust Tiers:**
- `trusted` - On merchant allowlist
- `unknown` - Default, limited permissions
- `blocked` - Explicit deny

**Protocol Adapters (Feature-Flagged):**
- **Visa TAP** - Parse TAP proofs → normalize identity
- **Mastercard Agent Pay** - Accept tokenization/registration
- **Google AP2** - Honor signed mandates
- **OpenAI ACP** - Delegated Payment + Instant Checkout

---

### 5. Evidence Pack

**What:** Cryptographically consistent bundle per order for dispute defense

**Contents:**
- Mandate (AP2/ACP blob or policy URL + timestamp)
- SPC/3DS artifacts (when present)
- Policy snapshot (returns, terms, shipping at purchase time)
- PSP receipt (charge_id, session_id, risk flags, AVS/CVV)
- Agent headers (name, key, signature)
- Context (IP, device, geo if available)

**Export Formats:**
- JSON (structured)
- PDF (human-readable for disputes)
- CSV (bulk analysis)

**Retention:** 30 days default (configurable to 180)

**Issuer Rails (Day 7):**
- Visa Verifi Order Insight
- Mastercard Ethoca
- Visa RDR (Rapid Dispute Resolution)

---

### 6. Returns-Lite (RMA Token)

**What:** Signed return authorization token with policy snapshot

**Flow:**
1. Agent calls `POST /returns/authorize` with order_id + reason
2. System validates window, conditions, non-returnables
3. Mints JWT (ES256) with claims:
   - order_id, sku, reason_code
   - window_days, conditions, restock_fee
   - policy_snapshot_url
   - issued_at, expires_at
4. Returns RMA token + (optional) label webhook

**Reason Codes:**
- `NOT_AS_DESCRIBED`
- `DAMAGED`
- `SIZE_FIT`
- `CHANGED_MIND`
- `OTHER`

**Label Integrations (Day 3):**
- Loop Returns
- Narvar
- Happy Returns
- Shippo
- EasyPost

---

### 7. Policy Engine

**What:** Declarative rules for agent governance

**Rules (YAML/JSON):**
```yaml
policies:
  - agent_id: "a_trusted_123"
    tier: trusted
    limits:
      rate_per_minute: 10
      max_order_value: 1000
      daily_spend: 5000
    require_spc: false
    
  - tier: unknown
    limits:
      rate_per_minute: 2
      max_order_value: 300
      daily_spend: 500
    require_spc: true
    step_up_threshold: 100
```

**Actions:**
- Allow/deny by agent_id or tier
- Rate limiting (requests/min)
- Spend caps (per order, daily)
- Step-up auth (require SPC/3DS above threshold)
- Geo restrictions
- Category blocks

**Storage:** Redis (hot) + PostgreSQL (audit log)

---

### 8. Console (Lite)

**What:** Real-time web UI for visibility and control

**Features:**

**Sessions View:**
- Live stream (SSE) of agent activity
- Columns: agent_id, trust_tier, adapter, status, cart_value, timestamp
- Filters: tier, adapter, date range
- Funnel metrics: verify → intent → confirm

**Policy Controls:**
- Quick allow/deny by agent_id
- Spend/rate cap sliders
- Step-up threshold toggle
- Kill switch (global, per-agent, per-adapter)

**Evidence Viewer:**
- Per-order Evidence Pack preview
- Download JSON/PDF
- Export to issuer rails

**Returns Dashboard:**
- RMA tokens issued
- Reason code breakdown
- Time-to-refund metrics

**Tech Stack:**
- React + TailwindCSS
- Server-Sent Events (SSE) for real-time
- Feature flags for progressive rollout

---

### 9. SDKs & CLI

#### Node SDK
```javascript
const AgentAcceptance = require('@yourco/agent-acceptance');

const client = new AgentAcceptance({
  apiKey: process.env.AGENT_API_KEY,
  environment: 'production'
});

// Verify agent
const { agent_id, trust_tier } = await client.agents.verify({
  attestation: { type: 'lite', payload: { headers } }
});

// Create checkout
const { pay_url, intent_id } = await client.checkout.createIntent({
  agent_id,
  items: [{ sku: 'SKU123', qty: 1, price: { value: 129, currency: 'USD' }}]
});
```

#### CLI Tools
```bash
# Validate /agent.json feed
agent-cli validate-feed https://merchant.com/agent.json

# Run test agent (mock purchase)
agent-cli test-agent --sku SKU123 --qty 1

# Tail live sessions
agent-cli tail-sessions --filter tier=unknown

# Generate sample config
agent-cli init --platform shopify
```

---

## Technical Specifications

### API Authentication
- Merchant API keys: `sk_live_...` / `sk_test_...`
- Agent signatures: HMAC-SHA256 with shared secret
- Webhook signatures: HMAC-SHA256, 5-min clock skew tolerance

### Idempotency
- Require `Idempotency-Key` header on mutating endpoints
- 24-hour cache window
- Safe to retry

### Rate Limiting
- Token bucket per agent_id
- Default: 2 RPS per agent
- Burst: 10 requests
- Response: `429 Too Many Requests` with `Retry-After`

### Webhooks
- Exponential backoff (max 24h)
- 5 retry attempts
- Event deduplication via event_id + hash
- Signature verification required

### Error Codes
- `AGENT_UNVERIFIED` - Invalid attestation
- `POLICY_VIOLATION` - Blocked by rules
- `PAY_URL_EXPIRED` - Intent timed out
- `EVIDENCE_INCOMPLETE` - Missing required fields
- `RMA_WINDOW_CLOSED` - Return period expired
- `RATE_LIMITED` - Quota exceeded

---

## Data Model

### Key Entities

**Agent:**
- agent_id (UUID)
- name, contact, public_key
- trust_tier (enum)
- created_at, updated_at

**Mandate:**
- mandate_id (UUID)
- agent_id, merchant_id, user_id
- policy_url, consent_timestamp
- cart_hash, ap2_blob (optional)
- created_at

**Intent:**
- intent_id (UUID)
- agent_id, merchant_id
- items (JSONB), totals
- pay_url, adapter (shopify|stripe)
- status (pending|confirmed|expired)
- created_at, expires_at

**Order:**
- order_id (UUID)
- intent_id, psp_order_id
- evidence_pack (JSONB)
- policy_snapshot_url
- created_at

**RMAToken:**
- rma_id (UUID)
- order_id, sku, reason_code
- policy_snapshot, conditions
- issued_at, expires_at
- label_url (optional)

**Policy:**
- policy_id (UUID)
- merchant_id
- rules (YAML/JSON)
- version, effective_date
- created_at, updated_at

---

## Merchant Onboarding

### Required Documents (PDF Upload)

**Day-1 Must-Haves:**
1. **Returns & Exchanges Policy** - window, conditions, restock fee, non-returnables
2. **Terms of Sale** - cancellation, price adjustments, digital/tickets
3. **Shipping & Delivery Policy** - methods, ETAs, lost/damaged handling
4. **Payment & Dispute Policy** - tenders, 3DS usage, pre-dispute programs
5. **Warranty/Guarantee** - period, coverage, exclusions
6. **Privacy Policy** - PII handling, retention, DSR contact
7. **Tax & Duties** - nexus, DDP/DDU stance
8. **Returns SOP** - RMA workflow, inspection checklist, time-to-refund

**Day-3 Recommended:**
9. Promotions & Price-Adjustment Policy
10. Fraud & Abuse Policy
11. Carrier Claims SOP
12. Digital/Tickets Policy (if applicable)
13. International & Restricted Items
14. Customer Service Playbook
15. Security/Compliance Attestations

**Metadata per Document:**
- Version, effective date, approver (name/email), public URL

### Auto-Extraction Fields
System extracts structured data from PDFs:
- `returns_window_days`, `returns_restock_fee`, `returns_non_returnables`
- `shipping_methods`, `shipping_cutoff`
- `payments_accepted_tenders`, `payments_3ds_spc_usage`
- `warranty_period_days`, `warranty_coverage`
- `rma_inspection_checklist`, `rma_time_to_refund_days`

---

## Installation Paths

### Shopify Plus (Primary)
**Time:** 2-4 hours

1. Install Shopify app from app store (or unlisted for pilots)
2. Grant scopes: `read_products`, `read_shop`, `write_draft_orders`, `read_orders`
3. App auto-publishes /agent.json
4. Upload policy PDFs (or link to existing)
5. Configure allowlist/caps in console
6. Run smoke test: $1 test order via mock agent
7. Go live: toggle `AGENT_ACCEPTANCE_ENABLED=true`

**Rollback:** Uninstall app or env var off

### Stripe-Only (Universal)
**Time:** 2-3 hours

1. Provide Stripe API key (restricted: read/write checkout sessions)
2. Upload product feed (CSV) or connect product API
3. Upload policy PDFs
4. Configure webhooks: `checkout.session.completed`, `charge.succeeded`
5. Configure allowlist/caps
6. Run smoke test
7. Go live

**Rollback:** Revoke API key

### Headless (Enterprise)
**Time:** 6-24 hours (depends on team)

1. Drop middleware snippet (Node/Go) into existing stack
2. Map /agent.json to product service + CMS
3. Configure PSP adapter (Stripe/Adyen)
4. Wire order/fulfillment webhooks
5. Upload policy PDFs
6. Configure allowlist/caps
7. Run sandbox E2E test
8. Go live

**Rollback:** Disable middleware flag

---

## Go-To-Market

### Positioning
"Turn on the Agent Channel in 1 Day. Keep your checkout, keep your bank, add a clean agent lane."

### Value Props
1. **Incremental Revenue** - New agent sales channel with zero rip-and-replace
2. **Evidence Hardening** - Win more disputes with mandate + SPC/3DS artifacts
3. **Returns Relief** - RMA tokens reduce January chaos
4. **Future-Proof** - One API for TAP/ACP/AP2/Agent Pay
5. **Reversible** - Uninstall in < 30 min

### Pricing (Holiday Pilot)
- **Starter:** $4k setup + 0.35% agent-attributed GMV (cap $15k/mo)
- **Plus (dual adapters):** $8k setup + 0.50% GMV
- **Evidence-Only:** $0 setup, $0.10/order with Evidence Pack

### Sales Collateral
- Live sandbox + one-pager
- Screenshots: Console, Evidence Pack, /agent.json validator
- Case study template (fill after first 3 pilots)
- Procurement pack: data-flow diagram, DPIA template, SOC2 roadmap

### Distribution Channels
1. **Direct:** Shopify Plus brands (CE, Home, Tickets)
2. **PSP Co-Sell:** Stripe/Adyen/Worldpay AMs
3. **Agency Partners:** Shopify Plus agencies, SIs
4. **App Stores:** Shopify App Store (unlisted → listed post-pilots)

---

## Success Metrics

### Activation (Day 1)
- /agent.json valid and accessible
- First test order completed
- Evidence Pack ≥ 95% complete
- Rollback tested successfully

### Channel Performance (Week 1-4)
- Agent-attributed orders > 0
- Median agent checkout time < 2 min
- PSP decline rate unchanged vs baseline
- Evidence completeness ≥ 95%

### Ops Impact (Post-Holiday)
- Returns via RMA token ≥ 70%
- Dispute rate < 2% (vs industry 3-5%)
- Time-to-refund within SLA
- Zero increase in friendly fraud

### Platform Health
- API uptime ≥ 99.9%
- p95 intent latency < 200ms
- Webhook delivery success ≥ 99%
- Zero security incidents

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Spec churn (TAP/ACP/AP2) | High | Adapters behind feature flags; contract tests |
| PSP edge cases | Medium | Rely on PSP checkout page; robust webhook retries |
| Returns ops friction | Medium | RMA as optional add-on; clear docs + toggles |
| Security review lag | High | Provide data-flow diagram, DPIA, reversibility note upfront |
| Merchant adoption | High | 10-brand lighthouse cohort; shared case study by Dec 15 |

---

## Roadmap

### Day 1 (MVP Launch)
- ✅ Core API (verify, mandate, intent, confirm)
- ✅ Shopify + Stripe adapters
- ✅ /agent.json generator + validator
- ✅ Attestation-Lite
- ✅ Evidence Pack (JSON export)
- ✅ Console Lite (sessions, policy toggles)
- ✅ Node SDK + CLI

### Day 3
- ✅ Returns-Lite (RMA tokens + label webhooks)
- ✅ TAP/AP2/ACP adapter stubs (feature-flagged)
- ✅ Headless minimal adapter + docs

### Day 7
- Verifi/Ethoca/RDR export
- TAP full parser
- AP2 mandate flow
- ACP delegated checkout GA

### Day 14
- Returns integrations (Loop/Narvar/Shippo)
- Cross-protocol conformance badge
- PSP plugins (Stripe/Adyen apps)

### Day 30
- Evidence Clearinghouse beta
- Price-lock mandates (AP2/ACP extension)
- Multi-currency support

---

## Appendix

### Glossary
- **ACP** - Agentic Commerce Protocol (OpenAI + Stripe)
- **AP2** - Agent Payments Protocol (Google)
- **TAP** - Trusted Agent Protocol (Visa)
- **Agent Pay** - Mastercard's agent acceptance framework
- **SPC** - Secure Payment Confirmation (W3C/FIDO)
- **RMA** - Return Merchandise Authorization
- **RDR** - Rapid Dispute Resolution (Visa)
- **PSP** - Payment Service Provider

### References
- Visa TAP Developer Docs
- OpenAI ACP Specification
- Google AP2 Documentation
- W3C Secure Payment Confirmation
- Mastercard Agent Pay Framework

---

**Document Version:** 1.0  
**Last Updated:** October 22, 2025  
**Owner:** Product Team  
**Status:** Ready for Implementation
