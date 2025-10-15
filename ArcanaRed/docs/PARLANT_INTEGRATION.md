# Parlant Integration Plan - ArcanaRed

**Status:** Approved for Production  
**Timeline:** Week 3 PoC → Week 4-5 Full Integration → Jan 2026 Production  
**Priority:** HIGH (Production Reliability Critical)

---

## Executive Decision

✅ **Integrate Parlant** for production reliability and multi-agent capabilities  
✅ **Phased approach** starting Week 3  
✅ **Full platform integration** by Jan 2026 launch

---

## Integration Architecture

### Overall System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    ArcanaRed Platform                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │  TypeScript CLI │────────▶│  Parlant Bridge │           │
│  │  (arcanared-core)│  HTTP   │  (REST API)     │           │
│  └─────────────────┘         └────────┬────────┘           │
│                                        │                      │
│                                        ▼                      │
│                              ┌──────────────────┐            │
│                              │  Parlant Service │            │
│                              │  (Python Server) │            │
│                              └────────┬─────────┘            │
│                                       │                       │
│                    ┌──────────────────┼──────────────────┐  │
│                    │                  │                  │   │
│                    ▼                  ▼                  ▼   │
│            ┌──────────────┐  ┌──────────────┐  ┌───────────┐
│            │  Agent 1     │  │  Agent 2     │  │  Agent N  │
│            │  (Journeys)  │  │  (Guidelines)│  │  (Tools)  │
│            └──────┬───────┘  └──────┬───────┘  └─────┬─────┘
│                   │                  │                │       │
│                   └──────────────────┴────────────────┘       │
│                                      │                         │
│                                      ▼                         │
│                           ┌──────────────────────┐            │
│                           │  Playwright Executor │            │
│                           │  (Browser Automation)│            │
│                           └──────────────────────┘            │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation Setup (Week 3, Days 1-3)

### Deliverables
- [x] Architecture document
- [ ] parlant-bridge package structure
- [ ] Python Parlant service with FastAPI
- [ ] TypeScript bridge client
- [ ] Docker setup for local development
- [ ] Basic health checks and monitoring

### Package Structure

```
packages/
├── parlant-bridge/
│   ├── python/                    # Python Parlant service
│   │   ├── server.py              # FastAPI server
│   │   ├── agents/                # Agent definitions
│   │   │   ├── base.py
│   │   │   ├── zelle_agent.py
│   │   │   ├── wire_agent.py
│   │   │   └── coordinator.py
│   │   ├── tools/                 # Parlant tool wrappers
│   │   │   ├── playwright.py
│   │   │   ├── state.py
│   │   │   └── evidence.py
│   │   ├── journeys/              # Workflow journey definitions
│   │   │   ├── zelle_journey.py
│   │   │   ├── wire_journey.py
│   │   │   └── ach_journey.py
│   │   ├── guidelines/            # Behavioral guidelines
│   │   │   ├── stealth.py
│   │   │   ├── error_handling.py
│   │   │   └── evidence_capture.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── typescript/                # TypeScript bridge client
│   │   ├── src/
│   │   │   ├── client.ts          # Parlant API client
│   │   │   ├── executor-bridge.ts # Playwright executor bridge
│   │   │   ├── types.ts           # Shared types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── docker-compose.yml         # Local development setup
│   └── README.md
```

### API Contract

#### TypeScript → Python (Agent Execution)

```typescript
POST /api/agent/execute
{
  "workflow": "zelle_send",
  "config": {
    "targetUrl": "http://localhost:4000",
    "credentials": {
      "username": "demouser",
      "password": "Demo1234!"
    }
  },
  "sessionId": "run_xxx"
}

Response:
{
  "sessionId": "run_xxx",
  "status": "running" | "completed" | "failed",
  "events": [...],
  "trace": {...}
}
```

#### Python → TypeScript (Tool Execution)

