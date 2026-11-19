// Ported from pms-ota/src/components/hotels/SearchBar.tsx — same props and behaviour, TriponX glass styling.
import { CalendarDays, ChevronDown, MapPin, Minus, Plus, Search, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { destinations } from '../../lib/data/hotels.js';
import { addDays, toISODate, todayISO } from '../../lib/utils/date.js';
import '../../styles/hotels.css';

const destinationOptions = Array.from(
  new Set([
    ...destinations.flatMap((d) => [d.city, d.country]),
    'Kumarakom', 'Rajasthan', 'Uttarakhand',
  ]),
);

function formatNumericDate(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${month}/${day}/${year}`;
}

export function Counter({ label, value, min, onChange }) {
  return (
    <div className="sb-counter">
      <span>{label}</span>
      <div className="sb-counter-ctrl">
        <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
          <Minus size={14} />
        </button>
        <span className="sb-counter-val">{value}</span>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)}>
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// variant: 'hero' | 'compact'
export function SearchBar({ initial, onSearch, variant = 'hero', className = '' }) {
  const [search, setSearch] = useState(initial);
  const [error, setError] = useState('');
  const [guestMenuOpen, setGuestMenuOpen] = useState(false);
  const [childAges, setChildAges] = useState(Array.from({ length: initial.kids }, () => 5));
  const guestRef = useRef(null);

  // Close the guests popover on outside click / Escape.
  useEffect(() => {
    if (!guestMenuOpen) return undefined;
    const onDown = (e) => { if (guestRef.current && !guestRef.current.contains(e.target)) setGuestMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setGuestMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [guestMenuOpen]);

  const setField = (key, value) => {
    setSearch((current) => {
      if (key === 'checkIn') {
        const checkIn = value;
        const checkOut = current.checkOut <= checkIn
          ? toISODate(addDays(new Date(`${checkIn}T00:00:00`), 1))
          : current.checkOut;
        return { ...current, checkIn, checkOut };
      }
      return { ...current, [key]: value };
    });
    setError('');
  };

  const updateAdults = (nextAdults) => {
    setSearch((c) => ({ ...c, adults: nextAdults, guests: nextAdults + c.kids }));
    setError('');
  };

  const updateChildren = (nextChildren) => {
    setSearch((c) => ({ ...c, kids: nextChildren, guests: c.adults + nextChildren }));
    setChildAges((c) => Array.from({ length: nextChildren }, (_, i) => c[i] ?? 5));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (search.checkOut <= search.checkIn) {
      setError('Your check-out date must be after your check-in date.');
      return;
    }
    onSearch(search);
  };

  const today = todayISO();
  const guestsLabel = `${search.rooms} ${search.rooms === 1 ? 'Room' : 'Rooms'}, ${search.guests} ${search.guests === 1 ? 'Guest' : 'Guests'}`;

  return (
    <form onSubmit={handleSubmit} className={`sb sb-${variant} ${className}`}>
      <div className="sb-grid">
        <div className="sb-field">
          <MapPin size={18} className="sb-icon" aria-hidden="true" />
          <div className="sb-body">
            <label htmlFor={`${variant}-destination`} className="sb-label">Where are you going?</label>
            <input
              id={`${variant}-destination`}
              list="triponx-destinations"
              value={search.destination}
              onChange={(e) => setField('destination', e.target.value)}
              placeholder="Where to?"
              className="sb-input"
              autoComplete="off"
            />
            <datalist id="triponx-destinations">
              {destinationOptions.map((o) => <option key={o} value={o} />)}
            </datalist>
          </div>
        </div>

        <div className="sb-field">
          <CalendarDays size={18} className="sb-icon" aria-hidden="true" />
          <div className="sb-dates">
            <div className="sb-date">
              <label htmlFor={`${variant}-check-in`} className="sb-label">Check-in</label>
              <span className="sb-date-text" aria-hidden="true">{formatNumericDate(search.checkIn)}</span>
              <input id={`${variant}-check-in`} type="date" min={today} value={search.checkIn}
                onChange={(e) => setField('checkIn', e.target.value)} aria-label="Check-in date" className="sb-input sb-date-input" />
            </div>
            <div className="sb-date sb-date-out">
              <label htmlFor={`${variant}-check-out`} className="sb-label">Check-out</label>
              <span className="sb-date-text" aria-hidden="true">{formatNumericDate(search.checkOut)}</span>
              <input id={`${variant}-check-out`} type="date" min={search.checkIn || today} value={search.checkOut}
                onChange={(e) => setField('checkOut', e.target.value)} aria-label="Check-out date" className="sb-input sb-date-input" />
            </div>
          </div>
        </div>

        <div className="sb-field sb-guests" ref={guestRef}>
          <button type="button" className="sb-guests-btn" aria-expanded={guestMenuOpen} onClick={() => setGuestMenuOpen((o) => !o)}>
            <Users size={18} className="sb-icon" aria-hidden="true" />
            <span className="sb-body">
              <span className="sb-label">Guests &amp; rooms</span>
              <span className="sb-value">{guestsLabel}</span>
            </span>
            <ChevronDown size={16} className={`sb-caret ${guestMenuOpen ? 'is-open' : ''}`} />
          </button>

          {guestMenuOpen && (
            <div className="sb-guest-pop glass-pop">
              <Counter label="Rooms" value={search.rooms} min={1} onChange={(v) => setField('rooms', Math.min(3, v))} />
              <Counter label="Adults" value={search.adults} min={1} onChange={updateAdults} />
              <Counter label="Children" value={search.kids} min={0} onChange={updateChildren} />
              {childAges.map((age, index) => (
                <label key={index} className="sb-child-age">
                  Child {index + 1} age
                  <select value={age} onChange={(e) => {
                    const next = [...childAges];
                    next[index] = Number(e.target.value);
                    setChildAges(next);
                  }}>
                    {Array.from({ length: 13 }, (_, a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
              ))}
              <button type="button" className="btn btn-primary btn-sm btn-block mt-14" onClick={() => setGuestMenuOpen(false)}>Apply</button>
            </div>
          )}
        </div>

        <div className="sb-submit-wrap">
          <button type="submit" aria-label="Search hotels" className="btn btn-primary sb-submit">
            <Search size={18} aria-hidden="true" />
            <span>Search hotels</span>
          </button>
        </div>
      </div>
      {error && <p className="field-error sb-error" role="alert">{error}</p>}
    </form>
  );
}
