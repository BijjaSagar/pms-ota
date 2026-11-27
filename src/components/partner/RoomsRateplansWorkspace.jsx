import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, BedDouble, Check, ChevronRight, Minus, Pencil, Plus, Tag, Trash2, X,
} from 'lucide-react';
import {
  BED_TYPE_OPTIONS, MEAL_OPTIONS, ROOM_AMENITY_ITEMS, ROOM_SIZE_UNITS, ROOM_TYPE_OPTIONS, ROOM_VIEW_OPTIONS, masterLabel,
} from '../../lib/data/partner.js';
import {
  createRatePlan, deleteRatePlan, deleteRoom, loadMasters, saveRoomFull, setRoomStatus, updateRatePlan,
} from '../../lib/api/properties.js';

// Rooms & Rateplans of a property, all saved on the server: rooms (with beds,
// occupancy and charges), their on/off switch, and extra rate plans
// (packages, promotional and day-use) next to the standard EP / CP / MAP / AP.

const PLAN_KINDS = [
  ['PACKAGE', 'Package', 'A named bundle with inclusions, e.g. "Super Package".'],
  ['PROMOTIONAL', 'Promotional rate', 'A limited-period special price.'],
  ['DAY_USE', 'Day use', 'A stay of a few hours within one day.'],
];
const PLAN_FAMILIES = [
  ['EP', 'EP – room only'],
  ['CP', 'CP – one meal'],
  ['MAP', 'MAP – two meals'],
  ['AP', 'AP – all meals'],
];
const KIND_LABELS = { STANDARD: 'Standard', PACKAGE: 'Package', PROMOTIONAL: 'Promotional', DAY_USE: 'Day use' };
const MONEY = /^\d{1,8}(\.\d{1,2})?$/;

const values = (options) => options.filter(([value]) => value);
const first = (options) => values(options)[0]?.[0] ?? '';
const rupees = (value) => `₹${Number(value).toLocaleString('en-IN')}`;
const text = (value) => (value === null || value === undefined ? '' : String(value));
const whole = (value) => /^\d+$/.test(String(value).trim());
const int = (value) => Number.parseInt(value, 10);

function emptyRoomForm() {
  return {
    roomName: '',
    description: '',
    roomType: first(ROOM_TYPE_OPTIONS),
    roomView: first(ROOM_VIEW_OPTIONS),
    roomSize: '',
    roomSizeUnit: first(ROOM_SIZE_UNITS) || 'sqft',
    roomCount: '1',
    bathroomCount: '1',
    beds: [{ bedType: first(BED_TYPE_OPTIONS), count: '1' }],
    extraBedsAllowed: false,
    maxExtraBeds: '1',
    baseAdults: '2',
    maxAdults: '2',
    baseChildren: '0',
    maxChildren: '1',
    maxOccupancy: '3',
    mealOption: first(MEAL_OPTIONS),
    pricePerGuest: '',
    extraAdultRate: '0',
    childRate: '0',
    amenities: Object.fromEntries(ROOM_AMENITY_ITEMS.map((item) => [item.id, 'no'])),
  };
}

/** A saved room (property detail) -> the form. */
function roomForm(room) {
  const ep = room.ratePlans?.find((plan) => plan.standard && plan.code === 'EP');
  const provided = new Set(room.amenities ?? []);
  return {
    roomName: text(room.roomName),
    description: text(room.description),
    roomType: text(room.roomType),
    roomView: text(room.roomView),
    roomSize: text(room.roomSize),
    roomSizeUnit: text(room.roomSizeUnit),
    roomCount: text(room.roomCount),
    bathroomCount: text(room.bathroomCount),
    beds: (room.beds?.length ? room.beds : [{ bedType: room.bedType, count: 1 }]).map((bed) => ({ bedType: bed.bedType, count: text(bed.count) })),
    extraBedsAllowed: Boolean(room.extraBedsAllowed),
    maxExtraBeds: text(room.maxExtraBeds || 1),
    baseAdults: text(room.baseAdults),
    maxAdults: text(room.maxAdults),
    baseChildren: text(room.baseChildren),
    maxChildren: text(room.maxChildren),
    maxOccupancy: text(room.maxOccupancy ?? room.maxGuests),
    mealOption: text(room.mealOption),
    pricePerGuest: text(room.pricePerGuest),
    extraAdultRate: text(ep?.extraAdultRate ?? 0),
    childRate: text(ep?.childRate ?? 0),
    amenities: Object.fromEntries(ROOM_AMENITY_ITEMS.map((item) => [item.id, provided.has(item.id) ? 'yes' : 'no'])),
  };
}

