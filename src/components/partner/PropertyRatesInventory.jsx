import { Fragment, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, BedDouble, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Minus, Plus, Settings, Tag, Trash2 } from 'lucide-react';
import { propertyRatesSectionPath } from './paths.js';
import { RATES_INVENTORY_SECTIONS } from '../../lib/data/ratesInventorySections.js';
import { formatStayDate, formatWeekday, inr } from '../../lib/data/sampleBookings.js';
import '../../styles/partner-properties.css';
import '../../styles/partner-rates-inventory.css';

const DEFAULT_BENEFITS = [
  'Avoid missing advance booking demand due to missing rates and inventory.',
  'Improve property visibility in customer searches on Goibibo and MakeMyTrip.',
  "Improve the property's quality score by maintaining continuous availability.",
  'Update the latest rates and inventory anytime through the calendar screen.',
  'Once rates and inventory are updated on the calendar for a particular date, the default rates and inventory will no longer be used for that date.',
];

const CATEGORIES = [
  'B2C', 'MYBIZ', 'B2B', 'CORPORATE REP', 'BUNDLES',
  'GCC', 'POS', 'MY PARTNER', 'MYPARTNER CUG',
];

const CATEGORY_MULTIPLIER = {
  B2C: 1,
  MYBIZ: 0.96,
  B2B: 0.9,
  'CORPORATE REP': 0.88,
  BUNDLES: 0.84,
  GCC: 0.92,
  POS: 1.04,
  'MY PARTNER': 0.94,
  'MYPARTNER CUG': 0.86,
};

const RATE_PLANS = [
  { id: 'ep', label: 'EP (European Plan)', status: 'Non Editable', supplement: 0 },
  { id: 'cp', label: 'CP (Continental Plan)', status: 'Update Rate', supplement: 800 },
  { id: 'cp2', label: 'CP2 – Super Package', status: 'Non Editable', supplement: 1400, package: true },
];

const ROOMS = [
  { id: 'deluxe', name: 'Deluxe King', type: 'King · 320 sqft', base: 6500, weekend: 7200, inventory: 12, sold: 7, blocked: 1, mealPlan: 'Breakfast', extraInventory: 4 },
  { id: 'premier', name: 'Premier Room', type: 'Twin · 380 sqft', base: 8200, weekend: 9000, inventory: 9, sold: 4, blocked: 1, mealPlan: 'Breakfast', extraInventory: 3 },
  { id: 'suite', name: 'Executive Suite', type: 'King · 520 sqft', base: 12500, weekend: 13800, inventory: 5, sold: 3, blocked: 0, mealPlan: 'Dinner', extraInventory: 2 },
  {
    id: 'family', name: 'Family Studio', type: '2 queens · 440 sqft', base: 9800, weekend: 10800,
    inventory: 7, sold: 2, blocked: 1, mealPlan: 'Breakfast', extraInventory: 3,
    sampleRates: {
      ep: { base: 4140, single: 3780 },
      cp: { base: 4600, single: 4200 },
      cp2: { base: 6164, single: 5628 },
    },
    sampleAvailability: [
      { available: 0, sold: 0 }, { available: 1, sold: 2 }, { available: 0, sold: 0 },
      { available: 0, sold: 4 }, { available: 5, sold: 0 }, { available: 3, sold: 1 },
      { available: 1, sold: 3 },
    ],
  },
];

const MEAL_PLANS = ['Room only', 'Breakfast', 'Half board', 'Dinner'];

const EARLY_TIMES = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
const LATE_TIMES = ['12:00', '13:00', '14:00', '15:00', '16:00'];
const EXTRA_STEPS = [
  { id: 'ri-extra-time', title: 'Configure Time', description: 'Set early check-in and late checkout timings.' },
  { id: 'ri-extra-price', title: 'Define Price', description: 'Assign flat rates or day-rate percentages.' },
  { id: 'ri-extra-rooms', title: 'Set Room & Inventory Controls', description: 'Configure room availability and inventory controls.' },
];

const CATEGORY_INDEX = Object.fromEntries(CATEGORIES.map((name, index) => [name, index]));

const toIsoDate = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

const STAY_DATES = Array.from({ length: 7 }, (_, index) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + index);
  const iso = toIsoDate(date);
  return {
    iso,
    short: formatStayDate(iso),
    weekday: new Intl.DateTimeFormat('en-IN', { weekday: 'long' }).format(date),
    label: new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long' }).format(date),
  };
});

const HOURLY_PRICES = { three: 2820, six: 3290, fullDay: 4700 };
const HOURLY_WEEK_PATTERN = [
  { available: 0, sold: 0, soldSlots: 0, status: 'entered', notification: true },
  { available: null, sold: 0, soldSlots: 0, status: 'empty' },
  { available: null, sold: 0, soldSlots: 0, status: 'non-sellable' },
  { available: null, sold: 0, soldSlots: 0, status: 'non-sellable' },
  { available: null, sold: 0, soldSlots: 0, status: 'empty' },
  { available: null, sold: 0, soldSlots: 0, status: 'empty' },
  { available: null, sold: 0, soldSlots: 0, status: 'empty' },
];

const buildHourlyWeek = (offset) => {
  const start = new Date(2026, 10, 25 + offset * 7);
  start.setHours(12, 0, 0, 0);
  return HOURLY_WEEK_PATTERN.map((pattern, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = toIsoDate(date);
    return {
      ...pattern,
      iso,
      short: formatStayDate(iso),
      weekday: formatWeekday(iso),
      price3: HOURLY_PRICES.three,
      price6: HOURLY_PRICES.six,
      fullDay: HOURLY_PRICES.fullDay,
    };
  });
};

