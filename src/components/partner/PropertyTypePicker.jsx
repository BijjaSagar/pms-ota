// Step 1 of "List New Property": pick a category (Hotels & stays / Homes & villas), then a type.
// Native radio inputs styled as cards -> arrow keys, Tab and screen readers work out of the box.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BedDouble, Building, Car, Castle, Check, DoorOpen, Gem, Hotel, House, Sailboat, Tent, TreePalm, TreePine,
  Trees, Users, Wheat,
} from 'lucide-react';
import { PROPERTY_CATEGORIES, PROPERTY_TYPES } from '../../lib/data/partner.js';
import '../../styles/partner.css';

const CATEGORY_ICONS = { stay: Hotel, home: House };
const TYPE_ICONS = {
  hotel: BedDouble, resort: TreePalm, boutique: Gem, palace: Castle, lodge: TreePine, guesthouse: DoorOpen,
  houseboat: Sailboat, motel: Car, villa: House, homestay: Users, serviced: Building, cottage: Trees, farmstay: Wheat, camp: Tent,
};

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
      <p className="muted-sm ptp-lead">Choose the option closest to your property. You can change it before you submit.</p>

      <fieldset className="ptp-cats">
        <legend className="sr-only">Property category</legend>
        {PROPERTY_CATEGORIES.map(({ id, title, text }) => {
          const Icon = CATEGORY_ICONS[id];
          return (
            <label key={id} className={`ptp-cat ${category === id ? 'is-on' : ''}`}>
              <input type="radio" name="ptp-category" value={id} checked={category === id} onChange={() => pickCategory(id)} className="sr-only" />
              <span className="ptp-cat-icon"><Icon size={26} aria-hidden="true" /></span>
              <span className="ptp-cat-body">
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
              <span className="ptp-cat-count">{typesIn(id).length} types</span>
            </label>
          );
        })}
      </fieldset>

      <fieldset className="ptp-types">
        <legend className="ptp-types-title">Pick the type of {category === 'stay' ? 'stay' : 'home'}</legend>
        <div className="ptp-grid">
          {typesIn(category).map(([value, label, , desc]) => {
            const Icon = TYPE_ICONS[value] ?? Hotel;
            const on = type === value;
            return (
              <label key={value} className={`ptp-tile ${on ? 'is-on' : ''}`}>
                <input type="radio" name="ptp-type" value={value} checked={on} onChange={() => setType(value)} className="sr-only" />
                <span className="ptp-tile-icon"><Icon size={22} aria-hidden="true" /></span>
                <span className="ptp-tile-body">
                  <strong>{label}</strong>
                  <span>{desc}</span>
                </span>
                <span className="ptp-tile-check" aria-hidden="true">{on && <Check size={14} />}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="ptp-bar">
        <Link to={cancelTo} className="btn btn-light">Cancel</Link>
        <span className="ptp-bar-pick muted-sm" aria-live="polite">{chosen ? <>Selected: <strong>{chosen[1]}</strong></> : 'No type selected yet'}</span>
        <button type="submit" className="btn btn-primary" disabled={!type}>
          {chosen ? `Continue as ${chosen[1]}` : 'Continue'}<ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
