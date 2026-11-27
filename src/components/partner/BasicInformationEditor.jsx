import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  Building2, CheckCircle2, ClipboardList, Copy, Gift, Info, MapPin, Navigation,
  Save, ShieldCheck, Star, X,
} from 'lucide-react';
import {
  BASIC_INFO_TABS, CURRENCY_OPTIONS, HOTEL_CHAIN_OPTIONS,
  SAMPLE_DIRECTIONS, STAR_RATING_OPTIONS, TIMEZONE_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
} from '../../lib/data/basicInformation.js';
import { PROPERTY_RATINGS, mobileError, propertyNameError } from '../../lib/data/partner.js';
import {
  reportLocation, requestContactOtp, saveInformationContacts, saveInformationDetails, saveInformationReach, verifyContactOtp,
} from '../../lib/api/properties.js';
import { usePropertyTypes } from '../../lib/api/propertyTypes.js';
import { isValidEmail } from '../../lib/utils/validation.js';
import { LocationMap } from './LocationMap.jsx';
import { ResponsiveSelectField } from './ResponsiveSelectField.jsx';
import '../../styles/partner-basic-information.css';

const splitList = (value) => String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
const joinList = (values) => (Array.isArray(values) ? values.join(', ') : '');
const yesNoOf = (value) => (value === true ? 'yes' : value === false ? 'no' : '');
const countText = (value) => (value === null || value === undefined ? '' : String(value));
const countOf = (value) => (String(value ?? '').trim() === '' ? null : Number(value));

/** The three tabs' forms, from GET .../information. */
const formFromInformation = ({ details, contacts, reach }) => ({
  propertyName: details.propertyName ?? '',
  displayName: details.displayName || details.propertyName || '',
  description: details.description ?? '',
  propertyType: details.type ?? '',
  starRating: countText(details.starRating),
  hotelChainName: details.hotelChain ?? '',
  yearOfConstruction: countText(details.builtYear),
  acceptingBookingsSince: countText(details.bookingSince),
  restaurants: countText(details.restaurantCount),
  rooms: countText(details.roomCount),
  floors: countText(details.floorCount),
  currency: details.currency || 'INR',
  timezone: details.timezone || 'Asia/Kolkata',
  checkInTime: details.checkInTime ?? '',
  checkOutBefore: details.checkOutTime ?? '',
  twentyFourHourCheckIn: Boolean(details.has24HourCheckIn),
  authorized: false,
  hotelPhone: contacts.landline ?? '',
  hotelMobile: contacts.mobile ?? '',
  hotelEmail: contacts.email ?? '',
  whatsappSameAsMobile: contacts.whatsappSameAsMobile ?? true,
  whatsappMobile: contacts.whatsappMobile ?? '',
  phoneList: joinList(contacts.phones),
  websiteList: joinList(contacts.websites),
  emailList: joinList(contacts.emails),
  customerCareNumber: joinList(contacts.customerCareNumbers),
  vehicleAccess: yesNoOf(reach.vehicleReachesEntrance),
  vehicleTypeMode: reach.allVehicleTypes === true ? 'all' : reach.allVehicleTypes === false ? 'selected' : '',
  vehicleTypes: Array.isArray(reach.vehicleTypes) ? reach.vehicleTypes : [],
  directions: reach.directions ?? '',
});

/** API field -> the form field it is shown under. */
const API_FIELDS = {
  type: 'propertyType', hotelChain: 'hotelChainName', builtYear: 'yearOfConstruction',
  bookingSince: 'acceptingBookingsSince', restaurantCount: 'restaurants', floorCount: 'floors',
  checkOutTime: 'checkOutBefore', has24HourCheckIn: 'twentyFourHourCheckIn',
  email: 'hotelEmail', mobile: 'hotelMobile', landline: 'hotelPhone',
  customerCareNumbers: 'customerCareNumber', phones: 'phoneList', emails: 'emailList', websites: 'websiteList',
  vehicleReachesEntrance: 'vehicleAccess', allVehicleTypes: 'vehicleTypeMode',
};
const fieldErrorsOf = (problem) => {
  const next = {};
  Object.entries(problem?.fieldErrors ?? {}).forEach(([field, message]) => {
    const key = API_FIELDS[field.split('.')[0]] ?? field.split('.')[0];
    if (!next[key]) next[key] = /^[A-Z]/.test(message) ? message : `This ${message}.`;
  });
  return next;
};

