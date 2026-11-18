// Ported from pms-ota/src/context/booking-context.ts (types removed, logic unchanged).
import { createContext } from "react";
const emptyGuest = {
  title: "Mr",
  firstName: "",
  lastName: "",
  guestType: "self",
  email: "",
  phone: "",
  country: "United States",
  specialRequests: "",
  arrivalTime: "3:00 PM \u2013 4:00 PM",
  gstNumber: "",
  gstBusinessName: "",
  additionalGuests: []
};
const emptyCheckout = {
  addons: [],
  earlyCheckIn: false,
  lateCheckOut: false,
  couponCode: "",
  paymentMode: "now"
};
const BookingContext = createContext(null);
export {
  BookingContext,
  emptyCheckout,
  emptyGuest
};
