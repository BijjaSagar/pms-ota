// TriponX room card: photo · name/spec/perks · price & select. Data/features from pms-ota's RoomCard
// (rooms left, description, breakfast, refundability, per-night and stay totals).
import { CheckIcon } from '../Icons.jsx';
import { formatCurrency } from '../../lib/utils/pricing.js';
import '../../styles/hotel-details.css';

export function RoomCard({ room, nights, selected, onSelect }) {
  const total = room.pricePerNight * nights;
  const perks = [...(room.breakfast ? ['Breakfast included'] : []), ...room.amenities.slice(0, 4)];

  return (
    <div className={`room-card ${selected ? 'is-active' : ''}`}>
      <div className="room-thumb photo has-img">
        <img className="photo-img" src={room.image} alt={room.name} loading="lazy" decoding="async" />
        {room.remaining <= 2 && <span className="hd-left">Only {room.remaining} left</span>}
      </div>
      <div className="room-body">
        <h3 className="h-room">{room.name}</h3>
        <p className="muted-sm">{room.size} m² · {room.bed} · up to {room.maxGuests} guests</p>
        <p className="muted-sm hd-clamp-2 mb-10">{room.description}</p>
        <div className="tag-row">
          {perks.map((p) => <span key={p} className="perk"><CheckIcon size={12} width={2.4} color="#3F6B5C" />{p}</span>)}
        </div>
      </div>
      <div className="room-price">
        <p className="price-lg">{formatCurrency(total)}</p>
        <p className="muted-xs">{formatCurrency(room.pricePerNight)} / night · {nights} {nights === 1 ? 'night' : 'nights'}</p>
        <p className={`hd-refund ${room.refundable ? 'is-yes' : ''}`}>{room.refundable ? 'Free cancellation available' : 'Non-refundable rate'}</p>
        <button type="button" role="radio" aria-checked={selected} onClick={() => onSelect(room)}
          className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-outline-dark'}`}>
          {selected ? 'Selected' : 'Select room'}
        </button>
      </div>
    </div>
  );
}
