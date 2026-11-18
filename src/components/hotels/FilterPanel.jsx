// Filters from pms-ota (FilterPanel.tsx): every filter and toggle kept, laid out as TriponX glass filter cards.
// Props unchanged: { filters, onChange, destination, onDestinationChange, className }.
import { Search } from 'lucide-react';
import { useState } from 'react';
import { amenityFilters, hotels, propertyTypeFilters } from '../../lib/data/hotels.js';
import { formatCurrency } from '../../lib/utils/pricing.js';
import '../../styles/hotels.css';

export const PRICE_MIN = 250;
export const PRICE_MAX = 2000;

const preferenceFilters = ['Rush deals', 'Last-minute deal', 'Beachfront', 'Self check-in available', 'Breakfast included', 'Pool access'];
const flexibleOptions = ['Guaranteed early check-in', 'Guaranteed late checkout'];
const houseRuleOptions = ['Alcohol allowed', 'Pets allowed', 'Non-smoking', 'All male guests allowed', 'Unmarried guests allowed'];
const businessOptions = ['WiFi', 'Breakfast included', 'All meals included', 'Breakfast + lunch/dinner', 'Pay at hotel'];

// Nightly-price histogram of the whole catalogue, for the budget card.
const BUCKETS = 9;
const bucketOf = (price) => Math.min(BUCKETS - 1, Math.floor(((price - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * BUCKETS));
const histogram = Array.from({ length: BUCKETS }, (_, i) => hotels.filter((h) => bucketOf(h.pricePerNight) === i).length);
const histMax = Math.max(1, ...histogram);

function CheckRow({ label, checked, onChange, count }) {
  return (
    <label className="check-row">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="grow">{label}</span>
      {count != null && <span className="muted-sm">{count}</span>}
    </label>
  );
}

function ExpandableCheckRows({ options, selected, onToggle, counts }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, 5);
  const hiddenCount = options.length - 5;
  return (
    <div>
      {visible.map((o) => (
        <CheckRow key={o} label={o} checked={selected.includes(o)} onChange={() => onToggle(o)} count={counts?.[o]} />
      ))}
      {hiddenCount > 0 && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="fp-more">
          {expanded ? 'Hide' : `Show ${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}

const amenityCounts = Object.fromEntries(amenityFilters.map((a) => [a, hotels.filter((h) => h.amenities.includes(a)).length]));

export function FilterPanel({ filters, onChange, destination, onDestinationChange, className = '' }) {
  const toggleIn = (key, value) => {
    const list = filters[key];
    onChange({ ...filters, [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] });
  };
  const setMaxPrice = (e) => onChange({ ...filters, maxPrice: Number(e.target.value) });
  const fillPct = ((filters.maxPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
  const activeBucket = bucketOf(filters.maxPrice);

  return (
    <div className={`fp-cards ${className}`}>
      <div className="card">
        <label className="fp-search">
          <Search size={16} className="fp-search-icon" aria-hidden="true" />
          <span className="sr-only">Search by locality or hotel name</span>
          <input type="search" value={destination} onChange={(e) => onDestinationChange(e.target.value)} placeholder="Search for locality / hotel name" />
        </label>
      </div>

      <div className="card">
        <h2 className="h-filter">Your budget</h2>
        <div className="hist" aria-hidden="true">
          {histogram.map((n, i) => (
            <span key={i} style={{ height: `${Math.max(12, (n / histMax) * 100)}%` }} className={i <= activeBucket ? 'on' : ''} />
          ))}
        </div>
        <input type="range" min={PRICE_MIN} max={PRICE_MAX} step={50} value={filters.maxPrice} onChange={setMaxPrice}
          className="fp-range" style={{ '--fill': `${fillPct}%` }} aria-label="Maximum nightly budget" />
        <div className="row-gap-8">
          <div className="mini-field"><span>MIN</span><strong>{formatCurrency(PRICE_MIN)}</strong></div>
          <div className="mini-field"><span>UP TO / NIGHT</span><strong>{formatCurrency(filters.maxPrice)}</strong></div>
        </div>
      </div>

      <div className="card">
        <h2 className="h-filter">For you</h2>
        <ExpandableCheckRows options={preferenceFilters} selected={filters.preferences} onToggle={(v) => toggleIn('preferences', v)} />
      </div>

      <div className="card">
        <h2 className="h-filter">Guest rating</h2>
        <div className="row-gap-8 wrap">
          {[0, 4.5, 4.8, 4.9].map((rating) => (
            <button key={rating} type="button" aria-pressed={filters.minRating === rating}
              className={`square-btn ${filters.minRating === rating ? 'is-active' : ''}`}
              onClick={() => onChange({ ...filters, minRating: rating })}>
              {rating === 0 ? 'Any' : `${rating}+`}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="h-filter">Star category</h2>
        <div className="row-gap-8 wrap">
          {[3, 4, 5].map((stars) => (
            <button key={stars} type="button" aria-pressed={filters.starCategories.includes(stars)}
              className={`chip chip-sm ${filters.starCategories.includes(stars) ? 'is-active' : ''}`}
              onClick={() => toggleIn('starCategories', stars)}>
              {stars} stars
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="h-filter">Property type</h2>
        <div className="row-gap-8 wrap">
          {propertyTypeFilters.map((type) => (
            <button key={type} type="button" aria-pressed={filters.propertyTypes.includes(type)}
              className={`chip chip-sm ${filters.propertyTypes.includes(type) ? 'is-active' : ''}`}
              onClick={() => toggleIn('propertyTypes', type)}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="h-filter">What matters to you</h2>
        <ExpandableCheckRows options={amenityFilters} selected={filters.amenities} onToggle={(v) => toggleIn('amenities', v)} counts={amenityCounts} />
      </div>

      <div className="card">
        <h2 className="h-filter">Flexible check-in/out</h2>
        {flexibleOptions.map((o) => (
          <CheckRow key={o} label={o} checked={filters.flexibleCheckInOut.includes(o)} onChange={() => toggleIn('flexibleCheckInOut', o)} />
        ))}
      </div>

      <div className="card">
        <h2 className="h-filter">House rules</h2>
        {houseRuleOptions.map((r) => (
          <CheckRow key={r} label={r} checked={filters.houseRules.includes(r)} onChange={() => toggleIn('houseRules', r)} />
        ))}
      </div>

      <div className="card">
        <h2 className="h-filter">Business essentials</h2>
        {businessOptions.map((b) => (
          <CheckRow key={b} label={b} checked={filters.businessEssentials.includes(b)} onChange={() => toggleIn('businessEssentials', b)} />
        ))}
      </div>
    </div>
  );
}
