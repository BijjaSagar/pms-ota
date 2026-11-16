import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface SectionCardProps {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, description, action, children, className }: SectionCardProps) {
  return (
    <section className={cn('rounded-2xl border border-line bg-white p-5 sm:p-7', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl leading-tight text-ink sm:text-2xl">{title}</h2>
          {description ? <p className="mt-1.5 text-sm text-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}
