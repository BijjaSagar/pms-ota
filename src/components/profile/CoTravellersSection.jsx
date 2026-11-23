// Ported from pms-ota/src/components/profile/CoTravellersSection.tsx (TriponX styling).
import { Mail, MapPin, Pencil, Phone, Plus, Trash2, UserRound } from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  countryOptions, genderOptions, mealPreferenceOptions, nationalityOptions, relationshipOptions,
} from '../../lib/data/profile.js';
import { formatDate } from '../../lib/utils/date.js';
import { isValidEmail, isValidPhone } from '../../lib/utils/validation.js';
import { Badge } from '../ui/Badge.jsx';
import { SelectField, TextField } from '../Layout.jsx';
import { PortalModal as Modal } from './PortalModal.jsx';
import { SectionCard } from './SectionCard.jsx';
import { revealFirstError } from '../../lib/utils/revealError.js';

const opts = (list) => list.map((o) => [o, o]);

function fullName(t) {
  return [t.firstName, t.middleName, t.lastName].filter(Boolean).join(' ');
}
function initials(t) {
  return `${t.firstName.charAt(0)}${t.lastName.charAt(0)}`.toUpperCase() || 'CT';
}
const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

function createEmptyCoTraveller() {
  return {
    id: newId(), firstName: '', middleName: '', lastName: '', gender: 'Female', dob: '', nationality: 'Indian',
    relationship: 'Spouse', mealPreference: 'No preference', countryName: 'India', countryCode: '+91', mobile: '', email: '',
  };
}

