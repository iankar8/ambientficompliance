# Code & Capital - Quick Start Guide

**Get your first newsletter + podcast published in 7 days**

---

## 🎯 Week 1 Timeline

### Day 1: Setup & Voice Clone
**Time: 2-3 hours**

1. **Record voice samples for Sesame**
   ```
   - Find a quiet room
   - Use good microphone (or iPhone)
   - Record 30 minutes of natural speech:
     * Read sample news articles (varied topics)
     * Explain technical concepts
     * Tell stories conversationally
     * Show different emotions: excited, serious, thoughtful
   - Upload to Sesame AI platform
   - Wait for voice model training (24-48 hours)
   ```

2. **Set up accounts**
   - [ ] Sesame AI (voice cloning)
   - [ ] Anthropic (Claude API)
   - [ ] Resend (email delivery)
   - [ ] Supabase (database)
   - [ ] Domain name (codecapital.io or similar)

3. **Initial costs**
   - Sesame: ~$50/month
   - Anthropic: ~$20/month (pay-as-you-go)
   - Resend: Free tier (100 emails/day)
   - Supabase: Free tier
   - Domain: ~$12/year
   - **Total: ~$70/month**

---

### Day 2: Database & Infrastructure
**Time: 2 hours**

1. **Set up Supabase project**
   ```bash
   # Create new project at supabase.com
   # Copy connection string
   # Run schema from IMPLEMENTATION_PLAN.md
   ```

2. **Clone this repo structure**
   ```bash
   cd "marketing Radar"
   mkdir -p code-capital/{agents,lib,prompts,workflows,public/audio}
   ```

3. **Install dependencies**
   ```bash
   cd code-capital
   npm init -y
   npm install @anthropic-ai/sdk @supabase/supabase-js rss-parser resend axios fluent-ffmpeg
   npm install -D typescript @types/node tsx
   ```

