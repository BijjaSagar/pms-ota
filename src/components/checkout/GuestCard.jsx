// "Who's checking in" — TriponX form card carrying pms-ota's full guest model:
// guest type, title, names, email, mobile, additional guests, GST invoice details.
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { SelectField, TextField } from '../Layout.jsx';
import '../../styles/checkout.css';

const TITLES = ['Mr', 'Ms', 'Mrs', 'Dr', 'Mx'].map((t) => [t, t]);

export function GuestCard({ form, errors, onChange, onAddGuest, onRemoveGuest, onChangeGuest, maxGuests = 6 }) {
  const [wantsGst, setWantsGst] = useState(Boolean(form.gstNumber || form.gstBusinessName));
  const self = form.guestType === 'self';
  const canAddGuest = form.additionalGuests.length < Math.max(0, maxGuests - 1);
  const invalid = (k) => ({ error: errors[k], 'aria-invalid': Boolean(errors[k]) });

  return (
    <section className="card card-lg">
      <div className="co-card-head">
        <h2 className="h-card-lg co-title">Who's checking in</h2>
        <div className="co-seg" role="group" aria-label="Who is staying">
          <button type="button" aria-pressed={self} className={`seg-btn ${self ? 'is-active' : ''}`} onClick={() => onChange('guestType', 'self')}>I'm the guest</button>
          <button type="button" aria-pressed={!self} className={`seg-btn ${!self ? 'is-active' : ''}`} onClick={() => onChange('guestType', 'someone')}>Someone else</button>
        </div>
      </div>
      <p className="muted-sm mb-16">{self ? 'As on your ID. The hotel will ask to see it at check-in.' : 'Enter the guest’s details exactly as on their ID.'}</p>

      <div className="co-guest-main">
        <SelectField label="Title" value={form.title} onChange={(e) => onChange('title', e.target.value)} options={TITLES} />
        <TextField label="First name" value={form.firstName} onChange={(e) => onChange('firstName', e.target.value)}
          {...invalid('firstName')} autoComplete="given-name" placeholder="As on ID" />
        <TextField label="Last name" value={form.lastName} onChange={(e) => onChange('lastName', e.target.value)}
          {...invalid('lastName')} autoComplete="family-name" placeholder="As on ID" />
      </div>
      <div className="grid-auto-240 gap-14 co-mt-sm">
        <TextField label={self ? 'Mobile (for WhatsApp updates)' : 'Guest mobile'} type="tel" value={form.phone}
          onChange={(e) => onChange('phone', e.target.value)} {...invalid('phone')} autoComplete="tel" placeholder="+91 98xxx xxxxx" />
        <TextField label={self ? 'Email' : 'Guest email'} type="email" value={form.email}
          onChange={(e) => onChange('email', e.target.value)} {...invalid('email')} autoComplete="email" placeholder="you@email.com"
          hint="Your confirmation is sent here." />
      </div>

      {form.additionalGuests.length > 0 && (
        <div className="co-guests">
          {form.additionalGuests.map((g, i) => (
            <div key={g.id} className="co-guest-row">
              <span className="co-guest-num">Guest {i + 2}</span>
              <SelectField label="Title" value={g.title} onChange={(e) => onChangeGuest(g.id, { title: e.target.value })} options={TITLES} />
              <TextField label="First name" value={g.firstName} onChange={(e) => onChangeGuest(g.id, { firstName: e.target.value })} />
              <TextField label="Last name" value={g.lastName} onChange={(e) => onChangeGuest(g.id, { lastName: e.target.value })} />
              <button type="button" className="icon-btn co-guest-remove" aria-label={`Remove guest ${i + 2}`} onClick={() => onRemoveGuest(g.id)}><X size={16} /></button>
            </div>
          ))}
        </div>
      )}
      {errors.additionalGuests && <p className="field-error co-mt-sm" role="alert">{errors.additionalGuests}</p>}

      <div className="co-guest-actions">
        <button type="button" className="btn-mini co-mini" onClick={onAddGuest} disabled={!canAddGuest}>
          <Plus size={14} aria-hidden="true" />Add another guest
        </button>
        <span className="muted-xs">This room sleeps up to {maxGuests}.</span>
      </div>

      <label className="check-row co-mt-sm">
        <input type="checkbox" checked={wantsGst} onChange={(e) => {
          setWantsGst(e.target.checked);
          if (!e.target.checked) { onChange('gstNumber', ''); onChange('gstBusinessName', ''); }
        }} />
        I need a GST invoice for business
      </label>
      {wantsGst && (
        <div className="grid-auto-240 gap-14 co-mt-sm">
          <TextField label="GSTIN" value={form.gstNumber} onChange={(e) => onChange('gstNumber', e.target.value.toUpperCase())}
            {...invalid('gstNumber')} placeholder="22AAAAA0000A1Z5" maxLength={15} autoComplete="off" />
          <TextField label="Business name" value={form.gstBusinessName} onChange={(e) => onChange('gstBusinessName', e.target.value)}
            placeholder="Registered business name" autoComplete="organization" />
        </div>
      )}
    </section>
  );
}
