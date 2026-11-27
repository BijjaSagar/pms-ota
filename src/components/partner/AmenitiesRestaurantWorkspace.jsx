import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Clock, Info, Plus, Search, Sparkles, Trash2, UtensilsCrossed, X,
} from 'lucide-react';
import { AMENITY_CATEGORIES, MASTER_LISTS, ROOM_AMENITY_ITEMS, masterLabel } from '../../lib/data/partner.js';
import { AMENITY_CATEGORY_ORDER } from '../../lib/data/amenitiesRestaurant.js';
import {
  createRestaurant, deleteRestaurant, getAmenities, loadMasters, saveAmenityAnswers, saveRoomAmenities, updateRestaurant,
} from '../../lib/api/properties.js';

// Amenities & Restaurants, saved on the server: the property's amenity answers
// (Yes / No), each room's amenity answers (Yes / No), and the restaurants.

const HOTEL = 'hotel';
const ROOM_CATEGORY = 'room-amenities';

const normalize = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** { code: { available } } from the API's answer list (Yes / No only). */
const answerMap = (answers = []) => Object.fromEntries(answers.map((a) => [a.code, { available: a.available }]));
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const emptyRestaurant = () => ({ id: null, name: '', description: '', cuisines: [], diningModes: ['dine-in'], openingHours: '', active: true });

function validateRestaurant(form) {
  const errors = {};
  const name = form.name.trim();
  if (name.length < 2 || name.length > 80) errors.name = 'Enter a name (2–80 characters).';
  if (form.description.length > 1000) errors.description = 'Keep it under 1000 characters.';
  if (!form.diningModes.length) errors.diningModes = 'Choose at least one dining mode.';
  if (form.openingHours.length > 60) errors.openingHours = 'Keep it under 60 characters.';
  return errors;
}

function ModalShell({ title, subtitle, children, onClose, wide }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onClose]);
  return (
    <div className="rar-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`rar-modal ${wide ? 'is-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="rar-modal-title">
        <header className="rar-modal-head">
          <div>
            <h3 id="rar-modal-title">{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="rar-icon-btn" onClick={onClose} aria-label="Close dialog"><X size={18} aria-hidden="true" /></button>
        </header>
        <div className="rar-modal-body">{children}</div>
      </section>
    </div>
  );
}