```typescript
POST http://localhost:5000/tools/execute
{
  "tool": "click" | "type" | "navigate" | "screenshot",
  "params": {
    "selector": "[data-testid='login-button']",
    "value": "text to type",
    ...
  }
}

Response:
{
  "success": true,
  "result": "Clicked element",
  "screenshot": "base64...",
  "error": null
}
```

---

## Phase 2: Single-Agent PoC (Week 3, Days 4-5)

### Goal
Prove Parlant can execute a single workflow (Zelle) with guidelines and explainability

### Deliverables
- [ ] Zelle workflow as Parlant journey
- [ ] 5 behavioral guidelines implemented
- [ ] Playwright tool bridge working
- [ ] Evidence bundle with explainability
- [ ] Side-by-side comparison: Current vs Parlant
- [ ] Performance benchmarks

### Example Implementation

```python
# packages/parlant-bridge/python/agents/zelle_agent.py
import parlant.sdk as p

async def create_zelle_agent(server: p.Server, config: dict):
    agent = await server.create_agent(
        name="ArcanaRed_Zelle",
        description="Security testing agent for Zelle payment workflows"
    )
    
    # Define journey
    await agent.create_journey(
        name="zelle_payment_flow",
        description="Complete Zelle payment from login to confirmation",
        steps=[
            {
                "name": "authenticate",
                "description": "Login with provided credentials",
                "success_criteria": "Dashboard page loaded"
            },
            {
                "name": "navigate_to_zelle",
                "description": "Find and click Zelle payment button",
                "success_criteria": "Zelle form visible"
            },
            {
                "name": "fill_payment_details",
                "description": "Enter recipient and amount",
                "success_criteria": "Form validation passed"
            },
            {
                "name": "submit_payment",
                "description": "Submit payment and capture confirmation",
                "success_criteria": "Success message displayed"
            }
        ]
    )
    
    # Stealth guidelines
    await agent.create_guideline(
        condition="Before any action",
        action="Add random delay between 500-2000ms to appear human-like",
        tools=[random_delay_tool]
    )
    
    await agent.create_guideline(
        condition="Typing text into input field",
        action="Type at variable speed (8-12 chars/sec) with occasional pauses",
        tools=[human_typing_tool]
    )
    
    # Error handling
    await agent.create_guideline(
        condition="Element not found or action failed",
        action="Try alternative selectors (data-testid, class, text content) before giving up",
        tools=[smart_selector_tool]
    )
    
    await agent.create_guideline(
        condition="Action failed after retries",
        action="Take screenshot, log error details, and attempt recovery",
        tools=[screenshot_tool, error_logger_tool, recovery_tool]
    )
    
    # Evidence capture
    await agent.create_guideline(
        condition="After each step completion",
        action="Capture screenshot and record state transition for evidence bundle",
        tools=[screenshot_tool, state_recorder_tool]
    )
    
    return agent
```

### Success Metrics
- ✅ Workflow completes successfully
- ✅ Guidelines matched correctly
- ✅ Explainability data captured
- ✅ Performance within 20% of current approach
- ✅ Evidence quality improved

---

## Phase 3: Multi-Agent Coordination (Week 4, Days 1-3)

### Goal
Implement social engineering cluster with 3 coordinated agents

### Architecture

```
Coordinator Agent
├─ Monitors shared context (victim status, timing)
├─ Triggers phishing agent
└─ Coordinates exploit agent timing

Phishing Agent
├─ Sends phishing email/SMS
├─ Updates shared context when victim clicks
└─ Signals exploit agent

Exploit Agent
├─ Waits for victim engagement
├─ Executes workflow when triggered
└─ Reports success to coordinator
```

### Implementation

