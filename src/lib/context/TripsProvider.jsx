// "My trips": the signed-in traveller's bookings, from the backend (GET /me/bookings).
//
// Signed out -> no trips in memory or on screen.
// Signed in  -> the account's bookings load from the API; a new booking (already saved by checkout) is added
//               at once; cancelling asks the API first and only then removes it from the list.
import { useCallback, useEffect, useMemo, useState } from "react";
import { cancelMyBooking, listMyBookings } from "../api/bookings.js";
import { TripsContext } from "./trips-context";
import { useAuth } from "./useAuth.js";

function TripsProvider({ children }) {
  const { travellerId } = useAuth();
  // Bookings and the account they belong to change together, so one account never sees another's trips.
  const [store, setStore] = useState({ account: null, bookings: [], loading: false, error: "" });
  if (store.account !== (travellerId ?? null)) {
    setStore({ account: travellerId ?? null, bookings: [], loading: Boolean(travellerId), error: "" });
  }

  const load = useCallback(async () => {
    if (!travellerId) return;
    setStore((current) => ({ ...current, loading: true, error: "" }));
    try {
      const bookings = await listMyBookings();
      setStore((current) => (current.account === travellerId ? { ...current, bookings, loading: false } : current));
    } catch (problem) {
      setStore((current) => (current.account === travellerId ? { ...current, loading: false, error: problem.message } : current));
    }
  }, [travellerId]);

  useEffect(() => { load(); }, [load]);

  const { bookings, loading, error } = store;
  const getBooking = useCallback(
    (reference) => bookings.find((booking) => booking.reference === reference),
    [bookings]
  );
  /** A booking the checkout has just saved on the server. */
  const addBooking = useCallback((booking) => {
    setStore((current) => (current.bookings.some((entry) => entry.reference === booking.reference)
      ? current
      : { ...current, bookings: [booking, ...current.bookings] }));
  }, []);
  /** Cancels on the server; throws (with the API's message) if it can't be cancelled. */
  const cancelBooking = useCallback(async (reference) => {
    await cancelMyBooking(reference);
    setStore((current) => ({ ...current, bookings: current.bookings.filter((booking) => booking.reference !== reference) }));
  }, []);
  const value = useMemo(
    () => ({ bookings, loading, error, reload: load, getBooking, addBooking, cancelBooking }),
    [bookings, loading, error, load, getBooking, addBooking, cancelBooking]
  );
  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>;
}
export {
  TripsProvider
};
