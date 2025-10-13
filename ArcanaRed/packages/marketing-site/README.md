# ArcanaRed Marketing Site

Modern landing page for ArcanaRed - AI Adversarial Testing Platform for Financial Workflows.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Deployment:** Vercel

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout with metadata
│   ├── page.tsx         # Landing page
│   └── globals.css      # Global styles
├── components/
│   ├── Button.tsx       # Reusable button component
│   └── Section.tsx      # Section container components
└── lib/
    └── utils.ts         # Utility functions
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Vercel will auto-detect Next.js and deploy

### Environment Variables

No environment variables required for the marketing site.

## Design System

### Colors
- **Primary Red:** `#DC2626`
- **Primary Orange:** `#EA580C`
- **Dark Background:** `#0A0A0A`
- **Darker Background:** `#050505`
- **Gray:** `#1A1A1A`

### Typography
- **Headings:** Inter (Bold, 700)
- **Body:** Inter (Regular, 400)
- **Code:** JetBrains Mono

## Features

- ✅ Responsive design (mobile-first)
- ✅ Dark theme optimized
- ✅ Smooth animations and transitions
- ✅ Accessible (WCAG AA compliant)
- ✅ SEO optimized with metadata
- ✅ Performance optimized (Core Web Vitals)

## Sections

1. **Hero** - Main value proposition with CTAs
2. **Problem** - Three key pain points
3. **Solution** - How It Works (4-step process)
4. **Differentiation** - vs Traditional Pen Testing
5. **Use Cases** - Target workflows
6. **Trust** - Security & compliance
7. **FAQ** - Common questions
8. **Final CTA** - Pilot access request
9. **Footer** - Links and company info

## Future Enhancements

- [ ] Lead capture form with backend integration
- [ ] Demo video embed
- [ ] Blog section
- [ ] Customer testimonials (when available)
- [ ] Pricing page
- [ ] Documentation portal
