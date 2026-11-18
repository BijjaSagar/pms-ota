// Hotels list: pms-ota data and features (search, every filter, sorting, URL params, wishlist),
// in TriponX's own results layout (glass filter cards, horizontal result cards, map, compare tray).
import { CheckCircle2, Clock3, Clock9, CircleDollarSign, Heart, Images, SearchX, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FilterPanel, PRICE_MAX } from '../components/hotels/FilterPanel.jsx';
import { SearchBar } from '../components/hotels/SearchBar.jsx';
import { Photo } from '../components/Layout.jsx';
import { Stars } from '../components/ui/Badge.jsx';
import { useBooking } from '../lib/context/useBooking.js';
import { useWishlist } from '../lib/context/useWishlist.js';
import { hotels } from '../lib/data/hotels.js';
import { formatDate, nightsBetween } from '../lib/utils/date.js';
import { formatCurrency } from '../lib/utils/pricing.js';
import '../styles/hotels.css';

const defaultFilters = {
  maxPrice: 1000,
  propertyTypes: [],
  amenities: [],
  minRating: 0,
  preferences: [],
  starCategories: [],
  flexibleCheckInOut: [],
  houseRules: [],
  businessEssentials: [],
};

const SORTS = [
  ['recommended', 'Recommended'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['rating', 'Guest rating'],
];

// Same booking highlights and card pricing rules as pms-ota's HotelCard.
function bookingHighlights(hotel) {
  switch (Number(hotel.id.replace('hotel-', '')) % 3) {
    case 1: return [{ label: 'Guaranteed early check-in', Icon: Clock3 }];
    case 2: return [{ label: 'Guaranteed late checkout', Icon: Clock9 }];
    default: return [{ label: 'Book with ₹0 payment', Icon: CircleDollarSign }, { label: 'Guaranteed early check-in', Icon: Clock3 }];
  }
}
const cardPrice = (hotel) => ({
  originalPrice: Math.ceil((hotel.pricePerNight * 1.1) / 5) * 5,
  taxesAndFees: Math.round(hotel.pricePerNight * 0.05),
});
const ratingWord = (r) => (r >= 4.8 ? 'Exceptional' : 'Excellent');

// Decorative map positions (top px, left %), one per result slot.
const MAP_POS = [[80, 18], [170, 58], [270, 28], [360, 70], [460, 22], [540, 52]];

export default function HotelsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { search, updateSearch } = useBooking();
  const { isSaved, toggleWishlist } = useWishlist();
  const [filters, setFilters] = useState(defaultFilters);
  const [sort, setSort] = useState('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [compare, setCompare] = useState([]);
  const [active, setActive] = useState(null);

  const query = useMemo(() => ({
    destination: searchParams.get('destination') ?? '',
    checkIn: searchParams.get('checkIn') ?? search.checkIn,
    checkOut: searchParams.get('checkOut') ?? search.checkOut,
    guests: Number(searchParams.get('guests') ?? search.guests),
    rooms: Number(searchParams.get('rooms') ?? search.rooms),
    adults: Number(searchParams.get('adults') ?? search.adults),
    kids: Number(searchParams.get('kids') ?? search.kids),
  }), [searchParams, search.checkIn, search.checkOut, search.guests, search.rooms, search.adults, search.kids]);

  useEffect(() => { updateSearch(query); }, [query, updateSearch]);

  const results = useMemo(() => {
    const destination = query.destination.trim().toLowerCase();
    const filtered = hotels.filter((hotel) => {
      const matchesDestination = destination.length === 0 ||
        [hotel.name, hotel.location.city, hotel.location.country, hotel.location.region, ...hotel.tags]
          .join(' ').toLowerCase().includes(destination);
      const matchesPrice = hotel.pricePerNight <= filters.maxPrice;
      const matchesType = filters.propertyTypes.length === 0 || filters.propertyTypes.includes(hotel.propertyType);
      const matchesRating = hotel.rating >= filters.minRating;
      const matchesStarCategory = filters.starCategories.length === 0 || filters.starCategories.includes(hotel.stars);
      const matchesFlexibleCheckInOut = filters.flexibleCheckInOut.every((option) => {
        if (option === 'Guaranteed early check-in') return Number(hotel.policies.checkIn.match(/\d+/)?.[0] ?? 99) <= 2;
        return Number(hotel.policies.checkOut.match(/\d+/)?.[0] ?? 0) >= 12;
      });
      const matchesHouseRules = filters.houseRules.every((rule) => hotel.policies.houseRules.includes(rule));
      const matchesBusinessEssentials = filters.businessEssentials.every((essential) => {
        switch (essential) {
          case 'WiFi': return hotel.amenities.includes('Free WiFi');
          case 'Breakfast included': return hotel.amenities.includes('Breakfast included');
          case 'All meals included':
          case 'Breakfast + lunch/dinner':
            return hotel.amenities.includes('Breakfast included') && hotel.amenities.includes('Restaurant');
          case 'Pay at hotel': return hotel.rooms.some((room) => room.refundable);
          default: return true;
        }
      });
      const matchesAmenities = filters.amenities.every((a) => hotel.amenities.includes(a));
      const matchesPreferences = filters.preferences.every((preference) => {
        switch (preference) {
          case 'Rush deals': return hotel.pricePerNight <= 500;
          case 'Last-minute deal': return hotel.pricePerNight <= 400;
          case 'Beachfront': return hotel.amenities.includes('Beach access') || hotel.tags.includes('Sea view') || hotel.tags.includes('Private island');
          case 'Self check-in available': return hotel.propertyType === 'City Hotel' || hotel.propertyType === 'Boutique';
          case 'Breakfast included': return hotel.amenities.includes('Breakfast included');
          case 'Pool access': return hotel.amenities.includes('Infinity pool') || hotel.amenities.includes('Private pool');
          default: return true;
        }
      });
      return matchesDestination && matchesPrice && matchesType && matchesRating && matchesStarCategory &&
        matchesFlexibleCheckInOut && matchesHouseRules && matchesBusinessEssentials && matchesAmenities && matchesPreferences;
    });
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'price-asc': return a.pricePerNight - b.pricePerNight;
        case 'price-desc': return b.pricePerNight - a.pricePerNight;
        case 'rating': return b.rating - a.rating;
        default: return Number(b.featured) - Number(a.featured) || b.rating - a.rating;
      }
    });
  }, [filters, query.destination, sort]);

  const activeFilterCount =
    filters.propertyTypes.length + filters.amenities.length + filters.preferences.length + filters.starCategories.length +
    filters.flexibleCheckInOut.length + filters.houseRules.length + filters.businessEssentials.length +
    (filters.minRating > 0 ? 1 : 0) + (filters.maxPrice < PRICE_MAX ? 1 : 0);

  const paramsFrom = (p) => ({
    destination: p.destination, checkIn: p.checkIn, checkOut: p.checkOut,
    guests: String(p.guests), rooms: String(p.rooms), adults: String(p.adults), kids: String(p.kids),
  });
  const handleSearch = (params) => {
    updateSearch(params);
    setSearchParams(paramsFrom(params), { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleDestinationChange = (destination) => setSearchParams(paramsFrom({ ...query, destination }), { replace: true });
  const resetFilters = () => setFilters(defaultFilters);

  const nights = nightsBetween(query.checkIn, query.checkOut);
  const chosen = hotels.filter((h) => compare.includes(h.id));
  const toggleCompare = (id) => setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? c : [...c, id]));
  const place = query.destination.trim();

  return (
    <div className="hotels-page">
      <div className="container-wide results-wrap">
        <div className="hotels-search">
          <SearchBar
            key={`${query.destination}-${query.checkIn}-${query.checkOut}-${query.guests}-${query.rooms}-${query.adults}-${query.kids}`}
            initial={query}
            onSearch={handleSearch}
            variant="compact"
          />
        </div>

        <div className="section-head">
          <div>
            <p className="crumbs"><Link to="/">Home</Link> / {place || 'All destinations'}</p>
            <h1 className="h1">{results.length} {results.length === 1 ? 'stay' : 'stays'}{place ? ` in ${place}` : ' to explore'}</h1>
            <p className="section-sub">
              {formatDate(query.checkIn, 'short')} – {formatDate(query.checkOut, 'short')} · {nights} {nights === 1 ? 'night' : 'nights'} ·
              {' '}{query.guests} {query.guests === 1 ? 'guest' : 'guests'} · {query.rooms} {query.rooms === 1 ? 'room' : 'rooms'}
            </p>
          </div>
          <div className="row-gap-8 wrap center sort-row" role="group" aria-label="Sort stays">
            <span className="label-muted">Sort</span>
            {SORTS.map(([value, label]) => (
              <button key={value} type="button" aria-pressed={sort === value}
                className={`seg-btn ${sort === value ? 'is-active' : ''}`} onClick={() => setSort(value)}>{label}</button>
            ))}
          </div>
        </div>

        {filters !== defaultFilters && activeFilterCount > 0 && (
          <div className="intent-banner">
            <Sparkles size={18} color="#2F5447" aria-hidden="true" />
            <span><strong>{activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'}</strong> applied · {results.length} of {hotels.length} stays match.</span>
            <button type="button" className="btn-mini" onClick={resetFilters}>Clear</button>
          </div>
        )}

        <button type="button" className="btn btn-outline btn-sm filters-toggle" aria-expanded={filtersOpen}
          aria-controls="filters" onClick={() => setFiltersOpen((v) => !v)}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          {filtersOpen ? 'Hide filters' : 'Filters'}
          {activeFilterCount > 0 && <span className="filters-count">{activeFilterCount}</span>}
        </button>

        <div className="results-layout">
          <aside id="filters" aria-label="Filters" className={`filters ${filtersOpen ? 'is-open' : ''}`}>
            <FilterPanel filters={filters} onChange={setFilters} destination={query.destination} onDestinationChange={handleDestinationChange} />
          </aside>

          <section aria-label="Results" className="listings">
            {results.length === 0 && (
              <div className="card empty-state">
                <span className="empty-icon"><SearchX size={22} /></span>
                <p className="h-card">No stays match those filters</p>
                <p className="muted-sm mb-16">Try widening your budget, removing an amenity or exploring a different destination.</p>
                <div className="row-gap-10 wrap justify-center">
                  <button type="button" className="btn btn-primary btn-sm" onClick={resetFilters}>Clear filters</button>
                  <Link to="/hotels" className="btn btn-outline btn-sm">Browse all stays</Link>
                </div>
              </div>
            )}

            {results.map((hotel, i) => {
              const saved = isSaved(hotel.id);
              const price = cardPrice(hotel);
              const refundable = hotel.rooms.some((r) => r.refundable);
              return (
                <article key={hotel.id} className={`result-card hcard-in ${active === hotel.id ? 'is-hover' : ''}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onMouseEnter={() => setActive(hotel.id)} onMouseLeave={() => setActive(null)}>
                  <Photo src={hotel.images[0]} eager={i < 2} label={`${hotel.name} in ${hotel.location.city}`} className="result-photo">
                    <Link to={`/hotels/${hotel.slug}`} className="result-photo-link" aria-label={`View ${hotel.name}`} />
                    <Link to={`/hotels/${hotel.slug}/photos`} className="photo-count result-photos-link">
                      <Images size={12} aria-hidden="true" />1 / {hotel.images.length}
                    </Link>
                  </Photo>
                  <div className="result-body">
                    <div className="result-head">
                      <div>
                        <p className="label-muted result-type">{hotel.propertyType} · <Stars count={hotel.stars} /></p>
                        <h3 className="h3"><Link to={`/hotels/${hotel.slug}`}>{hotel.name}</Link></h3>
                        <p className="muted-sm">{hotel.location.city}, {hotel.location.country} · {hotel.distance}</p>
                      </div>
                      <button type="button" className={`icon-btn ${saved ? 'is-saved' : ''}`} aria-pressed={saved}
                        aria-label={saved ? `Remove ${hotel.name} from saved stays` : `Save ${hotel.name}`}
                        onClick={() => toggleWishlist(hotel.id)}>
                        <Heart size={18} />
                      </button>
                    </div>
                    <div className="row-gap-10 wrap center">
                      <span className="score">{hotel.rating.toFixed(1)}</span>
                      <strong className="text-sm">{ratingWord(hotel.rating)}</strong>
                      <span className="muted-sm">· {hotel.reviewCount} reviews</span>
                    </div>
                    {hotel.reviews[0] && <p className="quote">“{hotel.reviews[0].body}”</p>}
                    <div className="tag-row">{hotel.tags.map((t) => <span key={t} className="tag">{t}</span>)}</div>
                    <div className="result-foot">
                      <div className="col-gap-4">
                        {bookingHighlights(hotel).map(({ label, Icon }) => (
                          <span key={label} className="cancel-ok"><Icon size={14} aria-hidden="true" />{label}</span>
                        ))}
                        {refundable && <span className="cancel-ok"><CheckCircle2 size={14} aria-hidden="true" />Free cancellation on some rooms</span>}
                        <label className="compare-check">
                          <input type="checkbox" checked={compare.includes(hotel.id)} onChange={() => toggleCompare(hotel.id)}
                            disabled={!compare.includes(hotel.id) && compare.length >= 3} />Compare
                        </label>
                      </div>
                      <div className="row-gap-16 center">
                        <div className="text-right">
                          <p className="result-was">{formatCurrency(price.originalPrice)}</p>
                          <p className="price-lg">{formatCurrency(hotel.pricePerNight)}</p>
                          <p className="muted-xs">+ {formatCurrency(price.taxesAndFees)} taxes &amp; fees · per night</p>
                        </div>
                        <Link to={`/hotels/${hotel.slug}`} className="btn btn-primary">View rooms</Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <aside aria-label="Map" className="map-col">
            <div className="map">
              <svg width="100%" height="100%" viewBox="0 0 340 620" preserveAspectRatio="none" aria-hidden="true">
                <path d="M-10 140 C 80 120, 120 220, 220 200 S 330 260, 360 240" stroke="#CBD7CE" strokeWidth="26" fill="none" />
                <path d="M40 -10 C 70 160, 20 300, 120 420 S 210 560, 190 640" stroke="#F6F5F1" strokeWidth="6" fill="none" />
                <path d="M-10 470 C 100 440, 200 500, 360 430" stroke="#F6F5F1" strokeWidth="4" fill="none" />
                <path d="M250 -10 C 230 120, 300 260, 260 380" stroke="#D9E4EA" strokeWidth="10" fill="none" />
              </svg>
              <button type="button" className="map-toggle">Search as I move the map</button>
              {results.map((hotel, i) => {
                const [top, left] = MAP_POS[i % MAP_POS.length];
                return (
                  <Link key={hotel.id} to={`/hotels/${hotel.slug}`} className={`map-pin ${active === hotel.id ? 'is-active' : ''}`}
                    style={{ top, left: `${left}%` }} aria-label={`${hotel.name}, ${formatCurrency(hotel.pricePerNight)} per night`}
                    onMouseEnter={() => setActive(hotel.id)} onMouseLeave={() => setActive(null)}>
                    {formatCurrency(hotel.pricePerNight)}
                  </Link>
                );
              })}
            </div>
            <div className="card tip-card">
              <p className="h-filter">Prices look high?</p>
              <p className="muted-sm">Try “Rush deals” or “Last-minute deal” under For you, or move your dates midweek.</p>
              <Link to="/#offers" className="link-strong">See today's offers →</Link>
            </div>
          </aside>
        </div>
      </div>

      {chosen.length > 0 && (
        <div className="compare-tray" role="region" aria-label="Compare tray">
          <span className="ct-count">{chosen.length} of 3 selected to compare</span>
          <span className="ct-names">{chosen.map((h) => h.name).join(' · ')}</span>
          <button type="button" className="btn btn-light btn-sm" onClick={() => setCompare([])}>Clear</button>
        </div>
      )}
    </div>
  );
}
