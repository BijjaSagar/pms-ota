import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Building2, CheckCircle2, ClipboardList, Copy, Gift, Info, MapPin, Navigation,
  Save, ShieldCheck, Star, X,
} from 'lucide-react';
import {
  BASIC_INFO_TABS, CURRENCY_OPTIONS, EMPTY_BASIC_EXTRAS, HOTEL_CHAIN_OPTIONS,
  PROPERTY_TYPE_OPTIONS, SAMPLE_DIRECTIONS, STAR_RATING_OPTIONS, TIMEZONE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from '../../lib/data/basicInformation.js';
import { PROPERTY_RATINGS, mobileError, propertyNameError } from '../../lib/data/partner.js';
import { basicFromApi, policiesFromApi, saveBasic, savePolicies } from '../../lib/api/properties.js';
import { isValidEmail } from '../../lib/utils/validation.js';
import { LocationMap } from './LocationMap.jsx';
import '../../styles/partner-basic-information.css';

const STORAGE_KEY = 'triponx.partner.basicInformation.';

const loadExtras = (id) => {
  try {
    const stored = window.sessionStorage.getItem(`${STORAGE_KEY}${id}`);
    return stored ? { ...EMPTY_BASIC_EXTRAS, ...JSON.parse(stored) } : EMPTY_BASIC_EXTRAS;
  } catch {
    return EMPTY_BASIC_EXTRAS;
  }
};

const persistExtras = (id, form) => {
  const extras = Object.fromEntries(Object.keys(EMPTY_BASIC_EXTRAS).map((key) => [key, form[key]]));
  try {
    window.sessionStorage.setItem(`${STORAGE_KEY}${id}`, JSON.stringify(extras));
  } catch {
    return;
  }
};

const initialForm = (property, basic, policies, extras) => ({
  propertyName: basic.propertyName ?? property.propertyName ?? '',
  displayName: extras.displayName || basic.propertyName || property.propertyName || '',
  description: extras.description || property.description || '',
  propertyType: extras.propertyType || property.typeLabel || property.type || '',
  starRating: String(basic.rating ?? property.rating ?? ''),
  hotelChainName: extras.hotelChainName || '',
  yearOfConstruction: String(basic.builtYear ?? ''),
  acceptingBookingsSince: String(basic.bookingSince ?? ''),
  restaurants: String(extras.restaurants ?? property.restaurants ?? ''),
  rooms: String(property.rooms?.length ?? extras.rooms ?? ''),
  floors: String(extras.floors ?? ''),
  currency: extras.currency || 'INR',
  timezone: extras.timezone || 'Asia/Kolkata',
  checkInTime: policies.checkInTime || '',
  checkOutBefore: policies.checkOutTime || '',
  twentyFourHourCheckIn: Boolean(extras.twentyFourHourCheckIn),
  authorized: false,
  hotelPhone: basic.landline || property.landline || '',
  hotelMobile: basic.mobile || '',
  hotelEmail: basic.email || '',
  phoneList: extras.phoneList || '',
  websiteList: extras.websiteList || '',
  emailList: extras.emailList || '',
  customerCareNumber: extras.customerCareNumber || '',
  vehicleAccess: extras.vehicleAccess || '',
  vehicleTypeMode: extras.vehicleTypeMode || '',
  vehicleTypes: Array.isArray(extras.vehicleTypes) ? extras.vehicleTypes : [],
  directions: extras.directions || '',
});

const years = Array.from({ length: new Date().getFullYear() - 1799 }, (_, index) => String(new Date().getFullYear() - index));

const displayAddress = (location) => [location.apartmentName, location.area, location.city, location.state, location.pincode, location.country]
  .filter(Boolean)
  .join(', ');

function Field({ label, required, hint, error, children }) {
  return (
    <label className={`pbi-field ${error ? 'has-error' : ''}`}>
      <span className="pbi-label">{label}{required ? <em aria-hidden="true"> *</em> : null}</span>
      {children}
      {hint ? <small className="pbi-hint">{hint}</small> : null}
      {error ? <span className="pbi-error" role="alert">{error}</span> : null}
    </label>
  );
}

function TextField({ label, value, onChange, error, required, hint, ...props }) {
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <input value={value ?? ''} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} {...props} />
    </Field>
  );
}