/** Same rules as the server (room-input.ts), so problems show before saving. */
function validateRoom(form) {
  const errors = {};
  const name = form.roomName.trim();
  if (name.length < 2 || name.length > 100) errors.roomName = 'Enter a room name (2–100 characters).';
  if (form.description.length > 2000) errors.description = 'Keep the description under 2000 characters.';
  ['roomType', 'roomView', 'roomSizeUnit', 'mealOption'].forEach((key) => { if (!form[key]) errors[key] = 'Choose an option.'; });
  const size = Number(form.roomSize);
  if (!(size >= 1 && size <= 1000000)) errors.roomSize = 'Enter the room size.';
  if (!whole(form.roomCount) || int(form.roomCount) < 1 || int(form.roomCount) > 5000) errors.roomCount = 'Enter 1–5000 rooms.';
  if (!whole(form.bathroomCount) || int(form.bathroomCount) < 1 || int(form.bathroomCount) > 100) errors.bathroomCount = 'Enter 1–100 bathrooms.';
  const bedTypes = form.beds.map((bed) => bed.bedType);
  if (!form.beds.length) errors.beds = 'Add at least one bed.';
  else if (form.beds.some((bed) => !bed.bedType || !whole(bed.count) || int(bed.count) < 1 || int(bed.count) > 20)) errors.beds = 'Choose each bed type and a count of 1–20.';
  else if (new Set(bedTypes).size !== bedTypes.length) errors.beds = 'Each bed type can be listed once.';
  if (form.extraBedsAllowed && (!whole(form.maxExtraBeds) || int(form.maxExtraBeds) < 1 || int(form.maxExtraBeds) > 20)) errors.maxExtraBeds = 'Enter 1–20 extra beds.';
  const occ = ['baseAdults', 'maxAdults', 'baseChildren', 'maxChildren', 'maxOccupancy'];
  occ.forEach((key) => { if (!whole(form[key])) errors[key] = 'Enter a whole number.'; });
  if (!occ.some((key) => errors[key])) {
    const [baseAdults, maxAdults, baseChildren, maxChildren, maxOccupancy] = occ.map((key) => int(form[key]));
    if (baseAdults < 1) errors.baseAdults = 'At least 1 adult.';
    else if (baseAdults > maxAdults) errors.baseAdults = 'Must not be more than maximum adults.';
    if (baseChildren > maxChildren) errors.baseChildren = 'Must not be more than maximum children.';
    if (maxOccupancy < maxAdults) errors.maxOccupancy = 'Must be at least maximum adults.';
    else if (maxOccupancy > maxAdults + maxChildren) errors.maxOccupancy = 'Must not be more than adults + children.';
    else if (!errors.baseChildren && baseAdults + baseChildren > maxOccupancy) errors.baseChildren = 'Base adults + children must fit the occupancy.';
  }
  if (!MONEY.test(form.pricePerGuest) || Number(form.pricePerGuest) < 1) errors.pricePerGuest = 'Enter the room-only rate in rupees.';
  ['extraAdultRate', 'childRate'].forEach((key) => { if (!MONEY.test(String(form[key] || '0'))) errors[key] = 'Enter an amount in rupees (0 for none).'; });
  return errors;
}

function roomBody(form) {
  return {
    roomName: form.roomName.trim(),
    description: form.description.trim() || undefined,
    roomType: form.roomType,
    roomView: form.roomView,
    roomSize: Number(form.roomSize),
    roomSizeUnit: form.roomSizeUnit,
    roomCount: int(form.roomCount),
    bathroomCount: int(form.bathroomCount),
    beds: form.beds.map((bed) => ({ bedType: bed.bedType, count: int(bed.count) })),
    extraBedsAllowed: form.extraBedsAllowed,
    maxExtraBeds: form.extraBedsAllowed ? int(form.maxExtraBeds) : undefined,
    baseAdults: int(form.baseAdults),
    maxAdults: int(form.maxAdults),
    baseChildren: int(form.baseChildren),
    maxChildren: int(form.maxChildren),
    maxOccupancy: int(form.maxOccupancy),
    mealOption: form.mealOption,
    pricePerGuest: Number(form.pricePerGuest),
    extraAdultRate: Number(form.extraAdultRate || 0),
    childRate: Number(form.childRate || 0),
    amenities: ROOM_AMENITY_ITEMS.filter((item) => form.amenities?.[item.id] === 'yes').map((item) => item.id),
  };
}

/** API field errors -> the form's keys ("beds.0.bedType" -> beds). */
const apiErrors = (problem) => Object.fromEntries(Object.entries(problem?.fieldErrors ?? {}).map(([field, message]) => {
  const key = field.split('.')[0];
  return [key === 'bedType' ? 'beds' : key, /^[A-Z]/.test(message) ? message : `This ${message}.`];
}));

