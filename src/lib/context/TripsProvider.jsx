// Ported from pms-ota/src/context/TripsProvider.tsx; trips are now kept per traveller account.
//
// Until the backend has a bookings API, trips live in this browser under one key per account:
//   triponx.trips.v1.<travellerId>
// Signed out -> no trips in memory or on screen (the next person on this browser sees nothing).
// Signed in  -> that account's own trips load again. Each account only ever sees its own key.
import { useCallback, useEffect, useMemo, useState } from "react";
import { TripsContext } from "./trips-context";
import { useAuth } from "./useAuth.js";

const KEY_PREFIX = "triponx.trips.v1";
const LEGACY_KEY = KEY_PREFIX; // before trips were per account (one shared list)

function isBooking(value) {
  if (!value || typeof value !== "object") return false;
  const booking = value;
  return typeof booking.reference === "string" && Boolean(booking.hotel && booking.search);
}

function readList(key) {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isBooking) : [];
  } catch {
    return [];
  }
}

function loadTrips(key) {
  if (!key || typeof window === "undefined") return [];
  const own = readList(key);
  // One-time move of the old shared list into the first account that signs in on this browser.
  const legacy = readList(LEGACY_KEY);
  if (!legacy.length) return own;
  try { window.localStorage.removeItem(LEGACY_KEY); } catch { /* storage blocked */ }
  const known = new Set(own.map((b) => b.reference));
  return [...own, ...legacy.filter((b) => !known.has(b.reference))];
}

function TripsProvider({ children }) {
  const { travellerId } = useAuth();
  const key = travellerId ? `${KEY_PREFIX}.${travellerId}` : null;
  // Bookings and the key they belong to change together, so one account's trips are never saved under another's.
  const [store, setStore] = useState(() => ({ key, bookings: loadTrips(key) }));
  if (store.key !== key) setStore({ key, bookings: loadTrips(key) }); // signed in / out / switched account

  useEffect(() => {
    if (!store.key) return; // signed out: nothing to save, and the account's saved trips stay for its next sign-in
    try {
      if (store.bookings.length) window.localStorage.setItem(store.key, JSON.stringify(store.bookings));
      else window.localStorage.removeItem(store.key);
    } catch {
      // storage blocked — trips last until reload
    }
  }, [store]);

  const { bookings } = store;
  const getBooking = useCallback(
    (reference) => bookings.find((booking) => booking.reference === reference),
    [bookings]
  );
  const addBooking = useCallback((booking) => {
    setStore((current) => (current.bookings.some((entry) => entry.reference === booking.reference)
      ? current
      : { ...current, bookings: [booking, ...current.bookings] }));
  }, []);
  const cancelBooking = useCallback((reference) => {
    setStore((current) => ({ ...current, bookings: current.bookings.filter((booking) => booking.reference !== reference) }));
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
