import { Quote, Star } from 'lucide-react'
import type { Review } from '../../types'
import { ScoreBadge } from '../ui/Badge'

export function ReviewList({
  reviews,
  rating,
  reviewCount,
}: {
  reviews: Review[]
  rating: number
  reviewCount: number
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <ScoreBadge score={rating} reviews={reviewCount} />
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {[
            { label: 'Location', value: 4.9 },
            { label: 'Cleanliness', value: 5.0 },
            { label: 'Service', value: 4.9 },
            { label: 'Value', value: 4.7 },
          ].map((item) => (
            <div key={item.label} className="text-xs">
              <p className="text-muted">{item.label}</p>
              <p className="mt-0.5 flex items-center gap-1 font-semibold text-ink">
                <Star className="size-3 fill-accent text-accent" aria-hidden="true" />
                {item.value.toFixed(1)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <article key={review.id} className="relative rounded-2xl border border-line bg-white p-5">
            <Quote className="absolute right-5 top-5 size-6 text-line" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
                {review.initials}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{review.name}</p>
                <p className="text-xs text-muted">
                  {review.country} · {review.date}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-0.5" aria-label={`${review.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={
                    index < review.rating ? 'size-3.5 fill-accent text-accent' : 'size-3.5 text-line'
                  }
                  aria-hidden="true"
                />
              ))}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-ink">{review.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{review.body}</p>
            <p className="mt-4 text-[0.65rem] uppercase tracking-[0.12em] text-muted">{review.stayType}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
