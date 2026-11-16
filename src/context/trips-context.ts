import { createContext } from 'react'
import type { Booking } from '../types'

export interface TripsContextValue {
  bookings: Booking[]
  getBooking: (reference: string) => Booking | undefined
  addBooking: (booking: Booking) => void
  cancelBooking: (reference: string) => void
}

export const TripsContext = createContext<TripsContextValue | null>(null)
