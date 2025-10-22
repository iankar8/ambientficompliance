# 💼 Code & Capital

**Morning Brew for fintech nerds**

A weekly newsletter about AI in banking, stablecoins, and the future of financial services.

---
- **Crypto**: Bitcoin, Ethereum, major altcoins + crypto stocks (COIN, MSTR, MARA)
- **AI**: Public AI companies (NVDA, MSFT, GOOGL, META, PLTR, etc.)

**Format**: Professional investment research with:
- Market overview and sector analysis
- Top 3-5 opportunities with full thesis
- Price targets (bull/base/bear cases)
- Risk analysis and catalysts
- Portfolio positioning recommendations
- Track record transparency

## ✨ What's Different?

- **AI-Powered**: Uses OpenRouter (Claude 3.5 Sonnet) for analysis
- **Research-Enhanced**: Exa MCP server for real-time financial news
- **Data-Driven**: Alpha Vantage + CoinGecko for market data
- **Professional**: Investment-grade analysis, not clickbait
- **Transparent**: Track record published, risks disclosed
- **Affordable**: ~$6-11/month to run (mostly free tiers!)

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase account
- OpenRouter API key
- Alpha Vantage API key (free)
- (Optional) Exa API key + Docker

### 2. Setup (10 minutes)
```bash
# Clone and navigate
cd "marketing Radar/code-capital"

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API keys
# See OPENROUTER_EXA_SETUP.md for detailed instructions

# Install dependencies (if not already installed)
npm install

# Set up database
# Run supabase/code-capital-investor-newsletter.sql in Supabase
```

### 3. Test the System
```bash
# Test market data collection
npx tsx agents/market-data-aggregator.ts

# Test AI analysis (with OpenRouter + Exa)
npx tsx agents/opportunity-finder.ts

# Check results in Supabase dashboard
```

### 4. Read the Docs
- **INVESTOR_QUICKSTART.md** - 2-week implementation guide
- **OPENROUTER_EXA_SETUP.md** - OpenRouter + Exa setup
- **IMPLEMENTATION_STATUS.md** - Current progress (60% complete)

---

## 🏗️ Architecture (Weekly Newsletter)

```
┌─────────────────────────────────────────────────────────────┐
│                    WEEKLY PIPELINE                           │
└─────────────────────────────────────────────────────────────┘

FRIDAY 6 PM: DATA COLLECTION
   ├─ Alpha Vantage: Fetch 40+ stock quotes
   ├─ CoinGecko: Fetch top 10 cryptocurrencies
   ├─ Track indices: SPY, QQQ, DIA, IWM
   └─ Save snapshot to Supabase

SATURDAY 12 AM: RESEARCH & ANALYSIS
   ├─ Exa MCP: Fetch financial news (optional)
   │  ├─ Fintech news (Bloomberg, WSJ, Reuters)
   │  ├─ AI news (TechCrunch, The Verge)
   │  └─ Crypto news (CoinDesk, The Block)
   ├─ OpenRouter (Claude 3.5): Analyze markets
   ├─ Identify top 5 investment opportunities
   ├─ Generate full thesis for each
   └─ Save to database

SATURDAY 6 AM: NEWSLETTER GENERATION
   ├─ OpenRouter: Write market overview
   ├─ Generate opportunity sections
   ├─ Create sector summaries
   ├─ Add portfolio recommendations
   └─ Format as HTML email

SUNDAY 6 PM: PUBLISHING
   ├─ Newsletter → Email (Resend)
   ├─ Post to website archive
   ├─ Track opens/clicks
   └─ Update track record

┌─────────────────────────────────────────────────────────────┐
│                    DELIVERY (SUNDAY 6 PM)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📰 Newsletter Format

### Structure (Morning Brew Style)

```markdown
# Code & Capital
*Your daily dose of tech and finance - January 15, 2025*

---

## ☕ Good Morning

