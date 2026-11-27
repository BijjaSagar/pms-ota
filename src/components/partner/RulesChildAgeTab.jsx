import { Baby, Check, Save, Sparkles } from 'lucide-react';

const FREE_AGES = Array.from({ length: 13 }, (_, index) => index);
const PAID_AGES = Array.from({ length: 17 }, (_, index) => index + 1);

export default function RulesChildAgeTab({ value, onChange, onSave, onDiscard, saving, dirty }) {
  const invalid = Number(value.paidMaxAge) <= Number(value.freeMaxAge);
  const paidStart = Number(value.freeMaxAge) + 1;
  const adultStart = Number(value.paidMaxAge) + 1;

  return (
    <div className="rpw-tab-panel">
      <section className="rpw-card">
        <div className="rpw-card-head">
          <div>
            <h3>Child Age Policy</h3>
            <p>Define when children stay free, when they are charged, and when adult rates begin.</p>
          </div>
          <span className={`rpw-status ${value.childrenAllowed ? 'is-on' : ''}`}>{value.childrenAllowed ? 'Children allowed' : 'Children disabled'}</span>
        </div>

        <div className="rpw-child-toggle">
          <span><Baby size={17} aria-hidden="true" /><strong>Children are allowed at this property</strong></span>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(value.childrenAllowed)}
            aria-label="Children are allowed"
            className={`rpw-switch ${value.childrenAllowed ? 'is-on' : ''}`}
            onClick={() => onChange({ ...value, childrenAllowed: !value.childrenAllowed })}
          ><span /></button>
        </div>

        <div className={`rpw-child-grid ${value.childrenAllowed ? '' : 'is-disabled'}`}>
          <label className="rpw-field"><span>Free stay up to age</span><select disabled={!value.childrenAllowed} value={value.freeMaxAge} onChange={(event) => onChange({ ...value, freeMaxAge: Number(event.target.value) })}>{FREE_AGES.map((age) => <option key={age} value={age}>{age} {age === 1 ? 'year' : 'years'}</option>)}</select></label>
          <label className="rpw-field"><span>Paid child stay up to age</span><select disabled={!value.childrenAllowed} value={value.paidMaxAge} onChange={(event) => onChange({ ...value, paidMaxAge: Number(event.target.value) })}>{PAID_AGES.map((age) => <option key={age} value={age}>{age} {age === 1 ? 'year' : 'years'}</option>)}</select></label>
          <div className="rpw-field is-readonly"><span>Adult rates start at</span><strong>{adultStart} {adultStart === 1 ? 'year' : 'years'}</strong><small>Calculated automatically.</small></div>
        </div>

        {invalid ? <div className="rpw-inline-error" role="alert">Paid-stay age must be higher than free-stay age.</div> : null}

        <div className="rpw-age-preview">
          <div><span className="rpw-age-dot is-free" /><strong>Free stay</strong><small>0 – {value.freeMaxAge} years</small></div>
          <div><span className="rpw-age-dot is-paid" /><strong>Paid child</strong><small>{paidStart} – {value.paidMaxAge} years</small></div>
          <div><span className="rpw-age-dot is-adult" /><strong>Adult rate</strong><small>{adultStart} years and above</small></div>
        </div>

        <div className="rpw-child-note"><Sparkles size={15} aria-hidden="true" /><span>Guests see these age bands with your policies. When children are not allowed, the ages are kept for later.</span></div>
        <div className="rpw-save-bar">{dirty ? <button type="button" className="rpw-btn" onClick={onDiscard} disabled={saving}>Discard changes</button> : null}<button type="button" className="rpw-btn is-primary" onClick={onSave} disabled={saving || invalid || !dirty}><Check size={15} aria-hidden="true" />{saving ? 'Saving…' : dirty ? 'Save child age policy' : 'Saved'}</button></div>
      </section>
    </div>
  );
}
