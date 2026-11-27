import { useState } from 'react';
import { Check, ChevronDown, ChevronRight, Save, Search } from 'lucide-react';
import {
  INFANT_FOOD_OPTIONS,
  PET_CHARGE_FREQUENCIES,
  PET_TYPES,
  PROPERTY_RULE_SECTIONS,
  RESTRICTED_AREA_OPTIONS,
  YES_NO_OPTIONS,
  isRuleFieldFilled,
} from '../../lib/data/rulesPolicies.js';

const FIELD_LABELS = {
  unmarriedCouples: 'Unmarried couples',
  below18: 'Guests below 18 years',
  maleGroupOnly: 'Male-only groups',
  identityProofs: 'Acceptable identity proofs',
  sameCityIdsAccepted: 'IDs from the same city',
  smokingAllowed: 'Smoking allowed',
  privateParties: 'Private parties and events',
  wheelchairAccess: 'Wheelchair accessible',
  outsideVisitors: 'Outside visitors in rooms',
  petLivingOnProperty: 'Pets live at the property',
  petsAllowed: 'Pets accepted',
  petFoodAvailable: 'Pet food available',
  petTypes: 'Permitted pet types',
  petChargesEnabled: 'Additional pet charges',
  petChargeAmount: 'Pet charges (INR)',
  petChargeFrequency: 'Charging frequency',
  restrictedAreas: 'Restricted areas',
  leashRequired: 'Leash required',
  maxPets: 'Maximum pets allowed',
  has24HourPolicy: '24-hour check-in',
  includeInfant: 'Infants allowed',
  infantCountedInOccupancy: 'Infants counted in occupancy',
  infantFoodProvided: 'Complimentary infant food',
  infantFoodItems: 'Complimentary food items',
  extraBedIncluded: 'Extra bed included in paid rates',
  extraBedInclusionTypes: 'Rate types covered',
  extraBedForAdults: 'Extra bed for adults',
  adultExtraBedType: 'Adult extra bed type',
  adultMattressCharge: 'Adult mattress charge (INR)',
  extraBedForKids: 'Extra bed for children',
  childMattressCharge: 'Child mattress charge (INR)',
};

