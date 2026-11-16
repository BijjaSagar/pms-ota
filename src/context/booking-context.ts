import { createContext } from 'react'
import type {
  Booking,
  CheckoutExtras,
  GuestDetails,
  Hotel,
  Room,
  SearchParams,
} from '../types'

export interface BookingState {
  search: SearchParams
  selectedHotel: Hotel | null
  selectedRoom: Room | null
  guest: GuestDetails
  checkout: CheckoutExtras
  confirmation: Booking | null
}

export interface BookingContextValue extends BookingState {
  updateSearch: (patch: Partial<SearchParams>) => void
  selectRoom: (hotel: Hotel, room: Room) => void
  clearRoom: () => void
  updateGuest: (patch: Partial<GuestDetails>) => void
  updateCheckout: (patch: Partial<CheckoutExtras>) => void
  setConfirmation: (booking: Booking) => void
  resetBooking: () => void
  hasStaySelected: boolean
}

export const emptyGuest: GuestDetails = {
  title: 'Mr',
  firstName: '',
  lastName: '',
  guestType: 'self',
  email: '',
  phone: '',
  country: 'United States',
  specialRequests: '',
  arrivalTime: '3:00 PM – 4:00 PM',
  gstNumber: '',
  gstBusinessName: '',
  additionalGuests: [],
}

export const emptyCheckout: CheckoutExtras = {
  addons: [],
  earlyCheckIn: false,
  lateCheckOut: false,
  couponCode: '',
  paymentMode: 'now',
}

export const BookingContext = createContext<BookingContextValue | null>(null)
