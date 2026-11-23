// My profile form — fields from pms-ota (MyProfileSection.tsx); TriponX two-column card layout.
// Saves to PATCH /me/profile. Email and mobile change only through a one-time code (POST /me/contact/otp/*).
import { BadgeCheck, Camera, Check, Mail, Pencil, Phone, Plus } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { genderOptions, maritalStatusOptions, nationalityOptions } from '../../lib/data/profile.js';
import { PHOTO_MAX_BYTES, PHOTO_TYPES } from '../../lib/api/profile.js';
import { useAuth } from '../../lib/context/useAuth.js';
import { revealFirstError } from '../../lib/utils/revealError.js';
import { OTP_LENGTH } from '../../lib/utils/otp.js';
import { OtpInput, emptyOtp } from '../auth/OtpInput.jsx';
import { SelectField, TextField } from '../Layout.jsx';
import { PortalModal as Modal } from './PortalModal.jsx';
import { SectionCard } from './SectionCard.jsx';

const opts = (list) => [['', 'Select'], ...list.map((o) => [o, o])];
const initials = (f, l) => `${(f || '').charAt(0)}${(l || '').charAt(0)}`.toUpperCase() || 'TX';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const LABELS = {
  firstName: 'First name', middleName: 'Middle name', lastName: 'Last name', gender: 'Gender', dob: 'Date of birth',
  nationality: 'Nationality', maritalStatus: 'Marital status', cityOfResidence: 'City of residence', state: 'State',
};
const fieldText = (field, msg) => (/^[A-Z]/.test(msg) ? msg : `${LABELS[field] ?? 'This field'} ${msg}.`.replace(/\.\.$/, '.'));

