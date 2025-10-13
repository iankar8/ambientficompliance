// CSS gradient backgrounds as placeholders for images

export const gradients = {
  // Hero background - Neural network feel
  hero: `
    radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 40%),
    linear-gradient(180deg, #000000 0%, #0a0a0a 100%)
  `,

  // Workflow simulation - Split screen effect
  workflow: `
    linear-gradient(90deg, 
      rgba(59, 130, 246, 0.1) 0%, 
      transparent 50%, 
      rgba(6, 182, 212, 0.1) 100%
    ),
    linear-gradient(180deg, #0a0a0a 0%, #000000 100%)
  `,

  // Evidence bundle - Terminal/code aesthetic
  evidence: `
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(59, 130, 246, 0.03) 2px,
      rgba(59, 130, 246, 0.03) 4px
    ),
    linear-gradient(135deg, #0a0a0a 0%, #000000 100%)
  `,

  // Dashboard - Data visualization feel
  dashboard: `
    radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)
  `,

  // Process diagram - Connected flow
  process: `
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(59, 130, 246, 0.03) 10px,
      rgba(59, 130, 246, 0.03) 20px
    ),
    linear-gradient(135deg, #0a0a0a 0%, #000000 100%)
  `,

  // Use case cards - Individual highlights
  useCase1: `
    radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.2) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0a 0%, #000000 100%)
  `,

  useCase2: `
    radial-gradient(circle at 100% 0%, rgba(6, 182, 212, 0.2) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0a 0%, #000000 100%)
  `,

  useCase3: `
    radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
    linear-gradient(180deg, #0a0a0a 0%, #000000 100%)
  `,

  // Comparison - Before/After split
  comparison: `
    linear-gradient(90deg, 
      rgba(239, 68, 68, 0.1) 0%, 
      rgba(239, 68, 68, 0.1) 48%, 
      transparent 48%,
      transparent 52%,
      rgba(34, 197, 94, 0.1) 52%,
      rgba(34, 197, 94, 0.1) 100%
    ),
    linear-gradient(180deg, #000000 0%, #0a0a0a 100%)
  `,

  // Behavior analysis - Scientific data
  analysis: `
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(59, 130, 246, 0.05) 50px,
      rgba(59, 130, 246, 0.05) 51px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 50px,
      rgba(59, 130, 246, 0.05) 50px,
      rgba(59, 130, 246, 0.05) 51px
    ),
    linear-gradient(180deg, #000000 0%, #0a0a0a 100%)
  `,

  // Mesh/Grid pattern
  mesh: `
    repeating-linear-gradient(
      0deg,
      rgba(59, 130, 246, 0.05) 0px,
      transparent 1px,
      transparent 40px,
      rgba(59, 130, 246, 0.05) 41px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(59, 130, 246, 0.05) 0px,
      transparent 1px,
      transparent 40px,
      rgba(59, 130, 246, 0.05) 41px
    ),
    linear-gradient(180deg, #000000 0%, #0a0a0a 100%)
  `,
}

// Animated gradient for hero (optional - more dynamic)
export const animatedHeroGradient = `
  radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
    rgba(59, 130, 246, 0.2) 0%, 
    transparent 50%
  ),
  radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
  linear-gradient(180deg, #000000 0%, #0a0a0a 100%)
`
