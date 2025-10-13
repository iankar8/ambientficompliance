# Zelle Multi-Agent System Implementation

## Overview

The Zelle Multi-Agent System integrates your existing **AI Agent Swarm Fraud Demo** (VAPI social engineering) with the **ArcanaRed platform** (workflow capture, deterministic replay, and detection).

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  SOCIAL CLUSTER (External)                    │
│  • VAPI.ai voice agent collects PII + OTP                    │
│  • Writes to Redis: username, password, otp, dob, ssn4       │
│  • Publishes event: "social:otp_collected"                   │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   │ Redis Pub/Sub
                   ▼
┌──────────────────────────────────────────────────────────────┐
│              ZELLE ORCHESTRATOR (ArcanaRed)                   │
│  • Listens for Redis events                                  │
│  • Coordinates multi-agent execution                          │
│  • Enforces <90s performance target                          │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌───────────────┐      ┌──────────────┐
│ EXPLORER MODE │  OR  │ RUNNER MODE  │
│ (First Run)   │      │ (Replay)     │
└───────┬───────┘      └──────┬───────┘
        │                     │
        └──────────┬──────────┘
                   ▼
        ┌──────────────────────┐
        │   SCORING AGENT      │
        │ • Agent Score Engine │
        │ • Policy Engine      │
        │ • Mitigation Gen     │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │  ARTIFACT BUNDLE     │
        │ • Video evidence     │
        │ • HAR traces         │
        │ • DOM snapshots      │
        │ • Agent Score        │
        └──────────────────────┘
```

## Components Created

### 1. **Types & Interfaces** (`src/types.ts`)
- `SessionData`: Credentials from VAPI
- `ExplorerResult`: Capture output
- `RunResult`: Replay output
- `AgentScore`: Detection signals
- `OrchestratorConfig`: System configuration

### 2. **Redis Client** (`src/redis-client.ts`)
- Connects to Redis for session coordination
- Subscribes to `social:otp_collected` events
- Stores exploit results
- Publishes `exploit:completed` events

### 3. **ExplorerAgent** (`src/agents/explorer-agent.ts`)
- Runs on **first execution** (no DSL exists)
- Uses Anthropic Computer Use Agent
- Captures workflow via Playwright
- Compiles trace → DSL
- Saves `workflows/wells_fargo_zelle_v0.1.yaml`

### 4. **RunnerAgent** (`src/agents/runner-agent.ts`)
- Runs on **subsequent executions** (DSL exists)
- Deterministic Playwright replay
- Injects session credentials from Redis
- Captures screenshots, HAR, DOM snapshots
- Builds exploit bundle

### 5. **ScoringAgent** (`src/agents/scoring-agent.ts`)
- Computes Agent Confidence Score
- Analyzes timing, behavior, fingerprints
- Returns recommendation: ALLOW/REVIEW/BLOCK
- Generates webhook payload for Policy Engine

### 6. **ZelleOrchestrator** (`src/orchestrator.ts`)
- Main coordinator service
- Listens for Redis events from VAPI
- Executes Explorer → Runner → Scorer pipeline
- Stores results back to Redis
- Publishes completion events

### 7. **Main Entry Point** (`src/zelle-agent.ts`)
- CLI executable
- Loads configuration from environment
- Starts orchestrator
- Handles graceful shutdown

## Installation

### 1. Install Dependencies
```bash
cd packages/pipeline-coordinator
npm install
```

### 2. Install Redis
```bash
# macOS
brew install redis
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:latest
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```bash
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=your_key_here
WORKFLOWS_DIR=./workflows
ARTIFACTS_DIR=./tmp/artifacts
SCREENSHOTS_DIR=./tmp/screenshots
MAX_EXECUTION_TIME=90000
ENABLE_EXPLORER=true
ENABLE_SCORING=true
```

## Usage

### Start Zelle Agent
```bash
npm run start:zelle
```

Output:
```
============================================================
    ArcanaRed - Zelle Multi-Agent System
============================================================
[Config] Redis URL: redis://localhost:6379
[Config] Workflows Dir: ./workflows
[Config] Explorer Enabled: true
[Config] Scoring Enabled: true

[Orchestrator] Starting Zelle Multi-Agent System...
[Redis] Connected
[Orchestrator] Directories initialized
[Orchestrator] Listening for VAPI triggers on Redis...
[Main] Waiting for Social cluster triggers...
```

### Trigger from VAPI (Social Cluster)

Your existing VAPI handler should publish to Redis:

```javascript
// In your VAPI/Social cluster code
const redis = require('ioredis');
const client = new redis('redis://localhost:6379');

async function onOTPCollected(sessionId, username, password, otp) {
  // Store session data
  await client.mset(
    `session:${sessionId}:username`, username,
    `session:${sessionId}:password`, password,
    `session:${sessionId}:otp`, otp
  );
  
  // Trigger ArcanaRed exploit flow
  await client.publish('social:otp_collected', JSON.stringify({ sessionId }));
}
```

### Monitor Execution

