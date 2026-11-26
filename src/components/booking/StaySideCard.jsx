// TriponX booking summary card (sticky right column on checkout & payment).
// Shows pms-ota's stay data: hotel, room, dates & policy times, guests, cancellation, price rows.
import { BedDouble, Maximize, ShieldCheck, Users } from 'lucide-react';
import { cancellationDeadline, formatDate } from '../../lib/utils/date.js';
import { PriceBreakdown } from './PriceBreakdown.jsx';
import '../../styles/checkout.css';

const ratingWord = (r) => (r >= 4.8 ? 'Exceptional' : 'Excellent');
const short = (t) => t.replace(/^(From|Until)\s+/i, '');

export function StaySideCard({ hotel, room, search, price, addons, totalLabel, totalNote, children }) {
  const deadline = room.refundable ? cancellationDeadline(search.checkIn, hotel.policies.cancellation) : '';
  const guestsText = `${search.adults} ${search.adults === 1 ? 'adult' : 'adults'}${search.kids ? `, ${search.kids} ${search.kids === 1 ? 'child' : 'children'}` : ''}`;

  return (
    <div className="booking-card co-side">
      <div className="sum-head">
        <img className="sum-thumb" src={room.image || hotel.images[0]} alt="" loading="lazy" decoding="async" />
        <div className="co-min">
          <p className="h-room">{hotel.name}</p>
          <p className="muted-sm mb-6">{room.name}{room.breakfast ? ' · breakfast incl.' : ''}</p>
          {hotel.reviewCount > 0
            ? <span className="score">{hotel.rating.toFixed(1)} ★ {ratingWord(hotel.rating)}</span>
            : <span className="muted-xs">New on TriponX</span>}
        </div>
      </div>

      <div className="sum-grid">
        <div><p className="mini-label">CHECK-IN</p><p className="date-v">{formatDate(search.checkIn, 'short')} · {short(hotel.policies.checkIn)}</p></div>
        <div><p className="mini-label">CHECK-OUT</p><p className="date-v">{formatDate(search.checkOut, 'short')} · {short(hotel.policies.checkOut)}</p></div>
        <div><p className="mini-label">GUESTS</p><p className="date-v">{guestsText}</p></div>
        <div><p className="mini-label">{search.rooms > 1 ? 'NIGHTS · ROOMS' : 'NIGHTS'}</p><p className="date-v">{price.nights}{search.rooms > 1 ? ` · ${search.rooms}` : ''}</p></div>
      </div>

      <div className="co-room-line">
        <span><Maximize size={13} aria-hidden="true" />{room.size} m²</span>
        <span><BedDouble size={13} aria-hidden="true" />{room.bed}</span>
        <span><Users size={13} aria-hidden="true" />Up to {room.maxGuests}</span>
      </div>
      <p className={`co-cancel ${room.refundable ? 'is-free' : ''}`}>
        <ShieldCheck size={14} aria-hidden="true" />
        {room.refundable ? `Free cancellation until ${deadline ? formatDate(deadline, 'short') : 'the policy deadline'}` : 'Non-refundable rate'}
      </p>

      <PriceBreakdown price={price} addons={addons} totalLabel={totalLabel} totalNote={totalNote} />
      {children}
    </div>
  );
}
