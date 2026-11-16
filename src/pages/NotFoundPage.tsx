import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buttonStyles } from '../components/ui/buttonStyles'

export function NotFoundPage() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-20">
      <div className="max-w-md text-center">
        <p className="font-numeric text-[6rem] leading-none text-line">404</p>
        <h1 className="mt-2 font-display text-3xl text-ink">This page has checked out</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The page you are looking for has moved on. The good news: there are plenty of beautiful
          stays still waiting.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to="/hotels" className={buttonStyles('primary', 'md')}>
            Explore stays
          </Link>
          <Link to="/" className={buttonStyles('secondary', 'md')}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back home
          </Link>
        </div>
      </div>
    </div>
  )
}
