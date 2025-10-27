# ArcanaSentinel Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER / AGENT                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APPLICATION                         │
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐         │
│  │  Landing Page    │              │  Console UI      │         │
│  │  (Marketing)     │              │  (Dashboard)     │         │
│  └──────────────────┘              └──────────────────┘         │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    API ROUTES                              │  │
│  │                                                            │  │
│  │  POST /api/agents/verify                                  │  │
│  │  POST /api/checkout/intent                                │  │
│  │  POST /api/checkout/confirm                               │  │
│  │  POST /api/returns/authorize                              │  │
│  │  GET  /api/orders/:id                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
│                             │                                    │
│                             ▼                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              DATABASE QUERY LAYER                          │  │
│  │              (lib/db/queries.ts)                           │  │
│  │                                                            │  │
│  │  • getMerchantByApiKey()                                  │  │
│  │  • getOrCreateAgent()                                     │  │
│  │  • createIntent()                                         │  │
│  │  • createOrder()                                          │  │
│  │  • createRMAToken()                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  merchants   │  │   agents     │  │  mandates    │          │
│  │  products    │  │   intents    │  │  orders      │          │
│  │  rma_tokens  │  │   policies   │  │  sessions    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Complete Checkout

```
┌─────────┐
│  Agent  │
└────┬────┘
     │
     │ 1. POST /api/agents/verify
     │    { agent_name, agent_key }
     ▼
┌─────────────────┐
│ Verify Endpoint │──────► Check if agent exists
└────┬────────────┘        Create if new
     │                     Assign trust_tier
     │                     Log session event
     ▼
┌─────────────────┐
│ Return Response │
│ { agent_id,     │
│   trust_tier }  │
└────┬────────────┘
     │
     │ 2. POST /api/checkout/intent
     │    { agent_uuid, merchant_api_key, items }
     ▼
┌──────────────────┐
│ Intent Endpoint  │──────► Validate merchant
└────┬─────────────┘        Validate products
     │                      Check inventory
     │                      Calculate totals
     │                      Generate pay_url
     ▼
┌─────────────────┐
│ Return Response │
│ { intent_id,    │
│   pay_url,      │
│   totals }      │
└────┬────────────┘
     │
     │ 3. Agent "pays" via synthetic URL
     │    (simulated - no real payment)
     │
     │ 4. POST /api/checkout/confirm
     │    { intent_uuid }
     ▼
┌───────────────────┐
│ Confirm Endpoint  │──────► Validate intent
└────┬──────────────┘        Check expiration
     │                       Generate evidence pack:
     │                       • Mandate
     │                       • Auth (3DS/SPC)
     │                       • Policy snapshot
     │                       • PSP receipt
     │                       Create order
     │                       Update intent status
     ▼
┌─────────────────┐
│ Return Response │
│ { order_id,     │
│   evidence_pack }│
└────┬────────────┘
     │
     │ 5. POST /api/returns/authorize (optional)
     │    { order_uuid, sku, reason_code }
     ▼
┌───────────────────┐
│ Returns Endpoint  │──────► Validate order
└────┬──────────────┘        Check SKU exists
     │                       Generate RMA token
     │                       Create label URL
     ▼
┌─────────────────┐
│ Return Response │
│ { rma_id,       │
│   label_url }   │
└─────────────────┘
```

---

## Database Schema

```
merchants                    agents
├─ id (uuid)                ├─ id (uuid)
├─ name                     ├─ agent_id (unique)
├─ domain                   ├─ name
├─ api_key (unique)         ├─ contact
├─ api_secret               ├─ public_key
├─ platform                 ├─ trust_tier (enum)
├─ config (jsonb)           ├─ metadata (jsonb)
└─ created_at               └─ created_at
     │                           │
     │                           │
     ▼                           ▼
products                    mandates
├─ id (uuid)                ├─ id (uuid)
├─ merchant_id (fk)         ├─ mandate_id (unique)
├─ sku                      ├─ agent_id (fk)
├─ name                     ├─ merchant_id (fk)
├─ price_value              ├─ user_id
├─ inventory_available      ├─ policy_url
└─ category                 ├─ consent_timestamp
                            └─ cart_hash
                                 │
                                 ▼
                            intents
                            ├─ id (uuid)
                            ├─ intent_id (unique)
                            ├─ agent_id (fk)
                            ├─ merchant_id (fk)
                            ├─ mandate_id (fk)
                            ├─ items (jsonb)
                            ├─ totals (jsonb)
                            ├─ pay_url
                            ├─ status (enum)
                            └─ expires_at
                                 │
                                 ▼
                            orders
                            ├─ id (uuid)
                            ├─ order_id (unique)
                            ├─ intent_id (fk)
                            ├─ psp_order_id
                            ├─ evidence_pack (jsonb)
                            ├─ policy_snapshot_url
                            └─ status (enum)
                                 │
                                 ▼
                            rma_tokens
                            ├─ id (uuid)
                            ├─ rma_id (unique)
                            ├─ order_id (fk)
                            ├─ sku
                            ├─ reason_code (enum)
                            ├─ policy_snapshot (jsonb)
                            ├─ label_url
                            └─ status (enum)

policies                    sessions
├─ id (uuid)                ├─ id (uuid)
├─ merchant_id (fk)         ├─ agent_id (fk)
├─ rules (jsonb)            ├─ merchant_id (fk)
├─ version                  ├─ event_type
└─ effective_date           ├─ event_data (jsonb)
                            └─ created_at
```

---

## Evidence Pack Structure

