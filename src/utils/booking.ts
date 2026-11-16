import type {
  Booking,
  BookingAddon,
  GuestDetails,
  Hotel,
  PaymentMode,
  PriceBreakdown,
  Room,
  SearchParams,
} from '../types'
import { generateReference } from './validation'

interface CreateBookingInput {
  hotel: Hotel
  room: Room
  search: SearchParams
  guest: GuestDetails
  price: PriceBreakdown
  paymentLast4: string
  addons: BookingAddon[]
  earlyCheckIn: boolean
  lateCheckOut: boolean
  couponCode: string
  paymentMode: PaymentMode
}

export function createBooking({
  hotel,
  room,
  search,
  guest,
  price,
  paymentLast4,
  addons,
  earlyCheckIn,
  lateCheckOut,
  couponCode,
  paymentMode,
}: CreateBookingInput): Booking {
  return {
    reference: generateReference(),
    createdAt: new Date().toISOString(),
    hotel,
    room,
    search,
    guest,
    price,
    paymentLast4,
    email: guest.email,
    addons,
    earlyCheckIn,
    lateCheckOut,
    couponCode,
    paymentMode,
  }
}
