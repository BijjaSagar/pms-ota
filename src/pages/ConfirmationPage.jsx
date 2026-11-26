// Confirmation: the property card (photo, name, room, dates, directions) on the left and the
// confirmation (message, reference, actions) on the right; booking details, price and next steps below.
// Also: reference copy, add-to-calendar (.ics), print and My trips hand-off.
import { CalendarPlus, Check, Copy, Mail, MapPin, Phone, Printer, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyBookingState } from '../components/booking/EmptyBookingState.jsx';
import { PriceBreakdown } from '../components/booking/PriceBreakdown.jsx';
import { useBooking } from '../lib/context/useBooking.js';
import { useTrips } from '../lib/context/useTrips.js';
import { downloadCalendarFile } from '../lib/utils/calendar.js';
import { formatDate, guestsLabel, nightsLabel } from '../lib/utils/date.js';
import '../styles/checkout.css';

export default function ConfirmationPage() {
  const { bookingId } = useParams();
  const { confirmation } = useBooking();
  const { getBooking, addBooking } = useTrips();
  const [copied, setCopied] = useState(false);

  const booking = confirmation && confirmation.reference === bookingId
    ? confirmation
    : bookingId ? getBooking(bookingId) : undefined;

  // Pay-later bookings are confirmed straight from checkout; make sure they land in My trips too.
  useEffect(() => {
    if (confirmation && !getBooking(confirmation.reference)) addBooking(confirmation);
  }, [confirmation, getBooking, addBooking]);

  if (!booking) {
    return (
      <EmptyBookingState
        title="We couldn't find that booking"
        description="The confirmation may have expired from this session. Start a new search and we will take care of the rest."
      />
    );
  }

  const { hotel, room, search, guest, price, reference } = booking;
  const later = booking.paymentMode === 'later';
  const additional = guest.additionalGuests ?? [];
  const addons = booking.addons ?? [];
  const travelDay = [booking.earlyCheckIn ? 'Early check-in' : '', booking.lateCheckOut ? 'Late check-out' : ''].filter(Boolean).join(' · ');
  // A newly approved property may have no map pin: then search by address.
  const directionsUrl = hotel.coordinates
    ? `https://www.openstreetmap.org/?mlat=${hotel.coordinates.lat}&mlon=${hotel.coordinates.lng}#map=16/${hotel.coordinates.lat}/${hotel.coordinates.lng}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(hotel.address ?? hotel.name)}`;

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // Stay, room, dates, guests and check-in times are on the property card at the top.
  const details = [
    ['Lead guest', `${guest.title} ${guest.firstName} ${guest.lastName}`],
    ['Arriving', guest.arrivalTime],
    ['Contact', `${guest.email}${guest.phone ? ` · ${guest.phone}` : ''}`],
    ...(additional.length ? [['Also staying', additional.map((g) => `${g.title} ${g.firstName} ${g.lastName}`).join(', ')]] : []),
    ...(guest.gstNumber ? [['GST invoice', `${guest.gstNumber}${guest.gstBusinessName ? ` · ${guest.gstBusinessName}` : ''}`]] : []),
    ['Extras', addons.length ? addons.map((a) => a.name).join(', ') : 'None'],
    ...(travelDay ? [['Travel day', travelDay]] : []),
    ...(booking.couponCode ? [['Offer', booking.couponCode]] : []),
    ['Requests', guest.specialRequests || 'None — the hotel will be in touch if needed.'],
  ];

  const next = [
    { Icon: Mail, title: 'Check your inbox', text: `Your confirmation is on its way to ${booking.email}.` },
    { Icon: Sparkles, title: `${hotel.name} is expecting you`, text: `Check-in ${hotel.policies.checkIn.toLowerCase()}. ${hotel.policies.cancellation}` },
    { Icon: Phone, title: 'Need a change?', text: 'Call the concierge on +1 (800) 555-0182 (7 AM – 11 PM ET) with your reference.' },
  ];

  const photo = hotel.images?.[0] || room.image;

  return (
    <div className="confirm co-confirm">
      {/* Top: the property on the left, the confirmation on the right (stacked on phones). */}
      <div className="co-hero">
        <article className="card co-stay" aria-label="Your stay">
          {photo && (
            <div className="co-stay-photo">
              <img src={photo} alt={hotel.name} loading="eager" decoding="async" />
            </div>
          )}
          <div className="co-stay-body">
            <p className="mini-label">
              {hotel.propertyType}{hotel.stars ? ` · ${hotel.stars}-star` : ''}
            </p>
            <h2 className="co-stay-name">{hotel.name}</h2>
            <p className="muted-sm">{[hotel.location.city, hotel.location.region].filter(Boolean).join(', ')}</p>
            <dl className="co-stay-facts">
              <div><dt className="mini-label">ROOM</dt><dd>{room.name}</dd></div>
              <div><dt className="mini-label">DATES</dt><dd>{formatDate(search.checkIn, 'short')} – {formatDate(search.checkOut, 'short')} · {nightsLabel(price.nights)}</dd></div>
              <div><dt className="mini-label">GUESTS</dt><dd>{guestsLabel(search.guests, search.rooms)}</dd></div>
              <div><dt className="mini-label">CHECK-IN / OUT</dt><dd>{hotel.policies.checkIn} · {hotel.policies.checkOut}</dd></div>
            </dl>
          </div>
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="co-directions no-print">
            <MapPin size={16} aria-hidden="true" /><span>{hotel.address}</span><span className="link-strong">Directions →</span>
          </a>
        </article>

        <div className="card co-hero-text">
          <div className="confirm-icon"><Check size={38} strokeWidth={2.2} color="#3F6B5C" aria-hidden="true" /></div>
          <h1 className="h1-lg">You're going to {hotel.location.city}.</h1>
          <p className="lead">
            {hotel.name} has your {room.name} booked for {formatDate(search.checkIn, 'short')} – {formatDate(search.checkOut, 'short')}.
            {' '}{later ? 'Pay the hotel when you arrive.' : 'Payment received.'} Confirmation is on its way to {booking.email}.
          </p>

          <div className="co-ref">
            <span className="mini-label">REFERENCE</span>
            <span className="co-ref-code">{reference}</span>
            <button type="button" className="icon-btn co-ref-copy no-print" onClick={copyReference} aria-label="Copy booking reference">
              {copied ? <Check size={14} className="co-ok" /> : <Copy size={14} />}
            </button>
          </div>

          <div className="row-gap-10 wrap co-mt no-print">
            <Link to="/trips" className="btn btn-primary btn-lg">View my trip</Link>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => downloadCalendarFile(booking)}><CalendarPlus size={18} aria-hidden="true" />Add to calendar</button>
            <button type="button" className="btn btn-outline btn-lg" onClick={() => window.print()}><Printer size={18} aria-hidden="true" />Print</button>
          </div>
        </div>
      </div>

      <section className="card card-lg co-confirm-card">
        <dl className="co-details">
          {details.map(([k, v]) => (
            <div key={k}><dt className="mini-label">{k.toUpperCase()}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        <div className="co-divider" />
        <PriceBreakdown price={price} addons={addons} totalLabel={later ? 'Due at property' : 'Paid'}
          totalNote={later ? 'Pay later · settle the balance at the property' : booking.paymentLast4 === 'PayPal' ? 'Paid with PayPal · demo transaction' : `Card ending ${booking.paymentLast4} · demo transaction`} />
      </section>

      <ol className="co-next">
        {next.map(({ Icon, title, text }) => (
          <li key={title} className="card">
            <span className="co-next-icon"><Icon size={18} aria-hidden="true" /></span>
            <p className="h-card">{title}</p>
            <p className="muted-sm">{text}</p>
          </li>
        ))}
      </ol>

      <Link to="/hotels" className="co-back co-back-center no-print">Explore more stays →</Link>
    </div>
  );
}
