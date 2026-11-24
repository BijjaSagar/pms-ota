import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BedDouble, Building2, CheckCircle2, ChevronDown, ClipboardList, Image as ImageIcon, Info, LocateFixed, Lock, MapPin, Pencil, Plus, Sparkles, Star, Trash2, Video, X } from 'lucide-react';
import { TextField } from '../Layout.jsx';
import { PortalModal } from '../profile/PortalModal.jsx';
import { OtpInput, emptyOtp } from '../auth/OtpInput.jsx';
import { IN_PROGRESS_TAB, PARTNER_PATHS, propertiesTab } from './paths.js';
import { PrivateImage } from './PrivateImage.jsx';
import { PropertyLegalForm } from './PropertyLegalForm.jsx';
import { useAuth } from '../../lib/context/useAuth.js';
import {
  AMENITY_CATEGORIES, BED_TYPE_OPTIONS, CANCELLATION_OPTIONS, EMPTY_ROOMS_INFO, TEXT_MAX, EXTRA_BED_TYPE_OPTIONS,
  IDENTITY_PROOF_OPTIONS, MEAL_OPTIONS, PHOTO_TAG_OPTIONS, POLICY_CATEGORIES, POLICY_CONDITIONAL_FIELDS,
  POLICY_TIME_OPTIONS, POLICY_YES_NO_OPTIONS, PROPERTY_INFO_SECTIONS, PROPERTY_RATINGS, ROOM_AMENITY_ITEMS,
  ROOM_CATEGORIES, ROOM_SIZE_UNITS, ROOM_TYPE_OPTIONS, ROOM_VIEW_OPTIONS, validateAmenitiesInfo, validateBasicInfo,
  validateLocationInfo, validatePhotosInfo, validatePoliciesInfo, validateRoomsInfo, MOBILE_LENGTH, PROPERTY_NAME_MAX,
  mobileError, sanitizeMobile,
} from '../../lib/data/partner.js';
import {
  IMAGE_ACCEPT, IMAGE_MAX_BYTES, IMAGE_TYPES, VIDEO_ACCEPT, VIDEO_MAX_BYTES, amenitiesFromApi, basicFromApi, deleteMedia,
  deleteRoom, formErrors, locationFromApi, photosFromApi, policiesFromApi, requestContactOtp, roomFromApi, sameEmail,
  sameMobile, saveAmenities, saveBasic, saveLocation, savePolicies, saveRoom, setCover, setImageTag as saveImageTag,
  uploadImage, uploadVideo, usePrivateUrl, verifyContactOtp,
} from '../../lib/api/properties.js';
import { isValidEmail } from '../../lib/utils/validation.js';
import { OTP_LENGTH, todayOtp } from '../../lib/utils/otp.js';
import { LocationMap } from './LocationMap.jsx';
import { ERROR_FIELD, revealFirstError as revealError } from '../../lib/utils/revealError.js';
import { addressToLocationFields, buildAddressQuery, forwardGeocodeAddressInfo, getCurrentCoordinates, GPS_GOOD_ACCURACY_METERS, isAddressMapReady, reverseGeocode } from '../../lib/utils/location.js';
import '../../styles/auth.css';
import '../../styles/partner.css';

const RESEND_SECONDS = 60;
// Names used in messages from the API ("Email must be verified first.").
const FIELD_LABELS = {
  propertyName: 'Property name', rating: 'Rating', builtYear: 'Built year', bookingSince: 'Booking year',
  channelManager: 'Channel manager', providerName: 'Provider name', email: 'Email', mobile: 'Mobile number', landline: 'Landline',
  apartmentName: 'Building name', area: 'Area', pincode: 'Pincode', country: 'Country', state: 'State', city: 'City',
  addressConfirmed: 'Address', roomType: 'Room type', roomView: 'Room view', roomSize: 'Room size', roomSizeUnit: 'Size unit',
  roomName: 'Room name', roomCount: 'Number of rooms', bedType: 'Bed type', maxGuests: 'Max guests',
  bathroomCount: 'Number of bathrooms', mealOption: 'Meal option', pricePerGuest: 'Price', checkInTime: 'Check-in time',
  checkOutTime: 'Check-out time', cancellationPolicy: 'Cancellation policy', identityProofs: 'Identity proof',
  infantFoodItems: 'Food items', adultExtraBedType: 'Extra bed type', breakfastPrice: 'Breakfast price',
  lunchPrice: 'Lunch price', dinnerPrice: 'Dinner price', coverImage: 'Cover image',
};

// The "place" a pin belongs to. Building name and locality are left out on purpose (see pinFixedForRef).
const placeKey = (info) => ['pincode', 'city', 'state', 'country']
  .map((key) => String(info?.[key] ?? '').trim().toLowerCase()).join('|');

// Metres between two points (haversine) — decides whether a typed building name still applies after a drag.
function distanceMeters(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}
const SAME_BUILDING_METERS = 120;
// Last Rooms tab ("Amenities for room"): the only step that shows "Save rooms"; every tab before it shows Next.
// (Was length - 2, which put Save on "Meal plan, rate & inventory" and made it validate the unopened amenities tab.)
const ROOM_LAST_INPUT_INDEX = ROOM_CATEGORIES.length - 1;

// Phones show the options as a bottom sheet; wider screens as a dropdown under (or above) the field.
const SHEET_QUERY = '(max-width: 720px)';
const MENU_MAX_HEIGHT = 280;
const STICKY_BAR_SPACE = 96; // sticky Save / Back bar at the bottom of the form

