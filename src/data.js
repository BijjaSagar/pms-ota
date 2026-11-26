// TriponX data layer.
// Hotels, rooms, reviews, policies and destinations come from the pms-ota project (./data/hotels.js).
// This file only adapts that data to what each screen needs. Replace with API calls later.
import { hotels, destinations, amenityFilters, propertyTypeFilters, getHotelBySlug } from './lib/data/hotels.js';

export { hotels, destinations, getHotelBySlug };

export const formatINR = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

// Sample stay used across the app until real date pickers drive it.
export const NIGHTS = 2;
export const STAY_DATES = { checkIn: 'Fri, 12 Dec', checkOut: 'Sun, 14 Dec', label: '12–14 Dec' };

// Pricing rules match pms-ota (src/utils/pricing.ts): discount, then 12% tax + 4% service fee.
export const TAX_RATE = 0.12;
export const SERVICE_FEE_RATE = 0.04;

export function priceFor(nightly, discountRate = 0, nights = NIGHTS) {
  const roomTotal = nightly * nights;
  const discount = Math.round(roomTotal * discountRate);
  const afterDiscount = roomTotal - discount;
  const taxes = Math.round(afterDiscount * TAX_RATE);
  const serviceFee = Math.round(afterDiscount * SERVICE_FEE_RATE);
  return { nights, nightly, roomTotal, discount, afterDiscount, taxes, serviceFee, total: afterDiscount + taxes + serviceFee };
}

// Ratings in the source data are out of 5.
export const ratingWord = (r) => (r >= 4.8 ? 'Exceptional' : r >= 4.6 ? 'Superb' : r >= 4.3 ? 'Excellent' : 'Very good');

export const cheapestRoom = (hotel) => hotel.rooms.reduce((a, b) => (b.pricePerNight < a.pricePerNight ? b : a));
export const hotelTotal = (hotel) => priceFor(cheapestRoom(hotel).pricePerNight, hotel.propertyDiscountRate).total;
export const hasFreeCancellation = (hotel) => hotel.rooms.some((r) => r.refundable);
export const placeOf = (hotel) => `${hotel.location.city}, ${hotel.location.country}`;

// ---------- Home ----------
export const intents = ['Honeymoon', 'Family', 'Wellness', 'Private pool', 'Sea view', 'Culture'];

export const collections = destinations.map((d) => ({
  title: d.city,
  sub: `${d.tagline} · ${d.country}`,
  count: `${d.hotels} stays`,
  image: d.image,
  to: `/hotels?destination=${encodeURIComponent(d.city)}`,
}));

const BADGES = ['Guest favourite', 'New on TriponX', 'Member rate', 'Top rated'];
const toFeatured = (h, i) => ({
  id: h.slug,
  name: h.name,
  place: `${placeOf(h)} · ${h.distance}`,
  // A newly approved property has no reviews yet.
  score: h.reviewCount > 0 ? h.rating.toFixed(1) : 'New',
  badge: h.isPartnerProperty ? 'New on TriponX' : BADGES[i % BADGES.length],
  tags: h.tags.slice(0, 2),
  total: hotelTotal(h),
  cancel: hasFreeCancellation(h) ? 'free cancellation on some rooms' : 'non-refundable',
  image: h.images[0],
});
/** Home's "featured" rail from a catalogue: approved properties first, then featured demo hotels. */
export const featuredFrom = (catalogue) =>
  catalogue.filter((h) => h.isPartnerProperty || h.featured).map(toFeatured);
export const featured = featuredFrom(hotels);

// [day of week, date, avg total in thousands, level] — sample price calendar
export const flexDays = [
  ['Mon', '8', 21.2, 'high'], ['Tue', '9', 19.8, 'typ'], ['Wed', '10', 16.4, 'low'], ['Thu', '11', 17.1, 'low'],
  ['Fri', '12', 18.4, 'typ'], ['Sat', '13', 22.6, 'high'], ['Sun', '14', 20.1, 'typ'], ['Mon', '15', 15.9, 'low'],
  ['Tue', '16', 15.2, 'low'], ['Wed', '17', 16.0, 'low'], ['Thu', '18', 18.9, 'typ'], ['Fri', '19', 23.4, 'high'],
  ['Sat', '20', 24.8, 'high'], ['Sun', '21', 19.5, 'typ'],
];

// ---------- Results ----------
const MAP_POS = [[80, 70], [170, 300], [270, 140], [360, 380], [460, 90], [540, 260]];

export const results = hotels.map((h, i) => {
  const room = cheapestRoom(h);
  const price = priceFor(room.pricePerNight, h.propertyDiscountRate);
  return {
    id: h.slug,
    name: h.name,
    type: `${h.propertyType} · ${h.stars}-star`,
    place: `${placeOf(h)} · ${h.distance}`,
    search: `${h.name} ${h.location.city} ${h.location.region} ${h.location.country}`.toLowerCase(),
    propertyType: h.propertyType,
    amenities: h.amenities,
    score: h.rating,
    word: ratingWord(h.rating),
    reviews: h.reviewCount,
    quote: h.reviews[0]?.body ?? h.description,
    tags: h.tags,
    refundable: hasFreeCancellation(h),
    cancel: hasFreeCancellation(h) ? 'Free cancellation on some rooms' : 'Non-refundable',
    total: price.total,
    nightly: room.pricePerNight,
    image: h.images[0],
    photos: h.images.length,
    mapPos: MAP_POS[i % MAP_POS.length],
  };
});

export const priceRange = [Math.min(...results.map((r) => r.total)), Math.max(...results.map((r) => r.total))];

export const filterOptions = amenityFilters
  .map((a) => [a, hotels.filter((h) => h.amenities.includes(a)).length])
  .filter(([, n]) => n > 0);

export const propertyTypes = propertyTypeFilters.filter((t) => hotels.some((h) => h.propertyType === t));

export const specialRequests = ['Early check-in', 'Quiet room', 'Extra pillows', 'Vegetarian breakfast', 'Airport pickup'];
