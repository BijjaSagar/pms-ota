// "Anything to make it easier?" — TriponX chips for pms-ota's add-ons, early check-in / late check-out,
// plus arrival time and the note to the hotel (special requests).
import { addonTotal, addons, getAddon, EARLY_CHECK_IN_ID, LATE_CHECK_OUT_ID } from '../../lib/data/addons.js';
import { formatCurrency } from '../../lib/utils/pricing.js';
import { SelectField, TextField } from '../Layout.jsx';
import '../../styles/checkout.css';

const ARRIVAL_TIMES = [
  '12:00 PM – 1:00 PM', '1:00 PM – 2:00 PM', '2:00 PM – 3:00 PM', '3:00 PM – 4:00 PM', '4:00 PM – 5:00 PM',
  '5:00 PM – 6:00 PM', '6:00 PM – 8:00 PM', '8:00 PM – 10:00 PM', 'After 10:00 PM', 'Not sure yet',
];

function PriceChip({ active, onClick, label, price, title }) {
  return (
    <button type="button" aria-pressed={active} title={title} className={`chip co-chip ${active ? 'is-active' : ''}`} onClick={onClick}>
      {label}<span className="co-chip-price">+{price}</span>
    </button>
  );
}

export function ExtrasCard({ addonIds, onToggleAddon, earlyCheckIn, lateCheckOut, onEarly, onLate, nights, guests, arrivalTime, specialRequests, onChange }) {
  const listed = addons.filter((a) => a.inAddonList !== false);
  const early = getAddon(EARLY_CHECK_IN_ID);
  const late = getAddon(LATE_CHECK_OUT_ID);
  const arrivalOptions = ARRIVAL_TIMES.includes(arrivalTime) ? ARRIVAL_TIMES : [arrivalTime, ...ARRIVAL_TIMES].filter(Boolean);

  return (
    <section className="card card-lg">
      <h2 className="h-card-lg mb-4">Anything to make it easier?</h2>
      <p className="muted-sm mb-16">Sent straight to the hotel. Optional — extras are added to your total.</p>

      <p className="co-eyebrow mb-10">Travel day</p>
      <div className="row-gap-8 wrap mb-16">
        <PriceChip active={earlyCheckIn} onClick={() => onEarly(!earlyCheckIn)} label="Early check-in from 11 AM" price={formatCurrency(early?.price ?? 0)} title={early?.description} />
        <PriceChip active={lateCheckOut} onClick={() => onLate(!lateCheckOut)} label="Late check-out till 2 PM" price={formatCurrency(late?.price ?? 0)} title={late?.description} />
      </div>

      <p className="co-eyebrow mb-10">Add to your stay</p>
      <div className="row-gap-8 wrap mb-16">
        {listed.map((a) => (
          <PriceChip key={a.id} active={addonIds.includes(a.id)} onClick={() => onToggleAddon(a.id)} label={a.name}
            price={formatCurrency(addonTotal(a, nights, guests))} title={a.description} />
        ))}
      </div>

      <div className="co-extras-grid">
        <SelectField label="Arriving around" value={arrivalTime} onChange={(e) => onChange('arrivalTime', e.target.value)}
          options={arrivalOptions.map((t) => [t, t])} />
        <TextField as="textarea" rows={3} label="Note to the hotel" value={specialRequests}
          onChange={(e) => onChange('specialRequests', e.target.value)} placeholder="e.g. celebrating an anniversary, quiet room please" />
      </div>
    </section>
  );
}
