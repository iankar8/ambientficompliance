# OpenRouter + Exa Setup Guide

**Enhanced AI and Research for Code & Capital Newsletter**

---

## 🎯 Why OpenRouter + Exa?

### OpenRouter Benefits
- **Access to multiple AI models** through one API
- **Better pricing** than direct API access
- **Model flexibility** - switch between Claude, GPT-4, Llama, Gemini
- **Cost optimization** - use cheaper models for simple tasks
- **No vendor lock-in**

### Exa Benefits
- **Neural search** - better than keyword search
- **Financial news aggregation** - from Bloomberg, WSJ, Reuters, etc.
- **Real-time research** - latest market news and analysis
- **Company research** - earnings, analysis, sentiment
- **Enhanced context** - AI gets fresh data, not just market prices

---

## 📦 1. OpenRouter Setup

### Step 1: Get API Key
1. Go to https://openrouter.ai/
2. Sign up for an account
3. Go to https://openrouter.ai/keys
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)

### Step 2: Add to Environment Variables
```bash
# In your .env.local file
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-sonnet

# Optional: Your site URL for OpenRouter analytics
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Step 3: Test OpenRouter
```bash
cd "marketing Radar/code-capital"

# Test the client
npx tsx lib/ai/openrouter-client.ts

# Expected output:
# - AI response about top AI stocks
# - Model info and pricing
```

### Step 4: Fund Your Account
1. Go to https://openrouter.ai/credits
2. Add credits (start with $10-20)
3. Monitor usage at https://openrouter.ai/activity

---

## 🔍 2. Exa MCP Server Setup

### Step 1: Get Exa API Key
1. Go to https://exa.ai/
2. Sign up for an account
3. Go to https://dashboard.exa.ai/api-keys
4. Create a new API key
5. Copy the key

### Step 2: Set Up Docker Container
```bash
# Pull the Exa MCP server image (if you have it)
docker pull your-exa-mcp-image

# Or if you need to build it, create a docker-compose.yml:
cat > docker-compose.exa.yml << 'EOF'
version: '3.8'

services:
  exa-mcp:
    image: exa-mcp-server:latest
    container_name: exa-mcp
    ports:
      - "3001:3001"
    environment:
      - EXA_API_KEY=${EXA_API_KEY}
      - PORT=3001
    restart: unless-stopped
    networks:
      - code-capital

networks:
  code-capital:
    driver: bridge
EOF

# Start the container
docker-compose -f docker-compose.exa.yml up -d
```

### Step 3: Add to Environment Variables
```bash
# In your .env.local file
EXA_API_KEY=your-exa-api-key-here
EXA_MCP_SERVER_URL=http://localhost:3001
```

### Step 4: Test Exa Connection
```bash
# Test the Exa client
npx tsx lib/research/exa-client.ts

# Expected output:
# - NVDA news articles
# - Bitcoin news articles
# - Article titles and URLs
```

### Step 5: Verify Docker Container
```bash
# Check if container is running
docker ps | grep exa-mcp

# Check container logs
docker logs exa-mcp

# Test the API directly
curl http://localhost:3001/health
```

---

## 💰 3. Cost Comparison

### OpenRouter Pricing (per 1M tokens)

| Model | Prompt | Completion | Best For |
|-------|--------|------------|----------|
| Claude 3.5 Sonnet | $3 | $15 | Investment analysis |
| Claude 3 Haiku | $0.25 | $1.25 | Quick summaries |
| GPT-4o | $5 | $15 | Alternative to Claude |
| Llama 3.1 70B | $0.35 | $0.40 | Cheap extraction |
| Gemini Pro 1.5 | $1.25 | $5 | Huge context |

### Exa Pricing
- **Free tier**: 1,000 searches/month
- **Pro**: $20/month for 10,000 searches
- **Enterprise**: Custom pricing

### Estimated Monthly Costs

**Scenario 1: Weekly Newsletter (4 issues/month)**
- OpenRouter: $5-10/month
- Exa: $0 (free tier)
- **Total: $5-10/month** ✅

**Scenario 2: Daily Newsletter (30 issues/month)**
- OpenRouter: $30-50/month
- Exa: $20/month (Pro tier)
- **Total: $50-70/month**

**Scenario 3: Premium (Daily + Real-time alerts)**
- OpenRouter: $100-150/month
- Exa: $20/month
- **Total: $120-170/month**

---

## 🔧 4. Configuration Options

### OpenRouter Model Selection

```typescript
// In your code
import { MODELS } from './lib/ai/openrouter-client';

// For investment analysis (best quality)
const response = await openrouter.complete(prompt, {
  model: MODELS.ANALYSIS, // Claude 3.5 Sonnet
  temperature: 0.7,
  maxTokens: 8192
});

// For quick summaries (cheap and fast)
const summary = await openrouter.complete(prompt, {
  model: MODELS.SUMMARY, // Claude 3 Haiku
  temperature: 0.5,
  maxTokens: 1024
});

// For data extraction (very cheap)
const data = await openrouter.complete(prompt, {
  model: MODELS.EXTRACTION, // Llama 3.1 70B
  temperature: 0.3,
  maxTokens: 2048
});
```

### Exa Search Configuration

```typescript
// In your code
import { ExaClient } from './lib/research/exa-client';

const exa = new ExaClient();

// Search stock news
const news = await exa.searchStockNews('NVDA', 7);

// Search crypto news
const cryptoNews = await exa.searchCryptoNews('Bitcoin', 7);

// Research a company
const research = await exa.researchCompany('NVIDIA', 'NVDA');

// Get market sentiment
const sentiment = await exa.getMarketSentiment('AI stocks', 7);
```

---

## 🧪 5. Testing the Integration

### Test 1: Market Data + AI Analysis
```bash
# Collect market data
npx tsx agents/market-data-aggregator.ts

