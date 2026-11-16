import {
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { AmenityIcon } from '../components/hotels/AmenityIcon'
import { Gallery } from '../components/hotels/Gallery'
import { ReviewList } from '../components/hotels/ReviewList'
import { RoomCard } from '../components/hotels/RoomCard'
import { SearchBar } from '../components/hotels/SearchBar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useBooking } from '../context/useBooking'
import { getHotelBySlug } from '../data/hotels'
import { formatDate, nightsBetween } from '../utils/date'
import { formatCurrency } from '../utils/pricing'
import { NotFoundPage } from './NotFoundPage'

export function HotelDetailsPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { search, selectedHotel, selectedRoom, selectRoom, updateSearch } = useBooking()

  const hotel = slug ? getHotelBySlug(slug) : undefined

  if (!hotel) {
    return <NotFoundPage />
  }

  const isCurrentHotel = selectedHotel?.id === hotel.id
  const defaultRoom = hotel.rooms.reduce(
    (cheapest, room) => (room.pricePerNight < cheapest.pricePerNight ? room : cheapest),
    hotel.rooms[0],
  )
  const activeRoom = isCurrentHotel && selectedRoom ? selectedRoom : defaultRoom
  const nights = nightsBetween(search.checkIn, search.checkOut)
  const guestsOverCapacity = search.guests > activeRoom.maxGuests

  const handleSelectRoom = (room: (typeof hotel.rooms)[number]) => {
    selectRoom(hotel, room)
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleReserve = () => {
    if (!isCurrentHotel || !selectedRoom) {
      selectRoom(hotel, activeRoom)
    }
    navigate('/checkout')
  }

  const handleSearch = (params: typeof search) => {
    updateSearch(params)
    const query = new URLSearchParams({
      destination: params.destination,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: String(params.guests),
      rooms: String(params.rooms),
      adults: String(params.adults),
      kids: String(params.kids),
    })
    navigate(`/hotels?${query.toString()}`)
  }

  const bbox = `${hotel.coordinates.lng - 0.01},${hotel.coordinates.lat - 0.01},${hotel.coordinates.lng + 0.01},${hotel.coordinates.lat + 0.01}`

  return (
    <div className="pb-28 lg:pb-20">
      <div className="container-page pt-6">
        <SearchBar
          initial={{ ...search, destination: hotel.location.city }}
          onSearch={handleSearch}
          variant="compact"
        />
        <nav
          aria-label="Hotel information"
          className="mt-5 flex gap-8 overflow-x-auto border-b border-line px-2"
        >
          {[
            ['Overview', 'overview'],
            ['Info & prices', 'rooms'],
            ['Facilities', 'amenities'],
            ['House rules', 'house-rules'],
            ['Important and legal info', 'important-info'],
            ['Guest reviews', 'reviews'],
          ].map(([label, id], index) => (
            <a
              key={id}
              href={`#${id}`}
              className={`shrink-0 border-b-2 px-1 pb-3 text-sm transition-colors ${
                index === 0
                  ? 'border-[#0d9f91] text-ink'
                  : 'border-transparent text-ink hover:border-[#0d9f91] hover:text-[#0d9f91]'
              }`}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="mt-6">
          <Gallery images={hotel.images} name={hotel.name} />
        </div>
      </div>

      <div className="container-page mt-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_370px] lg:gap-14">
          <div className="min-w-0">
            <section id="overview" className="scroll-mt-24">
              <div className="grid gap-4 sm:grid-cols-3">
                {hotel.highlights.map((highlight) => (
                  <div key={highlight.title} className="rounded-2xl border border-line bg-white p-5">
                    <span className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-brand">
                      <AmenityIcon name={highlight.icon} className="size-4.5" />
                    </span>
                    <h2 className="mt-3 text-sm font-semibold text-ink">{highlight.title}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{highlight.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="amenities" className="mt-12 scroll-mt-24 border-t border-line pt-10">
              <h2 className="font-display text-3xl text-ink">The story</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">{hotel.story}</p>
            </section>

            <section className="mt-12 border-t border-line pt-10">
              <h2 className="font-display text-3xl text-ink">Amenities</h2>
              <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {hotel.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2.5 text-sm text-ink">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-brand ring-1 ring-line">
                      <AmenityIcon name={amenity} className="size-3.5" />
                    </span>
                    {amenity}
                  </div>
                ))}
              </div>
            </section>

            <section id="rooms" className="mt-12 scroll-mt-24 border-t border-line pt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl text-ink">Rooms & rates</h2>
                  <p className="mt-2 text-sm text-muted">
                    {formatDate(search.checkIn)} — {formatDate(search.checkOut)} ·{' '}
                    {nights} {nights === 1 ? 'night' : 'nights'} · {search.guests}{' '}
                    {search.guests === 1 ? 'guest' : 'guests'}
                  </p>
                </div>
                <Badge tone="success">
                  <CheckCircle2 className="size-3" aria-hidden="true" />
                  Best rate guaranteed
                </Badge>
              </div>

              <div className="mt-6 space-y-4">
                {hotel.rooms.map((room) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    nights={nights}
                    selected={activeRoom.id === room.id}
                    onSelect={handleSelectRoom}
                  />
                ))}
              </div>
            </section>

            <section className="mt-12 border-t border-line pt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl text-ink">Location</h2>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="size-4 text-accent" aria-hidden="true" />
                    {hotel.address}
                  </p>
                </div>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${hotel.coordinates.lat}&mlon=${hotel.coordinates.lng}#map=16/${hotel.coordinates.lat}/${hotel.coordinates.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-ink underline decoration-line underline-offset-4 transition hover:text-accent"
                >
                  Open in maps
                </a>
              </div>
              <div className="mt-5 overflow-hidden rounded-2xl border border-line bg-white">
                <iframe
                  title={`Map showing ${hotel.name}`}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${hotel.coordinates.lat},${hotel.coordinates.lng}`}
                  className="h-64 w-full grayscale-[35%]"
                  loading="lazy"
                />
              </div>
            </section>

            <section id="reviews" className="mt-12 scroll-mt-24 border-t border-line pt-10">
              <h2 className="font-display text-3xl text-ink">Guest reviews</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <Star className="size-4 fill-accent text-accent" aria-hidden="true" />
                {hotel.rating.toFixed(1)} from {hotel.reviewCount} verified stays
              </p>
              <div className="mt-6">
                <ReviewList reviews={hotel.reviews} rating={hotel.rating} reviewCount={hotel.reviewCount} />
              </div>
            </section>

            <section id="important-info" className="mt-12 scroll-mt-24 border-t border-line pt-10">
              <span id="house-rules" className="relative -top-24" aria-hidden="true" />
              <h2 className="font-display text-3xl text-ink">Good to know</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {[
                  { label: 'Check-in', value: hotel.policies.checkIn },
                  { label: 'Check-out', value: hotel.policies.checkOut },
                  { label: 'Cancellation', value: hotel.policies.cancellation },
                  { label: 'Children', value: hotel.policies.children },
                  { label: 'Pets', value: hotel.policies.pets },
                  { label: 'Payment', value: 'All major cards accepted. This demo simulates payment.' },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-white p-4 ring-1 ring-line">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-line bg-white p-5 shadow-[0_24px_60px_-40px_rgba(14,43,59,0.45)]">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">Nightly rate</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-xs text-muted line-through">
                      {formatCurrency(Math.ceil((activeRoom.pricePerNight * 1.1) / 5) * 5)}
                    </span>
                    <span className="text-xs text-muted">Per Night:</span>
                  </div>
                  <p className="font-numeric text-2xl font-bold leading-tight text-ink">
                    {formatCurrency(activeRoom.pricePerNight)}
                    <span className="ml-1 text-sm font-normal text-muted">
                      + {formatCurrency(Math.round(activeRoom.pricePerNight * 0.05))} taxes &amp; fees
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="flex items-center justify-end gap-1 text-sm font-semibold text-ink">
                    <Star className="size-3.5 fill-accent text-accent" aria-hidden="true" />
                    {hotel.rating.toFixed(1)}
                  </p>
                  <p className="text-[0.65rem] text-muted">{hotel.reviewCount} reviews</p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-canvas p-3">
                <p className="text-xs font-medium text-ink">{activeRoom.name}</p>
                <p className="mt-0.5 text-[0.65rem] text-muted">
                  {activeRoom.bed} · Up to {activeRoom.maxGuests} guests
                </p>
              </div>

              {guestsOverCapacity ? (
                <p className="mt-3 rounded-lg bg-[#fbf3e6] px-3 py-2 text-[0.7rem] leading-relaxed text-[#8a642c]">
                  {activeRoom.name} sleeps up to {activeRoom.maxGuests} guests. Select a larger room for{' '}
                  {search.guests}.
                </p>
              ) : null}

              <div className="mt-4 border-t border-line pt-4">
                <p className="flex items-center justify-between text-xs font-medium text-ink">
                  <span>Availability</span>
                  <span className="text-[#1A7971]">
                    {activeRoom.remaining} {activeRoom.remaining === 1 ? 'room' : 'rooms'} left
                  </span>
                </p>
                <p className="mt-1 text-[0.65rem] text-muted">
                  Available for your selected dates
                </p>
              </div>

              <Button fullWidth size="lg" className="mt-4" onClick={handleReserve}>
                Reserve now
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[0.65rem] text-muted">
                <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
                You won't be charged until the next step
              </p>

              <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-[0.65rem] text-muted">
                <p className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-success" aria-hidden="true" />
                  {activeRoom.refundable ? 'Free cancellation available' : 'Non-refundable rate'}
                </p>
                <p className="flex items-center gap-1.5">
                  <Sparkles className="size-3 text-accent" aria-hidden="true" />
                  Concierge support before and during your stay
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-ink">
              {formatCurrency(activeRoom.pricePerNight)}
              <span className="text-xs font-normal text-muted"> / night</span>
            </p>
            <p className="text-[0.65rem] text-muted">
              {nights} {nights === 1 ? 'night' : 'nights'} · {activeRoom.name}
            </p>
          </div>
          <Button onClick={handleReserve}>Reserve</Button>
        </div>
      </div>
    </div>
  )
}
