import {
  BedDouble,
  CheckCircle2,
  Coffee,
  DoorOpen,
  Maximize,
  ShieldCheck,
  Shirt,
  Sparkles,
  Utensils,
  XCircle,
} from 'lucide-react'
import type { Hotel, Room } from '../../types'
import { cancellationDeadline, formatDate } from '../../utils/date'

interface RoomDetailCardProps {
  hotel: Hotel
  room: Room
  checkIn: string
}

export function RoomDetailCard({ hotel, room, checkIn }: RoomDetailCardProps) {
  const deadline = cancellationDeadline(checkIn, hotel.policies.cancellation)

  const perks = [
    { icon: Utensils, label: '15% off food & beverage during your stay' },
    { icon: Shirt, label: '20% off laundry and pressing services' },
    { icon: Sparkles, label: 'Complimentary spa consultation' },
  ]

  return (
    <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">
            Your room
          </p>
          <h2 className="mt-1 font-display text-2xl leading-tight text-ink">{room.name}</h2>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">{room.description}</p>
        </div>
        <span
          className={
            room.remaining <= 2
              ? 'rounded-full bg-[#fbf3e6] px-3 py-1 text-[0.65rem] font-semibold text-[#8a642c]'
              : 'rounded-full bg-[#e8f2ed] px-3 py-1 text-[0.65rem] font-semibold text-success'
          }
        >
          {room.remaining} {room.remaining === 1 ? 'room' : 'rooms'} left
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <Maximize className="size-3.5" aria-hidden="true" /> {room.size} m²
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BedDouble className="size-3.5" aria-hidden="true" /> {room.bed}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <DoorOpen className="size-3.5" aria-hidden="true" /> Up to {room.maxGuests} guests
        </span>
        {room.breakfast ? (
          <span className="inline-flex items-center gap-1.5">
            <Coffee className="size-3.5" aria-hidden="true" /> Breakfast included
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-[#cfe4db] bg-[#eef6f2] p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-success">
            <ShieldCheck className="size-4" aria-hidden="true" />
            {room.refundable ? 'Free cancellation' : 'Non-refundable rate'}
          </p>
          {room.refundable ? (
            <p className="mt-1.5 text-xs leading-relaxed text-[#2b6353]">
              Free cancellation until{' '}
              <span className="font-semibold">
                {deadline ? formatDate(deadline, 'medium') : 'the policy deadline'}
              </span>
              . {hotel.policies.cancellation}
            </p>
          ) : (
            <p className="mt-1.5 text-xs leading-relaxed text-[#2b6353]">
              This rate cannot be cancelled or refunded after booking. The full amount is due.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-canvas p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
            Property extras
          </p>
          <ul className="mt-2 space-y-1.5">
            {perks.map((perk) => (
              <li key={perk.label} className="flex items-start gap-2 text-xs text-ink">
                <perk.icon className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
                {perk.label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          {hotel.policies.pets.toLowerCase().includes('not') ? (
            <XCircle className="size-3.5 text-muted" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
          )}
          {hotel.policies.pets}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
          {hotel.policies.children}
        </span>
      </div>
    </section>
  )
}
