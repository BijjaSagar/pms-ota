// Make a payment — lookup logic from pms-ota (MakeAPaymentPage.tsx); TriponX layout (glass lookup bar).
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, CreditCard, MapPin, Search, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge.jsx';
import { useTrips } from '../lib/context/useTrips.js';
import { formatDate, guestsLabel, nightsLabel } from '../lib/utils/date.js';
import { formatCurrency } from '../lib/utils/pricing.js';
import '../styles/account.css';

function findBooking(bookings, value) {
  const lower = value.toLowerCase();
  const digits = value.replace(/\D/g, '');
  return bookings.find((booking) => {
    const referenceMatch = booking.reference.toLowerCase() === lower;
    const emailMatch = booking.email.toLowerCase() === lower || booking.guest.email.toLowerCase() === lower;
    const phoneMatch = digits.length >= 7 && booking.guest.phone.replace(/\D/g, '').endsWith(digits);
    return referenceMatch || emailMatch || phoneMatch;
  });
}

function BookingResult({ booking }) {
  const { hotel, room, search, price, reference, paymentMode } = booking;
  const pending = paymentMode === 'later';
  return (
    <section className="card found" role="status" aria-live="polite">
      <div className="found-photo"><img src={hotel.images[0]} alt={`${hotel.name} in ${hotel.location.city}`} /></div>
      <div className="found-body">
        <div className="row-gap-8 wrap center">
          <Badge tone="success"><CheckCircle2 size={12} aria-hidden="true" />Booking found</Badge>
          <Badge tone={pending ? 'accent' : 'success'}>{pending ? 'Payment pending' : 'Paid'}</Badge>
        </div>
        <div>
          <h2 className="h3">{hotel.name}</h2>
          <p className="trip-sub">
            <span><MapPin size={13} aria-hidden="true" />{hotel.location.city}, {hotel.location.country}</span>
            <span>Ref <span className="ref-code">{reference}</span></span>
          </p>
        </div>
        <div className="trip-facts">
          <span className="fact-pill"><CalendarDays size={13} aria-hidden="true" />{formatDate(search.checkIn)} — {formatDate(search.checkOut)} · {nightsLabel(price.nights)}</span>
          <span className="fact-pill"><Users size={13} aria-hidden="true" />{guestsLabel(search.guests, search.rooms)}</span>
          <span className="fact-pill">{room.name}</span>
        </div>
        <div className="found-due">
          <div><small>{pending ? 'Amount due' : 'Amount paid'}</small><b>{formatCurrency(price.total)}</b></div>
          <Link to={`/confirmation/${reference}`} className="btn btn-light btn-sm">View booking details<ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}

export default function MakeAPaymentPage() {
  const { bookings } = useTrips();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const value = query.trim();
    if (!value) {
      setError('Enter a booking ID, email or mobile number.');
      setResult(null);
      setSearched(false);
      return;
    }
    setError('');
    setResult(findBooking(bookings, value) ?? null);
    setSearched(true);
  };

  const setExample = (value) => { setQuery(value); setError(''); setResult(null); setSearched(false); };
  const latest = bookings[0];

  return (
    <div className="container acct-page">
      <div className="lookup">
        <span className="acct-kicker"><CreditCard size={13} aria-hidden="true" />Secure payments</span>
        <h1 className="h1-lg">Make a payment</h1>
        <p className="section-sub">Find your booking with your booking ID, email address or mobile number, then review the amount due. We look up bookings saved in this browser.</p>
        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="lookup-q" className="sr-only">Booking ID, email or mobile number</label>
          <div className={`lookup-bar ${error ? 'has-error' : ''}`}>
            <Search size={18} className="lead-icon" aria-hidden="true" />
            <input id="lookup-q" value={query} autoComplete="off" placeholder="Booking ID, email or mobile number"
              aria-invalid={Boolean(error)} aria-describedby={error ? 'lookup-err' : undefined}
              onChange={(e) => setExample(e.target.value)} />
            <button type="submit" className="btn btn-primary"><Search size={16} aria-hidden="true" /><span>Submit</span></button>
          </div>
          {error ? <p id="lookup-err" className="lookup-error" role="alert">{error}</p> : null}
        </form>
        <div className="lookup-hints">
          <span className="muted-xs" style={{ alignSelf: 'center' }}>For example</span>
          {[latest?.reference ?? 'TPX-8K2M9Q', 'alex@example.com', '98765 43210'].map((ex) => (
            <button key={ex} type="button" className="fact-pill" onClick={() => setExample(ex)}>{ex}</button>
          ))}
        </div>
      </div>

      {result ? <div className="lookup-result"><BookingResult booking={result} /></div> : null}

      {searched && !result ? (
        <div className="lookup-result">
          <section className="card card-lg miss" role="alert">
            <span className="miss-icon"><AlertCircle size={18} aria-hidden="true" /></span>
            <div>
              <h2 className="h3">We couldn't find that booking</h2>
              <p className="muted-sm mt-12">Check the booking ID, email or mobile number and try again. Bookings made in this browser appear in My trips.</p>
              <Link to="/trips" className="link-arrow mt-12">Go to My trips<ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </section>
        </div>
      ) : null}

      <div className="info-row">
        <section className="card">
          <h2 className="h-card">Where do I find my booking ID?</h2>
          <p className="muted-sm">Your booking ID is in the confirmation email and on the booking details page. It starts with <strong>TPX-</strong>.</p>
          <Link to="/trips" className="link-arrow mt-12">View my trips<ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
        <section className="safe-tile">
          <h2 className="h-card row-gap-8 center"><ShieldCheck size={18} aria-hidden="true" />Safe and secure</h2>
          <ul>
            <li>256-bit encrypted lookup</li>
            <li>No card details are stored</li>
            <li>Demo environment — no real charge</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
