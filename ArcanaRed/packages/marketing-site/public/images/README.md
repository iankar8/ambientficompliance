# ArcanaRed Marketing Site Images

## Current Status
🟡 **Using gradient placeholders** - Real images pending

## Directory Structure

```
public/images/
├── hero-bg.webp               # Hero background (1920x1080)
├── workflow-demo.webp         # Simulation demo (1600x900)
├── evidence-bundle.webp       # Evidence screenshot (1600x900)
├── process-diagram.svg        # How It Works (1200x600)
├── dashboard-preview.webp     # Dashboard (1600x900)
├── use-cases/
│   ├── p2p-attack.webp
│   ├── account-linking.webp
│   └── takeover.webp
├── trust-badges/
│   ├── staging.svg
│   ├── encryption.svg
│   ├── audit-logs.svg
│   └── kill-switch.svg
└── diagrams/
    ├── before-after.svg
    ├── behavior-analysis.webp
    └── integration.svg
```

## Image Specifications

### Hero Background
- **Size:** 1920x1080px
- **Format:** WebP
- **Usage:** `/src/app/page.tsx` - Hero section background
- **Current:** CSS gradient placeholder

### Workflow Demo
- **Size:** 1600x900px
- **Format:** WebP
- **Usage:** "See AI Agents in Action" section
- **Current:** Split-screen gradient

### Evidence Bundle
- **Size:** 1600x900px
- **Format:** WebP
- **Usage:** Benefits section
- **Current:** Terminal-style gradient

### Process Diagram
- **Size:** 1200x600px
- **Format:** SVG (preferred) or WebP
- **Usage:** "How It Works" section
- **Current:** Grid pattern gradient

### Dashboard Preview
- **Size:** 1600x900px
- **Format:** WebP
- **Usage:** Use Cases section bottom
- **Current:** Radial gradient

## Adding New Images

### 1. Generate Image
Use Midjourney prompts from `/IMAGE_PROMPTS.md`

### 2. Optimize
```bash
# Convert to WebP
cwebp -q 85 input.png -o output.webp

# Or use online tool
# https://squoosh.app
```

### 3. Place in Directory
```bash
cp output.webp public/images/
```

### 4. Update Component
```tsx
<OptimizedImage
  src="/images/your-image.webp"  // Add this line
  alt="Description"
  gradient={gradients.hero}
  width={1600}
  height={900}
/>
```

## Image Optimization Settings

Configured in `next.config.js`:
- **Formats:** WebP, AVIF
- **Sizes:** Responsive breakpoints
- **Cache:** 60 seconds minimum

## Lazy Loading

All images use Next.js lazy loading by default except:
- Hero background (set `priority={true}`)

## Performance Budget

- **Hero:** < 200KB
- **Dashboard/Screenshots:** < 300KB each
- **Diagrams:** < 50KB (SVG preferred)
- **Total page:** < 2MB

## Gradient Fallbacks

Currently using CSS gradients defined in `/src/lib/gradients.ts`:
- `hero` - Neural network feel
- `workflow` - Split screen
- `evidence` - Terminal aesthetic
- `dashboard` - Data visualization
- `process` - Connected flow

These automatically show if:
- No `src` prop provided
- Image fails to load
- Image is still loading

## Quick Commands

```bash
# Create placeholder image (1600x900)
# (Requires ImageMagick)
magick -size 1600x900 gradient:blue-black output.png

# Batch convert to WebP
for file in *.png; do cwebp -q 85 "$file" -o "${file%.png}.webp"; done

# Optimize SVG
npx svgo input.svg -o output.svg
```

## To-Do

- [ ] Generate hero background
- [ ] Create workflow simulation mockup
- [ ] Design evidence bundle UI
- [ ] Illustrate process diagram
- [ ] Build dashboard preview
- [ ] Create use case visuals
- [ ] Design trust badge icons

## Notes

- All images use dark theme (black/navy backgrounds)
- Primary color: #3B82F6 (Blue)
- Accent: #06B6D4 (Cyan)
- Maintain consistent style across all assets
- Use subtle shadows and glows for depth
