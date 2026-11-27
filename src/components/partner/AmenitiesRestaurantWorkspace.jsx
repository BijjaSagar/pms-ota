import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  AMENITY_CATEGORIES,
  createEmptyAmenitiesInfo,
} from '../../lib/data/partner.js';
import {
  AMENITY_CATEGORY_ORDER,
  CUISINE_OPTIONS,
  DINING_MODE_OPTIONS,
  makeRestaurant,
  ROOM_AMENITY_VIEWS,
} from '../../lib/data/amenitiesRestaurant.js';
import { amenitiesFromApi, loadMasters, saveAmenities } from '../../lib/api/properties.js';

const restaurantKey = (propertyId) => `triponx.partner.restaurants.${propertyId}`;
const roomAnswersKey = (propertyId) => `triponx.partner.roomAmenities.${propertyId}`;

function readRestaurants(propertyId) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(restaurantKey(propertyId)));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function countYes(answers = {}) {
  return Object.values(answers).filter((value) => value === 'yes').length;
}

function countAnswered(answers = {}) {
  return Object.values(answers).filter((value) => value === 'yes' || value === 'no').length;
}

function validateCategoryAnswers(categories = [], info = {}, keyPrefix = '') {
  const errors = {};
  categories.forEach(({ id, items }) => {
    const categoryAnswers = info[id] ?? {};
    const missing = items
      .filter(({ id: itemId }) => categoryAnswers[itemId] !== 'yes' && categoryAnswers[itemId] !== 'no')
      .map(({ id: itemId }) => itemId);
    if (missing.length) errors[`${keyPrefix}${id}`] = missing;
  });
  return errors;
}

function readRoomAnswers(propertyId) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(roomAnswersKey(propertyId)));
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  } catch {
    return {};
  }
}

