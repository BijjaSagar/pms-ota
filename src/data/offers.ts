export interface CouponOffer {
  code: string
  label: string
  type: 'percent' | 'flat'
  value: number
  maxDiscount?: number
  minSpend?: number
}

export const coupons: CouponOffer[] = [
  {
    code: 'STAY10',
    label: '10% off your stay',
    type: 'percent',
    value: 10,
    maxDiscount: 250,
  },
  {
    code: 'AURELIA15',
    label: '15% off for members',
    type: 'percent',
    value: 15,
    maxDiscount: 400,
  },
  {
    code: 'WELCOME50',
    label: '₹50 off stays over ₹300',
    type: 'flat',
    value: 50,
    minSpend: 300,
  },
]

export function findCoupon(code: string): CouponOffer | undefined {
  const normalised = code.trim().toUpperCase()
  return coupons.find((coupon) => coupon.code === normalised)
}

export function couponDiscount(coupon: CouponOffer, spend: number): number {
  if (coupon.minSpend && spend < coupon.minSpend) return 0
  if (coupon.type === 'flat') return Math.min(coupon.value, spend)
  const raw = Math.round((spend * coupon.value) / 100)
  return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw
}
