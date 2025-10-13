# Automated Image Generation + Review Workflow

## 🎯 Overview

This system generates marketing images via AI APIs with a manual review/approval workflow.

**Workflow:**
1. 🤖 Generate images via API
2. 👀 Review each image interactively  
3. ✅ Approve good ones → Auto-convert to WebP
4. ❌ Reject bad ones → Regenerate with optional prompt edits
5. 🚀 Deploy approved images

---

## 🔧 Setup

### 1. Install Dependencies

```bash
cd packages/marketing-site
npm install
```

This adds:
- `tsx` - TypeScript executor
- `node-fetch` - HTTP requests
- Scripts in `package.json`

### 2. Get API Key

**Option A: OpenAI DALL-E 3** (Recommended)
```bash
# 1. Sign up: https://platform.openai.com/signup
# 2. Add payment method
# 3. Create API key: https://platform.openai.com/api-keys
# 4. Copy key
```

**Option B: Replicate** (Cheaper, Flux/SDXL models)
```bash
# 1. Sign up: https://replicate.com/signup
# 2. Get token: https://replicate.com/account/api-tokens
# 3. Copy token
```

### 3. Configure Environment

```bash
# Copy example
cp .env.example .env.local

# Edit and add your key
nano .env.local
```

Add ONE of:
```bash
OPENAI_API_KEY=sk-proj-...
# OR
REPLICATE_API_TOKEN=r8_...
```

### 4. Optional: Install WebP Tools

For automatic WebP conversion:

**macOS:**
```bash
brew install webp
# OR
brew install imagemagick
```

**Linux:**
```bash
apt-get install webp
# OR
apt-get install imagemagick
```

**Windows:**
Download from https://developers.google.com/speed/webp/download

---

## 🚀 Usage

### Step 1: Generate Images

```bash
npm run generate-images
```

**What happens:**
- Reads prompts from `scripts/generate-images.ts`
- Calls API for each image
- Downloads to `public/images/`
- Saves review manifest

**Expected output:**
```
🚀 Starting image generation...
🎨 Generating with DALL-E 3: Hero Background
✅ Downloaded to: public/images/hero-bg.png
------------------------------------------------------------
🎨 Generating with DALL-E 3: Workflow Demo
✅ Downloaded to: public/images/workflow-demo.png
...

📋 Review manifest saved to: public/images/review-manifest.json

✅ Generated: 5
❌ Failed: 0
```

**Cost estimate:**
- DALL-E 3: ~$0.40 for 5 images (1792x1024)
- Replicate: ~$0.05 for 5 images (1600x900)

---

### Step 2: Review Images

```bash
npm run review-images
```

**What happens:**
- Opens each image automatically
- Prompts you to:
  - **[A]pprove** - Converts to WebP, keeps
  - **[R]eject** - Marks for regeneration
  - **[E]dit** - Edit prompt, regenerate
  - **[S]kip** - Same as reject

**Example session:**
```
🔍 Starting image review...

============================================================
📸 Reviewing: Hero Background
📂 Path: public/images/hero-bg.png
============================================================

[Opens image in Preview/default app]

[A]pprove | [R]eject | [E]dit prompt | [S]kip: a
✅ Approved

------------------------------------------------------------

📸 Reviewing: Workflow Demo
📂 Path: public/images/workflow-demo.png
[A]pprove | [R]eject | [E]dit prompt | [S]kip: e
Enter edited prompt: Add more contrast to the split screen
✏️  Will regenerate with edited prompt
```

**Output:**
```
============================================================
📊 REVIEW SUMMARY
============================================================

✅ Approved: 3
❌ Rejected: 2

============================================================
📦 PROCESSING APPROVED IMAGES
============================================================

🔄 Converting to WebP: public/images/hero-bg.png
✅ Converted: public/images/hero-bg.webp

✅ All approved images processed
```

---

### Step 3: Use Approved Images

Update components to use real images:

```tsx
// Before (gradient only)
<OptimizedImage
  alt="Hero Background"
  gradient={gradients.hero}
  width={1920}
  height={1080}
/>

// After (with generated image)
<OptimizedImage
  src="/images/hero-bg.webp"  // ← Add this
  alt="Hero Background"
  gradient={gradients.hero}
  width={1920}
  height={1080}
/>
```

**Gradient stays as fallback** if image fails to load!

---

### Step 4: Regenerate Rejected Images

If you rejected any:

```bash
# Check what needs regeneration
cat public/images/regenerate.json

# Regenerate only rejected ones
npm run generate-images -- --only-rejected
```

Then run `npm run review-images` again.

---

## 📝 Customizing Prompts

### Edit Existing Prompts

Open `scripts/generate-images.ts`:

```ts
const imagePrompts: ImagePrompt[] = [
  {
    id: 'hero-bg',
    name: 'Hero Background',
    prompt: 'YOUR EDITED PROMPT HERE',  // ← Change this
    width: 1920,
    height: 1080,
    outputPath: 'public/images/hero-bg.png',
  },
  // ...
]
```

### Add New Images

```ts
  {
    id: 'new-feature',
    name: 'New Feature Screenshot',
    prompt: 'Modern cybersecurity interface showing...',
    width: 1600,
    height: 900,
    outputPath: 'public/images/new-feature.png',
  },
```

