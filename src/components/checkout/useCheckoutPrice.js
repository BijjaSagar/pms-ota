// Shared price maths for checkout & payment — same rules as pms-ota's CheckoutPage/PaymentPage:
// room total → property discount → add-ons (incl. early/late) → coupon (on spend after discount) → taxes & fees.
import { EARLY_CHECK_IN_ID, LATE_CHECK_OUT_ID, calculateAddonsTotal, selectedAddons } from '../../lib/data/addons.js';
import { couponDiscount, findCoupon } from '../../lib/data/offers.js';
import { nightsBetween } from '../../lib/utils/date.js';
import { calculatePrice } from '../../lib/utils/pricing.js';

export function computeCheckoutPrice({ hotel, room, search, addonIds, earlyCheckIn, lateCheckOut, couponCode }) {
  const nights = nightsBetween(search.checkIn, search.checkOut);
  const guests = search.adults + search.kids;
  const activeAddonIds = [...addonIds, ...(earlyCheckIn ? [EARLY_CHECK_IN_ID] : []), ...(lateCheckOut ? [LATE_CHECK_OUT_ID] : [])];
  const addonsTotal = calculateAddonsTotal(activeAddonIds, nights, guests);
  const bookingAddons = selectedAddons(activeAddonIds, nights, guests);
  const roomTotal = room.pricePerNight * nights * search.rooms;
  const propertyDiscount = Math.round(roomTotal * (hotel.propertyDiscountRate ?? 0));
  const spendForCoupon = roomTotal - propertyDiscount + addonsTotal;
  const foundCoupon = couponCode ? findCoupon(couponCode) : undefined;
  const couponAmount = foundCoupon ? couponDiscount(foundCoupon, spendForCoupon) : 0;
  const price = calculatePrice(room, search.checkIn, search.checkOut, {
    rooms: search.rooms,
    propertyDiscountRate: hotel.propertyDiscountRate ?? 0,
    addonsTotal,
    coupon: foundCoupon && couponAmount > 0 ? { code: foundCoupon.code, amount: couponAmount } : null,
  });
  return { nights, guests, price, bookingAddons, spendForCoupon, foundCoupon };
}
