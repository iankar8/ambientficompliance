# Code & Capital - Implementation Plan

**Step-by-step guide to building your automated newsletter + podcast**

---

## 🎯 Phase 1: Foundation (Days 1-3)

### Day 1: Voice Clone Setup
```bash
# 1. Record voice samples for Sesame
- Record 30 minutes of natural speech
- Various tones: excited, serious, conversational
- Read sample newsletter content
- Upload to Sesame AI

# 2. Test voice quality
- Generate test audio
- Adjust pronunciation
- Fine-tune pacing
```

### Day 2: News Sources
```typescript
// lib/sources/tech-sources.ts
export const TECH_SOURCES = [
  {
    name: 'Hacker News',
    url: 'https://news.ycombinator.com/rss',
    type: 'rss',
    priority: 'high'
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    type: 'rss',
    priority: 'high'
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    type: 'rss',
    priority: 'medium'
  },
  // Add 15-20 more sources
];

// lib/sources/finance-sources.ts
export const FINANCE_SOURCES = [
  {
    name: 'WSJ Tech',
    url: 'https://feeds.a.dj.com/rss/RSSWSJD.xml',
    type: 'rss',
    priority: 'high'
  },
  {
    name: 'Bloomberg',
    url: 'https://www.bloomberg.com/feed/podcast/bloomberg-technology',
    type: 'rss',
    priority: 'high'
  },
  // Add more
];
```

### Day 3: Database Schema
```sql
-- Supabase schema

-- Stories table
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  content TEXT,
  summary TEXT,
  category TEXT, -- 'tech', 'finance', 'ai', 'startup'
  importance_score FLOAT, -- AI-generated 0-1
  selected_for_newsletter BOOLEAN DEFAULT FALSE,
  newsletter_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletters table
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  intro TEXT,
  main_stories JSONB, -- Array of story IDs + summaries
  quick_hits JSONB,
  closing TEXT,
  html_content TEXT,
  markdown_content TEXT,
  status TEXT DEFAULT 'draft', -- draft, published
  sent_at TIMESTAMPTZ,
  open_rate FLOAT,
  click_rate FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Podcasts table
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  episode_number INT NOT NULL UNIQUE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  script TEXT NOT NULL,
  audio_url TEXT,
  duration_seconds INT,
  file_size_bytes BIGINT,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscribers table
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'active', -- active, unsubscribed
  source TEXT, -- website, referral, etc
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  open_count INT DEFAULT 0,
  click_count INT DEFAULT 0,
  last_opened_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_stories_published ON stories(published_at DESC);
CREATE INDEX idx_stories_selected ON stories(selected_for_newsletter, newsletter_date);
CREATE INDEX idx_newsletters_date ON newsletters(date DESC);
CREATE INDEX idx_subscribers_email ON subscribers(email);
```

---

## 🤖 Phase 2: AI Agents (Days 4-7)

