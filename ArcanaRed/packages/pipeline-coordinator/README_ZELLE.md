# Zelle Multi-Agent System - Quick Start

## What This Does

Integrates your **VAPI social engineering demo** with **ArcanaRed's workflow capture and detection platform**:

1. **VAPI agent** collects credentials via voice call
2. **ArcanaRed agents** execute Wells Fargo Zelle transfer
3. **Scoring engine** detects AI behavior patterns
4. **Artifact processor** generates compliance evidence

## Architecture

```
VAPI (Social) → Redis → Orchestrator → Explorer/Runner → Scorer → Artifacts
```

## Quick Start

### 1. Install & Configure

```bash
# Install dependencies
npm install

# Start Redis
brew install redis
brew services start redis

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Start the Agent

```bash
npm run start:zelle
```

You should see:
```
[Orchestrator] Starting Zelle Multi-Agent System...
[Orchestrator] Listening for VAPI triggers on Redis...
```

### 3. Trigger from VAPI

In your existing VAPI code, add Redis integration:

```javascript
const Redis = require('ioredis');
const redis = new Redis('redis://localhost:6379');

// After collecting OTP from victim
async function onOTPCollected(sessionId, username, password, otp) {
  // Store credentials
  await redis.mset(
    `session:${sessionId}:username`, username,
    `session:${sessionId}:password`, password,
    `session:${sessionId}:otp`, otp
  );
  
  // Trigger ArcanaRed
  await redis.publish('social:otp_collected', JSON.stringify({ sessionId }));
}

// Listen for completion
redis.subscribe('exploit:completed');
redis.on('message', (channel, message) => {
  const { sessionId, success } = JSON.parse(message);
  console.log(`Exploit completed for ${sessionId}: ${success}`);
  // Close VAPI call
});
```

### 4. Monitor Execution

Watch the logs for real-time progress:
- Explorer capture (first run)
- DSL compilation
- Deterministic replay (subsequent runs)
- Agent Score computation
- Artifact bundle generation

### 5. View Results

```bash
# Check generated DSL
cat workflows/wells_fargo_zelle_v0.1.yaml

# View screenshots
ls tmp/screenshots/{sessionId}/

# Check artifacts
ls tmp/artifacts/{sessionId}/
```

## Test Without VAPI

```bash
# In redis-cli terminal
redis-cli

# Trigger manually
MSET session:test123:username mariearaneta91 \
     session:test123:password CoffeeRun2025 \
     session:test123:otp 123456

PUBLISH social:otp_collected '{"sessionId":"test123"}'
```

## Key Features

✅ **Explorer Mode** (First Run): Captures workflow using Anthropic Computer Use  
✅ **Runner Mode** (Replays): Deterministic execution from compiled DSL  
✅ **Agent Scoring**: Behavioral detection with explainability  
✅ **Evidence Bundles**: Video, HAR, DOM snapshots, Agent Score  
✅ **Redis Coordination**: Seamless integration with VAPI  
✅ **<90s Target**: Parallel execution meets performance goal

## Files Created

```
src/
├── agents/
│   ├── explorer-agent.ts    # Workflow capture
│   ├── runner-agent.ts      # Deterministic replay
│   └── scoring-agent.ts     # AI detection
├── orchestrator.ts          # Main coordinator
├── redis-client.ts          # Redis integration
├── zelle-agent.ts          # Entry point
└── types.ts                # TypeScript types
```

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Your Anthropic API key

Optional:
- `REDIS_URL` - Default: `redis://localhost:6379`
- `MAX_EXECUTION_TIME` - Default: `90000` (90s)
- `ENABLE_EXPLORER` - Default: `true`
- `ENABLE_SCORING` - Default: `true`

## Troubleshooting

**Redis connection failed?**
```bash
redis-cli ping  # Should return PONG
```

**Anthropic API errors?**
```bash
# Check your API key
echo $ANTHROPIC_API_KEY
```

**DSL not generating?**
```bash
# Check Explorer logs
# Ensure ENABLE_EXPLORER=true
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure `.env`
3. ✅ Start Redis
4. ✅ Run `npm run start:zelle`
5. ✅ Integrate with VAPI
6. ✅ Monitor execution
7. ✅ View artifacts

For detailed documentation, see: `/docs/zelle_agent_implementation.md`