const emptyPlanForm = () => ({
  kind: 'PACKAGE', code: 'CP', name: '', description: '', dayUseHours: '6', weekdayRate: '', weekendRate: '', extraAdultRate: '0', childRate: '0',
});

function validatePlan(form) {
  const errors = {};
  const name = form.name.trim();
  if (name.length < 2 || name.length > 60) errors.name = 'Enter a name (2–60 characters).';
  if (form.description.length > 500) errors.description = 'Keep it under 500 characters.';
  if (form.kind === 'DAY_USE' && (!whole(form.dayUseHours) || int(form.dayUseHours) < 1 || int(form.dayUseHours) > 23)) errors.dayUseHours = 'Enter 1–23 hours.';
  if (!MONEY.test(form.weekdayRate) || Number(form.weekdayRate) < 1) errors.weekdayRate = 'Enter the rate in rupees.';
  if (form.weekendRate && (!MONEY.test(form.weekendRate) || Number(form.weekendRate) < 1)) errors.weekendRate = 'Enter the rate in rupees, or leave it empty.';
  ['extraAdultRate', 'childRate'].forEach((key) => { if (!MONEY.test(String(form[key] || '0'))) errors[key] = 'Enter an amount (0 for none).'; });
  return errors;
}

function Field({ label, error, full, hint, children }) {
  return (
    <label className={`rrw-field ${full ? 'is-full' : ''}`}>
      <span>{label}</span>
      {children}
      {hint && !error ? <small className="rrw-hint">{hint}</small> : null}
      {error ? <small className="rrw-error" role="alert">{error}</small> : null}
    </label>
  );
}

/** Esc closes; the page behind does not scroll while open. */
function useDialog(onClose) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);
}

function ModalShell({ title, subtitle, children, onClose, wide }) {
  useDialog(onClose);
  return (
    <div className="rrw-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`rrw-modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="rrw-modal-title">
        <header className="rrw-modal-head">
          <div>
            <h3 id="rrw-modal-title">{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="rrw-icon-btn" onClick={onClose} aria-label="Close dialog"><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="rrw-modal-body">{children}</div>
      </section>
    </div>
  );
}

function DrawerShell({ title, subtitle, children, onClose }) {
  useDialog(onClose);
  return (
    <div className="rrw-overlay is-drawer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="rrw-drawer" role="dialog" aria-modal="true" aria-labelledby="rrw-drawer-title">
        <header className="rrw-drawer-head">
          <div>
            <h3 id="rrw-drawer-title">{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="rrw-icon-btn" onClick={onClose} aria-label="Close details"><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="rrw-drawer-body">{children}</div>
      </aside>
    </div>
  );
}

function Stepper({ value, onChange, min = 0, max = 50, label }) {
  const number = whole(value) ? int(value) : min;
  return (
    <div className="rrw-stepper">
      <button type="button" aria-label={`Fewer ${label}`} disabled={number <= min} onClick={() => onChange(String(Math.max(min, number - 1)))}><Minus size={14} aria-hidden="true" /></button>
      <input inputMode="numeric" value={value} aria-label={label} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))} />
      <button type="button" aria-label={`More ${label}`} disabled={number >= max} onClick={() => onChange(String(Math.min(max, number + 1)))}><Plus size={14} aria-hidden="true" /></button>
    </div>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="rrw-segments">
      {[['yes', 'Yes'], ['no', 'No']].map(([option, label]) => (
        <button type="button" key={option} className={value === option ? 'is-on' : ''} aria-pressed={value === option} onClick={() => onChange(option)}>{label}</button>
      ))}
    </div>
  );
}

