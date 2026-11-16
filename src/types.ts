export type PropertyType = 'Resort' | 'Boutique' | 'Villa' | 'Ryokan' | 'City Hotel'

export type HighlightIcon =
  | 'sparkles'
  | 'waves'
  | 'leaf'
  | 'utensils'
  | 'mountain'
  | 'sun'
  | 'wine'
  | 'flower'

export interface Highlight {
  title: string
  description: string
  icon: HighlightIcon
}

export interface Room {
  id: string
  name: string
  description: string
  pricePerNight: number
  size: number
  bed: string
  maxGuests: number
  amenities: string[]
  image: string
  refundable: boolean
  breakfast: boolean
  remaining: number
}

export interface Review {
  id: string
  name: string
  country: string
  initials: string
  date: string
  rating: number
  title: string
  body: string
  stayType: string
}

export interface HotelPolicies {
  checkIn: string
  checkOut: string
  cancellation: string
  children: string
  pets: string
  houseRules: string[]
}

export interface Hotel {
  id: string
  slug: string
  name: string
  propertyDiscountRate?: number
  tagline: string
  propertyType: PropertyType
  location: {
    city: string
    country: string
    region: string
  }
  address: string
  description: string
  story: string
  images: string[]
  rating: number
  reviewCount: number
  stars: number
  pricePerNight: number
  amenities: string[]
  highlights: Highlight[]
  rooms: Room[]
  reviews: Review[]
  policies: HotelPolicies
  tags: string[]
  featured: boolean
  distance: string
  coordinates: { lat: number; lng: number }
}

export interface Destination {
  slug: string
  city: string
  country: string
  tagline: string
  hotels: number
  image: string
}

export interface SearchParams {
  destination: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  adults: number
  kids: number
}

export interface HotelFilters {
  maxPrice: number
  propertyTypes: PropertyType[]
  amenities: string[]
  minRating: number
  preferences: string[]
  starCategories: number[]
  flexibleCheckInOut: string[]
  houseRules: string[]
  businessEssentials: string[]
}

export type GuestType = 'self' | 'someone'

export interface AdditionalGuest {
  id: string
  title: string
  firstName: string
  lastName: string
}

export interface GuestDetails {
  title: string
  firstName: string
  lastName: string
  guestType: GuestType
  email: string
  phone: string
  country: string
  specialRequests: string
  arrivalTime: string
  gstNumber: string
  gstBusinessName: string
  additionalGuests: AdditionalGuest[]
}

export interface PaymentDetails {
  cardName: string
  cardNumber: string
  expiry: string
  cvc: string
  billingAddress: string
  billingCity: string
  billingPostalCode: string
  billingCountry: string
}

export interface PriceBreakdown {
  nights: number
  rooms: number
  nightlyRate: number
  roomTotal: number
  propertyDiscount: number
  priceAfterDiscount: number
  addonsTotal: number
  couponCode?: string
  couponDiscount: number
  taxes: number
  serviceFee: number
  total: number
}

export type AddonUnit = 'stay' | 'night' | 'person' | 'person-night'

export interface Addon {
  id: string
  name: string
  description: string
  price: number
  unit: AddonUnit
  icon: string
  inAddonList?: boolean
}

export interface BookingAddon {
  id: string
  name: string
  price: number
}

export type PaymentMode = 'now' | 'later'

export interface CheckoutExtras {
  addons: string[]
  earlyCheckIn: boolean
  lateCheckOut: boolean
  couponCode: string
  paymentMode: PaymentMode
}

export interface Booking {
  reference: string
  createdAt: string
  hotel: Hotel
  room: Room
  search: SearchParams
  guest: GuestDetails
  price: PriceBreakdown
  paymentLast4: string
  email: string
  addons: BookingAddon[]
  earlyCheckIn: boolean
  lateCheckOut: boolean
  couponCode: string
  paymentMode: PaymentMode
}

export type Gender = 'Male' | 'Female' | 'Non-binary' | 'Prefer not to say'

export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed' | 'Prefer not to say'

export interface ProfileDocument {
  type: string
  number: string
  expiry: string
  fileName: string
}

export interface UserProfile {
  firstName: string
  middleName: string
  lastName: string
  gender: Gender
  dob: string
  nationality: string
  maritalStatus: MaritalStatus
  cityOfResidence: string
  state: string
  mobileCountryCode: string
  mobile: string
  email: string
  photoUrl: string
  document: ProfileDocument
}

export interface CoTraveller {
  id: string
  firstName: string
  middleName: string
  lastName: string
  gender: Gender
  dob: string
  nationality: string
  relationship: string
  mealPreference: string
  countryName: string
  countryCode: string
  mobile: string
  email: string
}

export type DeviceType = 'mobile' | 'desktop'

export interface LoggedInDevice {
  id: string
  type: DeviceType
  name: string
  loggedIn: boolean
  location: string
  loginTime: string
  current?: boolean
}