function SelectField({ label, value, onChange, options, error, required, hint }) {
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <select value={value ?? ''} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </Field>
  );
}

function TextareaField({ label, value, onChange, error, required, hint, rows = 4 }) {
  return (
    <Field label={label} required={required} hint={hint} error={error}>
      <textarea rows={rows} value={value ?? ''} aria-invalid={Boolean(error)} onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="pbi-card">
      <header className="pbi-card-head">
        <span className="pbi-card-icon"><Icon size={18} aria-hidden="true" /></span>
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </header>
      <div className="pbi-card-body">{children}</div>
    </section>
  );
}

function SaveBar({ onCancel, onSave, saving, disabled, note }) {
  return (
    <div className="pbi-save-bar">
      {note ? <span className="pbi-save-note">{note}</span> : <span />}
      <div className="pbi-save-actions">
        <button type="button" className="pbi-btn is-light" onClick={onCancel}>Cancel</button>
        <button type="submit" className="pbi-btn" disabled={saving || disabled} onClick={onSave}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export function BasicInformationEditor({ property }) {
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab = BASIC_INFO_TABS.some((item) => item.id === requestedTab) ? requestedTab : 'details';
  const basic = useMemo(() => basicFromApi(property.basic ?? property, null), [property]);
  const policies = useMemo(() => policiesFromApi(property.policies), [property]);
  const [form, setForm] = useState(() => initialForm(property, basic, policies, loadExtras(property.id)));
  const [savedForm, setSavedForm] = useState(form);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [copied, setCopied] = useState('');
  const [reportText, setReportText] = useState('');

  const location = property.location ?? property.address ?? {};
  const address = displayAddress(location);
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude);
  const contactChanged = form.hotelEmail !== savedForm.hotelEmail || form.hotelMobile !== savedForm.hotelMobile;
  const wordCount = form.description.trim() ? form.description.trim().split(/\s+/).length : 0;

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setStatus(null);
  };

  const selectTab = (id) => {
    const next = new URLSearchParams(params);
    next.set('section', 'basic-information');
    next.set('tab', id);
    setParams(next);
  };

  const validate = () => {
    const next = {};
    if (tab === 'details') {
      const nameProblem = propertyNameError(form.propertyName);
      if (nameProblem) next.propertyName = nameProblem;
      if (!form.displayName.trim()) next.displayName = 'Enter the display name.';
      if (wordCount && (wordCount < 100 || wordCount > 500)) next.description = 'Description must be 100–500 words.';
      if (!PROPERTY_RATINGS.includes(Number(form.starRating))) next.starRating = 'Choose a star rating.';
      const built = Number(form.yearOfConstruction);
      const since = Number(form.acceptingBookingsSince);
      if (!built || built < 1800 || built > new Date().getFullYear()) next.yearOfConstruction = 'Choose a valid construction year.';
      if (!since || since < 1800 || since > new Date().getFullYear()) next.acceptingBookingsSince = 'Choose a valid booking year.';
      else if (!next.yearOfConstruction && since < built) next.acceptingBookingsSince = 'This cannot be before the construction year.';
      ['restaurants', 'rooms', 'floors'].forEach((key) => {
        const value = String(form[key] ?? '').trim();
        if (value && !/^\d+$/.test(value)) next[key] = 'Enter a whole number.';
      });
      if (!form.checkInTime) next.checkInTime = 'Choose a check-in time.';
      if (!form.checkOutBefore) next.checkOutBefore = 'Choose a check-out time.';
      if (!form.authorized) next.authorized = 'Confirm that you are authorized to make these changes.';
    }
    if (tab === 'contact') {
      if (form.hotelPhone.trim() && !/^[+\d\s()-]{7,25}$/.test(form.hotelPhone.trim())) next.hotelPhone = 'Enter a valid phone number.';
      const mobileProblem = mobileError(form.hotelMobile);
      if (mobileProblem) next.hotelMobile = mobileProblem;
      if (!isValidEmail(form.hotelEmail)) next.hotelEmail = 'Enter a valid email address.';
      const careNumbers = String(form.customerCareNumber).split(',').map((value) => value.trim()).filter(Boolean);
      if (!careNumbers.length || careNumbers.some((value) => !/^\d{10}$/.test(value.replace(/\D/g, '')))) {
        next.customerCareNumber = 'Enter one or more 10-digit customer care numbers, separated by commas.';
      }
    }
    if (tab === 'reach') {
      if (!form.vehicleAccess) next.vehicleAccess = 'Choose whether a vehicle can reach the entrance.';
      if (!form.vehicleTypeMode) next.vehicleTypeMode = 'Choose which vehicle types can reach the property.';
      if (form.vehicleTypeMode === 'selected' && !form.vehicleTypes.length) next.vehicleTypes = 'Select at least one vehicle type.';
      const length = form.directions.trim().length;
      if (length < 100 || length > 1200) next.directions = 'Directions must be 100–1200 characters.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    setStatus(null);
    if (!validate()) return;
    setSaving(true);
    try {
      if (tab === 'details') {
        await saveBasic(property.id, {
          ...form,
          rating: Number(form.starRating),
          builtYear: Number(form.yearOfConstruction),
          bookingSince: Number(form.acceptingBookingsSince),
          channelManager: basic.channelManager || 'no',
          providerName: basic.providerName || '',
          email: form.hotelEmail,
          mobile: form.hotelMobile,
          landline: form.hotelPhone,
          emailVerified: basic.emailVerified,
          mobileVerified: basic.mobileVerified,
        });
        const nextPolicies = { ...policies, checkInTime: form.checkInTime, checkOutTime: form.checkOutBefore };
        await savePolicies(property.id, nextPolicies);
      }
      if (tab === 'contact') {
        await saveBasic(property.id, {
          ...form,
          rating: Number(form.starRating) || 1,
          builtYear: Number(form.yearOfConstruction) || new Date().getFullYear(),
          bookingSince: Number(form.acceptingBookingsSince) || new Date().getFullYear(),
          channelManager: basic.channelManager || 'no',
          providerName: basic.providerName || '',
          email: form.hotelEmail,
          mobile: form.hotelMobile,
          landline: form.hotelPhone,
          emailVerified: basic.emailVerified,
          mobileVerified: basic.mobileVerified,
        });
      }
      const nextForm = { ...form, authorized: false };
      persistExtras(property.id, nextForm);
      setForm(nextForm);
      setSavedForm(nextForm);
      setStatus({ type: 'success', message: 'Changes saved successfully.' });
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Could not save changes. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setForm(savedForm);
    setErrors({});
    setStatus(null);
  };

  const copyValue = async (label, value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(label);
      window.setTimeout(() => setCopied(''), 1500);
    } catch {
      setStatus({ type: 'error', message: 'Copy is not available in this browser.' });
    }
  };

  const insertDirection = (prefix) => {
    const separator = form.directions && !form.directions.endsWith('\n') ? '\n' : '';
    setField('directions', `${form.directions}${separator}${prefix}`);
  };

  const toggleVehicleType = (id) => {
    const current = form.vehicleTypes;
    setField('vehicleTypes', current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };

  return (
    <div className="pbi-page">
      <nav className="pbi-tabs" aria-label="Basic information tabs">
        {BASIC_INFO_TABS.map((item, index) => (
          <button type="button" key={item.id}
            className={`pbi-tab ${tab === item.id ? 'is-active' : ''}`}
            aria-current={tab === item.id ? 'page' : undefined}
            onClick={() => selectTab(item.id)}>
            <span className="pbi-tab-index">{index + 1}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <form className="pbi-layout" onSubmit={(event) => event.preventDefault()} noValidate>
        <div className="pbi-main">
          {tab === 'details' ? (
            <>
              <SectionCard icon={Building2} title="Property Information" subtitle="Official listing details shown to guests.">
                <div className="pbi-grid">
                  <TextField label="Property Name" value={form.propertyName} onChange={(value) => setField('propertyName', value)} error={errors.propertyName} required maxLength={100} />
                  <TextField label="Display Name" value={form.displayName} onChange={(value) => setField('displayName', value)} error={errors.displayName} required maxLength={100} />
                  <TextareaField label="Property Description" value={form.description} onChange={(value) => setField('description', value)} error={errors.description} hint={`${wordCount} words · 100–500 words`} rows={6} />
                  <SelectField label="Property Type" value={form.propertyType} onChange={(value) => setField('propertyType', value)} options={PROPERTY_TYPE_OPTIONS} />
                  <SelectField label="Star Rating" value={form.starRating} onChange={(value) => setField('starRating', value)} options={STAR_RATING_OPTIONS} error={errors.starRating} required />
                  <SelectField label="Hotel Chain Name" value={form.hotelChainName} onChange={(value) => setField('hotelChainName', value)} options={HOTEL_CHAIN_OPTIONS} />
                </div>
              </SectionCard>

              <SectionCard icon={ClipboardList} title="Property Configuration" subtitle="Operational configuration for this property.">
                <div className="pbi-grid">
                  <SelectField label="Year of Construction" value={form.yearOfConstruction} onChange={(value) => setField('yearOfConstruction', value)} options={[['', 'Select year'], ...years]} error={errors.yearOfConstruction} required />
                  <SelectField label="Accepting Bookings Since" value={form.acceptingBookingsSince} onChange={(value) => setField('acceptingBookingsSince', value)} options={[['', 'Select year'], ...years]} error={errors.acceptingBookingsSince} required />
                  <TextField label="Number of Restaurants" type="number" min="0" value={form.restaurants} onChange={(value) => setField('restaurants', value)} error={errors.restaurants} />
                  <TextField label="Number of Rooms" type="number" min="0" value={form.rooms} onChange={(value) => setField('rooms', value)} error={errors.rooms} />
                  <TextField label="Number of Floors" type="number" min="0" value={form.floors} onChange={(value) => setField('floors', value)} error={errors.floors} />
                  <SelectField label="Currency" value={form.currency} onChange={(value) => setField('currency', value)} options={CURRENCY_OPTIONS} />
                  <SelectField label="Timezone" value={form.timezone} onChange={(value) => setField('timezone', value)} options={TIMEZONE_OPTIONS} />
                </div>
              </SectionCard>

              <SectionCard icon={Navigation} title="Check-in and Check-out Settings" subtitle="Set the standard guest arrival and departure window.">
                <div className="pbi-grid">
                  <TextField label="Check-in Time" type="time" value={form.checkInTime} onChange={(value) => setField('checkInTime', value)} error={errors.checkInTime} required />
                  <TextField label="Check-out Before" type="time" value={form.checkOutBefore} onChange={(value) => setField('checkOutBefore', value)} error={errors.checkOutBefore} required />
                </div>
                <label className="pbi-check-row">
                  <input type="checkbox" checked={form.twentyFourHourCheckIn} onChange={(event) => setField('twentyFourHourCheckIn', event.target.checked)} />
                  <span><strong>24 Hours Check-in</strong><small>Allow guests to check in at any time of day.</small></span>
                </label>
              </SectionCard>

              <label className={`pbi-authorization ${errors.authorized ? 'has-error' : ''}`}>
                <input type="checkbox" checked={form.authorized} onChange={(event) => setField('authorized', event.target.checked)} />
                <span>I confirm I am authorized to make changes to this property's information.</span>
              </label>
              {errors.authorized ? <span className="pbi-error" role="alert">{errors.authorized}</span> : null}
            </>
          ) : null}

          {tab === 'contact' ? (
            <>
              <SectionCard icon={ShieldCheck} title="Primary Contact Information" subtitle="Used for guest communication and support.">
                <div className="pbi-grid">
                  <TextField label="Hotel Phone" type="tel" value={form.hotelPhone} onChange={(value) => setField('hotelPhone', value)} error={errors.hotelPhone} hint="Include area code." />
                  <TextField label="Hotel Mobile" type="tel" value={form.hotelMobile} onChange={(value) => setField('hotelMobile', value)} error={errors.hotelMobile} required hint="Receives SMS and WhatsApp communications." />
                  <TextField label="Hotel Email" type="email" value={form.hotelEmail} onChange={(value) => setField('hotelEmail', value)} error={errors.hotelEmail} required />
                </div>
                {contactChanged ? (
                  <div className="pbi-notice"><Info size={16} aria-hidden="true" /><span>Email or mobile was changed. Verify the new details in the listing wizard to keep communications enabled.</span></div>
                ) : null}
              </SectionCard>

              <SectionCard icon={ClipboardList} title="Additional Contact Information" subtitle="Separate multiple entries with commas.">
                <div className="pbi-grid">
                  <TextField label="Phone List" value={form.phoneList} onChange={(value) => setField('phoneList', value)} placeholder="02212345678, 02287654321" />
                  <TextField label="Website List" value={form.websiteList} onChange={(value) => setField('websiteList', value)} placeholder="https://hotel.example, https://book.example" />
                  <TextField label="Email List" value={form.emailList} onChange={(value) => setField('emailList', value)} placeholder=" reservations@hotel.example, sales@hotel.example" />
                </div>
              </SectionCard>

              <SectionCard icon={Info} title="Customer Care Information" subtitle="Mandatory for display on MakeMyTrip and Goibibo.">
                <div className="pbi-compliance">
                  Hotel partners must provide customer care numbers for display on Goibibo and MakeMyTrip platforms under the Consumer Protection (E-commerce) Rules, 2020.
                </div>
                <TextField label="Customer Care Number" value={form.customerCareNumber} onChange={(value) => setField('customerCareNumber', value)} error={errors.customerCareNumber} required hint="Multiple 10-digit numbers can be separated by commas. Must receive SMS and WhatsApp." />
              </SectionCard>
            </>
          ) : null}

          {tab === 'reach' ? (
            <>
              <SectionCard icon={Navigation} title="Vehicle Access" subtitle="Tell guests how close vehicles can get to the entrance.">
                <div className="pbi-options">
                  {[
                    ['yes', 'Yes', 'Vehicles can reach all the way to the property entrance.'],
                    ['no', 'No', 'Guests must get down at a drop-off point some distance away.'],
                  ].map(([value, label, detail]) => (
                    <label className={`pbi-option ${form.vehicleAccess === value ? 'is-selected' : ''}`} key={value}>
                      <input type="radio" name="pbi-vehicle-access" value={value} checked={form.vehicleAccess === value} onChange={() => setField('vehicleAccess', value)} />
                      <span><strong>{label}</strong><small>{detail}</small></span>
                    </label>
                  ))}
                </div>
                {errors.vehicleAccess ? <span className="pbi-error" role="alert">{errors.vehicleAccess}</span> : null}
              </SectionCard>

              <SectionCard icon={Gift} title="Vehicle Types" subtitle="Choose which vehicles can reach the property or nearest drop-off point.">
                <div className="pbi-options">
                  {[
                    ['all', 'All vehicle types', 'Any vehicle can reach the property or nearest drop-off point.'],
                    ['selected', 'Only selected vehicle types', 'Choose from the vehicle types below.'],
                  ].map(([value, label, detail]) => (
                    <label className={`pbi-option ${form.vehicleTypeMode === value ? 'is-selected' : ''}`} key={value}>
                      <input type="radio" name="pbi-vehicle-mode" value={value} checked={form.vehicleTypeMode === value} onChange={() => setField('vehicleTypeMode', value)} />
                      <span><strong>{label}</strong><small>{detail}</small></span>
                    </label>
                  ))}
                </div>
                {errors.vehicleTypeMode ? <span className="pbi-error" role="alert">{errors.vehicleTypeMode}</span> : null}
                {form.vehicleTypeMode === 'selected' ? (
                  <div className="pbi-vehicle-types">
                    {VEHICLE_TYPE_OPTIONS.map((item) => (
                      <label className="pbi-check-row" key={item.id}>
                        <input type="checkbox" checked={form.vehicleTypes.includes(item.id)} onChange={() => toggleVehicleType(item.id)} />
                        <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                      </label>
                    ))}
                    {errors.vehicleTypes ? <span className="pbi-error" role="alert">{errors.vehicleTypes}</span> : null}
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard icon={ClipboardList} title="Directions and Landmarks" subtitle="Help guests find the property safely and easily.">
                <div className="pbi-editor-tools">
                  <button type="button" onClick={() => insertDirection('• ')}>Bullet list</button>
                  <button type="button" onClick={() => insertDirection('1. ')}>Numbered list</button>
                  <button type="button" onClick={() => insertDirection('Step 1: ')}>Step by step</button>
                  <button type="button" className="pbi-sample-link" onClick={() => setField('directions', SAMPLE_DIRECTIONS)}>See a Sample Direction Description</button>
                </div>
                <TextareaField label="Directions" value={form.directions} onChange={(value) => setField('directions', value)} error={errors.directions} required rows={9} hint={`${form.directions.trim().length} / 1200 characters · 100–1200 required`} />
                <div className="pbi-compliance">
                  Guests receive directions one day before check-in through WhatsApp and Message Inbox. Directions are also available on the MakeMyTrip app and website after booking.
                </div>
              </SectionCard>
            </>
          ) : null}

          <SaveBar onCancel={cancel} onSave={save} saving={saving} disabled={tab === 'details' && !form.authorized} note={status?.message} />
          {status ? <div className={`pbi-status ${status.type}`} role="status">{status.type === 'success' ? <CheckCircle2 size={16} aria-hidden="true" /> : <Info size={16} aria-hidden="true" />}{status.message}</div> : null}
        </div>

        <aside className="pbi-rail">
          {tab === 'reach' ? (
            <section className="pbi-rail-card">
              <header className="pbi-rail-head"><MapPin size={18} aria-hidden="true" /><h3>Property Location</h3></header>
              <div className="pbi-map-preview">
                {hasPoint ? <LocationMap latitude={latitude} longitude={longitude} onPick={undefined} disabled /> : <div className="pbi-map-empty"><MapPin size={22} aria-hidden="true" /><span>Location not available</span></div>}
              </div>
              <button type="button" className="pbi-btn is-light is-full" onClick={() => setDialog('map')}>Click to View Map</button>
              <div className="pbi-location-rows">
                <div><span>Address</span><strong>{address || '—'}</strong></div>
                {[
                  ['Latitude', location.latitude],
                  ['Longitude', location.longitude],
                  ['Contact phone', form.hotelPhone],
                  ['Contact email', form.hotelEmail],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value || '—'}</strong>
                    {value ? <button type="button" aria-label={`Copy ${label}`} onClick={() => copyValue(label, value)}><Copy size={14} aria-hidden="true" />{copied === label ? 'Copied' : ''}</button> : null}
                  </div>
                ))}
              </div>
              <button type="button" className="pbi-report-btn" onClick={() => setDialog('report')}>Report Incorrect Location to BDM</button>
            </section>
          ) : (
            <section className="pbi-rail-card">
              <header className="pbi-rail-head"><Star size={18} aria-hidden="true" /><h3>Save checklist</h3></header>
              <ul className="pbi-checklist">
                <li className={form.propertyName && form.starRating ? 'is-done' : ''}>Property identity complete</li>
                <li className={form.hotelEmail && form.hotelMobile ? 'is-done' : ''}>Primary contacts available</li>
                <li className={form.checkInTime && form.checkOutBefore ? 'is-done' : ''}>Check-in window configured</li>
                <li className={form.customerCareNumber ? 'is-done' : ''}>Customer care number added</li>
              </ul>
              <div className="pbi-rail-note"><Save size={16} aria-hidden="true" /><span>Save each tab separately. Changes are saved to this property.</span></div>
            </section>
          )}
        </aside>
      </form>

      {dialog && typeof document !== 'undefined' ? createPortal(
        <div className="pbi-modal-backdrop" role="presentation" onClick={() => setDialog(null)}>
          <div className="pbi-modal" role="dialog" aria-modal="true" aria-label={dialog === 'map' ? 'Property location map' : 'Report incorrect location'} onClick={(event) => event.stopPropagation()}>
            <button type="button" className="pbi-modal-close" aria-label="Close" onClick={() => setDialog(null)}><X size={18} aria-hidden="true" /></button>
            {dialog === 'map' ? (
              <>
                <h2>Property Location</h2>
                <p>{address || 'No address available.'}</p>
                <div className="pbi-map-modal">
                  {hasPoint ? <LocationMap latitude={latitude} longitude={longitude} onPick={undefined} disabled /> : <div className="pbi-map-empty"><MapPin size={22} aria-hidden="true" /><span>Location not available</span></div>}
                </div>
              </>
            ) : (
              <>
                <h2>Report Incorrect Location</h2>
                <p>Tell the BDM team what is wrong with the registered location.</p>
                <textarea rows={5} value={reportText} onChange={(event) => setReportText(event.target.value)} placeholder="Describe the correct location or landmark…" />
                <button type="button" className="pbi-btn is-full" onClick={() => { setReportText(''); setDialog(null); setStatus({ type: 'success', message: 'Location report sent to BDM.' }); }}>Send report</button>
              </>
            )}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