const displayTime = (value) => new Intl.DateTimeFormat('en-US', {
  hour: 'numeric', minute: '2-digit', hour12: true,
}).format(new Date(`2000-01-01T${value}:00`)).toUpperCase();

const BOOKING_PATTERN = [5, 7, 9, 6, 12, 8, 3];

const availabilityFor = (room, dateIndex, category) => {
  if (room.sampleAvailability?.[dateIndex]) return room.sampleAvailability[dateIndex];
  const offset = CATEGORY_INDEX[category] ?? 0;
  const sold = Math.min(
    room.inventory,
    BOOKING_PATTERN[(dateIndex + offset) % BOOKING_PATTERN.length] + (room.inventory <= 6 ? 2 : 0),
  );
  return { available: Math.max(0, room.inventory - sold), sold };
};

const makeRoomRates = (room, category) => {
  const multiplier = CATEGORY_MULTIPLIER[category] ?? 1;
  return Object.fromEntries(RATE_PLANS.map(({ id, supplement }) => {
    const sample = room.sampleRates?.[id];
    const rawBase = sample?.base ?? (room.base + supplement);
    const rawSingle = sample?.single ?? (rawBase / 2 + 500);
    const rates = { base: Math.round(rawBase * multiplier), single: Math.round(rawSingle * multiplier) };
    return [id, Object.fromEntries(STAY_DATES.map(({ iso }) => [iso, rates]))];
  }));
};