function ResponsiveSelectField({ label, value, onChange, options, error }) {
  const [open, setOpen] = useState(false);
  // { sheet: bottom sheet (phones), up: open above the field, maxHeight: px that fit on screen }
  const [placement, setPlacement] = useState({ sheet: false, up: false, maxHeight: MENU_MAX_HEIGHT });
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find(([optionValue]) => optionValue === value);
  const selectedLabel = selected?.[1] ?? 'Select';

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const toggle = () => {
    if (open) { close(); return; }
    const sheet = window.matchMedia(SHEET_QUERY).matches;
    let up = false;
    let maxHeight = MENU_MAX_HEIGHT;
    if (!sheet && triggerRef.current) {
      // Open where there is room: below unless the space under the field (minus the sticky bar) is too small.
      const rect = triggerRef.current.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - STICKY_BAR_SPACE;
      const headerBottom = document.querySelector('.ps-header')?.getBoundingClientRect().bottom ?? 0; // sticky top bar + module row
      const above = rect.top - headerBottom - 12;
      const wanted = Math.min(MENU_MAX_HEIGHT, options.length * 45);
      up = below < wanted && above > below;
      maxHeight = Math.max(140, Math.min(MENU_MAX_HEIGHT, up ? above : below));
    }
    setPlacement({ sheet, up, maxHeight });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    // Field scrolled / resized away from where the dropdown was placed -> close it rather than leave it floating.
    const closeOnResize = () => setOpen(false);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnResize);
    // Bottom sheet: keep the page behind it from scrolling.
    const prevOverflow = document.body.style.overflow;
    if (placement.sheet) document.body.style.overflow = 'hidden';
    // Bring the selected option into view.
    menuRef.current?.querySelector('.is-selected')?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnResize);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, placement.sheet]);

  const choose = (nextValue) => {
    onChange({ target: { value: nextValue } });
    close(true);
  };

  const menu = open && (
    <>
      <button type="button" className="pi-responsive-select-backdrop" aria-label="Close dropdown" onClick={() => close(true)} />
      <div
        ref={menuRef}
        className={`pi-responsive-select-menu ${placement.up ? 'is-up' : ''}`}
        role="listbox"
        aria-label={label}
        style={placement.sheet ? undefined : { '--pi-menu-max': `${placement.maxHeight}px` }}
      >
        <div className="pi-responsive-select-mobile-head">
          <span className="pi-sheet-handle" aria-hidden="true" />
          <strong>{label}</strong>
          <button type="button" className="pi-sheet-close" onClick={() => close(true)} aria-label="Close dropdown"><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="pi-responsive-select-options">
          {/* The '' placeholder ("Select …") already shows on the field itself, so it isn't offered as a choice */}
          {options.filter(([optionValue]) => optionValue !== '').map(([optionValue, optionLabel]) => (
            <button
              type="button"
              key={optionValue}
              role="option"
              aria-selected={optionValue === value}
              className={optionValue === value ? 'is-selected' : ''}
              onClick={() => choose(optionValue)}
            >
              <span>{optionLabel}</span>
              {optionValue === value && <CheckCircle2 size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div ref={rootRef} className={`pi-responsive-select form-field ${error ? 'has-error' : ''}`}>
      <span className="pi-label">{label}</span>
      <div className="pi-responsive-select-anchor">
        <button
          ref={triggerRef}
          type="button"
          className="pi-responsive-select-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggle}
        >
          <span>{selectedLabel}</span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>
        {/* Bottom sheet goes to <body>: no ancestor (transform, filter, containment) can trap position: fixed */}
        {open && (placement.sheet ? createPortal(menu, document.body) : menu)}
      </div>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}

function isAmenityCategoryComplete(category, info) {
  return category.items.every((item) => {
    const value = info?.[category.id]?.[item.id];
    return value === 'yes' || value === 'no';
  });
}

function getInitialAmenityCategoryState(info) {
  const firstIncompleteIndex = AMENITY_CATEGORIES.findIndex((category) => !isAmenityCategoryComplete(category, info));
  const index = firstIncompleteIndex === -1 ? AMENITY_CATEGORIES.length - 1 : firstIncompleteIndex;
  return {
    activeCategoryId: AMENITY_CATEGORIES[index]?.id ?? AMENITY_CATEGORIES[0].id,
    unlockedIndex: index,
  };
}

function getInitialRoomCategoryState(info) {
  const errors = validateRoomsInfo(info);
  const firstIncompleteIndex = ROOM_CATEGORIES.findIndex((category) => category.fields.some((field) => Boolean(errors[field])));
  const rawIndex = firstIncompleteIndex === -1 ? ROOM_LAST_INPUT_INDEX : firstIncompleteIndex;
  const index = Math.min(rawIndex, ROOM_LAST_INPUT_INDEX);
  return {
    activeCategoryId: ROOM_CATEGORIES[index]?.id ?? ROOM_CATEGORIES[0].id,
    unlockedIndex: index,
  };
}

function OtpModal({ field, value, resendAfter, initialError, onClose, onResend, onVerify }) {
  const [code, setCode] = useState(emptyOtp);
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(resendAfter);
  const [otpKey, setOtpKey] = useState(0);
  const label = field === 'email' ? 'email address' : 'mobile number';

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    const entered = code.join('');
    if (entered.length !== OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    setBusy(true);
    try {
      await onVerify(entered); // closes this popup
    } catch (problem) {
      setError(problem.message);
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const sent = await onResend();
      setCode(emptyOtp());
      setResendIn(sent.resendAfterSeconds ?? RESEND_SECONDS);
      setOtpKey((key) => key + 1);
    } catch (problem) {
      setError(problem.message);
      if (problem.retryAfterSeconds) setResendIn(problem.retryAfterSeconds);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PortalModal title={`Verify ${label}`} onClose={onClose}>
      <span className="auth pi-otp-auth-marker" aria-hidden="true" />
      <div className="pi-otp">
        <p className="pi-otp-text">Enter the {OTP_LENGTH}-digit code sent to <strong>{value}</strong>.</p>
        {import.meta.env.DEV && <p className="pi-otp-demo">Development code: <strong>{todayOtp()}</strong></p>}
        <form onSubmit={submit} noValidate>
          <OtpInput key={otpKey} value={code} onChange={(next) => { setCode(next); setError(''); }} invalid={Boolean(error)} />
          {error && <p className="field-error pi-otp-error" role="alert">{error}</p>}
          <div className="pi-otp-actions">
            <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Please wait…' : 'Verify'}</button>
          </div>
          <div className="pi-otp-resend">
            {resendIn > 0
              ? <span className="muted-xs">Resend code in {resendIn}s</span>
              : <button type="button" className="pi-otp-link" onClick={resend} disabled={busy}>Resend code</button>}
          </div>
        </form>
      </div>
    </PortalModal>
  );
}

function VerifiedField({ field, label, value, onChange, error, verified, onVerify, ...props }) {
  const id = `pi-verify-${field}`;
  const errorId = `${id}-error`;
  return (
    <div className={`form-field pi-verify-field ${error ? 'has-error' : ''}`}>
      <label className="pi-verify-label" htmlFor={id}>{label}</label>
      <div className="pi-verify-input">
        <input
          id={id}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        <button type="button" className={`btn btn-mini pi-verify-btn ${verified ? 'is-done' : ''}`} onClick={onVerify} disabled={verified}>
          {verified && <CheckCircle2 size={14} aria-hidden="true" />}
          {verified ? 'Verified' : 'Verify'}
        </button>
      </div>
      {error && <span id={errorId} className="field-error" role="alert">{error}</span>}
    </div>
  );
}

function PolicyYesNo({ name, legend, value, onChange, error, compact = false }) {
  const errorId = `${name}-error`;
  return (
    <fieldset className={`pi-field pi-policy-yesno ${compact ? 'is-compact' : ''} ${error ? 'has-error' : ''}`} aria-describedby={error ? errorId : undefined}>
      <legend className="pi-label">{legend}</legend>
      <div className="pi-segments pi-policy-segments">
        {POLICY_YES_NO_OPTIONS.map(([option, label]) => (
          <label key={option} className={`pi-segment ${value === option ? 'is-on' : ''}`}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
      {error && <span id={errorId} className="field-error" role="alert">{error}</span>}
    </fieldset>
  );
}

function PolicyRadioList({ name, options, value, onChange, error }) {
  const errorId = `${name}-error`;
  return (
    <fieldset className={`pi-field pi-policy-radio-field ${error ? 'has-error' : ''}`} aria-describedby={error ? errorId : undefined}>
      <legend className="sr-only">Cancellation policy</legend>
      <div className={`pi-policy-radio-list ${error ? 'has-error' : ''}`}>
        {options.map(([option, label]) => (
          <label key={option} className={`pi-policy-radio ${value === option ? 'is-on' : ''}`}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span className="pi-policy-radio-dot" aria-hidden="true" />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {error && <span id={errorId} className="field-error" role="alert">{error}</span>}
    </fieldset>
  );
}

function ProgressRail({ basicComplete, locationComplete, amenitiesComplete, roomsComplete, photosComplete, policiesComplete, legalComplete, activeSection, onSelect }) {
  const completed = Number(basicComplete)
    + Number(basicComplete && locationComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete && roomsComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete && legalComplete);
  const total = PROPERTY_INFO_SECTIONS.length;
  const stepsRef = useRef(null);

  // Phones: the step list scrolls sideways -> keep the current step in view. Only the list scrolls
  // (scrollIntoView would also move the page). No-op when the list isn't scrollable (tablet/desktop column).
  useEffect(() => {
    const list = stepsRef.current;
    const current = list?.querySelector('.pi-step.is-current');
    if (!list || !current || list.scrollWidth <= list.clientWidth) return;
    const l = list.getBoundingClientRect();
    const c = current.getBoundingClientRect();
    list.scrollTo({ left: list.scrollLeft + (c.left - l.left) - (l.width - c.width) / 2, behavior: 'smooth' });
  }, [activeSection]);

  return (
    <aside className="pi-rail" aria-label="Property information progress">
      <div className="pi-rail-head">
        <span className="pi-rail-eyebrow">Listing setup</span>
        <h2 className="pi-rail-title">Property information</h2>
        <div className="pi-progress" role="progressbar" aria-label="Sections completed" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={total}>
          <span style={{ width: `${(completed / total) * 100}%` }} />
        </div>
        <p className="pi-progress-label">{completed} of {total} sections complete</p>
      </div>
      <ol className="pi-steps" ref={stepsRef}>
        {PROPERTY_INFO_SECTIONS.map((section, index) => {
          const isBasic = section.id === 'basic';
          const isLocation = section.id === 'location';
          const isAmenities = section.id === 'amenities';
          const isRooms = section.id === 'rooms';
          const isPhotos = section.id === 'photos';
          const isPolicies = section.id === 'policies';
          const isLegal = section.id === 'legal';
          const done = (isBasic && basicComplete)
            || (isLocation && basicComplete && locationComplete)
            || (isAmenities && basicComplete && locationComplete && amenitiesComplete)
            || (isRooms && basicComplete && locationComplete && amenitiesComplete && roomsComplete)
            || (isPhotos && basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete)
            || (isPolicies && basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete)
            || (isLegal && basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete && legalComplete);
          const locked = !isBasic
            && !(isLocation && basicComplete)
            && !(isAmenities && basicComplete && locationComplete)
            && !(isRooms && basicComplete && locationComplete && amenitiesComplete)
            && !(isPhotos && basicComplete && locationComplete && amenitiesComplete && roomsComplete)
            && !(isPolicies && basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete)
            && !(isLegal && basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete);
          const active = section.id === activeSection;
          const stateClass = done ? 'is-done' : locked ? 'is-locked' : 'is-unlocked';

          return (
            <li key={section.id} className={`pi-step ${stateClass} ${active ? 'is-current' : ''}`} aria-current={active ? 'step' : undefined}>
              <button type="button" className="pi-step-btn" aria-disabled={locked || undefined} onClick={() => onSelect(section.id)}>
                <span className="pi-step-dot" aria-hidden="true">
                  {done ? <CheckCircle2 size={16} /> : locked ? <Lock size={14} /> : index + 1}
                </span>
                <span className="pi-step-body">
                  <span className="pi-step-name">{section.label}</span>
                  <span className="pi-step-note">
                    {done ? 'Complete' : active && !locked ? 'In progress' : !locked && (isLocation || isAmenities || isRooms || isPhotos || isPolicies || isLegal) ? 'Ready to complete' : null}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="pi-card">
      <div className="pi-card-head">
        <span className="pi-card-icon"><Icon size={20} aria-hidden="true" /></span>
        <div>
          <h3 className="pi-card-title">{title}</h3>
          <p className="pi-card-sub">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function VideoPreview({ path, type }) {
  const [wanted, setWanted] = useState(false);
  const { url, failed } = usePrivateUrl(wanted ? path : '');
  if (url) return <video className="pi-video-preview" src={url} controls preload="metadata" />;
  return (
    <button type="button" className="btn btn-light" onClick={() => setWanted(true)} disabled={wanted && !failed} data-type={type}>
      {failed ? 'Could not load' : wanted ? 'Loading…' : 'Preview'}
    </button>
  );
}

export function PropertyInfoPage({ property, onPropertyChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const propertyId = property.id;
  const saved = (section) => property.completedSections.includes(section);
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const autoGeocodeRequestRef = useRef(0);
  const currentLocationRequestRef = useRef(0);
  const lastAutoGeocodedQueryRef = useRef('');
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [info, setInfo] = useState(() => basicFromApi(property.basic, user));
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [basicComplete, setBasicComplete] = useState(saved('basic'));
  // Continue at the first unfinished step.
  const [activeSection, setActiveSection] = useState(() => PROPERTY_INFO_SECTIONS.find(({ id }) => !saved(id))?.id ?? 'legal');
  const [otp, setOtp] = useState(null); // { field, value, resendAfter, error }
  const otpBusyRef = useRef(false);
  // Pin placed by hand (drag / tap / GPS / saved draft): remember which place (pincode, city, state, country) it
  // belongs to. While those stay the same, edits to the other fields (building name, locality) never move the pin
  // back to the address's rough geocode point. Changing the place itself re-places the pin.
  const pinFixedForRef = useRef(null);
  const [locationInfo, setLocationInfo] = useState(() => {
    const initial = locationFromApi(property.location);
    if (initial.latitude && initial.longitude) pinFixedForRef.current = placeKey(initial); // saved pin is trusted
    return initial;
  });
  const [pinAddress, setPinAddress] = useState(''); // full address of the pin, shown under the map
  const [locationErrors, setLocationErrors] = useState({});
  const [locationComplete, setLocationComplete] = useState(saved('location'));
  const [mapError, setMapError] = useState('');
  const [locating, setLocating] = useState(false);
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const [pinLookup, setPinLookup] = useState(false); // pin moved -> looking up its address
  const pinLookupRequestRef = useRef(0);
  const [amenitiesInfo, setAmenitiesInfo] = useState(() => amenitiesFromApi(property.amenities));
  const initialAmenityCategory = getInitialAmenityCategoryState(amenitiesInfo);
  const [activeCategoryId, setActiveCategoryId] = useState(initialAmenityCategory.activeCategoryId);
  const [amenityUnlockedIndex, setAmenityUnlockedIndex] = useState(initialAmenityCategory.unlockedIndex);
  const [amenitiesErrors, setAmenitiesErrors] = useState({});
  const [amenitiesComplete, setAmenitiesComplete] = useState(saved('amenities'));

  const activeCategoryIndex = AMENITY_CATEGORIES.findIndex((category) => category.id === activeCategoryId);
  const activeCategory = AMENITY_CATEGORIES[activeCategoryIndex] ?? AMENITY_CATEGORIES[0];
  const isLastCategory = activeCategoryIndex === AMENITY_CATEGORIES.length - 1;
  const countAmenityAnswers = (category) => category.items.filter(
    (item) => amenitiesInfo[category.id]?.[item.id] === 'yes' || amenitiesInfo[category.id]?.[item.id] === 'no',
  ).length;
  // Rooms: a list of saved room types; `editingRoom` is null (the list), 'new', or the id being changed.
  const rooms = property.rooms;
  const [editingRoom, setEditingRoom] = useState(() => (rooms.length ? null : 'new'));
  const [roomsInfo, setRoomsInfo] = useState(() => ({ ...EMPTY_ROOMS_INFO }));
  const [activeRoomCategoryId, setActiveRoomCategoryId] = useState(ROOM_CATEGORIES[0].id);
  const [roomUnlockedIndex, setRoomUnlockedIndex] = useState(0);
  const [roomErrors, setRoomErrors] = useState({});
  const roomsComplete = rooms.length > 0;

  const openRoom = (room) => {
    const next = room ? roomFromApi(room) : { ...EMPTY_ROOMS_INFO, amenities: {} };
    const start = room ? { activeCategoryId: ROOM_CATEGORIES[0].id, unlockedIndex: ROOM_LAST_INPUT_INDEX } : getInitialRoomCategoryState(next);
    setRoomsInfo(next);
    setActiveRoomCategoryId(start.activeCategoryId);
    setRoomUnlockedIndex(start.unlockedIndex);
    setRoomErrors({});
    setEditingRoom(room ? room.id : 'new');
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeRoomCategoryIndex = ROOM_CATEGORIES.findIndex((category) => category.id === activeRoomCategoryId);
  const activeRoomCategory = ROOM_CATEGORIES[activeRoomCategoryIndex] ?? ROOM_CATEGORIES[0];
  const isRoomSaveStep = activeRoomCategoryIndex >= ROOM_LAST_INPUT_INDEX;
  const countRoomFieldsDone = (category) => category.fields.filter((field) => {
    if (field === 'amenities') {
      return ROOM_AMENITY_ITEMS.every((item) => ['yes', 'no'].includes(roomsInfo.amenities?.[item.id]));
    }
    return String(roomsInfo[field] ?? '').trim().length > 0;
  }).length;
  const photosInfo = useMemo(() => photosFromApi(property.photos), [property.photos]);
  const [photoErrors, setPhotoErrors] = useState({});
  const photosComplete = saved('photos'); // photos are saved as they are added
  const legalComplete = saved('legal');
  const [coverBusy, setCoverBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [policiesInfo, setPoliciesInfo] = useState(() => policiesFromApi(property.policies));
  const [activePolicyCategoryId, setActivePolicyCategoryId] = useState(POLICY_CATEGORIES[0].id);
  const [policyErrors, setPolicyErrors] = useState({});
  const [policiesComplete, setPoliciesComplete] = useState(saved('policies'));

  const activePolicyCategoryIndex = POLICY_CATEGORIES.findIndex((category) => category.id === activePolicyCategoryId);
  const activePolicyCategory = POLICY_CATEGORIES[activePolicyCategoryIndex] ?? POLICY_CATEGORIES[0];
  const isLastPolicyCategory = activePolicyCategoryIndex === POLICY_CATEGORIES.length - 1;
  const countPolicyFieldsDone = (category) => category.fields.filter((field) => {
    if (POLICY_CONDITIONAL_FIELDS[field] && !POLICY_CONDITIONAL_FIELDS[field](policiesInfo)) return true;
    if (field === 'identityProofs') {
      return Array.isArray(policiesInfo.identityProofs) && policiesInfo.identityProofs.length > 0;
    }
    return String(policiesInfo[field] ?? '').trim().length > 0;
  }).length;

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return [
      ['', 'Select built year'],
      ...Array.from({ length: current - 1899 }, (_, index) => {
        const year = String(current - index);
        return [year, year];
      }),
    ];
  }, []);
  const bookingYears = useMemo(() => {
    const current = new Date().getFullYear();
    return [
      ['', 'Select booking year'],
      ...Array.from({ length: current - 1899 }, (_, index) => {
        const year = String(current - index);
        return [year, year];
      }),
    ];
  }, []);
  const selectedRating = Number(info.rating);
  const locationCoordinates = useMemo(() => {
    if (!locationInfo.latitude || !locationInfo.longitude) return null;
    const latitude = Number(locationInfo.latitude);
    const longitude = Number(locationInfo.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  }, [locationInfo.latitude, locationInfo.longitude]);
  const addressQuery = useMemo(
    () => buildAddressQuery(locationInfo),
    [locationInfo.apartmentName, locationInfo.area, locationInfo.pincode, locationInfo.city, locationInfo.state, locationInfo.country],
  );
  const addressReady = useMemo(
    () => isAddressMapReady(locationInfo),
    [locationInfo.apartmentName, locationInfo.area, locationInfo.pincode, locationInfo.city, locationInfo.state, locationInfo.country],
  );
  const mapBusy = locating || geocodingAddress || pinLookup;

  useEffect(() => {
    const requestId = ++autoGeocodeRequestRef.current;
    if (activeSection !== 'location' || !addressReady || !addressQuery) {
      setGeocodingAddress(false);
      return undefined;
    }
    const queryKey = addressQuery.toLowerCase();
    if (lastAutoGeocodedQueryRef.current === queryKey) return undefined;
    // Hand-placed pin and the place (pincode/city/state/country) unchanged: building / locality edits keep the pin.
    if (pinFixedForRef.current !== null && pinFixedForRef.current === placeKey(locationInfo)) return undefined;
    const timer = setTimeout(async () => {
      setGeocodingAddress(true);
      setMapError('');
      try {
        const coordinates = await forwardGeocodeAddressInfo(locationInfo);
        if (requestId !== autoGeocodeRequestRef.current) return;
        lastAutoGeocodedQueryRef.current = queryKey;
        pinFixedForRef.current = null; // pin now follows the typed address
        setPinAddress('');
        setLocationInfo((current) => ({
          ...current,
          latitude: String(coordinates.latitude),
          longitude: String(coordinates.longitude),
        }));
      } catch (error) {
        if (requestId !== autoGeocodeRequestRef.current) return;
        setMapError(error instanceof Error ? error.message : 'We could not place this address on the map. Please try again.');
      } finally {
        if (requestId === autoGeocodeRequestRef.current) setGeocodingAddress(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [activeSection, addressQuery, addressReady]);

  useEffect(() => () => {
    currentLocationRequestRef.current += 1;
  }, []);

  const setValue = (key, value) => {
    setInfo((current) => ({
      ...current,
      [key]: value,
      // Verified while it is the address / number last proven with a code.
      ...(key === 'email' ? { emailVerified: sameEmail(value, property.basic.verifiedEmail) } : {}),
      ...(key === 'mobile' ? { mobileVerified: sameMobile(value, property.basic.verifiedMobile) } : {}),
    }));
    setErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
    setBasicComplete(false);
    setNotice(null);
  };
  const set = (key) => (event) => setValue(key, event.target.value);

  // Mobile never holds more than 10 characters. A pasted "+91 98765 43210" keeps its 10 digits
  // (a plain maxLength would cut it to "+91 98765 ").
  const onMobileChange = (event) => {
    const raw = event.target.value;
    if (raw.length <= MOBILE_LENGTH) { setValue('mobile', raw); return; }
    const pastedNumber = sanitizeMobile(raw);
    const looksLikeFullNumber = /^\+?[\d\s()-]+$/.test(raw) && raw.replace(/\D/g, '').length > MOBILE_LENGTH;
    setValue('mobile', looksLikeFullNumber && pastedNumber.length === MOBILE_LENGTH && raw.replace(/\D/g, '').length <= MOBILE_LENGTH + 3
      ? pastedNumber
      : raw.slice(0, MOBILE_LENGTH));
  };

  const setLocationValue = (key, value) => {
    // Typing wins over a pin lookup still in flight (its result would overwrite what was just typed).
    if (key !== 'addressConfirmed') { ++pinLookupRequestRef.current; setPinLookup(false); }
    setLocationInfo((current) => ({ ...current, [key]: value }));
    setLocationErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
    setLocationComplete(false);
    setNotice(null);
    setMapError('');
  };
  const setLocation = (key) => (event) => setLocationValue(key, event.target.value);
  const toggleLocationConsent = (event) => setLocationValue('addressConfirmed', event.target.checked);

  const setAmenityValue = (categoryId, itemId, value) => {
    // Some amenities (e.g. WiFi) are listed in several categories: one answer counts for all of them.
    const shared = AMENITY_CATEGORIES.filter(({ items }) => items.some((item) => item.id === itemId)).map(({ id }) => id);
    setAmenitiesInfo((current) => ({
      ...current,
      ...Object.fromEntries(shared.map((id) => [id, { ...(current[id] ?? {}), [itemId]: value }])),
    }));
    setAmenitiesErrors((current) => Object.fromEntries(
      Object.entries(current)
        .map(([id, missing]) => [id, shared.includes(id) ? missing.filter((missingId) => missingId !== itemId) : missing])
        .filter(([, missing]) => missing.length),
    ));
    setAmenitiesComplete(false);
    setNotice(null);
  };

  const changeAmenityCategory = (categoryId) => {
    if (categoryId === activeCategoryId) return;
    setActiveCategoryId(categoryId);
    setNotice(null);
  };

  // After Next opens another tab (Amenities / Rooms / Policies): bring the card's top (title + tab row) back into
  // view just under the sticky header, and centre the new tab in the sideways tab row. Without this the page
  // stays scrolled down and the new tab opens at its bottom.
  // Tab row: scroll sideways only (scrollIntoView would also scroll the page and fight our own page scroll).
  const centerTab = (tab) => {
    const row = tab?.closest('.pi-amenity-tabs');
    if (!row) return;
    const r = row.getBoundingClientRect();
    const t = tab.getBoundingClientRect();
    row.scrollTo({ left: row.scrollLeft + (t.left - r.left) - (r.width - t.width) / 2, behavior: 'smooth' });
  };
  const headerBottom = () => document.querySelector('.ps-header')?.getBoundingClientRect().bottom ?? 0;
  const scrollPageTo = (top) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
  };

  const showNewTab = (tabSelector) => {
    requestAnimationFrame(() => {
      const form = formRef.current;
      const card = form?.querySelector('.pi-card');
      centerTab(form?.querySelector(tabSelector));
      if (!card) return;
      const top = card.getBoundingClientRect().top;
      // Only scroll up (never push the page down when the card top is already visible).
      if (top < headerBottom() + 8) scrollPageTo(window.scrollY + top - headerBottom() - 16);
    });
  };

  // After a failed Save / Next: scroll to the first problem and focus it (shared helper, lib/utils/revealError.js).
  // In tabbed sections the tab row stays in view too when the field still fits on screen with it.
  const DEFAULT_ERROR_TARGET = ERROR_FIELD;
  const revealFirstError = (focusSelector = DEFAULT_ERROR_TARGET, tabSelector = null) => {
    if (tabSelector) requestAnimationFrame(() => centerTab(formRef.current?.querySelector(tabSelector)));
    revealError(formRef.current, { focus: focusSelector, keepInView: '.pi-amenity-tabs' });
  };

  const goToNextCategory = () => {
    if (isLastCategory) return;
    const missing = validateAmenitiesInfo(amenitiesInfo)[activeCategory.id];
    if (missing?.length) {
      setAmenitiesErrors((current) => ({ ...current, [activeCategory.id]: missing }));
      revealFirstError('.pi-amenity-row.has-error input', `[data-amenity-tab="${activeCategory.id}"]`);
      return;
    }
    const nextIndex = activeCategoryIndex + 1;
    const nextCategory = AMENITY_CATEGORIES[nextIndex];
    setAmenitiesErrors((current) => {
      const { [activeCategory.id]: _cleared, [nextCategory.id]: _nextCleared, ...rest } = current;
      return rest;
    });
    setAmenityUnlockedIndex((current) => Math.max(current, nextIndex));
    changeAmenityCategory(nextCategory.id);
    showNewTab(`[data-amenity-tab="${nextCategory.id}"]`);
  };

  const onAmenityTabKeyDown = (event, index) => {
    let nextIndex = null;
    if (event.key === 'ArrowRight') nextIndex = index >= amenityUnlockedIndex ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') nextIndex = index <= 0 ? amenityUnlockedIndex : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = amenityUnlockedIndex;
    if (nextIndex === null || nextIndex < 0 || nextIndex > amenityUnlockedIndex) return;
    event.preventDefault();
    const nextCategory = AMENITY_CATEGORIES[nextIndex];
    changeAmenityCategory(nextCategory.id);
    formRef.current?.querySelector(`[data-amenity-tab="${nextCategory.id}"]`)?.focus();
  };

  const setRoomValue = (key, value) => {
    setRoomsInfo((current) => ({ ...current, [key]: value }));
    setRoomErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _removed, ...rest } = current;
      return rest;
    });
    setNotice(null);
  };
  const setRoom = (key) => (event) => setRoomValue(key, event.target.value);

  const setPolicyValue = (key, value) => {
    setPoliciesInfo((current) => {
      const next = { ...current, [key]: value };
      if (key === 'includeInfant' && value !== 'yes') {
        next.infantFoodProvided = '';
        next.infantFoodItems = '';
      }
      if (key === 'infantFoodProvided' && value !== 'yes') next.infantFoodItems = '';
      if (key === 'extraBedForAdults' && value !== 'yes') next.adultExtraBedType = '';
      return next;
    });
    setPolicyErrors((current) => {
      const keysToClear = [key];
      if (key === 'includeInfant') keysToClear.push('infantFoodProvided', 'infantFoodItems');
      if (key === 'infantFoodProvided') keysToClear.push('infantFoodItems');
      if (key === 'extraBedForAdults') keysToClear.push('adultExtraBedType');
      return keysToClear.reduce((next, errorKey) => {
        const { [errorKey]: _removed, ...rest } = next;
        return rest;
      }, current);
    });
    setPoliciesComplete(false);
    setNotice(null);
  };
  const setPolicy = (key) => (event) => setPolicyValue(key, event.target.value);
  const setPolicyChoice = (key) => (value) => setPolicyValue(key, value);
  const toggleIdentityProof = (value) => {
    setPoliciesInfo((current) => {
      const selected = Array.isArray(current.identityProofs) ? current.identityProofs : [];
      return {
        ...current,
        identityProofs: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
    setPolicyErrors((current) => {
      if (!current.identityProofs) return current;
      const { identityProofs: _removed, ...rest } = current;
      return rest;
    });
    setPoliciesComplete(false);
    setNotice(null);
  };

  const setRoomAmenityValue = (itemId, value) => {
    setRoomsInfo((current) => ({
      ...current,
      amenities: { ...(current.amenities ?? {}), [itemId]: value },
    }));
    setRoomErrors((current) => {
      const missing = current.amenities;
      if (!missing?.includes(itemId)) return current;
      const remaining = missing.filter((id) => id !== itemId);
      const { amenities: _removed, ...rest } = current;
      return remaining.length ? { ...rest, amenities: remaining } : rest;
    });
    setNotice(null);
  };

  const changeRoomCategory = (categoryId) => {
    if (categoryId === activeRoomCategoryId) return;
    setActiveRoomCategoryId(categoryId);
    setRoomErrors({});
    setNotice(null);
  };

  const goToNextRoomCategory = () => {
    if (isRoomSaveStep) return;
    // Like Amenities: Next checks only this tab's fields, so problems show where they are (not at the end).
    const allErrors = validateRoomsInfo(roomsInfo);
    const tabErrors = Object.fromEntries(Object.entries(allErrors).filter(([field]) => activeRoomCategory.fields.includes(field)));
    if (Object.keys(tabErrors).length) {
      setRoomErrors(tabErrors);
      revealFirstError('.pi-amenity-panel .has-error input, .pi-amenity-panel .has-error select, .pi-amenity-panel .has-error button');
      return;
    }
    const nextIndex = activeRoomCategoryIndex + 1;
    const nextCategory = ROOM_CATEGORIES[nextIndex];
    setRoomUnlockedIndex((current) => Math.max(current, nextIndex));
    changeRoomCategory(nextCategory.id);
    showNewTab(`[data-room-tab="${nextCategory.id}"]`);
  };

  const onRoomFormKeyDown = (event) => {
    if (event.key !== 'Enter' || event.defaultPrevented || isRoomSaveStep) return;
    const tagName = event.target?.tagName;
    if (tagName === 'BUTTON' || tagName === 'TEXTAREA') return;
    event.preventDefault();
    goToNextRoomCategory();
  };

  const onRoomTabKeyDown = (event, index) => {
    let nextIndex = null;
    const lastIndex = roomUnlockedIndex;
    if (event.key === 'ArrowRight') nextIndex = index >= lastIndex ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') nextIndex = index <= 0 ? lastIndex : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = lastIndex;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextCategory = ROOM_CATEGORIES[nextIndex];
    changeRoomCategory(nextCategory.id);
    formRef.current?.querySelector(`[data-room-tab="${nextCategory.id}"]`)?.focus();
  };

  const goToNextPolicyCategory = () => {
    const next = POLICY_CATEGORIES[activePolicyCategoryIndex + 1];
    if (!next) return;
    setActivePolicyCategoryId(next.id);
    setNotice(null);
    showNewTab(`[data-policy-tab="${next.id}"]`);
  };

  // Enter in a text box on an earlier tab would submit the whole section and flag tabs not opened yet.
  // Before the last tab, Enter moves to the next tab instead (same as Rooms).
  const onPolicyFormKeyDown = (event) => {
    if (event.key !== 'Enter' || event.defaultPrevented || isLastPolicyCategory) return;
    const tagName = event.target?.tagName;
    if (tagName === 'BUTTON' || tagName === 'TEXTAREA') return;
    event.preventDefault();
    goToNextPolicyCategory();
  };

  const onPolicyTabKeyDown = (event, index) => {
    let nextIndex = null;
    const lastIndex = POLICY_CATEGORIES.length - 1;
    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = lastIndex;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextCategory = POLICY_CATEGORIES[nextIndex];
    setActivePolicyCategoryId(nextCategory.id);
    formRef.current?.querySelector(`[data-policy-tab="${nextCategory.id}"]`)?.focus();
  };

  const useCurrentLocation = async () => {
    const requestId = ++currentLocationRequestRef.current;
    ++autoGeocodeRequestRef.current;
    ++pinLookupRequestRef.current;
    setPinLookup(false);
    setMapError('');
    setGeocodingAddress(false);
    setLocating(true);
    try {
      const coordinates = await getCurrentCoordinates();
      if (requestId !== currentLocationRequestRef.current) return;
      const result = await reverseGeocode(coordinates);
      if (requestId !== currentLocationRequestRef.current) return;
      const fields = addressToLocationFields(result);
      const approximate = Number.isFinite(coordinates.accuracy) && coordinates.accuracy > GPS_GOOD_ACCURACY_METERS;
      const accuracyMeters = Number.isFinite(coordinates.accuracy) ? Math.max(1, Math.round(coordinates.accuracy)) : null;
      const accuracyLabel = accuracyMeters ? `about ${accuracyMeters} m` : 'unknown accuracy';
      const next = {
        ...locationInfo,
        ...fields,
        latitude: String(coordinates.latitude),
        longitude: String(coordinates.longitude),
        addressConfirmed: false,
      };
      lastAutoGeocodedQueryRef.current = buildAddressQuery(next).toLowerCase();
      pinFixedForRef.current = placeKey(next); // GPS pin is precise: field edits must not move it
      setPinAddress(typeof result.display_name === 'string' ? result.display_name : '');
      setLocationInfo(next);
      setLocationErrors({});
      setLocationComplete(false);
      setNotice({
        kind: approximate ? 'info' : 'success',
        text: approximate
          ? `Approximate location (${accuracyLabel}). Check the autofilled details and save.`
          : accuracyMeters
            ? `Location detected within ${accuracyLabel}. Check the autofilled details and save.`
            : 'Location detected. Check the autofilled details and save.',
      });
    } catch (error) {
      if (requestId !== currentLocationRequestRef.current) return;
      setMapError(error instanceof Error ? error.message : 'We could not detect your location. Please try again or enter the address manually.');
    } finally {
      if (requestId === currentLocationRequestRef.current) setLocating(false);
    }
  };

  // Pin dragged / map tapped: keep the exact spot, then fill the address fields from it (map -> fields).
  // Fields typed by hand still move the pin (fields -> map, the debounced effect above).
  const onMapPick = async ({ latitude, longitude }) => {
    const requestId = ++pinLookupRequestRef.current;
    ++autoGeocodeRequestRef.current; // a pending "address -> pin" lookup must not pull the pin back
    ++currentLocationRequestRef.current;
    setLocating(false);
    setGeocodingAddress(false);
    setMapError('');
    setNotice(null);
    setLocationInfo((current) => ({
      ...current, latitude: String(latitude), longitude: String(longitude), addressConfirmed: false,
    }));
    setLocationComplete(false);
    setPinLookup(true);
    // Where the pin was before this move (decides whether old field values can still apply).
    const before = locationCoordinates;
    // Pin is hand-placed from now on: a slow "address -> pin" lookup or field edits must not pull it back.
    pinFixedForRef.current = placeKey(locationInfo);
    setPinAddress('');
    try {
      const result = await reverseGeocode({ latitude, longitude });
      if (requestId !== pinLookupRequestRef.current) return;
      const fields = addressToLocationFields(result);
      const smallMove = before ? distanceMeters(before, { latitude, longitude }) < SAME_BUILDING_METERS : false;
      setLocationInfo((current) => {
        // Every field follows the pin. When the lookup has no value for a field: a small nudge (same building)
        // keeps what was there; a real move clears it, so an old pincode/city is never left next to a new place.
        const next = { ...current, latitude: String(latitude), longitude: String(longitude), addressConfirmed: false };
        Object.entries(fields).forEach(([key, value]) => {
          if (value) next[key] = value;
          else if (!smallMove) next[key] = '';
        });
        // The fields now describe this pin: don't geocode them again (that would snap the pin to a rougher point).
        lastAutoGeocodedQueryRef.current = buildAddressQuery(next).toLowerCase();
        pinFixedForRef.current = placeKey(next);
        return next;
      });
      setLocationErrors((current) => {
        const rest = { ...current };
        Object.keys(fields).forEach((key) => { if (fields[key]) delete rest[key]; });
        delete rest.addressConfirmed;
        return rest;
      });
      setPinAddress(typeof result.display_name === 'string' ? result.display_name : '');
      setNotice({ kind: 'success', text: 'Address updated from the pin. Check the details below and save.' });
    } catch (error) {
      if (requestId !== pinLookupRequestRef.current) return;
      setMapError(error instanceof Error
        ? `${error.message} The pin is saved; you can type the address yourself.`
        : 'We could not find the address for this pin. The pin is saved; you can type the address yourself.');
    } finally {
      if (requestId === pinLookupRequestRef.current) setPinLookup(false);
    }
  };

  // "Move pin to the typed address": explicit fields -> map, even when the pin was placed by hand.
  const placePinAtTypedAddress = async () => {
    if (!addressReady) {
      setMapError('Enter a 6-digit pincode and the city first, then we can find it on the map.');
      return;
    }
    const requestId = ++autoGeocodeRequestRef.current;
    ++pinLookupRequestRef.current;
    setPinLookup(false);
    setMapError('');
    setGeocodingAddress(true);
    try {
      const coordinates = await forwardGeocodeAddressInfo(locationInfo);
      if (requestId !== autoGeocodeRequestRef.current) return;
      lastAutoGeocodedQueryRef.current = addressQuery.toLowerCase();
      pinFixedForRef.current = null;
      setPinAddress('');
      setLocationInfo((current) => ({ ...current, latitude: String(coordinates.latitude), longitude: String(coordinates.longitude) }));
      setNotice({ kind: 'info', text: 'Pin moved to the address you typed. Drag it to the exact entrance if needed.' });
    } catch (error) {
      if (requestId !== autoGeocodeRequestRef.current) return;
      setMapError(error instanceof Error ? error.message : 'We could not place this address on the map. Please try again.');
    } finally {
      if (requestId === autoGeocodeRequestRef.current) setGeocodingAddress(false);
    }
  };

  const goToSection = (sectionId) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // One save at a time. Field problems found by the server are shown under their inputs.
  const save = async (request, showErrors, onSaved) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setNotice(null);
    try {
      const next = await request();
      if (!mountedRef.current) return;
      onPropertyChange(next);
      onSaved(next);
    } catch (error) {
      if (!mountedRef.current) return;
      const found = formErrors(error, FIELD_LABELS);
      setNotice({ kind: 'error', text: error.message });
      if (showErrors && Object.keys(found).length) {
        showErrors(found);
        revealFirstError();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      savingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateBasicInfo(info);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      revealFirstError();
      return;
    }
    save(() => saveBasic(propertyId, info), setErrors, (next) => {
      setInfo(basicFromApi(next.basic, user));
      setBasicComplete(true);
      goToSection('location');
    });
  };

  const onLocationSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateLocationInfo(locationInfo);
    setLocationErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      revealFirstError();
      return;
    }
    save(() => saveLocation(propertyId, locationInfo), setLocationErrors, () => {
      setLocationComplete(true);
      goToSection('amenities');
    });
  };

  const onAmenitiesSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateAmenitiesInfo(amenitiesInfo);
    setAmenitiesErrors(nextErrors);
    const firstCategory = AMENITY_CATEGORIES.find((category) => nextErrors[category.id]?.length);
    if (firstCategory) {
      setActiveCategoryId(firstCategory.id);
      revealFirstError('.pi-amenity-row.has-error input', `[data-amenity-tab="${firstCategory.id}"]`);
      return;
    }
    save(() => saveAmenities(propertyId, amenitiesInfo), null, () => {
      setAmenitiesComplete(true);
      goToSection('rooms');
    });
  };

  const onRoomsSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateRoomsInfo(roomsInfo);
    setRoomErrors(nextErrors);
    const firstField = Object.keys(nextErrors)[0];
    if (firstField) {
      const categoryIndex = ROOM_CATEGORIES.findIndex(({ fields }) => fields.includes(firstField));
      const category = ROOM_CATEGORIES[categoryIndex];
      if (category) {
        setRoomUnlockedIndex((current) => Math.max(current, categoryIndex));
        setActiveRoomCategoryId(category.id);
      }
      setNotice({ kind: 'error', text: 'Complete the highlighted room details before saving.' });
      revealFirstError(`.pi-room-amenity-row.has-error input, ${DEFAULT_ERROR_TARGET}`, category ? `[data-room-tab="${category.id}"]` : null);
      return;
    }
    const roomId = editingRoom === 'new' ? null : editingRoom;
    save(() => saveRoom(propertyId, roomId, roomsInfo), (found) => {
      setRoomErrors(found);
      const category = ROOM_CATEGORIES.find(({ fields }) => fields.some((field) => found[field]));
      if (category) setActiveRoomCategoryId(category.id);
    }, () => {
      setEditingRoom(null);
      setNotice({ kind: 'success', text: `${roomsInfo.roomName.trim()} saved. Add another room type or continue.` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const onRemoveRoom = (room) => {
    if (!window.confirm(`Remove ${room.roomName}?`)) return;
    save(() => deleteRoom(propertyId, room.id), null, (next) => {
      if (!next.rooms.length) openRoom(null);
    });
  };

  const clearPhotoError = (key) => setPhotoErrors((current) => {
    if (!current[key]) return current;
    const { [key]: _removed, ...rest } = current;
    return rest;
  });

  // Photo changes are saved one after another, so a slow upload can't overwrite a newer result.
  const photoQueueRef = useRef(Promise.resolve());
  const queuePhoto = (work) => {
    const result = photoQueueRef.current.then(async () => {
      const next = await work();
      if (mountedRef.current) onPropertyChange(next);
      return next;
    });
    photoQueueRef.current = result.catch(() => {});
    return result;
  };
  const photoProblem = (error) => {
    if (!mountedRef.current) return;
    const found = formErrors(error, FIELD_LABELS);
    if (found.coverImage) setPhotoErrors((current) => ({ ...current, coverImage: found.coverImage }));
    setNotice({ kind: 'error', text: found.coverImage ?? error.message });
  };

  const onCoverSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type) || file.size > IMAGE_MAX_BYTES) {
      setNotice({ kind: 'error', text: 'Choose a JPG, PNG or WebP image up to 10 MB for the cover.' });
      return;
    }
    setCoverBusy(true);
    setNotice(null);
    try {
      await queuePhoto(() => uploadImage(propertyId, file, 'cover'));
      clearPhotoError('coverImage');
    } catch (error) {
      photoProblem(error);
    } finally {
      setCoverBusy(false);
    }
  };

  // Uploads several files; keeps going when one is refused and says which.
  const uploadAll = async (files, { accepts, upload, setBusy, rule }) => {
    const valid = files.filter(accepts);
    const problems = valid.length === files.length ? [] : [rule];
    setBusy(true);
    setNotice(null);
    try {
      for (const file of valid) {
        try {
          await queuePhoto(() => upload(file));
        } catch (error) {
          problems.push(`${file.name}: ${error.message}`);
          if (error.status === 0 || error.status === 401 || error.status === 409 || error.status === 429) break;
        }
        if (!mountedRef.current) return;
      }
      setPhotoErrors({});
      if (problems.length) setNotice({ kind: 'error', text: problems.join(' ') });
    } finally {
      setBusy(false);
    }
  };

  const onGallerySelected = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    uploadAll(files, {
      accepts: (file) => IMAGE_TYPES.includes(file.type) && file.size <= IMAGE_MAX_BYTES,
      upload: (file) => uploadImage(propertyId, file, 'gallery'),
      setBusy: setGalleryBusy,
      rule: 'Only JPG, PNG or WebP images up to 10 MB were added.',
    });
  };

  const onVideosSelected = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    uploadAll(files, {
      accepts: (file) => file.type.startsWith('video/') && file.size <= VIDEO_MAX_BYTES,
      upload: (file) => uploadVideo(propertyId, file),
      setBusy: setVideoBusy,
      rule: 'Only MP4, MOV or WebM videos up to 100 MB were added.',
    });
  };

  const changePhoto = (work, after) => {
    setNotice(null);
    queuePhoto(work).then(() => { if (mountedRef.current) after?.(); }).catch(photoProblem);
  };
  const setImageTag = (id, tag) => {
    if (!tag) return; // the placeholder
    changePhoto(() => saveImageTag(propertyId, id, tag), () => setPhotoErrors({}));
  };
  const setAsCover = (id) => {
    const image = photosInfo.images.find((item) => item.id === id);
    if (!image || photosInfo.coverImage?.id === id) return;
    changePhoto(() => setCover(propertyId, id), () => {
      clearPhotoError('coverImage');
      setNotice({ kind: 'success', text: `${image.name} set as cover.` });
    });
  };
  const removeCover = () => changePhoto(() => setCover(propertyId, null), () => clearPhotoError('coverImage'));
  const removeImage = (id) => changePhoto(() => deleteMedia(propertyId, id), () => setPhotoErrors({}));
  const removeVideo = removeImage;

  const onPhotosSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validatePhotosInfo(photosInfo);
    setPhotoErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      revealFirstError('.pi-photo-block.has-error .pi-upload-zone, .pi-photo-block.has-error select, .pi-photo-card.has-error select, .pi-video-row.has-error input');
      return;
    }
    // Already on the server; nothing more to send.
    setNotice(null);
    goToSection('policies');
  };

  const onPoliciesSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validatePoliciesInfo(policiesInfo);
    setPolicyErrors(nextErrors);
    const firstField = Object.keys(nextErrors)[0];
    if (firstField) {
      const category = POLICY_CATEGORIES.find(({ fields }) => fields.includes(firstField));
      if (category) setActivePolicyCategoryId(category.id);
      revealFirstError(`.pi-policy-yesno.has-error input, .pi-policy-radio-list.has-error input, .pi-policy-check-field.has-error input, ${DEFAULT_ERROR_TARGET}`, category ? `[data-policy-tab="${category.id}"]` : null);
      return;
    }
    save(() => savePolicies(propertyId, policiesInfo), (found) => {
      setPolicyErrors(found);
      const category = POLICY_CATEGORIES.find(({ fields }) => fields.some((field) => found[field]));
      if (category) setActivePolicyCategoryId(category.id);
    }, (next) => {
      setPoliciesInfo(policiesFromApi(next.policies));
      setPoliciesComplete(true);
      goToSection('legal');
    });
  };

  const selectSection = (sectionId) => {
    if (sectionId === 'basic') {
      setActiveSection('basic');
      setNotice(null);
      return;
    }
    if (sectionId === 'location' && basicComplete) {
      setActiveSection('location');
      setNotice(null);
      return;
    }
    if (sectionId === 'amenities' && basicComplete && locationComplete) {
      setActiveSection('amenities');
      setNotice(null);
      return;
    }
    if (sectionId === 'rooms' && basicComplete && locationComplete && amenitiesComplete) {
      setActiveSection('rooms');
      setNotice(null);
      return;
    }
    if (sectionId === 'photos' && basicComplete && locationComplete && amenitiesComplete && roomsComplete) {
      setActiveSection('photos');
      setNotice(null);
      return;
    }
    if (sectionId === 'policies' && basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete) {
      setActiveSection('policies');
      setNotice(null);
      return;
    }
    if (sectionId === 'legal' && basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete) {
      setActiveSection('legal');
      setNotice(null);
      return;
    }
    setNotice(null);
  };

  const openVerify = (field) => {
    const valid = field === 'email' ? isValidEmail(info.email) : !mobileError(info.mobile);
    if (!valid) {
      const message = field === 'email' ? 'Enter a valid email address.' : mobileError(info.mobile);
      setErrors((current) => ({ ...current, [field]: message }));
      revealFirstError(`#pi-verify-${field}`);
      return;
    }
    setNotice(null);
    sendOtp(field, info[field]);
  };

  const sendOtp = async (field, value) => {
    if (otpBusyRef.current) return;
    otpBusyRef.current = true;
    try {
      const sent = await requestContactOtp(propertyId, field, value);
      if (mountedRef.current) setOtp({ field, value, resendAfter: sent.resendAfterSeconds ?? RESEND_SECONDS, error: '' });
    } catch (error) {
      if (!mountedRef.current) return;
      const found = formErrors(error, FIELD_LABELS);
      if (error.status === 429) {
        // A code was sent a moment ago and still works: let them enter it.
        setOtp({ field, value, resendAfter: error.retryAfterSeconds ?? RESEND_SECONDS, error: error.message });
      } else {
        setErrors((current) => ({ ...current, [field]: found[field] ?? error.message }));
        revealFirstError(`#pi-verify-${field}`);
      }
    } finally {
      otpBusyRef.current = false;
    }
  };

  const verifyOtpCode = async (code) => {
    const { field, value } = otp;
    const next = await verifyContactOtp(propertyId, field, value, code);
    if (!mountedRef.current) return;
    onPropertyChange(next);
    setInfo((current) => ({ ...current, [`${field}Verified`]: current[field] === value }));
    setErrors((current) => {
      const { [field]: _removed, ...rest } = current;
      return rest;
    });
    setBasicComplete(false);
    setNotice({ kind: 'success', text: `${field === 'email' ? 'Email' : 'Mobile number'} verified.` });
    setOtp(null);
  };

  const photoBusy = activeSection === 'photos' && (coverBusy || galleryBusy || videoBusy);
  const noticeMarkup = notice && (
    <div className={`pi-notice is-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
      {notice.kind === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
      <span>{notice.text}</span>
    </div>
  );

  return (
    <div className="pi-layout">
      <div className="pi-sidebar">
        <ProgressRail
          basicComplete={basicComplete}
          locationComplete={locationComplete}
          amenitiesComplete={amenitiesComplete}
          roomsComplete={roomsComplete}
          photosComplete={photosComplete}
          policiesComplete={policiesComplete}
          legalComplete={legalComplete}
          activeSection={activeSection}
          onSelect={selectSection}
        />
      </div>
      <div className="pi-content">
        {property.status === 'CHANGES_REQUESTED' && property.reviewNote && (
          <div className="pi-notice is-error" role="status">
            <Info size={18} aria-hidden="true" />
            <span><strong>Changes needed:</strong> {property.reviewNote}</span>
          </div>
        )}
        {activeSection === 'location' ? (
          <>
            {noticeMarkup}
            <form ref={formRef} noValidate onSubmit={onLocationSubmit}>
              <SectionCard icon={MapPin} title="Property location" subtitle="Where guests will find your property.">
                {/* Two-way: drag the pin / tap the map -> fields fill in; type the address -> pin moves */}
                <LocationMap
                  latitude={locationCoordinates?.latitude}
                  longitude={locationCoordinates?.longitude}
                  onPick={onMapPick}
                  disabled={locating}
                >
                  <div className="pi-map-tools">
                    <button type="button" className="btn btn-light pi-map-action" onClick={useCurrentLocation} disabled={mapBusy}
                      aria-label={locating ? 'Locating' : 'Use my current location'}>
                      <LocateFixed size={16} aria-hidden="true" />
                      <span className="pi-map-action-long">{locating ? 'Locating…' : locationCoordinates ? 'Update to my current location' : 'Use my current location'}</span>
                      <span className="pi-map-action-short" aria-hidden="true">{locating ? 'Locating…' : 'My location'}</span>
                    </button>
                  </div>
                </LocationMap>
                {geocodingAddress && <p className="pi-map-status" role="status">Finding this address on the map…</p>}
                {pinLookup && <p className="pi-map-status" role="status">Finding the address for this pin…</p>}
                {!mapBusy && (pinAddress || (locationCoordinates && addressReady)) && (
                  <div className="pi-map-meta">
                    {pinAddress && (
                      <p className="pi-map-pinned"><MapPin size={14} aria-hidden="true" /><span><strong>Pin is at:</strong> {pinAddress}</span></p>
                    )}
                    {locationCoordinates && addressReady && (
                      <button type="button" className="pi-otp-link pi-map-resync" onClick={placePinAtTypedAddress}>
                        Move pin to the address typed below
                      </button>
                    )}
                  </div>
                )}
                {mapError && <p className="field-error pi-map-error" role="alert">{mapError}</p>}
                <div className="pi-grid pi-location-grid">
                  <TextField
                    full
                    label="Apartment / building name"
                    value={locationInfo.apartmentName} maxLength={TEXT_MAX.place}
                    onChange={setLocation('apartmentName')}
                    error={locationErrors.apartmentName}
                    autoComplete="address-line1"
                    placeholder="e.g. Casa Azul Tower"
                    disabled={locating}
                  />
                  <TextField
                    full
                    label="Area / locality"
                    value={locationInfo.area} maxLength={TEXT_MAX.place}
                    onChange={setLocation('area')}
                    error={locationErrors.area}
                    autoComplete="address-line2"
                    placeholder="e.g. Bandra West"
                    disabled={locating}
                  />
                  <TextField
                    label="Pincode"
                    value={locationInfo.pincode}
                    onChange={setLocation('pincode')}
                    error={locationErrors.pincode}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit pincode"
                    disabled={locating}
                  />
                  <TextField label="Country" value={locationInfo.country} maxLength={TEXT_MAX.region} onChange={setLocation('country')} error={locationErrors.country} autoComplete="country-name" placeholder="India" disabled={locating} />
                  <TextField label="State" value={locationInfo.state} maxLength={TEXT_MAX.region} onChange={setLocation('state')} error={locationErrors.state} autoComplete="address-level1" placeholder="Maharashtra" disabled={locating} />
                  <TextField label="City" value={locationInfo.city} maxLength={TEXT_MAX.region} onChange={setLocation('city')} error={locationErrors.city} autoComplete="address-level2" placeholder="Mumbai" disabled={locating} />
                </div>
                <label className={`pi-consent ${locationErrors.addressConfirmed ? 'has-error' : ''}`}>
                  <input type="checkbox" checked={locationInfo.addressConfirmed} onChange={toggleLocationConsent} aria-invalid={Boolean(locationErrors.addressConfirmed)} disabled={locating} />
                  <span>I agree to the terms and conditions and confirm that the address provided here is as per the registration or lease document.</span>
                </label>
                {locationErrors.addressConfirmed && <p className="field-error" role="alert">{locationErrors.addressConfirmed}</p>}
              </SectionCard>
              <div className="pi-actions">
                <button type="button" className="btn btn-light" onClick={() => selectSection('basic')}>Back to Basic info</button>
                <button type="submit" className="btn btn-primary" disabled={saving || photoBusy}>{saving ? 'Saving…' : <>Save &amp; continue<ArrowRight size={16} aria-hidden="true" /></>}</button>
              </div>
            </form>
          </>
        ) : activeSection === 'amenities' ? (
          <>
            {noticeMarkup}
            <form ref={formRef} noValidate onSubmit={onAmenitiesSubmit}>
              <SectionCard icon={Sparkles} title="Amenities & services" subtitle="Tell guests what your property offers. Answer Yes or No for every item.">
                <div className="pi-amenity-tabs" role="tablist" aria-label="Amenity categories">
                  {AMENITY_CATEGORIES.map((category, index) => {
                    const selected = category.id === activeCategory.id;
                    const hasError = Boolean(amenitiesErrors[category.id]?.length);
                    const locked = index > amenityUnlockedIndex;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        role="tab"
                        id={`pi-amenity-tab-${category.id}`}
                        data-amenity-tab={category.id}
                        aria-selected={selected}
                        aria-controls="pi-amenity-panel"
                        aria-disabled={locked || undefined}
                        disabled={locked}
                        tabIndex={locked ? -1 : selected ? 0 : -1}
                        className={`pi-amenity-tab ${selected ? 'is-on' : ''} ${hasError ? 'has-error' : ''} ${locked ? 'is-locked' : ''}`}
                        onClick={() => changeAmenityCategory(category.id)}
                        onKeyDown={(event) => onAmenityTabKeyDown(event, index)}
                      >
                        {locked && <Lock size={12} aria-hidden="true" />}
                        <span>{category.label}</span>
                        <span className="pi-amenity-tab-count">{countAmenityAnswers(category)}/{category.items.length}</span>
                      </button>
                    );
                  })}
                </div>
                <div
                  className="pi-amenity-panel"
                  id="pi-amenity-panel"
                  role="tabpanel"
                  aria-labelledby={`pi-amenity-tab-${activeCategory.id}`}
                >
                  <div className="pi-amenity-panel-head">
                    <h4>{activeCategory.label}</h4>
                    <span>{countAmenityAnswers(activeCategory)} of {activeCategory.items.length} answered</span>
                  </div>
                  <div className="pi-amenity-list">
                    {activeCategory.items.map((item) => {
                      const value = amenitiesInfo[activeCategory.id]?.[item.id] ?? '';
                      const invalid = amenitiesErrors[activeCategory.id]?.includes(item.id);
                      return (
                        <fieldset
                          key={item.id}
                          className={`pi-amenity-row ${invalid ? 'has-error' : ''}`}
                          aria-labelledby={`pi-amenity-label-${activeCategory.id}-${item.id}`}
                          aria-describedby={invalid ? `pi-amenity-error-${activeCategory.id}-${item.id}` : undefined}
                        >
                          <div className="pi-amenity-name" id={`pi-amenity-label-${activeCategory.id}-${item.id}`}>{item.label}</div>
                          <div className="pi-segments pi-amenity-segments">
                            {[['yes', 'Yes'], ['no', 'No']].map(([option, label]) => (
                              <label key={option} className={`pi-segment ${value === option ? 'is-on' : ''}`}>
                                <input
                                  type="radio"
                                  name={`pi-amenity-${activeCategory.id}-${item.id}`}
                                  value={option}
                                  checked={value === option}
                                  onChange={() => setAmenityValue(activeCategory.id, item.id, option)}
                                  className="sr-only"
                                  aria-invalid={Boolean(invalid)}
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                          {invalid && (
                            <span id={`pi-amenity-error-${activeCategory.id}-${item.id}`} className="field-error" role="alert">Choose Yes or No.</span>
                          )}
                        </fieldset>
                      );
                    })}
                  </div>
                </div>
              </SectionCard>
              <div className="pi-actions pi-amenity-actions">
                <button type="button" className="btn btn-light" onClick={() => selectSection('location')}>Back to Location</button>
                {/* Different keys = different <button> elements. Without them React reuses the Next button and only
                    flips type to "submit" during the click, so the browser then submits the form and the last tab
                    opens already full of "Choose Yes or No" errors. Same for Rooms and Policies below. */}
                {isLastCategory ? (
                  <button key="save" type="submit" className="btn btn-primary" disabled={saving || photoBusy}>{saving ? 'Saving…' : <>Save amenities<CheckCircle2 size={16} aria-hidden="true" /></>}</button>
                ) : (
                  <button key="next" type="button" className="btn btn-primary" onClick={goToNextCategory}>Next<ArrowRight size={16} aria-hidden="true" /></button>
                )}
              </div>
            </form>
          </>
        ) : activeSection === 'rooms' && editingRoom === null ? (
          <>
            {noticeMarkup}
            <SectionCard icon={Building2} title="Rooms & inventory" subtitle="Every room type guests can book. Add as many as you have.">
              <ul className="pi-room-list">
                {rooms.map((room) => (
                  <li key={room.id} className="pi-video-row">
                    <span className="pi-video-icon"><BedDouble size={18} aria-hidden="true" /></span>
                    <div className="pi-video-meta">
                      <strong>{room.roomName}</strong>
                      <small>
                        {ROOM_TYPE_OPTIONS.find(([v]) => v === room.roomType)?.[1] ?? room.roomType}
                        {` · ${room.roomCount} room${room.roomCount === 1 ? '' : 's'} · up to ${room.maxGuests} guest${room.maxGuests === 1 ? '' : 's'} · ₹${room.pricePerGuest.toLocaleString('en-IN')} per guest`}
                      </small>
                    </div>
                    <button type="button" className="btn btn-light" onClick={() => openRoom(room)} disabled={saving}><Pencil size={14} aria-hidden="true" />Edit</button>
                    <button type="button" className="pi-photo-remove" onClick={() => onRemoveRoom(room)} disabled={saving} aria-label={`Remove ${room.roomName}`}>
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="btn btn-light" onClick={() => openRoom(null)} disabled={saving}><Plus size={16} aria-hidden="true" />Add another room type</button>
            </SectionCard>
            <div className="pi-actions pi-amenity-actions">
              <button type="button" className="btn btn-light" onClick={() => selectSection('amenities')}>Back to Amenities</button>
              <button type="button" className="btn btn-primary" onClick={() => { setNotice(null); goToSection('photos'); }} disabled={saving || !rooms.length}>Continue<ArrowRight size={16} aria-hidden="true" /></button>
            </div>
          </>
        ) : activeSection === 'rooms' ? (
          <>
            {noticeMarkup}
            <form ref={formRef} noValidate onSubmit={onRoomsSubmit} onKeyDown={onRoomFormKeyDown}>
              <SectionCard icon={Building2} title="Rooms & inventory" subtitle="Add the room type, occupancy and in-room details guests need before booking.">
                <div className="pi-amenity-tabs" role="tablist" aria-label="Room categories">
                  {ROOM_CATEGORIES.map((category, index) => {
                    const selected = category.id === activeRoomCategory.id;
                    const hasError = category.fields.some((field) => roomErrors[field]);
                    const locked = index > roomUnlockedIndex;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        role="tab"
                        id={`pi-room-tab-${category.id}`}
                        data-room-tab={category.id}
                        aria-selected={selected}
                        aria-controls="pi-room-panel"
                        aria-disabled={locked || undefined}
                        disabled={locked}
                        tabIndex={locked ? -1 : selected ? 0 : -1}
                        className={`pi-amenity-tab ${selected ? 'is-on' : ''} ${hasError ? 'has-error' : ''} ${locked ? 'is-locked' : ''}`}
                        onClick={() => changeRoomCategory(category.id)}
                        onKeyDown={(event) => onRoomTabKeyDown(event, index)}
                      >
                        {locked && <Lock size={12} aria-hidden="true" />}
                        <span>{category.label}</span>
                        <span className="pi-amenity-tab-count">{countRoomFieldsDone(category)}/{category.fields.length}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="pi-amenity-panel" id="pi-room-panel" role="tabpanel" aria-labelledby={`pi-room-tab-${activeRoomCategory.id}`}>
                  <div className="pi-amenity-panel-head">
                    <h4>{activeRoomCategory.label}</h4>
                    <span>{countRoomFieldsDone(activeRoomCategory)} of {activeRoomCategory.fields.length} details added</span>
                  </div>

                  {activeRoomCategory.id === 'roomType' && (
                    <div className="pi-grid pi-room-grid">
                      <ResponsiveSelectField label="Room type" value={roomsInfo.roomType} onChange={setRoom('roomType')} options={ROOM_TYPE_OPTIONS} error={roomErrors.roomType} />
                      <ResponsiveSelectField label="Room view" value={roomsInfo.roomView} onChange={setRoom('roomView')} options={ROOM_VIEW_OPTIONS} error={roomErrors.roomView} />
                      <TextField label="Room size" type="number" min="1" value={roomsInfo.roomSize} onChange={setRoom('roomSize')} placeholder="e.g. 350" error={roomErrors.roomSize} />
                      <ResponsiveSelectField label="Size unit" value={roomsInfo.roomSizeUnit} onChange={setRoom('roomSizeUnit')} options={ROOM_SIZE_UNITS} error={roomErrors.roomSizeUnit} />
                      <TextField full label="Display room name" value={roomsInfo.roomName} maxLength={TEXT_MAX.roomName} onChange={setRoom('roomName')} placeholder="e.g. Sea View Deluxe" error={roomErrors.roomName} />
                      <TextField label="No. of rooms" type="number" min="1" value={roomsInfo.roomCount} onChange={setRoom('roomCount')} placeholder="e.g. 12" error={roomErrors.roomCount} />
                    </div>
                  )}

                  {activeRoomCategory.id === 'arrangementOccupancy' && (
                    <div className="pi-grid pi-room-grid">
                      <ResponsiveSelectField label="Bed type" value={roomsInfo.bedType} onChange={setRoom('bedType')} options={BED_TYPE_OPTIONS} error={roomErrors.bedType} />
                      <TextField label="Max guests" type="number" min="1" value={roomsInfo.maxGuests} onChange={setRoom('maxGuests')} placeholder="e.g. 2" error={roomErrors.maxGuests} />
                    </div>
                  )}

                  {activeRoomCategory.id === 'bathroomDetails' && (
                    <div className="pi-grid pi-room-grid">
                      <TextField label="No. of bathrooms" type="number" min="1" value={roomsInfo.bathroomCount} onChange={setRoom('bathroomCount')} placeholder="e.g. 1" error={roomErrors.bathroomCount} />
                    </div>
                  )}

                  {activeRoomCategory.id === 'mealRateInventory' && (
                    <div className="pi-grid pi-room-grid">
                      <ResponsiveSelectField label="Meal option" value={roomsInfo.mealOption} onChange={setRoom('mealOption')} options={MEAL_OPTIONS} error={roomErrors.mealOption} />
                      <TextField label="Base price per guest" type="number" min="1" step="1" value={roomsInfo.pricePerGuest} onChange={setRoom('pricePerGuest')} placeholder="e.g. 3500" error={roomErrors.pricePerGuest} />
                    </div>
                  )}

                  {activeRoomCategory.id === 'roomAmenities' && (
                    <>
                      <div className="pi-amenity-list pi-room-amenity-list">
                        {ROOM_AMENITY_ITEMS.map((item) => {
                          const value = roomsInfo.amenities?.[item.id] ?? '';
                          const invalid = roomErrors.amenities?.includes(item.id);
                          return (
                            <fieldset
                              key={item.id}
                              className={`pi-amenity-row pi-room-amenity-row ${invalid ? 'has-error' : ''}`}
                              aria-labelledby={`pi-room-amenity-label-${item.id}`}
                            >
                              <div className="pi-amenity-name" id={`pi-room-amenity-label-${item.id}`}>{item.label}</div>
                              <div className="pi-segments pi-amenity-segments">
                                {[['yes', 'Yes'], ['no', 'No']].map(([option, label]) => (
                                  <label key={option} className={`pi-segment ${value === option ? 'is-on' : ''}`}>
                                    <input
                                      type="radio"
                                      name={`pi-room-amenity-${item.id}`}
                                      value={option}
                                      checked={value === option}
                                      onChange={() => setRoomAmenityValue(item.id, option)}
                                      className="sr-only"
                                    />
                                    {label}
                                  </label>
                                ))}
                              </div>
                            </fieldset>
                          );
                        })}
                      </div>
                      {roomErrors.amenities && <span className="field-error" role="alert">Answer Yes or No for every room amenity.</span>}
                    </>
                  )}
                </div>
              </SectionCard>
              <div className="pi-actions pi-amenity-actions">
                {rooms.length > 0
                  ? <button type="button" className="btn btn-light" onClick={() => { setEditingRoom(null); setNotice(null); }}>Back to rooms</button>
                  : <button type="button" className="btn btn-light" onClick={() => selectSection('amenities')}>Back to Amenities</button>}
                {isRoomSaveStep ? (
                  <button key="save" type="submit" className="btn btn-primary" disabled={saving || photoBusy}>{saving ? 'Saving…' : <>Save room<CheckCircle2 size={16} aria-hidden="true" /></>}</button>
                ) : (
                  <button key="next" type="button" className="btn btn-primary" onClick={goToNextRoomCategory}>Next<ArrowRight size={16} aria-hidden="true" /></button>
                )}
              </div>
            </form>
          </>
        ) : activeSection === 'photos' ? (
          <>
            {noticeMarkup}
            <form ref={formRef} noValidate onSubmit={onPhotosSubmit}>
              <SectionCard icon={ImageIcon} title="Photos & videos" subtitle="Add a landscape cover, tag gallery images and include optional videos.">
                <input ref={coverInputRef} type="file" accept={IMAGE_ACCEPT} className="sr-only" aria-label="Choose cover image" onChange={onCoverSelected} />
                <div className={`pi-photo-block ${photoErrors.coverImage ? 'has-error' : ''}`}>
                  <div className="pi-photo-block-head">
                    <div>
                      <h4>Cover image</h4>
                      <p>The wide image guests see first on your property page.</p>
                    </div>
                    <span className="pi-photo-badge">Landscape only</span>
                  </div>
                  {photosInfo.coverImage ? (
                    <div className="pi-cover-preview">
                      <PrivateImage path={photosInfo.coverImage.url} alt="Cover preview" />
                      <div className="pi-cover-actions">
                        <button type="button" className="btn btn-light" onClick={() => coverInputRef.current?.click()} disabled={coverBusy}>Replace</button>
                        <button type="button" className="btn btn-light" onClick={removeCover} disabled={coverBusy}><Trash2 size={15} aria-hidden="true" />Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="pi-upload-zone" onClick={() => coverInputRef.current?.click()} disabled={coverBusy}>
                      <ImageIcon size={26} aria-hidden="true" />
                      <span>{coverBusy ? 'Uploading…' : 'Upload landscape cover image'}</span>
                      <small>JPG, PNG or WebP · wider than it is tall</small>
                    </button>
                  )}
                  {photoErrors.coverImage && <span className="field-error" role="alert">{photoErrors.coverImage}</span>}
                </div>

                <div className="pi-photo-block">
                  <input ref={galleryInputRef} type="file" accept={IMAGE_ACCEPT} multiple className="sr-only" aria-label="Add gallery images" onChange={onGallerySelected} />
                  <div className="pi-photo-block-head">
                    <div>
                      <h4>Gallery images</h4>
                      <p>Optional. Add images, then choose a tag for each one.</p>
                    </div>
                    <div className="pi-photo-head-actions">
                      <button type="button" className="btn btn-light" onClick={() => galleryInputRef.current?.click()} disabled={galleryBusy}>
                        <ImageIcon size={15} aria-hidden="true" />{galleryBusy ? 'Uploading…' : 'Add images'}
                      </button>
                    </div>
                  </div>
                  {photosInfo.images.length ? (
                    <div className="pi-photo-grid">
                      {photosInfo.images.map((image, index) => {
                        const error = photoErrors[`image-${index}`];
                        const isCover = photosInfo.coverImage?.sourceId === image.id;
                        return (
                          <div key={image.id} className={`pi-photo-card ${error ? 'has-error' : ''}`}>
                            <div className="pi-photo-thumb">
                              <PrivateImage path={image.url} alt={image.name} />
                              {isCover && <span className="pi-photo-cover-badge"><CheckCircle2 size={12} aria-hidden="true" />Cover</span>}
                              <button type="button" className="pi-photo-remove" onClick={() => removeImage(image.id)} aria-label={`Remove ${image.name}`}>
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            </div>
                            <div className="pi-photo-card-body">
                              <span className="pi-photo-name" title={image.name}>{image.name}</span>
                              <ResponsiveSelectField
                                label="Tag"
                                value={image.tag}
                                onChange={(event) => setImageTag(image.id, event.target.value)}
                                options={PHOTO_TAG_OPTIONS}
                                error={error}
                              />
                              <button
                                type="button"
                                className={`pi-photo-cover-btn ${isCover ? 'is-on' : ''}`}
                                onClick={() => setAsCover(image.id)}
                                disabled={isCover}
                              >
                                <ImageIcon size={14} aria-hidden="true" />{isCover ? 'Cover photo' : 'Set as cover'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pi-photo-empty">No gallery images added yet. This is optional.</p>
                  )}
                </div>

                <div className="pi-photo-block">
                  <input ref={videoInputRef} type="file" accept={VIDEO_ACCEPT} multiple className="sr-only" aria-label="Add videos" onChange={onVideosSelected} />
                  <div className="pi-photo-block-head">
                    <div>
                      <h4>Videos</h4>
                      <p>Optional. Show guests a quick tour of your property.</p>
                    </div>
                    <button type="button" className="btn btn-light" onClick={() => videoInputRef.current?.click()} disabled={videoBusy}><Video size={15} aria-hidden="true" />{videoBusy ? 'Uploading…' : 'Add videos'}</button>
                  </div>
                  {photosInfo.videos.length ? (
                    <div className="pi-video-list">
                      {photosInfo.videos.map((video, index) => (
                        <div key={video.id} className={`pi-video-row ${photoErrors[`video-${index}`] ? 'has-error' : ''}`}>
                          <span className="pi-video-icon"><Video size={18} aria-hidden="true" /></span>
                          <div className="pi-video-meta">
                            <strong title={video.name}>{video.name}</strong>
                            <small>{(video.sizeBytes / 1048576).toFixed(1)} MB</small>
                          </div>
                          <VideoPreview path={video.url} type={video.type} />
                          <button type="button" className="pi-photo-remove" onClick={() => removeVideo(video.id)} aria-label={`Remove ${video.name}`}>
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="pi-photo-empty">No videos added yet. This is optional.</p>
                  )}
                </div>
              </SectionCard>
              <div className="pi-actions pi-amenity-actions">
                <button type="button" className="btn btn-light" onClick={() => selectSection('rooms')}>Back to Rooms</button>
                <button type="submit" className="btn btn-primary" disabled={saving || photoBusy}>{saving ? 'Saving…' : <>Save &amp; continue<ArrowRight size={16} aria-hidden="true" /></>}</button>
              </div>
            </form>
          </>
        ) : activeSection === 'policies' ? (
          <>
            {noticeMarkup}
            <form ref={formRef} noValidate onSubmit={onPoliciesSubmit} onKeyDown={onPolicyFormKeyDown}>
              <SectionCard icon={ClipboardList} title="Policies" subtitle="Set the rules guests see before they book. Answer every question in each tab.">
                <div className="pi-amenity-tabs" role="tablist" aria-label="Policy categories">
                  {POLICY_CATEGORIES.map((category, index) => {
                    const selected = category.id === activePolicyCategory.id;
                    const hasError = category.fields.some((field) => policyErrors[field]);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        role="tab"
                        id={`pi-policy-tab-${category.id}`}
                        data-policy-tab={category.id}
                        aria-selected={selected}
                        aria-controls="pi-policy-panel"
                        tabIndex={selected ? 0 : -1}
                        className={`pi-amenity-tab ${selected ? 'is-on' : ''} ${hasError ? 'has-error' : ''}`}
                        onClick={() => { setActivePolicyCategoryId(category.id); setNotice(null); }}
                        onKeyDown={(event) => onPolicyTabKeyDown(event, index)}
                      >
                        <span>{category.label}</span>
                        <span className="pi-amenity-tab-count">{countPolicyFieldsDone(category)}/{category.fields.length}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="pi-amenity-panel" id="pi-policy-panel" role="tabpanel" aria-labelledby={`pi-policy-tab-${activePolicyCategory.id}`}>
                  <div className="pi-amenity-panel-head">
                    <h4>{activePolicyCategory.label}</h4>
                    <span>{countPolicyFieldsDone(activePolicyCategory)} of {activePolicyCategory.fields.length} details added</span>
                  </div>

                  {activePolicyCategory.id === 'checkInOutTime' && (
                    <div className="pi-grid pi-policy-grid pi-policy-time-grid">
                      <ResponsiveSelectField label="Check-in time" value={policiesInfo.checkInTime} onChange={setPolicy('checkInTime')} options={POLICY_TIME_OPTIONS} error={policyErrors.checkInTime} />
                      <ResponsiveSelectField label="Check-out time" value={policiesInfo.checkOutTime} onChange={setPolicy('checkOutTime')} options={POLICY_TIME_OPTIONS} error={policyErrors.checkOutTime} />
                    </div>
                  )}

                  {activePolicyCategory.id === 'cancellation' && (
                    <div className="pi-policy-stack">
                      <p className="pi-policy-note">Choose the free-cancellation window you offer guests.</p>
                      <PolicyRadioList
                        name="pi-policy-cancellation"
                        options={CANCELLATION_OPTIONS}
                        value={policiesInfo.cancellationPolicy}
                        onChange={setPolicyChoice('cancellationPolicy')}
                        error={policyErrors.cancellationPolicy}
                      />
                    </div>
                  )}

                  {activePolicyCategory.id === 'propertyRules' && (
                    <div className="pi-grid pi-policy-grid pi-policy-rules-grid">
                      <PolicyYesNo name="pi-policy-unmarried" legend="Do you allow unmarried couples?" value={policiesInfo.unmarriedCouples} onChange={setPolicyChoice('unmarriedCouples')} error={policyErrors.unmarriedCouples} />
                      <PolicyYesNo name="pi-policy-below18" legend="Do you allow guests below 18?" value={policiesInfo.below18} onChange={setPolicyChoice('below18')} error={policyErrors.below18} />
                      <PolicyYesNo name="pi-policy-male-group" legend="Do you allow male group only?" value={policiesInfo.maleGroupOnly} onChange={setPolicyChoice('maleGroupOnly')} error={policyErrors.maleGroupOnly} />
                      <fieldset className={`pi-field pi-policy-check-field span-all ${policyErrors.identityProofs ? 'has-error' : ''}`}>
                        <legend className="pi-label">Acceptable identity proofs</legend>
                        <div className="pi-policy-check-grid">
                          {IDENTITY_PROOF_OPTIONS.map(([value, label]) => (
                            <label key={value} className={`pi-policy-check ${policiesInfo.identityProofs.includes(value) ? 'is-on' : ''}`}>
                              <input
                                type="checkbox"
                                checked={policiesInfo.identityProofs.includes(value)}
                                onChange={() => toggleIdentityProof(value)}
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        {policyErrors.identityProofs && <span className="field-error" role="alert">{policyErrors.identityProofs}</span>}
                      </fieldset>
                    </div>
                  )}

                  {activePolicyCategory.id === 'restrictions' && (
                    <div className="pi-grid pi-policy-grid pi-policy-rules-grid">
                      <PolicyYesNo name="pi-policy-smoking" legend="Is smoking allowed?" value={policiesInfo.smokingAllowed} onChange={setPolicyChoice('smokingAllowed')} error={policyErrors.smokingAllowed} />
                      <PolicyYesNo name="pi-policy-parties" legend="Are private parties allowed?" value={policiesInfo.privateParties} onChange={setPolicyChoice('privateParties')} error={policyErrors.privateParties} />
                      <PolicyYesNo name="pi-policy-wheelchair" legend="Can guests who use a wheelchair be accommodated?" value={policiesInfo.wheelchairAccess} onChange={setPolicyChoice('wheelchairAccess')} error={policyErrors.wheelchairAccess} />
                      <PolicyYesNo name="pi-policy-visitors" legend="Can guests invite outside visitors?" value={policiesInfo.outsideVisitors} onChange={setPolicyChoice('outsideVisitors')} error={policyErrors.outsideVisitors} />
                    </div>
                  )}

                  {activePolicyCategory.id === 'petPolicy' && (
                    <div className="pi-grid pi-policy-grid pi-policy-rules-grid">
                      <PolicyYesNo name="pi-policy-pet-living" legend="Is there a pet living in the property?" value={policiesInfo.petLivingOnProperty} onChange={setPolicyChoice('petLivingOnProperty')} error={policyErrors.petLivingOnProperty} />
                      <PolicyYesNo name="pi-policy-pets-allowed" legend="Are pets allowed?" value={policiesInfo.petsAllowed} onChange={setPolicyChoice('petsAllowed')} error={policyErrors.petsAllowed} />
                    </div>
                  )}

                  {activePolicyCategory.id === 'checkInOutPolicy' && (
                    <div className="pi-policy-stack">
                      <PolicyYesNo compact name="pi-policy-24-hour" legend="Do you have the 24-hour check-in/check-out policy?" value={policiesInfo.has24HourPolicy} onChange={setPolicyChoice('has24HourPolicy')} error={policyErrors.has24HourPolicy} />
                    </div>
                  )}

                  {activePolicyCategory.id === 'infantPolicy' && (
                    <div className="pi-grid pi-policy-grid pi-policy-rules-grid">
                      <PolicyYesNo name="pi-policy-include-infant" legend="Do you want to include 1 infant per room?" value={policiesInfo.includeInfant} onChange={setPolicyChoice('includeInfant')} error={policyErrors.includeInfant} />
                      {POLICY_CONDITIONAL_FIELDS.infantFoodProvided(policiesInfo) && (
                        <>
                          <PolicyYesNo name="pi-policy-infant-food" legend="Do you provide complimentary food like warm milk for infants on request?" value={policiesInfo.infantFoodProvided} onChange={setPolicyChoice('infantFoodProvided')} error={policyErrors.infantFoodProvided} />
                          {POLICY_CONDITIONAL_FIELDS.infantFoodItems(policiesInfo) && (
                            <TextField
                              full
                              label="Complimentary food item(s)"
                              value={policiesInfo.infantFoodItems} maxLength={TEXT_MAX.infantFood}
                              onChange={setPolicy('infantFoodItems')}
                              placeholder="e.g. Warm milk, fruit puree"
                              error={policyErrors.infantFoodItems}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activePolicyCategory.id === 'extraBedInclusion' && (
                    <div className="pi-policy-stack">
                      <p className="pi-policy-note">This confirms whether an extra bed/mattress is included in the adult / paid child rates defined for each rate plan.</p>
                      <PolicyYesNo compact name="pi-policy-bed-included" legend="Is extra bed/mattress included in extra adult / paid child rates?" value={policiesInfo.extraBedIncluded} onChange={setPolicyChoice('extraBedIncluded')} error={policyErrors.extraBedIncluded} />
                    </div>
                  )}

                  {activePolicyCategory.id === 'extraBedPolicy' && (
                    <div className="pi-grid pi-policy-grid pi-policy-rules-grid">
                      <PolicyYesNo name="pi-policy-adult-bed" legend="Do you provide a bed to extra adults?" value={policiesInfo.extraBedForAdults} onChange={setPolicyChoice('extraBedForAdults')} error={policyErrors.extraBedForAdults} />
                      {POLICY_CONDITIONAL_FIELDS.adultExtraBedType(policiesInfo) && (
                        <ResponsiveSelectField label="Type of extra bed provided to adults" value={policiesInfo.adultExtraBedType} onChange={setPolicy('adultExtraBedType')} options={EXTRA_BED_TYPE_OPTIONS} error={policyErrors.adultExtraBedType} />
                      )}
                      <PolicyYesNo name="pi-policy-kids-bed" legend="Do you provide an extra bed to kids?" value={policiesInfo.extraBedForKids} onChange={setPolicyChoice('extraBedForKids')} error={policyErrors.extraBedForKids} />
                    </div>
                  )}

                  {activePolicyCategory.id === 'mealRackPrices' && (
                    <div className="pi-policy-stack">
                      <div className="pi-grid pi-policy-grid pi-policy-price-grid">
                        <TextField label="Breakfast (₹)" type="number" min="0" step="0.01" inputMode="decimal" value={policiesInfo.breakfastPrice} onChange={setPolicy('breakfastPrice')} error={policyErrors.breakfastPrice} />
                        <TextField label="Lunch (₹)" type="number" min="0" step="0.01" inputMode="decimal" value={policiesInfo.lunchPrice} onChange={setPolicy('lunchPrice')} error={policyErrors.lunchPrice} />
                        <TextField label="Dinner (₹)" type="number" min="0" step="0.01" inputMode="decimal" value={policiesInfo.dinnerPrice} onChange={setPolicy('dinnerPrice')} error={policyErrors.dinnerPrice} />
                      </div>
                      <p className="pi-hint"><Info size={16} aria-hidden="true" />Enter the rack price per person before taxes. These prices are for reference, not per-room rates.</p>
                    </div>
                  )}

                </div>
              </SectionCard>
              <div className="pi-actions pi-amenity-actions">
                <button type="button" className="btn btn-light" onClick={() => selectSection('photos')}>Back to Photos &amp; videos</button>
                {isLastPolicyCategory ? (
                  <button key="save" type="submit" className="btn btn-primary" disabled={saving || photoBusy}>{saving ? 'Saving…' : <>Save &amp; continue<ArrowRight size={16} aria-hidden="true" /></>}</button>
                ) : (
                  <button
                    key="next"
                    type="button"
                    className="btn btn-primary"
                    onClick={goToNextPolicyCategory}
                  >
                    Next<ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </form>
          </>
        ) : activeSection === 'legal' ? (
          <PropertyLegalForm
            property={property}
            SectionCard={SectionCard}
            allOtherComplete={basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete}
            onSaved={onPropertyChange}
            onSubmitted={() => navigate(propertiesTab(IN_PROGRESS_TAB), { replace: true })}
            onBack={() => selectSection('policies')}
            notify={setNotice}
            noticeMarkup={noticeMarkup}
          />
        ) : (
          <>
            {noticeMarkup}

            <form ref={formRef} noValidate onSubmit={onSubmit}>
              <SectionCard icon={Building2} title="Property details" subtitle="The essentials guests see first.">
                <div className="pi-grid">
                  <TextField
                    full
                    label="Property name"
                    value={info.propertyName}
                    onChange={set('propertyName')}
                    error={errors.propertyName}
                    autoComplete="organization"
                    maxLength={PROPERTY_NAME_MAX}
                    placeholder="e.g. Casa Azul Resort"
                  />
                  <ResponsiveSelectField label="Accepting bookings since" value={info.bookingSince} onChange={set('bookingSince')} options={bookingYears} error={errors.bookingSince} />
                  <ResponsiveSelectField label="Property built year" value={info.builtYear} onChange={set('builtYear')} options={years} error={errors.builtYear} />
                  <fieldset className={`pi-field ${errors.rating ? 'has-error' : ''}`}>
                    <legend className="pi-label">Property rating</legend>
                    <div className="pi-stars">
                      {PROPERTY_RATINGS.map((rating) => (
                        <label key={rating} className={`pi-star ${selectedRating >= rating ? 'is-filled' : ''} ${selectedRating === rating ? 'is-on' : ''}`}>
                          <input type="radio" name="pi-rating" value={rating} checked={selectedRating === rating}
                            onChange={() => setValue('rating', rating)} className="sr-only" />
                          <Star size={23} aria-hidden="true" fill={selectedRating >= rating ? 'currentColor' : 'none'} />
                          <span className="sr-only">{rating} star{rating > 1 ? 's' : ''}</span>
                        </label>
                      ))}
                    </div>
                    <span className="pi-choice">{info.rating ? `${info.rating} star${Number(info.rating) > 1 ? 's' : ''}` : 'Select a star rating'}</span>
                    {errors.rating && <span className="field-error" role="alert">{errors.rating}</span>}
                  </fieldset>
                  <fieldset className={`pi-field ${errors.channelManager ? 'has-error' : ''}`}>
                    <legend className="pi-label">Do you use a channel manager?</legend>
                    <div className="pi-segments">
                      {[['yes', 'Yes'], ['no', 'No']].map(([value, label]) => (
                        <label key={value} className={`pi-segment ${info.channelManager === value ? 'is-on' : ''}`}>
                          <input type="radio" name="pi-channel-manager" value={value} checked={info.channelManager === value}
                            onChange={() => setValue('channelManager', value)} className="sr-only" />
                          {label}
                        </label>
                      ))}
                    </div>
                    {errors.channelManager && <span className="field-error" role="alert">{errors.channelManager}</span>}
                  </fieldset>
                  {info.channelManager === 'yes' && (
                    <TextField full label="Channel manager provider (optional)" value={info.providerName} maxLength={TEXT_MAX.provider} onChange={set('providerName')} placeholder="e.g. SiteMinder" error={errors.providerName} />
                  )}
                </div>
              </SectionCard>

              <SectionCard icon={Info} title="Contact details shared with guests" subtitle="Use these details for guest questions about their stay.">
                <div className="pi-grid pi-contact-grid">
                  <VerifiedField
                    field="email"
                    label="Email ID"
                    type="email"
                    value={info.email}
                    onChange={set('email')}
                    error={errors.email}
                    verified={info.emailVerified}
                    onVerify={() => openVerify('email')}
                    autoComplete="email"
                    placeholder="reservations@yourhotel.com"
                  />
                  <VerifiedField
                    field="mobile"
                    label="Mobile no."
                    type="tel"
                    value={info.mobile}
                    onChange={onMobileChange}
                    error={errors.mobile}
                    verified={info.mobileVerified}
                    onVerify={() => openVerify('mobile')}
                    autoComplete="tel-national"
                    placeholder="10-digit mobile number"
                  />
                  <TextField label="Landline no. (optional)" type="tel" value={info.landline} maxLength={25} onChange={set('landline')} error={errors.landline} autoComplete="tel" placeholder="Include area code" />
                </div>
                <p className="pi-hint"><Info size={16} aria-hidden="true" />These details are shared with guests on your property page after approval.</p>
              </SectionCard>

              <div className="pi-actions">
                <Link to={PARTNER_PATHS.properties} className="btn btn-light">Back to Your properties</Link>
                <button type="submit" className="btn btn-primary" disabled={saving || photoBusy}>{saving ? 'Saving…' : <>Save &amp; continue<ArrowRight size={16} aria-hidden="true" /></>}</button>
              </div>
            </form>
          </>
        )}
      </div>
      {otp && (
        <OtpModal
          field={otp.field}
          value={otp.value}
          resendAfter={otp.resendAfter}
          initialError={otp.error}
          onClose={() => setOtp(null)}
          onResend={() => requestContactOtp(propertyId, otp.field, otp.value)}
          onVerify={verifyOtpCode}
        />
      )}
    </div>
  );
}
