# Parlant Integration - Migration Checklist

Complete guide for integrating Parlant into ArcanaRed production.

---

## Phase 1: Foundation Setup ✅ COMPLETE

- [x] Created `packages/parlant-bridge/` structure
- [x] Implemented Python Parlant service
- [x] Implemented TypeScript bridge client
- [x] Created Docker setup
- [x] Wrote documentation
- [x] Added example Zelle agent
- [x] Updated root package.json

**Status:** Ready for PoC

---

## Phase 2: Local Development Setup (Days 1-2)

### Python Environment
- [ ] Install Python 3.11+
  ```bash
  python --version  # Should be 3.11+
  ```
- [ ] Create virtual environment
  ```bash
  cd packages/parlant-bridge/python
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  ```
- [ ] Install dependencies
  ```bash
  pip install -r requirements.txt
  ```
- [ ] Test Parlant installation
  ```bash
  python -c "import parlant; print('Parlant OK')"
  ```

### TypeScript Bridge
- [ ] Install dependencies
  ```bash
  cd packages/parlant-bridge/typescript
  npm install
  ```
- [ ] Build TypeScript
  ```bash
  npm run build
  ```
- [ ] Check for errors
  ```bash
  ls -la dist/  # Should see compiled JS files
  ```

### Root Project
- [ ] Install all dependencies
  ```bash
  cd /Users/iankar/ArcanaRed
  npm install
  ```
- [ ] Build all packages
  ```bash
  npm run build
  ```
- [ ] Verify workspace recognized
  ```bash
  npm ls @arcanared/parlant-bridge
  ```

---

## Phase 3: Service Testing (Day 2)

### Start Services

**Terminal 1 - Demo Bank:**
- [ ] Start demo bank
  ```bash
  npm run demo-bank
  ```
- [ ] Verify at http://localhost:4000
- [ ] Test login with demouser/Demo1234!

**Terminal 2 - Playwright Bridge:**
- [ ] Start Playwright bridge
  ```bash
  cd packages/parlant-bridge/typescript
  npm start
  ```
- [ ] Check console for "listening on port 5000"
- [ ] Test health check
  ```bash
  curl http://localhost:5000/health
  ```

**Terminal 3 - Parlant Service:**
- [ ] Export API key
  ```bash
  export ANTHROPIC_API_KEY=sk-ant-...
  ```
- [ ] Start Python service
  ```bash
  cd packages/parlant-bridge/python
  source venv/bin/activate
  python server.py
  ```
- [ ] Check console for "Parlant server started"
- [ ] Test health check
  ```bash
  curl http://localhost:8000/health
  ```

### Integration Test
- [ ] Initialize Playwright
  ```bash
  curl -X POST http://localhost:5000/executor/init \
    -H "Content-Type: application/json" \
    -d '{"headless":false}'
  ```
- [ ] Create agent session
  ```bash
  curl -X POST http://localhost:8000/api/agent/execute \
    -H "Content-Type: application/json" \
    -d '{
      "workflow": "login",
      "config": {
        "targetUrl": "http://localhost:4000",
        "credentials": {"username": "demouser", "password": "Demo1234!"}
      },
      "sessionId": "test_001"
    }'
  ```
- [ ] Verify response (should see agent created)

---

## Phase 4: Zelle PoC Implementation (Days 3-4)

### Complete Zelle Agent
- [ ] Review `python/agents/zelle_agent.py`
- [ ] Add missing tools if needed
- [ ] Test journey definition
- [ ] Verify guideline matching

### Update Server Integration
- [ ] Import zelle_agent in `server.py`
- [ ] Wire up agent creation to execute endpoint
- [ ] Test agent initialization

### Test Full Workflow
- [ ] Start all services
- [ ] Execute Zelle workflow via API
- [ ] Monitor console logs
- [ ] Verify browser actions
- [ ] Check screenshots captured
- [ ] Review explainability output

### Debug & Iterate
- [ ] Fix any errors
- [ ] Tune guidelines
- [ ] Optimize performance
- [ ] Document learnings

---

## Phase 5: ArcanaRed Integration (Day 4-5)

### Create Discovery Wrapper
- [ ] Create `packages/arcanared-core/src/lib/discovery-parlant.ts`
- [ ] Import ParlantClient
- [ ] Implement similar interface to current discovery
- [ ] Handle trace conversion

### Add Feature Flag
- [ ] Add `USE_PARLANT` env variable to `.env.example`
- [ ] Update discovery CLI to check flag
- [ ] Route to parlant or current based on flag

### Test Integration
- [ ] Run with `USE_PARLANT=false` (current)
  ```bash
  export USE_PARLANT=false
  npm run discovery:run
  ```
- [ ] Run with `USE_PARLANT=true` (new)
  ```bash
  export USE_PARLANT=true
  npm run discovery:run
  ```
- [ ] Compare results side-by-side

---

## Phase 6: Benchmarking (Day 5)

### Performance Metrics
- [ ] Measure workflow completion time
  - Current approach: _____ seconds
  - Parlant approach: _____ seconds
  - Delta: _____ %
- [ ] Measure API costs
  - Current tokens used: _____
  - Parlant tokens used: _____
  - Delta: _____ %

### Quality Metrics
- [ ] Bot-likelihood score
  - Current: _____
  - Parlant: _____
