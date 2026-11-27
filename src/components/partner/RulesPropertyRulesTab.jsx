import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Save, Search } from 'lucide-react';
import { MASTER_LISTS } from '../../lib/data/partner.js';

// Rules & Policies > Property Rules. Every Yes/No is required; the details of
// a "Yes" appear under it and are required with it (the server clears them
// on a "No").

const PET_FREQUENCIES = [['per-day', 'Per day'], ['per-night', 'Per night'], ['per-stay', 'Per stay']];
const PET_AREAS = [['guest-rooms', 'Guest rooms'], ['restaurant', 'Restaurant'], ['pool', 'Pool'], ['lobby', 'Lobby'], ['terrace', 'Terrace']];
const EXTRA_BED_INCLUSION = [['both', 'Extra adult and extra paid child'], ['adult', 'Extra adult only']];
const MONEY = /^\d{1,6}(\.\d{1,2})?$/;

const YES_NO = [
  'unmarriedCouples', 'below18', 'maleGroupOnly', 'sameCityIdsAllowed', 'smokingAllowed', 'privateParties',
  'wheelchairAccess', 'outsideVisitors', 'petLivingOnProperty', 'petsAllowed', 'petFoodAvailable',
  'petChargesEnabled', 'petLeashRequired', 'has24HourPolicy', 'includeInfant', 'infantCountedInOccupancy',
  'infantFoodProvided', 'extraBedIncluded', 'extraBedForAdults', 'extraBedForKids',
];
const LISTS = ['identityProofs', 'petTypes', 'petRestrictedAreas', 'infantFoodOptions'];

const LABELS = {
  unmarriedCouples: 'Are unmarried couples allowed?',
  below18: 'Are guests below 18 years allowed?',
  maleGroupOnly: 'Are groups of only men allowed?',
  identityProofs: 'Acceptable identity proofs',
  sameCityIdsAllowed: 'Are IDs from the same city as the property accepted?',
  smokingAllowed: 'Is smoking allowed in the property?',
  privateParties: 'Are private parties or events allowed?',
  wheelchairAccess: 'Is the property wheelchair accessible?',
  outsideVisitors: 'Are outside visitors allowed in rooms?',
  petLivingOnProperty: 'Do pets live at the property?',
  petsAllowed: 'Are guests’ pets allowed?',
  petFoodAvailable: 'Is pet food available?',
  petTypes: 'Which pets are allowed?',
  petChargesEnabled: 'Is there a charge for pets?',
  petChargeAmount: 'Pet charge (₹)',
  petChargeFrequency: 'Charged',
  petRestrictedAreas: 'Areas where pets are not allowed (optional)',
  petLeashRequired: 'Must pets be on a leash?',
  maxPets: 'Most pets per booking',
  has24HourPolicy: 'Do you offer 24-hour check-in?',
  includeInfant: 'Are infants (0–2 years) allowed?',
  infantCountedInOccupancy: 'Are infants counted in room occupancy?',
  infantFoodProvided: 'Is complimentary infant food provided?',
  infantFoodOptions: 'Which infant food?',
  extraBedIncluded: 'Is an extra bed included in the extra-guest rate?',
  extraBedInclusion: 'Included for',
  extraBedForAdults: 'Do you provide an extra bed for adults?',
  adultExtraBedType: 'Adult extra bed type',
  adultMattressCharge: 'Adult extra bed charge (₹ per night)',
  extraBedForKids: 'Do you provide an extra bed for children?',
  kidExtraBedType: 'Child extra bed type',
  childMattressCharge: 'Child extra bed charge (₹ per night)',
};

const SECTIONS = [
  { id: 'guest-profile', label: 'Guest Profile', fields: ['unmarriedCouples', 'below18', 'maleGroupOnly'] },
  { id: 'identity', label: 'Acceptable Identity Proofs', fields: ['identityProofs', 'sameCityIdsAllowed'] },
  { id: 'restrictions', label: 'Property Restrictions', fields: ['smokingAllowed', 'privateParties', 'wheelchairAccess', 'outsideVisitors'] },
  { id: 'pet', label: 'Pet Policy', fields: ['petLivingOnProperty', 'petsAllowed', 'petFoodAvailable', 'petTypes', 'petChargesEnabled', 'petChargeAmount', 'petChargeFrequency', 'petRestrictedAreas', 'petLeashRequired', 'maxPets'] },
  { id: 'checkin', label: 'Check-in', fields: ['has24HourPolicy'] },
  { id: 'infant', label: 'Infant Policy', fields: ['includeInfant', 'infantCountedInOccupancy', 'infantFoodProvided', 'infantFoodOptions'] },
  { id: 'extra-bed', label: 'Extra Beds', fields: ['extraBedIncluded', 'extraBedInclusion', 'extraBedForAdults', 'adultExtraBedType', 'adultMattressCharge', 'extraBedForKids', 'kidExtraBedType', 'childMattressCharge'] },
];

