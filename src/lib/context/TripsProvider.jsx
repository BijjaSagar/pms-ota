// Ported from pms-ota/src/context/TripsProvider.tsx (types removed, logic unchanged).
import { useCallback, useEffect, useMemo, useState } from "react";
import { TripsContext } from "./trips-context";
import { TRAVELLER_SIGNED_OUT } from "./auth-events.js";
const STORAGE_KEY = "triponx.trips.v1";
function isBooking(value) {
  if (!value || typeof value !== "object") return false;
  const booking = value;
  return typeof booking.reference === "string" && Boolean(booking.hotel && booking.search);
}
function createInitialBookings() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBooking);
  } catch {
    return [];
  }
}
function TripsProvider({ children }) {
  const [bookings, setBookings] = useState(createInitialBookings);
  useEffect(() => {
    try {
      if (bookings.length) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
    }
  }, [bookings]);
  const getBooking = useCallback(
    (reference) => bookings.find((booking) => booking.reference === reference),
    [bookings]
  );
  const addBooking = useCallback((booking) => {
    setBookings(
      (current) => current.some((entry) => entry.reference === booking.reference) ? current : [booking, ...current]
    );
  }, []);
  const cancelBooking = useCallback((reference) => {
    setBookings((current) => current.filter((booking) => booking.reference !== reference));
  }, []);
  // Traveller signed out (here, in another tab, or the session ended): their trips leave this browser.
  useEffect(() => {
    const clear = () => {
      setBookings([]);
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* storage blocked */ }
    };
    window.addEventListener(TRAVELLER_SIGNED_OUT, clear);
    return () => window.removeEventListener(TRAVELLER_SIGNED_OUT, clear);
  }, []);
  const value = useMemo(
    () => ({ bookings, getBooking, addBooking, cancelBooking }),
    [bookings, getBooking, addBooking, cancelBooking]
  );
  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}
export {
  TripsProvider
};
