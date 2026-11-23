import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, ChevronDown, ClipboardList, Image as ImageIcon, Info, LocateFixed, Lock, MapPin, Sparkles, Star, Trash2, Video } from 'lucide-react';
import { TextField } from '../Layout.jsx';
import { PortalModal } from '../profile/PortalModal.jsx';
import { OtpInput, emptyOtp } from '../auth/OtpInput.jsx';
import { PARTNER_PATHS } from './paths.js';
import { useAuth } from '../../lib/context/useAuth.js';
import {
  AMENITY_CATEGORIES, BED_TYPE_OPTIONS, CANCELLATION_OPTIONS, EMPTY_BASIC_INFO, EMPTY_LOCATION_INFO,
  EMPTY_ROOMS_INFO, EXTRA_BED_TYPE_OPTIONS, IDENTITY_PROOF_OPTIONS, MEAL_OPTIONS, PHOTO_TAG_OPTIONS,
  POLICY_CATEGORIES, POLICY_CONDITIONAL_FIELDS, POLICY_TIME_OPTIONS, POLICY_YES_NO_OPTIONS, PROPERTY_INFO_SECTIONS,
  PROPERTY_RATINGS, ROOM_AMENITY_ITEMS, ROOM_CATEGORIES, ROOM_SIZE_UNITS, ROOM_TYPE_OPTIONS,
  ROOM_VIEW_OPTIONS, createEmptyAmenitiesInfo, createEmptyPhotosInfo, createEmptyPoliciesInfo,
  getPropertyDraft, normalizePhotosDraft, normalizePoliciesDraft, sanitizePhotosForDraft, savePropertyDraft,
  validateAmenitiesInfo, validateBasicInfo, validateLocationInfo, validatePhotosInfo, validatePoliciesInfo,
  validateRoomsInfo,
} from '../../lib/data/partner.js';
import { isValidEmail, isValidPhone } from '../../lib/utils/validation.js';
import { OTP_LENGTH, todayOtp, verifyOtp } from '../../lib/utils/otp.js';
import { addressToLocationFields, buildAddressQuery, buildOsmEmbedUrl, forwardGeocodeAddressInfo, getCurrentCoordinates, GPS_GOOD_ACCURACY_METERS, isAddressMapReady, reverseGeocode } from '../../lib/utils/location.js';
import '../../styles/auth.css';
import '../../styles/partner.css';

const RESEND_SECONDS = 30;
const ROOM_LAST_INPUT_INDEX = ROOM_CATEGORIES.length - 2;

