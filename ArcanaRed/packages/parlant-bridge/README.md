# Parlant Bridge

TypeScript ↔ Python bridge for integrating Parlant agent framework with ArcanaRed.

## Architecture

```
TypeScript (ArcanaRed)
  ↓ HTTP
Python (Parlant Service) ← Guidelines, Journeys, Tools
  ↓ HTTP
TypeScript (Playwright Bridge)
  ↓
Playwright (Browser Automation)
```

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Set API key
export ANTHROPIC_API_KEY=your_key

# Start services
docker-compose up

# Test health
curl http://localhost:8000/health
curl http://localhost:5000/health
```

### Option 2: Local Development

**Terminal 1 - Python Service:**
```bash
cd python
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python server.py
```

**Terminal 2 - TypeScript Bridge:**
```bash
cd typescript
npm install
npm run build
npm start
```

## Usage

### From TypeScript

```typescript
import { ParlantClient } from '@arcanared/parlant-bridge';

const client = new ParlantClient({ baseUrl: 'http://localhost:8000' });

// Execute agent
const response = await client.executeAgent({
  workflow: 'zelle_send',
  config: {
    targetUrl: 'http://localhost:4000',
    credentials: {
      username: 'demouser',
      password: 'Demo1234!'
    }
  },
  sessionId: 'run_123'
});

console.log(response);
```

## API Endpoints

### Parlant Service (Port 8000)

- `GET /health` - Health check
- `POST /api/agent/execute` - Execute an agent
- `GET /api/agent/{sessionId}/status` - Get agent status
- `POST /api/agent/{sessionId}/stop` - Stop agent

### Playwright Bridge (Port 5000)

- `GET /health` - Health check
- `POST /executor/init` - Initialize Playwright executor
- `POST /tools/execute` - Execute a Playwright tool
- `POST /executor/cleanup` - Cleanup executor

## Development

### Adding New Tools

**Python side (`python/server.py`):**
```python
@p.tool
async def my_custom_tool(context: p.ToolContext, param: str) -> p.ToolResult:
    # Tool logic
    return p.ToolResult("Success")
```

**TypeScript side (`typescript/src/executor-bridge.ts`):**
```typescript
case 'my_custom_action':
  // Implementation
  result = 'Action completed';
  break;
```

### Adding New Agents

Create agent files in `python/agents/`:

```python
# python/agents/zelle_agent.py
import parlant.sdk as p

async def create_zelle_agent(server: p.Server, config: dict):
    agent = await server.create_agent(name="Zelle", description="...")
    
    # Add guidelines
    await agent.create_guideline(...)
    
    # Add journeys
    await agent.create_journey(...)
    
    return agent
```

## Testing

```bash
# Python tests
cd python
pytest tests/

# TypeScript tests
cd typescript
npm test

# Integration test
curl -X POST http://localhost:8000/api/agent/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "login",
    "config": {"targetUrl": "http://localhost:4000", "credentials": {"username": "test", "password": "test"}},
    "sessionId": "test_123"
  }'
```

## Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional
PLAYWRIGHT_BRIDGE_URL=http://localhost:5000
PLAYWRIGHT_BRIDGE_PORT=5000
```

## Troubleshooting

### Port conflicts
```bash
# Check ports
lsof -i :8000
lsof -i :5000

# Kill processes
kill -9 <PID>
```

### Connection errors
- Ensure both services are running
- Check Docker network if using containers
- Verify firewall settings

### Parlant installation issues
```bash
# Update pip
pip install --upgrade pip

# Install with verbose output
pip install -v parlant
```

## Production Deployment

See `/docs/PARLANT_INTEGRATION.md` for full production deployment guide.

## Resources

- [Parlant Documentation](https://www.parlant.io/docs)
- [Parlant GitHub](https://github.com/emcie-co/parlant)
- [ArcanaRed Integration Plan](/docs/PARLANT_INTEGRATION.md)
