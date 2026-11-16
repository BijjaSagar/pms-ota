import { Star } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: 'neutral' | 'success' | 'accent' | 'dark' | 'image' | 'image-dark'
  className?: string
}) {
  const tones = {
    neutral: 'bg-canvas text-ink border-line',
    success: 'bg-[#e8f2ed] text-success border-[#cfe4db]',
    accent: 'bg-[#f7efe2] text-[#8a642c] border-[#ecd9ba]',
    dark: 'bg-brand text-white border-brand',
    image: 'border-white/50 bg-white/90 text-ink backdrop-blur',
    'image-dark': 'border-white/25 bg-white/15 text-white backdrop-blur',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em]',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Stars({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${count} star hotel`}>
      {Array.from({ length: count }).map((_, index) => (
        <Star key={index} className="size-3.5 fill-accent text-accent" aria-hidden="true" />
      ))}
    </span>
  )
}

export function ScoreBadge({
  score,
  reviews,
  compact = false,
}: {
  score: number
  reviews?: number
  compact?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">
        {score.toFixed(1)}
      </span>
      <div className={cn('leading-tight', compact && 'hidden sm:block')}>
        <p className="text-sm font-semibold text-ink">{score >= 4.8 ? 'Exceptional' : 'Excellent'}</p>
        {reviews ? <p className="text-xs text-muted">{reviews} reviews</p> : null}
      </div>
    </div>
  )
}
