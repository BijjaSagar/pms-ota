// My profile form — fields & behaviour from pms-ota (MyProfileSection.tsx); TriponX two-column card layout.
import { Camera, Check } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  countryOptions, genderOptions, maritalStatusOptions, nationalityOptions,
} from '../../lib/data/profile.js';
import { SelectField, TextField } from '../Layout.jsx';
import { SectionCard } from './SectionCard.jsx';

const dialCodes = Array.from(new Set(countryOptions.map((c) => c.code)));
const opts = (list) => list.map((o) => [o, o]);
const initials = (f, l) => `${f.charAt(0)}${l.charAt(0)}`.toUpperCase() || 'TX';

export function MyProfileSection({ profile, onChange, onPhotoChange }) {
  const photoInputRef = useRef(null);
  const [saved, setSaved] = useState(false);

  const handlePhoto = (e) => { const f = e.target.files?.[0]; if (f) { onPhotoChange(f); setSaved(false); } e.target.value = ''; };
  const handleSubmit = (e) => { e.preventDefault(); setSaved(true); };

  return (
    <form onSubmit={handleSubmit} className="prof-form">
      <div className="prof-grid">
        <SectionCard title="Profile photo" description="Upload a clear photo so hosts can recognise you on arrival.">
          <div className="photo-stack">
            <div className="avatar-wrap">
              {profile.photoUrl
                ? <img src={profile.photoUrl} alt="Profile photo" className="avatar xl" />
                : <span className="avatar xl">{initials(profile.firstName, profile.lastName)}</span>}
              <button type="button" className="cam" aria-label="Browse photo" onClick={() => photoInputRef.current?.click()}><Camera size={16} /></button>
            </div>
            <div>
              <p className="h3">{profile.firstName} {profile.lastName}</p>
              <p className="muted-sm">{profile.email}</p>
            </div>
            <button type="button" className="pill-btn" onClick={() => photoInputRef.current?.click()}>Browse photo</button>
            <span className="muted-xs">JPG or PNG, up to 5 MB.</span>
            <input ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhoto} />
          </div>
        </SectionCard>

        <SectionCard title="Contact details" description="We will use these to send booking confirmations and updates.">
          <div className="col-gap-14">
            <div className="phone-row">
              <SelectField label="Code" value={profile.mobileCountryCode} onChange={(e) => onChange('mobileCountryCode', e.target.value)} options={opts(dialCodes)} />
              <TextField label="Mobile number" type="tel" value={profile.mobile} onChange={(e) => onChange('mobile', e.target.value)} autoComplete="tel" placeholder="98765 43210" />
            </div>
            <TextField label="Email address" type="email" value={profile.email} onChange={(e) => onChange('email', e.target.value)} autoComplete="email" placeholder="alex@example.com" />
          </div>
        </SectionCard>

        <SectionCard className="span-2" title="General information" description="Keep this exactly as it appears on your ID.">
          <div className="form-grid">
            <TextField label="First name" value={profile.firstName} onChange={(e) => onChange('firstName', e.target.value)} autoComplete="given-name" placeholder="Alex" />
            <TextField label="Middle name" value={profile.middleName} onChange={(e) => onChange('middleName', e.target.value)} autoComplete="additional-name" placeholder="Jordan" />
            <TextField label="Last name" value={profile.lastName} onChange={(e) => onChange('lastName', e.target.value)} autoComplete="family-name" placeholder="Morgan" />
            <SelectField label="Gender" value={profile.gender} onChange={(e) => onChange('gender', e.target.value)} options={opts(genderOptions)} />
            <TextField label="Date of birth" type="date" value={profile.dob} onChange={(e) => onChange('dob', e.target.value)} autoComplete="bday" />
            <SelectField label="Nationality" value={profile.nationality} onChange={(e) => onChange('nationality', e.target.value)} options={opts(nationalityOptions)} />
            <SelectField label="Marital status" value={profile.maritalStatus} onChange={(e) => onChange('maritalStatus', e.target.value)} options={opts(maritalStatusOptions)} />
            <TextField label="City of residence" value={profile.cityOfResidence} onChange={(e) => onChange('cityOfResidence', e.target.value)} autoComplete="address-level2" placeholder="Mumbai" />
            <TextField label="State" value={profile.state} onChange={(e) => onChange('state', e.target.value)} autoComplete="address-level1" placeholder="Maharashtra" />
          </div>
        </SectionCard>
      </div>

      <div className="save-bar">
        {saved
          ? <p className="ok-text" role="status"><Check size={16} aria-hidden="true" />Profile updated</p>
          : <p className="muted-sm">Changes are saved to this profile when you tap save.</p>}
        <button type="submit" className="btn btn-primary btn-sm">Save changes</button>
      </div>
    </form>
  );
}
