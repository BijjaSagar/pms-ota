import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BedDouble,
  Check,
  ChevronRight,
  Pencil,
  Plus,
  Tag,
  X,
} from 'lucide-react';
import {
  BED_TYPE_OPTIONS,
  EMPTY_ROOMS_INFO,
  MEAL_OPTIONS,
  ROOM_AMENITY_ITEMS,
  ROOM_SIZE_UNITS,
  ROOM_TYPE_OPTIONS,
  ROOM_VIEW_OPTIONS,
  validateRoomsInfo,
} from '../../lib/data/partner.js';
import {
  defaultRateplansFor,
  EMPTY_ROOM_EXTRA,
  RATEPLAN_PRESETS,
} from '../../lib/data/roomsRateplans.js';
import { deleteRoom, loadMasters, roomFromApi, saveRoom } from '../../lib/api/properties.js';

const storageKey = (propertyId) => `triponx.partner.roomsRateplans.${propertyId}`;

function readExtras(propertyId) {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(propertyId))) ?? {};
  } catch {
    return {};
  }
}

function optionValues(options) {
  return options.filter(([value]) => value).map(([value, label]) => ({ value, label }));
}

function firstOption(options) {
  return optionValues(options)[0]?.value ?? '';
}

function buildEmptyRoomForm() {
  return {
    ...EMPTY_ROOMS_INFO,
    roomType: firstOption(ROOM_TYPE_OPTIONS),
    roomView: firstOption(ROOM_VIEW_OPTIONS),
    roomSize: '350',
    roomSizeUnit: firstOption(ROOM_SIZE_UNITS) || 'sqft',
    bedType: firstOption(BED_TYPE_OPTIONS),
    maxGuests: '2',
    bathroomCount: '1',
    mealOption: firstOption(MEAL_OPTIONS),
    pricePerGuest: '3500',
    amenities: Object.fromEntries(ROOM_AMENITY_ITEMS.map((item) => [item.id, 'no'])),
  };
}

function roomDescription(room) {
  const parts = [
    room.roomView,
    room.bedType,
    room.mealOption,
    room.roomSize ? `${room.roomSize} ${room.roomSizeUnit || 'sqft'}` : '',
  ].filter((value) => value && typeof value === 'string');
  return parts.slice(0, 3).join(' · ');
}

