import { Check, LockKeyhole, Tag, X } from 'lucide-react'
import type { BookingAddon, PaymentMode, PriceBreakdown } from '../../types'
import { formatCurrency } from '../../utils/pricing'
import { Button } from '../ui/Button'
import { Input } from '../ui/Field'

interface CheckoutPriceSummaryProps {
  price: PriceBreakdown
  addons: BookingAddon[]
  couponInput: string
  couponError?: string
  appliedCouponLabel?: string
  paymentMode: PaymentMode
  onCouponInputChange: (value: string) => void
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
  onConfirmBooking: () => void
}

export function CheckoutPriceSummary({
  price,
  addons,
  couponInput,
  couponError,
  appliedCouponLabel,
  paymentMode,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  onConfirmBooking,
}: CheckoutPriceSummaryProps) {
  const taxesAndFees = price.taxes + price.serviceFee
  const isApplied = Boolean(price.couponCode)

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="font-display text-xl text-ink">Price summary</h2>

      <div className="font-numeric mt-4 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">
            {formatCurrency(price.nightlyRate)} × {price.nights}{' '}
            {price.nights === 1 ? 'night' : 'nights'} × {price.rooms}{' '}
            {price.rooms === 1 ? 'room' : 'rooms'}
          </span>
          <span className="font-medium text-ink">{formatCurrency(price.roomTotal)}</span>
        </div>

        {price.propertyDiscount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted">Discount by property</span>
            <span className="font-medium text-success">
              −{formatCurrency(price.propertyDiscount)}
            </span>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Price after discount</span>
          <span className="font-medium text-ink">{formatCurrency(price.priceAfterDiscount)}</span>
        </div>

        {addons.map((addon) => (
          <div key={addon.id} className="flex items-center justify-between gap-4">
            <span className="text-muted">{addon.name}</span>
            <span className="font-medium text-ink">{formatCurrency(addon.price)}</span>
          </div>
        ))}

        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Taxes and fees</span>
          <span className="font-medium text-ink">{formatCurrency(taxesAndFees)}</span>
        </div>

        <div className="border-t border-line pt-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-base font-semibold text-ink">Total amount to be paid</span>
            <span className="text-lg font-semibold text-ink">{formatCurrency(price.total)}</span>
          </div>
          {price.couponDiscount > 0 ? (
            <p className="mt-1 text-right text-[0.65rem] font-medium text-success">
              You save {formatCurrency(price.couponDiscount)} with {price.couponCode}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-dashed border-line bg-canvas p-4">
        <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">
          <Tag className="size-3.5 text-accent" aria-hidden="true" />
          Coupon code
        </p>

        {isApplied ? (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-[#eef6f2] px-3 py-2">
            <span className="flex items-center gap-2 text-xs font-medium text-success">
              <Check className="size-3.5" aria-hidden="true" />
              {price.couponCode}
              {appliedCouponLabel ? (
                <span className="font-normal text-[#2b6353]">· {appliedCouponLabel}</span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-red-600"
            >
              <X className="size-3.5" aria-hidden="true" />
              Remove
            </button>
          </div>
        ) : (
          <div className="mt-2 flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <Input
                label="Coupon code"
                hideLabel
                value={couponInput}
                onChange={(event) => onCouponInputChange(event.target.value.toUpperCase())}
                error={couponError}
                placeholder="Try STAY10"
                autoComplete="off"
                className="py-2.5"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onApplyCoupon}
              disabled={!couponInput.trim()}
              className="shrink-0 rounded-xl"
            >
              Apply
            </Button>
          </div>
        )}
        <p className="mt-2 text-[0.65rem] text-muted">
          Offers apply to the room rate after the property discount.
        </p>
      </div>

      <Button type="button" onClick={onConfirmBooking} size="lg" fullWidth className="mt-4">
        <LockKeyhole className="size-4" aria-hidden="true" />
        {paymentMode === 'now' ? 'Pay now' : 'Confirm booking'}
      </Button>
      <p className="mt-3 text-center text-[0.65rem] leading-relaxed text-muted">
        {paymentMode === 'now'
          ? 'You will complete payment on the next secure step. No card is charged in this demo.'
          : 'No payment is taken now. The full amount is payable at the property.'}
      </p>
    </div>
  )
}
