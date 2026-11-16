import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Booking } from '../types'
import { TripsContext, type TripsContextValue } from './trips-context'

const STORAGE_KEY = 'aurelia.trips.v1'

function isBooking(value: unknown): value is Booking {
  if (!value || typeof value !== 'object') return false
  const booking = value as Partial<Booking>
  return typeof booking.reference === 'string' && Boolean(booking.hotel && booking.search)
}

function createInitialBookings(): Booking[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isBooking)
  } catch {
    return []
  }
}

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [bookings, setBookings] = useState<Booking[]>(createInitialBookings)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings))
    } catch {
      // Storage can be unavailable in private mode; trips still work in memory.
    }
  }, [bookings])

  const getBooking = useCallback(
    (reference: string) => bookings.find((booking) => booking.reference === reference),
    [bookings],
  )

  const addBooking = useCallback((booking: Booking) => {
    setBookings((current) =>
      current.some((entry) => entry.reference === booking.reference)
        ? current
        : [booking, ...current],
    )
  }, [])

  const cancelBooking = useCallback((reference: string) => {
    setBookings((current) => current.filter((booking) => booking.reference !== reference))
  }, [])

  const value = useMemo<TripsContextValue>(
    () => ({ bookings, getBooking, addBooking, cancelBooking }),
    [bookings, getBooking, addBooking, cancelBooking],
  )

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>
}
