import { useBooking } from '../context/useBooking'
import { SearchBar } from '../components/hotels/SearchBar'
import { useNavigate, useParams } from 'react-router-dom'
import { Gallery } from '../components/hotels/Gallery'
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
      <SearchBar
        initial={searchParams}
        onSearch={handleSearch}
        variant="compact"
      />

      <div className="mt-8">
        <Gallery images={hotel.images} name={hotel.name} />
      </div>
    </main>
  )
}
