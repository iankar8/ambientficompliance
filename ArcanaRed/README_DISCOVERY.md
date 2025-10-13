# ArcanaRed Discovery Agent - Quick Start

## What It Does

The Discovery Agent automatically:
1. **Explores** your web app workflows using AI
2. **Records** screen video of the exploitation
3. **Scores** bot-likelihood (0-100)
4. **Generates** professional evidence bundle with mitigations

## Setup (One Time)

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Set API key
export ANTHROPIC_API_KEY=your_key_here
```

## Run Discovery

### Test on Demo Bank

```bash
# Start demo bank (separate terminal)
cd packages/demo-bank && npm start

# Run discovery
npm run discovery:run
```

### Custom Target

```bash
TARGET_URL=https://your-staging.com \
WORKFLOW_TYPE=zelle_send \
USERNAME=testuser \
PASSWORD=testpass \
npm run discovery:run
```

## Supported Workflows

- `zelle_send` - Zelle payment flow
- `wire_transfer` - Wire transfer flow  
- `ach_payment` - ACH payment flow
- `login` - Authentication flow

## Output

Results saved to `tmp/discovery/run_*/`:

```
run_xxxxx/
├── videos/
│   └── video.webm              # Screen recording
├── screenshots/
│   ├── step_001.png
│   ├── step_002.png
│   └── ...
├── traces/
│   └── trace.json              # Full trace log
├── bundle.json                 # Evidence bundle (JSON)
├── report.html                 # Visual report (open in browser)
└── result.json                 # Discovery summary
```

## View Results

```bash
# Open HTML report
open tmp/discovery/run_*/report.html
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TARGET_URL` | `http://localhost:4000` | Target application URL |
| `WORKFLOW_TYPE` | `zelle_send` | Workflow to test |
| `USERNAME` | `demouser` | Login username |
| `PASSWORD` | `Demo1234!` | Login password |
| `OUTPUT_PATH` | `tmp/discovery` | Output directory |
| `ANTHROPIC_API_KEY` | (required) | Claude API key |

## Understanding the Score

- **0-39**: Low risk - Human-like behavior
- **40-59**: Medium risk - Some suspicious patterns
- **60-79**: High risk - Bot-like behavior
- **80-100**: Critical risk - Obvious automation

## Next Steps

1. **Review evidence bundle** - Check video, screenshots, signals
2. **Validate vulnerability** - Confirm it's exploitable
3. **Implement mitigations** - Follow recommendations
4. **Re-test** - Run discovery again to verify fix

## Troubleshooting

**No video recorded:**
- Ensure Playwright can launch browser (may need display server)
- Check `launchOptions.recordVideo` is enabled

**Agent fails to complete workflow:**
- Verify credentials are correct
- Check target URL is accessible
- Review `trace.json` for errors
- Enable debug logs: `EXPLORER_DEBUG_LOGS=true`

**Score seems wrong:**
- Scoring is calibrated for typical workflows
- Very fast/efficient humans may score 40-50
- Review individual signals in `bundle.json`

## Architecture

```
Discovery Agent
├── Uses smart navigation (semantic selectors)
├── Records via Playwright video capture
├── Computes behavioral score
└── Packages everything into evidence bundle

Simple Scorer
├── Analyzes timing patterns
├── Checks navigation behavior
├── Evaluates execution quality
└── Returns 0-100 score + reasoning

Evidence Bundle Generator
├── Vulnerability assessment
├── Impact analysis
├── Mitigation recommendations
└── Professional HTML/JSON reports
```

## Demo This Week

Perfect for customer demos:
1. Point at their staging environment
2. Run discovery (2-3 minutes)
3. Show them the HTML report with video
4. Discuss score and mitigations
5. Close the deal 💰
