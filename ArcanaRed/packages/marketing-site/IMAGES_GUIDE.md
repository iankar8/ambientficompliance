# Image System Guide

## Overview

The marketing site uses a custom image system with:
- ✅ **Next.js Image optimization** (automatic WebP/AVIF)
- ✅ **Gradient placeholders** (beautiful fallbacks)
- ✅ **Lazy loading** (performance)
- ✅ **Loading states** (shimmer effect)
- ✅ **Error handling** (graceful degradation)

---

## Components

### `OptimizedImage`
Full-featured component with Next.js optimization

```tsx
import { OptimizedImage } from '@/components/OptimizedImage'
import { gradients } from '@/lib/gradients'

<OptimizedImage
  src="/images/dashboard.webp"      // Optional - shows gradient if missing
  alt="Dashboard Preview"
  gradient={gradients.dashboard}     // Fallback gradient
  width={1600}
  height={900}
  className="shadow-2xl"
  priority={false}                   // Set true for above-fold images
  sizes="(max-width: 768px) 100vw, 1600px"
/>
```

### `ImagePlaceholder`
Simpler component without Next.js (for non-critical images)

```tsx
import { ImagePlaceholder } from '@/components/ImagePlaceholder'

<ImagePlaceholder
  src="/images/icon.webp"
  alt="Feature Icon"
  gradient={gradients.useCase1}
  aspectRatio="1/1"
  className="rounded-full"
/>
```

---

## Available Gradients

Import from `/src/lib/gradients.ts`:

```tsx
import { gradients } from '@/lib/gradients'
```

### Gradient Options:
- `gradients.hero` - Neural network (radial blue/cyan)
- `gradients.workflow` - Split screen (left-to-right)
- `gradients.evidence` - Terminal lines (horizontal stripes)
- `gradients.dashboard` - Data viz (radial from top)
- `gradients.process` - Connected flow (diagonal pattern)
- `gradients.useCase1` - Blue accent (top-left radial)
- `gradients.useCase2` - Cyan accent (top-right radial)
- `gradients.useCase3` - Centered (top-center radial)
- `gradients.comparison` - Before/After (red-green split)
- `gradients.analysis` - Scientific grid (perpendicular lines)
- `gradients.mesh` - Tech grid (40px squares)

---

## Usage Examples

### Hero Background
```tsx
<section className="relative">
  <div 
    className="absolute inset-0 opacity-50"
    style={{ background: gradients.hero }}
  />
  <div className="relative z-10">
    {/* Content */}
  </div>
</section>
```

### Full-Width Image
```tsx
<OptimizedImage
  alt="Demo Screenshot"
  gradient={gradients.workflow}
  width={1600}
  height={900}
  className="w-full shadow-2xl"
/>
```

### Icon/Avatar
```tsx
<ImagePlaceholder
  alt="Feature"
  gradient={gradients.useCase1}
  aspectRatio="1/1"
  className="w-16 h-16 rounded-lg"
/>
```

### Grid of Images
```tsx
<div className="grid md:grid-cols-3 gap-6">
  {[1, 2, 3].map((i) => (
    <OptimizedImage
      key={i}
      alt={`Use Case ${i}`}
      gradient={gradients[`useCase${i}`]}
      width={800}
      height={600}
    />
  ))}
</div>
```

---

## Adding Real Images

### Step 1: Generate
Use Midjourney prompts from `IMAGE_PROMPTS.md`

### Step 2: Optimize
```bash
# Convert PNG to WebP
cwebp -q 85 input.png -o output.webp

# Or use Squoosh.app
```

### Step 3: Place File
```bash
cp output.webp public/images/
```

### Step 4: Update Component
```tsx
// Before (gradient only)
<OptimizedImage
  alt="Dashboard"
  gradient={gradients.dashboard}
  width={1600}
  height={900}
/>

// After (with real image)
<OptimizedImage
  src="/images/dashboard.webp"  // ← Add this
  alt="Dashboard"
  gradient={gradients.dashboard}
  width={1600}
  height={900}
/>
```

The gradient stays as a fallback if the image fails to load!

---

## Performance Tips

### 1. Use Priority for Above-Fold Images
```tsx
<OptimizedImage
  priority={true}  // ← Loads immediately
  src="/images/hero-bg.webp"
  alt="Hero"
  gradient={gradients.hero}
/>
```

### 2. Lazy Load Everything Else
```tsx
<OptimizedImage
  priority={false}  // ← Default, lazy loads
  src="/images/screenshot.webp"
  alt="Screenshot"
/>
```

### 3. Set Sizes for Responsive
```tsx
<OptimizedImage
  sizes="(max-width: 768px) 100vw, 50vw"
  // Tells Next.js: mobile = full width, desktop = half width
/>
```

### 4. Keep File Sizes Small
- Hero: < 200KB
- Screenshots: < 300KB
- Icons: < 50KB

---

## Animation Integration

Combine with Framer Motion:

```tsx
import { FadeIn } from '@/components/animations/FadeIn'

<FadeIn delay={0.3}>
  <OptimizedImage
    alt="Demo"
    gradient={gradients.workflow}
    width={1600}
    height={900}
  />
</FadeIn>
```

Or with motion directly:

```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.5 }}
>
  <OptimizedImage {...props} />
</motion.div>
```

---

## Custom Gradients

Create your own in `/src/lib/gradients.ts`:

```ts
export const gradients = {
  // ... existing gradients
  
  custom: `
    radial-gradient(circle at 50% 50%, 
      rgba(59, 130, 246, 0.2) 0%, 
      transparent 50%
    ),
    linear-gradient(180deg, #000000 0%, #0a0a0a 100%)
  `,
}
```

Use it:
```tsx
<OptimizedImage gradient={gradients.custom} {...props} />
```

---

## Troubleshooting

### Image not loading?
1. Check file path: `/public/images/` → `src="/images/"`
2. Check file extension: `.webp` or `.png`
3. Verify file exists: `ls public/images/`

### Gradient not showing?
1. Import: `import { gradients } from '@/lib/gradients'`
2. Use correct key: `gradient={gradients.hero}`
3. Check console for errors

### Performance issues?
1. Use WebP format (smaller files)
2. Set appropriate `width` and `height`
3. Use `priority={true}` sparingly
4. Check Lighthouse score

---

## Current Status

✅ Gradient system implemented  
✅ Image components created  
✅ Framer Motion integrated  
✅ Loading states working  
🟡 Real images pending  

**Next Steps:**
1. Generate images using Midjourney prompts
2. Optimize to WebP
3. Add `src` props to components
4. Test on mobile/desktop
5. Run Lighthouse audit

---

## Questions?

Check these files:
- `/src/components/OptimizedImage.tsx` - Component implementation
- `/src/lib/gradients.ts` - Gradient definitions
- `/IMAGE_PROMPTS.md` - Midjourney prompts
- `/public/images/README.md` - Asset management