function YesNo({ value, onChange }) {
  return (
    <div className="rpw-yesno" role="group">
      {YES_NO_OPTIONS.map((option) => (
        <button
          type="button"
          key={option.value}
          className={value === option.value ? 'is-selected' : ''}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {value === option.value ? <Check size={13} aria-hidden="true" /> : null}
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MultiChoice({ options, value = [], onChange }) {
  return (
    <div className="rpw-multichoice">
      {options.map((option) => {
        const itemValue = typeof option === 'string' ? option : option.value;
        const label = typeof option === 'string' ? option : option.label;
        const checked = value.includes(itemValue);
        return (
          <button
            type="button"
            key={itemValue}
            className={checked ? 'is-selected' : ''}
            aria-pressed={checked}
            onClick={() => onChange(checked ? value.filter((entry) => entry !== itemValue) : [...value, itemValue])}
          >
            {checked ? <Check size={12} aria-hidden="true" /> : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function RulesPropertyRulesTab({ ruleForm, extras, options, errors, onChange, onSave, saving }) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState([]);

  const getValue = (field) => (field in extras ? extras[field] : ruleForm[field]);
  const setValue = (field, value) => onChange(field, value);

  const sections = PROPERTY_RULE_SECTIONS.map((section) => {
    const done = section.fields.filter((field) => isRuleFieldFilled(field, getValue(field))).length;
    return { ...section, done };
  }).filter((section) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return section.label.toLowerCase().includes(needle)
      || section.fields.some((field) => FIELD_LABELS[field]?.toLowerCase().includes(needle));
  });

  const renderField = (field) => {
    const value = getValue(field);
    const error = errors?.[field];
    const fieldMarkup = (() => {
      if (['petChargeAmount', 'adultMattressCharge', 'childMattressCharge'].includes(field)) {
        return <input type="number" min="0" value={value} onChange={(event) => setValue(field, event.target.value)} placeholder="0" />;
      }
      switch (field) {
        case 'identityProofs':
          return <MultiChoice options={options.identityProofs} value={value} onChange={(next) => setValue(field, next)} />;
        case 'sameCityIdsAccepted':
        case 'smokingAllowed':
        case 'privateParties':
        case 'wheelchairAccess':
        case 'outsideVisitors':
        case 'petLivingOnProperty':
        case 'petsAllowed':
        case 'petFoodAvailable':
        case 'petChargesEnabled':
        case 'leashRequired':
        case 'has24HourPolicy':
        case 'includeInfant':
        case 'infantCountedInOccupancy':
        case 'infantFoodProvided':
        case 'extraBedIncluded':
        case 'extraBedForAdults':
        case 'extraBedForKids':
          return <YesNo value={value} onChange={(next) => setValue(field, next)} />;
        case 'petTypes':
          return <MultiChoice options={PET_TYPES} value={value} onChange={(next) => setValue(field, next)} />;
        case 'restrictedAreas':
          return <MultiChoice options={RESTRICTED_AREA_OPTIONS} value={value} onChange={(next) => setValue(field, next)} />;
        case 'extraBedInclusionTypes':
          return <MultiChoice options={[{ value: 'both', label: 'Extra adult and extra paid child' }, { value: 'adult', label: 'Extra adult only' }]} value={value} onChange={(next) => setValue(field, next)} />;
        case 'petChargeFrequency':
          return <select value={value} onChange={(event) => setValue(field, event.target.value)}>{PET_CHARGE_FREQUENCIES.map((item) => <option key={item} value={item}>{item}</option>)}</select>;
        case 'adultExtraBedType':
          return <select value={value} onChange={(event) => setValue(field, event.target.value)}><option value="">Select type</option>{options.extraBedTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
        case 'maxPets':
          return <input type="number" min="0" value={value} onChange={(event) => setValue(field, event.target.value)} />;
        case 'infantFoodItems':
          return <textarea rows="3" value={value} onChange={(event) => setValue(field, event.target.value)} placeholder={`e.g. ${INFANT_FOOD_OPTIONS.join(', ')}`} />;
        default:
          return null;
      }
    })();

    if (!fieldMarkup) return null;
    return (
      <div className="rpw-rule-field" key={field}>
        <span>{FIELD_LABELS[field] ?? field}</span>
        {fieldMarkup}
        {error ? <small className="rpw-field-error" role="alert">{error}</small> : null}
      </div>
    );
  };

  const hiddenByCondition = (sectionId, field) => {
    if (sectionId === 'pet') {
      if (['petFoodAvailable', 'petTypes', 'petChargesEnabled', 'restrictedAreas', 'leashRequired', 'maxPets'].includes(field) && getValue('petsAllowed') !== 'yes') return true;
      if (['petChargeAmount', 'petChargeFrequency'].includes(field) && getValue('petChargesEnabled') !== 'yes') return true;
    }
    if (sectionId === 'infant' && ['infantCountedInOccupancy', 'infantFoodProvided', 'infantFoodItems'].includes(field) && getValue('includeInfant') !== 'yes') return true;
    if (sectionId === 'infant' && field === 'infantFoodItems' && getValue('infantFoodProvided') !== 'yes') return true;
    if (sectionId === 'extra-bed-inclusion' && field === 'extraBedInclusionTypes' && getValue('extraBedIncluded') !== 'yes') return true;
    if (sectionId === 'extra-bed') {
      if (['adultExtraBedType', 'adultMattressCharge'].includes(field) && getValue('extraBedForAdults') !== 'yes') return true;
      if (field === 'childMattressCharge' && getValue('extraBedForKids') !== 'yes') return true;
    }
    return false;
  };

  return (
    <div className="rpw-tab-panel">
      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Property Rules</h3>
            <p>Configure guest eligibility, identity checks, restrictions, pets and extra beds.</p>
          </div>
          <label className="rpw-search">
            <Search size={15} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rules" aria-label="Search rules" />
          </label>
        </div>
      </section>

      {sections.map((section) => {
        const fields = section.fields.filter((field) => !hiddenByCondition(section.id, field));
        if (query.trim() && fields.length === 0) return null;
        const isCollapsed = collapsed.includes(section.id);
        return (
          <section className="rpw-card rpw-rule-section" key={section.id}>
            <button type="button" className="rpw-rule-section-head" onClick={() => setCollapsed(isCollapsed ? collapsed.filter((id) => id !== section.id) : [...collapsed, section.id])} aria-expanded={!isCollapsed}>
              <span>{isCollapsed ? <ChevronRight size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}</span>
              <strong>{section.label}</strong>
              <small>{section.done}/{section.fields.length} rules added</small>
            </button>
            {isCollapsed ? null : (
              <div className="rpw-rule-section-body">
                {fields.map(renderField)}
              </div>
            )}
          </section>
        );
      })}

      {!sections.length ? <div className="rpw-empty"><Search size={22} aria-hidden="true" /><strong>No rules match “{query}”.</strong><span>Try a different search term.</span></div> : null}

      <div className="rpw-save-bar">
        <button type="button" className="rpw-btn is-primary" onClick={onSave} disabled={saving}><Save size={15} aria-hidden="true" />{saving ? 'Saving…' : 'Save property rules'}</button>
      </div>
    </div>
  );
}