const yesNo = (value) => (value === true ? 'yes' : value === false ? 'no' : '');

/** Server rules -> the form (Yes/No as 'yes' | 'no' | '' for unanswered). */
export function rulesToForm(rules) {
  const form = {};
  Object.keys(LABELS).forEach((field) => {
    const value = rules?.[field];
    if (YES_NO.includes(field)) form[field] = yesNo(value);
    else if (LISTS.includes(field)) form[field] = Array.isArray(value) ? value : [];
    else form[field] = value === null || value === undefined ? '' : String(value);
  });
  if (!form.petChargeFrequency) form.petChargeFrequency = 'per-night';
  if (!form.maxPets) form.maxPets = '1';
  return form;
}

/** Shown under its Yes. */
function visible(field, form) {
  const pets = form.petsAllowed === 'yes';
  switch (field) {
    case 'petFoodAvailable': case 'petTypes': case 'petChargesEnabled': case 'petRestrictedAreas': case 'petLeashRequired': case 'maxPets':
      return pets;
    case 'petChargeAmount': case 'petChargeFrequency':
      return pets && form.petChargesEnabled === 'yes';
    case 'infantCountedInOccupancy': case 'infantFoodProvided':
      return form.includeInfant === 'yes';
    case 'infantFoodOptions':
      return form.includeInfant === 'yes' && form.infantFoodProvided === 'yes';
    case 'extraBedInclusion':
      return form.extraBedIncluded === 'yes';
    case 'adultExtraBedType': case 'adultMattressCharge':
      return form.extraBedForAdults === 'yes';
    case 'kidExtraBedType': case 'childMattressCharge':
      return form.extraBedForKids === 'yes';
    default:
      return true;
  }
}

/** Same rules as the server, so mistakes show before saving. */
export function checkRulesForm(form) {
  const errors = {};
  Object.keys(LABELS).filter((field) => visible(field, form)).forEach((field) => {
    const value = form[field];
    if (YES_NO.includes(field) && value !== 'yes' && value !== 'no') errors[field] = 'Choose Yes or No.';
    if (['identityProofs', 'petTypes', 'infantFoodOptions'].includes(field) && !value.length) errors[field] = 'Choose at least one.';
    if (['petChargeAmount', 'adultMattressCharge', 'childMattressCharge'].includes(field) && (!MONEY.test(value) || Number(value) > 100000)) errors[field] = 'Enter an amount in rupees (0 to 1,00,000).';
    if (['adultExtraBedType', 'kidExtraBedType', 'extraBedInclusion', 'petChargeFrequency'].includes(field) && !value) errors[field] = 'Choose one.';
    if (field === 'maxPets' && !(Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 10)) errors[field] = 'Enter 1 to 10.';
  });
  return errors;
}

/** The form -> the request body: only the answers that apply. */
export function formToBody(form) {
  const body = {};
  Object.keys(LABELS).filter((field) => visible(field, form)).forEach((field) => {
    const value = form[field];
    if (YES_NO.includes(field)) body[field] = value === 'yes';
    else if (LISTS.includes(field)) body[field] = value;
    else if (['petChargeAmount', 'adultMattressCharge', 'childMattressCharge', 'maxPets'].includes(field)) body[field] = Number(value);
    else body[field] = value;
  });
  return body;
}

function YesNo({ value, onChange, invalid, label }) {
  return (
    <div className="rpw-yesno" role="radiogroup" aria-label={label} aria-invalid={invalid || undefined}>
      {[['yes', 'Yes'], ['no', 'No']].map(([option, text]) => (
        <button type="button" key={option} role="radio" aria-checked={value === option} className={value === option ? 'is-selected' : ''} onClick={() => onChange(option)}>
          {value === option ? <Check size={13} aria-hidden="true" /> : null}{text}
        </button>
      ))}
    </div>
  );
}

function MultiChoice({ options, value, onChange, label }) {
  return (
    <div className="rpw-multichoice" role="group" aria-label={label}>
      {options.map(([code, text]) => {
        const checked = value.includes(code);
        return (
          <button type="button" key={code} aria-pressed={checked} className={checked ? 'is-selected' : ''} onClick={() => onChange(checked ? value.filter((item) => item !== code) : [...value, code])}>
            {checked ? <Check size={12} aria-hidden="true" /> : null}{text}
          </button>
        );
      })}
    </div>
  );
}

