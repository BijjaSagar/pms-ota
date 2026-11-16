import {
  ArrowLeft,
  CreditCard,
  Landmark,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BookingSummary } from '../components/booking/BookingSummary'
import { EmptyBookingState } from '../components/booking/EmptyBookingState'
import { PriceBreakdown } from '../components/booking/PriceBreakdown'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Field'
import { Stepper } from '../components/ui/Stepper'
import { useBooking } from '../context/useBooking'
import { useTrips } from '../context/useTrips'
import {
  EARLY_CHECK_IN_ID,
  LATE_CHECK_OUT_ID,
  calculateAddonsTotal,
  selectedAddons,
} from '../data/addons'
import { couponDiscount, findCoupon } from '../data/offers'
import type { PaymentDetails } from '../types'
import { createBooking } from '../utils/booking'
import { cn } from '../utils/cn'
import { nightsBetween } from '../utils/date'
import { calculatePrice, formatCurrency } from '../utils/pricing'
import {
  cardDigits,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  isValidCardNumber,
  isValidCvc,
  isValidExpiry,
} from '../utils/validation'

const countries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'France',
  'Germany',
  'Italy',
  'Spain',
  'Netherlands',
  'Japan',
  'Singapore',
  'United Arab Emirates',
  'India',
  'Brazil',
  'South Africa',
]

type PaymentMethod = 'card' | 'paypal'
type PaymentErrors = Partial<Record<keyof PaymentDetails | 'terms', string>>

