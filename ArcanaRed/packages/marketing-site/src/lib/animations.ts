import { Variants } from 'framer-motion'

// Fade animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 },
}

// Scale animations
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

export const scaleBounce: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
}

// Stagger container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

// Hover interactions
export const hoverScale = {
  scale: 1.05,
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

export const hoverGlow = {
  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3)',
  scale: 1.02,
}

export const tapShrink = {
  scale: 0.98,
}

// Transition presets
export const springTransition = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 20,
}

export const smoothTransition = {
  type: 'tween' as const,
  duration: 0.3,
  ease: 'easeOut',
}
