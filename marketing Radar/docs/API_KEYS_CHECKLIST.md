# API Keys Checklist

Quick reference for getting all API keys needed for MVP.

---

## ✅ Checklist

### 1. OpenRouter (5 min)
- [ ] Go to https://openrouter.ai
- [ ] Sign up / Login
- [ ] Go to "Keys" → Create new key
- [ ] Add $20 credits (Settings → Credits)
- [ ] Copy key → Add to `.env.local` as `OPENROUTER_API_KEY=sk-or-v1-...`

**Test:** `curl https://openrouter.ai/api/v1/models -H "Authorization: Bearer YOUR_KEY"`

---

### 2. Firecrawl (5 min)
- [ ] Go to https://firecrawl.dev
- [ ] Sign up / Login  
- [ ] Dashboard → API Keys → Create new key
- [ ] Copy key → Add to `.env.local` as `FIRECRAWL_API_KEY=fc-...`

**Test:** `curl -X POST https://api.firecrawl.dev/v1/scrape -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" -d '{"url": "https://example.com"}'`

---

### 3. Gmail API (15-20 min)
Follow the detailed guide: `docs/GMAIL_OAUTH_SETUP.md`

**Quick steps:**
- [ ] Create Google Cloud project
- [ ] Enable Gmail API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth credentials (Desktop app)
- [ ] Run `npx tsx scripts/gmail-auth.ts` to get refresh token
- [ ] Add to `.env.local`:
  - `GMAIL_CLIENT_ID=...`
  - `GMAIL_CLIENT_SECRET=...`
  - `GMAIL_REFRESH_TOKEN=...`

---

### 4. Supabase (Already done ✅)
- [x] Project created
- [x] Schema deployed
- [x] Keys in `.env.local`

---

### 5. N8N (Already done ✅)
- [x] Running on localhost:5678
- [ ] Login and create API key (Settings → API)
- [ ] Add to `.env.local` as `N8N_API_KEY=...`

---

### 6. Calendly (1 min)
- [ ] Go to https://calendly.com
- [ ] Copy your scheduling link
- [ ] Add to `.env.local` as `CALENDLY_LINK=https://calendly.com/your-username/15min`

---

## 📝 Final .env.local Template

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

# N8N
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_KEY=n8n_api_...
```

---

## 🧪 Test All Integrations

Once you have all keys in `.env.local`, run:

```bash
npx tsx scripts/test-integrations.ts
```

Expected output:
```
✅ OpenRouter working!
✅ Firecrawl working!
✅ Gmail working!
✅ Supabase working!

🎉 All integrations working! Ready to build agents.
```

---

## ⏱️ Time Estimate

- OpenRouter: 5 min
- Firecrawl: 5 min
- Gmail OAuth: 15-20 min
- Calendly: 1 min
- N8N API key: 2 min

**Total: ~30 minutes**

---

## 🚨 Common Issues

### OpenRouter
- **"Insufficient credits"** → Add credits in Settings
- **"Invalid API key"** → Make sure you copied the full key

### Firecrawl
- **"Rate limit exceeded"** → Wait or upgrade plan
- **"Invalid URL"** → Make sure URL includes https://

### Gmail
- **"Access blocked"** → Add your email as test user in OAuth consent
- **"invalid_grant"** → Re-run OAuth flow to get new refresh token

### N8N
- **Can't access localhost:5678** → Make sure Docker container is running: `docker ps | grep arcana-n8n`

---

## ✅ Once Complete

Run the test script and you should see all green checkmarks. Then we're ready to build the agents!
