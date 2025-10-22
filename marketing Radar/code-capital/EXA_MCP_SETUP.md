# Exa MCP Docker Setup

**Using Your Existing Exa MCP Server**

---

## ✅ You Already Have This!

Your Exa MCP configuration:
```json
{
  "mcpServers": {
    "exa": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "EXA_API_KEY",
        "mcp/exa"
      ],
      "env": {
        "EXA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

This means Exa runs as a **Docker container** using the **Model Context Protocol (MCP)**, not as an HTTP server.

---

## 🔧 Setup for Code & Capital

### 1. Set Your Exa API Key

```bash
# In your .env.local file (root marketing Radar directory)
EXA_API_KEY=your-actual-exa-api-key-here
```

### 2. Verify Docker Image Exists

```bash
# Check if you have the mcp/exa image
docker images | grep mcp/exa

# If not, you may need to pull or build it
# (Check your MCP server documentation)
```

### 3. Test the Integration

```bash
cd "marketing Radar/code-capital"

# Test Exa client (uses MCP Docker automatically)
npx tsx lib/research/exa-client.ts

# Expected output:
# - Spawns Docker container
# - Searches for NVDA news
# - Returns articles from Bloomberg, WSJ, etc.
```

---

## 🎯 How It Works

The updated `ExaClient` now:

1. **Spawns Docker container** for each request
2. **Sends MCP protocol messages** via stdin
3. **Receives results** via stdout
4. **Automatically cleans up** (--rm flag)

### Example Flow

```typescript
import { ExaClient } from './lib/research/exa-client';

const exa = new ExaClient(); // Uses MCP by default

// This will:
// 1. Run: docker run -i --rm -e EXA_API_KEY=... mcp/exa
// 2. Send: {"jsonrpc":"2.0","method":"tools/call","params":{...}}
// 3. Receive: Search results
// 4. Clean up container
const results = await exa.searchStockNews('NVDA', 7);
```

---

## 🚀 Usage in Newsletter Pipeline

### Market Data + Exa Research

```bash
# 1. Collect market data (Friday 6 PM)
npx tsx agents/market-data-aggregator.ts

# 2. Analyze with AI + Exa (Saturday 12 AM)
npx tsx agents/opportunity-finder.ts

# Exa will automatically:
# - Search fintech news (Bloomberg, WSJ, Reuters)
# - Search AI news (TechCrunch, The Verge)
# - Search crypto news (CoinDesk, The Block)
# - Enhance AI analysis with fresh context
```

### What You'll See

```
🤖 Analyzing market data with AI...
📰 Fetching recent market news with Exa...
  ✅ Found 15 fintech articles
  ✅ Found 18 AI articles
  ✅ Found 12 crypto articles
✅ AI identified 5 opportunities
```

---

## 💰 Cost

- **Exa API**: Free tier (1,000 searches/month)
- **Docker**: Free (uses your local Docker)
- **Weekly newsletter**: ~20 searches per week = 80/month
- **Cost**: $0/month ✅

---

## 🔧 Configuration Options

### Use MCP (Default)
```typescript
const exa = new ExaClient(); // Uses MCP Docker
```

### Use Direct API (Fallback)
```typescript
const exa = new ExaClient(undefined, false); // Direct HTTP API
```

### Custom API Key
```typescript
const exa = new ExaClient('your-custom-key');
```

---

## 🐛 Troubleshooting

### "Docker image not found"

```bash
# Check if image exists
docker images | grep mcp/exa

# If missing, you may need to build/pull it
# Check your MCP server documentation for the image source
```

### "Permission denied"

```bash
# Make sure Docker is running
docker ps

# Check Docker permissions
docker run hello-world
```

### "Exa API key invalid"

```bash
# Verify your key is set
echo $EXA_API_KEY

# Test with direct API call
curl -X POST https://api.exa.ai/search \
  -H "Authorization: Bearer $EXA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"query": "test", "numResults": 1}'
```

### "MCP protocol error"

The client will automatically fall back to direct API if MCP fails:

```typescript
// Automatic fallback
try {
  // Try MCP first
  response = await this.callMCP('exa_search', params);
} catch (error) {
  // Fall back to direct API
  response = await this.callDirectAPI('search', params);
}
```

---

## 📊 Performance

### MCP Docker (Your Setup)
- **Pros**: 
  - Isolated environment
  - No persistent server needed
  - Automatic cleanup
  - Works with MCP protocol
- **Cons**: 
  - ~1-2 second Docker startup per request
  - More resource intensive

### Direct API (Fallback)
- **Pros**: 
  - Faster (~200ms per request)
  - Less resource intensive
- **Cons**: 
  - Direct internet dependency
  - No MCP protocol benefits

**Recommendation**: Use MCP (your current setup) for consistency with your other MCP servers.

---

## ✅ Verification

Test that everything works:

```bash
# 1. Set API key
export EXA_API_KEY="your-key"

# 2. Test Exa client
npx tsx lib/research/exa-client.ts

# Expected output:
# Testing Exa MCP Client...
# Searching for NVDA news...
# Found 20 articles:
# 1. NVIDIA Reports Record Q4 Earnings...
#    https://www.bloomberg.com/...
#    Published: 2025-01-15
# ...

# 3. Test full pipeline
npx tsx agents/opportunity-finder.ts

# Should include news context in analysis
```

---

## 🎯 Next Steps

Your Exa MCP is now integrated! The newsletter pipeline will automatically:

1. ✅ Collect market data (Alpha Vantage + CoinGecko)
2. ✅ Fetch recent news (Exa MCP Docker)
3. ✅ Analyze with AI (OpenRouter + Claude)
4. ✅ Generate opportunities with fresh context

**Ready to test?**

```bash
npx tsx agents/opportunity-finder.ts
```

---

**Questions? The client handles MCP Docker automatically - just set your EXA_API_KEY and go!**
