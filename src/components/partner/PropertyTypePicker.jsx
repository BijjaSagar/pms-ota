// Step 1 of "Add a property": choose a category, then a property type.
// Layout: a pill switch for the two categories, then square icon tiles (icon + name only).
// Native radio inputs styled as pills/tiles -> arrow keys, Tab and screen readers work out of the box.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { PropertyIcon } from './PropertyIcons.jsx';
import { PROPERTY_CATEGORIES, PROPERTY_TYPES } from '../../lib/data/partner.js';
import '../../styles/partner.css';

const typesIn = (category) => PROPERTY_TYPES.filter(([v, , c]) => v && c === category);

export function PropertyTypePicker({ initialType = '', cancelTo, onContinue }) {
  const initialCategory = PROPERTY_TYPES.find(([v]) => v === initialType)?.[2] ?? 'stay';
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState(initialType);

  const pickCategory = (id) => {
    setCategory(id);
    // A type from the other family no longer applies.
    if (!typesIn(id).some(([v]) => v === type)) setType('');
  };

  // Not the '' placeholder entry: nothing chosen means no label.
  const chosen = type ? PROPERTY_TYPES.find(([v]) => v === type) : undefined;
  const submit = (e) => { e.preventDefault(); if (type) onContinue(type); };

  return (
    <form className="ptp" onSubmit={submit}>
      <p className="ptp-step">Step 1 of 2 · Property type</p>
      <h1 className="pp-title">What are you listing?</h1>

      <fieldset className="ptp-switch">
        <legend className="sr-only">Property category</legend>
        {PROPERTY_CATEGORIES.map(({ id, title }) => (
          <label key={id} className={`ptp-switch-opt ${category === id ? 'is-on' : ''}`}>
            <input type="radio" name="ptp-category" value={id} checked={category === id} onChange={() => pickCategory(id)} className="sr-only" />
            <PropertyIcon type={id} size={26} />
            <span>{title}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="ptp-types">
        <legend className="sr-only">{category === 'stay' ? 'Type of stay' : 'Type of home'}</legend>
        <div className="ptp-grid">
          {typesIn(category).map(([value, label]) => {
            const on = type === value;
            return (
              <label key={value} className={`ptp-tile ${on ? 'is-on' : ''}`}>
                <input type="radio" name="ptp-type" value={value} checked={on} onChange={() => setType(value)} className="sr-only" />
                <span className="ptp-tile-check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
                <span className="ptp-tile-art"><PropertyIcon type={value} size={44} /></span>
                <span className="ptp-tile-name">{label}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="ptp-bar">
        <Link to={cancelTo} className="btn btn-light">Cancel</Link>
        <button type="submit" className="btn btn-primary" disabled={!type}>
          {/* Phones show the short label (the selected tile is already highlighted) */}
          <span className="ptp-bar-label ptp-bar-label-long">{chosen ? `Continue as ${chosen[1]}` : 'Choose a type to continue'}</span>
          <span className="ptp-bar-label ptp-bar-label-short" aria-hidden="true">Continue</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
