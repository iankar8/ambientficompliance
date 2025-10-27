# ArcanaSentinel Setup Guide

**Quick 5-minute setup to get ArcanaSentinel running with synthetic data**

---

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works perfectly)

---

## Step 1: Create Supabase Project (2 minutes)

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name:** sentinel-demo (or anything you like)
   - **Database Password:** (save this somewhere)
   - **Region:** Choose closest to you
4. Click **"Create new project"** and wait ~2 minutes for provisioning

---

## Step 2: Run Database Schema (1 minute)

1. In your Supabase project dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/schema.sql` in this repo
4. **Copy the entire contents** and paste into the SQL Editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. You should see: ✅ Success. No rows returned

---

## Step 3: Get Your API Keys (1 minute)

1. In Supabase dashboard, click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** under Project Settings
3. You'll see two keys:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`, click "Reveal" to see it)

---

## Step 4: Configure Environment (1 minute)

1. In the project root, create `.env.local`:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your_service_role_key

# API Security (generate a random string)
AGENT_API_SECRET=your_random_secret_here

# Synthetic Mode (keep this as true)
SYNTHETIC_MODE=true
```

**To generate a random secret:**
```bash
# On Mac/Linux:
openssl rand -hex 32

# Or just use any random string like:
# my_super_secret_key_12345
```

---

## Step 5: Seed Database (30 seconds)

```bash
npm run seed
```

This creates:
- ✅ 3 synthetic merchants
- ✅ 30 products across categories
- ✅ 5 agents (2 trusted, 2 unknown, 1 blocked)
- ✅ 5 sample transactions with evidence packs
- ✅ RMA tokens for returns
- ✅ Policies for each merchant

---

## Step 6: Start the App (30 seconds)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 7: Run Demo Agent (Optional)

In a new terminal:

```bash
npm run demo-agent
```

This simulates a complete checkout flow:
1. Agent verification
2. Product browsing
3. Checkout intent creation
4. Payment confirmation
5. Evidence pack generation
6. RMA token issuance

Watch the colorful output in your terminal, then refresh the console to see the new order!

---

## What You Can Do Now

### View the Console
- **Dashboard:** [http://localhost:3000/console](http://localhost:3000/console)
  - See stats, recent activity
- **Orders:** [http://localhost:3000/console/orders](http://localhost:3000/console/orders)
  - View all orders, click to see evidence packs
- **Agents:** [http://localhost:3000/console/agents](http://localhost:3000/console/agents)
  - See trust tiers (trusted/unknown/blocked)
- **Returns:** [http://localhost:3000/console/returns](http://localhost:3000/console/returns)
  - View RMA tokens
- **Policies:** [http://localhost:3000/console/policies](http://localhost:3000/console/policies)
  - See rate limits, allowlists, caps

### Test the API

```bash
# Verify an agent
curl -X POST http://localhost:3000/api/agents/verify \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "TestBot",
    "agent_key": "test_123"
  }'

# Create checkout intent (get merchant API key from console first)
curl -X POST http://localhost:3000/api/checkout/intent \
  -H "Content-Type: application/json" \
  -d '{
    "agent_uuid": "YOUR_AGENT_UUID",
    "merchant_api_key": "YOUR_MERCHANT_API_KEY",
    "items": [{"sku": "SKU-xxx", "qty": 1}]
  }'
```

---

## Troubleshooting

### "No merchants found" error
- Run `npm run seed` to populate the database

### "Missing Supabase URL" error
- Check that `.env.local` exists and has all three Supabase variables
- Restart the dev server after adding env vars

### "Permission denied" errors in Supabase
- Make sure you ran the full `supabase/schema.sql` script
- Check that you're using the **service_role** key (not anon key) in `.env.local`

### Demo agent fails
- Make sure dev server is running (`npm run dev`)
- Check that database is seeded (`npm run seed`)
- Verify `.env.local` has correct Supabase credentials

---

## Next Steps

1. **Explore the code:**
   - API routes: `app/api/`
   - Console UI: `app/console/`
   - Synthetic data: `lib/synthetic/`

2. **Customize:**
   - Edit `lib/synthetic/index.ts` to change product categories
   - Modify `scripts/seed.ts` to create more/fewer test records
   - Update `app/globals.css` to change color scheme

3. **Deploy to Vercel:**
   - Push to GitHub
   - Import to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy!

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js)                                     │
│  ├─ Landing Page                                        │
│  └─ Console Dashboard                                   │
│     ├─ Orders (with evidence viewer)                    │
│     ├─ Agents (trust tiers)                             │
│     ├─ Returns (RMA tokens)                             │
│     └─ Policies (rules engine)                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  API Routes (Next.js API)                               │
│  ├─ POST /api/agents/verify                             │
│  ├─ POST /api/checkout/intent                           │
│  ├─ POST /api/checkout/confirm                          │
│  ├─ POST /api/returns/authorize                         │
│  └─ GET  /api/orders/:id                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL)                                  │
│  ├─ merchants, products                                 │
│  ├─ agents, mandates                                    │
│  ├─ intents, orders                                     │
│  ├─ rma_tokens, policies                                │
│  └─ sessions (real-time activity)                       │
└─────────────────────────────────────────────────────────┘
```

---

## Support

- **Documentation:** See `MVP_SPEC.md` for complete product spec
- **Issues:** Check console logs and Supabase dashboard
- **Questions:** Review the code comments in `app/api/` and `lib/`

---

**You're all set! 🚀**

The system is now running with synthetic data. Everything works end-to-end without needing real Stripe or Shopify accounts.
