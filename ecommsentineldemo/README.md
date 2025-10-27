# Sentinel - Agentic Commerce Acceptance Platform

**Agent-Ready in 1 Day** - Accept AI agent orders without changing PSPs or fraud tools.

## Overview

Sentinel is a merchant acceptance layer for agentic commerce that provides:

- **Protocol Orchestration** - Unified API for Visa TAP, Mastercard Agent Pay, OpenAI ACP, Google AP2
- **Content Legibility** - Auto-generate LLM-readable `/agent.json` feeds
- **Evidence Collection** - Capture mandates, SPC/3DS artifacts, policy snapshots for dispute defense
- **Returns Management** - RMA tokens with policy snapshots
- **Real-time Observability** - Console for sessions, policies, evidence viewing

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TailwindCSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase subscriptions
- **Synthetic Data:** @faker-js/faker (no PSP accounts needed!)

## Quick Start

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)

### 2. Setup Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API
3. Copy your project URL and keys

### 3. Create Database Schema

1. In Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase/schema.sql`
3. Run the SQL to create all tables

### 4. Configure Environment

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit .env.local and add your Supabase credentials:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Keep synthetic mode enabled (no PSP accounts needed)
SYNTHETIC_MODE=true

# Generate a random secret for API signatures
AGENT_API_SECRET=your_random_secret_here
```

### 5. Seed Database

```bash
# Install dependencies (already done)
npm install

# Seed with synthetic data
npm run seed
```

This creates:
- 3 synthetic merchants
- 30 products across categories
- 5 agents (2 trusted, 2 unknown, 1 blocked)
- 5 sample transactions with evidence packs
- RMA tokens for returns
- Policies for each merchant

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── agents/        # Agent verification
│   │   ├── checkout/      # Checkout intents & confirmation
│   │   ├── returns/       # RMA token generation
│   │   └── observability/ # Real-time sessions
│   ├── console/           # Merchant console UI
│   ├── docs/              # Documentation
│   ├── globals.css        # Global styles (professional blue theme)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # Reusable React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase client
│   └── synthetic/        # Synthetic data generators
├── scripts/               # Utility scripts
│   └── seed.ts           # Database seeding
├── supabase/              # Supabase config
│   └── schema.sql        # Database schema
├── MVP_SPEC.md           # Complete product specification
├── POLICY_ONBOARDING_PACKET.md  # Merchant policy collection
└── APOLLO_SEARCH_FILTERS.md     # Sales prospecting guide
```

## Key Features

### Synthetic Mode (Default)

No Stripe or Shopify accounts needed! The system generates:

- **Realistic merchants** with domains, API keys, policies
- **Product catalogs** across multiple categories
- **AI agents** with different trust tiers
- **Complete checkout flows** with payment URLs
- **Evidence packs** with mandates, auth artifacts, policy snapshots
- **RMA tokens** for returns management

Everything works end-to-end with synthetic data that behaves like real PSP responses.

### Console Dashboard

Access at `/console` to view:

- **Live Sessions** - Real-time agent activity stream
- **Orders** - Completed transactions with evidence packs
- **Returns** - RMA tokens and status tracking
- **Agents** - Trust tiers and allowlist management
- **Policies** - Rate limits, spend caps, step-up rules

### API Endpoints

- `POST /api/agents/verify` - Verify agent identity → agent_id, trust_tier
- `POST /api/mandates/create` - Store user consent
- `POST /api/checkout/intent` - Create checkout → pay_url
- `POST /api/checkout/confirm` - Finalize order + attach evidence
- `POST /api/returns/authorize` - Mint RMA token
- `GET /api/observability/sessions` - Real-time session stream
- `POST /api/policy/apply` - Update allowlist/caps

## Development Roadmap

### ✅ Day 1 (Current)
- Next.js project setup
- Supabase schema
- Synthetic data generators
- Landing page + console shell

### 🚧 Day 2 (Next)
- API routes implementation
- Console UI (sessions, orders, evidence viewer)
- Mock agent CLI tool
- E2E demo flow

### 📅 Day 3
- Returns management UI
- Policy editor
- Real-time subscriptions
- Evidence Pack PDF export

### 📅 Day 7
- Protocol adapters (TAP/ACP/AP2 stubs)
- Webhook handlers
- Rate limiting
- Issuer rails (Verifi/Ethoca export)

## Documentation

- **[MVP_SPEC.md](./MVP_SPEC.md)** - Complete product specification
- **[POLICY_ONBOARDING_PACKET.md](./POLICY_ONBOARDING_PACKET.md)** - Merchant policy collection template
- **[APOLLO_SEARCH_FILTERS.md](./APOLLO_SEARCH_FILTERS.md)** - Sales prospecting guide

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=         # Supabase service role key
AGENT_API_SECRET=                  # Random secret for HMAC

# Optional (for synthetic mode, not needed)
SYNTHETIC_MODE=true                # Use synthetic data
STRIPE_SECRET_KEY=                 # Real Stripe key (future)
SHOPIFY_API_KEY=                   # Real Shopify key (future)
```

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run seed         # Seed database with synthetic data
```

## Contributing

This is an MVP/demo project. For production use:

1. Replace synthetic adapters with real PSP integrations
2. Add authentication for merchant console
3. Implement webhook signature verification
4. Add rate limiting and DDoS protection
5. Set up monitoring and alerting
6. Complete RLS policies for multi-tenancy

## License

MIT

---

**Built with ❤️ for the agentic commerce future**
