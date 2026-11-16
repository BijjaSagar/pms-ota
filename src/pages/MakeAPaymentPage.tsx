import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Input } from '../components/ui/Field'
import { useTrips } from '../context/useTrips'
import type { Booking } from '../types'
import { formatDate, guestsLabel, nightsLabel } from '../utils/date'
import { formatCurrency } from '../utils/pricing'

function findBooking(bookings: Booking[], value: string) {
  const lower = value.toLowerCase()
  const digits = value.replace(/\D/g, '')

  return bookings.find((booking) => {
    const referenceMatch = booking.reference.toLowerCase() === lower
    const emailMatch =
      booking.email.toLowerCase() === lower || booking.guest.email.toLowerCase() === lower
    const phoneMatch =
      digits.length >= 7 && booking.guest.phone.replace(/\D/g, '').endsWith(digits)

    return referenceMatch || emailMatch || phoneMatch
  })
}

function BookingResult({ booking }: { booking: Booking }) {
  const { hotel, room, search, price, reference, paymentMode } = booking
  const pending = paymentMode === 'later'

  return (
    <section
      className="mt-6 animate-fade-up rounded-2xl border border-line bg-white p-5 sm:p-7"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#e8f2ed] text-success">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-2xl leading-tight text-ink">Booking found</h2>
            <p className="text-xs text-muted">
              Reference <span className="font-medium tracking-[0.08em] text-ink">{reference}</span>
            </p>
          </div>
        </div>
        <Badge tone={pending ? 'accent' : 'success'}>
          {pending ? 'Payment pending' : 'Paid'}
        </Badge>
      </div>

      <div className="mt-5 flex flex-col gap-4 rounded-xl bg-canvas p-4 sm:flex-row sm:items-center">
        <img
          src={hotel.images[0]}
          alt={`${hotel.name} in ${hotel.location.city}`}
          className="h-24 w-full rounded-xl object-cover sm:w-32"
        />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {hotel.location.city}, {hotel.location.country}
          </p>
          <p className="mt-1 font-display text-xl leading-tight text-ink">{hotel.name}</p>
          <p className="mt-1 text-sm text-muted">{room.name}</p>
        </div>
      </div>

      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2.5">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Dates</dt>
            <dd className="font-numeric mt-0.5 font-medium text-ink">
              {formatDate(search.checkIn)} — {formatDate(search.checkOut)}
            </dd>
            <dd className="text-xs text-muted">{nightsLabel(price.nights)}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Users className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Guests</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {guestsLabel(search.guests, search.rooms)}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex flex-col gap-3 rounded-xl bg-brand p-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/60">
            {pending ? 'Amount due' : 'Amount paid'}
          </p>
          <p className="mt-0.5 text-xl font-semibold">{formatCurrency(price.total)}</p>
        </div>
        <Link to={`/confirmation/${reference}`} className={buttonStyles('accent', 'md')}>
          View booking details
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}

export function MakeAPaymentPage() {
  const { bookings } = useTrips()
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<Booking | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = query.trim()

    if (!value) {
      setError('Enter a booking ID, email or mobile number.')
      setResult(null)
      setSearched(false)
      return
    }

    setError('')
    setResult(findBooking(bookings, value) ?? null)
    setSearched(true)
  }

  return (
    <div className="pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent/60" />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-accent">
              Secure payments
            </p>
          </div>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            Make a payment
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
            Find your booking with your booking ID, email address or mobile number, then review the
            amount due.
          </p>
        </div>
      </section>

      <div className="container-page mt-8 lg:mt-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:gap-8">
          <div>
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <CreditCard className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-display text-2xl leading-tight text-ink">Find your booking</h2>
                  <p className="mt-1 text-sm text-muted">
                    We will look up the booking saved in this browser.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate className="mt-6">
                <Input
                  label="Booking ID, email or mobile number"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setError('')
                    setResult(null)
                    setSearched(false)
                  }}
                  error={error}
                  hint="For example AUR-8K2M9Q, alex@example.com or 98765 43210."
                  autoComplete="off"
                  placeholder="Enter booking ID, email or mobile number"
                />
                <Button type="submit" size="lg" fullWidth className="mt-4">
                  <Search className="size-4" aria-hidden="true" />
                  Submit
                </Button>
              </form>
            </section>

            {result ? <BookingResult booking={result} /> : null}

            {searched && !result ? (
              <section
                className="mt-6 animate-fade-up rounded-2xl border border-line bg-white p-6"
                role="alert"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fdf0ee] text-red-600">
                    <AlertCircle className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-2xl leading-tight text-ink">
                      We couldn't find that booking
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      Check the booking ID, email or mobile number and try again. Bookings made in
                      this browser appear in My trips.
                    </p>
                    <Link
                      to="/trips"
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition hover:text-brand"
                    >
                      Go to My trips
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-xl text-ink">Where do I find my booking ID?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Your booking ID is in the confirmation email and on the booking details page. It
                starts with <span className="font-medium text-ink">AUR-</span>.
              </p>
              <Link
                to="/trips"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition hover:text-brand"
              >
                View my trips
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </section>

            <section className="rounded-2xl bg-brand p-5 text-white">
              <span className="flex size-10 items-center justify-center rounded-full bg-white/10">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-display text-xl">Safe and secure</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                <li>256-bit encrypted lookup</li>
                <li>No card details are stored</li>
                <li>Demo environment — no real charge</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
