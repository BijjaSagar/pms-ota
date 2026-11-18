// Ported from pms-ota/src/utils/booking.ts (types removed, logic unchanged).
import { generateReference } from "./validation";
function createBooking({
  hotel,
  room,
  search,
  guest,
  price,
  paymentLast4,
  addons,
  earlyCheckIn,
  lateCheckOut,
  couponCode,
  paymentMode
}) {
  return {
    reference: generateReference(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    hotel,
    room,
    search,
    guest,
    price,
    paymentLast4,
    email: guest.email,
    addons,
    earlyCheckIn,
    lateCheckOut,
    couponCode,
    paymentMode
  };
}
export {
  createBooking
};
