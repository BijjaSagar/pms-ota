import { cn } from '../../utils/cn'

interface SectionHeadingProps {
  eyebrow?: string
  title: React.ReactNode
  description?: string
  align?: 'left' | 'center'
  className?: string
  action?: React.ReactNode
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  action,
}: SectionHeadingProps) {
  const centered = align === 'center'
  return (
    <div
      className={cn(
        'flex flex-col gap-6 md:flex-row md:items-end md:justify-between',
        centered && 'md:flex-col md:items-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'text-center')}>
        {eyebrow ? (
          <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-accent">{eyebrow}</p>
        ) : null}
        <h2 className="font-display text-3xl leading-[1.1] tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
          {title}
        </h2>
        {description ? (
          <p className={cn('mt-4 text-sm leading-relaxed text-muted sm:text-base', centered && 'mx-auto')}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className={cn(centered && 'w-full text-center')}>{action}</div> : null}
    </div>
  )
}
