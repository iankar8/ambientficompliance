#!/bin/bash
# Test pipeline with debug logs enabled

# Ensure demo bank is running first
# If not running: npm run dev --workspace @arcanared/demo-bank

# Check if ANTHROPIC_API_KEY is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ERROR: ANTHROPIC_API_KEY environment variable not set"
  echo ""
  echo "Set it first:"
  echo "  export ANTHROPIC_API_KEY='your-key-here'"
  echo ""
  exit 1
fi

# Verify demo bank is accessible
echo "Checking demo bank availability..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/login)
if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: Demo bank not running at http://localhost:4000"
  echo ""
  echo "Start it in another terminal:"
  echo "  npm run dev --workspace @arcanared/demo-bank"
  echo ""
  exit 1
fi

echo "✅ Demo bank is running"
echo ""
echo "Starting pipeline with debug logs..."
echo "====================================="
echo ""

# Run pipeline with debug logs
EXPLORER_DEBUG_LOGS=true npm run run:pipeline

echo ""
echo "====================================="
echo "Pipeline execution complete"
echo ""
echo "Look for these SUCCESS indicators in the output above:"
echo "  ✅ 'step 0 tool_choice { type: \"any\" }'"
echo "  ✅ 'resolved tool input' with action details"
echo "  ✅ 'emitting event' type: 'action'"
echo "  ✅ 'CONTINUE: will execute N tools'"
echo "  ✅ Multiple step iterations (0, 1, 2, ...)"
echo "  ✅ trace.events array with 10+ entries"
echo ""
echo "FAILURE indicators:"
echo "  ❌ 'EXIT: stop_reason is not tool_use' on step 0"
echo "  ❌ Only 1 iteration"
echo "  ❌ Empty trace.events array"