```python
# packages/parlant-bridge/python/agents/coordinator.py
async def create_cluster(server: p.Server):
    # Shared context
    victim_status = await server.create_variable(
        name="victim_status",
        initial_value={"clicked": False, "session_active": False},
        update_interval="1s"
    )
    
    # Coordinator
    coordinator = await server.create_agent(
        name="cluster_coordinator",
        description="Orchestrates multi-agent social engineering attack"
    )
    
    await coordinator.create_guideline(
        condition="Cluster started",
        action="Initiate phishing agent first, wait for victim engagement",
        tools=[trigger_agent_tool]
    )
    
    await coordinator.create_guideline(
        condition="Victim clicked phishing link",
        action="Trigger exploit agent within 30 seconds of click",
        tools=[schedule_trigger_tool]
    )
    
    # Phishing agent
    phishing = await server.create_agent(
        name="phishing_agent",
        description="Sends phishing communications"
    )
    
    # Exploit agent
    exploit = await server.create_agent(
        name="exploit_agent",
        description="Executes workflow exploit"
    )
    
    return coordinator, phishing, exploit
```

---

## Phase 4: Full Workflow Migration (Week 4-5)

### Goal
Migrate all 4 workflows to Parlant with production-grade guidelines

### Workflows
1. **Zelle Send** (already PoC'd)
2. **Wire Transfer**
3. **ACH Payment**
4. **Login**

### Enhanced Features
- [ ] Advanced stealth techniques
- [ ] Adaptive error recovery
- [ ] A/B testing framework
- [ ] Performance monitoring
- [ ] Cost tracking (API calls)

---

## Phase 5: Production Hardening (Nov-Dec)

### Deliverables
- [ ] Comprehensive error handling
- [ ] Retry logic and circuit breakers
- [ ] Monitoring and alerting
- [ ] Performance optimization
- [ ] Security audit
- [ ] Load testing (100+ concurrent agents)
- [ ] Documentation and runbooks

### Production Checklist
- [ ] Health check endpoints
- [ ] Prometheus metrics
- [ ] Structured logging
- [ ] Graceful shutdown
- [ ] Rate limiting
- [ ] API authentication
- [ ] HTTPS/TLS
- [ ] Database persistence (agent configs)
- [ ] Backup/restore procedures
- [ ] Disaster recovery plan

---

## Technology Decisions

### Python Service Stack
```
parlant==latest          # Core framework
fastapi==0.104.0         # REST API
uvicorn==0.24.0          # ASGI server
pydantic==2.5.0          # Data validation
httpx==0.25.0            # HTTP client (to TypeScript)
redis==5.0.0             # Shared state (optional)
prometheus-client==0.19.0 # Metrics
python-json-logger==2.0.0 # Structured logging
```

### TypeScript Bridge Stack
```
@arcanared/parlant-bridge  # New package
axios==1.6.0               # HTTP client
zod==3.22.0                # Schema validation
```

### Infrastructure
- **Container:** Docker + docker-compose for local dev
- **Orchestration:** Kubernetes for production (Jan 2026)
- **Monitoring:** Prometheus + Grafana
- **Logging:** Structured JSON logs → ELK stack

---

## Development Workflow

### Local Development
```bash
# Start Parlant service
cd packages/parlant-bridge/python
docker-compose up

# Start TypeScript bridge
cd packages/parlant-bridge/typescript
npm run dev

# Run discovery with Parlant
export USE_PARLANT=true
npm run discovery:run
```

### Testing Strategy
```bash
# Unit tests (Python)
cd packages/parlant-bridge/python
pytest tests/

# Integration tests (TypeScript)
cd packages/parlant-bridge/typescript
npm test

# End-to-end tests
npm run test:e2e:parlant
```

---

## Migration Strategy

### Gradual Rollout
1. **Week 3:** PoC with Zelle only
2. **Week 4:** Add Wire and ACH
3. **Week 5:** Add Login + multi-agent
4. **Nov:** Production testing in parallel
5. **Dec:** Cut over to Parlant as primary
6. **Jan:** Launch with Parlant

### Rollback Plan
- Keep current system operational through Dec
- Feature flag: `USE_PARLANT=true|false`
- Monitor error rates and performance
- Roll back if critical issues

---

## Performance Targets

| Metric | Current | Target (Parlant) | Acceptable Range |
|--------|---------|------------------|------------------|
| Workflow completion time | 45s | 50s | < 60s |
| Bot-likelihood score | 85 | 90+ | > 85 |
| Evidence quality | Good | Excellent | Good+ |
| Explainability | Limited | Full | Full |
| Error recovery | Manual | Automatic | Automatic |
| Concurrent agents | 10 | 100 | 50+ |

---

## Cost Analysis

### Development Costs
- **PoC (Week 3):** 40 hours
- **Full Integration (Week 4-5):** 80 hours
- **Production Hardening (Nov-Dec):** 40 hours
- **Total:** ~160 hours

### Infrastructure Costs (Monthly)
- **Parlant Service:** $50 (compute)
- **Monitoring:** $20 (Prometheus/Grafana)
- **Logging:** $30 (ELK)
- **Total:** ~$100/month

### Benefits
- **Reliability:** 10x reduction in agent failures
- **Explainability:** Customer-ready evidence
- **Multi-agent:** Unlocks Week 3+ features
- **Scalability:** 10x concurrent capacity
- **Maintenance:** 50% reduction in prompt engineering

**ROI:** Positive within 3 months of Jan launch

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Language barrier** | Strong API contracts, comprehensive tests |
| **Performance overhead** | Benchmark early, optimize critical path |
| **Parlant bugs** | Active community, fallback to current system |
| **Integration complexity** | Phased rollout, feature flags |
| **Team learning curve** | Pair programming, documentation |

---

## Success Criteria

### Week 3 PoC
- ✅ Zelle workflow completes via Parlant
- ✅ Guidelines matched correctly
- ✅ Performance acceptable
- ✅ Team confident in approach

### Week 4-5 Integration
- ✅ All 4 workflows migrated
- ✅ Multi-agent cluster working
- ✅ Evidence bundles enhanced
- ✅ Zero production incidents

### Jan 2026 Launch
- ✅ 99.9% uptime
- ✅ < 5% error rate
- ✅ 100+ concurrent agents
- ✅ Customer satisfaction high

---

## Next Actions (This Week)

### Day 1 (Today)
- [x] Create integration plan
- [ ] Set up parlant-bridge package structure
- [ ] Install Parlant and test locally
- [ ] Create Docker dev environment

### Day 2
- [ ] Implement FastAPI Parlant service
- [ ] Create TypeScript bridge client
- [ ] Test basic agent creation

### Day 3
- [ ] Implement Playwright tool bridge
- [ ] Create Zelle journey
- [ ] Add 5 behavioral guidelines

### Day 4
- [ ] Run first Parlant-powered discovery
- [ ] Compare to current approach
- [ ] Document findings

### Day 5
- [ ] Refine based on learnings
- [ ] Performance optimization
- [ ] Update team on progress

---

## Team Communication

### Daily Standups
- Progress on Parlant integration
- Blockers (language, API issues)
- Learnings and adjustments

### Weekly Demo
- Live demo of Parlant-powered discovery
- Explainability showcase
- Performance metrics review

### Documentation
- Keep this doc updated
- Record decisions in ADRs
- Share learnings in team wiki

---

## Resources

### Documentation
- [Parlant Docs](https://www.parlant.io/docs)
- [Parlant Examples](https://www.parlant.io/docs/quickstart/examples)
- [Parlant Discord](https://discord.gg/duxWqxKk6J)

### Code References
- [Parlant GitHub](https://github.com/emcie-co/parlant)
- [Healthcare Example](https://www.parlant.io/docs/quickstart/examples)
- [Blog: Ensuring Compliance](https://www.parlant.io/blog/how-parlant-guarantees-compliance)

---

## Conclusion

Parlant integration is a **strategic investment** in ArcanaRed's production reliability and scalability. The phased approach minimizes risk while delivering value incrementally.

**Timeline:**
- **Week 3:** PoC complete
- **Week 4-5:** Full integration
- **Jan 2026:** Production launch

**Commitment:** Production-ready, reliable, explainable AI agents for enterprise security testing.

🚀 **Let's build it.**

---

*Document Version: 1.0*  
*Created: October 14, 2025*  
*Owner: ArcanaRed Team*
