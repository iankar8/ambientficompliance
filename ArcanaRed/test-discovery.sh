#!/bin/bash
set -e

echo "🧪 Testing ArcanaRed Discovery Agent"
echo ""

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not set"
    echo "   Run: export ANTHROPIC_API_KEY=your_key"
    exit 1
fi

# Check if demo bank is running
if ! curl -s http://localhost:4000 > /dev/null; then
    echo "❌ Demo bank not running"
    echo "   Start it: cd packages/demo-bank && npm start"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Run discovery
echo "🔍 Running discovery on demo bank..."
npm run discovery:run

# Check output
RUN_DIR=$(ls -t tmp/discovery | head -1)
if [ -z "$RUN_DIR" ]; then
    echo "❌ No output found"
    exit 1
fi

echo ""
echo "✅ Discovery completed!"
echo ""
echo "📁 Results in: tmp/discovery/$RUN_DIR"
echo ""

# Check for key files
if [ -f "tmp/discovery/$RUN_DIR/report.html" ]; then
    echo "✅ HTML report generated"
    echo "   View: open tmp/discovery/$RUN_DIR/report.html"
else
    echo "⚠️  No HTML report found"
fi

if [ -f "tmp/discovery/$RUN_DIR/bundle.json" ]; then
    echo "✅ Evidence bundle generated"
    SCORE=$(cat tmp/discovery/$RUN_DIR/bundle.json | grep -o '"agentScore":[0-9]*' | cut -d':' -f2)
    echo "   Agent Score: $SCORE/100"
else
    echo "⚠️  No bundle found"
fi

echo ""
echo "🎉 Test complete!"