```json
{
  "mandate": {
    "policy_url": "https://...",
    "consent_timestamp": "2025-10-22T..."
  },
  "auth": {
    "method": "3DS",
    "result": "authenticated",
    "transaction_id": "txn_..."
  },
  "policy_snapshot": {
    "returns_window_days": 30,
    "restock_fee": 0,
    "conditions": ["unworn", "tags_attached"]
  },
  "psp_receipt": {
    "charge_id": "ch_...",
    "session_id": "sess_...",
    "risk_score": 15,
    "avs_result": "Y",
    "cvv_result": "M"
  },
  "agent_headers": {
    "X-Agent-Name": "ShopBuddy",
    "X-Agent-Key": "ak_...",
    "X-Agent-Signature": "sig_..."
  },
  "context": {
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "timestamp": "2025-10-22T..."
  }
}
```

---

## Console UI Structure

```
/console
├─ / (Dashboard)
│  ├─ Stats Cards (Orders, Agents, Returns, Sessions)
│  └─ Recent Activity Feed
│
├─ /orders
│  ├─ Orders Table
│  └─ /orders/:id
│     ├─ Order Summary
│     ├─ Items Table
│     ├─ Evidence Pack Viewer
│     └─ PSP Details
│
├─ /agents
│  ├─ Stats by Trust Tier
│  └─ Agents Table
│
├─ /returns
│  ├─ Stats by Status
│  └─ RMA Tokens Table
│
└─ /policies
   └─ Policy Cards per Merchant
      ├─ Allowlist/Blocklist
      ├─ Rate Limits
      ├─ SPC Thresholds
      └─ Geo Restrictions
```

---

## Synthetic Data Flow

```
┌──────────────────┐
│  scripts/seed.ts │
└────────┬─────────┘
         │
         ├─► Generate 3 merchants
         │   (with API keys, configs)
         │
         ├─► Generate 30 products
         │   (10 per merchant, various categories)
         │
         ├─► Generate 5 agents
         │   (2 trusted, 2 unknown, 1 blocked)
         │
         ├─► Generate 5 transactions
         │   ├─ Create mandate
         │   ├─ Create intent
         │   ├─ Generate evidence pack
         │   ├─ Create order
         │   └─ (50% chance) Create RMA token
         │
         └─► Generate policies
             (per merchant: allowlist, limits, SPC rules)
```

---

## Trust Tier System

```
┌─────────────┐
│   Agent     │
│  Verifies   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Check if agent_id exists       │
└──────┬──────────────────────────┘
       │
       ├─► New Agent
       │   └─► Default: trust_tier = "unknown"
       │
       └─► Existing Agent
           └─► Return current trust_tier
                │
                ├─► "trusted"
                │   • Full access
                │   • Higher limits
                │   • No step-up auth
                │
                ├─► "unknown"
                │   • Limited access
                │   • Lower limits
                │   • Step-up auth required
                │
                └─► "blocked"
                    • No access
                    • All requests denied
```

---

## Policy Enforcement

```
┌──────────────────┐
│  Checkout Intent │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Load Merchant Policy           │
└────────┬────────────────────────┘
         │
         ├─► Check Allowlist
         │   └─► If agent in allowlist: proceed
         │
         ├─► Check Blocklist
         │   └─► If agent in blocklist: deny
         │
         ├─► Check Rate Limit
         │   └─► If > X req/min: throttle
         │
         ├─► Check Order Value
         │   └─► If > max_order_value: deny
         │
         ├─► Check Daily Spend
         │   └─► If > daily_spend: deny
         │
         └─► Check SPC Requirement
             └─► If total > threshold: require 3DS/SPC
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│            VERCEL (Frontend)            │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Next.js Application           │ │
│  │  • SSR Pages                      │ │
│  │  • API Routes                     │ │
│  │  • Static Assets                  │ │
│  └───────────────────────────────────┘ │
└──────────────┬──────────────────────────┘
               │
               │ HTTPS
               │
               ▼
┌─────────────────────────────────────────┐
│         SUPABASE (Backend)              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     PostgreSQL Database           │ │
│  │  • Tables                         │ │
│  │  • Indexes                        │ │
│  │  • RLS Policies                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Realtime Engine               │ │
│  │  • Subscriptions                  │ │
│  │  • Presence                       │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Storage                       │ │
│  │  • Evidence Packs                 │ │
│  │  • Policy Snapshots               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## Security Model

```
┌─────────────────────────────────────────┐
│          Request Flow                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  1. API Key Validation                  │
│     • Check merchant_api_key            │
│     • Verify not expired                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Agent Signature Verification        │
│     • HMAC-SHA256 validation            │
│     • Check timestamp (5min window)     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Policy Check                        │
│     • Allowlist/Blocklist               │
│     • Rate limits                       │
│     • Spend caps                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Request Processing                  │
│     • Validate with Zod                 │
│     • Execute business logic            │
│     • Log session event                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Response with Evidence              │
│     • Include cryptographic proofs      │
│     • Attach policy snapshot            │
│     • Return signed response            │
└─────────────────────────────────────────┘
```

---

## Technology Stack

```
Frontend
├─ Next.js 14 (App Router)
├─ React 18
├─ TypeScript
├─ TailwindCSS
└─ Lucide Icons

Backend
├─ Next.js API Routes
├─ Supabase Client
├─ Zod (validation)
└─ nanoid (ID generation)

Database
├─ Supabase (PostgreSQL)
├─ Row Level Security
└─ Real-time subscriptions

Development
├─ tsx (TypeScript execution)
├─ @faker-js/faker (synthetic data)
└─ ESLint + Prettier

Deployment
├─ Vercel (frontend)
└─ Supabase (backend)
```

---

This architecture supports:
- ✅ High scalability (serverless)
- ✅ Real-time updates
- ✅ Type safety end-to-end
- ✅ Synthetic data for testing
- ✅ Evidence collection for disputes
- ✅ Policy-based access control
