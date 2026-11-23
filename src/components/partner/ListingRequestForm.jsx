// 3-step "list a property" request (Property -> Contact -> Review). Used by "Add a property"
// (/list-property/new). Needs a signed-in user. `doneLink` = where the success screen sends the partner.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Pencil } from 'lucide-react';
import { SelectField, TextField } from '../Layout.jsx';
import { useAuth } from '../../lib/context/useAuth.js';
import {
  EMPTY_LEAD, PROPERTY_TYPES, ROOM_RANGES, submitPartnerLead, validateLead,
} from '../../lib/data/partner.js';
import { revealFirstError } from '../../lib/utils/revealError.js';
import '../../styles/account.css';
import '../../styles/partner.css';

// Wizard steps and the fields each one validates.
const STEPS = [
  { key: 'property', label: 'Property', fields: ['propertyName', 'propertyType', 'rooms', 'city', 'website'] },
  { key: 'contact', label: 'Contact', fields: ['contactName', 'email', 'phone', 'consent'] },
  { key: 'review', label: 'Review', fields: [] },
];

const optionLabel = (options, value) => options.find(([v]) => v === value)?.[1] ?? '—';

// Prefill contact details from the signed-in account, without overwriting anything typed.
function withAccountDetails(lead, user) {
  if (!user) return lead;
  return {
    ...lead,
    contactName: lead.contactName || user.name || '',
    email: lead.email || user.email || '',
    phone: lead.phone || (user.phone ? `+91 ${user.phone}` : ''),
  };
}

function pick(errors, keys) {
  return Object.fromEntries(Object.entries(errors).filter(([k]) => keys.includes(k)));
}

