# ArcanaRed Marketing Site - Deployment Guide

## Quick Deploy to Vercel

### Option 1: Vercel Web Interface (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add ArcanaRed marketing site"
   git push
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select `packages/marketing-site` as the root directory
   - Click "Deploy"

3. **Configure Root Directory**
   - Framework Preset: Next.js
   - Root Directory: `packages/marketing-site`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Environment Variables**
   - No environment variables required for the marketing site
   - (If you add Supabase contact forms later, add those keys)

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to marketing site
cd packages/marketing-site

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Custom Domain Setup

### After Initial Deployment

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain (e.g., `arcanared.com`)
4. Follow DNS configuration instructions
5. SSL certificates are auto-provisioned

### Recommended DNS Records

```
A     @     76.76.21.21
CNAME www   cname.vercel-dns.com
```

## Post-Deployment Checklist

- [ ] Test site on mobile devices
- [ ] Verify all CTAs work
- [ ] Check smooth scrolling to sections
- [ ] Test form submissions (when implemented)
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Verify SEO metadata
- [ ] Check social media preview cards

## Performance Optimization

The site is already optimized for performance:

✅ Static generation (no server-side rendering needed)  
✅ Image optimization (when images are added)  
✅ Code splitting  
✅ CSS purging via Tailwind  
✅ Automatic font optimization  

## Monitoring

### Vercel Analytics (Free)

Enable in project settings:
- Web Analytics
- Speed Insights

### Google Analytics (Optional)

Add to `src/app/layout.tsx`:

```tsx
<Script
  src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
  strategy="afterInteractive"
/>
```

## Updating the Site

```bash
# Make changes locally
npm run dev

# Test changes
# Open http://localhost:3000

# Commit and push
git add .
git commit -m "Update landing page copy"
git push

# Vercel auto-deploys on push to main
```

## Rollback

If something breaks:

1. Go to Vercel dashboard
2. Navigate to "Deployments"
3. Find the last working deployment
4. Click "Promote to Production"

## Adding Features

### Contact Form (Next Step)

To add lead capture:

1. Create Supabase table for leads
2. Add form handler in `src/app/api/contact/route.ts`
3. Update Button components to open modal
4. Add form validation

### Demo Video

1. Upload video to Vercel Blob Storage or Cloudflare Stream
2. Add video player component
3. Replace "Watch 2-Minute Demo" button

### Blog Section

1. Use MDX or Contentlayer
2. Create `src/app/blog` directory
3. Add blog post template
4. Link from footer

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

### Styling Issues

```bash
# Regenerate Tailwind
npm run build
```

### Port Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

## Support

- [Next.js Docs](https://nextjs.org/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