The orchestrator logs real-time progress:
```
[Orchestrator] OTP collected for session abc123, triggering exploit flow
[Orchestrator] Session data retrieved: mariearaneta91
[Orchestrator] No DSL found, running Explorer (capture mode)...
[ExplorerAgent] Starting capture for session abc123
[ExplorerAgent] Running Computer Use Agent...
[ExplorerAgent] Trace captured with 18 events, 0 errors
[ExplorerAgent] Compiling trace to DSL...
[ExplorerAgent] DSL saved to ./workflows/wells_fargo_zelle_v0.1.yaml
[ScoringAgent] Agent Score: 0.852 (BLOCK)
[Orchestrator] Bundle uploaded: s3://bucket/exploit_abc123.zip
[Orchestrator] Exploit flow completed in 67432ms
```

## Integration with Existing Demo

### Current Flow (VAPI Only)
```
1. SMS lure → victim calls
2. VAPI collects PII + OTP
3. Manual Playwright script runs
4. Transfer completes
```

### New Flow (VAPI + ArcanaRed)
```
1. SMS lure → victim calls
2. VAPI collects PII + OTP
3. VAPI publishes to Redis ← NEW
4. ArcanaRed orchestrator triggers ← NEW
5. Explorer/Runner executes workflow ← NEW
6. Agent Score computed ← NEW
7. Exploit bundle generated ← NEW
8. Results stored in Redis ← NEW
9. VAPI closes call (notified via Redis) ← NEW
```

## Data Flow

### 1. VAPI → Redis
```
session:{sessionId}:username → "mariearaneta91"
session:{sessionId}:password → "CoffeeRun2025"
session:{sessionId}:otp → "123456"
```

### 2. Redis → ArcanaRed
```
Pub: social:otp_collected → { sessionId: "abc123" }
```

### 3. ArcanaRed → Redis
```
exploit:{sessionId}:result → {
  success: true,
  duration: 67432,
  agentScore: 0.852,
  bundleUrl: "s3://bucket/exploit_abc123.zip"
}
```

### 4. ArcanaRed → VAPI
```
Pub: exploit:completed → { sessionId: "abc123", success: true }
```

## File Structure

```
packages/pipeline-coordinator/
├── src/
│   ├── agents/
│   │   ├── explorer-agent.ts    # Capture workflow
│   │   ├── runner-agent.ts      # Deterministic replay
│   │   └── scoring-agent.ts     # AI detection
│   ├── orchestrator.ts          # Main coordinator
│   ├── redis-client.ts          # Redis integration
│   ├── zelle-agent.ts           # CLI entry point
│   ├── types.ts                 # TypeScript types
│   └── logging.ts               # Logger
├── .env.example                 # Config template
└── package.json

workflows/                        # Generated DSLs
└── wells_fargo_zelle_v0.1.yaml

tmp/
├── screenshots/                  # Per-session screenshots
│   └── {sessionId}/
├── artifacts/                    # Exploit bundles
│   └── {sessionId}/
└── explorer-artifacts/           # Explorer captures
```

## Testing

### 1. Test Redis Connection
```bash
redis-cli ping
# Should return: PONG
```

### 2. Manual Trigger (Without VAPI)
```bash
# In redis-cli
MSET session:test123:username mariearaneta91 \
     session:test123:password CoffeeRun2025 \
     session:test123:otp 123456

PUBLISH social:otp_collected '{"sessionId":"test123"}'
```

### 3. Check Logs
Watch orchestrator logs for execution flow

### 4. Verify Output
```bash
ls -la workflows/                # DSL created
ls -la tmp/screenshots/test123/  # Screenshots captured
```

## Performance Targets

- **Explorer Mode**: ~60-90s (first run, includes DSL compilation)
- **Runner Mode**: ~30-60s (subsequent runs, deterministic)
- **Total with VAPI**: <90s end-to-end (parallel execution)

## Next Steps

1. **Install dependencies**: `npm install`
2. **Start Redis**: `redis-server`
3. **Configure `.env`**: Add ANTHROPIC_API_KEY
4. **Start agent**: `npm run start:zelle`
5. **Test with VAPI**: Trigger from your existing social cluster
6. **Monitor results**: Check Redis keys and artifact bundles

## Troubleshooting

### Redis Connection Failed
```bash
# Check Redis running
redis-cli ping

# Check URL
echo $REDIS_URL
```

### Anthropic API Errors
```bash
# Verify key
echo $ANTHROPIC_API_KEY

# Check quota
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY"
```

### DSL Not Found
```bash
# Explorer runs automatically on first execution
# Check workflows directory
ls -la workflows/

# Force Explorer mode
export ENABLE_EXPLORER=true
```

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `ANTHROPIC_API_KEY` | Required | Anthropic API key |
| `WORKFLOWS_DIR` | `./workflows` | DSL storage directory |
| `ARTIFACTS_DIR` | `./tmp/artifacts` | Exploit bundles |
| `SCREENSHOTS_DIR` | `./tmp/screenshots` | Screenshot storage |
| `MAX_EXECUTION_TIME` | `90000` | Timeout in ms |
| `ENABLE_EXPLORER` | `true` | Allow Explorer runs |
| `ENABLE_SCORING` | `true` | Compute Agent Score |

## Success Metrics

✅ **End-to-End ATO**: <90s  
✅ **Explorer Capture**: Successful DSL generation  
✅ **Deterministic Replay**: >95% success rate  
✅ **Agent Score**: Behavioral detection signals  
✅ **Artifact Bundle**: Video + HAR + DOM evidence  
✅ **VAPI Integration**: Seamless coordination via Redis
