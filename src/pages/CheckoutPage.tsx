import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddonsCard } from '../components/checkout/AddonsCard'
import { CheckoutPriceSummary } from '../components/checkout/CheckoutPriceSummary'
import { GuestDetailsCard, type GuestErrors } from '../components/checkout/GuestDetailsCard'
import { ImportantInfoCard } from '../components/checkout/ImportantInfoCard'
import { PaymentOptionsCard } from '../components/checkout/PaymentOptionsCard'
import { RoomDetailCard } from '../components/checkout/RoomDetailCard'
import { StaySummaryCard } from '../components/checkout/StaySummaryCard'
import { EmptyBookingState } from '../components/booking/EmptyBookingState'
import { Stepper } from '../components/ui/Stepper'
import { useBooking } from '../context/useBooking'
import {
  EARLY_CHECK_IN_ID,
  LATE_CHECK_OUT_ID,
  calculateAddonsTotal,
  getAddon,
  selectedAddons,
} from '../data/addons'
import { couponDiscount, findCoupon } from '../data/offers'
import type { AdditionalGuest, GuestDetails, PaymentMode } from '../types'
import { createBooking } from '../utils/booking'
import { formatDate, nightsBetween } from '../utils/date'
import { calculatePrice, formatCurrency } from '../utils/pricing'
import { isValidEmail, isValidPhone } from '../utils/validation'

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export function CheckoutPage() {
  const navigate = useNavigate()
  const {
    search,
    selectedHotel,
    selectedRoom,
    guest,
    checkout,
    updateGuest,
    updateCheckout,
    setConfirmation,
  } = useBooking()

  const [form, setForm] = useState<GuestDetails>(guest)
  const [errors, setErrors] = useState<GuestErrors>({})
  const [addonIds, setAddonIds] = useState<string[]>(checkout.addons)
  const [earlyCheckIn, setEarlyCheckIn] = useState(checkout.earlyCheckIn)
  const [lateCheckOut, setLateCheckOut] = useState(checkout.lateCheckOut)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(checkout.paymentMode)
  const [couponInput, setCouponInput] = useState(checkout.couponCode)
  const [appliedCouponCode, setAppliedCouponCode] = useState(checkout.couponCode)
  const [couponError, setCouponError] = useState('')

  if (!selectedHotel || !selectedRoom) {
    return <EmptyBookingState />
  }

  const nights = nightsBetween(search.checkIn, search.checkOut)
  const guests = search.adults + search.kids
  const earlyCheckInPrice = getAddon(EARLY_CHECK_IN_ID)?.price ?? 0
  const lateCheckOutPrice = getAddon(LATE_CHECK_OUT_ID)?.price ?? 0

  const activeAddonIds = [
    ...addonIds,
    ...(earlyCheckIn ? [EARLY_CHECK_IN_ID] : []),
    ...(lateCheckOut ? [LATE_CHECK_OUT_ID] : []),
  ]
  const addonsTotal = calculateAddonsTotal(activeAddonIds, nights, guests)
  const bookingAddons = selectedAddons(activeAddonIds, nights, guests)

  const roomTotal = selectedRoom.pricePerNight * nights * search.rooms
  const propertyDiscount = Math.round(
    roomTotal * (selectedHotel.propertyDiscountRate ?? 0),
  )
  const spendForCoupon = roomTotal - propertyDiscount + addonsTotal
  const foundCoupon = appliedCouponCode ? findCoupon(appliedCouponCode) : undefined
  const couponAmount = foundCoupon ? couponDiscount(foundCoupon, spendForCoupon) : 0

  const price = calculatePrice(selectedRoom, search.checkIn, search.checkOut, {
    rooms: search.rooms,
    propertyDiscountRate: selectedHotel.propertyDiscountRate ?? 0,
    addonsTotal,
    coupon:
      foundCoupon && couponAmount > 0
        ? { code: foundCoupon.code, amount: couponAmount }
        : null,
  })

  const setField = <K extends keyof GuestDetails>(key: K, value: GuestDetails[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const updateAdditionalGuest = (id: string, patch: Partial<AdditionalGuest>) => {
    setForm((current) => ({
      ...current,
      additionalGuests: current.additionalGuests.map((additionalGuest) =>
        additionalGuest.id === id ? { ...additionalGuest, ...patch } : additionalGuest,
      ),
    }))
    setErrors((current) => ({ ...current, additionalGuests: undefined }))
  }

  const addGuest = () => {
    setForm((current) => ({
      ...current,
      additionalGuests: [
        ...current.additionalGuests,
        {
          id:
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `guest-${Date.now()}`,
          title: 'Mr',
          firstName: '',
          lastName: '',
        },
      ],
    }))
  }

  const removeGuest = (id: string) => {
    setForm((current) => ({
      ...current,
      additionalGuests: current.additionalGuests.filter(
        (additionalGuest) => additionalGuest.id !== id,
      ),
    }))
  }

  const toggleAddon = (id: string) => {
    setAddonIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const applyCoupon = () => {
    const coupon = findCoupon(couponInput)
    if (!coupon) {
      setCouponError('That coupon code is not valid.')
      return
    }
    if (coupon.minSpend && spendForCoupon < coupon.minSpend) {
      setCouponError(
        `This code needs a minimum spend of ${formatCurrency(coupon.minSpend)}.`,
      )
      return
    }
    setCouponError('')
    setCouponInput(coupon.code)
    setAppliedCouponCode(coupon.code)
  }

  const removeCoupon = () => {
    setAppliedCouponCode('')
    setCouponInput('')
    setCouponError('')
  }

  const validate = (): boolean => {
    const next: GuestErrors = {}
    if (!form.firstName.trim()) next.firstName = 'Please enter the guest first name.'
    if (!form.lastName.trim()) next.lastName = 'Please enter the guest last name.'
    if (!form.email.trim()) next.email = 'Please enter your email address.'
    else if (!isValidEmail(form.email)) next.email = 'Please enter a valid email address.'
    if (!form.phone.trim()) next.phone = 'Please enter a mobile number.'
    else if (!isValidPhone(form.phone)) next.phone = 'Please enter a valid mobile number.'
    if (form.gstNumber.trim() && !GSTIN_PATTERN.test(form.gstNumber.trim())) {
      next.gstNumber = 'Enter a valid 15-character GSTIN.'
    }
    const incompleteGuest = form.additionalGuests.some(
      (additionalGuest) =>
        !additionalGuest.firstName.trim() || !additionalGuest.lastName.trim(),
    )
    if (incompleteGuest) {
      next.additionalGuests = 'Add a first and last name for every additional guest.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const persistExtras = () => {
    updateGuest(form)
    updateCheckout({
      addons: addonIds,
      earlyCheckIn,
      lateCheckOut,
      couponCode: appliedCouponCode,
      paymentMode,
    })
  }

  const submitBooking = () => {
    if (!validate()) {
      const firstError = document.querySelector('[aria-invalid="true"]')
      if (firstError instanceof HTMLElement) firstError.focus()
      return
    }

    persistExtras()

    if (paymentMode === 'now') {
      navigate('/payment')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const booking = createBooking({
      hotel: selectedHotel,
      room: selectedRoom,
      search,
      guest: form,
      price,
      paymentLast4: 'Pay at property',
      addons: bookingAddons,
      earlyCheckIn,
      lateCheckOut,
      couponCode: price.couponCode ?? '',
      paymentMode: 'later',
    })
    setConfirmation(booking)
    navigate(`/confirmation/${booking.reference}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    submitBooking()
  }

  return (
    <div className="pb-20">
      <div className="border-b border-line bg-white">
        <div className="container-page py-8 lg:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <nav aria-label="Breadcrumb" className="text-xs text-muted">
                <Link to="/hotels" className="transition-colors hover:text-ink">
                  Stays
                </Link>
                <span className="mx-2">/</span>
                <Link
                  to={`/hotels/${selectedHotel.slug}`}
                  className="transition-colors hover:text-ink"
                >
                  {selectedHotel.name}
                </Link>
                <span className="mx-2">/</span>
                <span className="text-ink">Checkout</span>
              </nav>
              <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
                Complete your booking
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                {formatDate(search.checkIn, 'short')} — {formatDate(search.checkOut, 'short')} ·{' '}
                {search.adults} {search.adults === 1 ? 'adult' : 'adults'}
                {search.kids > 0
                  ? `, ${search.kids} ${search.kids === 1 ? 'child' : 'children'}`
                  : ''}{' '}
                · {search.rooms} {search.rooms === 1 ? 'room' : 'rooms'}
              </p>
            </div>
            <Stepper
              steps={['Your stay', 'Guest details', 'Payment', 'Confirmation']}
              current={1}
            />
          </div>
        </div>
      </div>

      <div className="container-page mt-8 lg:mt-10">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
            <div className="order-1 space-y-5">
              <StaySummaryCard
                hotel={selectedHotel}
                search={search}
                earlyCheckIn={earlyCheckIn}
                lateCheckOut={lateCheckOut}
                earlyCheckInPrice={earlyCheckInPrice}
                lateCheckOutPrice={lateCheckOutPrice}
                onToggleEarlyCheckIn={setEarlyCheckIn}
                onToggleLateCheckOut={setLateCheckOut}
              />

              <RoomDetailCard
                hotel={selectedHotel}
                room={selectedRoom}
                checkIn={search.checkIn}
              />

              <AddonsCard
                selected={addonIds}
                nights={nights}
                guests={guests}
                onToggle={toggleAddon}
              />

              <ImportantInfoCard hotel={selectedHotel} />

              <GuestDetailsCard
                form={form}
                errors={errors}
                onChange={setField}
                onAddGuest={addGuest}
                onRemoveGuest={removeGuest}
                onChangeGuest={updateAdditionalGuest}
                maxGuests={selectedRoom.maxGuests}
              />

              <PaymentOptionsCard
                mode={paymentMode}
                onChange={setPaymentMode}
                total={formatCurrency(price.total)}
              />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to={`/hotels/${selectedHotel.slug}`}
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to the hotel
                </Link>
                <p className="flex items-center justify-center gap-2 text-[0.65rem] text-muted sm:justify-end">
                  <LockKeyhole className="size-3.5 text-success" aria-hidden="true" />
                  Your details are encrypted and only shared with the property.
                </p>
              </div>
            </div>

            <aside className="order-2">
              <div className="sticky top-24 space-y-4">
                <CheckoutPriceSummary
                  price={price}
                  addons={bookingAddons}
                  couponInput={couponInput}
                  couponError={couponError}
                  appliedCouponLabel={foundCoupon?.label}
                  paymentMode={paymentMode}
                  onCouponInputChange={(value) => {
                    setCouponInput(value)
                    setCouponError('')
                  }}
                  onApplyCoupon={applyCoupon}
                  onRemoveCoupon={removeCoupon}
                  onConfirmBooking={submitBooking}
                />

                <div className="flex items-start gap-2 rounded-xl bg-[#eef4ef] p-3 text-[0.7rem] leading-relaxed text-success">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    {selectedRoom.refundable
                      ? 'This rate includes free cancellation. Review the policy before you pay.'
                      : 'This is a non-refundable rate. The full amount is charged at booking.'}
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </form>
      </div>
    </div>
  )
}
