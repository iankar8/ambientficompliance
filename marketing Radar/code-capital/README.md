# 💼 Code & Capital

**Morning Brew for fintech nerds**

A weekly newsletter about AI in banking, stablecoins, and the future of financial services.

---

## 🎯 What Is This?

Code & Capital is an automated newsletter that:
- 📰 **Aggregates** 50+ fintech articles/week using Exa MCP
- 🤖 **Analyzes** with Claude 3.5 Sonnet (OpenRouter)
- ✍️ **Writes** Morning Brew-style content
- 📧 **Sends** to subscribers via Resend
- 🚀 **Automates** everything with Vercel cron

**Target audience:** Heads of innovation at banks, fintech execs, VCs

**Cost:** $4-8/month for 500 subscribers

---

## ✅ Status: READY TO LAUNCH

All systems operational:
- ✅ News aggregation (Exa MCP)
- ✅ Newsletter generation (Claude 3.5)
- ✅ Email delivery (Resend)
- ✅ Landing page (`/code-capital`)
- ✅ Automation (Vercel cron)

**Next step:** Get Resend API key and send first newsletter!

---

## 🚀 Quick Start

### 1. Test Locally
```bash
# Aggregate news
EXA_API_KEY=your-key node --env-file=.env -r tsx/cjs \
  code-capital/agents/fintech-news-aggregator.ts

# Generate newsletter
node --env-file=.env -r tsx/cjs \
  code-capital/agents/morning-brew-writer.ts

# Send test email
node --env-file=.env -r tsx/cjs \
  code-capital/agents/newsletter-sender.ts \
  2025-10-21 \
  your-email@gmail.com
```

### 2. Deploy to Vercel
```bash
git push origin main
# Then deploy via Vercel dashboard
```

### 3. Launch!
See [LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md) for complete instructions.

---

## 📁 Project Structure

```
code-capital/
├── agents/
│   ├── fintech-news-aggregator.ts  # Scrapes news via Exa MCP
│   ├── morning-brew-writer.ts      # Generates newsletter
│   └── newsletter-sender.ts        # Sends via Resend
├── prompts/
│   └── morning-brew-style.txt      # Writing style guide
├── LAUNCH_GUIDE.md                 # Complete setup guide
└── README.md                       # This file
```

---

## 💰 Cost

**Monthly (500 subscribers):**
- Exa MCP: $0 (1,000 searches/month free)
- OpenRouter: $4-8 (4 newsletters)
- Resend: $0 (3,000 emails/month free)
- Supabase: $0 (free tier)
- Vercel: $0 (hobby plan)

**Total: $4-8/month** 🎉

---

## 📊 Sample Newsletter

**Subject:** USDC's stumble has banks racing to fill the stablecoin void

**Sections:**
1. **The Lead** - USDC loses peg, banks celebrate
2. **Quick Hits** - PNC joins FedNow, SEC drops stablecoin framework
3. **Chart of Week** - Stablecoin market cap trends
4. **Deep Dive** - Why every bank will issue a stablecoin by 2026
5. **What We're Watching** - Early signals in AI credit scoring

**Tone:** Morning Brew meets The Information

---

## 🔧 Tech Stack

- **News**: Exa MCP (Docker)
- **AI**: OpenRouter (Claude 3.5 Sonnet)
- **Email**: Resend
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Framework**: Next.js 14

---

## 📈 Roadmap

### Now ✅
- [x] News aggregation
- [x] Newsletter generation
- [x] Email delivery
- [x] Landing page
- [x] Automation

### Next (1-2 weeks)
- [ ] Welcome email sequence
- [ ] Referral program
- [ ] Archive page
- [ ] Analytics dashboard

### Future (1-3 months)
- [ ] Podcast version
- [ ] Sponsor slots
- [ ] Premium tier
- [ ] Community Slack

---

## 📞 Support

- **Launch Guide**: [LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md)
- **Troubleshooting**: See launch guide
- **Questions**: Check the docs or test locally

---

## 🎉 Ready to Launch?

1. Get Resend API key
2. Send test email
3. Deploy to Vercel
4. Send first newsletter!

**See [LAUNCH_GUIDE.md](./LAUNCH_GUIDE.md) for step-by-step instructions.**

---

**Made with ☕ for fintech builders**