function normalizeCategoryLabel(value) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function ModalShell({ title, subtitle, children, onClose, wide }) {
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
  const propertyId = property?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'restaurant' ? 'restaurant' : 'amenities';
  const [answers, setAnswers] = useState(() => createEmptyAmenitiesInfo());
  const [mastersReady, setMastersReady] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [viewFor, setViewFor] = useState('hotel');
  const [roomAnswers, setRoomAnswers] = useState(() => readRoomAnswers(propertyId));
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [restaurants, setRestaurants] = useState(() => readRestaurants(propertyId));
  const [restaurantModal, setRestaurantModal] = useState(null);
  const categoryScrollerRef = useRef(null);
  const categoryRefs = useRef({});

  const orderedCategories = useMemo(() => {
    const ranks = new Map(AMENITY_CATEGORY_ORDER.map((label, index) => [normalizeCategoryLabel(label), index]));
    return [...AMENITY_CATEGORIES].sort((left, right) => {
      const leftRank = ranks.get(normalizeCategoryLabel(left.label));
      const rightRank = ranks.get(normalizeCategoryLabel(right.label));
      if (leftRank === undefined && rightRank === undefined) return 0;
      if (leftRank === undefined) return 1;
      if (rightRank === undefined) return -1;
      return leftRank - rightRank;
    });
  }, [mastersReady]);

  const activeView = ROOM_AMENITY_VIEWS.find(({ id }) => id === viewFor) ?? ROOM_AMENITY_VIEWS[0];
  const activeIsHotel = activeView.kind === 'hotel';
  const activeCategories = activeIsHotel ? orderedCategories : activeView.categories ?? [];
  const activeAnswers = activeIsHotel ? answers : roomAnswers[activeView.id] ?? {};
  const activeErrorPrefix = `${activeView.id}:`;

  useEffect(() => {
    let active = true;
    loadMasters()
      .then(() => {
        if (!active) return;
        setAnswers(amenitiesFromApi(property?.amenities));
        setActiveCategoryId((current) => current || orderedCategories[0]?.id || '');
        setMastersReady(true);
      })
      .catch(() => {
        if (!active) return;
        setAnswers(createEmptyAmenitiesInfo());
        setActiveCategoryId((current) => current || orderedCategories[0]?.id || '');
        setMastersReady(true);
      });
    return () => { active = false; };
  }, [orderedCategories, property?.amenities, propertyId]);

  useEffect(() => {
    setRestaurants(readRestaurants(propertyId));
    setRoomAnswers(readRoomAnswers(propertyId));
  }, [propertyId]);

  useEffect(() => {
    const container = categoryScrollerRef.current;
    const item = categoryRefs.current[activeCategoryId];
    if (!container || !item) return;
    container.scrollTo({
      left: item.offsetLeft - (container.clientWidth - item.clientWidth) / 2,
      behavior: 'smooth',
    });
  }, [activeCategoryId, activeView.id, mastersReady]);

  const persistRestaurants = (next) => {
    setRestaurants(next);
    try {
      sessionStorage.setItem(restaurantKey(propertyId), JSON.stringify(next));
    } catch {
      setNotice({ kind: 'error', text: 'Restaurant changes are saved for this session only.' });
    }
  };

  const persistRoomAnswers = (next) => {
    setRoomAnswers(next);
    try {
      sessionStorage.setItem(roomAnswersKey(propertyId), JSON.stringify(next));
    } catch {
      setNotice({ kind: 'error', text: `${activeView.label} answers are saved for this session only.` });
    }
  };

  const changeView = (nextViewId) => {
    const nextView = ROOM_AMENITY_VIEWS.find(({ id }) => id === nextViewId) ?? ROOM_AMENITY_VIEWS[0];
    setViewFor(nextView.id);
    setActiveCategoryId(nextView.kind === 'hotel' ? orderedCategories[0]?.id ?? '' : nextView.categories[0]?.id ?? '');
    setSearch('');
    setErrors({});
    setNotice(null);
  };

  const changeTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'amenities') params.delete('tab');
    else params.set('tab', next);
    setSearchParams(params, { replace: true });
  };

  const stats = useMemo(() => {
    const total = activeCategories.reduce((sum, category) => sum + category.items.length, 0);
    const answered = activeCategories.reduce((sum, category) => sum + countAnswered(activeAnswers[category.id]), 0);
    const configured = activeCategories.reduce((sum, category) => sum + countYes(activeAnswers[category.id]), 0);
    const missing = total - answered;
    return { total, answered, configured, missing, percentage: total ? Math.round((answered / total) * 100) : 0 };
  }, [activeAnswers, activeCategories]);

  const activeCategory = activeCategories.find((category) => category.id === activeCategoryId) ?? activeCategories[0];

  const activeItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query || !activeCategory) return activeCategory?.items ?? [];
    return activeCategory.items.filter((item) => `${item.id} ${item.label}`.toLowerCase().includes(query));
  }, [activeCategory, search]);

  const selectCategory = (categoryId) => {
    setActiveCategoryId(categoryId);
    setSearch('');
    setNotice(null);
  };

  const scrollCategories = (direction) => {
    categoryScrollerRef.current?.scrollBy({ left: direction * 260, behavior: 'smooth' });
  };

  const onCategoryKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % activeCategories.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + activeCategories.length) % activeCategories.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = activeCategories.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    selectCategory(activeCategories[nextIndex].id);
    categoryRefs.current[activeCategories[nextIndex].id]?.focus();
  };

  const setAmenityValue = (itemId, value) => {
    const shared = activeCategories
      .filter(({ items }) => items.some((item) => item.id === itemId))
      .map(({ id }) => id);
    const applyAnswer = (categoryAnswers) => ({
      ...categoryAnswers,
      ...Object.fromEntries(shared.map((id) => [id, { ...(categoryAnswers[id] ?? {}), [itemId]: value }])),
    });
    if (activeIsHotel) setAnswers(applyAnswer);
    else persistRoomAnswers({ ...roomAnswers, [activeView.id]: applyAnswer(activeAnswers) });
    setErrors((current) => Object.fromEntries(
      Object.entries(current)
        .map(([key, missing]) => [
          key,
          key.startsWith(activeErrorPrefix) && shared.includes(key.slice(activeErrorPrefix.length))
            ? missing.filter((missingId) => missingId !== itemId)
            : missing,
        ])
        .filter(([, missing]) => missing.length),
    ));
    setNotice(null);
  };

  const saveAmenityAnswers = async () => {
    const nextErrors = validateCategoryAnswers(activeCategories, activeAnswers, activeErrorPrefix);
    setErrors(nextErrors);
    const firstCategory = activeCategories.find((category) => nextErrors[`${activeErrorPrefix}${category.id}`]?.length);
    if (firstCategory) {
      setActiveCategoryId(firstCategory.id);
      setNotice({ kind: 'error', text: `Answer every amenity in ${firstCategory.label} before saving.` });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      if (activeIsHotel) {
        await saveAmenities(propertyId, answers);
        setNotice({ kind: 'success', text: 'Amenities saved successfully.' });
      } else {
        persistRoomAnswers({ ...roomAnswers, [activeView.id]: activeAnswers });
        setNotice({ kind: 'success', text: `${activeView.label} amenities saved for this session.` });
      }
    } catch (error) {
      setNotice({ kind: 'error', text: error?.message || 'We could not save amenities. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const openRestaurantModal = (restaurant) => {
    setRestaurantModal(restaurant ? { ...restaurant, cuisines: [...restaurant.cuisines] } : makeRestaurant());
  };

  const setRestaurantValue = (field, value) => {
    setRestaurantModal((current) => ({ ...current, [field]: value }));
  };

  const toggleCuisine = (cuisine) => {
    setRestaurantModal((current) => ({
      ...current,
      cuisines: current.cuisines.includes(cuisine)
        ? current.cuisines.filter((item) => item !== cuisine)
        : [...current.cuisines, cuisine],
    }));
  };

  const saveRestaurant = () => {
    if (!restaurantModal?.name?.trim()) {
      setNotice({ kind: 'error', text: 'Enter a restaurant name before saving.' });
      return;
    }
    const next = restaurantModal.id && restaurants.some((item) => item.id === restaurantModal.id)
      ? restaurants.map((item) => (item.id === restaurantModal.id ? restaurantModal : item))
      : [...restaurants, { ...restaurantModal, id: `restaurant-${Date.now()}` }];
    persistRestaurants(next);
    setRestaurantModal(null);
    setNotice({ kind: 'success', text: `${restaurantModal.name.trim()} saved.` });
  };

  const removeRestaurant = (restaurant) => {
    if (!window.confirm(`Remove ${restaurant.name}?`)) return;
    persistRestaurants(restaurants.filter((item) => item.id !== restaurant.id));
    setNotice({ kind: 'success', text: `${restaurant.name} removed.` });
  };

  return (
    <div className="rar-root">
      <header className="rar-header">
        <div className="rar-heading">
          <span className="rar-heading-icon"><Sparkles size={20} aria-hidden="true" /></span>
          <div className="rar-heading-text">
            <h2>AMENITIES &amp; SERVICES</h2>
            <p>Tell guests what your property offers. Answer Yes or No for every item.</p>
          </div>
        </div>
        <div className="rar-header-right">
          <nav className="rar-tabs" aria-label="Amenities and restaurant sections">
            <button type="button" className={tab === 'amenities' ? 'is-on' : ''} onClick={() => changeTab('amenities')}><Sparkles size={14} aria-hidden="true" /> Amenities</button>
            <button type="button" className={tab === 'restaurant' ? 'is-on' : ''} onClick={() => changeTab('restaurant')}><UtensilsCrossed size={14} aria-hidden="true" /> Restaurant</button>
          </nav>
        </div>
      </header>

      {notice && tab === 'restaurant' && <div className={`rar-notice ${notice.kind}`} role="status">{notice.text}</div>}

      {tab === 'amenities' ? (
        <div className="rar-amenities-layout">
          <div className="rar-amenity-toolbar">
            <div className="rar-category-list" ref={categoryScrollerRef} role="tablist" aria-label="Amenity categories">
              {activeCategories.map((category, index) => {
                const selected = activeCategoryId === category.id;
                return (
                  <button
                    type="button"
                    key={category.id}
                    ref={(node) => { categoryRefs.current[category.id] = node; }}
                    role="tab"
                    aria-selected={selected}
                    tabIndex={selected ? 0 : -1}
                    className={`rar-category ${selected ? 'is-on' : ''}`}
                    onClick={() => selectCategory(category.id)}
                    onKeyDown={(event) => onCategoryKeyDown(event, index)}
                  >
                    <span className="rar-category-name">{category.label}</span>
                    <span className="rar-category-count">{countYes(activeAnswers[category.id])}/{category.items.length}</span>
                  </button>
                );
              })}
            </div>
            <div className="rar-toolbar-row">
              <div className="rar-filter-block">
                <label htmlFor="rar-view-for">View amenities for</label>
                <select id="rar-view-for" value={viewFor} onChange={(event) => changeView(event.target.value)}>
                  {ROOM_AMENITY_VIEWS.map((view) => <option key={view.id} value={view.id}>{view.label}</option>)}
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

          {notice && <div className={`rar-notice ${notice.kind}`} role="status">{notice.text}</div>}

          <section className="rar-amenity-workspace" role="tabpanel" aria-label={activeCategory?.label}>
            <header className="rar-workspace-head">
              <div>
                <h3>{activeCategory?.label ?? 'Amenities'}</h3>
                <p>{countAnswered(activeAnswers[activeCategory?.id]) || 0} of {activeCategory?.items.length ?? 0} answered</p>
              </div>
            </header>

            {errors[`${activeErrorPrefix}${activeCategory?.id}`]?.length ? (
              <div className="rar-inline-warning"><AlertTriangle size={15} aria-hidden="true" /> {errors[`${activeErrorPrefix}${activeCategory?.id}`].length} mandatory amenity answer{errors[`${activeErrorPrefix}${activeCategory?.id}`].length > 1 ? 's' : ''} missing in this category.</div>
            ) : null}

            {activeItems.length ? (
              <div className="rar-amenity-grid">
                {activeItems.map((item) => {
                  const value = activeAnswers[activeCategory?.id]?.[item.id] ?? '';
                  const invalid = errors[`${activeErrorPrefix}${activeCategory?.id}`]?.includes(item.id);
                  return (
                    <article className={`rar-amenity-card ${value === 'yes' ? 'is-enabled' : ''} ${invalid ? 'has-error' : ''}`} key={item.id}>
                      <div className="rar-amenity-card-head">
                        <div>
                          <h5>{item.label}</h5>
                          <span>{item.id}</span>
                        </div>
                        <div className="rar-segments" role="group" aria-label={`${item.label} availability`}>
                          {[['yes', 'Yes'], ['no', 'No']].map(([option, label]) => (
                            <button type="button" key={option} className={value === option ? 'is-on' : ''} onClick={() => setAmenityValue(item.id, option)}>{label}</button>
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
              <span><CheckCircle2 size={15} aria-hidden="true" /> {stats.answered} of {stats.total} amenities answered</span>
              <button type="button" className="rar-btn" onClick={saveAmenityAnswers} disabled={saving || (activeIsHotel && !mastersReady)}>{saving ? 'Saving…' : activeIsHotel ? 'Save amenities' : 'Save room amenities'}</button>
            </footer>
          </section>
        </div>
      ) : (
        <section className="rar-restaurant-workspace">
          <header className="rar-restaurant-head">
            <div>
              <h3>Restaurant details</h3>
              <p>Add dining options so guests can discover food services at your property.</p>
            </div>
            <button type="button" className="rar-btn" onClick={() => openRestaurantModal(null)}><Plus size={15} aria-hidden="true" /> Add restaurant</button>
          </header>

          {restaurants.length ? (
            <div className="rar-restaurant-grid">
              {restaurants.map((restaurant) => (
                <article className="rar-restaurant-card" key={restaurant.id}>
                  <div className="rar-restaurant-media">
                    {restaurant.imageUrl ? <img src={restaurant.imageUrl} alt="" /> : <Camera size={24} aria-hidden="true" />}
                  </div>
                  <div className="rar-restaurant-copy">
                    <span className="rar-restaurant-mode">{restaurant.diningMode}</span>
                    <h4>{restaurant.name}</h4>
                    <p>{restaurant.description || 'No description added yet.'}</p>
                    <div className="rar-chip-list">
                      {restaurant.cuisines.map((cuisine) => <span key={cuisine}>{cuisine}</span>)}
                      {!restaurant.cuisines.length && <span className="is-empty">No cuisines selected</span>}
                    </div>
                    <div className="rar-restaurant-meta"><Clock size={13} aria-hidden="true" /> {restaurant.hours || 'Timings not added'}</div>
                  </div>
                  <div className="rar-restaurant-actions">
                    <button type="button" onClick={() => openRestaurantModal(restaurant)}>Edit</button>
                    <button type="button" onClick={() => removeRestaurant(restaurant)} aria-label={`Remove ${restaurant.name}`}><Trash2 size={14} aria-hidden="true" /></button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rar-empty is-large"><UtensilsCrossed size={28} aria-hidden="true" /><h4>No restaurants added yet</h4><p>Add your first restaurant to show dining options on your listing.</p><button type="button" className="rar-btn" onClick={() => openRestaurantModal(null)}><Plus size={15} aria-hidden="true" /> Add restaurant</button></div>
          )}
        </section>
      )}

      {restaurantModal && (
        <ModalShell
          title={restaurants.some((item) => item.id === restaurantModal.id) ? 'Edit Restaurant' : 'Add Restaurant'}
          subtitle="Restaurant details are saved locally for this property."
          onClose={() => setRestaurantModal(null)}
          wide
        >
          <div className="rar-form-grid">
            <label className="rar-field is-full"><span>Restaurant name</span><input value={restaurantModal.name} maxLength={100} onChange={(event) => setRestaurantValue('name', event.target.value)} placeholder="e.g. The Garden Café" /></label>
            <label className="rar-field is-full"><span>Description</span><textarea rows="3" value={restaurantModal.description} onChange={(event) => setRestaurantValue('description', event.target.value)} placeholder="Short description of the dining experience" /></label>
            <label className="rar-field"><span>Dining mode</span><select value={restaurantModal.diningMode} onChange={(event) => setRestaurantValue('diningMode', event.target.value)}>{DINING_MODE_OPTIONS.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</select></label>
            <label className="rar-field"><span>Opening hours</span><input value={restaurantModal.hours} onChange={(event) => setRestaurantValue('hours', event.target.value)} placeholder="e.g. 7:00 AM to 10:30 PM" /></label>
            <label className="rar-field is-full"><span>Image URL</span><input value={restaurantModal.imageUrl} onChange={(event) => setRestaurantValue('imageUrl', event.target.value)} placeholder="https://example.com/restaurant.jpg" /></label>
          </div>
          <fieldset className="rar-cuisine-field">
            <legend>Cuisines and food categories</legend>
            <div className="rar-cuisine-grid">
              {CUISINE_OPTIONS.map((cuisine) => (
                <label key={cuisine} className={restaurantModal.cuisines.includes(cuisine) ? 'is-on' : ''}>
                  <input type="checkbox" checked={restaurantModal.cuisines.includes(cuisine)} onChange={() => toggleCuisine(cuisine)} />
                  {cuisine}
                </label>
              ))}
            </div>
          </fieldset>
          <footer className="rar-modal-foot">
            <button type="button" className="rar-btn is-light" onClick={() => setRestaurantModal(null)}>Cancel</button>
            <button type="button" className="rar-btn" onClick={saveRestaurant}>Save restaurant</button>
          </footer>
        </ModalShell>
      )}
    </div>
  );
}
