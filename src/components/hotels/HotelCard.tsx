import { CircleDollarSign, Clock3, Clock9, Heart, Image, MapPin, Video } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useAuthModal } from '../../context/useAuthModal'
import { useWishlist } from '../../context/useWishlist'
import type { Hotel } from '../../types'
import { cn } from '../../utils/cn'
import { formatCurrency } from '../../utils/pricing'
import { Badge, Stars } from '../ui/Badge'

function getBookingHighlights(hotel: Hotel) {
  const hotelNumber = Number(hotel.id.replace('hotel-', ''))

  switch (hotelNumber % 3) {
    case 1:
      return [{ label: 'Guaranteed early check-in', Icon: Clock3 }]
    case 2:
      return [{ label: 'Guaranteed late checkout', Icon: Clock9 }]
    default:
      return [
        { label: 'Book with $0 payment', Icon: CircleDollarSign },
        { label: 'Guaranteed early check-in', Icon: Clock3 },
      ]
  }
}

function getCardPrice(hotel: Hotel) {
  const originalPrice = Math.ceil((hotel.pricePerNight * 1.1) / 5) * 5
  const taxesAndFees = Math.round(hotel.pricePerNight * 0.05)

  return { originalPrice, taxesAndFees }
}

export function HotelCard({
  hotel,
  className,
  style,
}: {
  hotel: Hotel
  className?: string
  style?: CSSProperties
}) {
  const { isSaved, toggleWishlist } = useWishlist()
  const { isSignedIn, openAuth } = useAuthModal()
  const saved = isSaved(hotel.id)

  const guardTo = (_path: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (isSignedIn) return
    event.preventDefault()
    openAuth()
  }

  return (
    <article
      style={style}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-all duration-500 hover:-translate-y-1 hover:border-ink/10 hover:shadow-[0_28px_60px_-35px_rgba(14,43,59,0.35)]',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-soft">
        <Link to={`/hotels/${hotel.slug}`} onClick={guardTo(`/hotels/${hotel.slug}`)} aria-label={`View ${hotel.name}`}>
          <img
            src={hotel.images[0]}
            alt={`${hotel.name} in ${hotel.location.city}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <Badge tone="image">{hotel.propertyType}</Badge>
          <button
            type="button"
            onClick={() => (isSignedIn ? toggleWishlist(hotel.id) : openAuth())}
            aria-pressed={saved}
            aria-label={saved ? `Remove ${hotel.name} from saved stays` : `Save ${hotel.name}`}
            className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:bg-white"
          >
            <Heart className={cn('size-4', saved && 'fill-accent text-accent')} />
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex justify-end p-3">
          <Link
            to={`/hotels/${hotel.slug}/photos`}
            onClick={(event) => {
              event.stopPropagation()
              if (!isSignedIn) {
                event.preventDefault()
                openAuth()
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/80"
            aria-label={`View photos and videos for ${hotel.name}`}
          >
            <Image className="size-3.5" aria-hidden="true" />
            10 photos
            <span className="text-white/60">·</span>
            <Video className="size-3.5" aria-hidden="true" />
            9 videos
          </Link>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 flex items-center gap-1.5 truncate text-xs text-muted">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {hotel.location.city}, {hotel.location.country}
            </span>
          </p>
          <Stars count={hotel.stars} />
        </div>

        <Link to={`/hotels/${hotel.slug}`} onClick={guardTo(`/hotels/${hotel.slug}`)} className="mt-2">
          <h3 className="font-display text-[1.65rem] leading-tight tracking-tight text-ink transition-colors group-hover:text-brand">
            {hotel.name}
          </h3>
        </Link>
        <div className="mt-2 space-y-0.5 text-xs leading-relaxed text-[#1A7971]">
          {getBookingHighlights(hotel).map(({ label, Icon }) => (
            <p key={label} className="flex items-center gap-1.5">
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              {label}
            </p>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-line/80 pt-4">
          <div>
            <p className="font-numeric text-sm font-semibold text-ink">
              {hotel.rating.toFixed(1)}
              <span className="ml-1.5 text-xs font-normal text-muted">({hotel.reviewCount} reviews)</span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-numeric text-xs text-muted line-through">
              {formatCurrency(getCardPrice(hotel).originalPrice)}
            </p>
            <p className="font-numeric text-xl font-semibold leading-tight text-ink">
              {formatCurrency(hotel.pricePerNight)}
            </p>
            <p className="font-numeric text-xs text-muted">
              + {formatCurrency(getCardPrice(hotel).taxesAndFees)} taxes &amp; fees
            </p>
            <p className="text-xs text-muted">Per Night</p>
          </div>
        </div>
      </div>
    </article>
  )
}
