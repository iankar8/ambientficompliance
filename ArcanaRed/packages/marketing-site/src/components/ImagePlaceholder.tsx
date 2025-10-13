'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ImagePlaceholderProps {
  src?: string
  alt: string
  gradient: string
  className?: string
  aspectRatio?: '16/9' | '4/3' | '1/1' | '3/2'
  priority?: boolean
}

export function ImagePlaceholder({
  src,
  alt,
  gradient,
  className,
  aspectRatio = '16/9',
  priority = false,
}: ImagePlaceholderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const aspectRatioClass = {
    '16/9': 'aspect-video',
    '4/3': 'aspect-[4/3]',
    '1/1': 'aspect-square',
    '3/2': 'aspect-[3/2]',
  }[aspectRatio]

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg',
        aspectRatioClass,
        className
      )}
    >
      {/* Gradient background as fallback */}
      <div
        className="absolute inset-0"
        style={{ background: gradient }}
      />

      {/* Loading shimmer effect */}
      {!isLoaded && !hasError && src && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: 'linear',
          }}
        />
      )}

      {/* Actual image (if src provided) */}
      {src && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}

      {/* Placeholder text overlay (optional) */}
      {!src && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/40 text-sm font-medium">{alt}</span>
        </div>
      )}
    </div>
  )
}
