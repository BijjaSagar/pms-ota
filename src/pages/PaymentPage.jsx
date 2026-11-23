// Payment — TriponX layout (glass form left, sticky stay card right) running pms-ota's payment logic:
// card/PayPal, card formatting & brand detection, Luhn/expiry/CVC checks, billing, terms,
// booking creation, My trips and confirmation.
import { ArrowLeft, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { SelectField, Stepper, TextField } from '../components/Layout.jsx';
import { EmptyBookingState } from '../components/booking/EmptyBookingState.jsx';
import { StaySideCard } from '../components/booking/StaySideCard.jsx';
import { computeCheckoutPrice } from '../components/checkout/useCheckoutPrice.js';
import { useBooking } from '../lib/context/useBooking.js';
import { useTrips } from '../lib/context/useTrips.js';
import { createBooking } from '../lib/utils/booking.js';
import { formatCurrency } from '../lib/utils/pricing.js';
import {
  cardDigits, detectCardBrand, formatCardNumber, formatExpiry, isValidCardNumber, isValidCvc, isValidExpiry,
} from '../lib/utils/validation.js';
import { revealFirstError } from '../lib/utils/revealError.js';
import '../styles/checkout.css';

const STEPS = ['Room', 'Details', 'Payment', 'Confirmed'];
const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands',
  'Japan', 'Singapore', 'United Arab Emirates', 'India', 'Brazil', 'South Africa',
];

