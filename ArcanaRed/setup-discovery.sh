#!/bin/bash

echo "🚀 Setting up ArcanaRed Discovery Agent..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build all packages
echo "🔨 Building packages..."
npm run build

# Create output directory
mkdir -p tmp/discovery

echo "✅ Setup complete!"
echo ""
echo "To run discovery:"
echo "  export ANTHROPIC_API_KEY=your_key"
echo "  npm run discovery:run"
echo ""
echo "Or with custom target:"
echo "  TARGET_URL=https://staging.example.com \\"
echo "  WORKFLOW_TYPE=zelle_send \\"
echo "  USERNAME=testuser \\"
echo "  PASSWORD=testpass \\"
echo "  npm run discovery:run"
