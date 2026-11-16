import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  Booking,
  CheckoutExtras,
  GuestDetails,
  Hotel,
  Room,
  SearchParams,
} from '../types'
import { defaultSearch } from '../utils/date'
import {
  BookingContext,
  emptyCheckout,
  emptyGuest,
  type BookingContextValue,
  type BookingState,
} from './booking-context'

const STORAGE_KEY = 'aurelia.booking.v1'

function createInitialState(): BookingState {
  const fallback: BookingState = {
    search: defaultSearch(),
    selectedHotel: null,
    selectedRoom: null,
    guest: emptyGuest,
    checkout: emptyCheckout,
    confirmation: null,
  }

  if (typeof window === 'undefined') return fallback

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<BookingState>
    return {
      search: { ...fallback.search, ...(parsed.search ?? {}) },
      selectedHotel: parsed.selectedHotel ?? null,
      selectedRoom: parsed.selectedRoom ?? null,
      guest: {
        ...emptyGuest,
        ...(parsed.guest ?? {}),
        additionalGuests: parsed.guest?.additionalGuests ?? [],
      },
      checkout: {
        ...emptyCheckout,
        ...(parsed.checkout ?? {}),
        addons: parsed.checkout?.addons ?? [],
      },
      confirmation: parsed.confirmation ?? null,
    }
  } catch {
    return fallback
  }
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BookingState>(createInitialState)

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Storage can be unavailable in private mode; the flow still works in memory.
    }
  }, [state])

  const updateSearch = useCallback((patch: Partial<SearchParams>) => {
    setState((current) => ({ ...current, search: { ...current.search, ...patch } }))
  }, [])

  const selectRoom = useCallback((hotel: Hotel, room: Room) => {
    setState((current) => ({
      ...current,
      selectedHotel: hotel,
      selectedRoom: room,
      confirmation: null,
    }))
  }, [])

  const clearRoom = useCallback(() => {
    setState((current) => ({ ...current, selectedHotel: null, selectedRoom: null }))
  }, [])

  const updateGuest = useCallback((patch: Partial<GuestDetails>) => {
    setState((current) => ({ ...current, guest: { ...current.guest, ...patch } }))
  }, [])

  const updateCheckout = useCallback((patch: Partial<CheckoutExtras>) => {
    setState((current) => ({ ...current, checkout: { ...current.checkout, ...patch } }))
  }, [])

  const setConfirmation = useCallback((booking: Booking) => {
    setState((current) => ({ ...current, confirmation: booking }))
  }, [])

  const resetBooking = useCallback(() => {
    setState((current) => ({
      ...current,
      selectedHotel: null,
      selectedRoom: null,
      guest: emptyGuest,
      checkout: emptyCheckout,
      confirmation: null,
    }))
  }, [])

  const value = useMemo<BookingContextValue>(
    () => ({
      ...state,
      updateSearch,
      selectRoom,
      clearRoom,
      updateGuest,
      updateCheckout,
      setConfirmation,
      resetBooking,
      hasStaySelected: Boolean(state.selectedHotel && state.selectedRoom),
    }),
    [
      state,
      updateSearch,
      selectRoom,
      clearRoom,
      updateGuest,
      updateCheckout,
      setConfirmation,
      resetBooking,
    ],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}
