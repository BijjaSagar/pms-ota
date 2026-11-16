import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  Clock3,
  DoorOpen,
  MapPin,
  XCircle,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Modal } from '../components/ui/Modal'
import { useTrips } from '../context/useTrips'
import type { Booking } from '../types'
import { downloadCalendarFile } from '../utils/calendar'
import { cn } from '../utils/cn'
import { formatDate, guestsLabel, nightsLabel, todayISO } from '../utils/date'
import { formatCurrency } from '../utils/pricing'

type TripFilter = 'upcoming' | 'past' | 'all'

const filters: { id: TripFilter; label: string }[] = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
]

function isUpcoming(booking: Booking) {
  return booking.search.checkOut >= todayISO()
}

function TripCard({
  booking,
  onCancel,
}: {
  booking: Booking
  onCancel: (booking: Booking) => void
}) {
  const { hotel, room, search, price, reference, paymentMode } = booking
  const upcoming = isUpcoming(booking)

  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-white transition-all duration-500 hover:border-ink/10 hover:shadow-[0_28px_60px_-35px_rgba(14,43,59,0.35)]">
      <div className="flex flex-col sm:flex-row">
        <Link
          to={`/hotels/${hotel.slug}`}
          className="relative block aspect-[4/3] overflow-hidden bg-brand-soft sm:aspect-auto sm:w-60 sm:shrink-0"
          aria-label={`View ${hotel.name}`}
        >
          <img
            src={hotel.images[0]}
            alt={`${hotel.name} in ${hotel.location.city}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand/40 to-transparent sm:hidden" />
          <div className="absolute left-3 top-3">
            <Badge tone={upcoming ? 'success' : 'neutral'}>{upcoming ? 'Upcoming' : 'Past'}</Badge>
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                {hotel.location.city}, {hotel.location.country}
              </p>
              <Link to={`/hotels/${hotel.slug}`}>
                <h2 className="mt-1 font-display text-2xl leading-tight tracking-tight text-ink transition-colors group-hover:text-brand">
                  {hotel.name}
                </h2>
              </Link>
              <p className="mt-1 text-xs text-muted">
                Reference{' '}
                <span className="font-medium tracking-[0.08em] text-ink">{reference}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="font-numeric text-xl font-semibold text-ink">
                {formatCurrency(price.total)}
              </p>
              <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                {paymentMode === 'later' ? 'Pay at property' : 'Paid'}
              </p>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 rounded-xl bg-canvas p-4 text-sm sm:grid-cols-2">
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
            <div className="flex items-start gap-2.5">
              <DoorOpen className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Room</dt>
                <dd className="mt-0.5 font-medium text-ink">{room.name}</dd>
                <dd className="text-xs text-muted">
                  {room.bed} · {room.size} m²
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Clock3 className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <dt className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">
                  Check-in / out
                </dt>
                <dd className="mt-0.5 font-medium text-ink">{hotel.policies.checkIn}</dd>
                <dd className="text-xs text-muted">{hotel.policies.checkOut}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
            <Link to={`/confirmation/${reference}`} className={buttonStyles('primary', 'sm')}>
              View details
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={() => downloadCalendarFile(booking)}
              className={buttonStyles('secondary', 'sm')}
            >
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add to calendar
            </button>
            <Link
              to={`/hotels/${hotel.slug}`}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              Book again
            </Link>
            {upcoming ? (
              <button
                type="button"
                onClick={() => onCancel(booking)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 transition-colors hover:text-red-700"
              >
                <XCircle className="size-4" aria-hidden="true" />
                Cancel booking
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}

export function MyTripsPage() {
  const { bookings, cancelBooking } = useTrips()
  const [filter, setFilter] = useState<TripFilter>(() =>
    bookings.length > 0 && !bookings.some(isUpcoming) ? 'all' : 'upcoming',
  )
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null)

  const confirmCancellation = () => {
    if (!bookingToCancel) return
    cancelBooking(bookingToCancel.reference)
    setBookingToCancel(null)
  }

  const counts: Record<TripFilter, number> = {
    upcoming: bookings.filter(isUpcoming).length,
    past: bookings.filter((booking) => !isUpcoming(booking)).length,
    all: bookings.length,
  }

  const visible = bookings
    .filter((booking) => {
      if (filter === 'upcoming') return isUpcoming(booking)
      if (filter === 'past') return !isUpcoming(booking)
      return true
    })
    .sort((a, b) => {
      if (filter === 'all') return b.createdAt.localeCompare(a.createdAt)
      if (filter === 'past') return b.search.checkOut.localeCompare(a.search.checkOut)
      return a.search.checkIn.localeCompare(b.search.checkIn)
    })

  return (
    <div className="pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-page py-12 lg:py-16">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-accent/60" />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-accent">
              Your journeys
            </p>
          </div>
          <h1 className="mt-4 font-display text-4xl tracking-tight text-ink sm:text-5xl">
            My trips
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted sm:text-base">
            Every stay you have booked, all in one place. Revisit the details, add a trip to your
            calendar or start planning the next one.
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted">
            {counts.all === 0
              ? 'No trips booked yet'
              : `${counts.all} ${counts.all === 1 ? 'trip' : 'trips'} booked`}
          </p>
        </div>
      </section>

      <div className="container-page mt-8 lg:mt-10">
        {bookings.length > 0 ? (
          <>
            <div
              role="tablist"
              aria-label="Filter trips"
              className="inline-flex rounded-full border border-line bg-white p-1"
            >
              {filters.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filter === id}
                  onClick={() => setFilter(id)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                    filter === id
                      ? 'bg-brand text-white'
                      : 'text-muted hover:text-ink',
                  )}
                >
                  {label}
                  <span
                    className={cn(
                      'ml-1.5 text-xs',
                      filter === id ? 'text-white/60' : 'text-muted/70',
                    )}
                  >
                    {counts[id]}
                  </span>
                </button>
              ))}
            </div>

            {visible.length > 0 ? (
              <div className="mt-6 space-y-4">
                {visible.map((booking, index) => (
                  <div
                    key={booking.reference}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <TripCard booking={booking} onCancel={setBookingToCancel} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-line bg-white px-6 py-14 text-center">
                <p className="font-display text-2xl text-ink">
                  No {filter === 'past' ? 'past' : 'upcoming'} trips
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                  {filter === 'past'
                    ? 'Once a stay is complete it will move here so you can look back on it.'
                    : 'Your upcoming journeys will appear here as soon as you book a stay.'}
                </p>
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={buttonStyles('secondary', 'md') + ' mt-6'}
                >
                  Show all trips
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-white px-8 py-8 text-center sm:py-10">
            <div className="mx-auto flex max-w-[16rem] justify-center py-8">
              <img
                src="/hotel-staff.svg"
                alt="Hotel staff welcoming a guest"
                className="h-auto w-full object-contain"
              />
            </div>
            <h2 className="mt-2 font-display text-3xl text-ink">No stays booked yet</h2>
            <div className="mx-auto mt-7 flex flex-col gap-3">
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
        )}
      </div>

      <Modal
        open={bookingToCancel !== null}
        onClose={() => setBookingToCancel(null)}
        title="Cancel booking?"
        description={
          bookingToCancel
            ? `Are you sure you want to cancel your stay at ${bookingToCancel.hotel.name}? This action cannot be undone.`
            : undefined
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => setBookingToCancel(null)}
            className="inline-flex items-center justify-center rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-muted transition hover:border-ink/20 hover:text-ink"
          >
            Keep booking
          </button>
          <button
            type="button"
            onClick={confirmCancellation}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Cancel booking
          </button>
        </div>
      </Modal>
    </div>
  )
}
