# Parlant Integration - Quick Start Guide

Get the Parlant bridge running in 5 minutes.

## Prerequisites

- [x] ArcanaRed working (Week 2 complete)
- [ ] Python 3.11+ installed
- [ ] Docker (optional, recommended)
- [ ] ANTHROPIC_API_KEY environment variable set

## Step 1: Install Dependencies

### Python Service
```bash
cd packages/parlant-bridge/python
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### TypeScript Bridge
```bash
cd packages/parlant-bridge/typescript
npm install
npm run build
```

## Step 2: Start Services

### Option A: Docker (Recommended)
```bash
# From project root
cd packages/parlant-bridge
export ANTHROPIC_API_KEY=your_key
docker-compose up
```

### Option B: Manual (3 terminals)

**Terminal 1 - Demo Bank:**
```bash
npm run demo-bank
# Should be at http://localhost:4000
```

**Terminal 2 - Playwright Bridge:**
```bash
cd packages/parlant-bridge/typescript
npm start
# Should be at http://localhost:5000
```

**Terminal 3 - Parlant Service:**
```bash
cd packages/parlant-bridge/python
source venv/bin/activate
export ANTHROPIC_API_KEY=your_key
python server.py
# Should be at http://localhost:8000
```

## Step 3: Verify Setup

### Health Checks
```bash
# Parlant service
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"parlant-bridge","parlant_ready":true}

# Playwright bridge
curl http://localhost:5000/health
# Expected: {"status":"healthy","service":"playwright-bridge","executor_initialized":false}

# Demo bank
curl http://localhost:4000
# Expected: HTML response
```

## Step 4: Test Basic Agent

Create a test file `test-parlant.ts`:

```typescript
import { ParlantClient } from '@arcanared/parlant-bridge';

async function testParlant() {
  const client = new ParlantClient({
    baseUrl: 'http://localhost:8000'
  });

  // Health check
  const health = await client.healthCheck();
  console.log('Health:', health);

  // Execute agent
  const response = await client.executeAgent({
    workflow: 'login',
    config: {
      targetUrl: 'http://localhost:4000',
      credentials: {
        username: 'demouser',
        password: 'Demo1234!'
      }
    },
    sessionId: `test_${Date.now()}`
  });

  console.log('Agent Response:', response);
}

testParlant().catch(console.error);
```

Run it:
```bash
npx tsx test-parlant.ts
```

## Step 5: Run Full Workflow (Coming Soon)

Once the Zelle agent is fully implemented:

```bash
# Set environment
export ANTHROPIC_API_KEY=your_key
export USE_PARLANT=true

# Run discovery with Parlant
npm run discovery:run
```

## Architecture Verification

Your setup should look like this:

```
Port 4000: Demo Bank (Target Application)
Port 5000: Playwright Bridge (Browser Automation)
Port 8000: Parlant Service (Agent Orchestration)
```

Test the full chain:

```bash
# 1. Initialize Playwright
curl -X POST http://localhost:5000/executor/init \
  -H "Content-Type: application/json" \
  -d '{"screenshotDirectory":"./tmp/screenshots","headless":false}'

# 2. Create Agent Session
curl -X POST http://localhost:8000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "login",
    "config": {
      "targetUrl": "http://localhost:4000",
      "credentials": {"username": "demouser", "password": "Demo1234!"}
    },
    "sessionId": "test_123"
  }'

# 3. Check Status
curl http://localhost:8000/api/agent/test_123/status
```

## Troubleshooting

### "Parlant not found"
```bash
pip install parlant
# If still failing, try:
pip install --upgrade pip
pip install parlant --no-cache-dir
```

### "Port already in use"
```bash
# Find process
lsof -i :8000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### "Cannot connect to Playwright bridge"
- Ensure Playwright bridge is running on port 5000
- Check `PLAYWRIGHT_BRIDGE_URL` environment variable
- Verify network connectivity (if using Docker, check network)

### "Module not found @arcanared/parlant-bridge"
```bash
# Rebuild from root
npm install
npm run build
```

### Docker issues
```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up
```

## Next Steps

1. **Add Zelle Journey** - Implement full Zelle workflow in `python/agents/zelle_agent.py`
2. **Test Guidelines** - Verify behavioral guidelines work correctly
3. **Integrate with Discovery** - Connect Parlant to existing discovery flow
4. **Benchmark** - Compare Parlant vs. current approach

## Resources

- [Full Integration Plan](/docs/PARLANT_INTEGRATION.md)
- [Parlant Bridge README](/packages/parlant-bridge/README.md)
- [Parlant Documentation](https://www.parlant.io/docs)

## Status Checklist

- [ ] Python environment setup
- [ ] TypeScript bridge built
- [ ] Services running (3 ports active)
- [ ] Health checks passing
- [ ] Test agent creation successful
- [ ] Ready for workflow implementation

Once all checked, proceed to implementing the Zelle journey! 🚀
