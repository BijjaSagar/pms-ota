// Ported from pms-ota/src/context/useBooking.ts (types removed, logic unchanged).
import { useContext } from "react";
import { BookingContext } from "./booking-context";
function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
export {
  useBooking
};