const asNumber = (value) => Math.max(0, Number(value) || 0);

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`ri-toggle ${checked ? 'is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

function NumberField({ label, value, onChange, min = 0, max }) {
  return (
    <label className="ri-field">
      <span>{label}</span>
      <input
        className="ri-input"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const next = asNumber(event.target.value);
          onChange(max === undefined ? next : Math.min(max, next));
        }}
      />
    </label>
  );
}

function YesNoRadioGroup({ name, label, value, onChange }) {
  return (
    <fieldset className="ri-yesno">
      <legend>{label}</legend>
      <div className="ri-segments">
        {[{ option: 'Yes', checked: true }, { option: 'No', checked: false }].map(({ option, checked }) => (
          <label key={option} className={`ri-segment ${value === checked ? 'is-on' : ''}`}>
            <input type="radio" className="sr-only" name={name} checked={value === checked}
              onChange={() => onChange(checked)} />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Stepper({ value, onChange, max = 20, label }) {
  return (
    <div className="ri-stepper" aria-label={label}>
      <button type="button" className="ri-step-btn" aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(0, value - 1))} disabled={value <= 0}>
        <Minus size={14} aria-hidden="true" />
      </button>
      <strong>{value}</strong>
      <button type="button" className="ri-step-btn" aria-label={`Increase ${label}`}
        onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Plus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function PanelHeader({ title, description, action }) {
  return (
    <div className="ri-panel-head">
      <div className="ri-panel-head-copy">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div className="ri-panel-head-action">{action}</div> : null}
    </div>
  );
}

function ManageRatesPanel() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selectedDate, setSelectedDate] = useState(STAY_DATES[0].iso);
  const [expandedRooms, setExpandedRooms] = useState(() => new Set());
  const [adding, setAdding] = useState(false);
  const [addUnits, setAddUnits] = useState(1);
  const [inventory, setInventory] = useState(() => (
    Object.fromEntries(ROOMS.map((room) => [
      room.id,
      STAY_DATES.map(({ iso, short }, index) => ({ iso, short, ...availabilityFor(room, index, CATEGORIES[0]) })),
    ]))
  ));
  const [roomRates, setRoomRates] = useState(() => (
    Object.fromEntries(CATEGORIES.map((name) => [
      name,
      Object.fromEntries(ROOMS.map((room) => [room.id, makeRoomRates(room, name)])),
    ]))
  ));

  const allExpanded = expandedRooms.size === ROOMS.length;
  const selectedLabel = STAY_DATES.find(({ iso }) => iso === selectedDate)?.label ?? '';

  const toggleRoom = (roomId) => {
    setExpandedRooms((previous) => {
      const next = new Set(previous);
      if (next.has(roomId)) next.delete(roomId);
      else next.add(roomId);
      return next;
    });
  };

  const toggleAll = () => setExpandedRooms(allExpanded ? new Set() : new Set(ROOMS.map(({ id }) => id)));

  const addInventory = (event) => {
    event.preventDefault();
    const units = Math.max(1, asNumber(addUnits));
    setInventory((previous) => Object.fromEntries(
      Object.entries(previous).map(([roomId, days]) => [
        roomId,
        days.map((day) => (day.iso === selectedDate ? { ...day, available: day.available + units } : day)),
      ]),
    ));
    setAdding(false);
    setAddUnits(1);
  };

  const updateRate = (roomId, planId, iso, field, value) => {
    setRoomRates((previous) => ({
      ...previous,
      [category]: {
        ...previous[category],
        [roomId]: {
          ...previous[category][roomId],
          [planId]: {
            ...previous[category][roomId][planId],
            [iso]: {
              ...previous[category][roomId][planId][iso],
              [field]: asNumber(value),
            },
          },
        },
      },
    }));
  };

  return (
    <section className="ri-card ri-calendar">
      <div className="ri-card-head">
        <div>
          <h4>Rooms &amp; rates calendar</h4>
          <p>Static demo values — edits update this session only.</p>
        </div>
        <span className="ri-badge">{category}</span>
      </div>
      <div className="ri-chip-row" role="group" aria-label="Rate categories">
        {CATEGORIES.map((name) => (
          <button key={name} type="button"
            className={`ri-chip ${category === name ? 'is-on' : ''}`}
            aria-pressed={category === name}
            onClick={() => setCategory(name)}>
            {name}
          </button>
        ))}
      </div>

      <div className="ri-cal-toolbar">
        <span className="ri-cal-hint">Highlighted date: <strong>{selectedLabel}</strong></span>
        <div className="ri-cal-actions">
          <button type="button" className="btn btn-light btn-sm" onClick={toggleAll}>
            {allExpanded ? 'Collapse All Rooms & Rate Plans' : 'Expand All Rooms & Rate Plans'}
          </button>
          <button type="button" className="btn btn-dark btn-sm" aria-expanded={adding}
            onClick={() => setAdding((open) => !open)}>
            Add Inventory on Highlighted Dates
          </button>
        </div>
      </div>

      {adding && (
        <form className="ri-add-form" onSubmit={addInventory}>
          <label className="ri-field">
            <span>Rooms to add on {selectedLabel}</span>
            <input className="ri-input" type="number" min="1" value={addUnits}
              onChange={(event) => setAddUnits(asNumber(event.target.value))} />
          </label>
          <button type="submit" className="btn btn-primary btn-sm">Add inventory</button>
          <button type="button" className="btn btn-light btn-sm" onClick={() => setAdding(false)}>Cancel</button>
        </form>
      )}

      <div className="ri-table-wrap">
        <table className="ri-table ri-calendar-table">
          <thead>
            <tr>
              <th scope="col">Room / rate plan</th>
              {STAY_DATES.map(({ iso, weekday, short }) => (
                <th scope="col" key={iso} className={selectedDate === iso ? 'is-selected' : ''}>
                  <button type="button" className="ri-date-head-btn"
                    aria-pressed={selectedDate === iso}
                    onClick={() => setSelectedDate(iso)}>
                    <span className="ri-date-weekday">{weekday}</span>
                    <span className="ri-cell-sub">{short}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROOMS.map((room) => {
              const rates = roomRates[category][room.id];
              const expanded = expandedRooms.has(room.id);
              return (
                <Fragment key={room.id}>
                  <tr className="ri-room-date-row">
                    <th scope="row" data-label="Room / rate plan">
                      <button type="button" className="ri-room-btn" aria-expanded={expanded}
                        aria-controls={`room-rates-${room.id}`}
                        onClick={() => toggleRoom(room.id)}>
                        <span>
                          <strong>{room.name}</strong>
                          <span className="ri-cell-sub">{room.type}</span>
                        </span>
                        <span className="ri-room-chevron" aria-hidden="true">{expanded ? '−' : '+'}</span>
                      </button>
                    </th>
                    {inventory[room.id].map((day) => (
                      <td data-label={day.short} key={day.iso}>
                        <span className={`ri-inv-cell ${day.available === 0 ? 'is-zero' : ''}`}>
                          <span className="ri-inv-main">
                            {day.available === 0 && <AlertTriangle size={13} className="ri-inv-warn" aria-label="No inventory" />}
                            <strong>{day.available}</strong>
                          </span>
                          <span className="ri-date-sub">{day.sold} sold</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                  {expanded && (
                    <tr className="ri-room-detail-row" id={`room-rates-${room.id}`}>
                      <td colSpan={STAY_DATES.length + 1}>
                        <div className="ri-plan-stack">
                          {RATE_PLANS.map((plan) => (
                            <section className="ri-plan-block" key={plan.id} aria-label={`${plan.label} rates`}>
                              <div className="ri-plan-bar">
                                <span className="ri-plan-name">{plan.label}</span>
                                <span className={`ri-status-chip ${plan.id === 'cp' ? 'is-editable' : 'is-readonly'}`}>
                                  {plan.status}
                                </span>
                                <div className="ri-plan-links">
                                  <button type="button" className="ri-link-btn" title="Demo only">Extra Rates &amp; Restrictions</button>
                                  {plan.package && (
                                    <button type="button" className="ri-link-btn" title="Demo only">Edit Package / Inclusions</button>
                                  )}
                                </div>
                              </div>
                              {[
                                { field: 'base', label: '2 Guests – Base Rate' },
                                { field: 'single', label: '1 Guest' },
                              ].map(({ field, label }) => (
                                <div className="ri-rate-line" key={field}>
                                  <span className="ri-rate-label">{label}</span>
                                  {STAY_DATES.map(({ iso, short }) => {
                                    const value = rates[plan.id][iso][field];
                                    return (
                                      <span className="ri-rate-cell" key={iso} data-label={short}>
                                        {plan.id === 'cp' ? (
                                          <input className="ri-input ri-price-input" type="number" min="0"
                                            aria-label={`${room.name} ${plan.label} ${label} ${short}`}
                                            value={value}
                                            onChange={(event) => updateRate(room.id, plan.id, iso, field, event.target.value)} />
                                        ) : <span className="ri-price">{inr(value)}</span>}
                                      </span>
                                    );
                                  })}
                                </div>
                              ))}
                            </section>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PaidExtrasPanel() {
  const [early, setEarly] = useState({
    enabled: true, time: EARLY_TIMES[1], priceMode: 'flat', flatPrice: 750, percent: 10,
  });
  const [late, setLate] = useState({
    enabled: true, time: LATE_TIMES[1], priceMode: 'flat', flatPrice: 900, percent: 10,
  });
  const [slotControls, setSlotControls] = useState({ early: 4, late: 3 });
  const [controlsOpen, setControlsOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(EXTRA_STEPS[0].id);
  const [roomControllers, setRoomControllers] = useState(() => (
    ROOMS.map((room) => ({ id: room.id, name: room.name, inventory: room.extraInventory }))
  ));
  const [blackouts, setBlackouts] = useState([
    { id: 1, from: '2026-12-24', to: '2026-12-26', reason: 'Peak demand' },
    { id: 2, from: '2027-01-14', to: '2027-01-16', reason: 'Private event' },
  ]);
  const [draft, setDraft] = useState({ from: '', to: '', reason: '' });
  const [blackoutError, setBlackoutError] = useState('');

  const sampleDayRate = ROOMS[0].base;
  const sampleDate = STAY_DATES[0].short;

  const pricePreview = (extra, dayLabel, timeLabel) => (extra.priceMode === 'flat'
    ? { value: inr(extra.flatPrice), note: `Flat charge · ${timeLabel}` }
    : {
      value: `≈ ${inr(Math.round((extra.percent / 100) * sampleDayRate))}`,
      note: `${extra.percent}% of ${dayLabel} day rate · ${ROOMS[0].name}, ${sampleDate}`,
    });
  const earlyPreview = pricePreview(early, 'check-in', `arrival ${early.time}`);
  const latePreview = pricePreview(late, 'check-out', `departure ${late.time}`);

  const updateExtra = (setter, key, value) => {
    setter((previous) => ({ ...previous, [key]: value }));
  };

  const updateSlot = (key, value) => {
    setSlotControls((previous) => ({ ...previous, [key]: value }));
  };

  const updateRoomController = (index, value) => {
    setRoomControllers((previous) => previous.map((room, roomIndex) => (
      roomIndex === index ? { ...room, inventory: value } : room
    )));
  };

  const addBlackout = (event) => {
    event.preventDefault();
    if (!draft.from || !draft.to) {
      setBlackoutError('Choose both a from and a to date.');
      return;
    }
    if (draft.to < draft.from) {
      setBlackoutError('The to date must be on or after the from date.');
      return;
    }
    if (blackouts.some((item) => item.from === draft.from && item.to === draft.to)) {
      setBlackoutError('That blackout range already exists.');
      return;
    }
    setBlackouts((previous) => [...previous, { id: Date.now(), ...draft }]);
    setDraft({ from: '', to: '', reason: '' });
    setBlackoutError('');
  };

  return (
    <div className="ri-stack">
      <div className="ri-steps" role="group" aria-label="Setup in 3 easy steps">
        {EXTRA_STEPS.map((step, index) => (
          <a key={step.id} href={`#${step.id}`}
            className={`ri-step ${activeStep === step.id ? 'is-current' : ''}`}
            aria-current={activeStep === step.id ? 'step' : undefined}
            onClick={() => setActiveStep(step.id)}>
            <span className="ri-step-num">{index + 1}</span>
            <span className="ri-step-copy">
              <strong>{step.title}</strong>
              <span>{step.description}</span>
            </span>
          </a>
        ))}
      </div>

      <section className="ri-card ri-extra-section" id="ri-extra-time">
        <div className="ri-card-head">
          <div><h4>Configure time</h4><p>Enable paid extra hours and choose arrival and departure times.</p></div>
          <span className="ri-badge">Step 1</span>
        </div>
        <div className="ri-grid-2 ri-extra-grid">
          <div className={`ri-extra-block ${early.enabled ? '' : 'is-off'}`}>
            <div className="ri-extra-block-head">
              <h5>Set early check-in</h5>
              <YesNoRadioGroup name="early-enabled" label="Paid early check-in" value={early.enabled}
                onChange={(enabled) => updateExtra(setEarly, 'enabled', enabled)} />
            </div>
            <label className="ri-field">
              <span>Early check-in time</span>
              <select className="ri-input" value={early.time} disabled={!early.enabled}
                onChange={(event) => updateExtra(setEarly, 'time', event.target.value)}>
                {EARLY_TIMES.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </label>
          </div>
          <div className={`ri-extra-block ${late.enabled ? '' : 'is-off'}`}>
            <div className="ri-extra-block-head">
              <h5>Set late check-out</h5>
              <YesNoRadioGroup name="late-enabled" label="Paid late check-out" value={late.enabled}
                onChange={(enabled) => updateExtra(setLate, 'enabled', enabled)} />
            </div>
            <label className="ri-field">
              <span>Late check-out time</span>
              <select className="ri-input" value={late.time} disabled={!late.enabled}
                onChange={(event) => updateExtra(setLate, 'time', event.target.value)}>
                {LATE_TIMES.map((time) => <option key={time} value={time}>{time}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="ri-card ri-extra-section" id="ri-extra-price">
        <div className="ri-card-head">
          <div><h4>Define price</h4><p>Choose a flat rate or a percentage of the applicable day rate.</p></div>
          <span className="ri-badge">Step 2</span>
        </div>
        <div className="ri-grid-2 ri-extra-grid">
          <div className={`ri-extra-block ${early.enabled ? '' : 'is-off'}`}>
            <h5>Early check-in price</h5>
            <fieldset className="ri-extra-price-fields" disabled={!early.enabled}>
              <div className="ri-price-modes" role="group" aria-label="Early check-in pricing method">
                <label className={`ri-price-mode ${early.priceMode === 'flat' ? 'is-on' : ''}`}>
                  <input className="sr-only" type="radio" name="early-price-mode" checked={early.priceMode === 'flat'}
                    onChange={() => updateExtra(setEarly, 'priceMode', 'flat')} />
                  <span>Flat rate</span>
                </label>
                <label className={`ri-price-mode ${early.priceMode === 'percent' ? 'is-on' : ''}`}>
                  <input className="sr-only" type="radio" name="early-price-mode" checked={early.priceMode === 'percent'}
                    onChange={() => updateExtra(setEarly, 'priceMode', 'percent')} />
                  <span>Percentage of (Check-in) day rate</span>
                </label>
              </div>
              {early.priceMode === 'flat' ? (
                <NumberField label="Flat rate (₹)" value={early.flatPrice}
                  onChange={(flatPrice) => updateExtra(setEarly, 'flatPrice', flatPrice)} />
              ) : (
                <NumberField label="Percentage (%)" value={early.percent} max={100}
                  onChange={(percent) => updateExtra(setEarly, 'percent', percent)} />
              )}
            </fieldset>
            <div className="ri-preview">
              <strong>{earlyPreview.value}</strong>
              <span className="ri-preview-note">{earlyPreview.note}</span>
            </div>
          </div>
          <div className={`ri-extra-block ${late.enabled ? '' : 'is-off'}`}>
            <h5>Late check-out price</h5>
            <fieldset className="ri-extra-price-fields" disabled={!late.enabled}>
              <div className="ri-price-modes" role="group" aria-label="Late check-out pricing method">
                <label className={`ri-price-mode ${late.priceMode === 'flat' ? 'is-on' : ''}`}>
                  <input className="sr-only" type="radio" name="late-price-mode" checked={late.priceMode === 'flat'}
                    onChange={() => updateExtra(setLate, 'priceMode', 'flat')} />
                  <span>Flat rate</span>
                </label>
                <label className={`ri-price-mode ${late.priceMode === 'percent' ? 'is-on' : ''}`}>
                  <input className="sr-only" type="radio" name="late-price-mode" checked={late.priceMode === 'percent'}
                    onChange={() => updateExtra(setLate, 'priceMode', 'percent')} />
                  <span>Percentage of (Check-out) day rate</span>
                </label>
              </div>
              {late.priceMode === 'flat' ? (
                <NumberField label="Flat rate (₹)" value={late.flatPrice}
                  onChange={(flatPrice) => updateExtra(setLate, 'flatPrice', flatPrice)} />
              ) : (
                <NumberField label="Percentage (%)" value={late.percent} max={100}
                  onChange={(percent) => updateExtra(setLate, 'percent', percent)} />
              )}
            </fieldset>
            <div className="ri-preview">
              <strong>{latePreview.value}</strong>
              <span className="ri-preview-note">{latePreview.note}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ri-card ri-extra-section" id="ri-extra-rooms">
        <div className="ri-card-head">
          <div><h4>Room &amp; inventory controls</h4><p>Configure room availability and inventory-related controls.</p></div>
          <span className="ri-badge">Step 3</span>
        </div>
        <button type="button" className="ri-disclosure-btn" aria-expanded={controlsOpen}
          aria-controls="ri-extra-controls-body" onClick={() => setControlsOpen((open) => !open)}>
          <span>{controlsOpen ? 'Hide room availability controls' : 'Configure room availability'}</span>
          <span className="ri-room-chevron" aria-hidden="true">{controlsOpen ? '−' : '+'}</span>
        </button>
        <div className="ri-disclosure-body" id="ri-extra-controls-body" hidden={!controlsOpen}>
          <div className="ri-field-grid">
            <div className="ri-step-row">
              <div><strong>Early check-in slots</strong><span className="ri-cell-sub">Rooms available for paid early arrivals</span></div>
              <Stepper value={slotControls.early} max={12} label="early check-in slots"
                onChange={(value) => updateSlot('early', value)} />
            </div>
            <div className="ri-step-row">
              <div><strong>Late check-out slots</strong><span className="ri-cell-sub">Rooms available for paid late departures</span></div>
              <Stepper value={slotControls.late} max={12} label="late check-out slots"
                onChange={(value) => updateSlot('late', value)} />
            </div>
          </div>
          <div className="ri-step-list">
            {roomControllers.map((room, index) => (
              <div className="ri-step-row" key={room.id}>
                <div><strong>{room.name}</strong><span className="ri-cell-sub">Rooms available for early / late stays</span></div>
                <Stepper value={room.inventory} max={12} label={`${room.name} extra-hour inventory`}
                  onChange={(value) => updateRoomController(index, value)} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="ri-card ri-extra-section" id="ri-extra-blackout">
        <div className="ri-card-head">
          <div><h4>Blackout dates</h4><p>Apply booking restrictions when specific dates are blocked.</p></div>
        </div>
        <form className="ri-blackout-form" onSubmit={addBlackout}>
          <label className="ri-field"><span>From</span><input className="ri-input" type="date" value={draft.from}
            onChange={(event) => setDraft((previous) => ({ ...previous, from: event.target.value }))} /></label>
          <label className="ri-field"><span>To</span><input className="ri-input" type="date" min={draft.from || undefined}
            value={draft.to}
            onChange={(event) => setDraft((previous) => ({ ...previous, to: event.target.value }))} /></label>
          <label className="ri-field ri-field-grow"><span>Reason</span><input className="ri-input" type="text"
            placeholder="e.g. Peak demand" value={draft.reason}
            onChange={(event) => setDraft((previous) => ({ ...previous, reason: event.target.value }))} /></label>
          <button type="submit" className="btn btn-dark btn-sm">Add blackout</button>
        </form>
        {blackoutError && <p className="ri-form-error" role="alert">{blackoutError}</p>}
        <div className="ri-tag-list" aria-live="polite">
          {blackouts.length ? blackouts.map((item) => (
            <span className="ri-tag" key={item.id}>
              {formatStayDate(item.from)} – {formatStayDate(item.to)}
              {item.reason ? ` · ${item.reason}` : ''}
              <button type="button" className="ri-tag-remove" aria-label="Remove blackout"
                onClick={() => setBlackouts((previous) => previous.filter((entry) => entry.id !== item.id))}>
                <Trash2 size={13} aria-hidden="true" />
              </button>
            </span>
          )) : <p className="ri-empty">No blackout dates set.</p>}
        </div>
      </section>
    </div>
  );
}

function DefaultRatesPanel() {
  const [rows, setRows] = useState(() => ROOMS.map((room) => ({
    id: room.id,
    name: room.name,
    type: room.type,
    base: room.base,
    weekend: room.weekend,
    inventory: room.inventory,
    mealPlan: room.mealPlan,
    minNights: 1,
  })));
  const [detailsOpen, setDetailsOpen] = useState(false);

  const updateRow = (index, field, value) => {
    setRows((previous) => previous.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: field === 'mealPlan' ? value : asNumber(value) } : row
    )));
  };

  return (
    <div className="ri-stack">
      <div className="ri-default-grid">
        <section className="ri-card ri-default-benefits">
          <div className="ri-card-head">
            <div><h4>Why configure defaults?</h4><p>Keep every unscheduled date ready to sell.</p></div>
            <span className="ri-badge">5 benefits</span>
          </div>
          <ul className="ri-benefit-list">
            {DEFAULT_BENEFITS.map((benefit) => (
              <li className="ri-benefit-item" key={benefit}>
                <span className="ri-benefit-check"><CheckCircle2 size={16} /></span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ri-card ri-default-intro">
          <div className="ri-default-art" aria-hidden="true">
            <span className="ri-default-art-tile"><CalendarDays size={24} /></span>
            <span className="ri-default-art-line" />
            <span className="ri-default-art-tile"><BedDouble size={24} /></span>
            <span className="ri-default-art-line" />
            <span className="ri-default-art-tile"><Tag size={24} /></span>
          </div>
          <div className="ri-default-intro-copy">
            <h4>Set your own Default Rates &amp; Inventory</h4>
            <p>Any date where rates and inventory have not been updated will be sold using the default rates and inventory data provided by the hotel.</p>
          </div>
          <button type="button" className="btn btn-dark btn-sm" aria-expanded={detailsOpen}
            aria-controls="ri-default-details" onClick={() => setDetailsOpen((open) => !open)}>
            {detailsOpen ? 'Hide Details' : 'See Details'}
          </button>
        </section>
      </div>

      {detailsOpen && (
        <section className="ri-card ri-default-details" id="ri-default-details">
          <div className="ri-card-head">
            <div><h4>Fallback rate plan</h4><p>Used when a date has no calendar-specific rates or inventory.</p></div>
            <span className="ri-badge">Defaults</span>
          </div>
          <div className="ri-table-wrap">
            <table className="ri-table">
              <thead>
                <tr>
                  <th>Room</th><th>Base rate</th><th>Weekend rate</th><th>Meal plan</th>
                  <th>Inventory</th><th>Min nights</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id}>
                    <td data-label="Room"><strong>{row.name}</strong><span className="ri-cell-sub">{row.type}</span></td>
                    <td data-label="Base rate">
                      <input className="ri-input" type="number" min="0" value={row.base}
                        aria-label={`${row.name} default base rate`}
                        onChange={(event) => updateRow(index, 'base', event.target.value)} />
                    </td>
                    <td data-label="Weekend rate">
                      <input className="ri-input" type="number" min="0" value={row.weekend}
                        aria-label={`${row.name} default weekend rate`}
                        onChange={(event) => updateRow(index, 'weekend', event.target.value)} />
                    </td>
                    <td data-label="Meal plan">
                      <select className="ri-input" value={row.mealPlan}
                        aria-label={`${row.name} default meal plan`}
                        onChange={(event) => updateRow(index, 'mealPlan', event.target.value)}>
                        {MEAL_PLANS.map((plan) => <option key={plan}>{plan}</option>)}
                      </select>
                    </td>
                    <td data-label="Inventory">
                      <input className="ri-input" type="number" min="0" value={row.inventory}
                        aria-label={`${row.name} default inventory`}
                        onChange={(event) => updateRow(index, 'inventory', event.target.value)} />
                    </td>
                    <td data-label="Min nights">
                      <input className="ri-input" type="number" min="1" value={row.minNights}
                        aria-label={`${row.name} minimum nights`}
                        onChange={(event) => updateRow(index, 'minNights', event.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ri-note">Changes stay in this demo session; no API calls or persistence.</div>
        </section>
      )}
    </div>
  );
}

function HourlyStaysPanel({ propertyId, propertyName }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [overrides, setOverrides] = useState({});
  const [expandedDates, setExpandedDates] = useState(() => new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [extraChargesOpen, setExtraChargesOpen] = useState(false);
  const [settings, setSettings] = useState({ checkIn: '08:00', duration: 10, checkOut: '18:00' });
  const [settingsDraft, setSettingsDraft] = useState(settings);
  const [bulkDraft, setBulkDraft] = useState({ field: 'available', value: 1 });
  const [linkage, setLinkage] = useState({});
  const [linkageOpen, setLinkageOpen] = useState(() => new Set());
  const dates = buildHourlyWeek(weekOffset).map((date) => ({ ...date, ...overrides[date.iso] }));
  const rangeLabel = `${dates[0].short} – ${dates[dates.length - 1].short}`;

  const updateDate = (iso, patch) => {
    setOverrides((previous) => ({ ...previous, [iso]: { ...previous[iso], ...patch } }));
  };

  const toggleSetValue = (setter, value) => {
    setter((previous) => {
      const next = new Set(previous);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const applyBulk = () => {
    setOverrides((previous) => {
      const next = { ...previous };
      dates.forEach(({ iso }) => {
        next[iso] = {
          ...next[iso],
          [bulkDraft.field]: asNumber(bulkDraft.value),
          ...(bulkDraft.field === 'available' ? { status: 'entered', notification: false } : {}),
        };
      });
      return next;
    });
    setBulkOpen(false);
  };

  const inventoryCell = (date) => {
    if (date.status === 'non-sellable') {
      return <span className="ri-hour-nonsell">Non-sellable</span>;
    }
    return (
      <input className={`ri-input ri-hour-inv ${date.status === 'empty' ? 'is-empty' : 'is-entered'}`}
        type="number" min="0" value={date.available ?? ''}
        aria-label={`${date.short} available rooms`}
        onChange={(event) => updateDate(date.iso, { available: asNumber(event.target.value), status: 'entered', notification: false })} />
    );
  };

  const priceCell = (date, field, label) => (
    <input className="ri-input ri-hour-price" type="number" min="0" value={date[field]}
      aria-label={`${date.short} ${label}`}
      onChange={(event) => updateDate(date.iso, { [field]: asNumber(event.target.value) })} />
  );

  return (
    <div className="ri-hour-dashboard">
      <section className="ri-hour-banner">
        <div>
          <span className="ri-eyebrow">Goibibo Connect</span>
          <h4>Manage Inventory, Rates &amp; Restrictions</h4>
          <p>Currency: INR · Default Rates &amp; Inventory: Active</p>
        </div>
        <div className="ri-hour-banner-meta">
          <span className="ri-badge">Hourly Stays</span>
          <span className="ri-sample">{propertyName}</span>
        </div>
      </section>

      <nav className="ri-hour-tabs" aria-label="Inventory views">
        <Link className="ri-hour-tab" to={propertyRatesSectionPath(propertyId, 'manage')}>All Rooms</Link>
        <Link className="ri-hour-tab is-current" aria-current="page"
          to={propertyRatesSectionPath(propertyId, 'hourly')}>Hourly Stays</Link>
      </nav>

      <section className="ri-card ri-hour-config">
        <div className="ri-card-head">
          <div>
            <h4>Family Studio (Hourly)</h4>
            <p>First Check-in {displayTime(settings.checkIn)} · Duration {settings.duration} hours · Last Check-out {displayTime(settings.checkOut)}</p>
          </div>
          <span className="ri-badge">Hourly room</span>
        </div>
        <div className="ri-hour-actions">
          <button type="button" className="btn btn-light btn-sm" aria-expanded={settingsOpen}
            onClick={() => { setSettingsDraft(settings); setSettingsOpen((open) => !open); }}>
            <Settings size={14} aria-hidden="true" /> Settings
          </button>
          <button type="button" className="btn btn-dark btn-sm" aria-expanded={bulkOpen}
            onClick={() => setBulkOpen((open) => !open)}>
            <CalendarDays size={14} aria-hidden="true" /> Bulk Update
          </button>
        </div>
        {settingsOpen && (
          <div className="ri-hour-inline-panel">
            <div className="ri-hour-inline-grid">
              <label className="ri-field">
                <span>First check-in</span>
                <input className="ri-input" type="time" value={settingsDraft.checkIn}
                  onChange={(event) => setSettingsDraft((draft) => ({ ...draft, checkIn: event.target.value }))} />
              </label>
              <NumberField label="Duration (hours)" value={settingsDraft.duration} min={1} max={24}
                onChange={(duration) => setSettingsDraft((draft) => ({ ...draft, duration }))} />
              <label className="ri-field">
                <span>Last check-out</span>
                <input className="ri-input" type="time" value={settingsDraft.checkOut}
                  onChange={(event) => setSettingsDraft((draft) => ({ ...draft, checkOut: event.target.value }))} />
              </label>
            </div>
            <div className="ri-hour-inline-actions">
              <button type="button" className="btn btn-dark btn-sm"
                onClick={() => { setSettings(settingsDraft); setSettingsOpen(false); }}>Apply</button>
              <button type="button" className="btn btn-light btn-sm"
                onClick={() => setSettingsOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
        {bulkOpen && (
          <div className="ri-hour-inline-panel">
            <div className="ri-hour-inline-grid">
              <label className="ri-field">
                <span>Field to update</span>
                <select className="ri-input" value={bulkDraft.field}
                  onChange={(event) => setBulkDraft((draft) => ({ ...draft, field: event.target.value }))}>
                  <option value="available">Available Rooms</option>
                  <option value="price3">3 Hours Price</option>
                  <option value="price6">6 Hours Price</option>
                  <option value="fullDay">Full Day Price (EP)</option>
                </select>
              </label>
              <NumberField label="Value for all visible dates" value={bulkDraft.value}
                onChange={(value) => setBulkDraft((draft) => ({ ...draft, value }))} />
            </div>
            <div className="ri-hour-inline-actions">
              <button type="button" className="btn btn-dark btn-sm" onClick={applyBulk}>Apply to visible 7 days</button>
              <button type="button" className="btn btn-light btn-sm" onClick={() => setBulkOpen(false)}>Cancel</button>
            </div>
          </div>
        )}
      </section>

      <div className="ri-hour-toolbar">
        <button type="button" className="ri-link-btn" aria-expanded={extraChargesOpen}
          onClick={() => setExtraChargesOpen((open) => !open)}>View Extra Guest Charges</button>
        <div className="ri-hour-week-nav">
          <button type="button" className="btn btn-light btn-sm"
            onClick={() => setWeekOffset((offset) => offset - 1)}>
            <ChevronLeft size={14} aria-hidden="true" /> Previous 7 Days
          </button>
          <span className="ri-hour-week-range">{rangeLabel}</span>
          <button type="button" className="btn btn-light btn-sm"
            onClick={() => setWeekOffset((offset) => offset + 1)}>
            Next 7 Days <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {extraChargesOpen && (
        <section className="ri-card ri-hour-extra">
          <div className="ri-card-head"><h4>Extra Guest Charges</h4><span className="ri-badge">Per night</span></div>
          <p>Extra adult {inr(500)} · Child {inr(250)}. Charges apply when occupancy exceeds the included guests.</p>
        </section>
      )}

      <section className="ri-card ri-hour-table-card">
        <div className="ri-table-wrap">
          <table className="ri-table ri-hour-table">
            <thead>
              <tr>
                <th>Date</th><th>Available Rooms</th><th>Sold Rooms</th><th>Sold Slots</th>
                <th>3 Hours (60%)</th><th>6 Hours (70%)</th><th>Edit Linkage</th><th>Full Day Price (EP)</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => {
                const expanded = expandedDates.has(date.iso);
                const linkageExpanded = linkageOpen.has(date.iso);
                return (
                  <Fragment key={date.iso}>
                    <tr>
                      <td data-label="Date">
                        <div className="ri-hour-date-cell">
                          <button type="button" className="ri-hour-expand" aria-expanded={expanded}
                            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${date.short}`}
                            onClick={() => toggleSetValue(setExpandedDates, date.iso)}>
                            {expanded ? <Minus size={14} /> : <Plus size={14} />}
                          </button>
                          <span><strong>{date.short}</strong><small>{date.weekday}</small></span>
                        </div>
                      </td>
                      <td data-label="Available Rooms">{inventoryCell(date)}</td>
                      <td data-label="Sold Rooms"><strong>{date.sold}</strong></td>
                      <td data-label="Sold Slots"><strong>{date.soldSlots}</strong></td>
                      <td data-label="3 Hours (60%)">{priceCell(date, 'price3', '3 hour price')}</td>
                      <td data-label="6 Hours (70%)">{priceCell(date, 'price6', '6 hour price')}</td>
                      <td data-label="Edit Linkage">
                        <button type="button" className="ri-link-btn" aria-expanded={linkageExpanded}
                          onClick={() => toggleSetValue(setLinkageOpen, date.iso)}>Edit Linkage</button>
                        {linkageExpanded && (
                          <div className="ri-hour-linkage">
                            <span>
                              <Toggle checked={Boolean(linkage[date.iso])}
                                label={`Link ${date.short} hourly prices to full-day EP`}
                                onChange={(checked) => setLinkage((previous) => ({ ...previous, [date.iso]: checked }))} />
                              {linkage[date.iso] ? 'Linked to full-day EP' : 'Independent pricing'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td data-label="Full Day Price (EP)">{priceCell(date, 'fullDay', 'full day EP price')}</td>
                    </tr>
                    {expanded && (
                      <tr className="ri-hour-detail-row">
                        <td colSpan={8}>
                          <div className="ri-hour-detail">
                            {date.notification && (
                              <div className="ri-hour-notice">
                                <AlertTriangle size={16} aria-hidden="true" />
                                <span>You have not added hourly rooms for the day. Add inventory to get hourly bookings.</span>
                                <button type="button" className="btn btn-light btn-sm"
                                  onClick={() => updateDate(date.iso, { available: 1, status: 'entered', notification: false })}>
                                  Add inventory
                                </button>
                              </div>
                            )}
                            {date.status === 'non-sellable' && (
                              <div className="ri-hour-notice">
                                <AlertTriangle size={16} aria-hidden="true" />
                                <span>This date is marked non-sellable.</span>
                                <button type="button" className="btn btn-light btn-sm"
                                  onClick={() => updateDate(date.iso, { available: null, status: 'empty' })}>
                                  Make sellable
                                </button>
                              </div>
                            )}
                            <div className="ri-hour-detail-grid">
                              <div><span className="ri-hour-detail-label">Hourly slots</span><strong>3h {inr(date.price3)} · 6h {inr(date.price6)}</strong></div>
                              <div><span className="ri-hour-detail-label">Linkage</span><strong>{linkage[date.iso] ? 'Linked to full-day EP' : 'Independent pricing'}</strong></div>
                              <div><span className="ri-hour-detail-label">Full day (EP)</span><strong>{inr(date.fullDay)}</strong></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="ri-note">Changes stay in this demo session; no API calls or persistence.</div>
      </section>
    </div>
  );
}

export function PropertyRatesInventory({ property }) {
  const [params] = useSearchParams();
  const { propertyId } = useParams();
  const selected = RATES_INVENTORY_SECTIONS.find((section) => section.id === params.get('section'))
    ?? RATES_INVENTORY_SECTIONS[0];
  const propertyName = property?.propertyName ?? 'this property';

  return (
    <div className="ri-page">
      <div className="ri-head">
        <div>
          <span className="ri-eyebrow">Property controls</span>
          <h2 className="ri-title">Rates &amp; Inventory for {propertyName}</h2>
          <p className="ri-sub">{selected.description}</p>
        </div>
        {property?.isSample && <span className="ri-sample">Sample data</span>}
      </div>

      <div className="ri-panel">
        <PanelHeader
          title={selected.label}
          description={selected.detail}
          action={selected.id === 'default' ? (
            <Link className="btn btn-light btn-sm" to={propertyRatesSectionPath(propertyId ?? 'sample', 'manage')}>
              Calendar View
            </Link>
          ) : undefined}
        />
        {selected.id === 'manage' && <ManageRatesPanel />}
        {selected.id === 'extras' && <PaidExtrasPanel />}
        {selected.id === 'default' && <DefaultRatesPanel />}
        {selected.id === 'hourly' && <HourlyStaysPanel propertyId={propertyId ?? 'sample'} propertyName={propertyName} />}
      </div>
    </div>
  );
}
