import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface SectionProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  className?: string
}

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section className={cn('py-20 md:py-32', className)} {...props}>
      <div className="container mx-auto px-6 md:px-8 max-w-7xl">{children}</div>
    </section>
  )
}

export function SectionHeader({
  title,
  subtitle,
  centered = true,
}: {
  title: string
  subtitle?: string
  centered?: boolean
}) {
  return (
    <div className={cn('mb-16', centered && 'text-center')}>
      <h2 className="text-3xl md:text-5xl font-bold mb-4 text-balance">{title}</h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto text-balance">
          {subtitle}
        </p>
      )}
    </div>
  )
}