function CardField({ label, children, full }) {
  return (
    <label className={`rrw-field ${full ? 'is-full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ModalShell({ title, subtitle, children, onClose, wide }) {
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

export default function RoomsRateplansWorkspace({ property }) {
  const propertyId = property?.id;
  const [rooms, setRooms] = useState(() => (Array.isArray(property?.rooms) ? property.rooms : []));
  const [extras, setExtras] = useState(() => readExtras(propertyId));
  const [mastersReady, setMastersReady] = useState(false);
  const [modal, setModal] = useState(null);
  const [roomForm, setRoomForm] = useState(() => buildEmptyRoomForm());
  const [roomErrors, setRoomErrors] = useState({});
  const [amenitiesForm, setAmenitiesForm] = useState({});
  const [rateplanForm, setRateplanForm] = useState({ preset: 'cp', label: '', price: '' });
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    loadMasters()
      .then(() => { if (active) setMastersReady(true); })
      .catch(() => { if (active) setMastersReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setRooms(Array.isArray(property?.rooms) ? property.rooms : []);
    setExtras(readExtras(propertyId));
  }, [property?.id, property?.rooms, propertyId]);

  const persistExtras = (next) => {
    setExtras(next);
    try {
      sessionStorage.setItem(storageKey(propertyId), JSON.stringify(next));
    } catch {
      setNotice({ kind: 'error', text: 'Changes are saved for this session only.' });
    }
  };

  const cards = useMemo(() => rooms.map((room, index) => {
    const key = String(room.id ?? room.roomName ?? index);
    const extra = extras[key] ?? {};
    const name = String(room.roomName ?? room.roomType ?? `Room ${index + 1}`);
    const plans = Array.isArray(extra.rateplans)
      ? extra.rateplans
      : defaultRateplansFor(room, index);
    return {
      ...room,
      key,
      displayName: name,
      description: extra.description || room.description || roomDescription(room) || 'Room details updated soon.',
      active: extra.active ?? !/hourly|dayuse|day use/i.test(name),
      rateplans: plans,
      hourly: /hourly|dayuse|day use/i.test(name),
    };
  }), [rooms, extras]);

  const activeCard = (id) => cards.find((room) => String(room.key) === String(id));

  const openRoomModal = (room) => {
    setRoomErrors({});
    setRoomForm(room ? roomFromApi(room) : buildEmptyRoomForm());
    setModal({ type: 'room', roomId: room?.key ?? null });
  };

  const openAmenitiesModal = (room) => {
    const source = roomFromApi(room);
    setAmenitiesForm(Object.fromEntries(ROOM_AMENITY_ITEMS.map((item) => [item.id, source.amenities?.[item.id] ?? 'no'])));
    setModal({ type: 'amenities', roomId: room.key });
  };

  const openRateplanModal = (room) => {
    setRateplanForm({ preset: RATEPLAN_PRESETS[0].id, label: '', price: '' });
    setModal({ type: 'rateplan', roomId: room.key });
  };

  const setRoomValue = (field, value) => {
    setRoomForm((current) => ({ ...current, [field]: value }));
    setRoomErrors((current) => ({ ...current, [field]: undefined }));
  };

  const setRoomAmenity = (id, value) => {
    setRoomForm((current) => ({ ...current, amenities: { ...current.amenities, [id]: value } }));
  };

  const saveRoomForm = async () => {
    const errors = validateRoomsInfo(roomForm);
    setRoomErrors(errors);
    if (Object.keys(errors).length) {
      setNotice({ kind: 'error', text: 'Complete the highlighted room details before saving.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const saved = await saveRoom(propertyId, modal.roomId, roomForm);
      const nextId = modal.roomId ?? saved?.id ?? `local-${Date.now()}`;
      const nextRoom = { ...roomForm, id: nextId };
      setRooms((current) => modal.roomId
        ? current.map((room) => (String(room.id ?? room.roomName) === String(modal.roomId) ? { ...room, ...roomForm } : room))
        : [...current, nextRoom]);
      persistExtras({
        ...extras,
        [String(nextId)]: {
          ...(extras[String(nextId)] ?? EMPTY_ROOM_EXTRA),
          description: extras[String(nextId)]?.description ?? '',
        },
      });
      setModal(null);
      setNotice({ kind: 'success', text: `${roomForm.roomName.trim()} saved.` });
    } catch (error) {
      setNotice({ kind: 'error', text: error?.message || 'We could not save this room. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const saveAmenities = async () => {
    const room = activeCard(modal.roomId);
    if (!room) return;
    setSaving(true);
    setNotice(null);
    try {
      const source = roomFromApi(room);
      await saveRoom(propertyId, room.id, { ...source, amenities: amenitiesForm });
      setRooms((current) => current.map((item) => (
        String(item.id ?? item.roomName) === String(room.key) ? { ...item, amenities: amenitiesForm } : item
      )));
      setModal(null);
      setNotice({ kind: 'success', text: `Amenities updated for ${room.displayName}.` });
    } catch (error) {
      setNotice({ kind: 'error', text: error?.message || 'We could not save amenities. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const saveRateplan = () => {
    const room = activeCard(modal.roomId);
    if (!room) return;
    const preset = RATEPLAN_PRESETS.find((plan) => plan.id === rateplanForm.preset);
    const label = rateplanForm.label.trim() || preset?.label || 'Custom rateplan';
    if (!label) return;
    const plan = {
      id: `${preset?.id ?? 'custom'}-${Date.now()}`,
      label,
      detail: rateplanForm.price.trim() ? `₹${rateplanForm.price.trim()} per guest` : preset?.detail || 'Custom rateplan',
    };
    persistExtras({
      ...extras,
      [room.key]: {
        ...(extras[room.key] ?? EMPTY_ROOM_EXTRA),
        active: extras[room.key]?.active ?? room.active,
        description: extras[room.key]?.description ?? room.description,
        rateplans: [...room.rateplans, plan],
      },
    });
    setModal(null);
    setNotice({ kind: 'success', text: `${label} added to ${room.displayName}.` });
  };

  const toggleActive = (room) => {
    persistExtras({
      ...extras,
      [room.key]: {
        ...(extras[room.key] ?? EMPTY_ROOM_EXTRA),
        active: !room.active,
        description: extras[room.key]?.description ?? room.description,
        rateplans: room.rateplans,
      },
    });
    setNotice({ kind: 'success', text: `${room.displayName} marked ${room.active ? 'inactive' : 'active'}.` });
  };

  const removeRateplan = (room, planId) => {
    persistExtras({
      ...extras,
      [room.key]: {
        ...(extras[room.key] ?? EMPTY_ROOM_EXTRA),
        active: room.active,
        description: room.description,
        rateplans: room.rateplans.filter((plan) => plan.id !== planId),
      },
    });
  };

  const removeRoom = async (room) => {
    if (!window.confirm(`Remove ${room.displayName}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await deleteRoom(propertyId, room.id);
      setRooms((current) => current.filter((item) => String(item.id ?? item.roomName) !== String(room.key)));
      const nextExtras = { ...extras };
      delete nextExtras[room.key];
      persistExtras(nextExtras);
      setModal(null);
      setNotice({ kind: 'success', text: `${room.displayName} removed.` });
    } catch (error) {
      setNotice({ kind: 'error', text: error?.message || 'We could not remove this room. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const detailRoom = modal?.roomId ? activeCard(modal.roomId) : null;

  return (
    <div className="rrw-root">
      <header className="rrw-header">
        <div>
          <span className="rrw-eyebrow"><BedDouble size={14} aria-hidden="true" /> Property information</span>
          <h2>Rooms &amp; Rateplans</h2>
          <p>Manage room categories, availability, amenities and the plans guests can book.</p>
        </div>
        <div className="rrw-header-actions">
          <button type="button" className="rrw-create-btn" onClick={() => openRoomModal(null)} disabled={!mastersReady}>
            <Plus size={16} aria-hidden="true" /> Create New Room
          </button>
        </div>
      </header>

      {notice && <div className={`rrw-notice ${notice.kind}`} role="status">{notice.text}</div>}

      <section className="rrw-section" aria-labelledby="rrw-existing-heading">
        <div className="rrw-section-head">
          <div>
            <h3 id="rrw-existing-heading">Existing Rooms ({cards.length})</h3>
            <p>Toggle a room to control whether it appears as bookable.</p>
          </div>
          <span className="rrw-count-pill">{cards.filter((room) => room.active).length} active</span>
        </div>

        {cards.length ? (
          <div className="rrw-grid">
            {cards.map((room) => (
              <article className={`rrw-room-card ${room.active ? '' : 'is-inactive'}`} key={room.key}>
                <div className="rrw-room-top">
                  <div className="rrw-room-icon"><BedDouble size={20} aria-hidden="true" /></div>
                  <div className="rrw-room-title">
                    <h4>{room.displayName}</h4>
                    <p>{room.description}</p>
                  </div>
                  <label className="rrw-switch" title={room.active ? 'Room is active' : 'Room is inactive'}>
                    <input type="checkbox" checked={room.active} onChange={() => toggleActive(room)} />
                    <span className="rrw-switch-track"><span className="rrw-switch-thumb" /></span>
                    <span className="rrw-switch-label">{room.active ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>

                <div className="rrw-plan-block">
                  <div className="rrw-plan-head">
                    <span><Tag size={13} aria-hidden="true" /> Rateplans</span>
                    <strong>{room.rateplans.length}</strong>
                  </div>
                  <div className="rrw-plan-chips">
                    {room.rateplans.slice(0, 3).map((plan) => <span key={plan.id}>{plan.label}</span>)}
                    {room.rateplans.length > 3 && <span className="is-more">+ {room.rateplans.length - 3} more</span>}
                    {!room.rateplans.length && <span className="is-empty">No rateplans</span>}
                  </div>
                  <button type="button" className="rrw-link" onClick={() => setModal({ type: 'details', roomId: room.key })}>
                    {room.hourly ? 'Click to View Details' : 'Click to View Rateplans'} <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>

                <div className="rrw-room-actions">
                  <button type="button" onClick={() => openRoomModal(room)}><Pencil size={14} aria-hidden="true" /> Edit Room</button>
                  <button type="button" onClick={() => openRateplanModal(room)}><Plus size={14} aria-hidden="true" /> Add Rateplan</button>
                  <button type="button" onClick={() => openAmenitiesModal(room)}><Check size={14} aria-hidden="true" /> Edit Amenities</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rrw-empty">
            <BedDouble size={28} aria-hidden="true" />
            <h4>No rooms added yet</h4>
            <p>Create your first room category to start configuring rateplans.</p>
            <button type="button" className="rrw-create-btn" onClick={() => openRoomModal(null)} disabled={!mastersReady}><Plus size={16} aria-hidden="true" /> Create New Room</button>
          </div>
        )}
      </section>

      {modal?.type === 'room' && (
        <ModalShell
          title={modal.roomId ? 'Edit Room' : 'Create New Room'}
          subtitle="Configure the room details required for booking and platform previews."
          onClose={() => setModal(null)}
          wide
        >
          <div className="rrw-form-grid">
            <CardField label="Display room name" full>
              <input value={roomForm.roomName} maxLength={100} onChange={(event) => setRoomValue('roomName', event.target.value)} placeholder="e.g. Family Studio with Mini Kitchenette" />
              {roomErrors.roomName && <small className="rrw-error">{roomErrors.roomName}</small>}
            </CardField>
            <CardField label="Room type">
              <select value={roomForm.roomType} onChange={(event) => setRoomValue('roomType', event.target.value)}>
                {optionValues(ROOM_TYPE_OPTIONS).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {roomErrors.roomType && <small className="rrw-error">{roomErrors.roomType}</small>}
            </CardField>
            <CardField label="Room view">
              <select value={roomForm.roomView} onChange={(event) => setRoomValue('roomView', event.target.value)}>
                {optionValues(ROOM_VIEW_OPTIONS).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {roomErrors.roomView && <small className="rrw-error">{roomErrors.roomView}</small>}
            </CardField>
            <CardField label="Room size">
              <input type="number" min="1" step="0.01" value={roomForm.roomSize} onChange={(event) => setRoomValue('roomSize', event.target.value)} />
              {roomErrors.roomSize && <small className="rrw-error">{roomErrors.roomSize}</small>}
            </CardField>
            <CardField label="Size unit">
              <select value={roomForm.roomSizeUnit} onChange={(event) => setRoomValue('roomSizeUnit', event.target.value)}>
                {optionValues(ROOM_SIZE_UNITS).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {roomErrors.roomSizeUnit && <small className="rrw-error">{roomErrors.roomSizeUnit}</small>}
            </CardField>
            <CardField label="Bed type">
              <select value={roomForm.bedType} onChange={(event) => setRoomValue('bedType', event.target.value)}>
                {optionValues(BED_TYPE_OPTIONS).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {roomErrors.bedType && <small className="rrw-error">{roomErrors.bedType}</small>}
            </CardField>
            <CardField label="Max guests">
              <input type="number" min="1" value={roomForm.maxGuests} onChange={(event) => setRoomValue('maxGuests', event.target.value)} />
              {roomErrors.maxGuests && <small className="rrw-error">{roomErrors.maxGuests}</small>}
            </CardField>
            <CardField label="Number of rooms">
              <input type="number" min="1" value={roomForm.roomCount} onChange={(event) => setRoomValue('roomCount', event.target.value)} />
              {roomErrors.roomCount && <small className="rrw-error">{roomErrors.roomCount}</small>}
            </CardField>
            <CardField label="Bathrooms">
              <input type="number" min="1" value={roomForm.bathroomCount} onChange={(event) => setRoomValue('bathroomCount', event.target.value)} />
              {roomErrors.bathroomCount && <small className="rrw-error">{roomErrors.bathroomCount}</small>}
            </CardField>
            <CardField label="Meal option">
              <select value={roomForm.mealOption} onChange={(event) => setRoomValue('mealOption', event.target.value)}>
                {optionValues(MEAL_OPTIONS).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              {roomErrors.mealOption && <small className="rrw-error">{roomErrors.mealOption}</small>}
            </CardField>
            <CardField label="Base price per guest">
              <input type="number" min="1" value={roomForm.pricePerGuest} onChange={(event) => setRoomValue('pricePerGuest', event.target.value)} />
              {roomErrors.pricePerGuest && <small className="rrw-error">{roomErrors.pricePerGuest}</small>}
            </CardField>
          </div>

          <div className="rrw-amenity-editor">
            <h4>Amenities</h4>
            <div className="rrw-amenity-grid">
              {ROOM_AMENITY_ITEMS.map((item) => (
                <div className="rrw-amenity-row" key={item.id}>
                  <span>{item.label}</span>
                  <div className="rrw-segments">
                    {[['yes', 'Yes'], ['no', 'No']].map(([value, label]) => (
                      <button
                        type="button"
                        key={value}
                        className={roomForm.amenities?.[item.id] === value ? 'is-on' : ''}
                        onClick={() => setRoomAmenity(item.id, value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {roomErrors.amenities?.includes(item.id) && <small className="rrw-error">Choose Yes or No.</small>}
                </div>
              ))}
            </div>
            {roomErrors.amenities && <small className="rrw-error">Answer Yes or No for every room amenity.</small>}
          </div>

          <footer className="rrw-modal-foot">
            <button type="button" className="rrw-btn is-light" onClick={() => setModal(null)}>Cancel</button>
            <button type="button" className="rrw-btn is-primary" onClick={saveRoomForm} disabled={saving}>{saving ? 'Saving…' : modal.roomId ? 'Save room' : 'Create room'} <ArrowRight size={15} aria-hidden="true" /></button>
          </footer>
        </ModalShell>
      )}

      {modal?.type === 'amenities' && (
        <ModalShell
          title="Edit Amenities"
          subtitle={detailRoom?.displayName}
          onClose={() => setModal(null)}
        >
          <div className="rrw-amenity-grid is-solo">
            {ROOM_AMENITY_ITEMS.map((item) => (
              <div className="rrw-amenity-row" key={item.id}>
                <span>{item.label}</span>
                <div className="rrw-segments">
                  {[['yes', 'Yes'], ['no', 'No']].map(([value, label]) => (
                    <button
                      type="button"
                      key={value}
                      className={amenitiesForm[item.id] === value ? 'is-on' : ''}
                      onClick={() => setAmenitiesForm((current) => ({ ...current, [item.id]: value }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <footer className="rrw-modal-foot">
            <button type="button" className="rrw-btn is-light" onClick={() => setModal(null)}>Cancel</button>
            <button type="button" className="rrw-btn is-primary" onClick={saveAmenities} disabled={saving}>{saving ? 'Saving…' : 'Save amenities'}</button>
          </footer>
        </ModalShell>
      )}

      {modal?.type === 'rateplan' && (
        <ModalShell
          title="Add Rateplan"
          subtitle={`Associate a new plan with ${detailRoom?.displayName ?? 'this room'}.`}
          onClose={() => setModal(null)}
        >
          <div className="rrw-form-grid">
            <CardField label="Rateplan" full>
              <select value={rateplanForm.preset} onChange={(event) => setRateplanForm((current) => ({ ...current, preset: event.target.value, label: '' }))}>
                {RATEPLAN_PRESETS.map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
              </select>
            </CardField>
            <CardField label="Display name" full>
              <input value={rateplanForm.label} onChange={(event) => setRateplanForm((current) => ({ ...current, label: event.target.value }))} placeholder="Leave blank to use the preset name" />
            </CardField>
            <CardField label="Price per guest">
              <input type="number" min="1" value={rateplanForm.price} onChange={(event) => setRateplanForm((current) => ({ ...current, price: event.target.value }))} placeholder="e.g. 4500" />
            </CardField>
          </div>
          <footer className="rrw-modal-foot">
            <button type="button" className="rrw-btn is-light" onClick={() => setModal(null)}>Cancel</button>
            <button type="button" className="rrw-btn is-primary" onClick={saveRateplan}>Add rateplan</button>
          </footer>
        </ModalShell>
      )}

      {modal?.type === 'details' && detailRoom && (
        <DrawerShell
          title={detailRoom.displayName}
          subtitle={detailRoom.hourly ? 'Room and day-use plan details' : 'Complete rateplan list'}
          onClose={() => setModal(null)}
        >
          <div className="rrw-drawer-summary">
            <div><span>Status</span><strong>{detailRoom.active ? 'Active' : 'Inactive'}</strong></div>
            <div><span>Rateplans</span><strong>{detailRoom.rateplans.length}</strong></div>
            <div><span>Description</span><strong>{detailRoom.description}</strong></div>
          </div>
          <h4 className="rrw-drawer-label">Associated rateplans</h4>
          <div className="rrw-drawer-plans">
            {detailRoom.rateplans.map((plan) => (
              <article key={plan.id}>
                <div>
                  <strong>{plan.label}</strong>
                  <p>{plan.detail}</p>
                </div>
                <button type="button" onClick={() => removeRateplan(detailRoom, plan.id)} aria-label={`Remove ${plan.label}`}><X size={15} aria-hidden="true" /></button>
              </article>
            ))}
            {!detailRoom.rateplans.length && <p className="rrw-drawer-empty">No rateplans are attached to this room yet.</p>}
          </div>
          <button type="button" className="rrw-btn is-primary is-full" onClick={() => openRateplanModal(detailRoom)}><Plus size={15} aria-hidden="true" /> Add Rateplan</button>
          <button type="button" className="rrw-btn is-danger is-full" onClick={() => removeRoom(detailRoom)} disabled={saving}>Remove room</button>
        </DrawerShell>
      )}

    </div>
  );
}