// ---------- change email / add or change mobile (a code confirms it) ----------
function ContactDialog({ kind, current, onSaved, onClose }) {
  const { traveller } = useAuth();
  const isEmail = kind === 'email';
  const [value, setValue] = useState('');
  const [step, setStep] = useState('enter');
  const [code, setCode] = useState(emptyOtp);
  const [sentTo, setSentTo] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const contact = isEmail ? { email: value.trim().toLowerCase() } : { mobile: value.replace(/\D/g, '').slice(-10) };

  const send = async (e) => {
    e?.preventDefault();
    if (busy) return;
    if (isEmail ? !EMAIL_RE.test(contact.email) : !MOBILE_RE.test(contact.mobile)) {
      setError(isEmail ? 'Enter a valid email address.' : 'Enter a valid 10-digit mobile number.');
      return;
    }
    setBusy(true);
    try {
      const res = await traveller.requestContactOtp(contact);
      setSentTo(res?.destination || (isEmail ? contact.email : `+91 ${contact.mobile}`));
      setCode(emptyOtp()); setError(''); setStep('code');
    } catch (err) {
      const f = err.fieldErrors?.email ?? err.fieldErrors?.mobile;
      setError(f && !/^[A-Z]/.test(f) ? `${isEmail ? 'Email' : 'Mobile number'} ${f}.` : err.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    if (busy) return;
    const otp = code.join('');
    if (otp.length !== OTP_LENGTH) { setError(`Enter the ${OTP_LENGTH}-digit code.`); return; }
    setBusy(true);
    try {
      const profile = await traveller.verifyContactOtp(contact, otp);
      onSaved(profile);
      onClose();
    } catch (err) {
      setError(err.fieldErrors?.otp ? 'That code is wrong or has expired. Check it or ask for a new one.' : err.message);
      setBusy(false);
    }
  };

  const title = isEmail ? 'Change email address' : current ? 'Change mobile number' : 'Add mobile number';
  return (
    <Modal title={title} onClose={onClose}>
      {step === 'enter' ? (
        <form className="auth-form" onSubmit={send} noValidate>
          <p className="modal-text">We’ll send a one-time code to confirm it.{current ? ` Your current ${isEmail ? 'email' : 'number'} stays until then.` : ''}</p>
          {isEmail ? (
            <TextField label="New email address" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
              value={value} onChange={(e) => { setValue(e.target.value); setError(''); }} error={error} autoFocus />
          ) : (
            <TextField label="Mobile number (+91)" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="98765 43210" maxLength={14}
              value={value} onChange={(e) => { setValue(e.target.value.replace(/[^\d\s]/g, '')); setError(''); }} error={error} autoFocus />
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-dark" disabled={busy} aria-busy={busy}>{busy ? 'Sending…' : 'Send code'}</button>
          </div>
        </form>
      ) : (
        <form className="auth-form" onSubmit={verify} noValidate>
          <p className="modal-text">Enter the {OTP_LENGTH}-digit code sent to <strong>{sentTo}</strong>.</p>
          <OtpInput value={code} onChange={(next) => { setCode(next); setError(''); }} invalid={Boolean(error)} />
          {error && <p className="field-error auth-center" role="alert">{error}</p>}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => { setStep('enter'); setError(''); }}>Back</button>
            <button type="submit" className="btn btn-dark" disabled={busy} aria-busy={busy}>{busy ? 'Checking…' : 'Confirm'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function MyProfileSection({ profile, photoSrc, displayName, onChange, onSave, onPhotoChange, onContactSaved }) {
  const photoInputRef = useRef(null);
  const formRef = useRef(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [contact, setContact] = useState(null); // 'email' | 'mobile'
  const closeContact = useCallback(() => setContact(null), []);

  const change = (key) => (e) => {
    onChange(key, e.target.value);
    setSaved(false);
    if (errors[key]) setErrors((c) => ({ ...c, [key]: undefined }));
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) { setPhotoError('Choose a JPG, PNG or WebP image.'); return; }
    if (file.size > PHOTO_MAX_BYTES) { setPhotoError('That photo is larger than 5 MB. Choose a smaller one.'); return; }
    setPhotoError('');
    setPhotoBusy(true);
    try {
      await onPhotoChange(file);
    } catch (err) {
      setPhotoError(err.message || 'Could not upload the photo. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const next = {};
    if (!profile.firstName.trim()) next.firstName = 'Enter your first name.';
    if (!profile.lastName.trim()) next.lastName = 'Enter your last name.';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) { revealFirstError(formRef.current); return; }
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
    } catch (err) {
      const fieldErrs = Object.fromEntries(Object.entries(err.fieldErrors ?? {}).map(([k, v]) => [k, fieldText(k, v)]));
      setErrors(fieldErrs);
      if (Object.keys(fieldErrs).length) revealFirstError(formRef.current);
      else setFormError(err.message || 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <form ref={formRef} onSubmit={handleSubmit} className="prof-form" noValidate>
        <div className="prof-grid">
          <SectionCard title="Profile photo" description="Upload a clear photo so hosts can recognise you on arrival.">
            <div className="photo-stack">
              <div className="avatar-wrap">
                {photoSrc
                  ? <img src={photoSrc} alt="Profile photo" className="avatar xl" />
                  : <span className="avatar xl">{initials(profile.firstName, profile.lastName)}</span>}
                <button type="button" className="cam" aria-label="Browse photo" onClick={() => photoInputRef.current?.click()} disabled={photoBusy}><Camera size={16} /></button>
              </div>
              <div>
                <p className="h3">{displayName}</p>
                <p className="muted-sm">{profile.email}</p>
              </div>
              <button type="button" className="pill-btn" onClick={() => photoInputRef.current?.click()} disabled={photoBusy} aria-busy={photoBusy}>
                {photoBusy ? 'Uploading…' : 'Browse photo'}
              </button>
              {photoError
                ? <span className="field-error" role="alert">{photoError}</span>
                : <span className="muted-xs">JPG, PNG or WebP, up to 5 MB.</span>}
              <input ref={photoInputRef} type="file" accept={PHOTO_TYPES.join(',')} className="sr-only" onChange={handlePhoto} />
            </div>
          </SectionCard>

          <SectionCard title="Contact details" description="We use these to send booking confirmations and updates. Changes are confirmed with a one-time code.">
            <div className="app-list contact-list">
              <div className="app-row">
                <span className="app-row-icon"><Mail size={16} aria-hidden="true" /></span>
                <div className="app-row-main">
                  <p>{profile.email || 'No email added'}</p>
                  {profile.email ? <p className="contact-state">{profile.emailVerified ? <><BadgeCheck size={13} aria-hidden="true" />Verified</> : 'Not verified'}</p> : null}
                </div>
                <button type="button" className="pill-btn" onClick={() => setContact('email')}>
                  {profile.email ? <><Pencil size={13} aria-hidden="true" />Change</> : <><Plus size={13} aria-hidden="true" />Add</>}
                </button>
              </div>
              <div className="app-row">
                <span className="app-row-icon"><Phone size={16} aria-hidden="true" /></span>
                <div className="app-row-main">
                  <p>{profile.mobile ? `${profile.mobileCountryCode} ${profile.mobile}` : 'No mobile number added'}</p>
                  {profile.mobile ? <p className="contact-state">{profile.mobileVerified ? <><BadgeCheck size={13} aria-hidden="true" />Verified</> : 'Not verified'}</p> : null}
                </div>
                <button type="button" className="pill-btn" onClick={() => setContact('mobile')}>
                  {profile.mobile ? <><Pencil size={13} aria-hidden="true" />Change</> : <><Plus size={13} aria-hidden="true" />Add</>}
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard className="span-2" title="General information" description="Keep this exactly as it appears on your ID.">
            <div className="form-grid">
              <TextField label="First name" value={profile.firstName} onChange={change('firstName')} error={errors.firstName} autoComplete="given-name" placeholder="Alex" maxLength={60} />
              <TextField label="Middle name" value={profile.middleName} onChange={change('middleName')} error={errors.middleName} autoComplete="additional-name" placeholder="Jordan" maxLength={60} />
              <TextField label="Last name" value={profile.lastName} onChange={change('lastName')} error={errors.lastName} autoComplete="family-name" placeholder="Morgan" maxLength={60} />
              <SelectField label="Gender" value={profile.gender} onChange={change('gender')} options={opts(genderOptions)} error={errors.gender} />
              <TextField label="Date of birth" type="date" value={profile.dob} onChange={change('dob')} error={errors.dob} autoComplete="bday" max={today} />
              <SelectField label="Nationality" value={profile.nationality} onChange={change('nationality')} options={opts(nationalityOptions)} error={errors.nationality} />
              <SelectField label="Marital status" value={profile.maritalStatus} onChange={change('maritalStatus')} options={opts(maritalStatusOptions)} error={errors.maritalStatus} />
              <TextField label="City of residence" value={profile.cityOfResidence} onChange={change('cityOfResidence')} error={errors.cityOfResidence} autoComplete="address-level2" placeholder="Mumbai" maxLength={80} />
              <TextField label="State" value={profile.state} onChange={change('state')} error={errors.state} autoComplete="address-level1" placeholder="Maharashtra" maxLength={80} />
            </div>
          </SectionCard>
        </div>

        <div className="save-bar">
          {formError
            ? <p className="field-error" role="alert">{formError}</p>
            : saved
              ? <p className="ok-text" role="status"><Check size={16} aria-hidden="true" />Profile updated</p>
              : <p className="muted-sm">Changes are saved to your account when you tap save.</p>}
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving} aria-busy={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>

      {/* Outside the profile <form>: React submit events bubble through portals, so a nested form would also save the profile. */}
      {contact ? (
        <ContactDialog kind={contact} current={contact === 'email' ? profile.email : profile.mobile}
          onSaved={onContactSaved} onClose={closeContact} />
      ) : null}
    </>
  );
}