export default function AmenitiesRestaurantWorkspace({ property }) {
  const propertyId = property.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'restaurant' ? 'restaurant' : 'amenities';
  const [data, setData] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [view, setView] = useState(HOTEL);
  const [draft, setDraft] = useState({});
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [missing, setMissing] = useState([]);
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [restaurantForm, setRestaurantForm] = useState(null);
  const [restaurantErrors, setRestaurantErrors] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(null);
  const categoryScrollerRef = useRef(null);
  const categoryRefs = useRef({});

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [, next] = await Promise.all([loadMasters(), getAmenities(propertyId)]);
      setData(next);
    } catch (problem) {
      setLoadError(problem?.message || 'Could not load the amenities.');
    }
  }, [propertyId]);
  useEffect(() => { load(); }, [load]);

  const hotelCategories = useMemo(() => {
    const ranks = new Map(AMENITY_CATEGORY_ORDER.map((label, index) => [normalize(label), index]));
    const rank = (category) => ranks.get(normalize(category.label)) ?? 999;
    return [...AMENITY_CATEGORIES].sort((a, b) => rank(a) - rank(b));
  }, [data]);
  const room = view === HOTEL ? null : data?.rooms.find((item) => item.id === view);
  const categories = room ? [{ id: ROOM_CATEGORY, label: 'Room amenities', items: ROOM_AMENITY_ITEMS }] : hotelCategories;

  // Saved answers of what is on screen; the draft holds unsaved changes.
  const saved = useMemo(() => answerMap(room ? room.answers : data?.answers), [data, room]);
  const answerOf = (code) => draft[code] ?? saved[code];
  const changedCodes = Object.keys(draft).filter((code) => !same(draft[code], saved[code]));

  const activeCategory = categories.find((category) => category.id === activeCategoryId) ?? categories[0];
  useEffect(() => {
    const container = categoryScrollerRef.current;
    const item = categoryRefs.current[activeCategory?.id];
    if (!container || !item) return;
    container.scrollTo({ left: item.offsetLeft - (container.clientWidth - item.clientWidth) / 2, behavior: 'smooth' });
  }, [activeCategory?.id, view]);

  const mandatory = useMemo(() => new Set(room ? [] : data?.mandatory ?? []), [data, room]);

  const items = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = activeCategory?.items ?? [];
    return query ? list.filter((item) => `${item.id} ${item.label}`.toLowerCase().includes(query)) : list;
  }, [activeCategory, search]);

  const allCodes = useMemo(() => [...new Set(categories.flatMap((category) => category.items.map((item) => item.id)))], [categories]);
  const answeredCount = allCodes.filter((code) => answerOf(code)).length;

  const discard = () => {
    setDraft({});
    setMissing([]);
    setNotice(null);
  };

  const changeView = (next) => {
    if (changedCodes.length) {
      setNotice({ kind: 'error', text: 'Save or discard your changes before switching.' });
      return;
    }
    setView(next);
    setDraft({});
    setMissing([]);
    setSearch('');
    setActiveCategoryId('');
    setNotice(null);
  };

  const changeTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'amenities') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
    setNotice(null);
  };

  const answer = (code, available) => {
    setDraft((prev) => ({ ...prev, [code]: { available } }));
    setMissing((prev) => prev.filter((item) => item !== code));
    setNotice(null);
  };

  const scrollCategories = (direction) => categoryScrollerRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  const onCategoryKeyDown = (event, index) => {
    const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: categories.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = categories[(keys[event.key] + categories.length) % categories.length];
    setActiveCategoryId(next.id);
    setSearch('');
    categoryRefs.current[next.id]?.focus();
  };

  const save = async () => {
    const unanswered = [...mandatory].filter((code) => !answerOf(code));
    if (unanswered.length) {
      setMissing(unanswered);
      const category = hotelCategories.find((c) => c.items.some((item) => unanswered.includes(item.id)));
      if (category) setActiveCategoryId(category.id);
      setNotice({ kind: 'error', text: `Answer every mandatory amenity (${unanswered.length} left) before saving.` });
      return;
    }
    if (!changedCodes.length) {
      setNotice({ kind: 'success', text: 'Nothing has changed.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const next = room
        ? await saveRoomAmenities(propertyId, room.id, changedCodes.map((code) => ({ code, available: draft[code].available })))
        : await saveAmenityAnswers(propertyId, changedCodes.map((code) => ({ code, available: draft[code].available })));
      setData(next);
      setDraft({});
      setMissing([]);
      setNotice({ kind: 'success', text: `${room ? room.name : 'Property'} amenities saved.` });
    } catch (problem) {
      setNotice({ kind: 'error', text: problem?.message || 'We could not save the amenities. Try again.' });
    } finally {
      setSaving(false);
    }
  };


  // ---------------------------------------------------------------- restaurants
  const openRestaurant = (restaurant) => {
    setRestaurantErrors({});
    setRestaurantForm(restaurant
      ? { ...restaurant, description: restaurant.description ?? '', openingHours: restaurant.openingHours ?? '' }
      : emptyRestaurant());
  };
  const setRestaurantField = (key, value) => {
    setRestaurantForm((current) => ({ ...current, [key]: value }));
    setRestaurantErrors((current) => ({ ...current, [key]: undefined }));
  };
  const toggleIn = (key, code) => setRestaurantField(key, restaurantForm[key].includes(code) ? restaurantForm[key].filter((item) => item !== code) : [...restaurantForm[key], code]);

  const saveRestaurant = async () => {
    const problems = validateRestaurant(restaurantForm);
    setRestaurantErrors(problems);
    if (Object.keys(problems).length) return;
    const body = {
      name: restaurantForm.name.trim(),
      description: restaurantForm.description.trim() || undefined,
      cuisines: restaurantForm.cuisines,
      diningModes: restaurantForm.diningModes,
      openingHours: restaurantForm.openingHours.trim() || undefined,
      active: restaurantForm.active,
    };
    setSaving(true);
    try {
      const next = restaurantForm.id ? await updateRestaurant(propertyId, restaurantForm.id, body) : await createRestaurant(propertyId, body);
      setData(next);
      setRestaurantForm(null);
      setNotice({ kind: 'success', text: `${body.name} saved.` });
    } catch (problem) {
      const fieldErrors = Object.fromEntries(Object.entries(problem?.fieldErrors ?? {}).map(([field, message]) => [field.split('.')[0], /^[A-Z]/.test(message) ? message : `This ${message}.`]));
      if (Object.keys(fieldErrors).length) setRestaurantErrors(fieldErrors);
      else setNotice({ kind: 'error', text: problem?.message || 'We could not save the restaurant.' });
    } finally {
      setSaving(false);
    }
  };

  const removeRestaurant = async (restaurant) => {
    setSaving(true);
    try {
      setData(await deleteRestaurant(propertyId, restaurant.id));
      setConfirmRemove(null);
      setNotice({ kind: 'success', text: `${restaurant.name} removed.` });
    } catch (problem) {
      setNotice({ kind: 'error', text: problem?.message || 'We could not remove the restaurant.' });
    } finally {
      setSaving(false);
    }
  };

  if (!data) {
    return loadError ? (
      <div className="rar-notice error" role="alert"><Info size={15} aria-hidden="true" /> {loadError} <button type="button" className="rar-btn is-light" onClick={load}>Try again</button></div>
    ) : <div className="rar-loading" role="status">Loading amenities…</div>;
  }

  const restaurants = data.restaurants ?? [];
  const cuisines = MASTER_LISTS.cuisine ?? [];
  const diningModes = MASTER_LISTS.diningMode ?? [];

  return (
    <div className="rar-root">
      <header className="rar-header">
        <div className="rar-heading">
          <span className="rar-heading-icon"><Sparkles size={20} aria-hidden="true" /></span>
          <div className="rar-heading-text">
            <h2>AMENITIES &amp; SERVICES</h2>
            <p>Tell guests what your property offers. Mandatory amenities need a Yes or No.</p>
          </div>
        </div>
        <div className="rar-header-right">
          <nav className="rar-tabs" aria-label="Amenities and restaurant sections">
            <button type="button" className={tab === 'amenities' ? 'is-on' : ''} onClick={() => changeTab('amenities')}><Sparkles size={14} aria-hidden="true" /> Amenities</button>
            <button type="button" className={tab === 'restaurant' ? 'is-on' : ''} onClick={() => changeTab('restaurant')}><UtensilsCrossed size={14} aria-hidden="true" /> Restaurant</button>
          </nav>
        </div>
      </header>

      {notice && <div className={`rar-notice ${notice.kind}`} role="status">{notice.text}</div>}

      {tab === 'amenities' ? (
        <div className="rar-amenities-layout">
          <div className="rar-amenity-toolbar">
            <div className="rar-category-list" ref={categoryScrollerRef} role="tablist" aria-label="Amenity categories">
              {categories.map((category, index) => {
                const selected = activeCategory?.id === category.id;
                const yes = category.items.filter((item) => answerOf(item.id)?.available).length;
                return (
                  <button type="button" key={category.id} ref={(node) => { categoryRefs.current[category.id] = node; }} role="tab"
                    aria-selected={selected} tabIndex={selected ? 0 : -1} className={`rar-category ${selected ? 'is-on' : ''}`}
                    onClick={() => { setActiveCategoryId(category.id); setSearch(''); }} onKeyDown={(event) => onCategoryKeyDown(event, index)}>
                    <span className="rar-category-name">{category.label}</span>
                    <span className="rar-category-count">{yes}/{category.items.length}</span>
                  </button>
                );
              })}
            </div>
            <div className="rar-toolbar-row">
              <div className="rar-filter-block">
                <label htmlFor="rar-view-for">View amenities for</label>
                <select id="rar-view-for" value={view} onChange={(event) => changeView(event.target.value)}>
                  <option value={HOTEL}>Property</option>
                  {data.rooms.map((item) => <option key={item.id} value={item.id}>{item.name}{item.active ? '' : ' (off)'}</option>)}
                </select>
              </div>
              <label className="rar-search">
                <Search size={15} aria-hidden="true" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search in ${activeCategory?.label ?? 'amenities'}`} aria-label="Search amenities in selected category" />
                {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={14} aria-hidden="true" /></button>}
              </label>
              <div className="rar-scroll-controls">
                <button type="button" onClick={() => scrollCategories(-1)} aria-label="Scroll categories left"><ChevronLeft size={16} aria-hidden="true" /></button>
                <button type="button" onClick={() => scrollCategories(1)} aria-label="Scroll categories right"><ChevronRight size={16} aria-hidden="true" /></button>
              </div>
            </div>
          </div>

          <section className="rar-amenity-workspace" role="tabpanel" aria-label={activeCategory?.label}>
            <header className="rar-workspace-head">
              <div>
                <h3>{activeCategory?.label ?? 'Amenities'}</h3>
                <p>{(activeCategory?.items ?? []).filter((item) => answerOf(item.id)).length} of {activeCategory?.items.length ?? 0} answered</p>
              </div>
            </header>

            {missing.some((code) => activeCategory?.items.some((item) => item.id === code)) ? (
              <div className="rar-inline-warning"><AlertTriangle size={15} aria-hidden="true" /> Answer the highlighted mandatory amenities.</div>
            ) : null}

            {items.length ? (
              <div className="rar-amenity-grid">
                {items.map((item) => {
                  const current = answerOf(item.id);
                  const value = current ? (current.available ? 'yes' : 'no') : '';
                  const invalid = missing.includes(item.id);
                  return (
                    <article className={`rar-amenity-card ${value === 'yes' ? 'is-enabled' : ''} ${invalid ? 'has-error' : ''}`} key={item.id}>
                      <div className="rar-amenity-card-head">
                        <div>
                          <h5>{item.label}{mandatory.has(item.id) ? <em className="rar-required" title="Mandatory"> *</em> : null}</h5>
                          <span>{draft[item.id] && !same(draft[item.id], saved[item.id]) ? 'Not saved yet' : current ? 'Saved' : 'Not answered'}</span>
                        </div>
                        <div className="rar-segments" role="group" aria-label={`${item.label} availability`}>
                          {[['yes', 'Yes'], ['no', 'No']].map(([option, label]) => (
                            <button type="button" key={option} className={value === option ? 'is-on' : ''} aria-pressed={value === option} onClick={() => answer(item.id, option === 'yes')}>{label}</button>
                          ))}
                        </div>
                      </div>
                      {invalid && <small className="rar-error">Choose Yes or No.</small>}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rar-empty"><Search size={24} aria-hidden="true" /><h4>No amenities found</h4><p>Try a different amenity name in {activeCategory?.label ?? 'this category'}.</p></div>
            )}

            <footer className="rar-save-bar">
              <span><CheckCircle2 size={15} aria-hidden="true" /> {answeredCount} of {allCodes.length} answered{changedCodes.length ? ` · ${changedCodes.length} unsaved` : ''}</span>
              <div className="rar-save-actions">
                {changedCodes.length ? <button type="button" className="rar-btn is-light" onClick={discard} disabled={saving}>Discard</button> : null}
                <button type="button" className="rar-btn" onClick={save} disabled={saving || !changedCodes.length}>{saving ? 'Saving…' : room ? 'Save room amenities' : 'Save amenities'}</button>
              </div>
            </footer>
          </section>
        </div>
      ) : (
        <section className="rar-restaurant-workspace">
          <header className="rar-restaurant-head">
            <div>
              <h3>Restaurant details</h3>
              <p>Add dining options so guests can discover food services at your property. Photos are added in Photos &amp; Videos.</p>
            </div>
            <button type="button" className="rar-btn" onClick={() => openRestaurant(null)}><Plus size={15} aria-hidden="true" /> Add restaurant</button>
          </header>

          {restaurants.length ? (
            <div className="rar-restaurant-grid">
              {restaurants.map((restaurant) => (
                <article className={`rar-restaurant-card ${restaurant.active ? '' : 'is-off'}`} key={restaurant.id}>
                  <div className="rar-restaurant-media"><UtensilsCrossed size={24} aria-hidden="true" /></div>
                  <div className="rar-restaurant-copy">
                    <span className="rar-restaurant-mode">{restaurant.diningModes.map((code) => masterLabel('diningMode', code)).join(' · ')}{restaurant.active ? '' : ' · Hidden'}</span>
                    <h4>{restaurant.name}</h4>
                    <p>{restaurant.description || 'No description added yet.'}</p>
                    <div className="rar-chip-list">
                      {restaurant.cuisines.map((code) => <span key={code}>{masterLabel('cuisine', code)}</span>)}
                      {!restaurant.cuisines.length && <span className="is-empty">No cuisines selected</span>}
                    </div>
                    <div className="rar-restaurant-meta"><Clock size={13} aria-hidden="true" /> {restaurant.openingHours || 'Timings not added'}</div>
                    {confirmRemove === restaurant.id ? (
                      <div className="rar-confirm" role="alertdialog" aria-label={`Remove ${restaurant.name}`}>
                        <span>Remove {restaurant.name}? Its photos stay in the gallery.</span>
                        <div>
                          <button type="button" className="rar-btn is-light" onClick={() => setConfirmRemove(null)}>Keep</button>
                          <button type="button" className="rar-btn is-danger" onClick={() => removeRestaurant(restaurant)} disabled={saving}>Remove</button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="rar-restaurant-actions">
                    <button type="button" onClick={() => openRestaurant(restaurant)}>Edit</button>
                    <button type="button" onClick={() => setConfirmRemove(restaurant.id)} aria-label={`Remove ${restaurant.name}`}><Trash2 size={14} aria-hidden="true" /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rar-empty is-large"><UtensilsCrossed size={28} aria-hidden="true" /><h4>No restaurants added yet</h4><p>Add your first restaurant to show dining options on your listing.</p><button type="button" className="rar-btn" onClick={() => openRestaurant(null)}><Plus size={15} aria-hidden="true" /> Add restaurant</button></div>
          )}
        </section>
      )}

      {restaurantForm && (
        <ModalShell title={restaurantForm.id ? 'Edit Restaurant' : 'Add Restaurant'} subtitle="Guests see these details on your listing." onClose={() => setRestaurantForm(null)} wide>
          <div className="rar-form-grid">
            <label className="rar-field is-full"><span>Restaurant name</span>
              <input value={restaurantForm.name} maxLength={80} onChange={(event) => setRestaurantField('name', event.target.value)} placeholder="e.g. The Garden Café" aria-invalid={Boolean(restaurantErrors.name)} />
              {restaurantErrors.name && <small className="rar-error" role="alert">{restaurantErrors.name}</small>}
            </label>
            <label className="rar-field is-full"><span>Description (optional)</span>
              <textarea rows="3" maxLength={1000} value={restaurantForm.description} onChange={(event) => setRestaurantField('description', event.target.value)} placeholder="Short description of the dining experience" />
              {restaurantErrors.description && <small className="rar-error" role="alert">{restaurantErrors.description}</small>}
            </label>
            <label className="rar-field"><span>Opening hours (optional)</span>
              <input value={restaurantForm.openingHours} maxLength={60} onChange={(event) => setRestaurantField('openingHours', event.target.value)} placeholder="e.g. 07:00 – 22:30" />
              {restaurantErrors.openingHours && <small className="rar-error" role="alert">{restaurantErrors.openingHours}</small>}
            </label>
            <label className="rar-field rar-check"><input type="checkbox" checked={restaurantForm.active} onChange={(event) => setRestaurantField('active', event.target.checked)} /><span>Show this restaurant to guests</span></label>
          </div>
          <fieldset className="rar-cuisine-field">
            <legend>Dining modes</legend>
            <div className="rar-cuisine-grid">
              {diningModes.map(([code, label]) => (
                <label key={code} className={restaurantForm.diningModes.includes(code) ? 'is-on' : ''}>
                  <input type="checkbox" checked={restaurantForm.diningModes.includes(code)} onChange={() => toggleIn('diningModes', code)} />{label}
                </label>
              ))}
            </div>
            {restaurantErrors.diningModes && <small className="rar-error" role="alert">{restaurantErrors.diningModes}</small>}
          </fieldset>
          <fieldset className="rar-cuisine-field">
            <legend>Cuisines and food categories</legend>
            <div className="rar-cuisine-grid">
              {cuisines.map(([code, label]) => (
                <label key={code} className={restaurantForm.cuisines.includes(code) ? 'is-on' : ''}>
                  <input type="checkbox" checked={restaurantForm.cuisines.includes(code)} onChange={() => toggleIn('cuisines', code)} />{label}
                </label>
              ))}
            </div>
            {restaurantErrors.cuisines && <small className="rar-error" role="alert">{restaurantErrors.cuisines}</small>}
          </fieldset>
          <footer className="rar-modal-foot">
            <button type="button" className="rar-btn is-light" onClick={() => setRestaurantForm(null)}>Cancel</button>
            <button type="button" className="rar-btn" onClick={saveRestaurant} disabled={saving}>{saving ? 'Saving…' : 'Save restaurant'}</button>
          </footer>
        </ModalShell>
      )}
    </div>
  );
}
