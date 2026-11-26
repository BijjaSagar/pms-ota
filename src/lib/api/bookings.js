// Bookings API.
//   Traveller ("My trips"):  POST/GET /me/bookings, POST /me/bookings/:reference/cancel
//   Partner Hub (Bookings):  GET /partner/properties/:id/bookings, POST …/:reference/:action
//
// A booking for an approved Partner Hub property is checked and priced by the server: if the total the
// guest saw no longer matches (price changed, coupon expired …) it answers 409, and a sold-out room is
// also 409. "Pay now" bookings stay "pending_payment" until a real payment gateway confirms them.
import { partnerApi, travellerApi } from '../context/AuthProvider.jsx';

// ---------- traveller ----------

/** What a booking keeps of the hotel: only what My trips / confirmation / calendar show (stays small). */
export const hotelSnapshot = (hotel) => ({
  id: hotel.id,
  slug: hotel.slug,
  name: hotel.name,
  propertyType: hotel.propertyType,
  stars: hotel.stars,
  rating: hotel.rating,
  reviewCount: hotel.reviewCount,
  location: hotel.location,
  address: hotel.address,
  coordinates: hotel.coordinates ?? null,
  images: (hotel.images ?? []).slice(0, 3),
  policies: hotel.policies,
  propertyDiscountRate: hotel.propertyDiscountRate ?? 0,
});

/**
 * Saves a booking built by the checkout and returns the booking to show: the local object merged with what
 * the server stored (reference, status, payment status, server price and names).
 */
export async function saveBooking(local) {
  const saved = await travellerApi.post('/me/bookings', toBookingBody({ ...local, hotel: hotelSnapshot(local.hotel) }));
  return fromApi({ ...local, ...saved, hotel: { ...local.hotel, ...saved.hotel }, room: { ...local.room, ...saved.room } });
}

/** A booking from the API as the screens use it (search.guests is derived, not stored). */
export const fromApi = (booking) => ({
  ...booking,
  search: { ...booking.search, guests: (booking.search?.adults ?? 0) + (booking.search?.kids ?? 0) },
});

/** The body POST /me/bookings expects, from the booking object the checkout builds. */
function toBookingBody({ hotel, room, search, guest, price, paymentLast4, addons, earlyCheckIn, lateCheckOut, couponCode, paymentMode }) {
  return {
    paymentMode,
    search: {
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      rooms: search.rooms,
      adults: search.adults,
      kids: search.kids,
    },
    hotel,
    room,
    guest,
    price,
    addons: (addons ?? []).map(({ id, name, price: amount }) => ({ id, name, price: amount })),
    earlyCheckIn: Boolean(earlyCheckIn),
    lateCheckOut: Boolean(lateCheckOut),
    ...(couponCode ? { couponCode } : {}),
    ...(paymentMode === 'now' && paymentLast4 ? { paymentLast4 } : {}),
  };
}

export const listMyBookings = async () => (await travellerApi.get('/me/bookings')).map(fromApi);
export const cancelMyBooking = (reference) =>
  travellerApi.post(`/me/bookings/${encodeURIComponent(reference)}/cancel`);

// ---------- partner ----------

const partnerBase = (propertyId) => `/partner/properties/${encodeURIComponent(propertyId)}/bookings`;

/** { bookings, stats } for one of the partner's properties. */
export const listPropertyBookings = (propertyId) => partnerApi.get(partnerBase(propertyId));

/** action: 'check-in' | 'check-out' | 'no-show' | 'cancel' (cancel needs a reason). Returns the updated booking. */
export const bookingAction = (propertyId, reference, action, reason) =>
  partnerApi.post(`${partnerBase(propertyId)}/${encodeURIComponent(reference)}/${action}`, reason ? { reason } : {});
