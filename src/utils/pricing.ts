import type { PriceBreakdown, Room } from '../types'
import { nightsBetween } from './date'

export const TAX_RATE = 0.12
export const SERVICE_FEE_RATE = 0.04

export interface AppliedCoupon {
  code: string
  amount: number
}

export interface PriceOptions {
  rooms?: number
  propertyDiscountRate?: number
  addonsTotal?: number
  coupon?: AppliedCoupon | null
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function calculatePrice(
  room: Pick<Room, 'pricePerNight'>,
  checkIn: string,
  checkOut: string,
  options: PriceOptions = {},
): PriceBreakdown {
  const nights = nightsBetween(checkIn, checkOut)
  const rooms = options.rooms ?? 1
  const nightlyRate = room.pricePerNight
  const roomTotal = nightlyRate * nights * rooms
  const propertyDiscount = Math.round(roomTotal * (options.propertyDiscountRate ?? 0))
  const priceAfterDiscount = roomTotal - propertyDiscount
  const addonsTotal = options.addonsTotal ?? 0
  const taxable = priceAfterDiscount + addonsTotal
  const taxes = Math.round(taxable * TAX_RATE)
  const serviceFee = Math.round(taxable * SERVICE_FEE_RATE)
  const couponDiscount = Math.min(
    options.coupon?.amount ?? 0,
    taxable + taxes + serviceFee,
  )

  return {
    nights,
    rooms,
    nightlyRate,
    roomTotal,
    propertyDiscount,
    priceAfterDiscount,
    addonsTotal,
    couponCode: options.coupon?.code,
    couponDiscount,
    taxes,
    serviceFee,
    total: Math.max(0, taxable + taxes + serviceFee - couponDiscount),
  }
}
