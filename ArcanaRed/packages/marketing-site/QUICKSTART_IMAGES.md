# 🚀 Quick Start: Generate Images in 5 Minutes

## TL;DR

```bash
# 1. Setup (one-time)
./scripts/setup-image-generation.sh

# 2. Generate images
npm run generate-images

# 3. Review & approve
npm run review-images

# Done! Images are in public/images/ as WebP
```

---

## Step-by-Step

### 1️⃣ Get API Key (2 minutes)

**Option A: DALL-E 3** (Best quality)
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy key (starts with `sk-`)

**Option B: Replicate** (Cheaper)
1. Go to https://replicate.com/account/api-tokens
2. Copy token (starts with `r8_`)

### 2️⃣ Configure (30 seconds)

```bash
cd packages/marketing-site

# Run setup script
./scripts/setup-image-generation.sh

# OR manually:
echo "OPENAI_API_KEY=sk-..." > .env.local
```

### 3️⃣ Generate (3 minutes)

```bash
npm run generate-images
```

**What you'll see:**
```
🚀 Starting image generation...
🎨 Generating with DALL-E 3: Hero Background
✅ Downloaded to: public/images/hero-bg.png
...
✅ Generated: 5
```

**Cost:** ~$0.20-0.40 (DALL-E) or ~$0.02 (Replicate)

### 4️⃣ Review (2 minutes per image)

```bash
npm run review-images
```

**Interactive prompts:**
- Image opens automatically
- Press **A** to approve (converts to WebP)
- Press **R** to reject (regenerate later)
- Press **E** to edit prompt & regenerate
- Press **S** to skip

**Output:**
```
✅ Approved: 3
❌ Rejected: 2
🔄 Converting to WebP...
✅ All approved images processed
```

### 5️⃣ Use in Components

```tsx
// Update page.tsx
<OptimizedImage
  src="/images/hero-bg.webp"  // ← Add this line
  alt="Hero"
  gradient={gradients.hero}
  width={1920}
  height={1080}
/>
```

---

## 🎯 What Gets Generated

| Image | Size | Use Case |
|-------|------|----------|
| `hero-bg.webp` | 1920x1080 | Hero section background |
| `workflow-demo.webp` | 1600x900 | Demo section |
| `evidence-bundle.webp` | 1600x900 | Benefits section |
| `dashboard-preview.webp` | 1600x900 | Use cases |
| `process-diagram.webp` | 1200x600 | How It Works |

---

## 💰 Cost Breakdown

**DALL-E 3:**
- 5 images @ $0.04 each = **$0.20**
- High quality, best for UI mockups

**Replicate (Flux):**
- 5 images @ $0.003 each = **$0.015**
- Good quality, very cheap

**Start small:** Generate 1-2 images first to test!

---

## 🔄 Regenerate Rejected Images

```bash
# Check what needs regeneration
cat public/images/regenerate.json

# Edit prompts in scripts/generate-images.ts
# Then regenerate
npm run generate-images

# Review again
npm run review-images
```

---

## 🐛 Troubleshooting

**"API key not found"**
```bash
# Check file exists
ls -la .env.local

# Verify key format
cat .env.local
# Should show: OPENAI_API_KEY=sk-...
```

**"Could not convert to WebP"**
```bash
# Install tools
brew install webp

# OR use online: https://squoosh.app
```

**"Generation failed"**
- Check API credits at platform.openai.com/usage
- Simplify prompt (avoid restricted content)
- Try different provider

---

## 📚 Full Documentation

- **IMAGE_GENERATION_GUIDE.md** - Complete workflow guide
- **IMAGE_PROMPTS.md** - All Midjourney-style prompts  
- **IMAGES_GUIDE.md** - Component usage docs
- **scripts/generate-images.ts** - Generator code
- **scripts/review-images.ts** - Review workflow code

---

## 🎨 Already Have Images?

Skip generation and just add to site:

```bash
# 1. Place image in public/images/
cp ~/Downloads/hero.png public/images/hero-bg.png

# 2. Convert to WebP
cwebp -q 85 public/images/hero-bg.png -o public/images/hero-bg.webp

# 3. Update component
<OptimizedImage src="/images/hero-bg.webp" ... />
```

---

## ✅ Success Checklist

- [ ] API key configured in `.env.local`
- [ ] Ran `npm run generate-images` successfully
- [ ] Reviewed images with `npm run review-images`
- [ ] Approved images converted to WebP
- [ ] Updated components with `src="/images/..."`
- [ ] Tested on localhost:3000
- [ ] Images look good on mobile/desktop
- [ ] Ready to commit & deploy!

---

## 🚀 Next Steps

1. **Commit approved images**
   ```bash
   git add public/images/*.webp
   git commit -m "Add generated marketing images"
   ```

2. **Deploy to Vercel**
   ```bash
   git push
   # Auto-deploys
   ```

3. **Optional: Generate variations**
   - Edit prompts in `scripts/generate-images.ts`
   - Regenerate specific images
   - A/B test different styles

---

**Questions?** Check the full guide: `IMAGE_GENERATION_GUIDE.md`

**Working great with gradients?** No need to generate! Ship with gradients and add images later.
