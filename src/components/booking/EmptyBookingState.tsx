import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonStyles } from '../ui/buttonStyles'

export function EmptyBookingState({
  title = 'Your stay is waiting to be chosen',
  description = 'Choose a hotel and a room first, and we will keep everything ready for you here.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-20">
      <div className="max-w-md rounded-2xl border border-line bg-white px-8 py-12 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Compass className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-7 flex flex-col gap-3">
          <Link to="/hotels" className={buttonStyles('primary', 'md', true)}>
            Explore stays
          </Link>
          <Link
            to="/"
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
