# Quick Start: 5 Minutes to First Discovery

## Step 1: Setup (2 min)

```bash
# Clone and setup
cd ArcanaRed
chmod +x setup-discovery.sh
./setup-discovery.sh

# Set API key
export ANTHROPIC_API_KEY=your_anthropic_key
```

## Step 2: Start Demo Bank (30 sec)

```bash
# Terminal 1: Start demo bank
cd packages/demo-bank
npm start
# Wait for "Server running on http://localhost:4000"
```

## Step 3: Run Discovery (2-3 min)

```bash
# Terminal 2: Run discovery
npm run discovery:run
```

You'll see:
```
🚀 ArcanaRed Discovery Agent

Configuration:
  Target: http://localhost:4000
  Workflow: zelle_send
  Output: /Users/you/ArcanaRed/tmp/discovery

🔍 Starting discovery: zelle_send
📁 Output: tmp/discovery/run_xxxxx
🤖 Agent exploring workflow...
✅ Discovery complete in 45.3s
📹 Video: tmp/discovery/run_xxxxx/videos/video.webm
📸 Screenshots: 12

📊 Computing agent score...
🎯 Agent Score: 87/100
   Risk Level: CRITICAL
   Confidence: 75%

📦 Generating evidence bundle...
📄 HTML report: tmp/discovery/run_xxxxx/report.html
📝 Markdown summary: tmp/discovery/run_xxxxx/summary.md

✅ Discovery complete!
```

## Step 4: View Results (30 sec)

```bash
# Open the HTML report
open tmp/discovery/run_*/report.html
```

You'll see:
- **Video** of the AI agent exploiting the workflow
- **Agent Score** (87/100 = high bot likelihood)
- **Behavioral Signals** (fast timing, direct navigation, etc.)
- **Business Impact** (estimated loss, frequency)
- **Mitigations** (code changes to fix)

---

## Test Different Workflows

```bash
# Wire transfer
WORKFLOW_TYPE=wire_transfer npm run discovery:run

# ACH payment
WORKFLOW_TYPE=ach_payment npm run discovery:run

# Just login
WORKFLOW_TYPE=login npm run discovery:run
```

## Test Real Customer Staging

```bash
TARGET_URL=https://customer-staging.com \
USERNAME=test@example.com \
PASSWORD=SecurePass123 \
WORKFLOW_TYPE=zelle_send \
npm run discovery:run
```

---

## What You Get

### 1. Video Evidence
- Screen recording of entire exploit
- Shows exactly what AI agent did
- Undeniable proof of vulnerability

### 2. Agent Score (0-100)
- **0-39**: Low risk (human-like)
- **40-59**: Medium risk (suspicious)
- **60-79**: High risk (bot-like)
- **80-100**: Critical risk (obvious automation)

### 3. Behavioral Signals
- Timing patterns (action delays, typing speed)
- Navigation behavior (direct vs exploratory)
- Execution quality (errors, retries)

### 4. Business Impact
- Estimated financial loss per incident
- Expected frequency of attacks
- Affected user base

### 5. Mitigations
- Specific recommendations
- Implementation difficulty
- Code snippets where applicable

---

## Demo to Customers

1. **Show them their own app** being exploited
2. **Share the HTML report** (looks professional)
3. **Discuss the score** and what it means
4. **Review mitigations** together
5. **Close the deal** 💰

---

## Troubleshooting

**Agent fails:**
```bash
# Enable debug logs
EXPLORER_DEBUG_LOGS=true npm run discovery:run
```

**No video recorded:**
- Video recording requires headed browser
- Check Playwright can launch display

**Score seems off:**
- Review signals in `bundle.json`
- Scoring calibrated for typical workflows
- Fast humans may score 40-50

**Build errors:**
```bash
# Clean rebuild
rm -rf node_modules packages/*/node_modules packages/*/dist
npm install
npm run build
```

---

## Next Steps

✅ You now have working discovery agent
✅ You can test any workflow
✅ You have professional evidence bundles

**This week:**
- [ ] Test on 3 demo bank workflows
- [ ] Reach out to 5 potential customers
- [ ] Show them live demos
- [ ] Get feedback
- [ ] Iterate based on what they say

**Don't build more features until you have customers!**