[Witty intro paragraph about the day's themes]

---

## 📱 THE BIG STORY

### OpenAI Launches GPT-5, Wall Street Reacts

[2-3 paragraph summary with personality]

**Why it matters:** [1 paragraph on implications]

**The numbers:** [Key stats/figures]

---

## 💰 CAPITAL MOVES

### Sequoia Raises $9B Fund, Biggest Since 2021

[Story summary]

**Why it matters:** [Implications]

---

## 🚀 QUICK HITS

- **Anthropic** releases Claude 4 with 500K context window
- **Tesla** stock up 12% on robotaxi news
- **Stripe** acquires TaxJar for $1.2B
- **GitHub** Copilot hits 2M paid subscribers

---

## 📊 BY THE NUMBERS

- **$2.3T** - Total crypto market cap (↑8%)
- **4.2%** - Fed interest rate (unchanged)
- **127** - New unicorns in 2024

---

## 🎯 WHAT WE'RE WATCHING

[Forward-looking section on emerging trends]

---

## 💭 PARTING THOUGHT

[Clever closing line]

*That's all for today. Stay sharp.*

---

**Listen to today's podcast** | **Share this newsletter** | **Unsubscribe**
```

---

## 🎙️ Podcast Format

### Structure (8-12 minutes)

```
[INTRO MUSIC - 5 seconds]

Hey, it's [Your Name], and you're listening to Code & Capital.
Today is [Date], and we've got some wild stuff to cover.

[MAIN CONTENT - 6-10 minutes]
- Story 1 (2-3 min)
- Story 2 (2-3 min)
- Quick Hits (2 min)
- Closing thoughts (1 min)

[OUTRO MUSIC - 5 seconds]

That's it for today. Subscribe wherever you get your podcasts,
and I'll see you tomorrow morning.
```

---

## 🛠️ Tech Stack

### News Aggregation
- **Firecrawl** - Web scraping
- **RSS feeds** - HN, TechCrunch, etc.
- **APIs** - Crunchbase, Product Hunt

### AI Content Generation
- **Claude 3.5 Sonnet** - Newsletter writing
- **GPT-4** - Podcast script adaptation
- **Custom prompts** - Your voice/style

### Voice Cloning
- **Sesame AI** - Voice synthesis
- **ElevenLabs** (backup) - Alternative voice
- **Audio processing** - FFmpeg for mixing

### Publishing
- **Resend** - Email delivery
- **RSS feed** - Podcast distribution
- **Next.js site** - Archive/website
- **Supabase** - Subscriber management

### Automation
- **N8N** - Workflow orchestration
- **Temporal** - Reliable scheduling
- **Vercel Cron** - Trigger jobs

---

## 📁 Project Structure

```
code-capital/
├── agents/
│   ├── news-aggregator.ts      # Scrape sources
│   ├── content-curator.ts      # Rank & filter
│   ├── newsletter-writer.ts    # Generate newsletter
│   ├── podcast-scripter.ts     # Convert to script
│   └── voice-generator.ts      # Sesame integration
├── prompts/
│   ├── newsletter-style.txt    # Your writing style
│   ├── podcast-style.txt       # Conversational tone
│   └── curation-criteria.txt   # What makes news worthy
├── workflows/
│   ├── daily-pipeline.json     # N8N workflow
│   └── emergency-override.ts   # Manual controls
├── app/
│   ├── newsletter/[date]/      # Archive pages
│   ├── podcast/[episode]/      # Podcast player
│   └── subscribe/              # Landing page
├── lib/
│   ├── sources/
│   │   ├── tech-sources.ts
│   │   ├── finance-sources.ts
│   │   └── ai-sources.ts
│   ├── publishers/
│   │   ├── email.ts
│   │   ├── rss.ts
│   │   └── social.ts
│   └── voice/
│       ├── sesame-client.ts
│       └── audio-mixer.ts
└── public/
    ├── audio/
    │   ├── intro.mp3
    │   └── outro.mp3
    └── episodes/
        └── [date].mp3
```

---

## 🎨 Writing Style Guide

### Newsletter Tone
- **Smart but accessible** - No jargon unless explained
- **Witty but not try-hard** - Subtle humor
- **Opinionated but fair** - Take stances, back them up
- **Fast-paced** - Short paragraphs, punchy sentences
- **Data-driven** - Numbers, charts, evidence

### Podcast Tone
- **Conversational** - Like talking to a smart friend
- **Energetic** - Morning energy, not monotone
- **Natural transitions** - "Speaking of AI..." "Now here's the thing..."
- **Personal touches** - "I found this fascinating..." "Here's what bugs me..."

---

## 🚀 MVP Implementation Plan

### Phase 1: Manual Pipeline (Week 1)
- [ ] Set up news sources
- [ ] Write first newsletter manually
- [ ] Test Sesame voice clone
- [ ] Create basic website

### Phase 2: Semi-Automated (Week 2)
- [ ] AI curates top stories
- [ ] AI drafts newsletter (you edit)
- [ ] Auto-generate podcast script
- [ ] Manual voice recording

### Phase 3: Fully Automated (Week 3)
- [ ] End-to-end automation
- [ ] Scheduled daily runs
- [ ] Auto-publishing
- [ ] Monitoring & alerts

### Phase 4: Growth (Week 4+)
- [ ] SEO optimization
- [ ] Social media automation
- [ ] Sponsor integration
- [ ] Analytics dashboard

---

## 📊 Success Metrics

### Newsletter
- Open rate: >40% (industry avg: 20%)
- Click rate: >10%
- Subscriber growth: +5% week-over-week
- Unsubscribe rate: <0.5%

### Podcast
- Downloads per episode: Track growth
- Completion rate: >60%
- Subscriber growth: +10% week-over-week
- Apple Podcasts rating: >4.5 stars

---

## 💰 Monetization (Future)

1. **Sponsorships** - $500-2K per issue at 10K+ subscribers
2. **Premium tier** - $10/mo for deeper analysis
3. **Job board** - $299 per listing
4. **Consulting leads** - High-value audience
5. **Affiliate links** - Books, tools, courses

---

## 🎯 Competitive Differentiation

**vs. Morning Brew:**
- Smarter audience (devs, investors, founders)
- Deeper technical analysis
- AI/ML focus
- Podcast companion

**vs. TechCrunch:**
- Curated, not exhaustive
- Opinionated takes
- Daily consistency
- Audio format

**vs. Stratechery:**
- Free (initially)
- Shorter, punchier
- Daily vs. weekly
- Broader tech+finance

---

## 🔧 Next Steps

1. **Define your voice** - Record 30 min sample for Sesame
2. **Choose sources** - Which 20 sources to monitor?
3. **Write style guide** - What's your unique angle?
4. **Set up infrastructure** - Supabase, Resend, Sesame
5. **Build MVP** - First manual newsletter this week

---

**Ready to build this? Let's start with the news aggregation system!**
