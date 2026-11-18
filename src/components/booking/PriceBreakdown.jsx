// Price rows in the TriponX breakdown style (logic from pms-ota's PriceBreakdown / CheckoutPriceSummary).
// Pass `addons` to itemise extras; otherwise a single "Extras" row is shown.
import { formatCurrency } from '../../lib/utils/pricing.js';
import '../../styles/checkout.css';

export function PriceBreakdown({ price, addons, totalLabel = 'You pay', totalNote }) {
  const rooms = price.rooms ?? 1;
  const propertyDiscount = price.propertyDiscount ?? 0;
  const addonsTotal = price.addonsTotal ?? 0;
  const couponDiscount = price.couponDiscount ?? 0;

  return (
    <div className="breakdown co-breakdown">
      <div>
        <span>{formatCurrency(price.nightlyRate)} × {price.nights} {price.nights === 1 ? 'night' : 'nights'}{rooms > 1 ? ` × ${rooms} rooms` : ''}</span>
        <strong>{formatCurrency(price.roomTotal)}</strong>
      </div>
      {propertyDiscount > 0 && <div><span>Property discount</span><strong className="good">−{formatCurrency(propertyDiscount)}</strong></div>}
      {addons
        ? addons.map((a) => <div key={a.id}><span>{a.name}</span><strong>{formatCurrency(a.price)}</strong></div>)
        : addonsTotal > 0 && <div><span>Extras</span><strong>{formatCurrency(addonsTotal)}</strong></div>}
      <div><span>Taxes &amp; fees</span><strong>{formatCurrency(price.taxes + price.serviceFee)}</strong></div>
      {couponDiscount > 0 && <div><span>Offer {price.couponCode}</span><strong className="good">−{formatCurrency(couponDiscount)}</strong></div>}
      <div className="breakdown-total"><span>{totalLabel}</span><span className="price-lg">{formatCurrency(price.total)}</span></div>
      {totalNote && <p className="pay-note">{totalNote}</p>}
    </div>
  );
}
