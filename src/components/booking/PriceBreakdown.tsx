import type { PriceBreakdown as PriceBreakdownType } from '../../types'
import { cn } from '../../utils/cn'
import { formatCurrency } from '../../utils/pricing'

export function PriceBreakdown({
  price,
  className,
}: {
  price: PriceBreakdownType
  className?: string
}) {
  const rooms = price.rooms ?? 1
  const propertyDiscount = price.propertyDiscount ?? 0
  const priceAfterDiscount = price.priceAfterDiscount ?? price.roomTotal
  const addonsTotal = price.addonsTotal ?? 0
  const couponDiscount = price.couponDiscount ?? 0

  return (
    <div className={cn('font-numeric space-y-3 text-sm', className)}>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted">
          {formatCurrency(price.nightlyRate)} × {price.nights}{' '}
          {price.nights === 1 ? 'night' : 'nights'} × {rooms}{' '}
          {rooms === 1 ? 'room' : 'rooms'}
        </span>
        <span className="font-medium text-ink">{formatCurrency(price.roomTotal)}</span>
      </div>

      {propertyDiscount > 0 ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Discount by property</span>
          <span className="font-medium text-success">−{formatCurrency(propertyDiscount)}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <span className="text-muted">Price after discount</span>
        <span className="font-medium text-ink">{formatCurrency(priceAfterDiscount)}</span>
      </div>

      {addonsTotal > 0 ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Add-ons</span>
          <span className="font-medium text-ink">{formatCurrency(addonsTotal)}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <span className="text-muted">Taxes and fees</span>
        <span className="font-medium text-ink">
          {formatCurrency(price.taxes + price.serviceFee)}
        </span>
      </div>

      {couponDiscount > 0 ? (
        <div className="flex items-center justify-between gap-4">
          <span className="text-muted">Coupon {price.couponCode}</span>
          <span className="font-medium text-success">−{formatCurrency(couponDiscount)}</span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 border-t border-line pt-3">
        <span className="text-base font-semibold text-ink">Total</span>
        <span className="text-lg font-semibold text-ink">{formatCurrency(price.total)}</span>
      </div>
      <p className="text-[0.65rem] uppercase tracking-[0.12em] text-muted">
        All taxes and fees included
      </p>
    </div>
  )
}
