// Ported from pms-ota/src/utils/pricing.ts (types removed, logic unchanged).
import { nightsBetween } from "./date";
const TAX_RATE = 0.12;
const SERVICE_FEE_RATE = 0.04;
function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}
function calculatePrice(room, checkIn, checkOut, options = {}) {
  const nights = nightsBetween(checkIn, checkOut);
  const rooms = options.rooms ?? 1;
  const nightlyRate = room.pricePerNight;
  const roomTotal = nightlyRate * nights * rooms;
  const propertyDiscount = Math.round(roomTotal * (options.propertyDiscountRate ?? 0));
  const priceAfterDiscount = roomTotal - propertyDiscount;
  const addonsTotal = options.addonsTotal ?? 0;
  const taxable = priceAfterDiscount + addonsTotal;
  const taxes = Math.round(taxable * TAX_RATE);
  const serviceFee = Math.round(taxable * SERVICE_FEE_RATE);
  const couponDiscount = Math.min(
    options.coupon?.amount ?? 0,
    taxable + taxes + serviceFee
  );
  return {
    nights,
    rooms,
    nightlyRate,
    roomTotal,
    propertyDiscount,
    priceAfterDiscount,
    addonsTotal,
    couponCode: options.coupon?.code,
    couponDiscount,
    taxes,
    serviceFee,
    total: Math.max(0, taxable + taxes + serviceFee - couponDiscount)
  };
}
export {
  SERVICE_FEE_RATE,
  TAX_RATE,
  calculatePrice,
  formatCurrency
};
