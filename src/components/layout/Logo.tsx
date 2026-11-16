import { Link } from 'react-router-dom'
import { cn } from '../../utils/cn'

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link
      to="/"
      className={cn('group inline-flex items-center gap-2.5', className)}
      aria-label="Aurelia home"
    >
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-full transition-transform duration-500 group-hover:rotate-45',
          light ? 'bg-white/10 text-white ring-1 ring-white/25' : 'bg-brand text-white',
        )}
      >
        <svg viewBox="0 0 32 32" className="size-4.5" fill="none" aria-hidden="true">
          <path
            d="M16 3l2.6 10.4L29 16l-10.4 2.6L16 29l-2.6-10.4L3 16l10.4-2.6L16 3z"
            fill="currentColor"
          />
          <circle cx="16" cy="16" r="2" fill="#b98a4b" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-[1.6rem] tracking-tight',
            light ? 'text-white' : 'text-ink',
          )}
        >
          Aurelia
        </span>
        <span
          className={cn(
            'mt-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.34em]',
            light ? 'text-white/60' : 'text-muted',
          )}
        >
          Curated stays
        </span>
      </span>
    </Link>
  )
}
