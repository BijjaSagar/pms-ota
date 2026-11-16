import { CalendarDays, DoorOpen, MapPin, Users } from 'lucide-react'
import type { Hotel, PriceBreakdown, Room, SearchParams } from '../../types'
import { formatDate, guestsLabel, nightsLabel, nightsBetween } from '../../utils/date'
import { formatCurrency } from '../../utils/pricing'
import { Badge } from '../ui/Badge'

interface BookingSummaryProps {
  hotel: Hotel
  room: Room
  search: SearchParams
  price?: PriceBreakdown
  className?: string
  showTotal?: boolean
}

export function BookingSummary({
  hotel,
  room,
  search,
  price,
  className,
  showTotal = true,
}: BookingSummaryProps) {
  const nights = price?.nights ?? nightsBetween(search.checkIn, search.checkOut)

  return (
    <section className={className} aria-label="Booking summary">
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="relative h-40 overflow-hidden">
          <img src={hotel.images[0]} alt={hotel.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand/70 via-brand/10 to-transparent" />
          <div className="absolute inset-x-4 bottom-3">
            <Badge tone="image-dark">{hotel.propertyType}</Badge>
            <h3 className="mt-1.5 font-display text-2xl text-white">{hotel.name}</h3>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <p className="flex items-center gap-2 text-xs text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {hotel.location.city}, {hotel.location.country}
          </p>

          <div className="rounded-xl bg-canvas p-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-numeric text-sm font-medium text-ink">
                  {formatDate(search.checkIn)} — {formatDate(search.checkOut)}
                </p>
                <p className="mt-0.5 text-xs text-muted">{nightsLabel(nights)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <Users className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="font-numeric text-sm font-medium text-ink">
                  {guestsLabel(search.guests, search.rooms)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <DoorOpen className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-ink">{room.name}</p>
                <p className="font-numeric mt-0.5 text-xs text-muted">{room.bed} · {room.size} m²</p>
              </div>
            </div>
          </div>

          {showTotal ? (
            <div className="flex items-center justify-between border-t border-line pt-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">Total</p>
                <p className="text-xs text-muted">Including taxes & fees</p>
              </div>
              <p className="font-numeric text-xl font-semibold text-ink">
                {price ? formatCurrency(price.total) : '—'}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