// initialType: property type chosen in the PropertyTypePicker step (still editable in the form).
export function ListingRequestForm({ doneLink = { to: '/', label: 'Go to TriponX' }, initialType = '' }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [lead, setLead] = useState(() => withAccountDetails({ ...EMPTY_LEAD, propertyType: initialType }, user));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | submitting | done | error
  const [reference, setReference] = useState('');
  const rootRef = useRef(null);

  // Signing in (here or in another tab) fills in the contact step.
  useEffect(() => { if (user) setLead((l) => withAccountDetails(l, user)); }, [user]);

  const focusFirstError = () => revealFirstError(rootRef.current);

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setLead((l) => ({ ...l, [key]: value }));
    if (errors[key]) setErrors(({ [key]: _omit, ...rest }) => rest);
  };

  const goTo = (i) => {
    setStep(i);
    setErrors({});
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  };

  const next = () => {
    const stepErrors = pick(validateLead(lead), STEPS[step].fields);
    setErrors(stepErrors);
    if (Object.keys(stepErrors).length) { focusFirstError(); return; }
    goTo(step + 1);
  };

  const submit = async () => {
    if (status === 'submitting') return;
    const all = validateLead(lead);
    if (Object.keys(all).length) {
      // Shouldn't happen after the per-step checks, but never trust the UI path: jump to the broken step.
      const bad = STEPS.findIndex((s) => s.fields.some((f) => all[f]));
      setStep(bad);
      setErrors(pick(all, STEPS[bad].fields));
      focusFirstError();
      return;
    }
    setStatus('submitting');
    try {
      const res = await submitPartnerLead(lead, user);
      setReference(res.reference);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  const startAnother = () => {
    setLead(withAccountDetails({ ...EMPTY_LEAD, propertyType: initialType }, user));
    setErrors({}); setReference(''); setStatus('idle'); setStep(0);
  };

  const firstName = (user?.name || '').trim().split(' ')[0];

  if (status === 'done') {
    return (
      <div className="lp-success" role="status" aria-live="polite" ref={rootRef}>
        <span className="lp-success-icon"><CheckCircle2 size={28} aria-hidden="true" /></span>
        <h2 className="lp-panel-title">Request received{firstName ? `, ${firstName}` : ''}!</h2>
        <p className="muted-sm">
          A partner manager will contact you at <strong>{lead.email.trim()}</strong> within one working day
          to verify <strong>{lead.propertyName.trim()}</strong>.
        </p>
        <p className="lp-ref">Request ID <span className="ref-code">{reference}</span></p>
        <div className="lp-actions">
          <Link to={doneLink.to} className="btn btn-primary">{doneLink.label}</Link>
          <button type="button" className="btn btn-light" onClick={startAnother}>List another property</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef}>
      <ol className="lp-wizard" aria-label="Listing progress">
        {STEPS.map((s, i) => (
          <li key={s.key} className={i < step ? 'done' : i === step ? 'current' : ''} aria-current={i === step ? 'step' : undefined}>
            <span className="lp-wizard-dot">{i < step ? <Check size={13} aria-hidden="true" /> : i + 1}</span>
            {s.label}
          </li>
        ))}
      </ol>

      <form noValidate onSubmit={(e) => { e.preventDefault(); if (step < STEPS.length - 1) next(); else submit(); }}>
        {step === 0 && (
          <>
            <h2 className="lp-panel-title">About your property</h2>
            <div className="form-grid-2 lp-grid">
              <TextField full label="Property name" value={lead.propertyName} onChange={set('propertyName')}
                error={errors.propertyName} autoComplete="organization" placeholder="e.g. The Lake House" />
              <SelectField label="Property type" value={lead.propertyType} onChange={set('propertyType')}
                options={PROPERTY_TYPES} error={errors.propertyType} />
              <SelectField label="Rooms" value={lead.rooms} onChange={set('rooms')} options={ROOM_RANGES} error={errors.rooms} />
              <TextField label="City" value={lead.city} onChange={set('city')}
                error={errors.city} autoComplete="address-level2" placeholder="e.g. Udaipur" />
              <TextField label="Website (optional)" value={lead.website} onChange={set('website')}
                error={errors.website} inputMode="url" placeholder="www.yourhotel.com" />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="lp-panel-title">How can we reach you?</h2>
            <div className="form-grid-2 lp-grid">
              <TextField full label="Full name" value={lead.contactName} onChange={set('contactName')}
                error={errors.contactName} autoComplete="name" />
              <TextField label="Work email" type="email" value={lead.email} onChange={set('email')}
                error={errors.email} autoComplete="email" />
              <TextField label="Phone" type="tel" value={lead.phone} onChange={set('phone')}
                error={errors.phone} autoComplete="tel" placeholder="+91 98765 43210" />
              <TextField full as="textarea" rows={3} label="Anything we should know? (optional)"
                value={lead.message} onChange={set('message')} maxLength={500} hint={`${lead.message.length}/500`} />
            </div>
            <label className={`lp-consent ${errors.consent ? 'has-error' : ''}`}>
              <input type="checkbox" checked={lead.consent} onChange={set('consent')} />
              <span>I agree to be contacted by TriponX about listing this property.</span>
            </label>
            {errors.consent && <p className="field-error lp-consent-error" role="alert">{errors.consent}</p>}
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="lp-panel-title">Check and submit</h2>
            <div className="lp-review">
              <div className="lp-review-block">
                <div className="lp-review-head"><strong>Property</strong>
                  <button type="button" className="auth-link" onClick={() => goTo(0)}><Pencil size={13} aria-hidden="true" />Edit</button></div>
                <dl>
                  <div><dt>Name</dt><dd>{lead.propertyName}</dd></div>
                  <div><dt>Type</dt><dd>{optionLabel(PROPERTY_TYPES, lead.propertyType)}</dd></div>
                  <div><dt>Rooms</dt><dd>{optionLabel(ROOM_RANGES, lead.rooms)}</dd></div>
                  <div><dt>City</dt><dd>{lead.city}</dd></div>
                  {lead.website && <div><dt>Website</dt><dd>{lead.website}</dd></div>}
                </dl>
              </div>
              <div className="lp-review-block">
                <div className="lp-review-head"><strong>Contact</strong>
                  <button type="button" className="auth-link" onClick={() => goTo(1)}><Pencil size={13} aria-hidden="true" />Edit</button></div>
                <dl>
                  <div><dt>Name</dt><dd>{lead.contactName}</dd></div>
                  <div><dt>Email</dt><dd>{lead.email}</dd></div>
                  <div><dt>Phone</dt><dd>{lead.phone}</dd></div>
                </dl>
              </div>
            </div>
            {status === 'error' && <p className="field-error mt-12" role="alert">Something went wrong sending your details. Please try again.</p>}
          </>
        )}

        <div className="lp-wizard-nav">
          {step > 0
            ? <button type="button" className="btn btn-light" onClick={() => goTo(step - 1)}><ArrowLeft size={16} aria-hidden="true" />Back</button>
            : <span />}
          <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
            {step < STEPS.length - 1 && <>Continue<ArrowRight size={16} aria-hidden="true" /></>}
            {step === STEPS.length - 1 && (status === 'submitting'
              ? <><Loader2 size={16} className="lp-spin" aria-hidden="true" />Sending…</>
              : <>Submit request<ArrowRight size={16} aria-hidden="true" /></>)}
          </button>
        </div>
      </form>
    </div>
  );
}
