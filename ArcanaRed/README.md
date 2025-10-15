# ArcanaRed - AI Adversarial Testing Platform

**Consolidated Edition v0.2**

## Quick Start

```bash
# Install & build
npm install
npm run build

# Start demo bank (Terminal 1)
npm run demo-bank

# Run discovery (Terminal 2)
export ANTHROPIC_API_KEY=your_key
npm run discovery:run

# View results
open tmp/discovery/run_*/report.html
```

## What This Does

1. **AI Agent** explores your web app workflow
2. **Records** video + screenshots of the exploitation
3. **Analyzes** video with AI (compliance, descriptions, transcription) 🆕
4. **Scores** bot-likelihood (0-100)
5. **Generates** professional evidence bundle with mitigations

## Project Structure

```
packages/
├── arcanared-core/      ⭐ Main package - Discovery, scoring, evidence generation
├── video-intelligence/  🆕 AI-powered video analysis (compliance, description, transcription)
├── parlant-bridge/      🚀 NEW: Parlant agent framework integration (Week 3+)
│   ├── python/          Parlant service with FastAPI
│   └── typescript/      TypeScript bridge client
├── demo-bank/           Test target application
├── explorer-service/    Smart semantic navigation engine
├── tool-executor-playwright/  Browser automation
├── shared/              Common types
└── _archive/            Pre-built infrastructure (14 packages for Week 5+)
```

## Supported Workflows

- `zelle_send` - Zelle payment flow
- `wire_transfer` - Wire transfer flow
- `ach_payment` - ACH payment flow
- `login` - Authentication flow

## Environment Variables

```bash
TARGET_URL=http://localhost:4000
WORKFLOW_TYPE=zelle_send
USERNAME=demouser
PASSWORD=Demo1234!
OUTPUT_PATH=tmp/discovery
ANTHROPIC_API_KEY=your_key
```

## Output

Results saved to `tmp/discovery/run_*/`:

```
run_xxxxx/
├── videos/video.webm
├── screenshots/*.png
├── traces/trace.json
├── bundle.json          # Evidence bundle
├── report.html          # Professional HTML report ⭐
└── result.json          # Discovery summary
```

## Development

```bash
# Build all packages
npm run build

# Clean rebuild
rm -rf packages/*/dist
npm run build

# Add new workflow
# Edit: packages/arcanared-core/src/workflows/intents.ts
```

## Documentation

- **[QUICK_START.md](./QUICK_START.md)** - 5-minute walkthrough
- **[VIDEO_INTELLIGENCE_IMPLEMENTATION.md](./VIDEO_INTELLIGENCE_IMPLEMENTATION.md)** - 🆕 AI video analysis
- **[docs/VIDEO_INTELLIGENCE_SETUP.md](./docs/VIDEO_INTELLIGENCE_SETUP.md)** - 🆕 Setup guide
- **[docs/PARLANT_INTEGRATION.md](./docs/PARLANT_INTEGRATION.md)** - 🚀 NEW: Parlant framework integration
- **[docs/PARLANT_QUICKSTART.md](./docs/PARLANT_QUICKSTART.md)** - 🚀 NEW: 5-minute Parlant setup
- **[CONSOLIDATION_SUMMARY.md](./CONSOLIDATION_SUMMARY.md)** - What changed in v0.2
- **[README_DISCOVERY.md](./README_DISCOVERY.md)** - Complete reference
- **[docs/roadmaps/](./docs/roadmaps/)** - Product roadmap

## Architecture

**Consolidated Design:**
- One core package with clear modules
- Explorer + Executor as reusable engines
- Redis coordinator for social engineering clusters (Week 3)
- Archived packages ready for Week 5+ features

## Roadmap Status

- ✅ **Week 1 (Oct 13-19):** MVP Complete
- ✅ **Week 2 (Oct 20-26):** Customer-ready artifacts
- 🔥 **Week 3 (Oct 27-Nov 2):** Social engineering clusters + Parlant PoC
- 📅 **Week 4-5:** Full Parlant integration
- 📅 **Jan 1, 2026:** Public launch (production-ready with Parlant)

## License

MIT

---

**v0.2 Consolidation:** 18 packages → 5 focused packages. All functionality preserved. Ready to scale. 🚀
