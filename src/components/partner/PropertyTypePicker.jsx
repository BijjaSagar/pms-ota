// Step 1 of "Add a property": choose a category, then a property type (both come from the API).
// Layout: a pill switch for the categories, then square icon tiles (icon + name only).
// Native radio inputs styled as pills/tiles -> arrow keys, Tab and screen readers work out of the box.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, RefreshCw } from 'lucide-react';
import { AuthLoading } from '../auth/RequireAuth.jsx';
import { PropertyIcon } from './PropertyIcons.jsx';
import { usePropertyTypes } from '../../lib/api/propertyTypes.js';
import '../../styles/account.css';
import '../../styles/partner.css';

// onContinue(typeCode) may return a promise; `busy` blocks Continue and `error` shows above the bar.
export function PropertyTypePicker({ initialType = '', cancelTo, onContinue, busy = false, error = '' }) {
  const { categories, loading, error: loadError, reload } = usePropertyTypes();
  const [pickedCategory, setPickedCategory] = useState('');
  const [pickedType, setPickedType] = useState(initialType);
  const [sending, setSending] = useState(false);

  // Worked out from the loaded lists, so a category or type that was switched off is never left selected.
  const category = categories.find((c) => c.code === pickedCategory)
    ?? categories.find((c) => c.types.some((t) => t.code === pickedType))
    ?? categories[0];
  const chosen = category?.types.find((t) => t.code === pickedType);
  const working = busy || sending;

  const submit = async (e) => {
    e.preventDefault();
    if (!chosen || working) return;
    setSending(true);
    try {
      await onContinue(chosen.code);
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="ptp" onSubmit={submit}>
      <p className="ptp-step">Step 1 of 2 · Property type</p>
      <h1 className="pp-title">What are you listing?</h1>

      {loading && <AuthLoading label="Loading property types…" />}

      {!loading && loadError && (
        <div className="inline-error" role="alert">
          <span>{loadError}</span>
          <button type="button" className="pill-btn" onClick={reload}><RefreshCw size={13} aria-hidden="true" />Try again</button>
        </div>
      )}

      {!loading && !loadError && !category && (
        <p className="muted-sm" role="status">No property types are available right now. Please check back soon.</p>
      )}

      {category && (
        <>
          <fieldset className="ptp-switch" disabled={working}>
            <legend className="sr-only">Property category</legend>
            {categories.map(({ code, label }) => (
              <label key={code} className={`ptp-switch-opt ${category.code === code ? 'is-on' : ''}`}>
                <input type="radio" name="ptp-category" value={code} checked={category.code === code}
                  onChange={() => setPickedCategory(code)} className="sr-only" />
                <PropertyIcon type={code} size={26} />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>

          <fieldset className="ptp-types" disabled={working}>
            <legend className="sr-only">{`Type of property in ${category.label}`}</legend>
            <div className="ptp-grid">
              {category.types.map(({ code, label }) => {
                const on = chosen?.code === code;
                return (
                  <label key={code} className={`ptp-tile ${on ? 'is-on' : ''}`}>
                    <input type="radio" name="ptp-type" value={code} checked={on}
                      onChange={() => { setPickedCategory(category.code); setPickedType(code); }} className="sr-only" />
                    <span className="ptp-tile-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                    <span className="ptp-tile-art"><PropertyIcon type={code} size={44} /></span>
                    <span className="ptp-tile-name">{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
      )}

      {error && <p className="field-error" role="alert">{error}</p>}

      <div className="ptp-bar">
        <Link to={cancelTo} className="btn btn-light">Cancel</Link>
        <button type="submit" className="btn btn-primary" disabled={!chosen || working} aria-busy={working}>
          {/* Phones show the short label (the selected tile is already highlighted) */}
          <span className="ptp-bar-label ptp-bar-label-long">{working ? 'Please wait…' : chosen ? `Continue as ${chosen.label}` : 'Choose a type to continue'}</span>
          <span className="ptp-bar-label ptp-bar-label-short" aria-hidden="true">{working ? 'Please wait…' : 'Continue'}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