function ResponsiveSelectField({ label, value, onChange, options, error }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find(([optionValue]) => optionValue === value);
  const selectedLabel = selected?.[1] ?? 'Select';

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const choose = (nextValue) => {
    onChange({ target: { value: nextValue } });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`pi-responsive-select form-field ${error ? 'has-error' : ''}`}>
      <span className="pi-label">{label}</span>
      <button
        type="button"
        className="pi-responsive-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <>
          <button type="button" className="pi-responsive-select-backdrop" aria-label="Close dropdown" onClick={() => setOpen(false)} />
          <div className="pi-responsive-select-menu" role="listbox" aria-label={label}>
            <div className="pi-responsive-select-mobile-head">
              <strong>{label}</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close dropdown">Close</button>
            </div>
            <div className="pi-responsive-select-options">
              {options.map(([optionValue, optionLabel]) => (
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
      )}
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

function OtpModal({ field, value, onClose, onVerified }) {
  const [code, setCode] = useState(emptyOtp);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [otpKey, setOtpKey] = useState(0);
  const label = field === 'email' ? 'email address' : 'mobile number';

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const submit = (event) => {
    event.preventDefault();
    const entered = code.join('');
    if (entered.length !== OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    if (!verifyOtp(entered)) { setError('That code is not correct. Please try again.'); return; }
    onVerified();
  };

  const resend = () => {
    setCode(emptyOtp());
    setError('');
    setResendIn(RESEND_SECONDS);
    setOtpKey((key) => key + 1);
  };

  return (
    <PortalModal title={`Verify ${label}`} onClose={onClose}>
      <span className="auth pi-otp-auth-marker" aria-hidden="true" />
      <div className="pi-otp">
        <p className="pi-otp-text">Enter the {OTP_LENGTH}-digit code sent to <strong>{value}</strong>.</p>
        <p className="pi-otp-demo">Demo code: <strong>{todayOtp()}</strong></p>
        <form onSubmit={submit} noValidate>
          <OtpInput key={otpKey} value={code} onChange={(next) => { setCode(next); setError(''); }} invalid={Boolean(error)} />
          {error && <p className="field-error pi-otp-error" role="alert">{error}</p>}
          <div className="pi-otp-actions">
            <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Verify</button>
          </div>
          <div className="pi-otp-resend">
            {resendIn > 0
              ? <span className="muted-xs">Resend code in {resendIn}s</span>
              : <button type="button" className="pi-otp-link" onClick={resend}>Resend code</button>}
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

function ProgressRail({ basicComplete, locationComplete, amenitiesComplete, roomsComplete, photosComplete, policiesComplete, activeSection, onSelect }) {
  const completed = Number(basicComplete)
    + Number(basicComplete && locationComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete && roomsComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete)
    + Number(basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete);
  const total = PROPERTY_INFO_SECTIONS.length;

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
      <ol className="pi-steps">
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
            || (isPolicies && basicComplete && locationComplete && amenitiesComplete && roomsComplete && photosComplete && policiesComplete);
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

export function PropertyInfoPage({ type }) {
  const { user } = useAuth();
  const formRef = useRef(null);
  const autoGeocodeRequestRef = useRef(0);
  const currentLocationRequestRef = useRef(0);
  const lastAutoGeocodedQueryRef = useRef('');
  const coverInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const objectUrlsRef = useRef([]);
  const [info, setInfo] = useState(() => {
    const saved = getPropertyDraft(user?.id, type).basic;
    const normalized = { ...EMPTY_BASIC_INFO, email: user?.email ?? '', mobile: user?.phone ?? '', ...saved };
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized.bookingSince)) {
      normalized.bookingSince = normalized.bookingSince.slice(0, 4);
    }
    return normalized;
  });
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [basicComplete, setBasicComplete] = useState(() => Object.keys(validateBasicInfo(info)).length === 0);
  const [activeSection, setActiveSection] = useState('basic');
  const [otpField, setOtpField] = useState(null);
  const [locationInfo, setLocationInfo] = useState(() => ({
    ...EMPTY_LOCATION_INFO,
    ...(getPropertyDraft(user?.id, type).location ?? {}),
  }));
  const [locationErrors, setLocationErrors] = useState({});
  const [locationComplete, setLocationComplete] = useState(() => Object.keys(validateLocationInfo(locationInfo)).length === 0);
  const [mapError, setMapError] = useState('');
  const [locating, setLocating] = useState(false);
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const [amenitiesInfo, setAmenitiesInfo] = useState(() => {
    const empty = createEmptyAmenitiesInfo();
    const saved = getPropertyDraft(user?.id, type)?.amenities ?? {};
    return Object.fromEntries(AMENITY_CATEGORIES.map(({ id, items }) => {
      const answers = { ...empty[id], ...(saved[id] ?? {}) };
      const validIds = new Set(items.map((item) => item.id));
      const clean = Object.fromEntries(
        Object.entries(answers).filter(([itemId, value]) => validIds.has(itemId) && (value === 'yes' || value === 'no')),
      );
      return [id, clean];
    }));
  });
  const initialAmenityCategory = getInitialAmenityCategoryState(amenitiesInfo);
  const [activeCategoryId, setActiveCategoryId] = useState(initialAmenityCategory.activeCategoryId);
  const [amenityUnlockedIndex, setAmenityUnlockedIndex] = useState(initialAmenityCategory.unlockedIndex);
  const [amenitiesErrors, setAmenitiesErrors] = useState({});
  const [amenitiesComplete, setAmenitiesComplete] = useState(() => Object.keys(validateAmenitiesInfo(amenitiesInfo)).length === 0);

  const activeCategoryIndex = AMENITY_CATEGORIES.findIndex((category) => category.id === activeCategoryId);
  const activeCategory = AMENITY_CATEGORIES[activeCategoryIndex] ?? AMENITY_CATEGORIES[0];
  const isLastCategory = activeCategoryIndex === AMENITY_CATEGORIES.length - 1;
  const countAmenityAnswers = (category) => category.items.filter(
    (item) => amenitiesInfo[category.id]?.[item.id] === 'yes' || amenitiesInfo[category.id]?.[item.id] === 'no',
  ).length;
  const [roomsInfo, setRoomsInfo] = useState(() => {
    const saved = getPropertyDraft(user?.id, type)?.rooms ?? {};
    const savedAmenities = saved.amenities ?? {};
    const validIds = new Set(ROOM_AMENITY_ITEMS.map((item) => item.id));
    const amenities = Object.fromEntries(
      Object.entries(savedAmenities).filter(([itemId, value]) => validIds.has(itemId) && (value === 'yes' || value === 'no')),
    );
    return { ...EMPTY_ROOMS_INFO, ...saved, amenities };
  });
  const initialRoomCategory = getInitialRoomCategoryState(roomsInfo);
  const [activeRoomCategoryId, setActiveRoomCategoryId] = useState(initialRoomCategory.activeCategoryId);
  const [roomUnlockedIndex, setRoomUnlockedIndex] = useState(initialRoomCategory.unlockedIndex);
  const [roomErrors, setRoomErrors] = useState({});
  const [roomsComplete, setRoomsComplete] = useState(() => Object.keys(validateRoomsInfo(roomsInfo)).length === 0);

  const activeRoomCategoryIndex = ROOM_CATEGORIES.findIndex((category) => category.id === activeRoomCategoryId);
  const activeRoomCategory = ROOM_CATEGORIES[activeRoomCategoryIndex] ?? ROOM_CATEGORIES[0];
  const isRoomSaveStep = activeRoomCategoryIndex >= ROOM_LAST_INPUT_INDEX;
  const countRoomFieldsDone = (category) => category.fields.filter((field) => {
    if (field === 'amenities') {
      return ROOM_AMENITY_ITEMS.every((item) => ['yes', 'no'].includes(roomsInfo.amenities?.[item.id]));
    }
    return String(roomsInfo[field] ?? '').trim().length > 0;
  }).length;
  const [photosInfo, setPhotosInfo] = useState(() => normalizePhotosDraft(
    getPropertyDraft(user?.id, type)?.photos ?? createEmptyPhotosInfo(),
  ));
  const [photoErrors, setPhotoErrors] = useState({});
  const [photosComplete, setPhotosComplete] = useState(() => Object.keys(validatePhotosInfo(photosInfo)).length === 0);
  const [coverBusy, setCoverBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [policiesInfo, setPoliciesInfo] = useState(() => normalizePoliciesDraft(
    getPropertyDraft(user?.id, type)?.policies ?? createEmptyPoliciesInfo(),
  ));
  const [activePolicyCategoryId, setActivePolicyCategoryId] = useState(POLICY_CATEGORIES[0].id);
  const [policyErrors, setPolicyErrors] = useState({});
  const [policiesComplete, setPoliciesComplete] = useState(() => Object.keys(validatePoliciesInfo(policiesInfo)).length === 0);

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
  const mapBusy = locating || geocodingAddress;

  useEffect(() => {
    const requestId = ++autoGeocodeRequestRef.current;
    if (activeSection !== 'location' || !addressReady || !addressQuery) {
      setGeocodingAddress(false);
      return undefined;
    }
    const queryKey = addressQuery.toLowerCase();
    if (lastAutoGeocodedQueryRef.current === queryKey) return undefined;
    const timer = setTimeout(async () => {
      setGeocodingAddress(true);
      setMapError('');
      try {
        const coordinates = await forwardGeocodeAddressInfo(locationInfo);
        if (requestId !== autoGeocodeRequestRef.current) return;
        lastAutoGeocodedQueryRef.current = queryKey;
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
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    currentLocationRequestRef.current += 1;
  }, []);

  const setValue = (key, value) => {
    const verifiedKey = key === 'email' ? 'emailVerified' : key === 'mobile' ? 'mobileVerified' : null;
    setInfo((current) => ({
      ...current,
      [key]: value,
      ...(verifiedKey ? { [verifiedKey]: false } : {}),
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

  const setLocationValue = (key, value) => {
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
    setAmenitiesInfo((current) => ({
      ...current,
      [categoryId]: { ...(current[categoryId] ?? {}), [itemId]: value },
    }));
    setAmenitiesErrors((current) => {
      const missing = current[categoryId];
      if (!missing?.includes(itemId)) return current;
      const remaining = missing.filter((id) => id !== itemId);
      const { [categoryId]: _removed, ...rest } = current;
      return remaining.length ? { ...rest, [categoryId]: remaining } : rest;
    });
    setAmenitiesComplete(false);
    setNotice(null);
  };

  const changeAmenityCategory = (categoryId) => {
    if (categoryId === activeCategoryId) return;
    setActiveCategoryId(categoryId);
    setNotice(null);
  };

  const goToNextCategory = () => {
    if (isLastCategory) return;
    const missing = validateAmenitiesInfo(amenitiesInfo)[activeCategory.id];
    if (missing?.length) {
      setAmenitiesErrors((current) => ({ ...current, [activeCategory.id]: missing }));
      requestAnimationFrame(() => {
        const form = formRef.current;
        form?.querySelector(`[data-amenity-tab="${activeCategory.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
        form?.querySelector('.pi-amenity-row.has-error input')?.focus();
      });
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
    requestAnimationFrame(() => {
      formRef.current?.querySelector(`[data-amenity-tab="${nextCategory.id}"]`)
        ?.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
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
    setRoomsComplete(false);
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
    setRoomsComplete(false);
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
    const nextIndex = activeRoomCategoryIndex + 1;
    const nextCategory = ROOM_CATEGORIES[nextIndex];
    setRoomUnlockedIndex((current) => Math.max(current, nextIndex));
    changeRoomCategory(nextCategory.id);
    requestAnimationFrame(() => {
      formRef.current?.querySelector(`[data-room-tab="${nextCategory.id}"]`)
        ?.scrollIntoView({ block: 'nearest', inline: 'center' });
    });
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

  const goToSection = (sectionId) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateBasicInfo(info);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector('.has-error input, .has-error select')?.focus());
      return;
    }
    try {
      savePropertyDraft(user?.id, type, { ...getPropertyDraft(user?.id, type), basic: info });
      setBasicComplete(true);
      setNotice(null);
      goToSection('location');
    } catch {
      setNotice({ kind: 'error', text: 'Could not save this draft in your browser. Check your storage settings and try again.' });
    }
  };

  const onLocationSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateLocationInfo(locationInfo);
    setLocationErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector('.has-error input, .has-error select')?.focus());
      return;
    }
    try {
      savePropertyDraft(user?.id, type, { ...getPropertyDraft(user?.id, type), location: locationInfo });
      setLocationComplete(true);
      setNotice(null);
      goToSection('amenities');
    } catch {
      setNotice({ kind: 'error', text: 'Could not save this draft in your browser. Check your storage settings and try again.' });
    }
  };

  const onAmenitiesSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateAmenitiesInfo(amenitiesInfo);
    setAmenitiesErrors(nextErrors);
    const firstCategory = AMENITY_CATEGORIES.find((category) => nextErrors[category.id]?.length);
    if (firstCategory) {
      setActiveCategoryId(firstCategory.id);
      requestAnimationFrame(() => {
        const form = formRef.current;
        form?.querySelector(`[data-amenity-tab="${firstCategory.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
        form?.querySelector('.pi-amenity-row.has-error input')?.focus();
      });
      return;
    }
    try {
      savePropertyDraft(user?.id, type, { ...getPropertyDraft(user?.id, type), amenities: amenitiesInfo });
      setAmenitiesComplete(true);
      setNotice({ kind: 'success', text: 'Amenities saved to your draft.' });
      goToSection('rooms');
    } catch {
      setNotice({ kind: 'error', text: 'Could not save this draft in your browser. Check your storage settings and try again.' });
    }
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
      requestAnimationFrame(() => {
        const form = formRef.current;
        if (category) {
          form?.querySelector(`[data-room-tab="${category.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
        form?.querySelector('.pi-room-amenity-row.has-error input, .has-error input, .has-error select')?.focus();
      });
      return;
    }
    try {
      savePropertyDraft(user?.id, type, { ...getPropertyDraft(user?.id, type), rooms: roomsInfo });
      setRoomsComplete(true);
      setNotice({ kind: 'success', text: 'Rooms saved to your draft.' });
      goToSection('photos');
    } catch {
      setNotice({ kind: 'error', text: 'Could not save this draft in your browser. Check your storage settings and try again.' });
    }
  };

  const makeUploadId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const trackObjectUrl = (file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  };
  const revokeObjectUrl = (url) => {
    if (typeof url !== 'string' || !url.startsWith('blob:')) return;
    URL.revokeObjectURL(url);
    objectUrlsRef.current = objectUrlsRef.current.filter((item) => item !== url);
  };
  const clearPhotoError = (key) => setPhotoErrors((current) => {
    if (!current[key]) return current;
    const { [key]: _removed, ...rest } = current;
    return rest;
  });
  const readImageDimensions = (url) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Could not read image.'));
    image.src = url;
  });
  const isUrlUsedByGallery = (url, ignoreImageId = null) => photosInfo.images.some(
    (image) => image.id !== ignoreImageId && image.url === url,
  );
  const revokeImageUrlIfUnused = (url, ignoreImageId = null, includeCover = false) => {
    if (!url) return;
    if (isUrlUsedByGallery(url, ignoreImageId)) return;
    if (includeCover && photosInfo.coverImage?.url === url) return;
    revokeObjectUrl(url);
  };

  const onCoverSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice({ kind: 'error', text: 'Choose an image file for the cover.' });
      return;
    }
    setCoverBusy(true);
    const url = URL.createObjectURL(file);
    try {
      const dimensions = await readImageDimensions(url);
      if (!(dimensions.width > dimensions.height)) {
        URL.revokeObjectURL(url);
        setPhotoErrors((current) => ({ ...current, coverImage: 'Cover image must be landscape — wider than it is tall.' }));
        setNotice({ kind: 'error', text: 'Cover image must be landscape — wider than it is tall.' });
        return;
      }
      revokeImageUrlIfUnused(photosInfo.coverImage?.url);
      objectUrlsRef.current.push(url);
      setPhotosInfo((current) => ({
        ...current,
        coverImage: {
          id: 'cover', name: file.name, url, width: dimensions.width, height: dimensions.height, type: file.type, sourceId: '',
        },
      }));
      clearPhotoError('coverImage');
      setPhotosComplete(false);
      setNotice(null);
    } catch {
      URL.revokeObjectURL(url);
      setNotice({ kind: 'error', text: 'Could not read this image. Try another file.' });
    } finally {
      setCoverBusy(false);
    }
  };

  const onGallerySelected = async (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    const valid = files.filter((file) => file.type.startsWith('image/'));
    if (!valid.length) {
      setNotice({ kind: 'error', text: 'Only image files were added to the gallery.' });
      return;
    }
    setGalleryBusy(true);
    try {
      const additions = await Promise.all(valid.map(async (file) => {
        const id = makeUploadId('image');
        const url = trackObjectUrl(file);
        try {
          const dimensions = await readImageDimensions(url);
          return { id, name: file.name, url, tag: '', width: dimensions.width, height: dimensions.height, type: file.type };
        } catch {
          return { id, name: file.name, url, tag: '', width: 0, height: 0, type: file.type };
        }
      }));
      setPhotosInfo((current) => ({ ...current, images: [...current.images, ...additions] }));
      setPhotoErrors({});
      setPhotosComplete(false);
      setNotice(valid.length === files.length ? null : { kind: 'error', text: 'Only image files were added to the gallery.' });
    } finally {
      setGalleryBusy(false);
    }
  };

  const onVideosSelected = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!files.length) return;
    const valid = files.filter((file) => file.type.startsWith('video/'));
    const additions = valid.map((file) => ({
      id: makeUploadId('video'), name: file.name, url: trackObjectUrl(file), type: file.type,
    }));
    setPhotosInfo((current) => ({ ...current, videos: [...current.videos, ...additions] }));
    setPhotoErrors({});
    setPhotosComplete(false);
    setNotice(valid.length === files.length ? null : { kind: 'error', text: 'Only video files were added.' });
  };

  const setImageTag = (id, tag) => {
    setPhotosInfo((current) => ({
      ...current,
      images: current.images.map((image) => (image.id === id ? { ...image, tag } : image)),
    }));
    const index = photosInfo.images.findIndex((image) => image.id === id);
    if (index >= 0) clearPhotoError(`image-${index}`);
    setPhotosComplete(false);
    setNotice(null);
  };

  const setAsCover = async (id) => {
    const image = photosInfo.images.find((item) => item.id === id);
    if (!image || photosInfo.coverImage?.sourceId === id) return;
    let width = Number(image.width) || 0;
    let height = Number(image.height) || 0;
    if ((!width || !height) && image.url) {
      try {
        const dimensions = await readImageDimensions(image.url);
        width = dimensions.width;
        height = dimensions.height;
      } catch {
        setNotice({ kind: 'error', text: 'Could not read this image. Re-upload it to set it as cover.' });
        return;
      }
    }
    if (!(width > height)) {
      setNotice({ kind: 'error', text: 'This image is not landscape — wider than it is tall.' });
      return;
    }
    const oldUrl = photosInfo.coverImage?.url;
    setPhotosInfo((current) => {
      const source = current.images.find((item) => item.id === id);
      if (!source) return current;
      return {
        ...current,
        coverImage: {
          id: 'cover', sourceId: id, name: source.name, url: source.url,
          width, height, type: source.type ?? '',
        },
      };
    });
    if (oldUrl && oldUrl !== image.url) revokeImageUrlIfUnused(oldUrl);
    clearPhotoError('coverImage');
    setPhotosComplete(false);
    setNotice({ kind: 'success', text: `${image.name} set as cover.` });
  };

  const removeCover = () => {
    revokeImageUrlIfUnused(photosInfo.coverImage?.url);
    setPhotosInfo((current) => ({ ...current, coverImage: null }));
    clearPhotoError('coverImage');
    setPhotosComplete(false);
    setNotice(null);
  };

  const removeImage = (id) => {
    const image = photosInfo.images.find((item) => item.id === id);
    const isCoverSource = photosInfo.coverImage?.sourceId === id;
    revokeImageUrlIfUnused(image?.url, id, !isCoverSource);
    setPhotosInfo((current) => ({
      ...current,
      images: current.images.filter((item) => item.id !== id),
      coverImage: isCoverSource ? null : current.coverImage,
    }));
    setPhotoErrors({});
    setPhotosComplete(false);
    setNotice(null);
  };

  const removeVideo = (id) => {
    const video = photosInfo.videos.find((item) => item.id === id);
    revokeObjectUrl(video?.url);
    setPhotosInfo((current) => ({ ...current, videos: current.videos.filter((item) => item.id !== id) }));
    setPhotoErrors({});
    setPhotosComplete(false);
    setNotice(null);
  };

  const onPhotosSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validatePhotosInfo(photosInfo);
    setPhotoErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      requestAnimationFrame(() => formRef.current?.querySelector('.pi-photo-block.has-error .pi-upload-zone, .pi-photo-block.has-error select, .pi-photo-card.has-error select')?.focus());
      return;
    }
    try {
      savePropertyDraft(user?.id, type, {
        ...getPropertyDraft(user?.id, type),
        photos: sanitizePhotosForDraft(photosInfo),
      });
      setPhotosComplete(true);
      setNotice({ kind: 'success', text: 'Photos & videos saved to your draft.' });
      goToSection('policies');
    } catch {
      setNotice({ kind: 'error', text: 'Could not save this draft in your browser. Check your storage settings and try again.' });
    }
  };

  const onPoliciesSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validatePoliciesInfo(policiesInfo);
    setPolicyErrors(nextErrors);
    const firstField = Object.keys(nextErrors)[0];
    if (firstField) {
      const category = POLICY_CATEGORIES.find(({ fields }) => fields.includes(firstField));
      if (category) setActivePolicyCategoryId(category.id);
      requestAnimationFrame(() => {
        const form = formRef.current;
        if (category) {
          form?.querySelector(`[data-policy-tab="${category.id}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
        }
        form?.querySelector('.pi-policy-yesno.has-error input, .pi-policy-radio-list.has-error input, .pi-policy-check-field.has-error input, .has-error input, .has-error select')?.focus();
      });
      return;
    }
    try {
      savePropertyDraft(user?.id, type, {
        ...getPropertyDraft(user?.id, type),
        policies: normalizePoliciesDraft(policiesInfo),
      });
      setPoliciesComplete(true);
      goToSection('legal');
    } catch {
      setNotice({ kind: 'error', text: 'Could not save this draft in your browser. Check your storage settings and try again.' });
    }
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
    const valid = field === 'email' ? isValidEmail(info.email) : isValidPhone(info.mobile);
    if (!valid) {
      const message = field === 'email' ? 'Enter a valid email address.' : 'Enter a valid mobile number.';
      setErrors((current) => ({ ...current, [field]: message }));
      requestAnimationFrame(() => formRef.current?.querySelector(`#pi-verify-${field}`)?.focus());
      return;
    }
    setNotice(null);
    setOtpField(field);
  };

  const markVerified = () => {
    if (!otpField) return;
    const verifiedKey = `${otpField}Verified`;
    setInfo((current) => ({ ...current, [verifiedKey]: true }));
    setErrors((current) => {
      const { [otpField]: _removed, ...rest } = current;
      return rest;
    });
    setBasicComplete(false);
    setNotice({ kind: 'success', text: `${otpField === 'email' ? 'Email' : 'Mobile number'} verified. Save again to update your draft.` });
    setOtpField(null);
  };

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
          activeSection={activeSection}
          onSelect={selectSection}
        />
      </div>
      <div className="pi-content">
        {activeSection === 'location' ? (
          <>
            {noticeMarkup}
            <form ref={formRef} noValidate onSubmit={onLocationSubmit}>
              <SectionCard icon={MapPin} title="Property location" subtitle="Where guests will find your property.">
                {locationCoordinates ? (
                  <div className="pi-map-shell">
                    <iframe
                      className="pi-map-frame"
                      title="Map showing the selected location"
                      loading="lazy"
                      src={buildOsmEmbedUrl(locationCoordinates)}
                    />
                    <div className="pi-map-tools">
                      <button type="button" className="btn btn-light pi-map-action" onClick={useCurrentLocation} disabled={mapBusy}>
                        <LocateFixed size={16} aria-hidden="true" />
                        {locating ? 'Locating…' : 'Update to my current location'}
                      </button>
                    </div>
                    <span className="pi-map-attribution">© OpenStreetMap contributors</span>
                  </div>
                ) : (
                  <div className="pi-map-preview">
                    <span className="pi-map-pin"><MapPin size={26} aria-hidden="true" /></span>
                    <span className="pi-map-caption">Map preview</span>
                    <span className="pi-map-note">Fill in the address below to place it on the map, or use your current location.</span>
                    <div className="pi-map-tools">
                      <button type="button" className="btn btn-light pi-map-action" onClick={useCurrentLocation} disabled={mapBusy}>
                        <LocateFixed size={16} aria-hidden="true" />
                        {locating ? 'Locating…' : 'Use my current location'}
                      </button>
                    </div>
                  </div>
                )}
                {geocodingAddress && <p className="pi-map-status" role="status">Finding this address on the map…</p>}
                {mapError && <p className="field-error pi-map-error" role="alert">{mapError}</p>}
                <div className="pi-grid pi-location-grid">
                  <TextField
                    full
                    label="Apartment / building name"
                    value={locationInfo.apartmentName}
                    onChange={setLocation('apartmentName')}
                    error={locationErrors.apartmentName}
                    autoComplete="address-line1"
                    placeholder="e.g. Casa Azul Tower"
                    disabled={locating}
                  />
                  <TextField
                    full
                    label="Area / locality"
                    value={locationInfo.area}
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
                  <TextField label="Country" value={locationInfo.country} onChange={setLocation('country')} error={locationErrors.country} autoComplete="country-name" placeholder="India" disabled={locating} />
                  <TextField label="State" value={locationInfo.state} onChange={setLocation('state')} error={locationErrors.state} autoComplete="address-level1" placeholder="Maharashtra" disabled={locating} />
                  <TextField label="City" value={locationInfo.city} onChange={setLocation('city')} error={locationErrors.city} autoComplete="address-level2" placeholder="Mumbai" disabled={locating} />
                </div>
                <label className={`pi-consent ${locationErrors.addressConfirmed ? 'has-error' : ''}`}>
                  <input type="checkbox" checked={locationInfo.addressConfirmed} onChange={toggleLocationConsent} aria-invalid={Boolean(locationErrors.addressConfirmed)} disabled={locating} />
                  <span>I agree to the terms and conditions and confirm that the address provided here is as per the registration or lease document.</span>
                </label>
                {locationErrors.addressConfirmed && <p className="field-error" role="alert">{locationErrors.addressConfirmed}</p>}
              </SectionCard>
              <div className="pi-actions">
                <button type="button" className="btn btn-light" onClick={() => selectSection('basic')}>Back to Basic info</button>
                <button type="submit" className="btn btn-primary">Save &amp; continue<ArrowRight size={16} aria-hidden="true" /></button>
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
                {isLastCategory ? (
                  <button type="submit" className="btn btn-primary">Save amenities<CheckCircle2 size={16} aria-hidden="true" /></button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={goToNextCategory}>Next<ArrowRight size={16} aria-hidden="true" /></button>
                )}
              </div>
            </form>
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
                      <TextField full label="Display room name" value={roomsInfo.roomName} onChange={setRoom('roomName')} placeholder="e.g. Sea View Deluxe" error={roomErrors.roomName} />
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
                <button type="button" className="btn btn-light" onClick={() => selectSection('amenities')}>Back to Amenities</button>
                {isRoomSaveStep ? (
                  <button type="submit" className="btn btn-primary">Save rooms<CheckCircle2 size={16} aria-hidden="true" /></button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={goToNextRoomCategory}>Next<ArrowRight size={16} aria-hidden="true" /></button>
                )}
              </div>
            </form>
          </>
        ) : activeSection === 'photos' ? (
          <>
            {noticeMarkup}
            <form ref={formRef} noValidate onSubmit={onPhotosSubmit}>
              <SectionCard icon={ImageIcon} title="Photos & videos" subtitle="Add a landscape cover, tag gallery images and include optional videos.">
                <input ref={coverInputRef} type="file" accept="image/*" className="sr-only" aria-label="Choose cover image" onChange={onCoverSelected} />
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
                      {photosInfo.coverImage.url ? (
                        <img src={photosInfo.coverImage.url} alt="Selected cover preview" />
                      ) : (
                        <div className="pi-photo-file-only">
                          <ImageIcon size={26} aria-hidden="true" />
                          <strong>{photosInfo.coverImage.name}</strong>
                          <small>Preview unavailable after refresh — upload again to replace.</small>
                        </div>
                      )}
                      <div className="pi-cover-actions">
                        <button type="button" className="btn btn-light" onClick={() => coverInputRef.current?.click()} disabled={coverBusy}>Replace</button>
                        <button type="button" className="btn btn-light" onClick={removeCover}><Trash2 size={15} aria-hidden="true" />Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" className="pi-upload-zone" onClick={() => coverInputRef.current?.click()} disabled={coverBusy}>
                      <ImageIcon size={26} aria-hidden="true" />
                      <span>{coverBusy ? 'Checking image…' : 'Upload landscape cover image'}</span>
                      <small>JPG, PNG or WebP · wider than it is tall</small>
                    </button>
                  )}
                  {photoErrors.coverImage && <span className="field-error" role="alert">{photoErrors.coverImage}</span>}
                </div>

                <div className="pi-photo-block">
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="sr-only" aria-label="Add gallery images" onChange={onGallerySelected} />
                  <div className="pi-photo-block-head">
                    <div>
                      <h4>Gallery images</h4>
                      <p>Optional. Choose a default tag, then add images and adjust tags individually.</p>
                    </div>
                    <div className="pi-photo-head-actions">
                      <button type="button" className="btn btn-light" onClick={() => galleryInputRef.current?.click()} disabled={galleryBusy}>
                        <ImageIcon size={15} aria-hidden="true" />{galleryBusy ? 'Reading images…' : 'Add images'}
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
                              {image.url ? (
                                <img src={image.url} alt={image.name} />
                              ) : (
                                <div className="pi-photo-file-only">
                                  <ImageIcon size={22} aria-hidden="true" />
                                  <small>Preview unavailable</small>
                                </div>
                              )}
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
                  <input ref={videoInputRef} type="file" accept="video/*" multiple className="sr-only" aria-label="Add videos" onChange={onVideosSelected} />
                  <div className="pi-photo-block-head">
                    <div>
                      <h4>Videos</h4>
                      <p>Optional. Show guests a quick tour of your property.</p>
                    </div>
                    <button type="button" className="btn btn-light" onClick={() => videoInputRef.current?.click()}><Video size={15} aria-hidden="true" />Add videos</button>
                  </div>
                  {photosInfo.videos.length ? (
                    <div className="pi-video-list">
                      {photosInfo.videos.map((video, index) => (
                        <div key={video.id} className={`pi-video-row ${photoErrors[`video-${index}`] ? 'has-error' : ''}`}>
                          <span className="pi-video-icon"><Video size={18} aria-hidden="true" /></span>
                          <div className="pi-video-meta">
                            <strong title={video.name}>{video.name}</strong>
                            <small>{video.url ? 'Ready to preview' : 'File details saved'}</small>
                          </div>
                          {video.url && <video className="pi-video-preview" src={video.url} controls preload="metadata" />}
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
                <button type="submit" className="btn btn-primary">Save &amp; continue<ArrowRight size={16} aria-hidden="true" /></button>
              </div>
            </form>
          </>
        ) : activeSection === 'policies' ? (
          <>
            {noticeMarkup}
            <form ref={formRef} noValidate onSubmit={onPoliciesSubmit}>
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
                              value={policiesInfo.infantFoodItems}
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
                  <button type="submit" className="btn btn-primary">Save &amp; continue<ArrowRight size={16} aria-hidden="true" /></button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActivePolicyCategoryId(POLICY_CATEGORIES[activePolicyCategoryIndex + 1].id)}
                  >
                    Next<ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </form>
          </>
        ) : activeSection === 'legal' ? (
          <>
            {noticeMarkup}
            <SectionCard icon={Info} title="Financial & legal" subtitle="This section is coming soon.">
              <p className="pi-photo-empty">Your policies are saved. Bank, tax and legal details will be added here next.</p>
            </SectionCard>
            <div className="pi-actions">
              <button type="button" className="btn btn-light" onClick={() => selectSection('policies')}>Back to Policies</button>
            </div>
          </>
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
                    <TextField full label="Channel manager provider (optional)" value={info.providerName} onChange={set('providerName')} placeholder="e.g. SiteMinder" error={errors.providerName} />
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
                    onChange={set('mobile')}
                    error={errors.mobile}
                    verified={info.mobileVerified}
                    onVerify={() => openVerify('mobile')}
                    autoComplete="tel"
                    placeholder="98765 43210"
                  />
                  <TextField label="Landline no. (optional)" type="tel" value={info.landline} onChange={set('landline')} error={errors.landline} autoComplete="tel" placeholder="Include area code" />
                </div>
                <p className="pi-hint"><Info size={16} aria-hidden="true" />These details are shared with guests on your property page after approval.</p>
              </SectionCard>

              <div className="pi-actions">
                <Link to={PARTNER_PATHS.properties} className="btn btn-light">Back to Your properties</Link>
                <button type="submit" className="btn btn-primary">Save &amp; continue<ArrowRight size={16} aria-hidden="true" /></button>
              </div>
            </form>
          </>
        )}
      </div>
      {otpField && (
        <OtpModal
          field={otpField}
          value={otpField === 'email' ? info.email : info.mobile}
          onClose={() => setOtpField(null)}
          onVerified={markVerified}
        />
      )}
    </div>
  );
}