export default function PaymentPage() {
  const navigate = useNavigate();
  const { search, selectedHotel, selectedRoom, guest, checkout, setConfirmation } = useBooking();
  const { addBooking } = useTrips();
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    cardName: '', cardNumber: '', expiry: '', cvc: '',
    billingAddress: '', billingCity: '', billingPostalCode: '',
    billingCountry: guest.country || 'United States',
  });

  if (!selectedHotel || !selectedRoom) return <EmptyBookingState />;
  if (!guest.firstName || !guest.email) return <Navigate to="/checkout" replace />;

  const { price, bookingAddons } = computeCheckoutPrice({
    hotel: selectedHotel, room: selectedRoom, search, addonIds: checkout.addons,
    earlyCheckIn: checkout.earlyCheckIn, lateCheckOut: checkout.lateCheckOut, couponCode: checkout.couponCode,
  });
  const brand = detectCardBrand(form.cardNumber);

  const setField = (key, value) => {
    setForm((c) => ({ ...c, [key]: value }));
    setErrors((c) => ({ ...c, [key]: undefined }));
  };
  const invalid = (k) => ({ error: errors[k], 'aria-invalid': Boolean(errors[k]) });

  const validate = () => {
    const next = {};
    if (method === 'card') {
      if (!form.cardName.trim()) next.cardName = 'Enter the name on the card.';
      if (!isValidCardNumber(form.cardNumber)) next.cardNumber = 'Enter a valid card number.';
      if (!isValidExpiry(form.expiry)) next.expiry = 'Enter a valid future expiry date.';
      if (!isValidCvc(form.cvc)) next.cvc = 'Enter the 3 or 4 digit security code.';
      if (!form.billingAddress.trim()) next.billingAddress = 'Enter your billing address.';
      if (!form.billingCity.trim()) next.billingCity = 'Enter your billing city.';
      if (!form.billingPostalCode.trim()) next.billingPostalCode = 'Enter your postal code.';
      if (!form.billingCountry) next.billingCountry = 'Choose a billing country.';
    }
    if (!acceptedTerms) next.terms = 'Please accept the booking terms to continue.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      revealFirstError(document, { focus: '[aria-invalid="true"]' });
    }
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (processing || !validate()) return;
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const booking = createBooking({
      hotel: selectedHotel, room: selectedRoom, search, guest, price,
      paymentLast4: method === 'card' ? cardDigits(form.cardNumber).slice(-4) : 'PayPal',
      addons: bookingAddons, earlyCheckIn: checkout.earlyCheckIn, lateCheckOut: checkout.lateCheckOut,
      couponCode: price.couponCode ?? '', paymentMode: 'now',
    });
    setConfirmation(booking);
    addBooking(booking);
    navigate(`/confirmation/${booking.reference}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setProcessing(false);
  };

  const methods = [
    { id: 'card', title: 'Credit or debit card', sub: 'Visa, Mastercard, Amex, RuPay', tag: brand !== 'Card' && method === 'card' ? brand : '' },
    { id: 'paypal', title: 'PayPal', sub: 'Approve in PayPal. In this demo it confirms instantly.', tag: '' },
  ];

  return (
    <form className="container-narrow checkout-layout co-checkout" onSubmit={handleSubmit} noValidate>
      <div className="checkout-main co-pay-form">
        <div className="co-intro">
          <Stepper steps={STEPS} current={2} />
          <h1 className="h1-lg">Pay securely</h1>
          <p className="section-sub co-inline"><LockKeyhole size={14} className="co-ok" aria-hidden="true" />Encrypted and protected. This is a demo — no card is charged.</p>
        </div>

        <section className="card card-lg">
          <h2 className="h-card-lg">How would you like to pay?</h2>
          <div role="radiogroup" aria-label="Payment method" className="col-gap-10">
            {methods.map((m) => (
              <button type="button" role="radio" aria-checked={method === m.id} key={m.id}
                className={`pay-option ${method === m.id ? 'is-active' : ''}`} onClick={() => { setMethod(m.id); setErrors({}); }}>
                <span className="radio-dot" />
                <span className="grow">
                  <span className="pay-title">{m.title}</span>
                  <span className="pay-sub">{m.sub}</span>
                </span>
                {m.tag && <span className="pay-tag">{m.tag}</span>}
              </button>
            ))}
          </div>
        </section>

        {method === 'card' ? (
          <section className="card card-lg">
            <div className="co-card-head mb-16">
              <h2 className="h-card-lg co-title">Card details</h2>
              <span className="co-demo">Demo · use 4242 4242 4242 4242</span>
            </div>
            <div className="grid-auto-240 gap-14">
              <TextField full label="Name on card" value={form.cardName} onChange={(e) => setField('cardName', e.target.value)}
                {...invalid('cardName')} autoComplete="cc-name" placeholder="As printed on the card" />
              <TextField full label="Card number" value={form.cardNumber} onChange={(e) => setField('cardNumber', formatCardNumber(e.target.value))}
                {...invalid('cardNumber')} inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456"
                hint={brand === 'Card' ? 'We accept all major cards.' : `${brand} detected`} />
            </div>
            <div className="co-two co-mt-sm">
              <TextField label="Expiry" value={form.expiry} onChange={(e) => setField('expiry', formatExpiry(e.target.value))}
                {...invalid('expiry')} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" maxLength={5} />
              <TextField label="CVC" value={form.cvc} onChange={(e) => setField('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))}
                {...invalid('cvc')} inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4} hint="3 digits, 4 on Amex." />
            </div>

            <h3 className="mini-label co-mt">BILLING ADDRESS</h3>
            <div className="grid-auto-240 gap-14 co-mt-sm">
              <TextField full label="Street address" value={form.billingAddress} onChange={(e) => setField('billingAddress', e.target.value)}
                {...invalid('billingAddress')} autoComplete="billing address-line1" placeholder="House, street, area" />
              <TextField label="City" value={form.billingCity} onChange={(e) => setField('billingCity', e.target.value)}
                {...invalid('billingCity')} autoComplete="billing address-level2" placeholder="City" />
              <TextField label="Postal code" value={form.billingPostalCode} onChange={(e) => setField('billingPostalCode', e.target.value)}
                {...invalid('billingPostalCode')} autoComplete="billing postal-code" placeholder="PIN / ZIP" />
              <SelectField label="Country" value={form.billingCountry} onChange={(e) => setField('billingCountry', e.target.value)}
                error={errors.billingCountry} options={COUNTRIES.map((c) => [c, c])} />
            </div>
          </section>
        ) : (
          <section className="card card-lg co-paypal">
            <span className="empty-icon"><ShieldCheck size={22} aria-hidden="true" /></span>
            <p className="h-card">Continue with PayPal</p>
            <p className="muted-sm">In a live booking you'd approve the payment in PayPal. In this demo, your booking is confirmed right away.</p>
          </section>
        )}

        <section className="card co-terms-card">
          <label className="check-row co-terms">
            <input type="checkbox" checked={acceptedTerms} aria-invalid={Boolean(errors.terms)}
              onChange={(e) => { setAcceptedTerms(e.target.checked); setErrors((c) => ({ ...c, terms: undefined })); }} />
            <span>I agree to the <Link to="/#help-support" className="link-strong">booking terms</Link> and {selectedHotel.name}'s cancellation policy. I understand this is a demo and no payment will be taken.</span>
          </label>
          {errors.terms && <p className="field-error co-terms-error" role="alert">{errors.terms}</p>}
        </section>

        <Link to="/checkout" className="co-back"><ArrowLeft size={16} aria-hidden="true" />Back to your details</Link>
      </div>

      <aside aria-label="Booking summary" className="booking-col">
        <StaySideCard hotel={selectedHotel} room={selectedRoom} search={search} price={price} addons={bookingAddons}
          totalLabel="Due today" totalNote={`For ${guest.title} ${guest.firstName} ${guest.lastName} · ${guest.email}`}>
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={processing}>
            {processing ? <><Loader2 size={16} className="co-spin" aria-hidden="true" />Processing…</> : <><LockKeyhole size={16} aria-hidden="true" />Pay {formatCurrency(price.total)}</>}
          </button>
          <p className="muted-xs center-text mt-14">256-bit encryption · PCI-compliant demo · no card stored</p>
        </StaySideCard>
      </aside>

      {processing && (
        <div className="modal-backdrop co-processing" role="status" aria-live="polite">
          <div className="modal glass-pop center-text">
            <Loader2 size={32} className="co-spin co-ok" aria-hidden="true" />
            <p className="h3 co-mt">Confirming your stay</p>
            <p className="muted-sm co-mt-sm">We're securing your room at {selectedHotel.name}. This will only take a moment.</p>
          </div>
        </div>
      )}
    </form>
  );
}
