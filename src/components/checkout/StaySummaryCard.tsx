import { Baby, CalendarDays, Clock, MapPin, Star, Users } from 'lucide-react'
import type { Hotel, SearchParams } from '../../types'
import { formatDate, nightsBetween } from '../../utils/date'
import { formatCurrency } from '../../utils/pricing'
import { cn } from '../../utils/cn'

interface StaySummaryCardProps {
  hotel: Hotel
  search: SearchParams
  earlyCheckIn: boolean
  lateCheckOut: boolean
  earlyCheckInPrice: number
  lateCheckOutPrice: number
  onToggleEarlyCheckIn: (value: boolean) => void
  onToggleLateCheckOut: (value: boolean) => void
}

function OptionToggle({
  checked,
  onChange,
  title,
  subtitle,
  price,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  title: string
  subtitle: string
  price: number
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition',
        checked ? 'border-brand bg-brand-soft/60 ring-1 ring-brand/15' : 'border-line bg-white hover:border-ink/20',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-line accent-brand"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-ink">{title}</span>
          <span className="font-numeric shrink-0 text-xs font-semibold text-ink">
            +{formatCurrency(price)}
          </span>
        </span>
        <span className="mt-0.5 block text-xs text-muted">{subtitle}</span>
      </span>
    </label>
  )
}

export function StaySummaryCard({
  hotel,
  search,
  earlyCheckIn,
  lateCheckOut,
  earlyCheckInPrice,
  lateCheckOutPrice,
  onToggleEarlyCheckIn,
  onToggleLateCheckOut,
}: StaySummaryCardProps) {
  const nights = nightsBetween(search.checkIn, search.checkOut)

  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl leading-tight text-ink">{hotel.name}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f7efe2] px-2.5 py-1 text-[0.65rem] font-semibold text-[#8a642c]">
              <Star className="size-3 fill-accent text-accent" aria-hidden="true" />
              {hotel.rating.toFixed(1)}
            </span>
          </div>
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-muted">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
            {hotel.address}
          </p>
        </div>
        <span className="rounded-full border border-line px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted">
          {hotel.propertyType}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl bg-canvas p-3.5">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Check-in</p>
            <p className="font-numeric mt-0.5 text-sm font-medium text-ink">
              {formatDate(search.checkIn, 'short')}
            </p>
            <p className="text-xs text-muted">{hotel.policies.checkIn}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-canvas p-3.5">
          <CalendarDays className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Check-out</p>
            <p className="font-numeric mt-0.5 text-sm font-medium text-ink">
              {formatDate(search.checkOut, 'short')}
            </p>
            <p className="text-xs text-muted">{hotel.policies.checkOut}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-canvas p-3.5">
          <Users className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Guests</p>
            <p className="font-numeric mt-0.5 text-sm font-medium text-ink">
              {search.adults} {search.adults === 1 ? 'adult' : 'adults'}
            </p>
            <p className="text-xs text-muted">
              {search.rooms} {search.rooms === 1 ? 'room' : 'rooms'} · {nights}{' '}
              {nights === 1 ? 'night' : 'nights'}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-canvas p-3.5">
          <Baby className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-muted">Children</p>
            <p className="font-numeric mt-0.5 text-sm font-medium text-ink">
              {search.kids} {search.kids === 1 ? 'child' : 'children'}
            </p>
            <p className="text-xs text-muted">
              {search.kids > 0 ? 'Cots and extra beds on request' : 'No children on this stay'}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-line pt-5">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-accent" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">Make the most of your travel day</h3>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <OptionToggle
            checked={earlyCheckIn}
            onChange={onToggleEarlyCheckIn}
            title="Early check-in"
            subtitle="From 11:00 AM, subject to availability"
            price={earlyCheckInPrice}
          />
          <OptionToggle
            checked={lateCheckOut}
            onChange={onToggleLateCheckOut}
            title="Late check-out"
            subtitle="Keep your room until 2:00 PM"
            price={lateCheckOutPrice}
          />
        </div>
      </div>
    </section>
  )
}
