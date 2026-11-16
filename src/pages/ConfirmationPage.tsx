import {
  ArrowRight,
  CalendarPlus,
  Check,
  Copy,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BookingSummary } from '../components/booking/BookingSummary'
import { EmptyBookingState } from '../components/booking/EmptyBookingState'
import { PriceBreakdown } from '../components/booking/PriceBreakdown'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Stepper } from '../components/ui/Stepper'
import { useBooking } from '../context/useBooking'
import { useTrips } from '../context/useTrips'
import { downloadCalendarFile } from '../utils/calendar'
import { formatDate, guestsLabel, nightsLabel } from '../utils/date'
import { formatCurrency } from '../utils/pricing'

export function ConfirmationPage() {
  const { bookingId } = useParams()
  const { confirmation } = useBooking()
  const { getBooking, addBooking } = useTrips()
  const [copied, setCopied] = useState(false)

  const booking =
    confirmation && confirmation.reference === bookingId
      ? confirmation
      : bookingId
        ? getBooking(bookingId)
        : undefined

  useEffect(() => {
    if (confirmation && !getBooking(confirmation.reference)) {
      addBooking(confirmation)
    }
  }, [confirmation, getBooking, addBooking])

  if (!booking) {
    return (
      <EmptyBookingState
        title="We couldn't find that booking"
        description="The confirmation may have expired from this session. Start a new search and we will take care of the rest."
      />
    )
  }

  const { hotel, room, search, guest, price, reference } = booking

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const directionsUrl = `https://www.openstreetmap.org/?mlat=${hotel.coordinates.lat}&mlon=${hotel.coordinates.lng}#map=16/${hotel.coordinates.lat}/${hotel.coordinates.lng}`

  return (
    <div className="pb-20">
      <section className="border-b border-line bg-white">
        <div className="container-page py-12 text-center lg:py-16">
          <div className="flex justify-center">
            <Stepper steps={['Your stay', 'Guest details', 'Payment', 'Confirmation']} current={3} />
          </div>
          <span className="mx-auto mt-10 flex size-16 animate-scale-in items-center justify-center rounded-full bg-[#e8f2ed] text-success ring-8 ring-[#f3f8f5]">
            <Check className="size-8" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-accent">
            Booking confirmed
          </p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            You're going to {hotel.location.city}.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            A confirmation has been sent to <span className="font-medium text-ink">{booking.email}</span>.
            We cannot wait to hear how it goes.
          </p>

          <div className="mx-auto mt-7 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-dashed border-line bg-canvas px-4 py-2.5">
            <span className="text-[0.65rem] uppercase tracking-[0.16em] text-muted">Reference</span>
            <span className="font-sans text-sm font-semibold tracking-[0.08em] text-ink">{reference}</span>
            <button
              type="button"
              onClick={copyReference}
              className="no-print flex size-7 items-center justify-center rounded-full text-muted transition hover:bg-white hover:text-ink"
              aria-label="Copy booking reference"
            >
              {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            </button>
          </div>

          <div className="no-print mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => downloadCalendarFile(booking)} size="md">
              <CalendarPlus className="size-4" aria-hidden="true" />
              Add to calendar
            </Button>
            <Button variant="secondary" onClick={() => window.print()} size="md">
              <Printer className="size-4" aria-hidden="true" />
              Print confirmation
            </Button>
          </div>
        </div>
      </section>

      <div className="container-page mt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl text-ink">Your stay</h2>
              <div className="mt-4">
                <BookingSummary hotel={hotel} room={room} search={search} showTotal={false} />
              </div>
            </div>

            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl text-ink">Guest details</h2>
                <Badge tone="success">Confirmed</Badge>
              </div>
              <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">Lead guest</dt>
                  <dd className="mt-1 font-medium text-ink">
                    {guest.title} {guest.firstName} {guest.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">Arrival</dt>
                  <dd className="mt-1 font-medium text-ink">{guest.arrivalTime}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">Email</dt>
                  <dd className="mt-1 break-all font-medium text-ink">{guest.email}</dd>
                </div>
                <div>
                  <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">Phone</dt>
                  <dd className="mt-1 font-medium text-ink">{guest.phone || '—'}</dd>
                </div>
                {guest.gstNumber ? (
                  <div className="sm:col-span-2">
                    <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                      GST details
                    </dt>
                    <dd className="mt-1 font-medium text-ink">
                      {guest.gstNumber}
                      {guest.gstBusinessName ? ` · ${guest.gstBusinessName}` : ''}
                    </dd>
                  </div>
                ) : null}
                {(guest.additionalGuests?.length ?? 0) > 0 ? (
                  <div className="sm:col-span-2">
                    <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                      Additional guests
                    </dt>
                    <dd className="mt-1 font-medium text-ink">
                      {(guest.additionalGuests ?? [])
                        .map(
                          (additionalGuest) =>
                            `${additionalGuest.title} ${additionalGuest.firstName} ${additionalGuest.lastName}`,
                        )
                        .join(', ')}
                    </dd>
                  </div>
                ) : null}
                <div className="sm:col-span-2">
                  <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                    Special requests
                  </dt>
                  <dd className="mt-1 leading-relaxed text-muted">
                    {guest.specialRequests || 'No special requests. The property will be in touch if needed.'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <h2 className="font-display text-2xl text-ink">What happens next</h2>
              <ol className="mt-5 space-y-4">
                {[
                  {
                    icon: Mail,
                    title: 'Check your inbox',
                    text: `A full confirmation is on its way to ${booking.email}. If it does not arrive within a few minutes, check spam or contact us.`,
                  },
                  {
                    icon: Sparkles,
                    title: 'The property is expecting you',
                    text: `Check-in is from ${hotel.policies.checkIn}. ${hotel.policies.cancellation}`,
                  },
                  {
                    icon: Phone,
                    title: 'We are here if you need us',
                    text: 'The concierge is available daily, 7:00 AM – 11:00 PM ET, for transfers, tables and anything in between.',
                  },
                ].map((step) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <step.icon className="size-4" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl text-ink">Getting there</h2>
                  <p className="mt-1.5 flex items-start gap-2 text-sm text-muted">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
                    {hotel.address}
                  </p>
                </div>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonStyles('secondary', 'sm')}
                >
                  Get directions
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-xl text-ink">Payment summary</h2>
              <div className="mt-4">
                <PriceBreakdown price={price} />
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-brand p-4 text-white">
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/60">
                    {booking.paymentMode === 'later' ? 'Due at property' : 'Paid today'}
                  </p>
                  <p className="mt-0.5 text-xl font-semibold">{formatCurrency(price.total)}</p>
                </div>
                <ShieldCheck className="size-5 text-white/70" aria-hidden="true" />
              </div>
              <p className="mt-3 text-center text-[0.65rem] text-muted">
                {booking.paymentMode === 'later'
                  ? 'Pay later · settle the balance at the property'
                  : booking.paymentLast4 === 'PayPal'
                    ? 'Paid with PayPal · demo transaction'
                    : `Card ending in ${booking.paymentLast4} · demo transaction`}
              </p>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5">
              <h2 className="font-display text-xl text-ink">At a glance</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Stay</dt>
                  <dd className="text-right font-medium text-ink">{hotel.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Room</dt>
                  <dd className="text-right font-medium text-ink">{room.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Dates</dt>
                  <dd className="text-right font-medium text-ink">
                    {formatDate(search.checkIn, 'short')} — {formatDate(search.checkOut, 'short')}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Length</dt>
                  <dd className="text-right font-medium text-ink">{nightsLabel(price.nights)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Guests</dt>
                  <dd className="text-right font-medium text-ink">
                    {guestsLabel(search.guests, search.rooms)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Check-in</dt>
                  <dd className="text-right font-medium text-ink">{hotel.policies.checkIn}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Check-out</dt>
                  <dd className="text-right font-medium text-ink">{hotel.policies.checkOut}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">Add-ons</dt>
                  <dd className="text-right font-medium text-ink">
                    {(booking.addons?.length ?? 0) > 0
                      ? (booking.addons ?? []).map((addon) => addon.name).join(', ')
                      : 'None'}
                  </dd>
                </div>
                {booking.earlyCheckIn || booking.lateCheckOut ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Travel day</dt>
                    <dd className="text-right font-medium text-ink">
                      {[
                        booking.earlyCheckIn ? 'Early check-in' : '',
                        booking.lateCheckOut ? 'Late check-out' : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </dd>
                  </div>
                ) : null}
                {booking.couponCode ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Coupon</dt>
                    <dd className="text-right font-medium text-success">
                      {booking.couponCode}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="no-print rounded-2xl border border-line bg-white p-5">
              <p className="text-sm font-medium text-ink">Need to make a change?</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Contact the concierge with your reference and we will take care of it.
              </p>
              <a
                href="tel:+18005550182"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-line underline-offset-4 hover:text-accent"
              >
                <Phone className="size-3.5" aria-hidden="true" />
                +1 (800) 555-0182
              </a>
            </div>

            <Link to="/hotels" className={buttonStyles('secondary', 'md', true)}>
              Explore more stays
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
