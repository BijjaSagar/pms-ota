// Checkout — TriponX's one-page "Almost there" flow, running pms-ota's checkout logic
// (guest validation, add-ons, early/late check, coupons, pay now vs pay later, booking creation).
import { Check, LockKeyhole, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Stepper } from '../components/Layout.jsx';
import { EmptyBookingState } from '../components/booking/EmptyBookingState.jsx';
import { StaySideCard } from '../components/booking/StaySideCard.jsx';
import { ExtrasCard } from '../components/checkout/ExtrasCard.jsx';
import { GuestCard } from '../components/checkout/GuestCard.jsx';
import { PolicyCard } from '../components/checkout/PolicyCard.jsx';
import { computeCheckoutPrice } from '../components/checkout/useCheckoutPrice.js';
import { saveBooking } from '../lib/api/bookings.js';
import { useBooking } from '../lib/context/useBooking.js';
import { useTrips } from '../lib/context/useTrips.js';
import { findCoupon } from '../lib/data/offers.js';
import { createBooking } from '../lib/utils/booking.js';
import { formatCurrency } from '../lib/utils/pricing.js';
import { isValidEmail, isValidPhone } from '../lib/utils/validation.js';
import { revealFirstError } from '../lib/utils/revealError.js';
import '../styles/checkout.css';

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const STEPS = ['Room', 'Details', 'Payment', 'Confirmed'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { search, selectedHotel, selectedRoom, guest, checkout, updateGuest, updateCheckout, setConfirmation } = useBooking();

  const [form, setForm] = useState(guest);
  const [errors, setErrors] = useState({});
  const [addonIds, setAddonIds] = useState(checkout.addons);
  const [earlyCheckIn, setEarlyCheckIn] = useState(checkout.earlyCheckIn);
  const [lateCheckOut, setLateCheckOut] = useState(checkout.lateCheckOut);
  const [paymentMode, setPaymentMode] = useState(checkout.paymentMode);
  const [couponInput, setCouponInput] = useState(checkout.couponCode);
  const [appliedCouponCode, setAppliedCouponCode] = useState(checkout.couponCode);
  const [couponError, setCouponError] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const { addBooking } = useTrips();

  if (!selectedHotel || !selectedRoom) return <EmptyBookingState />;

  const { nights, guests, price, bookingAddons, spendForCoupon, foundCoupon } = computeCheckoutPrice({
    hotel: selectedHotel, room: selectedRoom, search, addonIds, earlyCheckIn, lateCheckOut, couponCode: appliedCouponCode,
  });

  const setField = (key, value) => {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => ({ ...c, [key]: undefined }));
  };
  const updateAdditionalGuest = (id, patch) => {
    setForm((c) => ({ ...c, additionalGuests: c.additionalGuests.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
    setErrors((c) => ({ ...c, additionalGuests: undefined }));
  };
  const addGuest = () => setForm((c) => ({
    ...c,
    additionalGuests: [...c.additionalGuests, {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `guest-${Date.now()}`,
      title: 'Mr', firstName: '', lastName: '',
    }],
  }));
  const removeGuest = (id) => setForm((c) => ({ ...c, additionalGuests: c.additionalGuests.filter((g) => g.id !== id) }));
  const toggleAddon = (id) => setAddonIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const applyCoupon = () => {
    const coupon = findCoupon(couponInput);
    if (!coupon) { setCouponError('That coupon code is not valid.'); return; }
    if (coupon.minSpend && spendForCoupon < coupon.minSpend) {
      setCouponError(`This code needs a minimum spend of ${formatCurrency(coupon.minSpend)}.`);
      return;
    }
    setCouponError('');
    setCouponInput(coupon.code);
    setAppliedCouponCode(coupon.code);
  };
  const removeCoupon = () => { setAppliedCouponCode(''); setCouponInput(''); setCouponError(''); };

  const validate = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'Please enter the guest first name.';
    if (!form.lastName.trim()) next.lastName = 'Please enter the guest last name.';
    if (!form.email.trim()) next.email = 'Please enter your email address.';
    else if (!isValidEmail(form.email)) next.email = 'Please enter a valid email address.';
    if (!form.phone.trim()) next.phone = 'Please enter a mobile number.';
    else if (!isValidPhone(form.phone)) next.phone = 'Please enter a valid mobile number.';
    if (form.gstNumber.trim() && !GSTIN_PATTERN.test(form.gstNumber.trim())) next.gstNumber = 'Enter a valid 15-character GSTIN.';
    if (form.additionalGuests.some((g) => !g.firstName.trim() || !g.lastName.trim())) {
      next.additionalGuests = 'Add a first and last name for every additional guest.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event) => {
    event?.preventDefault();
    if (saving) return;
    setSubmitError('');
    if (!validate()) {
      revealFirstError(document, { focus: '[aria-invalid="true"]' });
      return;
    }
    updateGuest(form);
    updateCheckout({ addons: addonIds, earlyCheckIn, lateCheckOut, couponCode: appliedCouponCode, paymentMode });

    if (paymentMode === 'now') {
      navigate('/payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const local = createBooking({
      hotel: selectedHotel, room: selectedRoom, search, guest: form, price,
      paymentLast4: 'Pay at property', addons: bookingAddons, earlyCheckIn, lateCheckOut,
      couponCode: price.couponCode ?? '', paymentMode: 'later',
    });
    // Saved by the server (priced, availability checked); its reference replaces the local one.
    setSaving(true);
    try {
      const booking = await saveBooking(local);
      setConfirmation(booking);
      addBooking(booking);
      navigate(`/confirmation/${booking.reference}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (problem) {
      setSubmitError(problem.message);
    } finally {
      setSaving(false);
    }
  };

  const payOptions = [
    { mode: 'now', title: 'Pay now', sub: 'Card or PayPal on the next, secure step. Instant confirmation.', tag: 'Most popular' },
    { mode: 'later', title: 'Pay at the property', sub: 'Confirm now and settle the full amount when you arrive.', tag: 'Nothing today' },
  ];
  const isNow = paymentMode === 'now';

  return (
    <form className="container-narrow checkout-layout co-checkout" onSubmit={submit} noValidate>
      <div className="checkout-main">
        <div className="co-intro">
          <Stepper steps={STEPS} current={1} />
          <h1 className="h1-lg">Almost there</h1>
          <p className="section-sub">One page, two minutes. We only ask what {selectedHotel.name} needs.</p>
        </div>

        <GuestCard form={form} errors={errors} onChange={setField} onAddGuest={addGuest} onRemoveGuest={removeGuest}
          onChangeGuest={updateAdditionalGuest} maxGuests={selectedRoom.maxGuests} />

        <ExtrasCard addonIds={addonIds} onToggleAddon={toggleAddon} earlyCheckIn={earlyCheckIn} lateCheckOut={lateCheckOut}
          onEarly={setEarlyCheckIn} onLate={setLateCheckOut} nights={nights} guests={guests}
          arrivalTime={form.arrivalTime} specialRequests={form.specialRequests} onChange={setField} />

        <PolicyCard hotel={selectedHotel} room={selectedRoom} checkIn={search.checkIn} />

        <section className="card card-lg">
          <h2 className="h-card-lg">How would you like to pay?</h2>
          <div role="radiogroup" aria-label="Payment option" className="col-gap-10">
            {payOptions.map((p) => (
              <button type="button" role="radio" aria-checked={paymentMode === p.mode} key={p.mode}
                className={`pay-option ${paymentMode === p.mode ? 'is-active' : ''}`} onClick={() => setPaymentMode(p.mode)}>
                <span className="radio-dot" />
                <span className="grow">
                  <span className="pay-title">{p.title}</span>
                  <span className="pay-sub">{p.sub}</span>
                </span>
                <span className="pay-tag">{p.tag}</span>
              </button>
            ))}
          </div>
        </section>

        <p className="co-fine co-inline co-center-sm"><LockKeyhole size={14} className="co-ok" aria-hidden="true" />Your details are encrypted and only shared with the property.</p>
      </div>

      <aside aria-label="Booking summary" className="booking-col">
        <StaySideCard hotel={selectedHotel} room={selectedRoom} search={search} price={price} addons={bookingAddons}
          totalLabel="Total" totalNote={isNow ? 'Paid on the next step. Nothing charged yet.' : 'Nothing charged today. Pay the hotel on arrival.'}>
          <div className="co-promo-wrap">
            {price.couponCode ? (
              <div className="co-coupon-applied">
                <span className="co-inline"><Check size={14} aria-hidden="true" /><strong>{price.couponCode}</strong>
                  {foundCoupon?.label && <span className="co-coupon-label">· {foundCoupon.label}</span>}</span>
                <button type="button" className="co-remove" onClick={removeCoupon}><X size={14} aria-hidden="true" />Remove</button>
              </div>
            ) : (
              <>
                <div className="promo row-gap-8">
                  <label className="sr-only" htmlFor="promo">Promo code</label>
                  <input id="promo" value={couponInput} placeholder="Promo code · try STAY10" autoComplete="off" aria-invalid={Boolean(couponError)}
                    onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (couponInput.trim()) applyCoupon(); } }} />
                  <button type="button" className="btn btn-outline-dark btn-sm" onClick={applyCoupon} disabled={!couponInput.trim()}>Apply</button>
                </div>
                {couponError && <p className="field-error" role="alert">{couponError}</p>}
              </>
            )}
            {price.couponDiscount > 0 && <p className="co-saving">You save {formatCurrency(price.couponDiscount)} with {price.couponCode}</p>}
          </div>
          {submitError && <p className="field-error mb-10" role="alert">{submitError}</p>}
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={saving} aria-busy={saving}>
            {saving ? 'Confirming…' : isNow ? `Continue to payment · ${formatCurrency(price.total)}` : 'Confirm booking · pay at hotel'}
          </button>
          <p className="muted-xs center-text mt-14">
            {selectedRoom.refundable ? 'Free cancellation on this rate.' : 'Non-refundable rate.'} By continuing you agree to the hotel's house rules and TriponX's terms.
          </p>
          <Link to={`/hotels/${selectedHotel.slug}`} className="co-back co-back-center">Change room</Link>
        </StaySideCard>
      </aside>
    </form>
  );
}
