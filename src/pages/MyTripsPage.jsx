// My trips — features & data from pms-ota (MyTripsPage.tsx); TriponX layout ("trip pass" cards).
import { ArrowRight, BedDouble, CalendarPlus, Clock3, MapPin, RotateCcw, Users, XCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { PortalModal as Modal } from '../components/profile/PortalModal.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { useTrips } from '../lib/context/useTrips.js';
import { downloadCalendarFile } from '../lib/utils/calendar.js';
import { formatDate, guestsLabel, nightsLabel, parseISODate, todayISO } from '../lib/utils/date.js';
import { formatCurrency } from '../lib/utils/pricing.js';
import '../styles/account.css';

const filters = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
];

// Status from the server (the property checks guests in and out).
const STATUS_BADGE = {
  pending_payment: ['accent', 'Payment pending'],
  checked_in: ['success', 'Checked in'],
  completed: ['neutral', 'Completed'],
  no_show: ['neutral', 'No-show'],
};
const isFinished = (booking) => ['completed', 'no_show'].includes(booking.status);
const isUpcoming = (booking) => !isFinished(booking) && booking.search.checkOut >= todayISO();
/** The guest can cancel only before the stay starts (the server checks again). */
const canCancel = (booking) => isUpcoming(booking) && ['confirmed', 'pending_payment', undefined].includes(booking.status);
const paymentLabel = (booking) => (booking.paymentMode === 'later'
  ? (booking.paymentStatus === 'paid' ? 'Paid at property' : 'Pay at property')
  : booking.paymentStatus === 'paid' ? 'Paid' : 'Payment pending');
const monthFmt = new Intl.DateTimeFormat('en-US', { month: 'short' });

function DateChip({ iso }) {
  const d = parseISODate(iso);
  return <span className="date-chip"><b>{d.getDate()}</b><span>{monthFmt.format(d)}</span></span>;
}

