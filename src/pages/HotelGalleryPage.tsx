import { X } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Gallery } from '../components/hotels/Gallery'
import { SearchBar } from '../components/hotels/SearchBar'
import { useBooking } from '../context/useBooking'
import { getHotelBySlug } from '../data/hotels'
import { NotFoundPage } from './NotFoundPage'

export function HotelGalleryPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { search, updateSearch } = useBooking()
  const hotel = slug ? getHotelBySlug(slug) : undefined

  if (!hotel) {
    return <NotFoundPage />
  }

  const searchParams = {
    ...search,
    destination: hotel.location.city,
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

  return (
    <main className="container-page pb-20 pt-6">
      <div className="sticky top-0 z-30 -mx-5 flex items-start justify-between gap-4 border-b border-line/80 bg-canvas/95 px-5 py-3 backdrop-blur sm:static sm:mx-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Photos</p>
          <h1 className="mt-1 truncate text-xl font-semibold text-ink sm:text-2xl">{hotel.name}</h1>
        </div>
        <Link
          to={`/hotels/${hotel.slug}`}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm transition hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label="Close photos"
        >
          <X className="size-5" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6">
        <SearchBar
          initial={searchParams}
          onSearch={handleSearch}
          variant="compact"
        />
      </div>

      <div className="mt-8">
        <Gallery images={hotel.images} name={hotel.name} />
      </div>
    </main>
  )
}