---

## 🎨 Prompt Engineering Tips

### For UI/Dashboard Screenshots
```
"Modern [type] dashboard interface, dark theme, blue accent colors,
[specific elements visible], clean professional UI, detailed"
```

**Good elements to specify:**
- Dark theme / light theme
- Color palette (blue, cyan, orange)
- UI components (graphs, cards, tables)
- Style (minimalist, detailed, isometric)
- Mood (professional, sophisticated, technical)

### For Diagrams
```
"[View type] diagram showing [what], [connections], [background],
[color scheme], [style], professional illustration"
```

**View types:**
- Isometric 3D
- Top-down
- Side view
- Flowchart

### For Backgrounds
```
"Abstract [theme] background, [visual elements], [lighting],
[color palette], [mood], high detail"
```

---

## 🔄 API Options Comparison

| Provider | Model | Quality | Speed | Cost/Image | Best For |
|----------|-------|---------|-------|------------|----------|
| **OpenAI** | DALL-E 3 | ⭐⭐⭐⭐⭐ | Medium | $0.04-0.08 | UI mockups, detailed |
| **Replicate** | Flux Dev | ⭐⭐⭐⭐⭐ | Slow | $0.003 | High quality, cheap |
| **Replicate** | Flux Schnell | ⭐⭐⭐⭐ | Fast | $0.003 | Quick iterations |
| **Replicate** | SDXL | ⭐⭐⭐⭐ | Fast | $0.003 | General purpose |
| **Stability AI** | SDXL | ⭐⭐⭐⭐ | Fast | $0.004 | General purpose |

**Recommendation:** Start with DALL-E 3 for quality, switch to Replicate if cost is concern.

---

## 🐛 Troubleshooting

### "API key not found"
```bash
# Check env file exists
cat .env.local

# Verify key is set
echo $OPENAI_API_KEY

# Reload env
source .env.local
```

### "Could not convert to WebP"
```bash
# Install cwebp
brew install webp

# OR use online tool
# Upload PNG to: https://squoosh.app
# Download WebP
```

### "Image generation failed"
- Check API credit balance
- Verify prompt isn't violating content policy
- Try simpler prompt
- Check API status page

### "Image won't open"
```bash
# macOS - open manually
open public/images/hero-bg.png

# Linux
xdg-open public/images/hero-bg.png

# Or just navigate in Finder/Files
```

---

## 📊 Workflow Tips

### Batch Generate All Images
```bash
# Generate everything at once
npm run generate-images

# Review all at once
npm run review-images
```

### Iterate on Single Image
```bash
# Edit prompt in scripts/generate-images.ts
# Comment out other images:

const imagePrompts: ImagePrompt[] = [
  {
    id: 'hero-bg',
    // ...
  },
  // ... comment out rest
]

# Generate just that one
npm run generate-images
```

### Cost Management
```bash
# Estimate before generating:
# 5 images × $0.04 = $0.20 (DALL-E 3)
# 5 images × $0.003 = $0.015 (Flux)

# Start with 1-2 images to test
# Then batch generate rest
```

---

## 🚀 Production Workflow

1. **Generate locally**
   ```bash
   npm run generate-images
   npm run review-images
   ```

2. **Commit approved WebP images**
   ```bash
   git add public/images/*.webp
   git commit -m "Add marketing images"
   ```

3. **Update components**
   ```bash
   # Add src="/images/..." to OptimizedImage components
   ```

4. **Test locally**
   ```bash
   npm run dev
   # Check http://localhost:3000
   ```

5. **Deploy to Vercel**
   ```bash
   git push
   # Auto-deploys via Vercel
   ```

---

## 📁 File Structure

```
packages/marketing-site/
├── scripts/
│   ├── generate-images.ts     # Generation script
│   └── review-images.ts       # Review script
├── public/images/
│   ├── hero-bg.png            # Generated PNG
│   ├── hero-bg.webp           # Converted WebP
│   ├── review-manifest.json   # Generation log
│   └── regenerate.json        # Rejection list
├── .env.local                 # API keys (gitignored)
├── .env.example               # Example env vars
└── IMAGE_GENERATION_GUIDE.md  # This file
```

---

## 🎯 Next Steps

**After generating images:**
1. ✅ Review and approve
2. ✅ Convert to WebP
3. ✅ Update components with `src` prop
4. ✅ Test on localhost
5. ✅ Commit to git
6. ✅ Deploy to Vercel

**Optional enhancements:**
- Add more image variants
- Batch regenerate with different styles
- A/B test different hero backgrounds
- Generate social media previews
- Create favicon/logo variations

---

## 💡 Pro Tips

1. **Start with gradients** - Site works great without images
2. **Generate in batches** - Review together for consistency
3. **Edit prompts** - Don't settle for first gen
4. **Keep PNGs** - Easier to edit/regenerate later
5. **Version control** - Commit images to git
6. **Optimize file size** - Use WebP, keep under 300KB each

---

Need help? Check:
- `IMAGE_PROMPTS.md` - Pre-written prompts
- `IMAGES_GUIDE.md` - Component usage
- `scripts/generate-images.ts` - Code reference
