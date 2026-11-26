// Hotel details — TriponX stay-page layout, with pms-ota's data and features
// (room selection -> booking context -> /checkout, lightbox, OpenStreetMap, reviews, policies,
// capacity warning, rooms left, wishlist).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { ArrowRight, ChatIcon, HeartIcon, InfoIcon, ShareIcon } from '../components/Icons.jsx';
import { AmenityIcon } from '../components/hotels/AmenityIcon.jsx';
import { Gallery } from '../components/hotels/Gallery.jsx';
import { ReviewList } from '../components/hotels/ReviewList.jsx';
import { RoomCard } from '../components/hotels/RoomCard.jsx';
import { Stars } from '../components/ui/Badge.jsx';
import { useAuth } from '../lib/context/useAuth.js';
import { useBooking } from '../lib/context/useBooking.js';
import { useWishlist } from '../lib/context/useWishlist.js';
import { useCatalogue } from '../lib/context/useCatalogue.js';
import { AuthLoading } from '../components/auth/RequireAuth.jsx';
import { formatDate, nightsBetween } from '../lib/utils/date.js';
import { calculatePrice, formatCurrency, SERVICE_FEE_RATE, TAX_RATE } from '../lib/utils/pricing.js';
import { PortalModal } from '../components/profile/PortalModal.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import '../styles/hotel-details.css';

const pct = (r) => `${Math.round(r * 100)}%`;
/** Key amenities shown on the page; the rest open in "Show all amenities". */
const POPULAR_SHOWN = 8;

