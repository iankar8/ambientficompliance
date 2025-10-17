# Integration Setup Guide - MVP Launch

**Goal:** Set up all external service integrations before building agents

**Timeline:** Complete by end of day (Oct 16)

---

## 🔌 Required Integrations

### 1. **OpenRouter** (LLM Gateway) - CRITICAL
**Purpose:** Unified API for Claude, GPT, and other models  
**Used by:** All agents (classification, research, drafting)

**Setup Steps:**
1. Sign up at https://openrouter.ai
2. Add credits ($20 minimum recommended)
3. Generate API key
4. Add to `.env.local`: `OPENROUTER_API_KEY=sk-or-...`

**Test:**
```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

### 2. **Firecrawl** (Web Scraping) - CRITICAL
**Purpose:** Crawl news sites, career pages, regulatory feeds  
**Used by:** Signal Scout, Researcher

**Setup Steps:**
1. Sign up at https://firecrawl.dev
2. Get API key from dashboard
3. Add to `.env.local`: `FIRECRAWL_API_KEY=fc-...`

**Test:**
```bash
curl -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

---

### 3. **Gmail API** (Email Sending) - CRITICAL
**Purpose:** Send outreach emails, listen for replies  
**Used by:** Mailer, Reply Listener

**Setup Steps:**
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Create new project "Arcana Radar"
3. Enable Gmail API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download credentials JSON
6. Run OAuth flow to get refresh token
7. Add to `.env.local`:
   - `GMAIL_CLIENT_ID=...`
   - `GMAIL_CLIENT_SECRET=...`
   - `GMAIL_REFRESH_TOKEN=...`

**Detailed Guide:** See `docs/GMAIL_OAUTH_SETUP.md` (to be created)

---

### 4. **Supabase** (Database) - ALREADY SET UP ✅
**Purpose:** PostgreSQL database, auth, storage  
**Status:** Schema created, credentials in `.env.local`

---

### 5. **Anthropic API** (Optional - if not using OpenRouter)
**Purpose:** Direct Claude access  
**Used by:** Researcher, Drafter (fallback)

**Setup Steps:**
1. Sign up at https://console.anthropic.com
2. Add credits
3. Generate API key
4. Add to `.env.local`: `ANTHROPIC_API_KEY=sk-ant-...`

---

### 6. **OpenAI API** (Optional - if not using OpenRouter)
**Purpose:** Direct GPT access  
**Used by:** Classifier (fallback)

**Setup Steps:**
1. Sign up at https://platform.openai.com
2. Add credits
3. Generate API key
4. Add to `.env.local`: `OPENAI_API_KEY=sk-...`

---

### 7. **Slack** (Notifications) - NICE TO HAVE
**Purpose:** Daily digests, approval notifications  
**Priority:** Can defer to post-MVP

**Setup Steps:**
1. Create Slack app at https://api.slack.com/apps
2. Add Bot Token Scopes: `chat:write`, `files:write`
3. Install to workspace
4. Add to `.env.local`:
   - `SLACK_BOT_TOKEN=xoxb-...`
   - `SLACK_SIGNING_SECRET=...`

---

### 8. **Browserbase** (Screenshots) - NICE TO HAVE
**Purpose:** Capture evidence screenshots for high-score signals  
**Priority:** Can defer to post-MVP

**Setup Steps:**
1. Sign up at https://browserbase.com
2. Get API key
3. Add to `.env.local`: `BROWSERBASE_API_KEY=...`

---

### 9. **Calendly** (Meeting Scheduling) - SIMPLE
**Purpose:** Embed meeting link in emails  
**Setup:** Just add your Calendly URL to `.env.local`

```
CALENDLY_LINK=https://calendly.com/your-username/15min
```

---

## 📋 Integration Checklist

### Critical Path (Must complete today):
- [ ] OpenRouter API key + test
- [ ] Firecrawl API key + test
- [ ] Gmail OAuth setup + test send
- [ ] Update `.env.local` with all keys
- [ ] Create integration test scripts

### Nice to Have (Can defer):
- [ ] Slack bot setup
- [ ] Browserbase API key
- [ ] Direct Anthropic/OpenAI keys (if OpenRouter fails)

---

## 🧪 Integration Test Plan

Create `/scripts/test-integrations.ts`:

```typescript
// Test all integrations independently
async function testOpenRouter() { ... }
async function testFirecrawl() { ... }
async function testGmail() { ... }
async function testSupabase() { ... }

// Run all tests
await Promise.all([
  testOpenRouter(),
  testFirecrawl(),
  testGmail(),
  testSupabase()
]);
```

---

## 📝 Environment Variables Template

Update `.env.local`:

```bash
# Supabase (Already configured)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# OpenRouter (Primary LLM)
OPENROUTER_API_KEY=sk-or-v1-...

# Firecrawl (Web scraping)
FIRECRAWL_API_KEY=fc-...

# Gmail API
GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-...
GMAIL_REFRESH_TOKEN=1//...

# Calendly
CALENDLY_LINK=https://calendly.com/your-username/15min

# N8N (Already running)
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_KEY=n8n_api_...

# Optional: Direct API access (fallback)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Optional: Post-MVP
SLACK_BOT_TOKEN=xoxb-...
SLACK_SIGNING_SECRET=...
BROWSERBASE_API_KEY=...
```

---

## 🎯 Success Criteria

By end of today, we should be able to:
1. ✅ Make LLM calls via OpenRouter
2. ✅ Scrape a webpage via Firecrawl
3. ✅ Send a test email via Gmail API
4. ✅ Query Supabase database
5. ✅ All credentials stored in `.env.local`

Once these work, building agents becomes straightforward copy-paste.

---

## 🚀 Next Steps After Integrations

1. Create integration wrapper functions in `/lib/integrations/`
2. Build agent API routes that use these wrappers
3. Create N8N workflows that call the API routes
4. Test end-to-end pipeline

---

**Estimated Time:** 3-4 hours for all critical integrations