# Analyze with OpenRouter (no Exa)
export EXA_MCP_SERVER_URL=""  # Disable Exa temporarily
npx tsx agents/opportunity-finder.ts

# Should work with just market data
```

### Test 2: Market Data + AI + Exa Research
```bash
# Make sure Exa is running
docker ps | grep exa-mcp

# Run with Exa enabled
export EXA_MCP_SERVER_URL="http://localhost:3001"
npx tsx agents/opportunity-finder.ts

# Should include recent news context
```

### Test 3: Full Pipeline
```bash
# Run complete workflow
npm run weekly-newsletter

# Or manually:
npx tsx agents/market-data-aggregator.ts
npx tsx agents/opportunity-finder.ts
# (newsletter writer coming next)
```

---

## 📊 6. Monitoring & Optimization

### OpenRouter Dashboard
- View usage: https://openrouter.ai/activity
- Check costs: https://openrouter.ai/credits
- See model performance: https://openrouter.ai/models

### Exa Dashboard
- View searches: https://dashboard.exa.ai/
- Check quota: https://dashboard.exa.ai/usage
- Manage API keys: https://dashboard.exa.ai/api-keys

### Cost Optimization Tips

1. **Use cheaper models for simple tasks**
   - Summaries: Claude 3 Haiku ($0.25/$1.25)
   - Extraction: Llama 3.1 70B ($0.35/$0.40)
   - Analysis: Claude 3.5 Sonnet ($3/$15)

2. **Cache Exa results**
   - Store news in database
   - Refresh every 6-12 hours
   - Avoid duplicate searches

3. **Batch operations**
   - Collect all data first
   - Run AI analysis once
   - Generate newsletter in one pass

4. **Monitor token usage**
   - Log token counts
   - Set up alerts for high usage
   - Optimize prompts to be concise

---

## 🔒 7. Security Best Practices

### API Key Management
```bash
# Never commit API keys to git
echo ".env.local" >> .gitignore

# Use environment variables
export OPENROUTER_API_KEY="sk-or-v1-..."
export EXA_API_KEY="..."

# For production (Vercel)
# Add keys in Vercel dashboard → Settings → Environment Variables
```

### Docker Security
```bash
# Don't expose Exa MCP to public internet
# Use internal Docker network only

# In docker-compose.yml:
services:
  exa-mcp:
    ports:
      - "127.0.0.1:3001:3001"  # Bind to localhost only
```

---

## 🚨 8. Troubleshooting

### OpenRouter Issues

**Problem**: "Invalid API key"
```bash
# Check your key format
echo $OPENROUTER_API_KEY
# Should start with: sk-or-v1-

# Test with curl
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer $OPENROUTER_API_KEY"
```

**Problem**: "Rate limit exceeded"
```bash
# Check your usage
# Go to: https://openrouter.ai/activity

# Solution: Add more credits or wait
```

**Problem**: "Model not found"
```bash
# List available models
npx tsx -e "
import { OpenRouterClient } from './lib/ai/openrouter-client.ts';
const client = new OpenRouterClient();
client.getModels().then(console.log);
"
```

### Exa MCP Issues

**Problem**: "Connection refused"
```bash
# Check if Docker container is running
docker ps | grep exa-mcp

# If not running, start it
docker-compose -f docker-compose.exa.yml up -d

# Check logs
docker logs exa-mcp
```

**Problem**: "Exa API key invalid"
```bash
# Check your key
echo $EXA_API_KEY

# Test directly
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $EXA_API_KEY" \
  -d '{"query": "test", "num_results": 1}'
```

**Problem**: "No results returned"
```bash
# Exa might be down or rate limited
# Check status: https://status.exa.ai/

# Fallback: Code will work without Exa
# Just won't have news context
```

---

## 📚 9. Additional Resources

### OpenRouter
- Docs: https://openrouter.ai/docs
- Models: https://openrouter.ai/models
- Pricing: https://openrouter.ai/docs#pricing
- Discord: https://discord.gg/openrouter

### Exa
- Docs: https://docs.exa.ai/
- API Reference: https://docs.exa.ai/reference
- Examples: https://docs.exa.ai/examples
- Discord: https://discord.gg/exa

---

## ✅ 10. Verification Checklist

Before running the newsletter pipeline, verify:

- [ ] OpenRouter API key is set and valid
- [ ] OpenRouter account has credits ($10+ recommended)
- [ ] Exa API key is set (optional but recommended)
- [ ] Exa MCP Docker container is running (if using Exa)
- [ ] Can connect to Exa MCP server at localhost:3001
- [ ] Test scripts run successfully
- [ ] Environment variables are in .env.local
- [ ] .env.local is in .gitignore

---

## 🎯 Quick Start Commands

```bash
# 1. Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# 2. Start Exa MCP (if using)
docker-compose -f docker-compose.exa.yml up -d

# 3. Test OpenRouter
npx tsx lib/ai/openrouter-client.ts

# 4. Test Exa
npx tsx lib/research/exa-client.ts

# 5. Run market data collection
npx tsx agents/market-data-aggregator.ts

# 6. Run opportunity finder (with OpenRouter + Exa)
npx tsx agents/opportunity-finder.ts

# 7. Check results in Supabase
# Go to: https://supabase.com/dashboard
# View: investment_opportunities table
```

---

**Ready to go! Your newsletter now has:**
- ✅ Access to multiple AI models via OpenRouter
- ✅ Real-time financial news via Exa
- ✅ Better analysis with fresh context
- ✅ Lower costs with model flexibility
- ✅ No vendor lock-in

**Questions? Check the troubleshooting section or ask!**