export default function HotelDetailsPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { search, selectedHotel, selectedRoom, selectRoom } = useBooking();
  const { isSaved, toggleWishlist } = useWishlist();
  // Approved partner properties (from the API) and the demo hotels.
  const { getHotelBySlug, ready } = useCatalogue();
  const [shared, setShared] = useState(false);
  const [allAmenities, setAllAmenities] = useState(false);
  const closeAmenities = useCallback(() => setAllAmenities(false), []);
  const { isAuthenticated, authOpen, openAuth } = useAuth();
  // Set when a signed-out guest clicks Reserve: once they sign in, continue to checkout.
  const reservePending = useRef(false);

  useEffect(() => {
    if (isAuthenticated && reservePending.current) {
      reservePending.current = false;
      navigate('/checkout');
    }
  }, [isAuthenticated, navigate]);

  // Closing the popup without signing in cancels the pending reservation.
  useEffect(() => { if (!authOpen && !isAuthenticated) reservePending.current = false; }, [authOpen, isAuthenticated]);

  const hotel = slug ? getHotelBySlug(slug) : undefined;
  // An approved property may still be loading from the API.
  if (!hotel && !ready) return <AuthLoading label="Loading stay…" />;
  if (!hotel || hotel.rooms.length === 0) return <NotFoundPage />;

  const isCurrentHotel = selectedHotel?.id === hotel.id;
  const defaultRoom = hotel.rooms.reduce(
    (cheapest, room) => (room.pricePerNight < cheapest.pricePerNight ? room : cheapest),
    hotel.rooms[0],
  );
  const activeRoom = isCurrentHotel && selectedRoom ? selectedRoom : defaultRoom;
  const nights = nightsBetween(search.checkIn, search.checkOut);
  const nightsText = `${nights} ${nights === 1 ? 'night' : 'nights'}`;
  const guestsOverCapacity = search.guests > activeRoom.maxGuests;
  const price = calculatePrice(activeRoom, search.checkIn, search.checkOut, {
    rooms: search.rooms,
    propertyDiscountRate: hotel.propertyDiscountRate,
  });
  const saved = isSaved(hotel.id);
  const { policies } = hotel;
  // A new property may have no map pin.
  const { lat, lng } = hotel.coordinates ?? {};
  const hasMap = typeof lat === 'number' && typeof lng === 'number';
  const bbox = hasMap ? `${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}` : '';
  const hasReviews = hotel.reviewCount > 0;
  // Approved properties send key amenities and category groups; demo hotels a short flat list.
  const popularAmenities = (hotel.popularAmenities ?? hotel.amenities).slice(0, POPULAR_SHOWN);
  const amenityGroups = hotel.amenityGroups ?? [{ category: 'Amenities', items: hotel.amenities }];
  const amenityTotal = hotel.amenities.length;

  const handleSelectRoom = (room) => {
    selectRoom(hotel, room);
    document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReserve = () => {
    if (!isCurrentHotel || !selectedRoom) selectRoom(hotel, activeRoom);
    if (!isAuthenticated) {
      // Sign-in is asked for only here, on the Reserve click.
      reservePending.current = true;
      openAuth('login', 'Sign in to complete your booking.');
      return;
    }
    navigate('/checkout');
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: hotel.name, url });
      else { await navigator.clipboard?.writeText(url); setShared(true); setTimeout(() => setShared(false), 2000); }
    } catch { /* share sheet dismissed */ }
  };

  const facts = [
    ['Check-in', policies.checkIn],
    ['Check-out', policies.checkOut],
    ['Guest rating', hasReviews ? `${hotel.rating.toFixed(1)} / 5` : 'New · no reviews yet'],
    ['Location', hotel.distance],
  ].filter(([, value]) => value);
  const goodToKnow = [policies.cancellation, policies.children, policies.pets, 'All major cards accepted. This demo simulates payment.']
    .filter(Boolean);

  return (
    <div className="container stay-wrap">
      <div className="section-head">
        <div>
          <div className="row-gap-8 wrap mb-12">
            {hotel.featured && <span className="pill pill-sage">Guest favourite</span>}
            <span className="pill pill-outline">{hotel.propertyType}</span>
            <span className="pill pill-outline"><Stars count={hotel.stars} /></span>
            {hotel.tags.map((t) => <span key={t} className="pill pill-outline">{t}</span>)}
          </div>
          <h1 className="display-md">{hotel.name}</h1>
          <p className="section-sub">{hotel.address}{hasMap && <> · <a href="#map" className="link-strong">Show on map</a></>}</p>
        </div>
        <div className="row-gap-10">
          <button type="button" className="btn btn-outline btn-sm" onClick={handleShare}><ShareIcon size={16} />{shared ? 'Link copied' : 'Share'}</button>
          <button type="button" className={`btn btn-outline btn-sm ${saved ? 'hd-saved' : ''}`} aria-pressed={saved} onClick={() => toggleWishlist(hotel.id)}>
            <HeartIcon size={16} />{saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>

      <Gallery images={hotel.images} name={hotel.name} photosLink={`/hotels/${hotel.slug}/photos`} />

      <div className="stay-layout">
        <div className="stay-main">
          <div className="grid-auto-150">
            {facts.map(([k, v]) => (
              <div key={k} className="card fact"><p className="label-muted">{k}</p><p className="fact-v">{v}</p></div>
            ))}
          </div>

          <section>
            <h2 className="h2-sm mb-12">About this stay</h2>
            <p className="about mb-12"><strong>{hotel.tagline}.</strong> {hotel.description}</p>
            <p className="about hd-story">{hotel.story}</p>
          </section>

          {hotel.highlights.length > 0 && (
            <section>
              <h2 className="h2-sm mb-16">Why guests love it</h2>
              <div className="grid-auto-200 gap-12">
                {hotel.highlights.map((h) => (
                  <div key={h.title} className="card hd-highlight">
                    <span className="amenity-icon hd-hl-icon"><AmenityIcon name={h.icon} size={18} /></span>
                    <p className="h-card">{h.title}</p>
                    <p className="muted-sm">{h.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="good-to-know">
            <h2 className="h-card-lg">Good to know before you book</h2>
            <div className="grid-auto-260 gap-14">
              {goodToKnow.map((t) => <p key={t} className="gtk-item"><InfoIcon size={18} color="#8A5A33" />{t}</p>)}
            </div>
            {policies.houseRules?.length > 0 && (
              <div className="tag-row mt-14">{policies.houseRules.map((r) => <span key={r} className="pill pill-outline">{r}</span>)}</div>
            )}
          </section>

          <section id="rooms" className="hd-anchor">
            <div className="section-head">
              <h2 className="h2-sm">Choose your room</h2>
              <p className="muted-sm">{formatDate(search.checkIn, 'short')} – {formatDate(search.checkOut, 'short')} · {nightsText} · {search.guests} {search.guests === 1 ? 'guest' : 'guests'} · best rate guaranteed</p>
            </div>
            <div className="col-gap-14" role="radiogroup" aria-label="Room">
              {hotel.rooms.map((room) => (
                <RoomCard key={room.id} room={room} nights={nights} selected={activeRoom.id === room.id} onSelect={handleSelectRoom} />
              ))}
            </div>
          </section>

          <section>
            <ReviewList reviews={hotel.reviews} rating={hotel.rating} reviewCount={hotel.reviewCount} />
          </section>

          <section>
            <h2 className="h2-sm mb-16">What's included</h2>
            <div className="grid-auto-200 gap-12">
              {popularAmenities.map((a) => (
                <div key={a} className="amenity"><span className="amenity-icon"><AmenityIcon name={a} size={16} /></span>{a}</div>
              ))}
            </div>
            {amenityTotal > popularAmenities.length && (
              <button type="button" className="btn btn-outline btn-sm mt-14" aria-haspopup="dialog"
                onClick={() => setAllAmenities(true)}>
                Show all {amenityTotal} amenities
              </button>
            )}
          </section>

          {allAmenities && (
            <PortalModal title={`All amenities · ${amenityTotal}`} onClose={closeAmenities} wide>
              <div className="hd-amenity-modal">
                {amenityGroups.map((group) => (
                  <section key={group.category} className="hd-amenity-group">
                    <h3 className="h-card">{group.category}</h3>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}><span className="amenity-icon"><AmenityIcon name={item} size={14} /></span>{item}</li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </PortalModal>
          )}

          {hasMap && <section id="map" className="hd-anchor">
            <h2 className="h2-sm mb-16">Where you'll be</h2>
            <div className="map map-short hd-map">
              <iframe title={`Map showing ${hotel.name}`} loading="lazy"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`} />
            </div>
            <div className="tag-row mt-14">
              <span className="pill pill-outline">{hotel.distance}</span>
              <span className="pill pill-outline">{hotel.location.city}, {hotel.location.region}</span>
              <a className="pill pill-outline hd-maplink" target="_blank" rel="noreferrer"
                href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}>
                Open in maps <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </section>}
        </div>

        {/* Tablets & phones: price + Reserve always within reach */}
        <div className="book-bar" role="region" aria-label="Quick booking">
          <div className="book-bar-info">
            <p className="book-bar-price">{formatCurrency(price.total)}</p>
            <p className="muted-xs">{activeRoom.name} · {nightsText}, all-in</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleReserve}>Reserve</button>
        </div>

        <aside aria-label="Your booking" className="booking-col">
          <div className="booking-card">
            <p className="label-muted">{activeRoom.name}</p>
            <p className="price-xl">{formatCurrency(price.total)}</p>
            <p className="muted-sm mb-18">
              Total for {nightsText} · <s>{formatCurrency(Math.ceil((activeRoom.pricePerNight * 1.1) / 5) * 5)}</s> {formatCurrency(activeRoom.pricePerNight)} / night
            </p>
            <div className="date-box">
              <div><p className="mini-label">CHECK-IN</p><p className="date-v">{formatDate(search.checkIn, 'short')}</p></div>
              <div><p className="mini-label">CHECK-OUT</p><p className="date-v">{formatDate(search.checkOut, 'short')}</p></div>
              <div className="span-2"><p className="mini-label">GUESTS</p><p className="date-v">{search.guests} {search.guests === 1 ? 'guest' : 'guests'} · {search.rooms} {search.rooms === 1 ? 'room' : 'rooms'}</p></div>
            </div>
            {guestsOverCapacity && (
              <p className="hd-warn">{activeRoom.name} sleeps up to {activeRoom.maxGuests} guests. Select a larger room for {search.guests}.</p>
            )}
            <p className="hd-avail"><span>{activeRoom.bed} · up to {activeRoom.maxGuests} guests</span><strong>{activeRoom.remaining} {activeRoom.remaining === 1 ? 'room' : 'rooms'} left</strong></p>
            <div className="breakdown">
              <div><span>{formatCurrency(price.nightlyRate)} × {nightsText}{price.rooms > 1 ? ` × ${price.rooms} rooms` : ''}</span><strong>{formatCurrency(price.roomTotal)}</strong></div>
              {price.propertyDiscount > 0 && <div><span>Property discount ({pct(hotel.propertyDiscountRate)})</span><strong className="good">−{formatCurrency(price.propertyDiscount)}</strong></div>}
              <div><span>Taxes ({pct(TAX_RATE)})</span><strong>{formatCurrency(price.taxes)}</strong></div>
              <div><span>Service fee ({pct(SERVICE_FEE_RATE)})</span><strong>{formatCurrency(price.serviceFee)}</strong></div>
              <div className="breakdown-total"><span>You pay</span><span>{formatCurrency(price.total)}</span></div>
            </div>
            <button type="button" className="btn btn-primary btn-block btn-lg" onClick={handleReserve}>Reserve now</button>
            <p className="muted-sm center-text mt-12 mb-18">You won't be charged until the next step</p>
            <div className="cancel-timeline">
              <p className="ct-title">{activeRoom.refundable ? 'Free cancellation available' : 'Non-refundable rate'}</p>
              <p className="muted-sm">{policies.cancellation}</p>
            </div>
          </div>
          <div className="ask-card">
            <span className="ask-icon"><ChatIcon size={18} color="#3B5D70" /></span>
            <div className="grow"><p className="text-sm"><strong>Concierge support</strong></p><p className="muted-xs">Before and during your stay</p></div>
            <a href="/#concierge" className="icon-btn" aria-label="Contact concierge"><ArrowRight size={16} width={2} /></a>
          </div>
        </aside>
      </div>
    </div>
  );
}
