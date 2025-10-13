#!/bin/bash

# Quick setup script for image generation

set -e

echo "🎨 ArcanaRed Image Generation Setup"
echo "===================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this from packages/marketing-site/"
    exit 1
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local"
    echo ""
    echo "⚠️  ACTION REQUIRED:"
    echo "   Edit .env.local and add your API key:"
    echo "   nano .env.local"
    echo ""
    read -p "Press Enter after adding your API key..."
fi

# Check for API key
if ! grep -q "^OPENAI_API_KEY=sk-" .env.local && ! grep -q "^REPLICATE_API_TOKEN=r8_" .env.local; then
    echo "⚠️  Warning: No API key found in .env.local"
    echo ""
    echo "Choose a provider:"
    echo "1. OpenAI DALL-E 3 (Best quality, $0.04/image)"
    echo "2. Replicate Flux (Good quality, $0.003/image)"
    echo ""
    read -p "Which provider? [1/2]: " choice
    
    if [ "$choice" == "1" ]; then
        echo ""
        echo "Get your OpenAI API key:"
        echo "1. Go to: https://platform.openai.com/api-keys"
        echo "2. Click 'Create new secret key'"
        echo "3. Copy the key (starts with sk-)"
        echo ""
        read -p "Paste your API key: " api_key
        echo "OPENAI_API_KEY=$api_key" >> .env.local
        echo "✅ API key saved"
    elif [ "$choice" == "2" ]; then
        echo ""
        echo "Get your Replicate token:"
        echo "1. Go to: https://replicate.com/account/api-tokens"
        echo "2. Copy the token (starts with r8_)"
        echo ""
        read -p "Paste your token: " api_token
        echo "REPLICATE_API_TOKEN=$api_token" >> .env.local
        echo "✅ Token saved"
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. npm run generate-images  # Generate all images"
echo "2. npm run review-images    # Review and approve"
echo "3. Update components with generated images"
echo ""
echo "Full guide: IMAGE_GENERATION_GUIDE.md"
