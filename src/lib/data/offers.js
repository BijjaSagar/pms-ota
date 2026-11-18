// Ported from pms-ota/src/data/offers.ts (types removed, logic unchanged).
const coupons = [
  {
    code: "STAY10",
    label: "10% off your stay",
    type: "percent",
    value: 10,
    maxDiscount: 250
  },
  {
    code: "TRIPONX15",
    label: "15% off for members",
    type: "percent",
    value: 15,
    maxDiscount: 400
  },
  {
    code: "WELCOME50",
    label: "\u20B950 off stays over \u20B9300",
    type: "flat",
    value: 50,
    minSpend: 300
  }
];
function findCoupon(code) {
  const normalised = code.trim().toUpperCase();
  return coupons.find((coupon) => coupon.code === normalised);
}
function couponDiscount(coupon, spend) {
  if (coupon.minSpend && spend < coupon.minSpend) return 0;
  if (coupon.type === "flat") return Math.min(coupon.value, spend);
  const raw = Math.round(spend * coupon.value / 100);
  return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
}
export {
  couponDiscount,
  coupons,
  findCoupon
};