4. **Environment variables**
   ```bash
   # .env.local
   ANTHROPIC_API_KEY=your_key
   SESAME_API_KEY=your_key
   SESAME_VOICE_ID=your_voice_id
   RESEND_API_KEY=your_key
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

---

### Day 3: Manual Newsletter #1
**Time: 3-4 hours**

**Goal: Write your first newsletter manually to establish style**

1. **Pick 5-7 stories**
   - Browse HN, TechCrunch, Bloomberg
   - Mix of tech + finance
   - Focus on impact, not just news

2. **Write newsletter**
   - Use prompts/newsletter-style.txt as guide
   - Intro: 2-3 sentences
   - Main story: 3-4 paragraphs
   - 2-3 secondary stories
   - Quick Hits: 5 bullets
   - By The Numbers: 3-4 stats
   - Closing line

3. **Save as template**
   ```markdown
   # Code & Capital
   *January 15, 2025*
   
   ## ☕ Good Morning
   [Your intro]
   
   ## 📱 THE BIG STORY
   ### [Headline]
   [Content]
   **Why it matters:** [Implications]
   
   [Continue...]
   ```

4. **Get feedback**
   - Send to 5-10 friends
   - Ask: "Would you read this daily?"
   - Iterate on style

---

### Day 4: Test Voice Clone
**Time: 2 hours**

1. **Convert newsletter to podcast script**
   - Use prompts/podcast-style.txt
   - Add conversational elements
   - Include [PAUSE] and [EMPHASIS] markers

2. **Generate test audio**
   ```typescript
   import { SesameClient } from './lib/voice/sesame-client';
   
   const sesame = new SesameClient();
   await sesame.generateAudio(
     script,
     'test-episode.mp3'
   );
   ```

3. **Listen and iterate**
   - Check pronunciation
   - Adjust pacing
   - Fix awkward phrases
   - Re-generate until natural

4. **Add intro/outro music**
   - Find royalty-free music (Epidemic Sound, Artlist)
   - 5-10 second clips
   - Mix with voice using FFmpeg

---

### Day 5: Build News Aggregator
**Time: 3 hours**

1. **Create source list**
   ```typescript
   // lib/sources/tech-sources.ts
   export const TECH_SOURCES = [
     { name: 'Hacker News', url: 'https://news.ycombinator.com/rss' },
     { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
     // Add 15-20 more
   ];
   ```

2. **Build aggregator**
   ```bash
   # Copy from IMPLEMENTATION_PLAN.md
   # Test with: npx tsx agents/news-aggregator.ts
   ```

3. **Test scraping**
   ```bash
   npx tsx agents/news-aggregator.ts
   # Should populate stories table in Supabase
   ```

---

### Day 6: AI Content Generation
**Time: 4 hours**

1. **Build curator agent**
   ```bash
   # Copy from IMPLEMENTATION_PLAN.md
   # Test: npx tsx agents/content-curator.ts 2025-01-15
   ```

2. **Build newsletter writer**
   ```bash
   # Copy from IMPLEMENTATION_PLAN.md
   # Test: npx tsx agents/newsletter-writer.ts 2025-01-15
   ```

3. **Build podcast scripter**
   ```bash
   # Copy from IMPLEMENTATION_PLAN.md
   # Test: npx tsx agents/podcast-scripter.ts <newsletter-id>
   ```

4. **Test full pipeline**
   ```bash
   # Run all agents in sequence
   # Review AI-generated content
   # Compare to your manual version
   # Adjust prompts if needed
   ```

---

### Day 7: Automation & Launch
**Time: 3 hours**

1. **Build daily workflow**
   ```typescript
   // workflows/daily-pipeline.ts
   // Copy from IMPLEMENTATION_PLAN.md
   ```

2. **Set up Vercel cron**
   ```json
   // vercel.json
   {
     "crons": [{
       "path": "/api/cron/daily-newsletter",
       "schedule": "0 0 * * *"
     }]
   }
   ```

3. **Create landing page**
   ```tsx
   // app/subscribe/page.tsx
   // Simple email signup form
   ```

4. **Soft launch**
   - Add yourself + 10 friends as subscribers
   - Run pipeline manually
   - Send first automated newsletter
   - Collect feedback

---

## 📊 Success Checklist

After Week 1, you should have:

- [ ] Voice clone trained and tested
- [ ] Database schema deployed
- [ ] 20+ news sources configured
- [ ] AI agents built and tested
- [ ] First manual newsletter written
- [ ] First AI-generated newsletter
- [ ] First podcast episode recorded
- [ ] Landing page live
- [ ] 10+ beta subscribers
- [ ] Automated daily pipeline working

---

## 🎯 Week 2: Growth

### Days 8-14: Iterate & Grow

1. **Refine AI prompts**
   - Adjust based on feedback
   - A/B test different styles
   - Optimize for engagement

2. **Build website**
   - Newsletter archive
   - Podcast player
   - About page
   - Subscribe page

3. **Start promoting**
   - Post on Twitter/LinkedIn
   - Share in relevant communities
   - Ask friends to forward
   - Target: 100 subscribers by end of week

4. **Add analytics**
   - Track open rates
   - Monitor click rates
   - Measure podcast downloads
   - Identify popular topics

---

## 💡 Pro Tips

### Content Strategy
- **Consistency > Perfection** - Ship daily, improve iteratively
- **Quality curation** - Better to cover 5 great stories than 10 mediocre ones
- **Strong opinions** - Don't be afraid to take stances
- **Data-driven** - Always include numbers and stats

### Technical Tips
- **Test locally first** - Don't deploy untested code
- **Monitor costs** - Set up billing alerts
- **Error handling** - Add Sentry or similar
- **Backup plan** - Have manual override for failures

### Growth Hacks
- **Share on HN** - Post your first issue
- **Twitter threads** - Tease newsletter content
- **Guest appearances** - Go on podcasts
- **Partnerships** - Cross-promote with similar newsletters

---

## 🚨 Common Pitfalls

### Week 1 Mistakes to Avoid

1. **Over-engineering**
   - Don't build fancy features yet
   - Focus on core pipeline
   - Ship something basic that works

2. **Perfectionism**
   - Your first newsletter will be rough
   - That's okay! Iterate quickly
   - Feedback > polish

3. **Too many sources**
   - Start with 10-15 quality sources
   - Add more later
   - Quality > quantity

4. **Ignoring voice quality**
   - Spend time on voice clone
   - Test extensively
   - Bad audio = instant unsubscribe

5. **No backup plan**
   - What if AI fails?
   - What if Sesame is down?
   - Have manual fallback

---

## 📈 Metrics to Track

### Week 1
- Newsletters sent: 7
- Subscribers: 10-20
- Open rate: >50% (small list)
- Podcast downloads: 5-10 per episode

### Week 2
- Subscribers: 50-100
- Open rate: >40%
- Podcast downloads: 20-50 per episode
- Social shares: 5-10 per issue

### Month 1
- Subscribers: 500
- Open rate: >35%
- Podcast downloads: 100+ per episode
- Referral rate: 10%

---

## 🎓 Learning Resources

### Newsletter Writing
- Morning Brew archives
- Stratechery by Ben Thompson
- Not Boring by Packy McCormick

### Podcast Production
- How I Built This (NPR)
- Acquired (tech deep dives)
- All-In Podcast (conversational style)

### Voice & Audio
- Sesame AI docs
- Podcast editing tutorials
- Audio mixing basics

---

## 🚀 Ready to Start?

### Immediate Next Steps

1. **Today**: Record voice samples, set up accounts
2. **Tomorrow**: Set up database, install dependencies
3. **This week**: Write first newsletter, build pipeline
4. **Next week**: Launch to first 10 subscribers

### Questions to Answer

- What's your unique angle? (What makes this different?)
- Who's your ideal reader? (Be specific)
- What time will you publish? (6 AM? 7 AM?)
- What's your domain name? (codecapital.io?)

---

**Let's build this! Start with Day 1 and we'll iterate from there.** 🚀

**Need help? I'm here to build each component with you.**
