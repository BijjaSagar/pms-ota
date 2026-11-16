import { BedDouble, Check, Coffee, Maximize, Users } from 'lucide-react'
import type { Room } from '../../types'
import { cn } from '../../utils/cn'
import { formatCurrency } from '../../utils/pricing'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface RoomCardProps {
  room: Room
  nights: number
  selected: boolean
  onSelect: (room: Room) => void
}

export function RoomCard({ room, nights, selected, onSelect }: RoomCardProps) {
  const total = room.pricePerNight * nights

  return (
    <article
      className={cn(
        'grid overflow-hidden rounded-2xl border bg-white transition-all duration-300 md:grid-cols-[220px_1fr]',
        selected ? 'border-brand shadow-[0_20px_45px_-30px_rgba(14,43,59,0.5)] ring-1 ring-brand/20' : 'border-line hover:border-ink/15',
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft md:aspect-auto">
        <img
          src={room.image}
          alt={room.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        {room.remaining <= 2 ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#8a642c] backdrop-blur">
            Only {room.remaining} left
          </span>
        ) : null}
      </div>

      <div className="flex flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h4 className="font-display text-xl leading-tight text-ink">{room.name}</h4>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">{room.description}</p>
          </div>
          {selected ? (
            <Badge tone="success" className="shrink-0">
              <Check className="size-3" aria-hidden="true" /> Selected
            </Badge>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Maximize className="size-3.5" aria-hidden="true" /> {room.size} m²
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BedDouble className="size-3.5" aria-hidden="true" /> {room.bed}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" /> Up to {room.maxGuests} guests
          </span>
          {room.breakfast ? (
            <span className="inline-flex items-center gap-1.5">
              <Coffee className="size-3.5" aria-hidden="true" /> Breakfast included
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {room.amenities.slice(0, 4).map((amenity) => (
            <span key={amenity} className="rounded-full bg-canvas px-2.5 py-1 text-[0.65rem] text-muted">
              {amenity}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-line/80 pt-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-baseline gap-1.5">
              <span className="font-numeric text-lg font-semibold text-ink">{formatCurrency(room.pricePerNight)}</span>
              <span className="text-xs text-muted">/ night</span>
            </p>
            <p className="font-numeric text-xs text-muted">
              {formatCurrency(total)} total for {nights} {nights === 1 ? 'night' : 'nights'}
            </p>
            <p className={cn('mt-1 text-[0.65rem] font-medium', room.refundable ? 'text-success' : 'text-muted')}>
              {room.refundable ? 'Free cancellation available' : 'Non-refundable rate'}
            </p>
          </div>
          <Button
            variant={selected ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => onSelect(room)}
            className="shrink-0"
          >
            {selected ? 'Room selected' : 'Select room'}
          </Button>
        </div>
      </div>
    </article>
  )
}