### Agent 1: News Aggregator
```typescript
// agents/news-aggregator.ts
import Parser from 'rss-parser';
import { supabase } from '@/lib/supabase/client';
import { TECH_SOURCES, FINANCE_SOURCES } from '@/lib/sources';

export async function aggregateNews() {
  const parser = new Parser();
  const allSources = [...TECH_SOURCES, ...FINANCE_SOURCES];
  
  console.log(`📰 Aggregating from ${allSources.length} sources...`);
  
  for (const source of allSources) {
    try {
      const feed = await parser.parseURL(source.url);
      
      for (const item of feed.items.slice(0, 10)) { // Top 10 per source
        // Check if already exists
        const { data: existing } = await supabase
          .from('stories')
          .select('id')
          .eq('url', item.link)
          .single();
          
        if (existing) continue;
        
        // Insert new story
        await supabase.from('stories').insert({
          title: item.title,
          url: item.link,
          source: source.name,
          published_at: item.pubDate || new Date().toISOString(),
          content: item.contentSnippet || item.content,
          category: source.category
        });
        
        console.log(`✅ Added: ${item.title}`);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch ${source.name}:`, error);
    }
  }
  
  console.log('✅ News aggregation complete');
}
```

### Agent 2: Content Curator
```typescript
// agents/content-curator.ts
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase/client';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function curateStories(date: string) {
  // Get today's stories
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .gte('published_at', `${date}T00:00:00Z`)
    .lt('published_at', `${date}T23:59:59Z`)
    .order('published_at', { ascending: false });
    
  if (!stories || stories.length === 0) {
    console.log('No stories found for today');
    return;
  }
  
  console.log(`📊 Curating from ${stories.length} stories...`);
  
  // AI ranks stories
  const prompt = `You are a tech/finance editor for "Code & Capital", a daily newsletter for smart founders and engineers.

Here are today's ${stories.length} stories:

${stories.map((s, i) => `${i + 1}. ${s.title} (${s.source})\n   ${s.content?.slice(0, 200)}...`).join('\n\n')}

Select the TOP 5-7 most important stories for today's newsletter. Consider:
- Impact on tech/finance industry
- Relevance to founders, engineers, investors
- Novelty (not just incremental updates)
- Diversity of topics (mix of tech, finance, AI, startups)

Return JSON array of story numbers (1-indexed) in priority order.
Example: [3, 7, 12, 5, 19]`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  const selectedIndices = JSON.parse(message.content[0].text);
  const selectedStories = selectedIndices.map(i => stories[i - 1]);
  
  // Mark as selected
  for (const story of selectedStories) {
    await supabase
      .from('stories')
      .update({
        selected_for_newsletter: true,
        newsletter_date: date
      })
      .eq('id', story.id);
  }
  
  console.log(`✅ Selected ${selectedStories.length} stories`);
  return selectedStories;
}
```

### Agent 3: Newsletter Writer
```typescript
// agents/newsletter-writer.ts
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase/client';
import fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generateNewsletter(date: string) {
  // Get selected stories
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('selected_for_newsletter', true)
    .eq('newsletter_date', date)
    .order('importance_score', { ascending: false });
    
  if (!stories || stories.length === 0) {
    throw new Error('No stories selected for newsletter');
  }
  
  // Load style guide
  const styleGuide = fs.readFileSync('prompts/newsletter-style.txt', 'utf-8');
  
  const prompt = `${styleGuide}

Today is ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

Write today's Code & Capital newsletter featuring these stories:

${stories.map((s, i) => `
STORY ${i + 1}: ${s.title}
Source: ${s.source}
Content: ${s.content}
`).join('\n---\n')}

Generate a complete newsletter with:
1. Witty intro paragraph (2-3 sentences about today's themes)
2. Main story (3-4 paragraphs + "Why it matters")
3. 2-3 secondary stories (2 paragraphs each + "Why it matters")
4. Quick Hits section (4-5 bullet points)
5. By The Numbers (3-4 key stats)
6. Clever closing line

Use the Morning Brew style but smarter and more technical. Be opinionated but fair.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  const newsletterContent = message.content[0].text;
  
  // Save to database
  const { data: newsletter } = await supabase
    .from('newsletters')
    .insert({
      date,
      markdown_content: newsletterContent,
      main_stories: stories.map(s => ({ id: s.id, title: s.title })),
      status: 'draft'
    })
    .select()
    .single();
    
  console.log('✅ Newsletter generated');
  return newsletter;
}
```

### Agent 4: Podcast Script Generator
```typescript
// agents/podcast-scripter.ts
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase/client';
import fs from 'fs';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export async function generatePodcastScript(newsletterId: string) {
  // Get newsletter
  const { data: newsletter } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', newsletterId)
    .single();
    
  if (!newsletter) {
    throw new Error('Newsletter not found');
  }
  
  const styleGuide = fs.readFileSync('prompts/podcast-style.txt', 'utf-8');
  
  const prompt = `${styleGuide}

Convert this newsletter into a conversational podcast script (8-10 minutes):

${newsletter.markdown_content}

Requirements:
- Natural, conversational tone (like talking to a friend over coffee)
- Add transitions: "Speaking of...", "Now here's the thing...", "What's wild about this..."
- Personal touches: "I found this fascinating...", "Here's what bugs me..."
- Pacing cues: [PAUSE], [EMPHASIS], [SPEED UP]
- Time: 8-10 minutes when read naturally
- Start with: "Hey, it's [Name], and you're listening to Code & Capital."
- End with: "That's it for today. I'll see you tomorrow morning."`;

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: prompt
    }]
  });
  
  const script = message.content[0].text;
  
  // Save podcast
  const { data: podcast } = await supabase
    .from('podcasts')
    .insert({
      date: newsletter.date,
      title: `Code & Capital - ${newsletter.date}`,
      script,
      status: 'draft'
    })
    .select()
    .single();
    
  console.log('✅ Podcast script generated');
  return podcast;
}
```

---

## 🎙️ Phase 3: Voice & Audio (Days 8-10)

### Sesame Integration
```typescript
// lib/voice/sesame-client.ts
import axios from 'axios';
import fs from 'fs';

export class SesameClient {
  private apiKey: string;
  private voiceId: string;
  
  constructor() {
    this.apiKey = process.env.SESAME_API_KEY!;
    this.voiceId = process.env.SESAME_VOICE_ID!;
  }
  
  async generateAudio(script: string, outputPath: string) {
    console.log('🎙️ Generating audio with Sesame...');
    
    const response = await axios.post(
      'https://api.sesame.ai/v1/generate',
      {
        voice_id: this.voiceId,
        text: script,
        output_format: 'mp3',
        stability: 0.75,
        similarity_boost: 0.85
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    fs.writeFileSync(outputPath, response.data);
    console.log(`✅ Audio saved to ${outputPath}`);
    
    return outputPath;
  }
}
```

### Audio Mixing
```typescript
// lib/voice/audio-mixer.ts
import ffmpeg from 'fluent-ffmpeg';

export async function mixPodcast(
  voiceFile: string,
  introFile: string,
  outroFile: string,
  outputFile: string
) {
  console.log('🎵 Mixing podcast audio...');
  
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(introFile)
      .input(voiceFile)
      .input(outroFile)
      .on('end', () => {
        console.log('✅ Podcast mixed successfully');
        resolve(outputFile);
      })
      .on('error', reject)
      .mergeToFile(outputFile, '/tmp/');
  });
}
```

---

## 📧 Phase 4: Publishing (Days 11-12)

### Email Delivery
```typescript
// lib/publishers/email.ts
import { Resend } from 'resend';
import { supabase } from '@/lib/supabase/client';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewsletter(newsletterId: string) {
  // Get newsletter
  const { data: newsletter } = await supabase
    .from('newsletters')
    .select('*')
    .eq('id', newsletterId)
    .single();
    
  // Get subscribers
  const { data: subscribers } = await supabase
    .from('subscribers')
    .select('email')
    .eq('status', 'active');
    
  console.log(`📧 Sending to ${subscribers.length} subscribers...`);
  
  // Send in batches
  const batchSize = 100;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    await resend.emails.send({
      from: 'Code & Capital <newsletter@codecapital.io>',
      to: batch.map(s => s.email),
      subject: newsletter.subject,
      html: newsletter.html_content
    });
  }
  
  // Mark as sent
  await supabase
    .from('newsletters')
    .update({ status: 'published', sent_at: new Date().toISOString() })
    .eq('id', newsletterId);
    
  console.log('✅ Newsletter sent');
}
```

---

## 🔄 Phase 5: Automation (Days 13-14)

### Daily Workflow (N8N or Temporal)
```typescript
// workflows/daily-pipeline.ts
import { aggregateNews } from '@/agents/news-aggregator';
import { curateStories } from '@/agents/content-curator';
import { generateNewsletter } from '@/agents/newsletter-writer';
import { generatePodcastScript } from '@/agents/podcast-scripter';
import { SesameClient } from '@/lib/voice/sesame-client';
import { mixPodcast } from '@/lib/voice/audio-mixer';
import { sendNewsletter } from '@/lib/publishers/email';

export async function runDailyPipeline() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // 1. Aggregate news (12 AM - 2 AM)
    console.log('Step 1: Aggregating news...');
    await aggregateNews();
    
    // 2. Curate stories (2 AM - 3 AM)
    console.log('Step 2: Curating stories...');
    const stories = await curateStories(today);
    
    // 3. Generate newsletter (3 AM - 4 AM)
    console.log('Step 3: Generating newsletter...');
    const newsletter = await generateNewsletter(today);
    
    // 4. Generate podcast (4 AM - 5 AM)
    console.log('Step 4: Generating podcast...');
    const podcast = await generatePodcastScript(newsletter.id);
    
    const sesame = new SesameClient();
    const voiceFile = await sesame.generateAudio(
      podcast.script,
      `/tmp/voice-${today}.mp3`
    );
    
    const finalAudio = await mixPodcast(
      voiceFile,
      'public/audio/intro.mp3',
      'public/audio/outro.mp3',
      `public/episodes/${today}.mp3`
    );
    
    // 5. Publish (5 AM - 6 AM)
    console.log('Step 5: Publishing...');
    await sendNewsletter(newsletter.id);
    
    console.log('✅ Daily pipeline complete!');
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    // Send alert to you
  }
}
```

### Vercel Cron Job
```typescript
// app/api/cron/daily-newsletter/route.ts
import { runDailyPipeline } from '@/workflows/daily-pipeline';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  await runDailyPipeline();
  
  return Response.json({ success: true });
}
```

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/daily-newsletter",
    "schedule": "0 0 * * *"
  }]
}
```

---

## 🎯 Next Immediate Steps

1. **Record voice samples** for Sesame (30 min)
2. **Set up Supabase** database with schema
3. **Get API keys**: Anthropic, Sesame, Resend
4. **Build news aggregator** (test with 5 sources first)
5. **Write first newsletter manually** to define style

**Ready to start? Which part should we build first?**
