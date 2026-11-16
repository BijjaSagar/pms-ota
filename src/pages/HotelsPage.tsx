import { ArrowUpDown, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FilterPanel } from '../components/hotels/FilterPanel'
import { HotelCard } from '../components/hotels/HotelCard'
import { SearchBar } from '../components/hotels/SearchBar'
import { Button } from '../components/ui/Button'
import { useBooking } from '../context/useBooking'
import { hotels } from '../data/hotels'
import type { HotelFilters, SearchParams } from '../types'

const defaultFilters: HotelFilters = {
  maxPrice: 1000,
  propertyTypes: [],
  amenities: [],
  minRating: 0,
  preferences: [],
  starCategories: [],
  flexibleCheckInOut: [],
  houseRules: [],
  businessEssentials: [],
}

type SortOption = 'recommended' | 'price-asc' | 'price-desc' | 'rating'

export function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { search, updateSearch } = useBooking()
  const [filters, setFilters] = useState<HotelFilters>(defaultFilters)
  const [sort, setSort] = useState<SortOption>('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const query: SearchParams = useMemo(
    () => ({
      destination: searchParams.get('destination') ?? '',
      checkIn: searchParams.get('checkIn') ?? search.checkIn,
      checkOut: searchParams.get('checkOut') ?? search.checkOut,
      guests: Number(searchParams.get('guests') ?? search.guests),
      rooms: Number(searchParams.get('rooms') ?? search.rooms),
      adults: Number(searchParams.get('adults') ?? search.adults),
      kids: Number(searchParams.get('kids') ?? search.kids),
    }),
    [
      searchParams,
      search.checkIn,
      search.checkOut,
      search.guests,
      search.rooms,
      search.adults,
      search.kids,
    ],
  )

  useEffect(() => {
    updateSearch(query)
  }, [query, updateSearch])

  useEffect(() => {
    if (!filtersOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [filtersOpen])

  const results = useMemo(() => {
    const destination = query.destination.trim().toLowerCase()

    const filtered = hotels.filter((hotel) => {
      const matchesDestination =
        destination.length === 0 ||
        [hotel.name, hotel.location.city, hotel.location.country, hotel.location.region, ...hotel.tags]
          .join(' ')
          .toLowerCase()
          .includes(destination)

      const matchesPrice = hotel.pricePerNight <= filters.maxPrice
      const matchesType =
        filters.propertyTypes.length === 0 || filters.propertyTypes.includes(hotel.propertyType)
      const matchesRating = hotel.rating >= filters.minRating
      const matchesStarCategory =
        filters.starCategories.length === 0 || filters.starCategories.includes(hotel.stars)
      const matchesFlexibleCheckInOut = filters.flexibleCheckInOut.every((option) => {
        if (option === 'Guaranteed early check-in') {
          return Number(hotel.policies.checkIn.match(/\d+/)?.[0] ?? 99) <= 2
        }
        return Number(hotel.policies.checkOut.match(/\d+/)?.[0] ?? 0) >= 12
      })
      const matchesHouseRules = filters.houseRules.every((rule) =>
        hotel.policies.houseRules.includes(rule),
      )
      const matchesBusinessEssentials = filters.businessEssentials.every((essential) => {
        switch (essential) {
          case 'WiFi':
            return hotel.amenities.includes('Free WiFi')
          case 'Breakfast included':
            return hotel.amenities.includes('Breakfast included')
          case 'All meals included':
            return hotel.amenities.includes('Breakfast included') && hotel.amenities.includes('Restaurant')
          case 'Breakfast + lunch/dinner':
            return hotel.amenities.includes('Breakfast included') && hotel.amenities.includes('Restaurant')
          case 'Pay at hotel':
            return hotel.rooms.some((room) => room.refundable)
          default:
            return true
        }
      })
      const matchesAmenities = filters.amenities.every((amenity) => hotel.amenities.includes(amenity))
      const matchesPreferences = filters.preferences.every((preference) => {
        switch (preference) {
          case 'Rush deals':
            return hotel.pricePerNight <= 500
          case 'Last-minute deal':
            return hotel.pricePerNight <= 400
          case 'Beachfront':
            return (
              hotel.amenities.includes('Beach access') ||
              hotel.tags.includes('Sea view') ||
              hotel.tags.includes('Private island')
            )
          case 'Self check-in available':
            return hotel.propertyType === 'City Hotel' || hotel.propertyType === 'Boutique'
          case 'Breakfast included':
            return hotel.amenities.includes('Breakfast included')
          case 'Pool access':
            return hotel.amenities.includes('Infinity pool') || hotel.amenities.includes('Private pool')
          default:
            return true
        }
      })

      return (
        matchesDestination &&
        matchesPrice &&
        matchesType &&
        matchesRating &&
        matchesStarCategory &&
        matchesFlexibleCheckInOut &&
        matchesHouseRules &&
        matchesBusinessEssentials &&
        matchesAmenities &&
        matchesPreferences
      )
    })

    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.pricePerNight - b.pricePerNight
        case 'price-desc':
          return b.pricePerNight - a.pricePerNight
        case 'rating':
          return b.rating - a.rating
        default:
          return Number(b.featured) - Number(a.featured) || b.rating - a.rating
      }
    })
  }, [filters, query.destination, sort])

  const activeFilterCount =
    filters.propertyTypes.length +
    filters.amenities.length +
    filters.preferences.length +
    filters.starCategories.length +
    filters.flexibleCheckInOut.length +
    filters.houseRules.length +
    filters.businessEssentials.length +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.maxPrice < 2000 ? 1 : 0)

  const handleSearch = (params: SearchParams) => {
    updateSearch(params)
    setSearchParams(
      {
        destination: params.destination,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: String(params.guests),
        rooms: String(params.rooms),
        adults: String(params.adults),
        kids: String(params.kids),
      },
      { replace: true },
    )
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetFilters = () => setFilters(defaultFilters)
  const handleDestinationChange = (destination: string) => {
    setSearchParams(
      {
        destination,
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        guests: String(query.guests),
        rooms: String(query.rooms),
        adults: String(query.adults),
        kids: String(query.kids),
      },
      { replace: true },
    )
  }
  return (
    <div className="pb-20">
      <div className="container-page py-6">
        <SearchBar
          key={`${query.destination}-${query.checkIn}-${query.checkOut}-${query.guests}-${query.rooms}-${query.adults}-${query.kids}`}
          initial={query}
          onSearch={handleSearch}
          variant="compact"
        />
      </div>

      <div className="container-page mt-8 lg:mt-10">
        <div className="grid gap-8 lg:grid-cols-[270px_1fr]">
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                destination={query.destination}
                onDestinationChange={handleDestinationChange}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink lg:hidden"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                Filters
                {activeFilterCount > 0 ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[0.6rem] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                ) : null}
              </button>

              <div className="flex shrink-0 items-center gap-2">
                <ArrowUpDown className="size-4 text-muted" aria-hidden="true" />
                <label htmlFor="sort" className="sr-only">
                  Sort stays
                </label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortOption)}
                  className="cursor-pointer rounded-none border border-line bg-white px-4 py-2 text-sm font-medium text-ink focus:border-brand focus:outline-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="rating">Guest rating</option>
                </select>
              </div>
            </div>

            {results.length > 0 ? (
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((hotel, index) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    className="animate-fade-up"
                    style={{ animationDelay: `${index * 60}ms` }}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-10 rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
                <p className="font-display text-2xl text-ink">No stays match those filters</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                  Try widening your budget, removing an amenity or exploring a different destination.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Button onClick={resetFilters}>Clear filters</Button>
                  <Link
                    to="/hotels"
                    className="inline-flex items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-medium text-ink transition hover:border-ink/25 hover:bg-canvas"
                  >
                    Browse all stays
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-brand/40 backdrop-blur-sm"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div
            className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-canvas"
            role="dialog"
            aria-modal="true"
            aria-label="Filter stays"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <p className="font-display text-2xl text-ink">Refine your search</p>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex size-9 items-center justify-center rounded-full border border-line bg-white text-ink"
                aria-label="Close filters"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                destination={query.destination}
                onDestinationChange={handleDestinationChange}
              />
              <Button fullWidth className="mt-4" onClick={() => setFiltersOpen(false)}>
                Show {results.length} {results.length === 1 ? 'stay' : 'stays'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