function TripPass({ booking, onCancel }) {
  const { hotel, room, search, price, reference } = booking;
  const upcoming = isUpcoming(booking);
  const [tone, label] = STATUS_BADGE[booking.status] ?? (upcoming ? ['success', 'Upcoming'] : ['neutral', 'Past']);
  return (
    <article className="card trip-pass">
      <Link to={`/hotels/${hotel.slug}`} className="trip-pass-photo" aria-label={`View ${hotel.name}`}>
        <img src={hotel.images?.[0] ?? room.image} alt={`${hotel.name} in ${hotel.location.city}`} loading="lazy" />
        <Badge tone={tone}>{label}</Badge>
        <span className="trip-pass-price">{formatCurrency(price.total)} · {paymentLabel(booking)}</span>
      </Link>
      <div className="trip-pass-body">
        <div className="trip-dates" aria-label={`${formatDate(search.checkIn)} to ${formatDate(search.checkOut)}`}>
          <DateChip iso={search.checkIn} />
          <span className="date-arrow"><em>{nightsLabel(price.nights)}</em></span>
          <DateChip iso={search.checkOut} />
        </div>
        <div>
          <Link to={`/hotels/${hotel.slug}`} className="trip-title">{hotel.name}</Link>
          <p className="trip-sub">
            <span><MapPin size={13} aria-hidden="true" />{hotel.location.city}, {hotel.location.country}</span>
            <span>Ref <span className="ref-code">{reference}</span></span>
          </p>
        </div>
        <div className="trip-facts">
          <span className="fact-pill"><Users size={13} aria-hidden="true" />{guestsLabel(search.guests, search.rooms)}</span>
          <span className="fact-pill"><BedDouble size={13} aria-hidden="true" />{room.name} · {room.bed} · {room.size} m²</span>
          <span className="fact-pill"><Clock3 size={13} aria-hidden="true" />In {hotel.policies.checkIn.replace(/^From\s+/i, '')} · Out {hotel.policies.checkOut.replace(/^Until\s+/i, '')}</span>
        </div>
        <div className="trip-foot">
          <Link to={`/confirmation/${reference}`} className="btn btn-primary">Details<ArrowRight size={14} aria-hidden="true" /></Link>
          <button type="button" className="pill-btn" onClick={() => downloadCalendarFile(booking)}><CalendarPlus size={14} aria-hidden="true" />Calendar</button>
          <Link to={`/hotels/${hotel.slug}`} className="pill-btn"><RotateCcw size={14} aria-hidden="true" />Book again</Link>
          {canCancel(booking) ? (
            <button type="button" className="pill-btn danger" onClick={() => onCancel(booking)}><XCircle size={14} aria-hidden="true" />Cancel booking</button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function MyTripsPage() {
  const { bookings, cancelBooking, loading, error, reload } = useTrips();
  const [filter, setFilter] = useState(() => (bookings.length > 0 && !bookings.some(isUpcoming) ? 'all' : 'upcoming'));
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const closeCancel = useCallback(() => { setBookingToCancel(null); setCancelError(''); }, []);

  const confirmCancellation = async () => {
    if (!bookingToCancel || cancelling) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelBooking(bookingToCancel.reference);
      setBookingToCancel(null);
    } catch (problem) {
      setCancelError(problem.message);
    } finally {
      setCancelling(false);
    }
  };

  const counts = {
    upcoming: bookings.filter(isUpcoming).length,
    past: bookings.filter((b) => !isUpcoming(b)).length,
    all: bookings.length,
  };
  const nightsBooked = bookings.reduce((n, b) => n + (b.price?.nights ?? 0), 0);

  const visible = bookings
    .filter((b) => (filter === 'upcoming' ? isUpcoming(b) : filter === 'past' ? !isUpcoming(b) : true))
    .sort((a, b) => {
      if (filter === 'all') return b.createdAt.localeCompare(a.createdAt);
      if (filter === 'past') return b.search.checkOut.localeCompare(a.search.checkOut);
      return a.search.checkIn.localeCompare(b.search.checkIn);
    });

  return (
    <div className="container acct-page">
      <div className="acct-head">
        <div>
          <span className="acct-kicker">Your journeys</span>
          <h1 className="h1-lg">My trips</h1>
          <p className="section-sub">Every stay you have booked, all in one place. Revisit the details, add a trip to your calendar or start planning the next one.</p>
        </div>
        {bookings.length > 0 ? (
          <div role="tablist" aria-label="Filter trips" className="seg-tabs">
            {filters.map(({ id, label }) => (
              <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
                className={`seg-tab ${filter === id ? 'is-active' : ''}`}>
                {label}<span className="seg-count">{counts[id]}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {error && (
        <div className="card acct-empty" role="alert">
          <p className="muted-sm">We couldn’t load your trips. {error}</p>
          <button type="button" className="btn btn-outline btn-block" onClick={reload}>Try again</button>
        </div>
      )}

      {loading && bookings.length === 0 ? (
        <div className="card acct-empty" role="status"><p className="muted-sm">Loading your trips…</p></div>
      ) : error && bookings.length === 0 ? null : bookings.length > 0 ? (
        <>
          <div className="stat-row">
            <div className="card stat"><p className="stat-v">{counts.upcoming}</p><p className="stat-k">Upcoming</p></div>
            <div className="card stat"><p className="stat-v">{counts.past}</p><p className="stat-k">Completed</p></div>
            <div className="card stat"><p className="stat-v">{nightsBooked}</p><p className="stat-k">Nights booked</p></div>
          </div>

          {visible.length > 0 ? (
            <div className="rail-grid">
              {visible.map((b, i) => (
                <div key={b.reference} style={{ animationDelay: `${i * 60}ms` }}>
                  <TripPass booking={b} onCancel={setBookingToCancel} />
                </div>
              ))}
            </div>
          ) : (
            <div className="card acct-empty">
              <p className="h2-sm">No {filter === 'past' ? 'past' : 'upcoming'} trips</p>
              <p className="muted-sm mt-12">
                {filter === 'past'
                  ? 'Once a stay is complete it will move here so you can look back on it.'
                  : 'Your upcoming journeys will appear here as soon as you book a stay.'}
              </p>
              <button type="button" className="btn btn-outline btn-block" onClick={() => setFilter('all')}>Show all trips</button>
            </div>
          )}
        </>
      ) : (
        <div className="card acct-empty">
          <img className="acct-empty-art" src="/hotel-staff.svg" alt="Hotel staff welcoming a guest" />
          <h2 className="h2-sm">No stays booked yet</h2>
          <Link to="/hotels" className="btn btn-primary btn-block">Explore stays</Link>
          <Link to="/" className="link-arrow">Back to home</Link>
        </div>
      )}

      {bookingToCancel ? (
        <Modal title="Cancel booking?" onClose={closeCancel}>
          <p className="modal-text">Are you sure you want to cancel your stay at {bookingToCancel.hotel.name}? This action cannot be undone.</p>
          {cancelError && <p className="field-error" role="alert">{cancelError}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={closeCancel} disabled={cancelling}>Keep booking</button>
            <button type="button" className="btn btn-danger" onClick={confirmCancellation} disabled={cancelling} aria-busy={cancelling}>
              {cancelling ? 'Cancelling…' : 'Cancel booking'}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