export function PaymentPage() {
  const navigate = useNavigate()
  const { search, selectedHotel, selectedRoom, guest, checkout, setConfirmation } = useBooking()
  const { addBooking } = useTrips()
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [processing, setProcessing] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [errors, setErrors] = useState<PaymentErrors>({})
  const [form, setForm] = useState<PaymentDetails>({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    billingAddress: '',
    billingCity: '',
    billingPostalCode: '',
    billingCountry: guest.country || 'United States',
  })

  if (!selectedHotel || !selectedRoom) {
    return <EmptyBookingState />
  }

  if (!guest.firstName || !guest.email) {
    return <Navigate to="/checkout" replace />
  }

  const nights = nightsBetween(search.checkIn, search.checkOut)
  const guests = search.adults + search.kids
  const activeAddonIds = [
    ...checkout.addons,
    ...(checkout.earlyCheckIn ? [EARLY_CHECK_IN_ID] : []),
    ...(checkout.lateCheckOut ? [LATE_CHECK_OUT_ID] : []),
  ]
  const addonsTotal = calculateAddonsTotal(activeAddonIds, nights, guests)
  const bookingAddons = selectedAddons(activeAddonIds, nights, guests)
  const roomTotal = selectedRoom.pricePerNight * nights * search.rooms
  const propertyDiscount = Math.round(roomTotal * (selectedHotel.propertyDiscountRate ?? 0))
  const spendForCoupon = roomTotal - propertyDiscount + addonsTotal
  const foundCoupon = checkout.couponCode ? findCoupon(checkout.couponCode) : undefined
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
  const brand = detectCardBrand(form.cardNumber)

  const setField = <K extends keyof PaymentDetails>(key: K, value: PaymentDetails[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  const validate = (): boolean => {
    const next: PaymentErrors = {}

    if (method === 'card') {
      if (!form.cardName.trim()) next.cardName = 'Enter the name on the card.'
      if (!isValidCardNumber(form.cardNumber)) next.cardNumber = 'Enter a valid card number.'
      if (!isValidExpiry(form.expiry)) next.expiry = 'Enter a valid future expiry date.'
      if (!isValidCvc(form.cvc)) next.cvc = 'Enter the 3 or 4 digit security code.'
      if (!form.billingAddress.trim()) next.billingAddress = 'Enter your billing address.'
      if (!form.billingCity.trim()) next.billingCity = 'Enter your billing city.'
      if (!form.billingPostalCode.trim()) next.billingPostalCode = 'Enter your postal code.'
      if (!form.billingCountry) next.billingCountry = 'Choose a billing country.'
    }

    if (!acceptedTerms) next.terms = 'Please accept the booking terms to continue.'
    setErrors(next)

    if (Object.keys(next).length > 0) {
      const firstError = document.querySelector('[aria-invalid="true"]')
      if (firstError instanceof HTMLElement) firstError.focus()
    }
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (processing || !validate()) return

    setProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))

    const booking = createBooking({
      hotel: selectedHotel,
      room: selectedRoom,
      search,
      guest,
      price,
      paymentLast4: method === 'card' ? cardDigits(form.cardNumber).slice(-4) : 'PayPal',
      addons: bookingAddons,
      earlyCheckIn: checkout.earlyCheckIn,
      lateCheckOut: checkout.lateCheckOut,
      couponCode: price.couponCode ?? '',
      paymentMode: 'now',
    })

    setConfirmation(booking)
    addBooking(booking)
    navigate(`/confirmation/${booking.reference}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setProcessing(false)
  }

  return (
    <div className="pb-20">
      <div className="border-b border-line bg-white">
        <div className="container-page py-8 lg:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <nav aria-label="Breadcrumb" className="text-xs text-muted">
                <Link to={`/hotels/${selectedHotel.slug}`} className="transition-colors hover:text-ink">
                  {selectedHotel.name}
                </Link>
                <span className="mx-2">/</span>
                <Link to="/checkout" className="transition-colors hover:text-ink">
                  Checkout
                </Link>
                <span className="mx-2">/</span>
                <span className="text-ink">Payment</span>
              </nav>
              <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
                Secure payment
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
                <LockKeyhole className="size-3.5 text-success" aria-hidden="true" />
                Encrypted and protected. This is a demo — no card is charged.
              </p>
            </div>
            <Stepper steps={['Your stay', 'Guest details', 'Payment', 'Confirmation']} current={2} />
          </div>
        </div>
      </div>

      <div className="container-page mt-8 lg:mt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
          <form onSubmit={handleSubmit} noValidate className="order-2 lg:order-1">
            <section className="rounded-2xl border border-line bg-white p-5 sm:p-7">
              <h2 className="font-display text-2xl text-ink">How would you like to pay?</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2" role="tablist" aria-label="Payment method">
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === 'card'}
                  aria-controls="card-panel"
                  onClick={() => {
                    setMethod('card')
                    setErrors({})
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-4 text-left transition',
                    method === 'card'
                      ? 'border-brand bg-brand-soft/60 ring-1 ring-brand/20'
                      : 'border-line bg-white hover:border-ink/20',
                  )}
                >
                  <CreditCard className="size-5 text-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-ink">Credit or debit card</p>
                    <p className="text-xs text-muted">Visa, Mastercard, Amex</p>
                  </div>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === 'paypal'}
                  aria-controls="paypal-panel"
                  onClick={() => {
                    setMethod('paypal')
                    setErrors({})
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-4 text-left transition',
                    method === 'paypal'
                      ? 'border-brand bg-brand-soft/60 ring-1 ring-brand/20'
                      : 'border-line bg-white hover:border-ink/20',
                  )}
                >
                  <Wallet className="size-5 text-brand" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-ink">PayPal</p>
                    <p className="text-xs text-muted">Redirect-free demo</p>
                  </div>
                </button>
              </div>

              {method === 'card' ? (
                <div id="card-panel" role="tabpanel" className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                      Card details
                    </h3>
                    <span className="rounded-full bg-canvas px-3 py-1 text-[0.65rem] font-medium text-muted">
                      Demo mode · use 4242 4242 4242 4242
                    </span>
                  </div>

                  <div className="mt-4 space-y-4">
                    <Input
                      label="Name on card"
                      value={form.cardName}
                      onChange={(event) => setField('cardName', event.target.value)}
                      error={errors.cardName}
                      autoComplete="cc-name"
                      placeholder="ALEX MORGAN"
                    />
                    <Input
                      label="Card number"
                      value={form.cardNumber}
                      onChange={(event) => setField('cardNumber', formatCardNumber(event.target.value))}
                      error={errors.cardNumber}
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      hint={brand === 'Card' ? 'We accept all major cards.' : `${brand} detected`}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry date"
                        value={form.expiry}
                        onChange={(event) => setField('expiry', formatExpiry(event.target.value))}
                        error={errors.expiry}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                      <Input
                        label="Security code"
                        value={form.cvc}
                        onChange={(event) =>
                          setField('cvc', event.target.value.replace(/\D/g, '').slice(0, 4))
                        }
                        error={errors.cvc}
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="CVC"
                        maxLength={4}
                        hint="3 digits on the back, 4 on Amex."
                      />
                    </div>
                  </div>

                  <div className="my-6 h-px bg-line" />

                  <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted">
                    Billing address
                  </h3>
                  <div className="mt-4 space-y-4">
                    <Input
                      label="Street address"
                      value={form.billingAddress}
                      onChange={(event) => setField('billingAddress', event.target.value)}
                      error={errors.billingAddress}
                      autoComplete="billing address-line1"
                      placeholder="12 Example Street, Apt 4"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="City"
                        value={form.billingCity}
                        onChange={(event) => setField('billingCity', event.target.value)}
                        error={errors.billingCity}
                        autoComplete="billing address-level2"
                        placeholder="New York"
                      />
                      <Input
                        label="Postal code"
                        value={form.billingPostalCode}
                        onChange={(event) => setField('billingPostalCode', event.target.value)}
                        error={errors.billingPostalCode}
                        autoComplete="billing postal-code"
                        placeholder="10001"
                      />
                    </div>
                    <Select
                      label="Country"
                      value={form.billingCountry}
                      onChange={(event) => setField('billingCountry', event.target.value)}
                      error={errors.billingCountry}
                    >
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              ) : (
                <div id="paypal-panel" role="tabpanel" className="mt-6">
                  <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-canvas px-6 py-10 text-center">
                    <span className="flex size-12 items-center justify-center rounded-full bg-white text-brand ring-1 ring-line">
                      <Wallet className="size-5" aria-hidden="true" />
                    </span>
                    <p className="mt-3 text-sm font-medium text-ink">Continue with PayPal</p>
                    <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted">
                      In a live booking you would be redirected to PayPal to approve the payment. In
                      this demo, your booking will be confirmed immediately.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-xl bg-canvas p-4">
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-muted">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => {
                      setAcceptedTerms(event.target.checked)
                      setErrors((current) => ({ ...current, terms: undefined }))
                    }}
                    className="mt-0.5 size-4 shrink-0 rounded border-line accent-brand"
                    aria-invalid={Boolean(errors.terms)}
                  />
                  <span>
                    I agree to the{' '}
                    <Link to="/#faq" className="font-medium text-ink underline decoration-line underline-offset-2">
                      booking terms
                    </Link>{' '}
                    and the cancellation policy of {selectedHotel.name}. I understand this is a demo and no
                    payment will be taken.
                  </span>
                </label>
                {errors.terms ? (
                  <p className="mt-2 pl-7 text-xs font-medium text-red-600" role="alert">
                    {errors.terms}
                  </p>
                ) : null}
              </div>
            </section>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/checkout"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to guest details
              </Link>
              <Button type="submit" size="lg" disabled={processing} className="sm:min-w-64">
                {processing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Processing…
                  </>
                ) : (
                  <>
                    <LockKeyhole className="size-4" aria-hidden="true" />
                    Pay {formatCurrency(price.total)}
                  </>
                )}
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.65rem] text-muted sm:justify-end">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
                256-bit encryption
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Landmark className="size-3.5 text-success" aria-hidden="true" />
                PCI-compliant demo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-success" aria-hidden="true" />
                No card stored
              </span>
            </div>
          </form>

          <aside className="order-1 lg:order-2">
            <div className="sticky top-24 space-y-4">
              <BookingSummary hotel={selectedHotel} room={selectedRoom} search={search} showTotal={false} />
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="font-display text-xl text-ink">Order summary</h2>
                <div className="mt-4">
                  <PriceBreakdown price={price} />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-brand p-4 text-white">
                  <div>
                    <p className="text-[0.6rem] uppercase tracking-[0.16em] text-white/60">Due today</p>
                    <p className="mt-0.5 text-xl font-semibold">{formatCurrency(price.total)}</p>
                  </div>
                  <LockKeyhole className="size-5 text-white/70" aria-hidden="true" />
                </div>
                <p className="mt-3 text-center text-[0.65rem] leading-relaxed text-muted">
                  Demo environment. No real payment will be processed and no card details are stored.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {processing ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-canvas/80 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-8 text-center shadow-2xl">
            <Loader2 className="mx-auto size-8 animate-spin text-brand" aria-hidden="true" />
            <p className="mt-4 font-display text-2xl text-ink">Confirming your stay</p>
            <p className="mt-2 text-sm text-muted">
              We are securing your room at {selectedHotel.name}. This will only take a moment.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