// Same lists as the "Add a property" wizard.
const currentYear = new Date().getFullYear();
const yearsFrom = (placeholder) => [['', placeholder], ...Array.from({ length: currentYear - 1899 }, (_, index) => {
  const year = String(currentYear - index);
  return [year, year];
})];
const BUILT_YEAR_OPTIONS = yearsFrom('Select built year');
const BOOKING_YEAR_OPTIONS = yearsFrom('Select booking year');

const displayAddress = (location) => [location.apartmentName, location.area, location.city, location.state, location.pincode, location.country]
  .filter(Boolean)
  .join(', ');

/** The form fields each tab saves. */
const TAB_FIELDS = {
  details: ['propertyName', 'displayName', 'description', 'propertyType', 'starRating', 'hotelChainName', 'yearOfConstruction',
    'acceptingBookingsSince', 'restaurants', 'rooms', 'floors', 'currency', 'timezone', 'checkInTime', 'checkOutBefore', 'twentyFourHourCheckIn'],
  contact: ['hotelPhone', 'hotelMobile', 'hotelEmail', 'whatsappSameAsMobile', 'whatsappMobile', 'phoneList', 'websiteList', 'emailList', 'customerCareNumber'],
  reach: ['vehicleAccess', 'vehicleTypeMode', 'vehicleTypes', 'directions'],
};

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

/** "Verify" for a changed email or mobile: send a code, then type it in. */
function ContactVerify({ propertyId, field, value, onVerified }) {
  const [step, setStep] = useState('idle');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const label = field === 'email' ? 'email' : 'mobile number';

  const send = async () => {
    setMessage('');
    setStep('sending');
    try {
      const sent = await requestContactOtp(propertyId, field, value);
      setStep('code');
      setMessage(sent?.message || `We sent a code to this ${label}.`);
    } catch (problem) {
      setStep('idle');
      setMessage(problem?.fieldErrors?.[field] ? `This ${label} ${problem.fieldErrors[field]}.` : problem?.message || 'Could not send the code.');
    }
  };

  const verify = async () => {
    setMessage('');
    setStep('verifying');
    try {
      await verifyContactOtp(propertyId, field, value, code.trim());
      setStep('idle');
      setCode('');
      onVerified(field, value);
    } catch (problem) {
      setStep('code');
      setMessage(problem?.message || 'The code is wrong or has expired.');
    }
  };

  return (
    <div className="pbi-verify" aria-live="polite">
      <span className="pbi-verify-text"><Info size={15} aria-hidden="true" />The new {label} must be verified before saving.</span>
      {step === 'code' || step === 'verifying' ? (
        <div className="pbi-verify-row">
          <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} placeholder="Enter code" aria-label={`Code sent to the ${label}`}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} />
          <button type="button" className="pbi-btn" disabled={code.length < 4 || step === 'verifying'} onClick={verify}>{step === 'verifying' ? 'Verifying…' : 'Verify'}</button>
          <button type="button" className="pbi-btn is-light" onClick={send}>Resend</button>
        </div>
      ) : (
        <button type="button" className="pbi-btn is-light" disabled={!value || step === 'sending'} onClick={send}>{step === 'sending' ? 'Sending…' : `Send code to ${label}`}</button>
      )}
      {message ? <small className="pbi-hint">{message}</small> : null}
    </div>
  );
}

