// Ported from pms-ota/src/context/BookingProvider.tsx (types removed, logic unchanged).
import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultSearch } from "../utils/date";
import {
  BookingContext,
  emptyCheckout,
  emptyGuest
} from "./booking-context";
const STORAGE_KEY = "triponx.booking.v1";
function createInitialState() {
  const fallback = {
    search: defaultSearch(),
    selectedHotel: null,
    selectedRoom: null,
    guest: emptyGuest,
    checkout: emptyCheckout,
    confirmation: null
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      search: { ...fallback.search, ...parsed.search ?? {} },
      selectedHotel: parsed.selectedHotel ?? null,
      selectedRoom: parsed.selectedRoom ?? null,
      guest: {
        ...emptyGuest,
        ...parsed.guest ?? {},
        additionalGuests: parsed.guest?.additionalGuests ?? []
      },
      checkout: {
        ...emptyCheckout,
        ...parsed.checkout ?? {},
        addons: parsed.checkout?.addons ?? []
      },
      confirmation: parsed.confirmation ?? null
    };
  } catch {
    return fallback;
  }
}
function BookingProvider({ children }) {
  const [state, setState] = useState(createInitialState);
  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
    }
  }, [state]);
  const updateSearch = useCallback((patch) => {
    setState((current) => ({ ...current, search: { ...current.search, ...patch } }));
  }, []);
  const selectRoom = useCallback((hotel, room) => {
    setState((current) => ({
      ...current,
      selectedHotel: hotel,
      selectedRoom: room,
      confirmation: null
    }));
  }, []);
  const clearRoom = useCallback(() => {
    setState((current) => ({ ...current, selectedHotel: null, selectedRoom: null }));
  }, []);
  const updateGuest = useCallback((patch) => {
    setState((current) => ({ ...current, guest: { ...current.guest, ...patch } }));
  }, []);
  const updateCheckout = useCallback((patch) => {
    setState((current) => ({ ...current, checkout: { ...current.checkout, ...patch } }));
  }, []);
  const setConfirmation = useCallback((booking) => {
    setState((current) => ({ ...current, confirmation: booking }));
  }, []);
  const resetBooking = useCallback(() => {
    setState((current) => ({
      ...current,
      selectedHotel: null,
      selectedRoom: null,
      guest: emptyGuest,
      checkout: emptyCheckout,
      confirmation: null
    }));
  }, []);
  const value = useMemo(
    () => ({
      ...state,
      updateSearch,
      selectRoom,
      clearRoom,
      updateGuest,
      updateCheckout,
      setConfirmation,
      resetBooking,
      hasStaySelected: Boolean(state.selectedHotel && state.selectedRoom)
    }),
    [
      state,
      updateSearch,
      selectRoom,
      clearRoom,
      updateGuest,
      updateCheckout,
      setConfirmation,
      resetBooking
    ]
  );
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
export {
  BookingProvider
};