export function CoTravellersSection({ travellers, onSave, onRemove }) {
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [removeTarget, setRemoveTarget] = useState(null);

  const openAdd = () => { setDraft(createEmptyCoTraveller()); setErrors({}); setFormOpen(true); };
  const openEdit = (t) => { setDraft({ ...t }); setErrors({}); setFormOpen(true); };
  const closeForm = useCallback(() => { setFormOpen(false); setDraft(null); setErrors({}); }, []);
  const closeRemove = useCallback(() => setRemoveTarget(null), []);

  const setField = (key, value) => {
    setDraft((c) => (c ? { ...c, [key]: value } : c));
    setErrors((c) => ({ ...c, [key]: undefined }));
  };
  const handleCountry = (name) => {
    const country = countryOptions.find((o) => o.name === name);
    if (!country) return;
    setDraft((c) => (c ? { ...c, countryName: country.name, countryCode: country.code } : c));
  };

  const handleSave = (event) => {
    event.preventDefault();
    if (!draft) return;
    const next = {};
    if (!draft.firstName.trim()) next.firstName = 'First name is required.';
    if (!draft.lastName.trim()) next.lastName = 'Last name is required.';
    if (!draft.email.trim()) next.email = 'Email address is required.';
    else if (!isValidEmail(draft.email)) next.email = 'Enter a valid email address.';
    if (!draft.mobile.trim()) next.mobile = 'Mobile number is required.';
    else if (!isValidPhone(draft.mobile)) next.mobile = 'Enter a valid mobile number.';
    setErrors(next);
    if (Object.keys(next).length > 0) { revealFirstError(); return; }
    onSave({
      ...draft,
      firstName: draft.firstName.trim(), middleName: draft.middleName.trim(), lastName: draft.lastName.trim(),
      email: draft.email.trim(), mobile: draft.mobile.trim(),
    });
    closeForm();
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    onRemove(removeTarget.id);
    setRemoveTarget(null);
  };

  const editing = draft && travellers.some((item) => item.id === draft.id);

  return (
    <div className="col-gap-14">
      <SectionCard
        title="Co-travellers"
        description="Save the people you travel with so checkout is faster next time."
        action={<button type="button" className="pill-btn dark" onClick={openAdd}><Plus size={14} aria-hidden="true" />Add co-traveller</button>}
      >
        <div className="rail-grid">
          {travellers.map((t) => (
            <article key={t.id} className="card person">
              <div className="person-head">
                <span className="person-initials">{initials(t)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 className="person-name">{fullName(t)}</h3>
                  <p className="muted-xs">{t.gender} · {t.nationality}</p>
                </div>
                <Badge tone="accent">{t.relationship}</Badge>
              </div>
              <div className="trip-facts">
                <span className="fact-pill">Born {formatDate(t.dob)}</span>
                <span className="fact-pill">{t.mealPreference}</span>
              </div>
              <div className="app-list">
                <p className="app-row"><span className="app-row-icon"><Phone size={15} aria-hidden="true" /></span><span className="app-row-main">{t.countryCode} {t.mobile}</span></p>
                <p className="app-row"><span className="app-row-icon"><Mail size={15} aria-hidden="true" /></span><span className="app-row-main" style={{ overflowWrap: 'anywhere' }}>{t.email}</span></p>
                <p className="app-row"><span className="app-row-icon"><MapPin size={15} aria-hidden="true" /></span><span className="app-row-main">{t.countryName}</span></p>
              </div>
              <div className="person-actions">
                <button type="button" className="pill-btn" onClick={() => openEdit(t)}><Pencil size={14} aria-hidden="true" />Edit</button>
                <button type="button" className="pill-btn danger" onClick={() => setRemoveTarget(t)}><Trash2 size={14} aria-hidden="true" />Remove</button>
              </div>
            </article>
          ))}
          <button type="button" className="add-tile" onClick={openAdd}>
            <span>{travellers.length ? <Plus size={20} aria-hidden="true" /> : <UserRound size={20} aria-hidden="true" />}</span>
            {travellers.length ? 'Add co-traveller' : 'No co-travellers yet — add one'}
            {!travellers.length && <small className="muted-xs" style={{ maxWidth: 260 }}>Add the people you usually travel with and their details will be ready at checkout.</small>}
          </button>
        </div>
      </SectionCard>

      {formOpen && draft ? (
        <Modal title={editing ? 'Edit co-traveller' : 'Add co-traveller'} onClose={closeForm} wide>
          <p className="modal-text">Tell us who is travelling so we can share their booking updates too.</p>
          <form onSubmit={handleSave} noValidate className="col-gap-14">
            <div>
              <h3 className="sub-h">General information</h3>
              <div className="form-grid-2">
                <TextField label="First name" value={draft.firstName} onChange={(e) => setField('firstName', e.target.value)} error={errors.firstName} autoComplete="given-name" placeholder="Priya" />
                <TextField label="Middle name" value={draft.middleName} onChange={(e) => setField('middleName', e.target.value)} autoComplete="additional-name" placeholder="Anita" />
                <TextField label="Last name" value={draft.lastName} onChange={(e) => setField('lastName', e.target.value)} error={errors.lastName} autoComplete="family-name" placeholder="Morgan" />
                <SelectField label="Gender" value={draft.gender} onChange={(e) => setField('gender', e.target.value)} options={opts(genderOptions)} />
                <TextField label="Date of birth" type="date" value={draft.dob} onChange={(e) => setField('dob', e.target.value)} autoComplete="bday" />
                <SelectField label="Nationality" value={draft.nationality} onChange={(e) => setField('nationality', e.target.value)} options={opts(nationalityOptions)} />
                <SelectField label="Relationship with traveller" value={draft.relationship} onChange={(e) => setField('relationship', e.target.value)} options={opts(relationshipOptions)} />
                <SelectField label="Meal preference" value={draft.mealPreference} onChange={(e) => setField('mealPreference', e.target.value)} options={opts(mealPreferenceOptions)} />
              </div>
            </div>
            <div className="form-split">
              <h3 className="sub-h">Contact details to receive bookings</h3>
              <div className="form-grid-2">
                <SelectField label="Country" value={draft.countryName} onChange={(e) => handleCountry(e.target.value)}
                  options={countryOptions.map((o) => [o.name, `${o.name} (${o.code})`])} />
                <TextField label="Mobile number" type="tel" value={draft.mobile} onChange={(e) => setField('mobile', e.target.value)} error={errors.mobile}
                  hint={`Country code ${draft.countryCode}`} autoComplete="tel" placeholder="98111 22334" />
                <TextField full label="Email address" type="email" value={draft.email} onChange={(e) => setField('email', e.target.value)} error={errors.email} autoComplete="email" placeholder="priya@example.com" />
              </div>
            </div>
            <div className="form-foot">
              <button type="button" className="btn btn-outline" onClick={closeForm}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editing ? 'Save changes' : 'Add co-traveller'}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {removeTarget ? (
        <Modal title="Remove co-traveller?" onClose={closeRemove}>
          <p className="modal-text">Are you sure you want to remove {fullName(removeTarget)} from your saved co-travellers?</p>
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={() => setRemoveTarget(null)}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={confirmRemove}>Remove</button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