export default function RoomsRateplansWorkspace({ property, onPropertyChange }) {
  const propertyId = property.id;
  const rooms = useMemo(() => (Array.isArray(property.rooms) ? property.rooms : []), [property.rooms]);
  const [mastersReady, setMastersReady] = useState(false);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyRoomForm);
  const [errors, setErrors] = useState({});
  const [amenitiesForm, setAmenitiesForm] = useState({});
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [planErrors, setPlanErrors] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    let active = true;
    loadMasters()
      .then(() => { if (active) setMastersReady(true); })
      .catch(() => { if (active) setNotice({ kind: 'error', text: 'Could not load the room lists. Refresh the page.' }); });
    return () => { active = false; };
  }, []);

  const detailRoom = modal?.roomId ? rooms.find((room) => room.id === modal.roomId) : null;
  const close = () => { setModal(null); setConfirmRemove(false); };

  /** Runs a change; the server answers with the whole property. */
  const run = async (key, action, success) => {
    setBusy(key);
    setNotice(null);
    try {
      const detail = await action();
      if (detail?.rooms) onPropertyChange?.(detail);
      if (success) setNotice({ kind: 'success', text: success });
    } catch (problem) {
      setNotice({ kind: 'error', text: problem?.message || 'That did not work. Please try again.' });
      throw problem;
    } finally {
      setBusy('');
    }
  };

  const openRoom = (room) => {
    setErrors({});
    setForm(room ? roomForm(room) : emptyRoomForm());
    setModal({ type: 'room', roomId: room?.id ?? null });
  };

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const setBed = (index, key, value) => {
    setForm((current) => ({ ...current, beds: current.beds.map((bed, i) => (i === index ? { ...bed, [key]: value } : bed)) }));
    setErrors((current) => ({ ...current, beds: undefined }));
  };

  const saveRoomForm = async () => {
    const problems = validateRoom(form);
    setErrors(problems);
    if (Object.keys(problems).length) {
      setNotice({ kind: 'error', text: 'Fix the highlighted room details, then save.' });
      return;
    }
    try {
      await run('room', () => saveRoomFull(propertyId, modal.roomId, roomBody(form)), `${form.roomName.trim()} saved.`);
      close();
    } catch (problem) {
      const fieldProblems = apiErrors(problem);
      if (Object.keys(fieldProblems).length) setErrors(fieldProblems);
    }
  };

  const openAmenities = (room) => {
    setAmenitiesForm(roomForm(room).amenities);
    setModal({ type: 'amenities', roomId: room.id });
  };

  const saveAmenities = async () => {
    const room = detailRoom;
    if (!room) return;
    try {
      await run('amenities', () => saveRoomFull(propertyId, room.id, roomBody({ ...roomForm(room), amenities: amenitiesForm })), `Amenities updated for ${room.roomName}.`);
      close();
    } catch { /* the notice says what went wrong */ }
  };

  const toggleRoom = (room) => run(`status-${room.id}`, () => setRoomStatus(propertyId, room.id, room.active === false),
    `${room.roomName} is now ${room.active === false ? 'on sale' : 'off – not shown or sold'}.`).catch(() => {});

  const openPlan = (room) => {
    setPlanForm(emptyPlanForm());
    setPlanErrors({});
    setModal({ type: 'plan', roomId: room.id });
  };

  const setPlanField = (key, value) => {
    setPlanForm((current) => ({ ...current, [key]: value }));
    setPlanErrors((current) => ({ ...current, [key]: undefined }));
  };

  const savePlan = async () => {
    const problems = validatePlan(planForm);
    setPlanErrors(problems);
    if (Object.keys(problems).length) return;
    const room = detailRoom;
    try {
      await run('plan', () => createRatePlan(propertyId, room.id, {
        kind: planForm.kind,
        code: planForm.code,
        name: planForm.name.trim(),
        description: planForm.description.trim() || undefined,
        dayUseHours: planForm.kind === 'DAY_USE' ? int(planForm.dayUseHours) : undefined,
        weekdayRate: Number(planForm.weekdayRate),
        weekendRate: planForm.weekendRate ? Number(planForm.weekendRate) : undefined,
        extraAdultRate: Number(planForm.extraAdultRate || 0),
        childRate: Number(planForm.childRate || 0),
      }), `${planForm.name.trim()} added to ${room.roomName}.`);
      setModal({ type: 'details', roomId: room.id });
    } catch (problem) {
      const fieldProblems = apiErrors(problem);
      if (Object.keys(fieldProblems).length) setPlanErrors(fieldProblems);
    }
  };

  const togglePlan = (room, plan) => run(`plan-${plan.id}`, () => updateRatePlan(propertyId, room.id, plan.id, { active: !plan.active }),
    `${plan.name} is now ${plan.active ? 'off' : 'on sale'}.`).catch(() => {});

  const removePlan = (room, plan) => run(`plan-${plan.id}`, () => deleteRatePlan(propertyId, room.id, plan.id), `${plan.name} removed.`).catch(() => {});

  const removeRoom = async (room) => {
    try {
      await run('remove', () => deleteRoom(propertyId, room.id), `${room.roomName} removed.`);
      close();
    } catch { /* the notice says what went wrong */ }
  };

  const activeCount = rooms.filter((room) => room.active !== false).length;

  return (
    <div className="rrw-root">
      <header className="rrw-header">
        <div>
          <span className="rrw-eyebrow"><BedDouble size={14} aria-hidden="true" /> Property information</span>
          <h2>Rooms &amp; Rateplans</h2>
          <p>Manage room categories, availability, amenities and the plans guests can book.</p>
        </div>
        <div className="rrw-header-actions">
          <button type="button" className="rrw-create-btn" onClick={() => openRoom(null)} disabled={!mastersReady}>
            <Plus size={16} aria-hidden="true" /> Create New Room
          </button>
        </div>
      </header>

      {notice && <div className={`rrw-notice ${notice.kind}`} role="status">{notice.text}</div>}

      <section className="rrw-section" aria-labelledby="rrw-existing-heading">
        <div className="rrw-section-head">
          <div>
            <h3 id="rrw-existing-heading">Existing Rooms ({rooms.length})</h3>
            <p>Switch a room off to stop showing and selling it. Bookings are kept.</p>
          </div>
          <span className="rrw-count-pill">{activeCount} active</span>
        </div>

        {rooms.length ? (
          <div className="rrw-grid">
            {rooms.map((room) => {
              const plans = room.ratePlans ?? [];
              const onSale = plans.filter((plan) => plan.active);
              const on = room.active !== false;
              const summary = [
                masterLabel('roomView', room.roomView),
                (room.beds ?? []).map((bed) => `${bed.count} × ${masterLabel('bedType', bed.bedType)}`).join(' + '),
                `up to ${room.maxOccupancy ?? room.maxGuests} guests`,
              ].filter(Boolean).join(' · ');
              return (
                <article className={`rrw-room-card ${on ? '' : 'is-inactive'}`} key={room.id}>
                  <div className="rrw-room-top">
                    <div className="rrw-room-icon"><BedDouble size={20} aria-hidden="true" /></div>
                    <div className="rrw-room-title">
                      <h4>{room.roomName}</h4>
                      <p>{room.description || summary}</p>
                      <p className="rrw-room-meta">{room.roomCount} room{room.roomCount === 1 ? '' : 's'} · {masterLabel('mealOption', room.mealOption)} · {rupees(room.pricePerGuest)} room only</p>
                    </div>
                    <label className="rrw-switch" title={on ? 'Room is on sale' : 'Room is off'}>
                      <input type="checkbox" checked={on} disabled={busy === `status-${room.id}`} onChange={() => toggleRoom(room)} aria-label={`${room.roomName} on sale`} />
                      <span className="rrw-switch-track"><span className="rrw-switch-thumb" /></span>
                      <span className="rrw-switch-label">{on ? 'Active' : 'Inactive'}</span>
                    </label>
                  </div>

                  <div className="rrw-plan-block">
                    <div className="rrw-plan-head">
                      <span><Tag size={13} aria-hidden="true" /> Rateplans on sale</span>
                      <strong>{onSale.length}</strong>
                    </div>
                    <div className="rrw-plan-chips">
                      {onSale.slice(0, 3).map((plan) => <span key={plan.id}>{plan.name}</span>)}
                      {onSale.length > 3 && <span className="is-more">+ {onSale.length - 3} more</span>}
                      {!onSale.length && <span className="is-empty">No rateplans on sale</span>}
                    </div>
                    <button type="button" className="rrw-link" onClick={() => setModal({ type: 'details', roomId: room.id })}>
                      Click to View Rateplans <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="rrw-room-actions">
                    <button type="button" onClick={() => openRoom(room)} disabled={!mastersReady}><Pencil size={14} aria-hidden="true" /> Edit Room</button>
                    <button type="button" onClick={() => openPlan(room)}><Plus size={14} aria-hidden="true" /> Add Rateplan</button>
                    <button type="button" onClick={() => openAmenities(room)} disabled={!mastersReady}><Check size={14} aria-hidden="true" /> Edit Amenities</button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rrw-empty">
            <BedDouble size={28} aria-hidden="true" />
            <h4>No rooms added yet</h4>
            <p>Create your first room category to start configuring rateplans.</p>
            <button type="button" className="rrw-create-btn" onClick={() => openRoom(null)} disabled={!mastersReady}><Plus size={16} aria-hidden="true" /> Create New Room</button>
          </div>
        )}
      </section>

      {modal?.type === 'room' && (
        <ModalShell title={modal.roomId ? 'Edit Room' : 'Create New Room'} subtitle="Room details, beds, occupancy and price. Guests see these when they book." onClose={close} wide>
          <h4 className="rrw-form-title">Room details</h4>
          <div className="rrw-form-grid">
            <Field label="Display room name" error={errors.roomName} full>
              <input value={form.roomName} maxLength={100} onChange={(event) => setField('roomName', event.target.value)} placeholder="e.g. Deluxe Room with City View" />
            </Field>
            <Field label="Description (optional)" error={errors.description} full hint={`${form.description.length} / 2000`}>
              <textarea rows={3} maxLength={2000} value={form.description} onChange={(event) => setField('description', event.target.value)} placeholder="What makes this room special" />
            </Field>
            <Field label="Room type" error={errors.roomType}>
              <select value={form.roomType} onChange={(event) => setField('roomType', event.target.value)}>
                {ROOM_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value} disabled={!value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Room view" error={errors.roomView}>
              <select value={form.roomView} onChange={(event) => setField('roomView', event.target.value)}>
                {ROOM_VIEW_OPTIONS.map(([value, label]) => <option key={value} value={value} disabled={!value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Room size" error={errors.roomSize}>
              <input type="number" min="1" step="0.01" inputMode="decimal" value={form.roomSize} onChange={(event) => setField('roomSize', event.target.value)} placeholder="e.g. 220" />
            </Field>
            <Field label="Size unit" error={errors.roomSizeUnit}>
              <select value={form.roomSizeUnit} onChange={(event) => setField('roomSizeUnit', event.target.value)}>
                {ROOM_SIZE_UNITS.map(([value, label]) => <option key={value} value={value} disabled={!value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Number of rooms" error={errors.roomCount}>
              <input type="number" min="1" max="5000" inputMode="numeric" value={form.roomCount} onChange={(event) => setField('roomCount', event.target.value)} />
            </Field>
            <Field label="Bathrooms" error={errors.bathroomCount}>
              <input type="number" min="1" max="100" inputMode="numeric" value={form.bathroomCount} onChange={(event) => setField('bathroomCount', event.target.value)} />
            </Field>
          </div>

          <h4 className="rrw-form-title">Beds</h4>
          <div className="rrw-beds">
            {form.beds.map((bed, index) => (
              <div className="rrw-bed-row" key={index}>
                <select value={bed.bedType} aria-label={`Bed type ${index + 1}`} onChange={(event) => setBed(index, 'bedType', event.target.value)}>
                  {BED_TYPE_OPTIONS.map(([value, label]) => <option key={value} value={value} disabled={!value}>{label}</option>)}
                </select>
                <Stepper label={`beds of type ${index + 1}`} min={1} max={20} value={bed.count} onChange={(value) => setBed(index, 'count', value)} />
                <button type="button" className="rrw-icon-btn" aria-label={`Remove bed ${index + 1}`} disabled={form.beds.length === 1}
                  onClick={() => setField('beds', form.beds.filter((_, i) => i !== index))}><Trash2 size={15} aria-hidden="true" /></button>
              </div>
            ))}
            {errors.beds ? <small className="rrw-error" role="alert">{errors.beds}</small> : null}
            <button type="button" className="rrw-link" disabled={form.beds.length >= 6}
              onClick={() => setField('beds', [...form.beds, { bedType: values(BED_TYPE_OPTIONS).find(([value]) => !form.beds.some((b) => b.bedType === value))?.[0] ?? '', count: '1' }])}>
              <Plus size={14} aria-hidden="true" /> Add another bed type
            </button>
            <div className="rrw-amenity-row">
              <span>Can this room take extra beds?</span>
              <YesNo value={form.extraBedsAllowed ? 'yes' : 'no'} onChange={(value) => setField('extraBedsAllowed', value === 'yes')} />
            </div>
            {form.extraBedsAllowed ? (
              <Field label="Maximum extra beds" error={errors.maxExtraBeds}>
                <Stepper label="extra beds" min={1} max={20} value={form.maxExtraBeds} onChange={(value) => setField('maxExtraBeds', value)} />
              </Field>
            ) : null}
          </div>

          <h4 className="rrw-form-title">Occupancy (per room)</h4>
          <div className="rrw-form-grid is-tight">
            {[
              ['baseAdults', 'Base adults', 1, 50, 'Covered by the room rate.'],
              ['maxAdults', 'Maximum adults', 1, 50],
              ['baseChildren', 'Base children', 0, 50, 'Stay free within the child age.'],
              ['maxChildren', 'Maximum children', 0, 50],
              ['maxOccupancy', 'Maximum occupancy', 1, 100, 'Adults + children together.'],
            ].map(([key, label, min, max, hint]) => (
              <Field key={key} label={label} error={errors[key]} hint={hint}>
                <Stepper label={label.toLowerCase()} min={min} max={max} value={form[key]} onChange={(value) => setField(key, value)} />
              </Field>
            ))}
          </div>

          <h4 className="rrw-form-title">Meal plan and price</h4>
          <div className="rrw-form-grid">
            <Field label="Meal plan" error={errors.mealOption} hint="Sold as EP (room only) and CP, plus this meal plan's family.">
              <select value={form.mealOption} onChange={(event) => setField('mealOption', event.target.value)}>
                {MEAL_OPTIONS.map(([value, label]) => <option key={value} value={value} disabled={!value}>{label}</option>)}
              </select>
            </Field>
            <Field label="Room-only rate (₹ per night)" error={errors.pricePerGuest} hint="For the base adults. Meal plans add the meal prices.">
              <input type="number" min="1" inputMode="decimal" value={form.pricePerGuest} onChange={(event) => setField('pricePerGuest', event.target.value)} placeholder="e.g. 1800" />
            </Field>
            <Field label="Extra adult charge (₹ per night)" error={errors.extraAdultRate}>
              <input type="number" min="0" inputMode="decimal" value={form.extraAdultRate} onChange={(event) => setField('extraAdultRate', event.target.value)} />
            </Field>
            <Field label="Paid child charge (₹ per night)" error={errors.childRate}>
              <input type="number" min="0" inputMode="decimal" value={form.childRate} onChange={(event) => setField('childRate', event.target.value)} />
            </Field>
          </div>

          <div className="rrw-amenity-editor">
            <h4>Room amenities</h4>
            <div className="rrw-amenity-grid">
              {ROOM_AMENITY_ITEMS.map((item) => (
                <div className="rrw-amenity-row" key={item.id}>
                  <span>{item.label}</span>
                  <YesNo value={form.amenities?.[item.id]} onChange={(value) => setForm((current) => ({ ...current, amenities: { ...current.amenities, [item.id]: value } }))} />
                </div>
              ))}
            </div>
          </div>

          <footer className="rrw-modal-foot">
            <button type="button" className="rrw-btn is-light" onClick={close}>Cancel</button>
            <button type="button" className="rrw-btn is-primary" onClick={saveRoomForm} disabled={busy === 'room'}>{busy === 'room' ? 'Saving…' : modal.roomId ? 'Save room' : 'Create room'} <ArrowRight size={15} aria-hidden="true" /></button>
          </footer>
        </ModalShell>
      )}

      {modal?.type === 'amenities' && detailRoom && (
        <ModalShell title="Edit Amenities" subtitle={detailRoom.roomName} onClose={close}>
          <div className="rrw-amenity-grid is-solo">
            {ROOM_AMENITY_ITEMS.map((item) => (
              <div className="rrw-amenity-row" key={item.id}>
                <span>{item.label}</span>
                <YesNo value={amenitiesForm[item.id]} onChange={(value) => setAmenitiesForm((current) => ({ ...current, [item.id]: value }))} />
              </div>
            ))}
          </div>
          <footer className="rrw-modal-foot">
            <button type="button" className="rrw-btn is-light" onClick={close}>Cancel</button>
            <button type="button" className="rrw-btn is-primary" onClick={saveAmenities} disabled={busy === 'amenities'}>{busy === 'amenities' ? 'Saving…' : 'Save amenities'}</button>
          </footer>
        </ModalShell>
      )}

      {modal?.type === 'plan' && detailRoom && (
        <ModalShell title="Add Rateplan" subtitle={`A new way to sell ${detailRoom.roomName}.`} onClose={close}>
          <div className="rrw-form-grid">
            <div className="rrw-field is-full">
              <span>Type</span>
              <div className="rrw-kind-options" role="radiogroup" aria-label="Rateplan type">
                {PLAN_KINDS.map(([value, label, detail]) => (
                  <label key={value} className={`rrw-kind ${planForm.kind === value ? 'is-on' : ''}`}>
                    <input type="radio" name="rrw-plan-kind" value={value} checked={planForm.kind === value} onChange={() => setPlanField('kind', value)} />
                    <span><strong>{label}</strong><small>{detail}</small></span>
                  </label>
                ))}
              </div>
            </div>
            <Field label="Name" error={planErrors.name} full>
              <input value={planForm.name} maxLength={60} onChange={(event) => setPlanField('name', event.target.value)} placeholder="e.g. CP2 – Super Package" />
            </Field>
            <Field label="Meals included">
              <select value={planForm.code} onChange={(event) => setPlanField('code', event.target.value)}>
                {PLAN_FAMILIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </Field>
            {planForm.kind === 'DAY_USE' ? (
              <Field label="Hours of stay" error={planErrors.dayUseHours}>
                <Stepper label="hours" min={1} max={23} value={planForm.dayUseHours} onChange={(value) => setPlanField('dayUseHours', value)} />
              </Field>
            ) : null}
            <Field label="Description (optional)" error={planErrors.description} full>
              <textarea rows={2} maxLength={500} value={planForm.description} onChange={(event) => setPlanField('description', event.target.value)} />
            </Field>
            <Field label="Rate Sun–Thu (₹)" error={planErrors.weekdayRate}>
              <input type="number" min="1" inputMode="decimal" value={planForm.weekdayRate} onChange={(event) => setPlanField('weekdayRate', event.target.value)} placeholder="e.g. 4500" />
            </Field>
            <Field label="Rate Fri–Sat (₹)" error={planErrors.weekendRate} hint="Empty: same as Sun–Thu.">
              <input type="number" min="1" inputMode="decimal" value={planForm.weekendRate} onChange={(event) => setPlanField('weekendRate', event.target.value)} />
            </Field>
            <Field label="Extra adult (₹ per night)" error={planErrors.extraAdultRate}>
              <input type="number" min="0" inputMode="decimal" value={planForm.extraAdultRate} onChange={(event) => setPlanField('extraAdultRate', event.target.value)} />
            </Field>
            <Field label="Paid child (₹ per night)" error={planErrors.childRate}>
              <input type="number" min="0" inputMode="decimal" value={planForm.childRate} onChange={(event) => setPlanField('childRate', event.target.value)} />
            </Field>
          </div>
          <footer className="rrw-modal-foot">
            <button type="button" className="rrw-btn is-light" onClick={close}>Cancel</button>
            <button type="button" className="rrw-btn is-primary" onClick={savePlan} disabled={busy === 'plan'}>{busy === 'plan' ? 'Adding…' : 'Add rateplan'}</button>
          </footer>
        </ModalShell>
      )}

      {modal?.type === 'details' && detailRoom && (
        <DrawerShell title={detailRoom.roomName} subtitle="Every way this room is sold" onClose={close}>
          <div className="rrw-drawer-summary">
            <div><span>Status</span><strong>{detailRoom.active !== false ? 'On sale' : 'Off'}</strong></div>
            <div><span>Rateplans on sale</span><strong>{(detailRoom.ratePlans ?? []).filter((plan) => plan.active).length}</strong></div>
            <div><span>Room-only rate</span><strong>{rupees(detailRoom.pricePerGuest)}</strong></div>
          </div>
          <h4 className="rrw-drawer-label">Rateplans</h4>
          <div className="rrw-drawer-plans">
            {(detailRoom.ratePlans ?? []).map((plan) => {
              const locked = plan.standard && plan.code === 'EP';
              return (
                <article key={plan.id} className={plan.active ? '' : 'is-off'}>
                  <div>
                    <strong>{plan.name}</strong>
                    <p>
                      {KIND_LABELS[plan.kind]} · {masterLabel('mealOption', plan.mealPlan)}
                      {plan.dayUseHours ? ` · ${plan.dayUseHours} hours` : ''} · {rupees(plan.weekdayRate)}
                      {plan.weekendRate !== plan.weekdayRate ? ` / ${rupees(plan.weekendRate)} Fri–Sat` : ''}
                    </p>
                    {plan.description ? <p>{plan.description}</p> : null}
                  </div>
                  <div className="rrw-plan-actions">
                    <label className="rrw-switch is-small" title={locked ? 'Room only is always sold' : plan.active ? 'On sale' : 'Off'}>
                      <input type="checkbox" checked={plan.active} disabled={locked || busy === `plan-${plan.id}`} onChange={() => togglePlan(detailRoom, plan)} aria-label={`${plan.name} on sale`} />
                      <span className="rrw-switch-track"><span className="rrw-switch-thumb" /></span>
                    </label>
                    {!plan.standard ? (
                      <button type="button" onClick={() => removePlan(detailRoom, plan)} disabled={busy === `plan-${plan.id}`} aria-label={`Remove ${plan.name}`}><X size={15} aria-hidden="true" /></button>
                    ) : null}
                  </div>
                </article>
              );
            })}
            {!(detailRoom.ratePlans ?? []).length && <p className="rrw-drawer-empty">No rateplans are attached to this room yet.</p>}
          </div>
          <button type="button" className="rrw-btn is-primary is-full" onClick={() => openPlan(detailRoom)}><Plus size={15} aria-hidden="true" /> Add Rateplan</button>
          {confirmRemove ? (
            <div className="rrw-confirm" role="alertdialog" aria-label="Remove this room">
              <p>Remove <strong>{detailRoom.roomName}</strong>? Its rates and inventory are deleted. A room with bookings can not be removed – switch it off instead.</p>
              <div>
                <button type="button" className="rrw-btn is-light" onClick={() => setConfirmRemove(false)}>Keep room</button>
                <button type="button" className="rrw-btn is-danger" onClick={() => removeRoom(detailRoom)} disabled={busy === 'remove'}>{busy === 'remove' ? 'Removing…' : 'Remove room'}</button>
              </div>
            </div>
          ) : (
            <button type="button" className="rrw-btn is-danger is-full" onClick={() => setConfirmRemove(true)}>Remove room</button>
          )}
        </DrawerShell>
      )}
    </div>
  );
}