export default function RulesPropertyRulesTab({ form, errors, dirty, onChange, onSave, onDiscard, saving }) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState([]);
  const masters = (group) => (MASTER_LISTS[group] ?? []).filter(([code]) => code);
  const lists = useMemo(() => ({
    identityProofs: masters('identityProof'),
    petTypes: masters('petType'),
    infantFoodOptions: masters('infantFood'),
    petRestrictedAreas: PET_AREAS,
  }), [MASTER_LISTS.identityProof, MASTER_LISTS.petType, MASTER_LISTS.infantFood]); // eslint-disable-line react-hooks/exhaustive-deps

  const needle = query.trim().toLowerCase();
  const sections = SECTIONS.map((section) => {
    const fields = section.fields.filter((field) => visible(field, form));
    const done = fields.filter((field) => {
      const value = form[field];
      return Array.isArray(value) ? value.length > 0 : String(value ?? '').trim() !== '';
    }).length;
    const matching = !needle || section.label.toLowerCase().includes(needle) ? fields : fields.filter((field) => LABELS[field].toLowerCase().includes(needle));
    return { ...section, fields: matching, total: fields.length, done, hasError: fields.some((field) => errors[field]) };
  }).filter((section) => section.fields.length);

  const renderField = (field) => {
    const value = form[field];
    const error = errors[field];
    let control;
    if (YES_NO.includes(field)) control = <YesNo label={LABELS[field]} value={value} invalid={Boolean(error)} onChange={(next) => onChange(field, next)} />;
    else if (lists[field]) control = <MultiChoice label={LABELS[field]} options={lists[field]} value={value} onChange={(next) => onChange(field, next)} />;
    else if (field === 'petChargeFrequency') control = <select value={value} onChange={(event) => onChange(field, event.target.value)}>{PET_FREQUENCIES.map(([code, text]) => <option key={code} value={code}>{text}</option>)}</select>;
    else if (field === 'extraBedInclusion') control = <select value={value} aria-invalid={Boolean(error)} onChange={(event) => onChange(field, event.target.value)}><option value="">Choose</option>{EXTRA_BED_INCLUSION.map(([code, text]) => <option key={code} value={code}>{text}</option>)}</select>;
    else if (field === 'adultExtraBedType' || field === 'kidExtraBedType') control = <select value={value} aria-invalid={Boolean(error)} onChange={(event) => onChange(field, event.target.value)}><option value="">Choose a bed type</option>{masters('extraBedType').map(([code, text]) => <option key={code} value={code}>{text}</option>)}</select>;
    else if (field === 'maxPets') control = <input type="number" min="1" max="10" step="1" inputMode="numeric" value={value} aria-invalid={Boolean(error)} onChange={(event) => onChange(field, event.target.value)} />;
    else control = <input type="number" min="0" max="100000" step="0.01" inputMode="decimal" value={value} aria-invalid={Boolean(error)} onChange={(event) => onChange(field, event.target.value)} placeholder="0" />;
    return (
      <div className={`rpw-rule-field ${error ? 'has-error' : ''}`} key={field} id={`rule-${field}`}>
        <span>{LABELS[field]}</span>
        {control}
        {error ? <small className="rpw-field-error" role="alert">{error}</small> : null}
      </div>
    );
  };

  return (
    <div className="rpw-tab-panel">
      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Property Rules</h3>
            <p>Guest eligibility, identity checks, restrictions, pets, infants and extra beds.</p>
          </div>
          <label className="rpw-search">
            <Search size={15} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rules" aria-label="Search rules" />
          </label>
        </div>
      </section>

      {sections.map((section) => {
        const isCollapsed = collapsed.includes(section.id) && !section.hasError && !needle;
        return (
          <section className={`rpw-card rpw-rule-section ${section.hasError ? 'has-error' : ''}`} key={section.id}>
            <button type="button" className="rpw-rule-section-head" onClick={() => setCollapsed(isCollapsed ? collapsed.filter((id) => id !== section.id) : [...collapsed, section.id])} aria-expanded={!isCollapsed}>
              <span>{isCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}</span>
              <strong>{section.label}</strong>
              <small>{section.done}/{section.total} answered</small>
            </button>
            {isCollapsed ? null : <div className="rpw-rule-section-body">{section.fields.map(renderField)}</div>}
          </section>
        );
      })}

      {!sections.length ? <div className="rpw-empty"><Search size={22} aria-hidden="true" /><strong>No rules match “{query}”.</strong><span>Try another word.</span></div> : null}

      <div className="rpw-save-bar">
        {dirty ? <button type="button" className="rpw-btn" onClick={onDiscard} disabled={saving}>Discard changes</button> : null}
        <button type="button" className="rpw-btn is-primary" onClick={onSave} disabled={saving || !dirty}><Save size={15} aria-hidden="true" />{saving ? 'Saving…' : dirty ? 'Save property rules' : 'Saved'}</button>
      </div>
    </div>
  );
}