- [ ] Evidence quality
  - Current: [ ] Good [ ] Excellent
  - Parlant: [ ] Good [ ] Excellent
- [ ] Explainability
  - Current: [ ] Limited [ ] Full
  - Parlant: [ ] Limited [ ] Full

### Reliability Metrics
- [ ] Run 10 test workflows
- [ ] Success rate: _____ %
- [ ] Error types encountered: _____
- [ ] Recovery rate: _____ %

---

## Phase 7: Multi-Agent (Week 4, Optional)

Only if PoC successful and time permits.

### Coordinator Agent
- [ ] Create `python/agents/coordinator.py`
- [ ] Define cluster coordination logic
- [ ] Implement shared context

### Phishing Agent
- [ ] Create `python/agents/phishing_agent.py`
- [ ] Define phishing workflow
- [ ] Wire up triggers

### Exploit Agent
- [ ] Create `python/agents/exploit_agent.py`
- [ ] Define exploit workflow
- [ ] Connect to coordinator

### Test Cluster
- [ ] Start all agents
- [ ] Trigger phishing
- [ ] Verify coordination
- [ ] Measure timing

---

## Phase 8: Documentation & Handoff (Day 5)

### Update Documentation
- [ ] Add Parlant to ARCHITECTURE_MAP.md
- [ ] Update README.md with usage
- [ ] Create troubleshooting guide
- [ ] Document known issues

### Team Training
- [ ] Demo Parlant setup
- [ ] Explain guideline system
- [ ] Show debugging tools
- [ ] Q&A session

### Decision Point
- [ ] Review benchmarks
- [ ] Assess reliability
- [ ] Evaluate team comfort
- [ ] Make Go/No-Go decision for full migration

---

## Go/No-Go Decision Criteria

### ✅ GO if:
- [ ] Performance within 20% of current
- [ ] Reliability >= 90% success rate
- [ ] Explainability clearly better
- [ ] Team confident in approach
- [ ] No blocking technical issues

### ❌ NO-GO if:
- [ ] Performance significantly worse (>50% slower)
- [ ] Reliability < 80% success rate
- [ ] Major blocking bugs
- [ ] Team lacks confidence
- [ ] Time constraints too tight

### 🔄 DEFER if:
- [ ] Performance needs tuning
- [ ] Minor issues need fixing
- [ ] Team needs more training
- [ ] Re-evaluate in 1 week

---

## Phase 9: Production Preparation (Nov-Dec, if GO)

### Infrastructure
- [ ] Set up production Parlant service
- [ ] Configure Kubernetes deployment
- [ ] Add monitoring (Prometheus)
- [ ] Set up logging (ELK)

### Security
- [ ] Audit API endpoints
- [ ] Add authentication
- [ ] Enable HTTPS/TLS
- [ ] Scan for vulnerabilities

### Testing
- [ ] Load test (100+ agents)
- [ ] Stress test
- [ ] Failover testing
- [ ] Disaster recovery drill

### Documentation
- [ ] Runbooks for ops team
- [ ] Incident response plan
- [ ] Rollback procedures
- [ ] Customer-facing docs

---

## Phase 10: Production Rollout (Dec-Jan)

### Soft Launch
- [ ] Deploy to staging
- [ ] Run parallel with current system
- [ ] Monitor for 1 week
- [ ] Fix any issues

### Gradual Rollout
- [ ] 10% traffic to Parlant
- [ ] Monitor metrics
- [ ] 50% traffic to Parlant
- [ ] Monitor metrics
- [ ] 100% traffic to Parlant

### Hard Cutover
- [ ] Deprecate old system
- [ ] Update all documentation
- [ ] Announce to users
- [ ] Monitor closely for 2 weeks

---

## Success Metrics (Final)

### Technical
- [ ] 99.9% uptime
- [ ] < 5% error rate
- [ ] 100+ concurrent agents
- [ ] < 60s workflow completion

### Business
- [ ] Customer satisfaction high
- [ ] Support tickets low
- [ ] Positive feedback
- [ ] No major incidents

### Team
- [ ] Confident operating system
- [ ] Documentation complete
- [ ] Training complete
- [ ] Runbooks tested

---

## Rollback Plan

If critical issues arise:

1. **Immediate (< 5 min):**
   - [ ] Set `USE_PARLANT=false` globally
   - [ ] Deploy flag to production
   - [ ] Verify old system operational

2. **Short-term (< 1 hour):**
   - [ ] Investigate root cause
   - [ ] Document issue
   - [ ] Plan fix

3. **Long-term (< 1 week):**
   - [ ] Fix issue in staging
   - [ ] Re-test thoroughly
   - [ ] Retry rollout

---

## Notes & Learnings

Document key learnings as you go:

### What Worked Well
- _____

### What Didn't Work
- _____

### Surprises
- _____

### Recommendations for Future
- _____

---

## Sign-Offs

### PoC Complete (Day 5)
- [ ] Engineering Lead: ___________
- [ ] Date: ___________
- [ ] Decision: GO / NO-GO / DEFER

### Production Ready (Jan)
- [ ] Engineering Lead: ___________
- [ ] Ops Lead: ___________
- [ ] Date: ___________
- [ ] Status: READY / NOT READY

---

**Last Updated:** October 14, 2025  
**Status:** Phase 1 Complete - Ready for Phase 2
