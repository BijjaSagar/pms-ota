import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Info, Lock, MapPin, Star } from 'lucide-react';
import { SelectField, TextField } from '../Layout.jsx';
import { PortalModal } from '../profile/PortalModal.jsx';
import { OtpInput, emptyOtp } from '../auth/OtpInput.jsx';
import { PARTNER_PATHS } from './paths.js';
import { useAuth } from '../../lib/context/useAuth.js';
import {
  EMPTY_BASIC_INFO, PROPERTY_INFO_SECTIONS, PROPERTY_RATINGS,
  getPropertyDraft, savePropertyDraft, validateBasicInfo,
} from '../../lib/data/partner.js';
import { isValidEmail, isValidPhone } from '../../lib/utils/validation.js';
import { OTP_LENGTH, todayOtp, verifyOtp } from '../../lib/utils/otp.js';
import '../../styles/auth.css';
import '../../styles/partner.css';

const RESEND_SECONDS = 30;

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

function ProgressRail({ basicComplete, activeSection, onSelect }) {
  return (
    <aside className="pi-rail" aria-label="Property information progress">
      <div className="pi-rail-head">
        <span className="pi-rail-eyebrow">Listing setup</span>
        <h2 className="pi-rail-title">Property information</h2>
        <div className="pi-progress" role="progressbar" aria-label="Sections completed" aria-valuenow={1} aria-valuemin={0} aria-valuemax={PROPERTY_INFO_SECTIONS.length}>
          <span />
        </div>
        <p className="pi-progress-label">1 of {PROPERTY_INFO_SECTIONS.length} sections complete</p>
      </div>
      <ol className="pi-steps">
        {PROPERTY_INFO_SECTIONS.map((section, index) => {
          const isBasic = section.id === 'basic';
          const isLocation = section.id === 'location';
          const done = isBasic && basicComplete;
          const locked = !isBasic && !(isLocation && basicComplete);
          const active = isBasic ? activeSection === 'basic' : isLocation && activeSection === 'location';
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
                    {done ? 'Complete' : isBasic ? 'In progress' : (
                      <span className="pi-soon">
                        {locked && <Lock size={10} aria-hidden="true" />}Coming soon
                      </span>
                    )}
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

export function PropertyInfoPage({ type, typeLabel }) {
  const { user } = useAuth();
  const formRef = useRef(null);
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

  const onSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateBasicInfo(info);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector('.has-error input, .has-error select')?.focus());
      return;
    }
    try {
      savePropertyDraft(user?.id, type, { basic: info });
      setBasicComplete(true);
      setNotice({ kind: 'success', text: 'Basic info saved. Location is now unlocked and coming soon.' });
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
      <ProgressRail basicComplete={basicComplete} activeSection={activeSection} onSelect={selectSection} />
      <div className="pi-content">
        {activeSection === 'location' ? (
          <>
            <header className="pi-hero">
              <span className="pi-hero-kicker">Property profile</span>
              <h2>Location</h2>
              {typeLabel && <span className="pi-type-chip"><MapPin size={14} aria-hidden="true" />{typeLabel}</span>}
            </header>
            {noticeMarkup}
            <section className="pi-soon-panel" aria-labelledby="pi-location-soon-title">
              <span className="pi-soon-icon"><MapPin size={26} aria-hidden="true" /></span>
              <h3 id="pi-location-soon-title">Location details are coming soon</h3>
              <p>Address, map pin, nearby landmarks and accessibility details will be added here in the next step.</p>
              <button type="button" className="btn btn-primary" onClick={() => selectSection('basic')}>Back to Basic info</button>
            </section>
          </>
        ) : (
          <>
            <header className="pi-hero">
              <span className="pi-hero-kicker">Property profile</span>
              <h2>Basic info</h2>
              {typeLabel && <span className="pi-type-chip"><Building2 size={14} aria-hidden="true" />{typeLabel}</span>}
            </header>
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
                  <SelectField label="Accepting bookings since" value={info.bookingSince} onChange={set('bookingSince')} options={bookingYears} error={errors.bookingSince} />
                  <SelectField label="Property built year" value={info.builtYear} onChange={set('builtYear')} options={years} error={errors.builtYear} />
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