export function BasicInformationEditor({ property, information, onInformationChange }) {
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab = BASIC_INFO_TABS.some((item) => item.id === requestedTab) ? requestedTab : 'details';
  const [form, setForm] = useState(() => formFromInformation(information));
  const [savedForm, setSavedForm] = useState(form);
  const [verified, setVerified] = useState(() => ({
    email: information.contacts.verifiedEmail, mobile: information.contacts.verifiedMobile,
  }));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [copied, setCopied] = useState('');
  const [reportText, setReportText] = useState('');
  const [reporting, setReporting] = useState(false);
  const { categories } = usePropertyTypes();
  const typeOptions = useMemo(() => {
    const options = categories.flatMap((category) => category.types.map((type) => [type.code, type.label]));
    const current = information.details;
    if (current.type && !options.some(([code]) => code === current.type)) options.push([current.type, current.typeLabel]);
    return [['', 'Select property type'], ...options];
  }, [categories, information.details]);

  const location = property.location ?? {};
  const address = displayAddress(location);
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const hasPoint = location.latitude != null && location.longitude != null && Number.isFinite(latitude) && Number.isFinite(longitude);
  const emailNeedsCode = Boolean(form.hotelEmail.trim()) && form.hotelEmail.trim().toLowerCase() !== verified.email;
  const mobileNeedsCode = Boolean(form.hotelMobile.trim()) && form.hotelMobile.trim() !== verified.mobile;
  const wordCount = form.description.trim() ? form.description.trim().split(/\s+/).length : 0;
  const dirty = JSON.stringify({ ...form, authorized: false }) !== JSON.stringify({ ...savedForm, authorized: false });

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setStatus(null);
  };

  const selectTab = (id) => {
    if (id === tab) return;
    const next = new URLSearchParams(params);
    next.set('section', 'basic-information');
    next.set('tab', id);
    setParams(next);
    setErrors({});
    setStatus(null);
  };

  const validate = () => {
    const next = {};
    if (tab === 'details') {
      const nameProblem = propertyNameError(form.propertyName);
      if (nameProblem) next.propertyName = nameProblem;
      if (form.displayName.trim().length < 2) next.displayName = 'Enter the display name.';
      if (wordCount && (wordCount < 100 || wordCount > 500)) next.description = `Description must be 100–500 words (now ${wordCount}).`;
      if (!form.propertyType) next.propertyType = 'Choose the property type.';
      if (!PROPERTY_RATINGS.includes(Number(form.starRating))) next.starRating = 'Choose a star rating.';
      const built = Number(form.yearOfConstruction);
      const since = Number(form.acceptingBookingsSince);
      if (!built) next.yearOfConstruction = 'Choose the construction year.';
      if (!since) next.acceptingBookingsSince = 'Choose the year bookings started.';
      else if (built && since < built) next.acceptingBookingsSince = 'This cannot be before the construction year.';
      ['restaurants', 'floors'].forEach((key) => {
        const value = String(form[key] ?? '').trim();
        if (value && !/^\d+$/.test(value)) next[key] = 'Enter a whole number.';
      });
      if (!form.checkInTime) next.checkInTime = 'Choose a check-in time.';
      if (!form.checkOutBefore) next.checkOutBefore = 'Choose a check-out time.';
      if (!form.authorized) next.authorized = 'Confirm that you are authorized to make these changes.';
    }
    if (tab === 'contact') {
      if (form.hotelPhone.trim() && !/^(?=(?:\D*\d){7,15}\D*$)[+\d\s()-]{7,25}$/.test(form.hotelPhone.trim())) next.hotelPhone = 'Enter a valid phone number.';
      const mobileProblem = mobileError(form.hotelMobile);
      if (mobileProblem) next.hotelMobile = mobileProblem;
      else if (mobileNeedsCode) next.hotelMobile = 'Verify the new mobile number first.';
      if (!isValidEmail(form.hotelEmail)) next.hotelEmail = 'Enter a valid email address.';
      else if (emailNeedsCode) next.hotelEmail = 'Verify the new email first.';
      if (!form.whatsappSameAsMobile && mobileError(form.whatsappMobile)) next.whatsappMobile = 'Enter the 10-digit WhatsApp number.';
      const careNumbers = splitList(form.customerCareNumber);
      if (!careNumbers.length || careNumbers.length > 5 || careNumbers.some((value) => !/^[6-9]\d{9}$/.test(value.replace(/\D/g, '')))) {
        next.customerCareNumber = 'Enter 1–5 ten-digit mobile numbers, separated by commas.';
      }
      if (splitList(form.emailList).some((value) => !isValidEmail(value))) next.emailList = 'Every entry must be an email address.';
      if (splitList(form.websiteList).some((value) => !/^https?:\/\/\S+\.\S+/i.test(value))) next.websiteList = 'Every website must start with https://';
      if (splitList(form.phoneList).some((value) => !/^(?=(?:\D*\d){7,15}\D*$)[+\d\s()-]{7,25}$/.test(value))) next.phoneList = 'Every entry must be a phone number.';
    }
    if (tab === 'reach') {
      if (!form.vehicleAccess) next.vehicleAccess = 'Choose whether a vehicle can reach the entrance.';
      if (!form.vehicleTypeMode) next.vehicleTypeMode = 'Choose which vehicle types can reach the property.';
      if (form.vehicleTypeMode === 'selected' && !form.vehicleTypes.length) next.vehicleTypes = 'Select at least one vehicle type.';
      const length = form.directions.trim().length;
      if (length < 100 || length > 1200) next.directions = `Directions must be 100–1200 characters (now ${length}).`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async () => {
    setStatus(null);
    if (!validate()) {
      setStatus({ type: 'error', message: 'Fix the highlighted fields, then save again.' });
      return;
    }
    setSaving(true);
    try {
      let saved;
      if (tab === 'details') {
        saved = await saveInformationDetails(property.id, {
          propertyName: form.propertyName.trim(),
          displayName: form.displayName.trim(),
          description: form.description.trim() || undefined,
          type: form.propertyType,
          starRating: Number(form.starRating),
          hotelChain: form.hotelChainName || undefined,
          builtYear: Number(form.yearOfConstruction),
          bookingSince: Number(form.acceptingBookingsSince),
          restaurantCount: countOf(form.restaurants),
          floorCount: countOf(form.floors),
          currency: form.currency,
          timezone: form.timezone,
          checkInTime: form.checkInTime,
          checkOutTime: form.checkOutBefore,
          has24HourCheckIn: form.twentyFourHourCheckIn,
          authorized: form.authorized,
        });
      } else if (tab === 'contact') {
        saved = await saveInformationContacts(property.id, {
          email: form.hotelEmail.trim(),
          mobile: form.hotelMobile.trim(),
          landline: form.hotelPhone.trim() || undefined,
          customerCareNumbers: splitList(form.customerCareNumber),
          phones: splitList(form.phoneList),
          emails: splitList(form.emailList),
          websites: splitList(form.websiteList),
          whatsappSameAsMobile: form.whatsappSameAsMobile,
          whatsappMobile: form.whatsappSameAsMobile ? undefined : form.whatsappMobile.trim(),
        });
      } else {
        saved = await saveInformationReach(property.id, {
          vehicleReachesEntrance: form.vehicleAccess === 'yes',
          allVehicleTypes: form.vehicleTypeMode === 'all',
          vehicleTypes: form.vehicleTypeMode === 'all' ? [] : form.vehicleTypes,
          directions: form.directions.trim(),
        });
      }
      onInformationChange?.(saved);
      // Only this tab's fields come back from the server; keep the others' edits.
      const fresh = formFromInformation(saved);
      const keys = TAB_FIELDS[tab];
      const next = { ...form, ...Object.fromEntries(keys.map((key) => [key, fresh[key]])), authorized: false };
      setForm(next);
      setSavedForm((current) => ({ ...current, ...Object.fromEntries(keys.map((key) => [key, fresh[key]])) }));
      setErrors({});
      setStatus({ type: 'success', message: 'Changes saved.' });
    } catch (problem) {
      const fieldErrors = fieldErrorsOf(problem);
      setErrors(fieldErrors);
      setStatus({ type: 'error', message: Object.keys(fieldErrors).length ? 'Fix the highlighted fields, then save again.' : problem?.message || 'Could not save changes. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    const keys = TAB_FIELDS[tab];
    setForm((current) => ({ ...current, ...Object.fromEntries(keys.map((key) => [key, savedForm[key]])), authorized: false }));
    setErrors({});
    setStatus(null);
  };

  const markVerified = (field, value) => {
    setVerified((current) => ({ ...current, [field]: field === 'email' ? value.trim().toLowerCase() : value.trim() }));
    setErrors((current) => ({ ...current, [field === 'email' ? 'hotelEmail' : 'hotelMobile']: undefined }));
    setStatus({ type: 'success', message: `${field === 'email' ? 'Email' : 'Mobile number'} verified. Save to apply it.` });
  };

  const sendReport = async () => {
    if (reportText.trim().length < 10) {
      setStatus({ type: 'error', message: 'Describe the problem in at least 10 characters.' });
      return;
    }
    setReporting(true);
    try {
      await reportLocation(property.id, reportText.trim());
      setReportText('');
      setDialog(null);
      setStatus({ type: 'success', message: 'Location report sent to the TriponX team.' });
    } catch (problem) {
      setStatus({ type: 'error', message: problem?.message || 'Could not send the report.' });
    } finally {
      setReporting(false);
    }
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
                  <SelectField label="Property Type" value={form.propertyType} onChange={(value) => setField('propertyType', value)} options={typeOptions} error={errors.propertyType} required />
                  <SelectField label="Star Rating" value={form.starRating} onChange={(value) => setField('starRating', value)} options={STAR_RATING_OPTIONS} error={errors.starRating} required />
                  <SelectField label="Hotel Chain Name" value={form.hotelChainName} onChange={(value) => setField('hotelChainName', value)} options={HOTEL_CHAIN_OPTIONS} />
                </div>
              </SectionCard>

              <SectionCard icon={ClipboardList} title="Property Configuration" subtitle="Operational configuration for this property.">
                <div className="pbi-grid">
                  <ResponsiveSelectField label="Year of Construction" labelClassName="pbi-label" className="pbi-year" required value={form.yearOfConstruction} onChange={(event) => setField('yearOfConstruction', event.target.value)} options={BUILT_YEAR_OPTIONS} error={errors.yearOfConstruction} />
                  <ResponsiveSelectField label="Accepting Bookings Since" labelClassName="pbi-label" className="pbi-year" required value={form.acceptingBookingsSince} onChange={(event) => setField('acceptingBookingsSince', event.target.value)} options={BOOKING_YEAR_OPTIONS} error={errors.acceptingBookingsSince} />
                  <TextField label="Number of Restaurants" type="number" min="0" value={form.restaurants} onChange={(value) => setField('restaurants', value)} error={errors.restaurants} />
                  <TextField label="Number of Rooms" type="number" value={form.rooms} onChange={() => {}} readOnly hint="Total of all room types (Rooms & Rateplans)." />
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
                {emailNeedsCode && isValidEmail(form.hotelEmail) ? <ContactVerify propertyId={property.id} field="email" value={form.hotelEmail.trim()} onVerified={markVerified} /> : null}
                {mobileNeedsCode && !mobileError(form.hotelMobile) ? <ContactVerify propertyId={property.id} field="mobile" value={form.hotelMobile.trim()} onVerified={markVerified} /> : null}
                <label className="pbi-check-row">
                  <input type="checkbox" checked={form.whatsappSameAsMobile} onChange={(event) => setField('whatsappSameAsMobile', event.target.checked)} />
                  <span><strong>Use the same mobile number for WhatsApp</strong><small>Guests and TriponX reach you on WhatsApp at this number.</small></span>
                </label>
                {!form.whatsappSameAsMobile ? (
                  <div className="pbi-grid">
                    <TextField label="WhatsApp Number" type="tel" value={form.whatsappMobile} onChange={(value) => setField('whatsappMobile', value)} error={errors.whatsappMobile} required inputMode="numeric" maxLength={10} />
                  </div>
                ) : null}
              </SectionCard>

              <SectionCard icon={ClipboardList} title="Additional Contact Information" subtitle="Separate multiple entries with commas.">
                <div className="pbi-grid">
                  <TextField label="Phone List" value={form.phoneList} onChange={(value) => setField('phoneList', value)} error={errors.phoneList} placeholder="02212345678, 02287654321" />
                  <TextField label="Website List" value={form.websiteList} onChange={(value) => setField('websiteList', value)} error={errors.websiteList} placeholder="https://hotel.example, https://book.example" />
                  <TextField label="Email List" value={form.emailList} onChange={(value) => setField('emailList', value)} error={errors.emailList} placeholder="reservations@hotel.example, sales@hotel.example" />
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

          <SaveBar onCancel={cancel} onSave={save} saving={saving} disabled={!dirty || (tab === 'details' && !form.authorized)} note={dirty ? 'You have unsaved changes.' : ''} />
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
                <textarea rows={5} maxLength={1000} value={reportText} onChange={(event) => setReportText(event.target.value)} placeholder="Describe the correct location or landmark…" aria-label="What is wrong with the location" />
                <button type="button" className="pbi-btn is-full" disabled={reporting || reportText.trim().length < 10} onClick={sendReport}>{reporting ? 'Sending…' : 'Send report'}</button>
              </>
            )}
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
